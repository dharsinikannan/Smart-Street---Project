require("dotenv").config();
const db = require("./config/db");

async function check() {
  try {
    const res = await db.query("SELECT permit_id, transaction_hash, qr_payload FROM permits ORDER BY issued_at DESC LIMIT 1");
    console.log("Latest Permit:", res.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
