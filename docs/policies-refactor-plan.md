# Sakada.ph — Authorization Policies Refactor Plan (draft)

> **Status:** draft / proposed, not yet implemented. This is a planning doc only — no code
> has changed. Written in response to a review finding: ownership checks are hand-repeated
> as `abort_unless($resource->store_id === $store->id, 403)` (or the `user_id` equivalent)
> across **13 call sites in 7 controllers**, with zero centralization. Every Form Request's
> `authorize()` also just returns `true`, so authorization is *entirely* dependent on someone
> remembering to paste the right inline check into every new controller action. One missed
> line on a future endpoint is an IDOR. This plan replaces those inline checks with Laravel
> Policies, milestone by milestone.

## Current inventory (what this plan replaces)

| Controller | Ownership check | Call sites |
|---|---|---|
| `Seller/ProductController.php` | `$product->store_id === $store->id` | `edit`, `update`, `updateAvailability`, `destroy` (4) |
| `Consumer/OrderController.php` | `$order->user_id === $user->id` | `show`, `cancel`, `submitGcashReference` (3) |
| `Seller/OrderController.php` | `$order->store_id === $store->id` (via private `authorizeOrder()`) | `show`, `confirm`, `reject`, `advance`, `markPaid` (1 helper, 5 call sites) |
| `Consumer/ReviewController.php` | `$order->user_id === $user->id` | `store` (1) |
| `Consumer/CartController.php` | `$cartItem->cart_id === $cart->id` (via private `authorizeItem()`) | `update`, `destroy` (1 helper, 2 call sites) |
| `StoreFollowController.php` | `$user->role === UserRole::User` (+ `$store->isApproved()`) | `follow` (1) |
| `Public/StoreController.php` | `$store->isApproved()` | `show` (1) — **visibility gate, not ownership; see "Explicitly out of scope"** |

`Admin/*` controllers have no ownership checks and need none — the whole `/admin` prefix is
already gated by `role:admin` middleware and admins can act on any store's data by design.

## Decisions baked in

- **Policies own "who", controllers keep "what state."** A policy method answers *does this
  user own/manage this resource* — nothing about order status, payment status, or other
  business-state rules. Those stay exactly where they are today (`ValidationException` thrown
  inline in the controller/service). This keeps the diff mechanical and low-risk: swap the
  ownership check, touch nothing else.
- **Coarse-grained abilities over one-per-controller-method.** `OrderPolicy` gets two methods
  (`view` for the owning consumer, `manage` for the owning seller), not five. The underlying
  authorization boundary really is just "do you own this record in the relevant role" — finer
  business rules don't belong in the policy layer.
- **Auto-discovery, no manual registration.** This app has no `AuthServiceProvider` (removed
  in the modern Laravel skeleton) and doesn't need one — `php artisan make:policy {Model}Policy
  --model={Model}` under `app/Policies/` is auto-discovered by Laravel's default
  `Model → {Model}Policy` naming convention.
- **`$this->authorize()` in controllers, not `Gate::allows()` scattered inline.** Matches how
  the rest of the codebase already prefers explicit, readable controller code over indirection.
- **No `ReviewPolicy`.** The only review-related check (`ReviewController::store`) is really an
  *order*-ownership check — a review doesn't exist yet at creation time, and there's no
  review-edit/delete route. It reuses `OrderPolicy::view`.

---

## Milestone 1 — Scaffold the pattern with `ProductPolicy`

Smallest, self-contained model. The goal here isn't just shipping the policy — it's proving
the pattern (scaffolding, testing style, `authorize()` call shape) before rolling it out
everywhere else in Milestones 2–4.

- [ ] `php artisan make:policy ProductPolicy --model=Product`
- [ ] `update(User $user, Product $product): bool` — `$product->store_id === $user->store?->id`.
      Reused for `edit`, `update`, and `updateAvailability` (all three are "can modify this
      product," not meaningfully distinct abilities).
- [ ] `delete(User $user, Product $product): bool` — same check as `update`. (Kept as a
      separate method rather than reusing `update` for `destroy` — matches Laravel's
      conventional policy method names and keeps `@can('delete', $product)` readable if a
      delete button is ever added to the Inertia page.)
- [ ] Replace all 4 inline `abort_unless(...)` calls in `Seller/ProductController.php` with
      `$this->authorize('update', $product)` / `$this->authorize('delete', $product)`.
- [ ] Feature tests: a seller cannot edit/update/toggle-availability/delete another seller's
      product (`403`), and can do all four on their own. Existing `Seller/StoreUpdateTest.php`-
      style tests are the reference pattern.

## Milestone 2 — `OrderPolicy` (the biggest and most sensitive one)

Order is the highest-value target: it's money- and PII-bearing, and has the most call sites
(8, across 3 controllers). Two distinct ownership relationships exist on the same model, so
this policy needs two abilities, not one.

- [ ] `php artisan make:policy OrderPolicy --model=Order`
- [ ] `view(User $user, Order $order): bool` — `$order->user_id === $user->id`. Replaces the
      checks in `Consumer/OrderController::show/cancel/submitGcashReference` **and**
      `Consumer/ReviewController::store`.
- [ ] `manage(User $user, Order $order): bool` — `$order->store_id === $user->store?->id`.
      Replaces `Seller/OrderController`'s private `authorizeOrder()` helper and its 5 call
      sites (`show`, `confirm`, `reject`, `advance`, `markPaid`).
- [ ] Delete the now-redundant private `authorizeOrder()` / `store()` helpers in
      `Seller/OrderController.php` once every call site goes through `$this->authorize('manage', $order)`.
- [ ] Feature tests: mirror the existing "forbids sellers from the consumer dashboard"-style
      tests in `tests/Feature/RoleMiddlewareTest.php` — a consumer cannot view/cancel/review
      another consumer's order, and a seller cannot manage another store's order, for every
      one of the 8 call sites above.

## Milestone 3 — `CartItemPolicy`

Smallest remaining model, plus one drive-by correctness fix worth bundling in since it's the
same code being touched.

- [ ] `php artisan make:policy CartItemPolicy --model=CartItem`
- [ ] `update(User $user, CartItem $cartItem): bool` — `$cartItem->cart->user_id === $user->id`.
      Reused for both `update` and `destroy` in `Consumer/CartController.php`.
- [ ] **Drive-by fix:** today's `authorizeItem()` helper calls `cartFor($user)`, which does
      `Cart::firstOrCreate(['user_id' => $user->id])` — meaning an authorization check has the
      side effect of creating an empty cart row if the user didn't have one. The policy version
      above checks straight off `$cartItem->cart->user_id`, so this side effect goes away as
      part of the refactor, not as a separate change.
- [ ] Feature tests: a consumer cannot update/remove another consumer's cart item (`403`).

## Milestone 4 — `StorePolicy` (narrow scope) + document what's staying inline

- [ ] `php artisan make:policy StorePolicy --model=Store`
- [ ] `follow(User $user, Store $store): bool` — `$user->role === UserRole::User &&
      $store->isApproved()`. Replaces the two inline checks in `StoreFollowController::follow`.
- [ ] **No change to `StoreFollowController::unfollow`** — it has no check today (unfollowing
      an unapproved/suspended store is a harmless idempotent `detach()`), and that's correct
      as-is. Noted here so it reads as a deliberate decision, not something this refactor
      missed.
- [ ] **No change to `Public/StoreController::show`'s `abort_unless($store->isApproved(), 404)`.**
      This is a resource-*visibility* gate on a guest-accessible route, not a user-permission
      check — it doesn't depend on `$user` at all (guests can view the page). Policies model
      "can this user do X," which doesn't fit a check that's the same for everyone. Leaving
      this as a plain guard clause (or, optionally, a `Store::approved()` query scope /
      `isApproved()` helper — it already exists — used consistently) is the right call, not a
      gap this refactor should force into the Policy abstraction.

## Milestone 5 — Verification, cleanup, and locking in the convention

- [ ] `grep -rn "abort_unless(.*store_id ===\|abort_unless(.*user_id ===\|abort_unless(.*cart_id ===" app/Http/Controllers` returns nothing outside the two documented visibility-gate exceptions from Milestone 4.
- [ ] Full suite: `php artisan test --compact`, `vendor/bin/pint --dirty --format agent`,
      `vendor/bin/phpstan analyse`.
- [ ] Record the convention via Boost's `record-rule` (glob: `app/Http/Controllers/**`): new
      mutating endpoints on an owned resource must authorize through a Policy
      (`$this->authorize(...)`), not an inline `abort_unless`. This is the actual point of the
      refactor — making the *next* endpoint someone adds default to the safe pattern instead of
      relying on them remembering to copy the old one.

---

## Cross-cutting concerns

- **No new dependencies.** Policies are core Laravel; nothing to install or approve.
- **Behavior-preserving by design.** Every milestone is a like-for-like swap of an inline
  boolean check for a policy-backed one — same 403s, same business rules, same routes. The
  test suite should show zero unrelated diffs; if a test needs new assertions beyond "still
  403s / still works," that's a signal the milestone scope crept.
- **Ordering matters a little, not a lot.** Milestone 1 (`Product`) is deliberately first
  because it's the smallest surface to get the pattern (scaffolding, `authorize()` call shape,
  test style) right before touching `Order`, which is both the biggest and the most
  security-sensitive. Milestones 3 and 4 have no dependency on each other or on 1–2 and could
  be reordered or done in parallel if that's more convenient.

## Explicitly out of scope for this refactor

- `Admin/*` controllers — already fully gated by `role:admin` middleware, no ownership
  dimension exists to check.
- Route-model-binding scoping (e.g. nested `stores/{store}/products/{product}` with
  `->scopeBindings()`) as an alternative/complement to Policies — a reasonable follow-up, but
  a routing-shape change is a bigger, separate decision from swapping inline checks for
  Policies.
- The two visibility-gate `isApproved()` checks (documented in Milestone 4) — deliberately not
  converted, see reasoning there.
- Form Request `authorize()` methods — they stay `return true;`. Moving ownership logic into
  Form Requests instead of controllers would be a valid alternative design, but mixing that
  with the Policy migration in the same effort adds a second axis of change for no added
  safety.
