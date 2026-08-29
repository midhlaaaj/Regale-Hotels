# Regale Hotels — Stack Decision: Nuxt Frontend + Neon DB + FastAPI Backend

## 1. The stack, in one line

**Nuxt 3 (Vue) frontend + FastAPI (Python) backend + Neon (serverless Postgres) via SQLAlchemy (async) or SQLModel.**

This crosses languages: Nuxt/Vue on the frontend, Python on the backend, talking over a REST API — a deliberate departure from the single-JS/TS-codebase approach of the earlier Nitro/Hono option, chosen for portfolio range.

## 2. Why Nuxt for the frontend

- You've built several projects on Next.js already (HourHome, EliteWear, and earlier freelance work) — Nuxt gives genuine variety for a portfolio (different framework, different reactivity model — Vue's `ref()`/`reactive()` and template syntax instead of JSX/hooks) while staying conceptually close enough (file-based routing, SSR/SSG per route) that it doesn't cost you a steep new learning curve.
- SEO-friendly by default: SSR out of the box, `useSeoMeta()`/`useHead()` for per-page meta, `@nuxtjs/sitemap` and `@nuxtjs/robots` modules, `@nuxt/image` for responsive/optimized images.
- Supports mixed rendering per route (static for About/Policies, ISR-style for property pages, SSR for live availability, client-rendered for the booking flow and admin panel).

## 3. Why Neon for the database

- Serverless Postgres: scales to zero, no server to manage — good fit for a portfolio project you don't want to pay to keep running 24/7.
- Real Postgres underneath, so your existing Postgres experience (HourHome, EliteWear, freelance projects) carries over directly — only the connection model changes.
- Provides a built-in connection pooler (PgBouncer-style), which matters specifically for the FastAPI pairing below.

## 4. Why FastAPI for the backend

- **Async-native.** FastAPI is built on Python's `asyncio` from the ground up, which pairs naturally with async database drivers (`asyncpg`, or SQLAlchemy's async engine / SQLModel) — important for a booking system where concurrent availability checks are a core correctness requirement, not just a performance nice-to-have.
- **Serverless-deployable.** FastAPI runs cleanly on serverless platforms (Vercel's Python runtime, AWS Lambda via Mangum, etc.), so the "serverless backend + serverless Postgres" pairing established in the earlier Node.js-vs-Nitro/Hono reasoning still holds — the language changed, the architecture principle didn't.
- **Genuine portfolio range.** Unlike staying inside Nitro/Hono (still JS/TS), FastAPI puts a real second language and ecosystem (Python, Pydantic, SQLAlchemy/SQLModel) on your CV alongside the Nuxt frontend — a stronger signal of range for a fresher application than an all-JS stack.
- **Lighter than Django, no fighting connection pooling.** FastAPI doesn't come with Django's batteries-included admin/ORM baggage, so there's less to reconcile with a serverless deployment model — you build auth, the admin API, and role scoping deliberately, which also means demonstrating you can build those pieces yourself rather than relying on generated scaffolding.

### FastAPI ↔ Neon connection specifics
- Use **SQLAlchemy (async engine)** or **SQLModel** (built by the FastAPI author, thinner layer over SQLAlchemy + Pydantic — worth considering since it reduces duplicate schema/validation definitions) with `asyncpg` as the driver.
- Connect through **Neon's pooled connection string** (not the direct/unpooled one) when deploying serverlessly — this routes through Neon's built-in PgBouncer-style pooler, which handles the high connection-churn pattern serverless functions produce far better than a raw unpooled connection would.
- Keep the pool size conservative in serverless deployments (each function instance opens its own pool) — this is the main operational gotcha to watch for as the app scales past a handful of concurrent users.

## 5. What this changes from the earlier plan

The Nitro/Hono doc (`DEVELOPMENT.md`, prior version) explored keeping everything in JS/TS. That reasoning about *why not a traditional long-running Node server* still applies conceptually to FastAPI: the same principle (serverless backend pairs with serverless Postgres; a persistent-connection-pool backend fights it) holds, just implemented in Python instead of avoided by staying in Nitro. `DEVELOPMENT.md` and `API.md` have been updated to reflect FastAPI route conventions (`@app.get`/`@app.post` with Pydantic models) instead of Nitro's `server/api/*.ts` file-based routes — the endpoint list and cross-cutting security rules in `API.md` stay valid, only the implementation syntax changes. `DATABASE.md` has been updated from Drizzle ORM to SQLAlchemy (async) / SQLModel.

## 6. Summary

| Layer | Choice | Why |
|---|---|---|
| Frontend | Nuxt 3 | Genuine framework variety from past Next.js projects, SEO-friendly by default |
| Backend | **FastAPI** | Async-native, serverless-deployable, real cross-language portfolio range |
| Database | Neon (serverless Postgres) | Scales to zero, built-in pooler suited to serverless FastAPI |
| DB access | SQLAlchemy (async) or SQLModel + asyncpg | Async-native, pairs with Neon's pooled connection string |
| Rejected: standalone Node/Express | — | Persistent connection pool model fights serverless Postgres |
| Rejected (for now): Django | — | Batteries-included/sync-first shape fights the serverless-first architecture; FastAPI's async model and lighter footprint fit this stack better |
