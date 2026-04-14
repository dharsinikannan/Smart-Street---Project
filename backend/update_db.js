const db = require('./config/db');

async function updateSchema() {
  try {
    console.log('Adding transaction_hash column to permits table...');
    await db.query(`
      ALTER TABLE permits 
      ADD COLUMN IF NOT EXISTS transaction_hash TEXT;
    `);
    console.log('Schema updated successfully.');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    process.exit();
  }
}

updateSchema();
