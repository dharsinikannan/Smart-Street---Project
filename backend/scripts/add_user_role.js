const db = require("../config/db");

async function migrate() {
  try {
    console.log("Updating user_role enum...");
    await db.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'USER'");
    console.log("Enum updated successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
