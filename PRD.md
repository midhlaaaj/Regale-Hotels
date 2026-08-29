# Regale Hotels — Product Requirements Document

## 1. Overview

**Project name:** Regale Hotels
**Type:** Portfolio project — multi-property hotel booking platform
**Elevator pitch:** A direct-booking website for a fictional Indian hotel group with 3–4 boutique properties (Alleppey, Munnar, Delhi, Goa), letting guests book and pay online or inquire via WhatsApp, backed by a single role-based admin panel that manages all properties from one login.

## 2. Goals

- Demonstrate a full-stack, production-shaped booking system: real-time availability, payment integration, and an operational admin panel — not just a marketing site with a contact form.
- Show strong visual/UX design sensibility (image-heavy, conversion-aware, mobile-first).
- Be usable as a portfolio case study and CV project entry.

## 3. Non-goals (for v1)

- Real payment processing at scale / real money — Razorpay/Stripe integration will run in test/sandbox mode.
- OTA channel-manager integrations (Booking.com, Expedia, etc.) — out of scope.
- Loyalty programs, multi-currency, multi-language.

## 4. Users & roles

| Role | Description |
|---|---|
| **Guest** | Browses properties, books a room (pay online or WhatsApp inquiry), optionally creates an account after booking. No login required to book. |
| **Property Manager** | Logs into the shared admin panel; view is scoped to their one assigned property only. Manages bookings, confirms WhatsApp inquiries, updates room/rate info for their property. |
| **Super Admin** | Sees all properties, cross-property KPIs and reports, creates/edits properties, creates property manager accounts, manages content (testimonials, offers, gallery). |

## 5. Core user flows

### 5.1 Guest booking flow
1. Guest lands on Home → searches by location/dates/guests, or browses the property collection.
2. Views a property detail page → selects a room.
3. Room detail page shows rate plans and availability.
4. Guest proceeds to booking: enters dates/guests → guest details → chooses **Pay online** (Razorpay/Stripe) or **Inquire on WhatsApp** — both always shown together, never one hidden behind the other.
5a. **Pay online path:** completes payment → booking auto-confirmed → confirmation page + email.
5b. **WhatsApp path:** redirected to a pre-filled WhatsApp message to the property → booking created in "pending WhatsApp" status → staff manually confirms in admin panel.
6. Optional: guest is prompted to create an account after booking completes (never before).

### 5.2 Admin flow (property manager)
1. Logs in → dashboard scoped to their property only.
2. Views today's bookings, pending WhatsApp inquiries, occupancy.
3. Confirms/rejects WhatsApp bookings, manages room inventory and rates, handles cancellations/refunds for their property.

### 5.3 Admin flow (super admin)
1. Logs in → cross-property dashboard with a property switcher (including "all properties" view).
2. Creates/edits properties and room types, creates property manager accounts (assigns them to one property).
3. Reviews cross-property reports (revenue, occupancy, booking source), manages homepage content and testimonials.

## 6. Functional requirements

### Customer-facing site
- Property search/filter by location, price, amenities
- Property detail pages with gallery, amenities, map, room list, property-specific reviews
- Room detail with rate plans and live availability
- Booking flow: dates/guests → room/rate → guest details → payment or WhatsApp → confirmation
- Guest checkout by default; optional account creation post-booking; "My Bookings" for account holders
- Testimonials shown on homepage (light strip) and on property pages (fuller reviews), plus a trust indicator near the booking CTA
- Persistent WhatsApp contact option on every booking-relevant screen
- Fully responsive/mobile-first, thumb-reachable booking CTA on mobile

### Admin panel
- Single application, role-based access control (super admin vs property manager), enforced in both UI and API — a property manager must not be able to access another property's data even by guessing an ID in a URL
- Booking calendar and list view, manual booking creation, confirm/reject WhatsApp inquiries, cancel/modify/refund
- Payment transaction log and refund initiation
- Property, room type, and rate plan management (super admin)
- Guest profiles and booking history
- Content management: hero content, offers, testimonials, gallery
- Staff/user management and activity log (super admin)
- Reports: revenue, occupancy, booking source, cancellation rate, exportable as CSV
- Notifications: new booking, payment failure, low availability, WhatsApp inquiry alerts

## 7. Non-functional requirements

- **Concurrency correctness:** no double-booking of the same room/date, enforced at the database transaction level.
- **Payment integrity:** booking confirmation must be driven by payment gateway webhook confirmation, not just the client-side success callback.
- **Performance:** image-heavy pages must stay fast on mobile (responsive images, lazy loading) — target under ~3 seconds to first meaningful content.
- **Security:** role-based access control enforced server-side; PCI-relevant payment data never touches the app's own database (handled by Razorpay/Stripe directly).
- **Accessibility:** keyboard-navigable, proper `alt` text on all images, respects `prefers-reduced-motion` for hero slideshows/animations.

## 8. Success criteria (portfolio context)

- A guest can complete a full booking (pay-online path) end to end without errors.
- A guest can submit a WhatsApp inquiry and have it appear as a pending booking in the admin panel.
- A property manager cannot see or act on another property's bookings.
- The homepage and property pages hold together as a coherent, non-templated visual case study.

## 9. Open questions / to revisit

- Final scope on payment gateway: Razorpay only, or both Razorpay and Stripe?
- Whether "My Bookings" ships in v1 or is deferred (guest checkout works without it).
- Whether a blog/SEO content section is worth the added scope for a portfolio project.
