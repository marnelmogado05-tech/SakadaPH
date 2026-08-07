# Sakada.ph — Build Plan

Water supplier marketplace for the Philippines. Consumers find nearby water suppliers with live stock status; sellers manage their store and products; admins approve sellers and moderate the platform.

## Stack
- **Backend:** Laravel 13, PHP 8.3, MySQL 8+
- **Frontend:** Inertia.js v3, React, TypeScript, Tailwind CSS v4
- **Maps:** Leaflet.js + OpenStreetMap via React Leaflet (free, no API key)
- **Payments (future):** PayMongo — data models stubbed now, UI later
- **Storage:** Cloudflare R2 / S3-compatible (supplier photos)
- **Queues:** Laravel queues, database driver now → Redis in production

---

## Milestone 0 — Foundation Cleanup & Role Infrastructure ✅

Fix what's broken, establish the role system, switch database.

- [x] Switch from SQLite to MySQL
- [x] `UserRole` enum (Admin / Seller / User) with `EnsureRole` middleware
- [x] Fix `UserFactory` — uses `first_name`/`last_name`/`role`, `admin()` and `seller()` states
- [x] Fix `DatabaseSeeder` — seeds admin, seller, and consumer accounts
- [x] Role-based route groups (`/admin/*`, `/seller/*`, `/dashboard`)
- [x] Base layouts per role (AdminLayout, SellerLayout, AppLayout)
- [x] Login redirect based on role

---

## Milestone 1 — Seller Onboarding & Admin Approval ✅

A water supplier can register, submit their store, and an admin can approve or reject them.

- [x] `stores` table with `SellerStatus` enum (Pending / Approved / Rejected)
- [x] Seller registration flow — creates User (role: seller) + pending Store in one step
- [x] `EnsureSellerApproved` middleware — blocks unapproved sellers from dashboard
- [x] Seller "pending approval" page (no layout, standalone)
- [x] Admin sellers page — list, approve, reject with reason
- [x] Email notifications on approval and rejection (`SellerApproved`, `SellerRejected`)
- [x] Login redirect checks store approval status for sellers
- [x] Design system — blue accent (`#2563EB`), SF Pro / Inter font
- [x] Welcome page with "Find suppliers near me" and "List your business" CTAs

> **Note:** The `stores` table is missing fields from the original plan:
> `type` (pickup/delivery/both), `suspended` status, `latitude`, `longitude`,
> `logo_path`, `operating_hours` (JSON), `service_radius_km`. These will be
> added in Milestone 2.

---


## Milestone 2 — Seller Store & Product Management ✅

An approved seller can manage their store profile and water product listings.

**Store profile:**
- [x] Add `type` enum to stores: `pickup`, `delivery`, `both`
- [x] Add `suspended` to `SellerStatus`
- [x] Add `latitude`, `longitude` to stores
- [x] Add `operating_hours` JSON field to stores
- [x] Add `service_radius_km` to stores (for delivery type)
- [x] Add `logo_path` to stores
- [x] Store settings page — seller can edit name, address, contact, description, type, coordinates, service radius
- [x] Store type selector (pickup / delivery / both)
- [x] Suspended seller holding page (no layout, standalone)
- [x] `EnsureSellerApproved` checks suspended state — redirects to `/seller/suspended`

**Product management:**
- [x] `products` table: name, description, price, unit, quantity, store FK
- [x] Replace `is_available` boolean with `availability` enum: `in_stock`, `low_stock`, `out_of_stock`
- [x] Add `last_updated_at` to products (auto-updates on any availability change)
- [x] Seller product CRUD (index, create, edit, update, delete)
- [x] Inline availability dropdown per product row (auto-submits on change)
- [x] Products nav item in seller sidebar

**Admin:**
- [x] Admin can suspend an approved store with a reason

**Public discovery (partial — built without geospatial):**
- [x] Public store listing page (`/stores`) — approved stores, text search by name/area
- [x] Individual store profile page (`/stores/{store}`) — store info + available products, store type display
- [x] Products filtered to in_stock + low_stock only on public view
- [x] `PublicLayout` — shared nav for all public pages
- [x] Welcome page "Find suppliers near me" → `/stores`

> **Note:** Map picker for coordinate input deferred to Milestone 4 when Leaflet is introduced.

---

## Milestone 3 — Consumer Discovery (Geospatial List View) ✅

A consumer can browse and filter approved suppliers by distance using their real location.

- [x] Consumer geolocation — browser Geolocation API passes coordinates to server
- [x] Distance calculation using `ST_Distance_Sphere` (MySQL geospatial), guarded on SQLite for tests
- [x] `/stores` sorted by distance by default; fallback to name alphabetically if no location
- [x] Filters: store type (pickup/delivery/both), "In Stock only" toggle, max distance presets (5/10/20 km)
- [x] Store cards show: distance, availability status badge (`in_stock`/`low_stock`/`out_of_stock`/`no_products`), `last_updated_at` relative timestamp, price range
- [x] Graceful fallback if consumer denies location — shows all stores alphabetically with a banner prompt
- [x] "Requesting" spinner state while geolocation is pending

---

## Milestone 4 — Map-Based Discovery ✅

Suppliers appear as color-coded markers on an interactive Leaflet map.

- [x] Leaflet + OpenStreetMap map on `/stores`
- [x] Marker colors: green (in stock), amber (low stock), red (out of stock), gray (no products)
- [x] Marker popup: store name, type, distance, "View details" link
- [x] List and map in sync — hovering a card highlights its marker and vice versa
- [x] Mobile: map/list tab switch (not side-by-side on small screens)
- [x] Consumer position marker + radius circle

---

## Milestone 5 — Admin Panel ✅

Admin has full visibility and control over the platform.

- [x] Admin dashboard stats: total approved sellers, total consumers, in-stock vs out-of-stock stores
- [x] Seller management: full list, filter by status, approve / reject / suspend / reinstate with reason
- [x] Suspend action immediately revokes seller dashboard access
- [x] User management: list all users, ban/unban with reason
- [x] Stale store flagging — highlight stores not updated in 7+ days
- [x] `banned_at` enforcement — banned users are logged out on their next request and redirected to `/banned`

> **Note:** Platform settings hook (featured sellers, announcements) deferred — not well-defined enough to implement without more requirements.

---

## Milestone 6 — Notifications & Consumer Engagement ✅

Keep consumers informed about stock changes without manual checking.

- [x] `store_follows` table: `user_id`, `store_id`
- [x] Consumer can follow / unfollow a store from the store profile page
- [x] When a seller toggles any product to `in_stock`, a queued job sends email/notification to all followers
- [x] Consumer "My followed stores" page — see followed stores and their current status
- [x] In-app notification bell (unread count badge) for: order events, approval status, stock alerts
- [x] Mark individual / all notifications as read

---

## Milestone 7 — Production Deployment ✅

Ship to production on Laravel Cloud.

- [x] Switch mailables to queued jobs (`ShouldQueue`) — `SellerApproved`, `SellerRejected`, `StockRestoredNotification` all queued
- [x] Configure queue worker on Laravel Cloud — `composer run dev` runs `queue:listen`; configure a worker process in Laravel Cloud dashboard
- [x] Environment configuration and secrets checklist — see `.env.example` for required vars (`APP_KEY`, `DB_*`, `MAIL_*`, `QUEUE_CONNECTION=database`)
- [x] SEO basics — `<meta name="description">` + Open Graph tags on welcome, stores index, and store show pages; `sitemap.xml` at `/sitemap.xml` with all approved store URLs
- [ ] Deploy to Laravel Cloud and verify all features
