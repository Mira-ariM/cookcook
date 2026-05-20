// Database migration runner — reads and executes schema.sql
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/mealbuddy';

async function migrate() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf-8'
    );

    console.log('Running migration...');
    await client.query(sql);
    console.log('Migration complete.');

    // Verify tables
    const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log('Tables created:', rows.map(r => r.table_name).join(', '));
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
