import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db.js';

const directory = fileURLToPath(new URL('../../db/migrations/', import.meta.url).href);
const migrations = (await readdir(directory)).filter((f) => f.endsWith('.sql')).sort();

await pool.query(
  'CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())'
);

for (const name of migrations) {
  const applied = await pool.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name]);
  if (applied.rowCount) continue;

  const sql = await readFile(join(directory, name), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]);
    await client.query('COMMIT');
    console.log(`Applied ${name}`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

await pool.end();
