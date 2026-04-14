const db = require('../config/db');

async function migrate() {
    try {
        console.log('Adding price_per_radius to spaces table...');
        await db.query(`
      ALTER TABLE spaces 
      ADD COLUMN IF NOT EXISTS price_per_radius FLOAT8 NOT NULL DEFAULT 0;
    `);

        console.log('Adding total_price to space_requests table...');
        await db.query(`
      ALTER TABLE space_requests 
      ADD COLUMN IF NOT EXISTS total_price FLOAT8 NOT NULL DEFAULT 0;
    `);

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
