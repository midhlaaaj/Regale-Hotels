import { Pool, PoolClient, types } from "pg";
import { settings } from "./config";

// node-pg returns NUMERIC columns as strings by default (to avoid float
// precision surprises) — every price field in this API is meant to reach the
// frontend as a real JSON number (the Python backend explicitly cast
// Decimal -> float for the same reason), so parse them eagerly here instead
// of doing it ad-hoc in every route.
const NUMERIC_OID = 1700;
types.setTypeParser(NUMERIC_OID, (value: string) => (value === null ? null : parseFloat(value)));

// DATE columns come back from pg-node as JS Date objects in local time by
// default, which then serialize with a timezone shift. Keep them as the
// plain 'YYYY-MM-DD' string Postgres sends over the wire, matching Python's
// `date.isoformat()`.
const DATE_OID = 1082;
types.setTypeParser(DATE_OID, (value: string) => value);

// Neon (and most poolers) require TLS. Local Postgres typically doesn't
// advertise it, so only require SSL when the target host isn't local —
// mirrors the intent of the old asyncpg SSLContext setup without needing an
// equivalent to the Vercel/uvloop workaround (Node has no uvloop; the
// underlying libpq-less `pg` driver doesn't hit that class of sandbox bug).
const isLocalHost = /localhost|127\.0\.0\.1/.test(settings.databaseUrl);

export const pool = new Pool({
  connectionString: settings.databaseUrl,
  ssl: isLocalHost ? undefined : { rejectUnauthorized: false },
  max: 5,
  // Neon-style poolers silently drop idle connections server-side; keep
  // connections short-lived so a stale one is never handed back out to a query.
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => {
  // A background/idle client dying (e.g. the pooler closing it) must not crash
  // the whole process — the pool discards it and issues a fresh one on next use.
  console.error("Unexpected error on idle PG client", err);
});

/** Run `fn` inside a BEGIN/COMMIT transaction on a dedicated client, rolling
 * back on any thrown error. Use this (not the shared pool) for any write path
 * that needs multiple statements to be atomic or that takes row locks. */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore rollback failure, original error is what matters */
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function query<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
