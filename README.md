# Sakada PH

A water supplier marketplace for the Philippines. Consumers find nearby water suppliers with live stock status; sellers manage their store and products; admins approve sellers and moderate the platform.

## Tech Stack

- **Backend:** Laravel 13, PHP 8.3, MySQL 8+
- **Frontend:** Inertia.js v3, React, TypeScript, Tailwind CSS v4
- **Maps:** Leaflet.js + OpenStreetMap via React Leaflet (no API key required)
- **Storage:** S3-compatible (Cloudflare R2 or AWS S3) for supplier photos
- **Queues:** Laravel database queues (Redis in production)

## Features

### Consumers
- Browse approved water suppliers sorted by distance (browser geolocation)
- Filter by store type (pickup/delivery/both), stock status, and max distance
- Interactive Leaflet map with color-coded stock markers
- Follow stores to receive email/in-app alerts when stock is restocked
- In-app notification bell with unread count badge
- Mobile-style consumer layout with bottom navigation

### Sellers
- Registration flow with admin approval gate
- Store profile management (name, address, contact, type, coordinates, operating hours)
- Product CRUD with inline availability toggle (`in_stock` / `low_stock` / `out_of_stock`)
- Dashboard with stats: product counts by availability, follower count, recent products
- Queued email notifications on approval/rejection

### Admins
- Dashboard with platform stats (approved sellers, consumers, stock distribution)
- Seller management: approve, reject, suspend, or reinstate with reason
- User management: ban/unban with reason
- Stale store flagging (not updated in 7+ days)

### SEO & Discoverability
- Meta description + Open Graph tags on welcome, stores listing, and store detail pages
- XML sitemap at `/sitemap.xml` listing all approved store URLs

## Requirements

- PHP 8.3+
- Composer
- Node.js 20+ and npm
- MySQL 8+

## Local Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd sakada.ph

# 2. Install dependencies and configure environment
composer install
cp .env.example .env
php artisan key:generate

# 3. Configure your database in .env
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=sakada
# DB_USERNAME=root
# DB_PASSWORD=

# 4. Run migrations and seed demo accounts
php artisan migrate --seed

# 5. Install frontend dependencies and build assets
npm install
npm run build
```

Or use the one-command setup (SQLite, no seed):

```bash
composer run setup
```

## Running Locally

```bash
composer run dev
```

This starts three processes concurrently:

- `php artisan serve` — Laravel HTTP server
- `php artisan queue:listen --tries=1` — queue worker for emails and notifications
- `npm run dev` — Vite HMR dev server

## Demo Accounts

After running `php artisan migrate --seed`:

| Role     | Email                   | Password |
|----------|-------------------------|----------|
| Admin    | admin@sakada.ph         | password |
| Seller   | seller@sakada.ph        | password |
| Consumer | consumer@sakada.ph      | password |

## Environment Variables

Key variables to configure beyond the defaults in `.env.example`:

| Variable | Description |
|----------|-------------|
| `APP_URL` | Public URL of the application |
| `DB_*` | MySQL connection details |
| `MAIL_MAILER` | `smtp`, `ses`, `mailgun`, or `log` (for local) |
| `MAIL_FROM_ADDRESS` | Sender address for approval/alert emails |
| `QUEUE_CONNECTION` | `database` (default) or `redis` for production |
| `FILESYSTEM_DISK` | `s3` for production file storage |
| `AWS_*` | S3 / Cloudflare R2 credentials when using `s3` disk |

## Testing

```bash
# Run the full test suite
php artisan test --compact

# Run a specific test file
php artisan test --compact tests/Feature/StoreFollowTest.php

# Run tests matching a name filter
php artisan test --compact --filter=stock_alert
```

## Code Quality

```bash
# Format PHP with Laravel Pint
vendor/bin/pint

# Type-check PHP with PHPStan / Larastan
vendor/bin/phpstan analyse

# Lint and format frontend (ESLint + Prettier)
npm run lint
npm run format
```

## Deployment

This application is designed to deploy on [Laravel Cloud](https://cloud.laravel.com/).

**Checklist before deploying:**
1. Set all production environment variables (see table above)
2. Set `QUEUE_CONNECTION=database` (or `redis`)
3. Configure a queue worker process in the Laravel Cloud dashboard to run `php artisan queue:work`
4. Set `MAIL_MAILER` to a real driver — approval emails and stock alerts are queued
5. Point `FILESYSTEM_DISK=s3` and configure `AWS_*` credentials for store logo uploads
6. Set `APP_ENV=production` and `APP_DEBUG=false`

## Project Structure

```
app/
├── Enums/              # UserRole, SellerStatus, StoreType, ProductAvailability
├── Http/
│   ├── Controllers/
│   │   ├── Admin/      # Seller approval, user management
│   │   ├── Public/     # Store listing, store detail, follow/unfollow
│   │   ├── Seller/     # Store settings, product CRUD, dashboard
│   │   └── ...         # Notifications, sitemap
│   └── Middleware/     # EnsureRole, EnsureSellerApproved
├── Jobs/               # SendStockAlert (queued)
├── Mail/               # SellerApproved, SellerRejected (queued)
├── Models/             # User, Store, Product, StoreFollow
└── Notifications/      # StockRestoredNotification (queued)

resources/js/
├── layouts/
│   ├── consumer-layout.tsx        # Mobile-style layout with bottom nav
│   ├── public-layout.tsx          # Top nav for public pages
│   ├── app-layout.tsx             # Sidebar layout for consumers (settings)
│   ├── smart-stores-layout.tsx    # Consumer vs. public layout switcher
│   └── smart-settings-layout.tsx  # Consumer vs. app layout switcher
└── pages/
    ├── admin/          # Seller and user management
    ├── seller/         # Dashboard, products, store settings
    ├── stores/         # Public listing, detail, following list
    ├── dashboard.tsx   # Consumer home
    └── notifications.tsx
```
