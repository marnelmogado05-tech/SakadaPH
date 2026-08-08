# Sakada.ph — Ordering System Plan (v1)

> **Status:** Draft / proposed. Greenfield — no order, cart, or payment tables/models
> exist yet (the milestones doc's "data models stubbed now" was aspirational; nothing is
> stubbed). This plan is **web-first (Inertia)**, matching the current app. Exposing
> orders over the mobile API is deferred to the React Native track (see
> `docs/mobile-api-contract.md`).

## Decisions baked in
- **Payment:** Cash **and** PayMongo (GCash/card) supported in v1.
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
|---|---|---|
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
|---|---|---|
| `id` | id | |
| `order_id` | FK orders (cascade) | |
| `product_id` | FK products, nullable-on-delete | Keep line even if product later removed |
| `name` | string | Snapshot — product name at order time |
| `unit` | string | Snapshot |
| `unit_price` | decimal(10,2) | Snapshot — **never** trust live product price |
| `quantity` | integer | |
| `line_total` | decimal(10,2) | `unit_price * quantity` |

### `payments` (one row per PayMongo attempt; cash orders may have none)
| Column | Type | Notes |
|---|---|---|
| `id` | id | |
| `order_id` | FK orders | |
| `provider` | string | `paymongo` |
| `provider_reference` | string, nullable | Checkout session / payment intent id |
| `amount` | decimal(10,2) | |
| `status` | string | Mirrors provider (`pending`/`paid`/`failed`/`refunded`) |
| `raw_payload` | json, nullable | Last webhook payload for audit |
| timestamps | | |

### `carts` + `cart_items` (server-side, one active cart per user)
Server-side cart keeps pricing authoritative and survives device switches. Single active
store enforced: adding an item from a different store prompts "clear cart?".

### Store additions (new migration on `stores`)
- `delivery_fee` decimal(10,2) nullable — flat per-order delivery fee (null/0 = free).
- `min_order_amount` decimal(10,2) nullable — optional minimum for checkout.
- `accepts_online_payment` boolean default false — seller opt-in to PayMongo (needs payout
  setup); cash always available.

---

## 2. Order status lifecycle (`OrderStatus`)

```
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
```

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

`PaymentMethod`: `cash`, `gcash`, `card`.
`PaymentStatus`: `unpaid` (cash, not yet collected), `pending` (online, awaiting webhook),
`paid`, `failed`, `refunded`.

`payment_status` is tracked **separately** from `status` so a confirmed order can still be
unpaid (cash) and a paid order can still be in prep.

### Cash flow
1. Checkout → order created `status = pending`, `payment_status = unpaid`.
2. Seller confirms → fulfills → on handover marks **payment received** → `payment_status = paid`, `status = completed`.

### PayMongo (online) flow
1. Checkout → order created `status = pending_payment`, `payment_status = pending`.
2. Server creates a **PayMongo Checkout Session** (hosted page: GCash + card) for `total`;
   consumer is redirected / opens the URL.
3. **Webhook** (`POST /webhooks/paymongo`, signature-verified, public route excluded from
   CSRF/auth) receives `checkout_session.payment.paid` → `payment_status = paid`,
   `status = pending` (enters the seller queue). A queued job reconciles.
4. Failure/expiry webhook → `status = cancelled`, `payment_status = failed`.
5. **Refunds:** cancelling/rejecting a `paid` online order triggers a PayMongo refund →
   `payment_status = refunded`.

> Config: `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET` in `.env` + `config/services.php`.
> Wrap the SDK/HTTP calls in a `PayMongoService` so it's mockable in tests and swappable.

---

## Phase A — Data model & domain (backend, no UI)
- [ ] Enums: `OrderStatus`, `FulfillmentType`, `PaymentMethod`, `PaymentStatus` (with `label()`).
- [ ] Migrations: `orders`, `order_items`, `payments`, `carts`, `cart_items`; alter `stores`
      (`delivery_fee`, `min_order_amount`, `accepts_online_payment`).
- [ ] Models + relations: `Order hasMany OrderItem`, `Order belongsTo User/Store`,
      `Order hasMany Payment`, `Store hasMany Order`, `User hasMany Order`, `Cart`.
- [ ] Factories + seeders for orders/carts (needed for tests).
- [ ] `OrderStatusService` (transition guards) + `OrderPricingService` (subtotal, delivery
      fee, min-order, total — single source of truth).

## Phase B — Consumer cart & checkout (web / Inertia)
- [ ] Add-to-cart from store profile (`/stores/{store}`); block `out_of_stock` products.
- [ ] Single-store guard — switching stores prompts to clear cart.
- [ ] Cart page: quantities, line totals, subtotal, remove; live re-price via server.
- [ ] Checkout page: fulfillment type (limited to store's allowed types), delivery address
      + map pin (reuse the RN map-picker rationale; web uses Leaflet), payment method,
      notes; validate delivery pin within `service_radius_km`; enforce `min_order_amount`.
- [ ] Place order → cash path (confirm) or PayMongo path (redirect to hosted checkout).
- [ ] Consumer orders list + detail (`/orders`, `/orders/{order}`) with status timeline.
- [ ] Consumer cancel (while pending).

## Phase C — Seller order management (web / Inertia)
- [ ] Seller orders queue (`/seller/orders`) — filter by status; new-order badge.
- [ ] Order detail: confirm / reject (with reason) / advance status / mark cash paid /
      mark completed.
- [ ] Seller dashboard tiles: pending orders, today's orders, revenue snapshot.
- [ ] Store settings: `delivery_fee`, `min_order_amount`, `accepts_online_payment` toggle.

## Phase D — PayMongo integration
- [ ] `PayMongoService` (create checkout session, verify webhook signature, refund).
- [ ] `POST /webhooks/paymongo` route (no auth/CSRF, signature-verified) + queued
      reconciliation job.
- [ ] Config + secrets in `.env.example`, `config/services.php`.
- [ ] Refund on cancel/reject of paid orders.
- [ ] Sandbox test-mode keys documented for dev.

## Phase E — Notifications & order events
Hook into the existing queued `DatabaseNotification` + notification-bell system (same
pattern as `StockRestoredNotification`). New `data.type` values:
- [ ] `order_placed` → seller (new order in queue).
- [ ] `order_confirmed` / `order_rejected` → consumer.
- [ ] `order_ready` / `order_out_for_delivery` → consumer.
- [ ] `order_completed` → consumer.
- [ ] `order_cancelled` → the counterparty.
- [ ] All mailables/notifications `ShouldQueue` (project convention).

## Phase F — Admin visibility (web, existing admin panel)
- [ ] Admin orders list (read-only) — filter by store/status/date; spot disputes.
- [ ] Platform stats: total orders, GMV, cash vs online split on admin dashboard.
- [ ] (Deferred) dispute/refund tooling — needs more requirements.

## Phase G — Testing
- [ ] Pest feature tests: cart rules (single-store, block out_of_stock, min order),
      pricing (delivery fee, totals), checkout (both payment methods), status transitions
      (legal + illegal → 422), authorization (only owner consumer / owner seller act on an
      order), delivery-radius validation.
- [ ] PayMongo webhook tests with a mocked `PayMongoService` (paid / failed / refund).
- [ ] Price-snapshot test: changing a product's price after order does not alter the order.
- [ ] Maintain parity with the current green suite (133 tests).

---

## Cross-cutting concerns
- **Route placement:** consumer order routes under the existing `auth + verified` group;
  seller order routes under `role:seller + seller.approved`; admin under `role:admin`;
  the PayMongo webhook is a standalone public route.
- **Money:** store as `decimal`, compute server-side only, never trust client totals.
- **Concurrency:** since stock isn't decremented, no reservation races; the main race is
  double-submit on checkout — guard with an idempotency check on the active cart.
- **Snapshots:** order items copy name/unit/price at purchase time so later product edits
  or deletions don't rewrite history.

## Explicitly out of scope for v1
- Multi-store cart / split orders.
- Automatic stock decrement / reservations.
- Delivery driver assignment / live tracking.
- Ratings & reviews (natural follow-up once orders complete).
- Seller payout/settlement automation beyond PayMongo's own dashboard.

## Resolved decisions
1. **Delivery fee — flat per store.** A single `delivery_fee` on the store, charged for any
   delivery within `service_radius_km`. Distance-based tiers are deferred; revisit only if
   sellers request it.
2. **Online payment is pay-first; cash is pay-on-handover.** Online (GCash/card) orders must
   be `paid` (webhook-confirmed) before they enter the seller queue — this keeps unpaid
   online orders out of the queue and guarantees captured funds before prep. Cash orders
   enter the queue immediately and are collected on handover. "Reserve now, pay online
   later" is **rejected** (queue clutter + no captured funds, no upside).
3. **Cancel-and-reorder only — no post-placement editing.** Consumers cancel while
   `pending` / `pending_payment` and reorder; sellers reject with a reason. This avoids
   re-pricing and partial-refund/top-up complexity on already-captured online payments.
