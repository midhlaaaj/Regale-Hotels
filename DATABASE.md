# Regale Hotels — Database Schema Outline

Postgres (Neon), accessed from the FastAPI backend via SQLAlchemy (async engine) or SQLModel with the `asyncpg` driver, through Neon's pooled connection string. This is a starting structure to refine once you begin writing actual model/schema files — not a final migration. See [STACK_DECISION.md](./STACK_DECISION.md) for why this replaced the earlier Drizzle ORM plan.

## Core tables

**properties**
- id, name, slug, city, state, description, cover_image_url, latitude, longitude, amenities (jsonb or join table), created_at, updated_at

**room_types**
- id, property_id (FK → properties), name, description, max_occupancy, base_price, images (jsonb or join table), created_at, updated_at

**rate_plans**
- id, room_type_id (FK → room_types), name (e.g. "Refundable", "Non-refundable + breakfast"), price_modifier or fixed_price, refundable (bool), includes_breakfast (bool), valid_from, valid_to

**availability**
- id, room_type_id (FK), date, rooms_available (int)
- Alternative: a `bookings`-derived availability check via aggregate query instead of a separate table — decide based on how many rooms per type (small numbers favor a simple availability table with row locking).

**bookings**
- id, property_id (FK), room_type_id (FK), rate_plan_id (FK), guest_id (FK, nullable if guest checkout), check_in, check_out, guests_count, status (`pending_payment` | `confirmed` | `pending_whatsapp` | `cancelled` | `refunded`), source (`online` | `whatsapp` | `manual`), total_amount, created_at, updated_at

**guests**
- id, name, email, phone, has_account (bool), auth_user_id (FK, nullable), created_at

**payments**
- id, booking_id (FK), gateway (`razorpay` | `stripe`), gateway_payment_id, amount, status (`pending` | `succeeded` | `failed` | `refunded`), raw_webhook_payload (jsonb, for audit), created_at

**users** (admin/staff accounts)
- id, name, email, password_hash (or auth-provider id), role (`super_admin` | `property_manager`), property_id (FK, nullable — null for super_admin, required for property_manager), created_at

**testimonials**
- id, property_id (FK, nullable — null means homepage-general), guest_name, guest_location, rating, quote, approved (bool), featured (bool), created_at

**activity_log**
- id, user_id (FK), action, target_type, target_id, created_at

## Key constraints to enforce

- A `property_manager` user must always have a non-null `property_id`; a `super_admin` should not.
- Every admin-facing query that touches `bookings`, `room_types`, `rate_plans`, or `payments` must join through `property_id` and filter by the requesting user's assigned property when the role is `property_manager` — enforced in the API layer, not just the UI.
- Booking creation must run inside a transaction that checks/decrements availability atomically to prevent double-booking — this is the most important constraint in the whole schema.
- `payments.status` should only ever be updated by a webhook handler verifying the gateway's signature, never by a client-facing endpoint directly.
