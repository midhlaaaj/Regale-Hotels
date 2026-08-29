# Regale Hotels — Development Plan

## 1. Stack

See [STACK_DECISION.md](./STACK_DECISION.md) for the full reasoning behind this stack (Nuxt + FastAPI + Neon, chosen over the earlier all-JS Nitro/Hono + Drizzle plan for cross-language portfolio range).

| Layer | Choice | Notes |
|---|---|---|
| Frontend framework | **Nuxt 3** (Vue) | File-based routing, SSR/SSG mixed per route, replaces the Next.js stack used on past projects |
| Backend | **FastAPI** (Python), standalone service | REST API consumed by the Nuxt frontend. Routes as `@app.get`/`@app.post` handlers with Pydantic request/response models. Deployed separately from the frontend (Vercel Python runtime or AWS Lambda via Mangum). |
| Database | **Neon** (serverless Postgres) | Connect through Neon's **pooled** connection string (PgBouncer-style) — required for the high connection-churn pattern serverless FastAPI instances produce. Keep per-instance pool size conservative. |
| DB access | **SQLAlchemy (async engine)** or **SQLModel** + `asyncpg` | Async-native, pairs with FastAPI's `asyncio` model; SQLModel (same author as FastAPI) also unifies ORM models with Pydantic validation |
| State management | **Pinia** | Vue's standard store, used where client-side state is needed (booking flow state, admin filters) |
| Payments | **Razorpay** (primary), Stripe optional | Webhook-driven confirmation, not client-callback-driven |
| Messaging | **WhatsApp deep link** (`wa.me`) for v1 | WhatsApp Business API integration is a possible v2 upgrade, not required for portfolio scope |
| Hosting | Nuxt on Vercel/Netlify; FastAPI on Vercel's Python runtime or a container host | Both sides serverless-friendly, pairs with Neon's pooled connection model |
| SEO | `useSeoMeta()`/`useHead()`, `@nuxtjs/sitemap`, `@nuxtjs/robots`, `@nuxt/image` | |

### Why this stack
- Neon's pooled connection string performs best when paired with a stateless/serverless backend — a standalone async FastAPI service avoids the connection-pooling problems a traditional long-running Express/Django server would introduce with serverless Postgres.
- Nuxt mirrors Next.js's structure closely enough (file routing, SSR/SSG, API routes) that the *concepts* carry over even though the syntax (Vue templates vs JSX, `ref()`/`reactive()` vs `useState`) is new — intentional, since the goal is to broaden skills without starting from zero.
- Splitting the backend into Python/FastAPI (rather than staying in Nitro/Hono, both still JS/TS) is a deliberate cross-language choice for portfolio range — see [STACK_DECISION.md](./STACK_DECISION.md) section 4.

## 2. Rendering strategy per route

| Route type | Rendering | Reasoning |
|---|---|---|
| Home, About, Policies, Offers | Static generation (SSG) | Content changes rarely, best for SEO and speed |
| Property detail, Gallery | SSG with periodic revalidation (ISR-style) | Content updates occasionally (new photos, room changes) |
| Room detail, availability calendar | SSR | Needs live data at request time |
| Booking flow, My Bookings | Client-rendered behind SSR shell | Genuinely dynamic/interactive, not SEO-relevant |
| Admin panel (entire app) | Client-rendered, SSR shell only for auth gate | Not indexed, operational tool — favor interactivity over SEO |

## 3. Data model concerns to build in from day one

- **Multi-tenant schema:** hotels, room types, rate plans, and availability calendars as separate linked entities — not flattened, since one company owns multiple properties.
- **Booking concurrency:** use database-level transactions/row locking on availability checks so two guests can't book the same room/date simultaneously. This is the single highest-risk area — test it explicitly with concurrent requests before considering booking "done."
- **Booking status states:** at minimum `pending_payment`, `confirmed`, `pending_whatsapp`, `cancelled`, `refunded` — the WhatsApp path and the pay-online path produce different states and need different admin actions.
- **Role scoping at the query level:** every admin API query for property-scoped data must filter by the authenticated user's assigned property (for property managers) — never rely on the frontend alone to hide other properties' data.

## 4. Backend architecture: standalone FastAPI service

The backend is a standalone FastAPI service, deployed and scaled independently from the Nuxt frontend, talking over a REST API. This is a deliberate departure from keeping everything inside Nitro (single JS/TS codebase) — see [STACK_DECISION.md](./STACK_DECISION.md) for the full reasoning (async-native fit for concurrency-sensitive booking logic, serverless-deployable, genuine cross-language portfolio range).

Structure the FastAPI app with routers grouped by surface (`public`, `guest-account`, `admin` — mirroring the sections in [API.md](./API.md)), Pydantic models for request/response validation, and SQLAlchemy async sessions (or SQLModel) injected per-request via FastAPI's dependency system.

## 5. Suggested build order

1. **Data layer first:** SQLAlchemy/SQLModel models for hotels, rooms, rate plans, bookings, guests, users/roles — migrate to Neon, seed with the 3–4 fictional properties.
2. **Auth + role-based access:** admin login, super admin vs property manager scoping, tested against the seeded data before any UI is built on top.
3. **Booking core:** availability check + concurrency-safe booking creation, tested via API/script before wiring up UI.
4. **Payment integration:** Razorpay checkout + webhook handler that flips booking status on confirmed payment.
5. **Customer-facing UI:** Home → Properties → Property detail → Room detail → Booking flow, using the Claude Design UI (`Regale Site.dc.html`) as the design source of truth.
6. **Admin panel UI:** Dashboard → Bookings → Payments → Properties/Content management, in that order of priority, using the Claude Design admin UI (`Regale Admin.dc.html`) as the design source of truth.
7. **Polish pass:** responsive QA, accessibility pass (alt text, keyboard nav, reduced-motion), performance pass (image optimization, lazy loading).

## 6. Testing priorities (given portfolio time constraints)

Focus testing effort where correctness actually matters for the story you're telling:
- Concurrent booking attempts on the same room/date (the double-booking hurdle)
- Payment webhook handling, including a simulated failed/abandoned payment
- Role-based access — confirm a property manager account genuinely cannot fetch another property's data via direct API calls, not just that the UI hides it

Skip exhaustive UI testing/e2e coverage unless you have time left over — for a portfolio project, a working, correctly-scoped backend matters more to a technical reviewer than 100% test coverage.
