const db = require("./config/db");

async function dropConstraint() {
  try {
    console.log("Dropping UNIQUE constraint on user_id in vendors table...");
    await db.query(`ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_user_id_key;`);
    console.log("Constraint dropped successfully.");
  } catch (err) {
    console.error("Error dropping constraint:", err);
  } finally {
    process.exit(0);
  }
}

dropConstraint();
