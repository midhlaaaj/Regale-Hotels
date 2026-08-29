# Regale Hotels

A portfolio project: a multi-property hotel booking platform for a fictional Indian hotel group (Alleppey, Munnar, Delhi, Goa), with online payments, WhatsApp inquiry, and a single role-based admin panel.

## Docs in this repo

- **[PRD.md](./PRD.md)** — what's being built and why: goals, user roles, core flows, functional/non-functional requirements
- **[DESIGN.md](./DESIGN.md)** — brand direction, "Heritage Ledger" design system (colors/type/components), full sitemap, trust/conversion patterns
- **[STACK_DECISION.md](./STACK_DECISION.md)** — why Nuxt + FastAPI + Neon was chosen over the earlier all-JS Nitro/Hono + Drizzle plan
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** — stack (Nuxt + FastAPI + Neon + SQLAlchemy/SQLModel), rendering strategy per route, build order, testing priorities
- **[DATABASE.md](./DATABASE.md)** — schema outline and key constraints (concurrency-safe booking, role scoping)
- **[API.md](./API.md)** — endpoint outline, public/guest/admin surfaces, cross-cutting security rules

## Quick facts

- **Stack:** Nuxt 3 (Vue) frontend, FastAPI (Python) backend over REST, Neon (serverless Postgres) via SQLAlchemy (async)/SQLModel + asyncpg, Pinia, Razorpay
- **Properties modeled:** 4 — Alleppey (Kerala), Munnar (Kerala), New Delhi, North Goa
- **Admin model:** one app, two roles — super admin (all properties) and property manager (scoped to one property)
- **Booking:** guest checkout by default, optional post-booking account; every room shows both "pay online" and "WhatsApp inquire" as parallel options

## Suggested read order

1. PRD.md — understand what and why
2. DESIGN.md — understand the look, feel, and page structure
3. STACK_DECISION.md — understand why this stack over the earlier all-JS option
4. DEVELOPMENT.md — understand how it gets built and in what order
5. DATABASE.md / API.md — reference while actually writing code

## Running locally

Three services, three terminals:

```bash
# 1. Backend — FastAPI + Neon (http://127.0.0.1:8000, docs at /docs)
cd backend
.venv/Scripts/activate   # or source .venv/bin/activate on macOS/Linux
uvicorn app.main:app --reload --reload-dir app --port 8000

# 2. Customer site — Nuxt (http://localhost:3000)
cd frontend
npm run dev -- --port 3000

# 3. Admin panel — Nuxt, SPA (http://localhost:3001)
cd admin
npm run dev -- --port 3001
```

First-time backend setup: create `backend/.env` from `backend/.env.example` with your Neon **pooled** connection string, then `python -m app.init_db` to create tables and `python -m app.seed` to load the 4 properties, rooms, rates, testimonials, and two demo admin accounts (shown on the admin login screen).

## Status

- **Backend** (`backend/`): built and seeded — properties, rooms, rate plans, availability, bookings (concurrency-safe, row-locked), guests, payments (stubbed — no real Razorpay yet), testimonials, and the full admin surface (JWT auth, property-manager scoping enforced server-side).
- **Customer site** (`frontend/`): built — home, properties list/detail, room detail, booking flow (details → stub payment or WhatsApp → confirmation), my-bookings lookup, gallery, contact, about, offers, policies. All pulling real data from the backend.
- **Admin panel** (`admin/`): built — login, dashboard, bookings, WhatsApp inquiries queue, rooms & rates, guests, reports, and settings (staff accounts + testimonial approval), role-scoped between super admin and property manager.
- **Not yet done**: real Razorpay checkout + webhook (currently a "confirm-stub" endpoint standing in for it), guest self-service accounts, and a full responsive/accessibility QA pass.

The original UI reference lives in `Regale Site.dc.html` (customer site) and `Regale Admin.dc.html` (admin panel) — both were used as the source of truth for structure, copy, and the Heritage Ledger design system while building the two Nuxt apps.
