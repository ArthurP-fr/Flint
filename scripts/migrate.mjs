import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadEnv } from "dotenv";
import { Pool } from "pg";

const LOCK_CLASS_ID = 9421;
const LOCK_OBJECT_ID = 2601;

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || String(value).trim().length === 0) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
};

const optionalString = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const sha256 = (content) => createHash("sha256").update(content).digest("hex");

const listMigrationFiles = async (migrationsDir) => {
  const entries = await readdir(migrationsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && /^\d+.*\.sql$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
};

const loadMigrations = async (migrationsDir) => {
  const files = await listMigrationFiles(migrationsDir);
  if (files.length === 0) {
    throw new Error(`[migrate] no SQL migration files found in ${migrationsDir}`);
  }

  const migrations = [];
  for (const fileName of files) {
    const filePath = path.join(migrationsDir, fileName);
    const sql = await readFile(filePath, "utf8");

    migrations.push({
      fileName,
      sql,
      checksum: sha256(sql),
    });
  }

  return migrations;
};

const ensureMigrationTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
};

const applyMigrations = async (client, migrations) => {
  const appliedResult = await client.query(
    "SELECT version, checksum FROM schema_migrations ORDER BY version ASC",
  );

  const appliedByVersion = new Map(
    appliedResult.rows.map((row) => [String(row.version), String(row.checksum)]),
  );

  const migrationFileNames = new Set(migrations.map((entry) => entry.fileName));

  for (const version of appliedByVersion.keys()) {
    if (!migrationFileNames.has(version)) {
      throw new Error(
        `[migrate] migration history drift detected: database has version \"${version}\" but file is missing locally.`,
      );
    }
  }

  let appliedCount = 0;
  let skippedCount = 0;

  for (const migration of migrations) {
    const existingChecksum = appliedByVersion.get(migration.fileName);

    if (existingChecksum) {
      if (existingChecksum !== migration.checksum) {
        throw new Error(
          `[migrate] checksum mismatch for ${migration.fileName}. Expected ${existingChecksum}, got ${migration.checksum}.`,
        );
      }

      skippedCount += 1;
      continue;
    }

    await client.query("BEGIN");

    try {
      await client.query(migration.sql);
      await client.query(
        "INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)",
        [migration.fileName, migration.checksum],
      );
      await client.query("COMMIT");
      appliedCount += 1;
      console.log(`[migrate] applied ${migration.fileName}`);
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw new Error(`[migrate] failed while applying ${migration.fileName}`, { cause: error });
    }
  }

  console.log(`[migrate] completed. applied=${appliedCount}, skipped=${skippedCount}`);
};

const main = async () => {
  loadEnv();

  const databaseUrl = optionalString(process.env.DATABASE_URL);
  if (!databaseUrl) {
    throw new Error("[migrate] DATABASE_URL is required");
  }

  const databaseSsl = parseBoolean(process.env.DATABASE_SSL, false);
  const rejectUnauthorized = parseBoolean(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED, true);
  const allowInsecureDbSsl = parseBoolean(process.env.ALLOW_INSECURE_DB_SSL, false);

  if (databaseSsl && !rejectUnauthorized && !allowInsecureDbSsl) {
    throw new Error(
      "[migrate] insecure TLS configuration blocked. Set DATABASE_SSL_REJECT_UNAUTHORIZED=true or ALLOW_INSECURE_DB_SSL=true for non-production use.",
    );
  }

  const databaseSslCa = optionalString(process.env.DATABASE_SSL_CA)?.replace(/\\n/g, "\n");

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(scriptDir, "..");
  const migrationsDir = path.join(rootDir, "database", "migrations");

  const migrations = await loadMigrations(migrationsDir);

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseSsl
      ? {
        rejectUnauthorized,
        ...(databaseSslCa ? { ca: databaseSslCa } : {}),
      }
      : undefined,
  });

  const client = await pool.connect();

  try {
    await client.query("SELECT pg_advisory_lock($1, $2)", [LOCK_CLASS_ID, LOCK_OBJECT_ID]);
    await ensureMigrationTable(client);
    await applyMigrations(client, migrations);
  } finally {
    await client.query("SELECT pg_advisory_unlock($1, $2)", [LOCK_CLASS_ID, LOCK_OBJECT_ID]).catch(() => undefined);
    client.release();
    await pool.end();
  }
};

main().catch((error) => {
  console.error("[migrate] fatal", error);
  process.exit(1);
});
