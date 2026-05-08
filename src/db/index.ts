// Database client. Returns null if DATABASE_URL is not configured —
// the API routes detect this and respond with 503 so the app falls back
// to localStorage gracefully.

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;

let _db: DB | null = null;
let _attemptedInit = false;

function initDb(): DB | null {
  if (_attemptedInit) return _db;
  _attemptedInit = true;

  const url = process.env.DATABASE_URL;
  if (!url) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[db] DATABASE_URL not set — running in localStorage fallback mode",
      );
    }
    return null;
  }

  // Reuse the underlying connection across hot reloads in dev
  const globalForDb = globalThis as unknown as {
    _pgClient?: ReturnType<typeof postgres>;
  };
  const client =
    globalForDb._pgClient ??
    postgres(url, {
      prepare: false,
      max: 5,
      idle_timeout: 20,
    });
  if (process.env.NODE_ENV !== "production") globalForDb._pgClient = client;

  _db = drizzle(client, { schema });
  return _db;
}

export function getDb(): DB | null {
  return initDb();
}

/** Throws if DB is not configured. Use in routes that require DB. */
export function requireDb(): DB {
  const db = getDb();
  if (!db) {
    throw new Error("DATABASE_NOT_CONFIGURED");
  }
  return db;
}

export { schema };
