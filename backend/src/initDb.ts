/** Creates the Postgres schema — equivalent to the old
 * `python -m app.init_db` (SQLModel.metadata.create_all). Table/column names
 * match exactly so the same Neon database keeps working for both the old and
 * new backend during migration. Idempotent: safe to run against an
 * already-initialized database. */
import { pool } from "./db";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    slug VARCHAR NOT NULL UNIQUE,
    city VARCHAR NOT NULL,
    state VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    cover_image_url VARCHAR NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    amenities JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS ix_properties_slug ON properties (slug)`,

  `CREATE TABLE IF NOT EXISTS room_types (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id),
    name VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    max_occupancy INTEGER NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL,
    images JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS ix_room_types_property_id ON room_types (property_id)`,

  `CREATE TABLE IF NOT EXISTS rate_plans (
    id SERIAL PRIMARY KEY,
    room_type_id INTEGER NOT NULL REFERENCES room_types(id),
    name VARCHAR NOT NULL,
    fixed_price NUMERIC(10, 2) NOT NULL,
    refundable BOOLEAN NOT NULL DEFAULT true,
    includes_breakfast BOOLEAN NOT NULL DEFAULT false,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS ix_rate_plans_room_type_id ON rate_plans (room_type_id)`,

  `CREATE TABLE IF NOT EXISTS availability (
    id SERIAL PRIMARY KEY,
    room_type_id INTEGER NOT NULL REFERENCES room_types(id),
    date DATE NOT NULL,
    rooms_available INTEGER NOT NULL,
    CONSTRAINT uq_availability_room_date UNIQUE (room_type_id, date)
  )`,
  `CREATE INDEX IF NOT EXISTS ix_availability_room_type_id ON availability (room_type_id)`,
  `CREATE INDEX IF NOT EXISTS ix_availability_date ON availability (date)`,

  `CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id),
    name VARCHAR NOT NULL,
    nights INTEGER NOT NULL,
    description VARCHAR NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    meal_plan VARCHAR NOT NULL,
    rooms_included INTEGER NOT NULL DEFAULT 1,
    max_guests INTEGER NOT NULL,
    cover_image_url VARCHAR,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS ix_packages_property_id ON packages (property_id)`,
  `CREATE INDEX IF NOT EXISTS ix_packages_active ON packages (active)`,

  `CREATE TABLE IF NOT EXISTS guests (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    has_account BOOLEAN NOT NULL DEFAULT false,
    auth_user_id INTEGER,
    password_hash VARCHAR,
    id_document_url VARCHAR,
    verification_status VARCHAR NOT NULL DEFAULT 'unverified',
    verification_note VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS ix_guests_email ON guests (email)`,
  `CREATE INDEX IF NOT EXISTS ix_guests_verification_status ON guests (verification_status)`,

  `CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id),
    room_type_id INTEGER NOT NULL REFERENCES room_types(id),
    rate_plan_id INTEGER NOT NULL REFERENCES rate_plans(id),
    guest_id INTEGER REFERENCES guests(id),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests_count INTEGER NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending_payment',
    source VARCHAR NOT NULL DEFAULT 'online',
    total_amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS ix_bookings_property_id ON bookings (property_id)`,
  `CREATE INDEX IF NOT EXISTS ix_bookings_room_type_id ON bookings (room_type_id)`,
  `CREATE INDEX IF NOT EXISTS ix_bookings_status ON bookings (status)`,
  `CREATE INDEX IF NOT EXISTS ix_bookings_created_at ON bookings (created_at)`,

  `CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id),
    gateway VARCHAR NOT NULL DEFAULT 'stub',
    gateway_payment_id VARCHAR,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending',
    raw_webhook_payload JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS ix_payments_booking_id ON payments (booking_id)`,
  `CREATE INDEX IF NOT EXISTS ix_payments_status ON payments (status)`,

  `CREATE TABLE IF NOT EXISTS site_content (
    id SERIAL PRIMARY KEY,
    key VARCHAR NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS ix_site_content_key ON site_content (key)`,

  `CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id),
    guest_name VARCHAR NOT NULL,
    guest_location VARCHAR NOT NULL,
    rating INTEGER NOT NULL,
    quote VARCHAR NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT false,
    featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS ix_testimonials_property_id ON testimonials (property_id)`,

  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    role VARCHAR NOT NULL,
    property_id INTEGER REFERENCES properties(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT ck_users_property_scope CHECK (
      (role = 'property_manager' AND property_id IS NOT NULL) OR
      (role = 'super_admin' AND property_id IS NULL)
    )
  )`,
  `CREATE INDEX IF NOT EXISTS ix_users_email ON users (email)`,

  `CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR NOT NULL,
    target_type VARCHAR NOT NULL,
    target_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS ix_activity_log_user_id ON activity_log (user_id)`,
  `CREATE INDEX IF NOT EXISTS ix_activity_log_created_at ON activity_log (created_at)`,
];

async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    for (const statement of STATEMENTS) {
      await client.query(statement);
    }
    console.log("Tables created.");
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  initDb().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { initDb };
