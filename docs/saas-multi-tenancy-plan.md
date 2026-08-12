# Sakada.ph — SaaS Multi-Tenancy Plan (draft)

> **Status:** draft / proposed, not yet implemented. Written to capture the shape of the
> smallest change that would let a single seller run an isolated, branded ordering site on
> top of the existing codebase — without touching the current marketplace. Treat this as a
> reference for a future decision, not a committed roadmap. See `docs/ordering-system-plan.md`
> for the ordering engine this plan reuses.

## Why this is a bigger shift than it looks

Today Sakada.ph is a **single shared marketplace**: one admin approves sellers into one
storefront, consumers browse across all stores, and `store_id` is just a foreign key, not a
tenant boundary. A "SaaS for sellers" product means each approved seller gets their **own**
isolated ordering site (their branding, their customers landing directly on their storefront,
no visibility into or from other sellers) that they pay a subscription for. That's a real
multi-tenancy concern, not just "more sellers."

The good news: because a `Store` already `belongsTo` exactly one `User` and every ordering
table (`orders`, `order_items`, `payments`, `carts`, `products`, `reviews`) already hangs off
`store_id`, **the tenant boundary already exists in the schema**. The work is mostly about
(a) resolving *which* tenant a request belongs to, (b) proving no query can ever cross that
boundary, and (c) giving that tenant a storefront that doesn't look like a marketplace.

## Decisions baked into this sketch

- **Tenancy model: shared database, shared schema, row-level scoping by `store_id`.** Not a
  database-per-tenant or schema-per-tenant setup (e.g. `stancl/tenancy`). Cheapest option,
  reuses the existing ordering system almost unchanged, and matches Laravel Boost's "don't
  change dependencies without approval" — this needs no new package.
- **Tenant = `Store`, not `User`.** v1 stays one-store-per-seller (current constraint), so the
  store already *is* the tenant. Multi-store-per-seller is explicitly deferred (see below).
- **Path-based tenant routing for the minimal slice** (`sakada.ph/s/{store:slug}`), not
  subdomains or custom domains. Subdomains need wildcard DNS + wildcard TLS; custom domains
  need per-tenant cert provisioning. Both are real SaaS features but not needed to *prove* the
  model.
- **The existing marketplace is untouched.** `/stores`, `/stores/{store}`, cross-store
  discovery, following, reviews-on-profile — all keep working exactly as they do now. The
  tenant storefront is an additive route group, not a replacement.
- **No billing in this slice.** A store gets a manual `is_saas_enabled` flag (admin-toggled,
  like seller approval already is) instead of a subscription check. Billing is a separate
  future phase once the isolation model is proven.

---

## 1. Data model additions

### `stores` (alter)

| Column | Type | Notes |
|---|---|---|
| `slug` | string, unique | URL-safe tenant identifier, e.g. `juans-water`. Generated from `name` on approval, editable by the seller once. |
| `is_saas_enabled` | boolean, default `false` | Admin-toggled opt-in, mirrors how `accepts_online_payment` already gates a feature per store. Minimal stand-in for "has an active subscription." |
| `storefront_headline` | string, nullable | Small branding hook for the tenant home page (beyond the existing `logo_path`). |

No new tables needed for the minimal slice — this is the whole point of reusing `store_id` as
the tenant key instead of inventing a parallel `tenants` table.

---

## 2. Tenant resolution

New middleware, `App\Http\Middleware\ResolveTenantStore`, applied only to the new tenant route
group:

- Resolves `Store` from the `{store:slug}` route parameter (route-model binding via `slug`,
  not `id` — don't leak sequential IDs into tenant URLs).
- 404s if the store isn't `approved` (reuse `SellerStatus::Approved`) or `is_saas_enabled` is
  `false` — same shape as `EnsureSellerApproved`, just from the visitor's side.
- Binds the resolved store into the container (`app()->instance('tenant.store', $store)`) and
  shares it as an Inertia prop, the same way `HandleInertiaRequests` already shares `auth`.
- Does **not** change authentication — consumers keep one global account across every tenant
  storefront and the marketplace, consistent with how logins already work today. (Whether a
  future version scopes customers per-tenant, like some e-commerce SaaS platforms do, is an
  open question below, not a decision made here.)

## 3. Isolation: the part that actually matters

Row-level tenancy is only as safe as the least-scoped query in the app. The minimal slice's
real deliverable is proving isolation, not the storefront UI:

- Add a `BelongsToStore` trait (or a documented convention) for every model that must never
  leak across tenants: `Product`, `Order`, `OrderItem`, `Payment`, `Cart`, `CartItem`,
  `Review`. Each controller action reachable from a tenant route must scope through the
  resolved tenant store (`$store->products()->findOrFail(...)`), never through a bare
  `Product::findOrFail($id)`.
- Audit existing seller controllers (`app/Http/Controllers/Seller/*`) — they already scope by
  the acting seller's own store via `$request->user()->store`, which is the right pattern to
  carry into the tenant-facing controllers.
- Add a **regression test suite whose only job is trying to break isolation**: seller A's
  session hitting seller B's tenant route for a product/order/cart mutation should always
  `403`/`404`, never succeed. This is the test suite that has to stay green forever, not just
  pass once.
- Reuse `OrderPricingService` / `OrderStatusService` from the ordering system unchanged — they
  already operate on a single store's data and don't need tenant-awareness added.

## 4. Minimal tenant storefront (UI)

- New route group: `Route::prefix('s/{store:slug}')->middleware('tenant')->group(...)`.
- New layout, `tenant-storefront-layout.tsx`, styled like the existing public store profile
  page but without marketplace chrome (no "browse other stores," no distance/map search).
- Reuse existing components as-is: product listing/cards, cart, checkout, order
  tracking — these are already store-scoped, so they mostly just need to render inside the new
  layout instead of the marketplace one.
- Tenant home page = current `stores/show.tsx` content minus discovery-oriented pieces
  (distance badge, "other nearby stores") plus the new `storefront_headline`.

## 5. Admin controls

- Extend the existing seller-approval admin screen with the `is_saas_enabled` toggle (same
  pattern as approve/reject/suspend already there) rather than building new admin surface.
- Store settings gains the `slug` field (validated unique, regenerable) alongside the fields
  sellers already manage.

---

## Cross-cutting concerns

- **No new dependencies.** Everything above is Laravel route-model-binding, a middleware, a
  trait, and route/layout additions — consistent with "don't change dependencies without
  approval." `stancl/tenancy`, Cashier, or a queueing/subdomain setup would each need their own
  approval + doc when the SaaS scope actually grows to need them.
- **Money/stock/notifications logic is unchanged.** The ordering engine (`docs/ordering-system-plan.md`)
  already treats every order/cart/payment as belonging to one store; tenancy is a routing +
  isolation concern layered on top, not a rewrite of that system.
- **Marketplace and SaaS storefront can coexist per store.** `is_saas_enabled = true` doesn't
  remove a store from `/stores` discovery in this slice — that's a deliberate simplification to
  avoid a second decision (opt-out of marketplace) inside the minimal slice.

## Explicitly out of scope for the minimal slice

- Billing/subscriptions (Cashier, plans, trial periods, usage limits).
- Subdomains (`{store}.sakada.ph`) or custom domains — path-based only for now.
- Per-tenant theming beyond existing logo + a headline string.
- Multi-store-per-seller (one seller owning several tenant storefronts).
- Per-tenant customer accounts (customers stay global across all tenants, same as today).
- Tenant-level data export/deletion tooling (GDPR-style), API access, or white-label email
  sending domains.
- Database- or schema-per-tenant isolation — row-level scoping only.

## Open decisions (need a real answer before building, not guessed here)

1. **Routing scheme long-term:** stay path-based (`/s/{slug}`) or invest in wildcard subdomains
   once there's a paying customer asking for it? Subdomains read more "SaaS," but need infra
   work (DNS, wildcard TLS) this plan intentionally avoids.
2. **Pricing model:** flat subscription per store, commission-based (keeps the current
   marketplace economics), or usage-tiered (order volume)? This determines whether Cashier's
   subscription model or a simpler flat-flag gate (like `is_saas_enabled` here) is the right
   long-term mechanism.
3. **Does a store pick marketplace *or* SaaS mode, or both simultaneously forever?** This
   slice assumes "both," which is the cheapest to build but may not match how the business
   actually wants to position the SaaS offering (e.g., "get your own site AND stop appearing
   in the shared marketplace" might be the actual sales pitch).
