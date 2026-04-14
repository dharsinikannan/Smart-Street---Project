require("dotenv").config();
const db = require("../config/db");

const reset = async () => {
  console.log("🔥 Resetting database data...");
  try {
    // Truncate all tables and cascade
    await db.query(`
      TRUNCATE TABLE 
        users, 
        vendors, 
        owners, 
        spaces, 
        space_requests, 
        permits, 
        notifications, 
        audit_logs 
      RESTART IDENTITY CASCADE;
    `);
    console.log("✅ All data wiped successfully.");
  } catch (err) {
    console.error("❌ Reset failed:", err.message);
  } finally {
    db.pool.end();
  }
};

reset();
