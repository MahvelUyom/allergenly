# Allergenly

Allergen-scanning and QR digital-menu platform for restaurants. Free, full stop — no pricing tiers.

Built with Next.js 14 (App Router) + TypeScript + Tailwind, Prisma/PostgreSQL, NextAuth (Auth.js), and
pluggable storage/OCR adapters, to the exact design system in `allergenly-design-spec.md`.

## Quick start

```bash
npm install
cp .env.example .env
npm run db:up            # starts local Postgres via Docker Compose (or point DATABASE_URL at your own)
npm run prisma:generate  # generates the Prisma client — needs network access to binaries.prisma.sh
npm run prisma:migrate   # creates the database schema
npm run prisma:seed      # optional: seeds a demo account + the sample menu from the design spec
npm run dev
```

Then sign up at `http://localhost:3000/signup`, or log in with the seeded demo account:

- **Email:** `demo@allergenly.app`
- **Password:** `Password123`

### A note on `prisma generate` in this build

This codebase was assembled in a sandboxed environment whose network policy blocks
`binaries.prisma.sh` (the CDN Prisma's CLI downloads its query/schema engine binaries from), so
`prisma generate` could not be run or verified there, and `postinstall` is written to fail
gracefully rather than break `npm install`. **On your own machine, with normal internet access,
this just works** — run `npm run prisma:generate` (or `npm install` again) once, and everything
that depends on Prisma's generated types will resolve normally. This is the one piece of the
pipeline that could not be exercised end-to-end before delivery; everything else (routes, pages,
business logic) was written and reviewed directly.

## What's real vs. stubbed

Per the build brief, every external integration is behind a small adapter interface so the app
runs immediately with zero API keys, and becomes "real" by filling in `.env` — no code changes:

| Integration | Default (no config) | Real implementation |
|---|---|---|
| Database | — (Postgres is required either way) | `DATABASE_URL` |
| OCR | `OCR_DRIVER=stub` — returns a fixed sample menu so the upload → detect → review pipeline is fully exercisable | `OCR_DRIVER=vision` + a Google Cloud Vision service-account key (`src/lib/ocr/vision.ts`) |
| File storage | `STORAGE_DRIVER=local` — writes to `./storage` (outside `public/`, never web-executable) | `STORAGE_DRIVER=s3` + S3-compatible credentials — works with AWS S3, Cloudflare R2, Backblaze B2, DigitalOcean Spaces, MinIO (`src/lib/storage/s3.ts`) |
| Email (password reset / verification) | `EMAIL_DRIVER=console` — logs to the server console | `EMAIL_DRIVER=smtp` + SMTP credentials (wire up nodemailer or your provider in `src/lib/mailer.ts`) |
| Google OAuth sign-in | Omitted entirely from the sign-in screen if unconfigured | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` |
| Site analytics | `@vercel/analytics` + `@vercel/speed-insights`, already wired into the root layout — works out of the box on Vercel | — |

See `.env.example` for every variable, with inline comments.

## Architecture notes

- **Auth:** NextAuth (Auth.js) v4, Prisma adapter, JWT sessions. Credentials provider (bcrypt,
  12 rounds) + optional Google OAuth. Dashboard access is granted immediately on sign-up — there is
  no email-verification gate — but a verification email still fires in the background for
  record-keeping (`POST /api/auth/signup`), and a full forgot/reset-password flow exists
  (`/forgot-password`, `/reset-password`, both backed by their own short-lived token table so a
  password-reset link is never confused with a NextAuth sign-in link).
- **Data model:** see `prisma/schema.prisma`. One `Restaurant` per owning `User`, with
  `Location`s, `Menu`s, `MenuItem`s, and one `AllergenFlag` row per (item, allergen) pair that's
  ever been flagged — its `status` (`AUTO_DETECTED` / `CONFIRMED` / `CLEARED`) and `source`
  (`ocr` / `manual`) drive both the chip UI and the compliance score. `QRCode` and `ScanEvent` are
  separate from Vercel Analytics entirely — first-party scan tracking, per the build spec.
- **Compliance score:** `src/lib/compliance.ts` implements the locked formula
  `(60 × ConfirmedRatio) + (30 × CoverageRatio) + (10 × RecencyFactor)`. The formula was specified;
  a couple of supporting definitions (what counts as "a manual review", what "last review" is
  scoped to) were left open and are documented with the reasoning behind the chosen default right
  in that file.
- **Allergen detection:** `src/lib/allergens.ts` is a transparent EU-14 keyword lexicon — every
  match is stored as `AUTO_DETECTED` and never auto-promoted to `CONFIRMED`; only a human action
  via the manual-override panel (`POST /api/menu-items/:id/allergens`) can set `CONFIRMED` or
  `CLEARED`. Swapping this for a more sophisticated ingredient-database or LLM-assisted pass later
  is a one-file change — the review-required contract and the data model don't need to move.
- **Menu upload pipeline:** `src/lib/menu-processing.ts` runs upload → OCR → parse → detect
  synchronously within the request (the stub/keyword pipeline is fast enough), but is also callable
  from `POST /api/internal/process-upload` — a shared-secret-authenticated route that's the shape a
  real deployment would use once OCR on large scanned PDFs makes inline processing too slow, moving
  the work to a queue worker without changing the core pipeline function.
- **QR scan tracking:** every QR code gets its own short id; the code encodes
  `/q/{shortId}` (not the menu URL directly), which is a minimal, rate-limited, format-validated
  redirect route that logs a `ScanEvent` server-side and 302s to the clean `/m/{slug}` URL — so a
  link copied from the browser bar never inherits tracking or gets miscounted as a scan. Repeat
  scans from the same device within 30 minutes are deduped via a hashed fingerprint (never raw
  IP/UA at rest).
- **Public menu page** (`/m/[slug]`): server-rendered, mobile-first, no auth, with per-restaurant
  metadata/OG tags/canonical/`Restaurant` JSON-LD, and an allergen filter that's client-side over
  already-server-rendered data — filtering greys out unsafe items via `opacity`/`pointer-events`
  rather than removing them, so there's no layout shift and the open/close affordance only animates
  `transform`/`opacity`.
- **Security:** see the "Security" section below — every write route derives its restaurant id
  from the session, never the request body; every form's Zod schema is shared verbatim between
  client and server (`src/lib/zod-schemas.ts`); free text is sanitized before it's stored
  (`src/lib/sanitize.ts`), not just at render time.

## Security

Everything in the build brief's security section is implemented, not deferred:

- **Validation:** every form/route shares one Zod schema (`src/lib/zod-schemas.ts`) between
  client-side UX validation and server-side re-validation — the server never trusts client input.
- **Sanitization:** `sanitizePlainText` (DOMPurify, strip-to-text) runs on menu item names/
  descriptions and restaurant profile fields before they're stored.
- **Auth on every write route:** dashboard/menu/settings routes call `requireRestaurantSession()`
  (`src/lib/session.ts`), which derives the restaurant id from the session/JWT — an id in the
  request body is never trusted, and per-resource ownership is re-checked (`findFirst({ where: {
  id, restaurantId } })`) before any mutation.
- **The public QR redirect** (`/q/[qrId]`) is treated as a hostile-input boundary: format-validated
  before it touches a query, rate-limited, and does nothing but look up → log → redirect.
- **Internal service-to-service calls** (`/api/internal/process-upload`) require a constant-time-
  compared shared secret header and fail closed if `INTERNAL_SERVICE_SECRET` isn't set.
- **Admin actions:** `requireAdminSession()` checks role against the database, not a client route
  guard (no admin UI ships in this build — the design spec doesn't call for one — but the
  server-side primitive is in place for whenever one is added).
- **CORS:** `corsHeaders()` restricts every API route to `NEXT_PUBLIC_APP_URL` and localhost — no
  wildcard origins.
- **File uploads:** server-side type/size validation sniffs actual magic bytes (never the
  client-reported MIME type), strips anything that looks like an embedded script before OCR, and
  stores raw uploads outside `public/` (or with no public-read ACL on S3) — never directly
  web-executable.

## Known limitations / next steps

- `prisma generate` couldn't be verified in the sandbox this was built in (see above) — run it once
  locally.
- The OCR and email drivers default to stubs so the app runs with zero configuration; flip the
  `_DRIVER` env vars once you have real credentials.
- The in-memory rate limiter (`src/lib/rate-limit.ts`) is fine for a single instance; a
  multi-instance deployment should swap it for a shared store (e.g. Upstash Redis) — the call
  signature is small on purpose so that's a one-file change.
- Menu processing runs inline rather than through a real job queue; `/api/internal/process-upload`
  is the seam to move it to one.
