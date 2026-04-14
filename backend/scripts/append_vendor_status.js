const db = require("../config/db");

async function migrate() {
    console.log("Starting vendor status migration (append_vendor_status.js)...");
    try {
        await db.query(`
            ALTER TABLE vendors 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}';
        `);
        console.log("- Added is_active and operating_hours to vendors table.");
        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
