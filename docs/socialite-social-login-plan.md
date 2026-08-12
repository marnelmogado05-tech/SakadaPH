# Sakada.ph — Social Login via Socialite (draft)

> **Status:** draft / proposed, not yet implemented. `laravel/socialite` is **not yet a
> dependency** — a dry-run install (`composer require laravel/socialite --dry-run`) confirmed
> it resolves cleanly against Laravel 13 (`v5.29.0`, no conflicts with Fortify or passkeys),
> but nothing was actually installed. Adding it for real needs explicit sign-off per the
> project's "don't change dependencies without approval" rule — this doc is the plan for when
> that happens, not a record of work done.

## Scope

- **Consumers (`role: user`) only.** Seller sign-up already goes through
  `SellerRegistrationController`'s approval-gated flow with business details; admin accounts
  intentionally have the smallest possible attack surface. Extending social login to sellers is
  a separate, larger change if ever wanted.
- **Google first.** Dominant provider in the PH market. Facebook can be added later using the
  same pattern once Google is proven out.

## Decisions baked in

- **`users.password` stays `NOT NULL`.** Making it nullable would touch every code path that
  assumes a hashed password exists (login, password confirmation gating 2FA settings, password
  reset). Cheaper and lower-risk: social-created accounts get a random unguessable password via
  `Str::password(40)` at creation time. A "set a password later" account-settings feature can be
  scoped separately if a social-only user ever wants password login too.
- **Auto-link by verified email.** If a Google login's email matches an existing password-based
  account, that account is linked (`provider`/`provider_id` set on it) rather than creating a
  duplicate. This is the standard pattern and safe *because* Google verifies email ownership —
  called out explicitly since it's a security-relevant default: whoever controls that Google
  account can now log into the linked Sakada account.
- **Social sign-in skips Fortify's email verification step.** `email_verified_at` is set
  immediately on creation since the provider already verified the address.
- **`{provider}` is whitelisted, never passed straight to `Socialite::driver()`.** Only `google`
  accepted in v1; anything else 404s rather than reaching the driver resolver.

---

## 1. Data model

### `users` (alter)

| Column | Type | Notes |
|---|---|---|
| `provider` | string, nullable | e.g. `google`. Null for password-only accounts. |
| `provider_id` | string, nullable | The provider's user ID. |

Unique composite index on `(provider, provider_id)`.

## 2. Backend

- New `App\Http\Controllers\Auth\SocialiteController`:
  - `redirect(string $provider)` — validates `$provider` against a fixed whitelist (`['google']`),
    then `Socialite::driver($provider)->redirect()`.
  - `callback(string $provider)` — same whitelist check, then:
    1. Look up `users` by `(provider, provider_id)` → log in if found.
    2. Else look up by `email` → if an existing account matches, link it (set
       `provider`/`provider_id`) instead of creating a duplicate.
    3. Else create a new `role: user` account from the provider profile (name, email,
       `email_verified_at = now()`, random password).
  - Respects the existing `EnsureNotBanned` middleware — a banned user must still hit the ban
    wall via social login, same as password login.
- `config/services.php`: add a `google` block (`client_id`, `client_secret`, `redirect`);
  mirror into `.env.example`.
- Rate-limit the callback route (reuse Fortify's `throttle:login`-style limiter, or a dedicated
  named limiter) — an unthrottled OAuth callback is still a lever for account-enumeration/abuse,
  consistent with the rate-limiting gaps already flagged for the rest of the app.

## 3. Frontend

- Add a "Continue with Google" button to `login.tsx` and `register.tsx`.
- Plain `<a href="/auth/google/redirect">`, **not** an Inertia visit — OAuth needs a real
  full-page redirect, not an XHR.

## 4. Testing

Pest feature tests mocking the `Socialite` facade:

- New-account creation from a fresh Google profile.
- Linking to an existing password-based account by matching verified email.
- Banned user is still blocked after a successful Google callback.
- Unknown/invalid provider in the route param → `404`, not a driver exception leaking to the user.

---

## Cross-cutting concerns

- **No changes to the seller or admin auth flows.** This is additive to the existing consumer
  login/register pages only.
- **Coexists with Fortify features already in use** (registration, password reset, email
  verification, 2FA, passkeys) — Socialite only owns the OAuth redirect/callback routes, it
  doesn't replace or reconfigure Fortify's session-auth pipeline.

## Explicitly out of scope for v1

- Seller or admin social login.
- Facebook or other providers (Google only, first).
- Nullable-password / "remove your password" account management.
- Unlinking a social provider from an account once linked.

## Open decisions

1. **Auto-link by email — confirmed acceptable, or should it require an explicit "link
   accounts" confirmation step instead of silent linking?** This doc assumes silent auto-link
   (standard, safe given Google's email verification) but it's worth a final explicit yes before
   building.
2. **Facebook timing** — add alongside Google in v1, or genuinely defer until there's demand?
