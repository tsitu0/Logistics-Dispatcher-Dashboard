# Dispatcher Operations System

Full-stack logistics dashboard with a Next.js frontend and an Express + MongoDB backend. Manage containers, drivers, chassis, and import containers from XLSX.

## Stack
- Frontend: Next.js (App Router), TypeScript, Tailwind/shadcn UI.
- Backend: Express, MongoDB (Mongoose), multer + xlsx for imports.

## Prerequisites
- Node.js 18+ and npm.
- MongoDB connection string (Atlas or local).

## Quickstart
1) Backend env:
```bash
cp server/.env.example server/.env
# set MONGODB_URI (and PORT if needed)
```
2) Frontend env:
```bash
cp client/.env.example client/.env
# adjust NEXT_PUBLIC_API_URL if your API isn’t on http://localhost:8080/api
```
3) Install deps:
```bash
cd server && npm install
cd ../client && npm install
```
4) Run:
```bash
# backend
cd server && npm run dev
# frontend (in another shell)
cd client && npm run dev
```
Frontend expects the API at `http://localhost:8080/api` by default.

## Features
- Containers: create/edit/delete (API), optional Container #, required Case Number, assignment to driver/chassis. Dashboard lists terminal containers; Transit Board manages the rest.
- XLSX import: `POST /api/containers/import` with `file` field; preserves sheet row order via `orderIndex` and upserts by `caseNumber` (trigger import from the dashboard).
- Drivers & Chassis: simple CRUD.
- Yards: CRUD plus board grouping for yard containers (loaded vs empty) with yard details shown on each yard card.
- Auth placeholder: `/api/auth/login` stub; UI uses localStorage session.
- Mock mode: set `NEXT_PUBLIC_USE_MOCK_DATA=true` to demo UI without backend.
- Status workflow: containers start in `AT_TERMINAL`, move to `IN_TRANSIT_FROM_TERMINAL`, then `ON_WAY_TO_CUSTOMER` or `ON_WAY_TO_YARD`, through `AT_CUSTOMER_YARD` / `YARDS` (loaded/empty), `EMPTY_AT_CUSTOMER`, `RETURNING_TO_TERMINAL`, and `RETURNED`. Transit Board lets you select a container and move it between stages.

## API (summary)
- Health: `GET /api/health`
- Containers: `GET/POST/PUT/DELETE /api/containers`, `POST /api/containers/import`
- Drivers: `GET/POST /api/drivers`
- Chassis: `GET/POST /api/chassis`
- Yards: `GET/POST/PUT/DELETE /api/yards`
- Auth stub: `POST /api/auth/login`

## Scripts
- Backend: `npm run dev` (nodemon), `npm start`
- Frontend: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`

## Env & safety
- Secrets live in `.env`/`.env.local` (gitignored) under `server/` and `client/`.
- Example envs: `server/.env.example`, `client/.env.example`.
- Do not commit real credentials.
