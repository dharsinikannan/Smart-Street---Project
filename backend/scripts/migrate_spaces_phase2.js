const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // load from backend dir if running from scripts

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting migration for Phase 2 spaces table...');
    await client.query('BEGIN');

    console.log('Creating ENUM space_status...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'space_status') THEN
          CREATE TYPE space_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
        END IF;
      END$$;
    `);

    console.log('Adding columns to spaces table...');
    await client.query(`
      ALTER TABLE spaces 
      ADD COLUMN IF NOT EXISTS chitta_number TEXT,
      ADD COLUMN IF NOT EXISTS chitta_name TEXT,
      ADD COLUMN IF NOT EXISTS aadhar_number TEXT,
      ADD COLUMN IF NOT EXISTS aadhar_name TEXT,
      ADD COLUMN IF NOT EXISTS image_1_url TEXT,
      ADD COLUMN IF NOT EXISTS image_2_url TEXT,
      ADD COLUMN IF NOT EXISTS status space_status NOT NULL DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS terms_conditions TEXT;
    `);

    // For existing spaces, let's mark them as APPROVED so they don't disappear from the UI for testing
    console.log('Marking existing spaces as APPROVED...');
    await client.query(`
      UPDATE spaces SET status = 'APPROVED' WHERE status = 'PENDING';
    `);

    await client.query('COMMIT');
    console.log('Migration successful!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
