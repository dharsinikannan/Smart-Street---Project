const db = require("../config/db");

async function migrate() {
    console.log("Starting vendor features migration...");
    try {
        // 1. Add storefront fields to vendors table
        await db.query(`
      ALTER TABLE vendors 
      ADD COLUMN IF NOT EXISTS stall_photo TEXT,
      ADD COLUMN IF NOT EXISTS menu_items JSONB DEFAULT '[]';
    `);
        console.log("- Added stall_photo and menu_items to vendors table.");

        // 2. Create vendor_favorites table
        await db.query(`
      CREATE TABLE IF NOT EXISTS vendor_favorites (
        favorite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
        space_id UUID NOT NULL REFERENCES spaces(space_id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(vendor_id, space_id)
      );
    `);
        console.log("- Created vendor_favorites table.");

        // 3. Create index for performance
        await db.query(`
      CREATE INDEX IF NOT EXISTS idx_vendor_favorites_vendor ON vendor_favorites(vendor_id);
    `);
        console.log("- Created index on vendor_favorites(vendor_id).");

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
