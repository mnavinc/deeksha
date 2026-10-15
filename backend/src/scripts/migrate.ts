import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db.js';

async function runMigrations() {
  let directory = fileURLToPath(new URL('../../db/migrations/', import.meta.url).href);
  if (!existsSync(directory)) {
    const cwdCandidate = resolve(process.cwd(), 'db/migrations');
    if (existsSync(cwdCandidate)) {
      directory = cwdCandidate;
    } else {
      throw new Error(`Migrations directory not found at ${directory} or ${cwdCandidate}`);
    }
  }

  const migrations = (await readdir(directory)).filter((f) => f.endsWith('.sql')).sort();

  await pool.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())'
  );

  // Auto-detect pre-existing tables if the database was initialized without migration tracking
  const tableCheck = async (table: string): Promise<boolean> => {
    const res = await pool.query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1",
      [table]
    );
    return (res.rowCount ?? 0) > 0;
  };

  const legacyTableMap: Record<string, string> = {
    users: '001_initial.sql',
    roles: '002_enterprise_identity_rbac_progression.sql',
    group_messages: '004_social_realtime_group_governance.sql',
    store_products: '005_store_orders_donations_compliance.sql',
    email_otp_codes: '006_email_otp_and_daily_checkin_logs.sql',
  };

  for (const [table, migrationName] of Object.entries(legacyTableMap)) {
    if (await tableCheck(table)) {
      await pool.query(
        'INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [migrationName]
      );
    }
  }

  for (const name of migrations) {
    const applied = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
    if (applied.rowCount && applied.rowCount > 0) continue;

    console.log(`Applying migration: ${name}...`);
    const sql = await readFile(join(directory, name), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [name]
      );
      await client.query('COMMIT');
      console.log(`✓ Applied ${name}`);
    } catch (e) {
      await client.query('ROLLBACK');
      console.error(`✗ Error applying migration ${name}:`, e);
      throw e;
    } finally {
      client.release();
    }
  }

  console.log('✓ All database migrations applied successfully.');
}

runMigrations()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Migration execution failed:', err);
    await pool.end();
    process.exit(1);
  });
