# VG Server

Simple Express + MySQL backend for the VG project.

## Setup
1. Create a MySQL database using `db.sql`.
2. Copy `.env.example` to `.env` and fill in values.
3. Install dependencies: `npm install`
4. Run: `npm run dev`

## Hosted MySQL
The backend supports either discrete database settings or a single `DATABASE_URL`.

Useful environment variables:
- `DATABASE_URL=mysql://user:password@host:3306/dbname`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `DB_SSL=true` for hosted providers that require TLS
- `DB_SSL_REJECT_UNAUTHORIZED=false` for providers that use managed certificates without a custom CA bundle
- `DB_SSL_CA_BASE64` if your provider gives you a CA certificate and you want strict verification
- `EXPOSE_INTERNAL_ERRORS=true` in development so `/api/events` returns the real SQL error details

## Password Storage
Passwords are now stored with Node's `scrypt` password hashing.

Existing plain-text passwords are upgraded automatically the next time that user logs in successfully.

## Endpoints
- `GET /api/health`
- `GET /api/health/db`
- `POST /api/orgs/signup`
- `POST /api/orgs/login`
- `GET /api/events`
- `GET /api/events/stream`
- `POST /api/events`
- `POST /api/events/:id/apply`
- `PATCH /api/events/:id/volunteers/:volunteerId`
- `POST /api/volunteers/signup`
- `POST /api/volunteers/login`
- `GET /api/volunteers/:id`
- `PUT /api/volunteers/:id`
