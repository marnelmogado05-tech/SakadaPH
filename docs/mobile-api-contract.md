# Sakada.ph — Mobile API Contract (v1)

> **Status:** Draft / proposed. This is the target contract for the React Native (Expo)
> client. **None of these endpoints exist yet** — the app currently serves only Inertia
> web routes. This document defines what Phase 1–3 of the migration will build.
>
> **Scope:** Consumer + Seller roles only. Admin stays on the web app and has no mobile API.
> The existing Inertia web app is untouched; this API runs in parallel under `/api`.

---

## 1. Conventions

| Aspect | Decision |
|---|---|
| Base path | `/api` (new `routes/api.php`, registered in `bootstrap/app.php`) |
| Versioning | Path-based, reserved for later (`/api/v1`). v1 endpoints documented here are unprefixed for now; add the prefix if/when a v2 is needed. |
| Auth | **Laravel Sanctum personal access tokens** (Bearer). Web keeps Fortify sessions. |
| Format | JSON only. Requests send `Accept: application/json`. `bootstrap/app.php` already forces JSON rendering for `api/*`. |
| Wrapping | Eloquent API Resources. Collections use Laravel's default `{ "data": [...], "links": {...}, "meta": {...} }` pagination envelope. Single resources return `{ "data": {...} }`. |
| Auth header | `Authorization: Bearer {token}` |
| Timestamps | ISO 8601 strings (UTC). App timezone is `Asia/Manila` — clients localize for display. |
| IDs | Integer for stores/products/users; UUID string for notifications (Laravel `DatabaseNotification`). |

### Standard error shapes

```jsonc
// 401 — missing/invalid token
{ "message": "Unauthenticated." }

// 403 — role/ownership/ban/approval failures (see per-endpoint notes)
{ "message": "This action is unauthorized." }

// 422 — validation (Laravel default)
{
  "message": "The name field is required.",
  "errors": { "name": ["The name field is required."] }
}

// 404 — not found / not visible (e.g. unapproved store on public endpoint)
{ "message": "Not found." }
```

### Auth-related 403 sub-states (mobile must branch on these)

The web app enforces these via redirect middleware (`EnsureNotBanned`,
`EnsureSellerApproved`). The API returns 403 with a `reason` code so the client can
route to the correct screen instead of a generic error:

```jsonc
{ "message": "...", "reason": "banned" }             // → Banned screen, force logout
{ "message": "...", "reason": "seller_pending" }     // → Seller "pending approval" screen
{ "message": "...", "reason": "seller_rejected" }    // → Seller rejected screen (show reason)
{ "message": "...", "reason": "seller_suspended" }   // → Seller "suspended" screen (show reason)
```

---

## 2. Enums (mirror these as TS unions in the app)

```ts
type UserRole          = 'admin' | 'seller' | 'user';
type SellerStatus      = 'pending' | 'approved' | 'rejected' | 'suspended';
type StoreType         = 'pickup' | 'delivery' | 'both';
type ProductAvailability = 'in_stock' | 'low_stock' | 'out_of_stock';

// Derived, computed server-side for store cards (not a DB column):
type StoreAvailability = ProductAvailability | 'no_products';
```

Human labels (`StoreType::label()`, `ProductAvailability::label()`) are returned by
the option endpoints so the client never hardcodes them.

---

## 3. Authentication

Fortify's web auth is session-based and cannot be consumed by Expo. These endpoints
issue Sanctum tokens. Registration reuses the existing `CreateNewUser` action and
`SellerRegistrationController` logic (extracted into a shared service).

### `POST /api/register` — consumer signup
Creates a `role: user` account.

Request:
```jsonc
{
  "first_name": "Juan",
  "middle_name": null,          // optional
  "last_name": "Dela Cruz",
  "extension_name": null,       // optional (Jr., III)
  "email": "juan@example.com",
  "contact_number": null,       // optional
  "password": "secret1234",
  "password_confirmation": "secret1234"
}
```
Rules: `first_name`/`last_name` required string max:255; `email` required, unique;
`password` required + `Password::default()` + confirmed.

Response `201`:
```jsonc
{ "data": { "token": "1|abc...", "user": { /* UserResource, see §7 */ } } }
```

### `POST /api/register/seller` — seller signup
Creates a `role: seller` User **and** a `pending` Store in one step (mirrors
`SellerRegistrationController::store`).

Request:
```jsonc
{
  "first_name": "Maria", "last_name": "Santos",
  "middle_name": null, "extension_name": null,
  "email": "maria@shop.ph", "contact_number": "09171234567",
  "password": "secret1234", "password_confirmation": "secret1234",
  "store_name": "AquaPure Refilling",
  "store_address": "123 Rizal St, Cebu City",
  "store_description": null,        // optional, max:1000
  "store_contact_number": null      // optional, max:15
}
```
Response `201`: same shape as consumer register. `user.role` is `seller`;
newly created store is `pending` → client routes to the pending screen.

### `POST /api/login`
Request:
```jsonc
{ "email": "juan@example.com", "password": "secret1234", "device_name": "iPhone 15" }
```
Response `200` (no 2FA):
```jsonc
{ "data": { "token": "1|abc...", "user": { /* UserResource */ } } }
```
Response `200` (2FA enabled — token withheld until challenge passes):
```jsonc
{ "data": { "two_factor": true, "pending_token": "challenge-uuid" } }
```
Errors: `422` invalid credentials; `403 reason:"banned"` if `banned_at` is set.

### `POST /api/login/two-factor-challenge`
Completes 2FA for accounts with `two_factor_confirmed_at`.

Request:
```jsonc
{ "pending_token": "challenge-uuid", "code": "123456" }   // OR "recovery_code": "..."
```
Response `200`: `{ "data": { "token": "1|abc...", "user": { ... } } }`

### `POST /api/logout`  *(auth)*
Revokes the current access token. `204`.

### `GET /api/user`  *(auth)*
Returns the authenticated user + role-relevant context (used on app boot to restore
session and decide the navigation stack).

Response `200`:
```jsonc
{
  "data": {
    "user": { /* UserResource */ },
    "store": { "id": 4, "status": "approved", "type": "both" } | null,  // sellers only
    "unread_notifications_count": 3
  }
}
```

### Password reset
`POST /api/forgot-password` `{ "email": "..." }` → `200` (always generic message).
`POST /api/reset-password` `{ "token", "email", "password", "password_confirmation" }` → `200`.
Reuses Fortify's underlying reset broker; the email link/deep-link handling is a mobile
concern (see migration plan Phase 5).

> **Gap — Passkeys/WebAuthn:** intentionally **not** exposed in v1. They are browser-bound
> (`PasskeyAuthenticatable`) and do not port to Expo. Revisit later with native platform
> passkey APIs.

---

## 4. Consumer endpoints

### `GET /api/stores` — discovery list *(public, auth optional)*
Approved stores only. Sorted by distance when coords supplied (MySQL
`ST_Distance_Sphere`), else alphabetically by name. Paginated (12/page).

Query params (all optional):
| Param | Type | Notes |
|---|---|---|
| `lat`, `lng` | float | Consumer location. Enables `distance_km` + distance sort. Ignored on non-MySQL. |
| `search` | string | Matches store `name` OR `address` (LIKE). |
| `type` | `StoreType` | Filter by store type. |
| `in_stock_only` | bool | Only stores with ≥1 non-`out_of_stock` product. |
| `max_distance` | float (km) | Requires `lat`/`lng`; presets 5/10/20 on the client. |

Response `200` — each item (`StoreCardResource`):
```jsonc
{
  "data": [
    {
      "id": 4,
      "name": "AquaPure Refilling",
      "description": "...",
      "address": "123 Rizal St, Cebu City",
      "type": "both",
      "latitude": 10.3157,
      "longitude": 123.8854,
      "products_count": 6,
      "distance_km": 2.4,                 // null if no location / no coords
      "store_availability": "in_stock",   // in_stock|low_stock|out_of_stock|no_products
      "price_min": 25.00,
      "price_max": 60.00,
      "last_updated_at": "2026-08-08T09:12:00Z"  // most recent product update
    }
  ],
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
  "meta": { "current_page": 1, "last_page": 3, "per_page": 12, "total": 30 }
}
```
> Backend note: extract the distance query + `storeAvailability()` (currently duplicated
> in `Public\StoreController` and `Consumer\FollowingController`) into a shared service so
> web and API stay identical.

### `GET /api/stores/{store}` — store profile *(public, auth optional)*
`404` unless approved. Products filtered to non-`out_of_stock`, ordered by name.
`is_followed`/`can_follow` are `false` for guests and non-consumers.

Response `200`:
```jsonc
{
  "data": {
    "store": {
      "id": 4, "name": "AquaPure Refilling", "description": "...",
      "address": "123 Rizal St", "contact_number": "09171234567",
      "type": "both",
      "is_followed": true,     // consumer + currently following
      "can_follow": true       // true only for role:user
    },
    "products": [
      {
        "id": 11, "name": "Round gallon", "description": null,
        "price": "25.00", "unit": "gallon", "quantity": 100,
        "availability": "in_stock",
        "image_url": "https://.../storage/products/xyz.jpg"  // null if none
      }
    ]
  }
}
```

### `POST /api/stores/{store}/follow` *(auth, role:user)*
Idempotent follow. `204`. `403` for non-consumers.

### `DELETE /api/stores/{store}/follow` *(auth, role:user)*
Unfollow. `204`. *(Web uses `POST /unfollow`; REST client prefers `DELETE`.)*

### `GET /api/following` — followed stores *(auth, role:user)*
Response `200` — list of `FollowedStoreResource`:
```jsonc
{
  "data": [
    {
      "id": 4, "name": "AquaPure Refilling", "address": "123 Rizal St",
      "type": "both", "store_availability": "in_stock",
      "last_updated_at": "2026-08-08T09:12:00Z"
    }
  ]
}
```

---

## 5. Notifications *(auth, any role)*

Backed by Laravel `DatabaseNotification`.

### `GET /api/notifications`
Paginated (20/page), newest first.

> **Behavior change vs. web:** the web `index` marks all unread as read on load. The API
> must **not** auto-mark — return `read_at` as-is and let the client mark explicitly, so a
> pull-to-refresh doesn't silently clear the badge.

Response `200`:
```jsonc
{
  "data": [
    {
      "id": "9f8c...uuid",
      "type": "stock_alert",            // stock_alert|seller_approved|seller_rejected|general
      "message": "AquaPure is back in stock!",
      "store_id": 4,                    // nullable
      "store_name": "AquaPure Refilling", // nullable
      "read_at": null,
      "created_at": "2026-08-08T09:12:00Z"
    }
  ],
  "meta": { /* pagination */ }
}
```

### `POST /api/notifications/{id}/read` — mark one read
`204`. (New granularity for mobile; web only had mark-all.)

### `POST /api/notifications/read-all` — mark all read
`204`.

### `GET /api/notifications/unread-count`
`{ "data": { "count": 3 } }` — cheap poll for the tab badge.

---

## 6. Seller endpoints *(auth, role:seller, seller.approved)*

All require an **approved, non-suspended** store. Unapproved/suspended → `403` with the
`reason` codes from §1 so the client shows the pending/suspended screen.

### `GET /api/seller/dashboard`
Response `200` (mirrors `Seller\DashboardController`):
```jsonc
{
  "data": {
    "store": { "name": "AquaPure", "status": "approved", "type": "both", "followers_count": 42 },
    "stats": { "total_products": 6, "in_stock": 4, "low_stock": 1, "out_of_stock": 1 },
    "recent_products": [
      { "id": 11, "name": "Round gallon", "availability": "in_stock",
        "price": 25.0, "unit": "gallon", "last_updated_at": "2 hours ago" }
    ]
  }
}
```

### `GET /api/seller/store` — editable store profile
Response `200`:
```jsonc
{
  "data": {
    "store": {
      "name": "AquaPure", "description": "...", "address": "123 Rizal St",
      "contact_number": "09171234567", "type": "both",
      "latitude": 10.3157, "longitude": 123.8854, "service_radius_km": 5.0
    },
    "store_types": [ { "value": "pickup", "label": "Pickup only" }, ... ]
  }
}
```

### `PATCH /api/seller/store` — update profile
Request (rules from `StoreUpdateRequest`):
```jsonc
{
  "name": "AquaPure",                 // required, max:255
  "description": null,                // nullable, max:1000
  "address": "123 Rizal St",          // required
  "contact_number": null,             // nullable, max:15
  "type": "both",                     // required, StoreType
  "latitude": 10.3157,                // nullable, between:-90,90
  "longitude": 123.8854,              // nullable, between:-180,180
  "service_radius_km": 5.0            // nullable, 0.1–100
}
```
Response `200`: `{ "data": { "store": { ... } } }`
> Mobile advantage: native map picker (`react-native-maps`) sets lat/lng — the coordinate
> picker deferred on web.

### `GET /api/seller/products` — list all own products
Includes `out_of_stock` (unlike public). Ordered by name.
```jsonc
{
  "data": [
    { "id": 11, "name": "Round gallon", "price": "25.00", "unit": "gallon",
      "quantity": 100, "availability": "in_stock", "image_url": "https://..." }
  ],
  "availability_options": [ { "value": "in_stock", "label": "In stock" }, ... ]
}
```

### `POST /api/seller/products` — create
`multipart/form-data` (image upload). Rules from `ProductStoreRequest`:
```
name              required string max:255
description       nullable string max:1000
price             required numeric min:0 decimal:0,2
unit              required string max:50
quantity          required integer min:0
availability      required ProductAvailability
image             nullable image max:2048 (KB)
```
Response `201`: `{ "data": { /* product */ } }`

### `PATCH /api/seller/products/{product}` — update
Same fields as create (multipart if replacing image). Ownership enforced → `403` if the
product's `store_id` ≠ caller's store. Response `200`.

### `PATCH /api/seller/products/{product}/availability` — quick toggle
The high-frequency action (inline dropdown on web). Request:
```jsonc
{ "availability": "in_stock" }
```
**Critical business rule (preserve exactly):** transitioning **into** `in_stock` from any
other state dispatches `SendStockAlert` → emails + push to all followers. Also bumps
`last_updated_at`. Response `200`: `{ "data": { /* product */ } }`.

### `DELETE /api/seller/products/{product}` — delete
Deletes product + its stored image. Ownership enforced. `204`.

---

## 7. Shared resource shapes

### UserResource
```jsonc
{
  "id": 7,
  "first_name": "Juan", "middle_name": null, "last_name": "Dela Cruz",
  "extension_name": null,
  "email": "juan@example.com",
  "contact_number": null,
  "role": "user",
  "email_verified_at": "2026-08-01T00:00:00Z",  // null if unverified
  "two_factor_enabled": false                    // derived from two_factor_confirmed_at
}
```
Never expose: `password`, `two_factor_secret`, `two_factor_recovery_codes`,
`remember_token`, `banned_at`/`ban_reason` (enforced via ban 403 instead).

---

## 8. Push notifications (Phase 3)

Expo push tokens registered per device; consumed by `SendStockAlert` +
`StockRestoredNotification` (which already write DB notifications).

### `POST /api/device-tokens` *(auth)*
```jsonc
{ "token": "ExponentPushToken[xxx]", "platform": "ios" }   // ios|android
```
`204`. Upsert on `(user_id, token)`.

### `DELETE /api/device-tokens` *(auth)*
`{ "token": "ExponentPushToken[xxx]" }` → `204`. Called on logout.

---

## 9. Proposed `routes/api.php` map

```
POST   /api/register
POST   /api/register/seller
POST   /api/login
POST   /api/login/two-factor-challenge
POST   /api/forgot-password
POST   /api/reset-password

GET    /api/stores                              (public)
GET    /api/stores/{store}                       (public)

  --- auth:sanctum ---
POST   /api/logout
GET    /api/user
POST   /api/device-tokens
DELETE /api/device-tokens
GET    /api/notifications
POST   /api/notifications/read-all
POST   /api/notifications/{id}/read
GET    /api/notifications/unread-count

  --- auth:sanctum + role:user ---
POST   /api/stores/{store}/follow
DELETE /api/stores/{store}/follow
GET    /api/following

  --- auth:sanctum + role:seller + seller.approved ---
GET    /api/seller/dashboard
GET    /api/seller/store
PATCH  /api/seller/store
GET    /api/seller/products
POST   /api/seller/products
PATCH  /api/seller/products/{product}
PATCH  /api/seller/products/{product}/availability
DELETE /api/seller/products/{product}
```

---

## 10. Known differences from the web app (deliberate)

| Web (Inertia) | Mobile API | Why |
|---|---|---|
| Session cookie auth (Fortify) | Sanctum bearer tokens | Native clients can't hold web sessions. |
| Passkeys/WebAuthn login | Not supported v1 | Browser-bound. |
| Redirects for ban/pending/suspended | `403 { reason }` codes | Client routes to the right screen. |
| Notifications auto-marked read on load | Explicit `POST .../read` | Avoid silently clearing the badge on refresh. |
| `POST /unfollow` | `DELETE /follow` | REST semantics. |
| Flash toasts via Inertia | HTTP status + body | No Inertia layer on native. |
| Admin routes | Excluded entirely | Admin stays on web. |

---

## 11. Testing note

Per project rules, every endpoint gets a Pest feature test mirroring existing web
coverage (auth, role gating, ban/approval/suspension 403s, ownership 403s, distance sort
guarded on SQLite, and the toggle-into-`in_stock` → `SendStockAlert` dispatch). Target:
parity with the current 133 passing tests.
