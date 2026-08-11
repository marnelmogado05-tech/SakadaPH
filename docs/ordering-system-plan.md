# Sakada.ph — Ordering System Plan (v1)

> **Status & roadmap** (web-first / Inertia; mobile API deferred to the React Native track,
> see `docs/mobile-api-contract.md`). Online payment is the final phase and, because there is
> **no registered business to pass a payment aggregator's KYC** (PayMongo/Xendit/Maya all
> require it), it ships as **manual GCash** rather than an automated gateway — see Phase H.
>
> - ✅ **Phase A** — Data model & domain
> - ✅ **Phase B** — Consumer cart & checkout (cash)
> - ✅ **Phase C** — Seller order management
> - ✅ **Phase D** — Reviews & ratings
> - ✅ **Phase E** — Notifications & order events
> - ✅ **Phase F** — Admin visibility
> - 🔄 **Phase G** — Testing (continuous, per phase)
> - ✅ **Phase H** — Manual GCash payments *(final phase)*

## Decisions baked in

- **Payment:** Cash **and** manual GCash (pay-then-submit-reference) in v1. An automated
  aggregator (PayMongo/Xendit) is out of reach without a registered business — see Phase H.
- **Cart:** Single-store cart — one order belongs to exactly one store.
- **Stock:** Sellers keep managing `availability` manually. Orders do **not** decrement
  `quantity`. Ordering an `out_of_stock` product is blocked at checkout.
- **Who can order:** authenticated consumers (`role: user`, verified) only. Discovery
  stays public; ordering requires login — consistent with the existing engagement rule.
- **Fulfillment:** constrained by the store's `type` (`pickup` / `delivery` / `both`) and
  `service_radius_km`.

---

## 1. Data model

### `orders`

| Column | Type | Notes |
|------|----| |
| `id` | id | |
| `reference` | string, unique | Human-friendly (e.g. `SKD-8F3K2P`), shown to both parties |
| `user_id` | FK users | The consumer |
| `store_id` | FK stores | Single store per order |
| `status` | enum `OrderStatus` | Fulfillment lifecycle (see §2) |
| `fulfillment_type` | enum `FulfillmentType` | `pickup` / `delivery`; must be allowed by store type |
| `payment_method` | enum `PaymentMethod` | `cash` / `gcash` / `card` |
| `payment_status` | enum `PaymentStatus` | Independent of `status` (see §3) |
| `subtotal` | decimal(10,2) | Sum of item lines |
| `delivery_fee` | decimal(10,2) | 0 for pickup; store flat fee otherwise |
| `total` | decimal(10,2) | `subtotal + delivery_fee` |
| `delivery_address` | text, nullable | Required when `fulfillment_type = delivery` |
| `delivery_latitude` / `delivery_longitude` | decimal, nullable | For delivery; validated against `service_radius_km` |
| `contact_number` | string | Snapshot of consumer contact for this order |
| `notes` | text, nullable | Consumer instructions |
| `cancellation_reason` | text, nullable | Set on cancel/reject |
| `confirmed_at` / `completed_at` / `cancelled_at` | timestamp, nullable | Lifecycle stamps |
| timestamps | | |

### `order_items` (price/name snapshotted at purchase time)

| Column | Type | Notes |
|------|----| |
| `id` | id | |
| `order_id` | FK orders (cascade) | |
| `product_id` | FK products, nullable-on-delete | Keep line even if product later removed |
| `name` | string | Snapshot — product name at order time |
| `unit` | string | Snapshot |
| `unit_price` | decimal(10,2) | Snapshot — **never** trust live product price |
| `quantity` | integer | |
| `line_total` | decimal(10,2) | `unit_price * quantity` |

### `payments` (one row per GCash order; cash orders have none)

| Column | Type | Notes |
|------|----| |
| `id` | id | |
| `order_id` | FK orders | |
| `provider` | string | `gcash_manual` (or an aggregator name later) |
| `provider_reference` | string, nullable | The consumer-submitted GCash reference number |
| `amount` | decimal(10,2) | |
| `status` | string | `pending` / `paid` (`failed`/`refunded` reserved for a gateway) |
| `raw_payload` | json, nullable | Reserved for a future gateway's webhook payload |
| timestamps | | |

### `carts` + `cart_items` (server-side, one active cart per user)

Server-side cart keeps pricing authoritative and survives device switches. Single active
store enforced: adding an item from a different store prompts "clear cart?".

### Store additions (new migration on `stores`)

- `delivery_fee` decimal(10,2) nullable — flat per-order delivery fee (null/0 = free).
- `min_order_amount` decimal(10,2) nullable — optional minimum for checkout.
- `accepts_online_payment` boolean default false — seller opt-in to manual GCash (requires a
  `gcash_number`); cash always available.
- `gcash_number` string nullable + `gcash_qr_path` string nullable — the seller's GCash
  destination shown to consumers (added in Phase H).

---

## 2. Order status lifecycle (`OrderStatus`)

pending_payment ──(online paid)──► pending ──(seller confirms)──► confirmed
                                      │                              │
                                      │                              ▼
                                      │                          preparing
                                      │                              │
                    ┌─────────────────┼──────────────┐               ▼
                    ▼                 ▼               ▼         ready_for_pickup
                cancelled         rejected       (out_for_delivery)
                                                       │               │
                                                       └───────┬───────┘
                                                               ▼
                                                           completed

`OrderStatus` cases: `pending_payment`, `pending`, `confirmed`, `preparing`,
`ready_for_pickup`, `out_for_delivery`, `completed`, `cancelled`, `rejected`.

Transition rules (enforced in a small `OrderStatusService`, not scattered in controllers):

- **Consumer** may cancel only while `pending_payment` / `pending`.
- **Seller** may `confirm`, `reject` (from pending), advance through prep → ready/delivery →
  `completed`. `ready_for_pickup` used when `fulfillment_type = pickup`;
  `out_for_delivery` when `delivery`.
- Illegal transitions → `422`.

---

## 3. Payment (`PaymentMethod`, `PaymentStatus`)

`PaymentMethod`: `cash`, `gcash`, `card`. *(v1 offers `cash` + `gcash`; `card` is defined
but unused — it needs an aggregator.)*
`PaymentStatus`: `unpaid` (cash, not yet collected), `pending` (GCash, awaiting the consumer's
reference and the seller's confirmation), `paid`, `failed`, `refunded` (`failed`/`refunded`
are reserved for a future automated gateway).

`payment_status` is tracked **separately** from `status` so a confirmed order can still be
unpaid (cash) and a paid order can still be in prep.

### Cash flow

1. Checkout → order created `status = pending`, `payment_status = unpaid`.
2. Seller confirms → fulfills → on handover marks **payment received** → `payment_status = paid`, `status = completed`.

### GCash (manual, online) flow — see Phase H

1. Checkout with GCash → order created `status = pending`, `payment_status = pending`, and a
   `gcash_manual` row is opened in `payments`.
2. Consumer pays the seller's GCash number/QR in their own app, then submits the **reference
   number** on the order (`POST /orders/{order}/gcash-reference`).
3. Seller checks their GCash app and clicks **"Confirm GCash payment received"** →
   `payment_status = paid`.
4. A GCash order **cannot be completed** until `payment_status = paid`.

> No aggregator account, API keys, or webhooks — payment is confirmed manually by the seller.
> `failed`/`refunded` and an automated gateway (`PaymongoService` + webhook) remain a future
> option if a registered business becomes available.

---

## ✅ Phase A — Data model & domain (backend, no UI) — **COMPLETED**

- [x] Enums: `OrderStatus`, `FulfillmentType`, `PaymentMethod`, `PaymentStatus` (with `label()`).
- [x] Migrations: `orders`, `order_items`, `payments`, `carts`, `cart_items`; alter `stores`
      (`delivery_fee`, `min_order_amount`, `accepts_online_payment`).
- [x] Models + relations: `Order hasMany OrderItem`, `Order belongsTo User/Store`,
      `Order hasMany Payment`, `Store hasMany Order`, `User hasMany Order`, `Cart`.
- [x] Factories + seeders for orders/carts (needed for tests).
- [x] `OrderStatusService` (transition guards) + `OrderPricingService` (subtotal, delivery
      fee, min-order, total — single source of truth).

## ✅ Phase B — Consumer cart & checkout (web / Inertia) — **COMPLETED**

- [x] Add-to-cart from store profile (`/stores/{store}`); block `out_of_stock` products.
- [x] Single-store guard — switching stores prompts to clear cart.
- [x] Cart page: quantities, line totals, subtotal, remove; live re-price via server.
- [x] Checkout page: fulfillment type (limited to store's allowed types), delivery address
      + map pin (reuse the RN map-picker rationale; web uses Leaflet), payment method,
      notes; validate delivery pin within `service_radius_km`; enforce `min_order_amount`.
- [x] Place order → **cash path** (pay on handover). *(GCash path is the final phase — see
      Phase H.)*
- [x] Consumer orders list + detail (`/orders`, `/orders/{order}`) with status timeline.
- [x] Consumer cancel (while pending).

## ✅ Phase C — Seller order management (web / Inertia) — **COMPLETED**

- [x] Seller orders queue (`/seller/orders`) — filter by status; new-order badge.
- [x] Order detail: confirm / reject (with reason) / advance status / mark cash paid /
      mark completed.
- [x] Seller dashboard tiles: pending orders, today's orders, revenue snapshot.
- [x] Store settings: `delivery_fee`, `min_order_amount`, `accepts_online_payment` toggle.

## ✅ Phase D — Reviews & ratings (web / Inertia) — **COMPLETED**

Consumer-to-supplier feedback (1–5 stars + optional comment) tied to a **completed**
order. One review per order; a store's public rating is the average of its reviews.

### `reviews`

| Column | Type | Notes |
|------|----| |
| `id` | id | |
| `order_id` | FK orders (cascade), **unique** | One review per order |
| `user_id` | FK users (cascade) | Author (the consumer) |
| `store_id` | FK stores (cascade) | Supplier being reviewed (denormalized for cheap aggregates) |
| `rating` | unsignedTinyInteger | 1–5, validated `between:1,5` |
| `comment` | text, nullable | Optional free text (max 1000) |
| timestamps | | Indexed `(store_id, created_at)` for the profile list |

### Behavior

- [x] **Who / when:** only the order's owner, and only once `OrderStatus::Completed`. Enforced
  in `ReviewController@store` (`abort_unless` owner `403`; non-completed → validation error).
- [x] **One per order:** `updateOrCreate` keyed by `order_id` — resubmitting edits the existing
  review rather than duplicating. Route: `POST /orders/{order}/review` (`orders.review`).
- [x] **Relations:** `Order hasOne Review`, `Store hasMany Review`, `User hasMany Review`.
- [x] **Aggregates:** store list/profile use `withCount('reviews')` + `withAvg('reviews','rating')`;
  the profile also lists recent reviews (reviewer shown as "First L." for privacy).
- [x] **Surfaced in:** consumer order detail (rate/edit card once completed), public store profile
  (avg stars + count + review list), seller dashboard (rating tile) and seller order detail
  (read-only review). Reusable `StarRating` React component (display + interactive modes).
- [ ] **Deferred:** seller replies to reviews; review moderation/reporting; verified-purchase
  badges beyond the implicit completed-order gate.

## ✅ Phase E — Notifications & order events — **COMPLETED**

Hooks into the existing queued `DatabaseNotification` + notification-bell system (same
pattern as `StockRestoredNotification`). Three notification classes, all `ShouldQueue`,
via `['database', 'mail']`; each `data` payload carries a role-correct `url` deep-link to
the order plus `order_reference`. New `data.type` values:

- [x] `order_placed` → seller (new order) — `OrderPlacedNotification`.
- [x] `order_confirmed` / `order_rejected` → consumer — `OrderStatusUpdatedNotification`
      (type + copy derived from the order's status; rejection includes the reason).
- [x] `order_ready` / `order_out_for_delivery` → consumer (on the seller's fulfillment
      advance; the internal `preparing` step is intentionally silent).
- [x] `order_completed` → consumer.
- [x] `order_cancelled` → the seller (consumer-initiated cancel).
- [x] All notifications `ShouldQueue` (project convention).
- [x] Notifications page renders order-type icons + a "View order" deep-link.
- [ ] *Follow-up:* sellers currently receive these via email + the sidebar pending-order
      badge; an in-app notification bell in the seller UI (the page is consumer-scoped
      today) is a small, separate enhancement.

## ✅ Phase F — Admin visibility (web, existing admin panel) — **COMPLETED**

- [x] Admin orders list (read-only) — `/admin/orders`, filter by status, date range, and
      search (reference / store name / customer); paginated. `Admin/OrderController@index`.
- [x] Read-only order detail (`/admin/orders/{order}`) — store, customer (incl. email),
      items, totals, payment, lifecycle stamps, and the customer review if any — for
      spotting disputes. No mutating actions.
- [x] Platform stats on the admin dashboard: total orders, completed, GMV (sum of paid
      order totals), and the cash-vs-online payment mix.
- [x] Admin sidebar gains an **Orders** nav entry.
- [ ] (Deferred) dispute/refund tooling — needs more requirements. Automated refunds aren't
      possible without an aggregator; GCash refunds are handled seller-to-consumer off-platform.

## 🔄 Phase G — Testing (continuous, per phase)

- [x] Pest feature tests: cart rules (single-store, block out_of_stock, min order),
      pricing (delivery fee, totals), cash checkout, status transitions
      (legal + illegal → 422), authorization (only owner consumer / owner seller act on an
      order), delivery-radius validation.
- [x] Price-snapshot test: changing a product's price after order does not alter the order.
- [x] Reviews tests (completed-only, owner-only, one-per-order, rating validation, aggregates).
- [x] Manual GCash tests: store settings + validation, conditional checkout offer, placement +
      payment row, reference submission, seller confirmation, complete-before-paid guard.
- [x] Suite green and growing per phase (194 tests as of Phase D; up from the 133 baseline).

## ✅ Phase H — Manual GCash payments (FINAL PHASE) — **COMPLETED**

> **Why manual, not PayMongo:** automated GCash requires a merchant/aggregator account
> (PayMongo/Xendit/Maya), and every one of them requires a **registered business + KYC**,
> which isn't available here. So online payment ships as **manual, per-seller GCash**:
> money goes directly to each seller's own GCash; the platform never holds funds. It reuses
> the `payments` table, `PaymentMethod::GCash`, and `PaymentStatus` (pending → paid) already
> in place, and needs **no API keys, secrets, webhooks, or tunnels**. An automated gateway
> can be layered on later if a business entity is registered.

**Flow (pay-first, seller-verified):**
1. Seller saves a **GCash number** (+ optional **QR** image) in store settings; the
   `accepts_online_payment` toggle requires a number (validated).
2. Consumer picks **GCash** at checkout (offered only when the store enabled it). Order is
   created `payment_method = gcash`, `payment_status = pending`, and a `gcash_manual`
   `payments` row is opened.
3. Consumer sees the store's GCash number/QR on the order, pays in their own app, and
   **submits the reference number** (`POST /orders/{order}/gcash-reference`).
4. Seller sees the reference on the order and clicks **"Confirm GCash payment received"**
   → `payment_status = paid` (and the payment row flips to `paid`).

- [x] Stores migration: `gcash_number`, `gcash_qr_path`; QR upload handled like product images.
- [x] Store settings UI + validation (number required when online enabled; QR optional).
- [x] Checkout offers GCash conditionally; `OrderPlacementService` guards it and opens the payment row.
- [x] Consumer submit-reference endpoint + order-detail "Pay with GCash" card (number/QR + reference form).
- [x] Seller confirms via the existing **mark-paid** action (extended to GCash); reference shown on the order.
- [x] Integrity guard: a GCash order **cannot be completed until payment is confirmed**.
- [x] GCash reference surfaced on the admin order detail for dispute-spotting.
- [x] Feature tests: settings + validation, conditional checkout offer, placement + payment row,
      reference submit (+ auth/guard cases), seller confirmation, and the complete-before-paid block.
- [ ] *Deferred:* automated verification / refunds — only possible with a real aggregator account.

---

## Cross-cutting concerns

- **Route placement:** consumer order routes under the existing `auth + verified` group;
  seller order routes under `role:seller + seller.approved`; admin under `role:admin`.
  (A payment webhook would be a standalone public route — not needed for manual GCash.)
- **Money:** store as `decimal`, compute server-side only, never trust client totals.
- **Concurrency:** since stock isn't decremented, no reservation races; the main race is
  double-submit on checkout — guard with an idempotency check on the active cart.
- **Snapshots:** order items copy name/unit/price at purchase time so later product edits
  or deletions don't rewrite history.

## Explicitly out of scope for v1

- Multi-store cart / split orders.
- Automatic stock decrement / reservations.
- Delivery driver assignment / live tracking.
- Seller payout/settlement automation — with manual per-seller GCash, money goes straight to
  each seller; the platform never holds or forwards funds.
- Automated payment verification / refunds — needs a registered business + aggregator account.

> **Note:** Ratings & reviews were originally deferred but are now **implemented** — see
> Phase D above.

## Resolved decisions

1. **Delivery fee — flat per store.** A single `delivery_fee` on the store, charged for any
   delivery within `service_radius_km`. Distance-based tiers are deferred; revisit only if
   sellers request it.
2. **GCash is pay-first (seller-verified); cash is pay-on-handover.** A GCash order enters the
   queue as `payment_status = pending`; the consumer submits a reference and the seller
   confirms receipt before completing (a GCash order **cannot be completed while unpaid**).
   Cash orders enter the queue immediately and are collected on handover. *(Originally this
   assumed an automated webhook confirmation; with no aggregator, the seller confirms
   manually instead — same pay-first intent.)*
3. **Cancel-and-reorder only — no post-placement editing.** Consumers cancel while
   `pending` / `pending_payment` and reorder; sellers reject with a reason. This avoids
   re-pricing and partial-refund/top-up complexity on already-captured online payments.
