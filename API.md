# Regale Hotels — API Reference Outline

Rough shape of the API surface to implement as FastAPI routes (`@app.get`/`@app.post` handlers grouped into routers, with Pydantic request/response models), served from the standalone FastAPI backend consumed by the Nuxt frontend. Not exhaustive — expand as you build.

## Public (guest-facing)

- `GET /api/properties` — list properties, filterable by location/price/amenities
- `GET /api/properties/:slug` — property detail incl. room types
- `GET /api/room-types/:id/availability?checkin=&checkout=` — availability + rate plans for a date range
- `POST /api/bookings` — create a booking (guest checkout supported; body includes guest details, room, dates, payment method choice)
- `POST /api/bookings/:id/payment-intent` — create a Razorpay/Stripe payment session for a booking
- `POST /api/webhooks/razorpay` — payment confirmation webhook (verifies signature, flips booking to `confirmed`)
- `GET /api/bookings/:id` — booking confirmation lookup (by booking id + email/phone verification, not auth-gated)
- `GET /api/testimonials?property=` — approved/featured testimonials for homepage or property page

## Guest account (optional)

- `POST /api/auth/register` — post-booking account creation
- `POST /api/auth/login`
- `GET /api/me/bookings` — authenticated guest's booking history

## Admin (role-gated — every route below must check role + property scope server-side)

- `POST /api/admin/login`
- `GET /api/admin/dashboard` — KPIs; scoped automatically by requesting user's role/property
- `GET /api/admin/properties` — super admin only
- `POST /api/admin/properties` — create property (super admin only)
- `PATCH /api/admin/properties/:id` — edit property
- `POST /api/admin/room-types` / `PATCH /api/admin/room-types/:id`
- `POST /api/admin/rate-plans` / `PATCH /api/admin/rate-plans/:id`
- `GET /api/admin/bookings?property=&status=&date_from=&date_to=` — list/filter bookings
- `POST /api/admin/bookings` — manual booking creation (phone/walk-in)
- `PATCH /api/admin/bookings/:id/confirm` — confirm a `pending_whatsapp` booking
- `PATCH /api/admin/bookings/:id/cancel`
- `POST /api/admin/bookings/:id/refund`
- `GET /api/admin/payments?property=&status=`
- `GET /api/admin/guests/:id`
- `POST /api/admin/users` — create property manager account (super admin only, must set `property_id`)
- `GET /api/admin/reports?type=revenue|occupancy|source&property=&range=`
- `POST /api/admin/testimonials/:id/approve`
- `POST /api/admin/content/hero` — homepage hero/offers content update

## Cross-cutting rules

- Every `/api/admin/*` route: verify session → verify role → if `property_manager`, force-filter the query by their `property_id` regardless of what the client requests. Never trust a `property_id` sent from the client for a scoped user.
- Every write to `bookings` availability must happen inside a DB transaction with row-level locking on the relevant `availability`/`room_types` rows.
- `payments` status is only ever mutated by the webhook handler, never by a direct client-facing endpoint.
