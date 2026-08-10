import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { env } from './config.js';

export const pool = new Pool({ connectionString: env.DATABASE_URL, max: 20, idleTimeoutMillis: 30_000, statement_timeout: 10_000, ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined });
export async function withUser<T>(userId: string, work: (db: PoolClient) => Promise<T>): Promise<T> {
  const db = await pool.connect();
  try { await db.query('BEGIN'); await db.query("SELECT set_config('app.user_id', $1, true)", [userId]); const result = await work(db); await db.query('COMMIT'); return result; }
  catch (error) { await db.query('ROLLBACK'); throw error; }
  finally { db.release(); }
}
export async function one<T extends QueryResultRow>(db: PoolClient, query: string, values: unknown[] = []): Promise<T> { const result = await db.query<T>(query, values); if (result.rowCount !== 1) throw new Error('Expected exactly one row'); return result.rows[0]; }
