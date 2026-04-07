# VG Server

Simple Express + MySQL backend for the VG project.

## Setup
1. Create a MySQL database using `db.sql`.
2. Copy `.env.example` to `.env` and fill in values.
3. Install dependencies: `npm install`
4. Run: `npm run dev`

## Endpoints
- `GET /api/health`
- `GET /api/items`
- `GET /api/items/:id`
- `POST /api/items`
- `PUT /api/items/:id`
- `DELETE /api/items/:id`
