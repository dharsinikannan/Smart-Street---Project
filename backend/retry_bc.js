const blockchainService = require("./services/blockchainService");
const db = require("./config/db");
require("dotenv").config();

async function fix() {
  try {
     const res = await db.query("SELECT permit_id, valid_from, request_id FROM permits ORDER BY issued_at DESC LIMIT 1");
     const permit = res.rows[0];
     
     // Need vendor_id to reconstruct the hash string
     const reqRes = await db.query("SELECT vendor_id FROM space_requests WHERE request_id = $1", [permit.request_id]);
     const vendorId = reqRes.rows[0].vendor_id;
     
     const uniqueString = `${permit.permit_id}-${permit.valid_from}-${vendorId}`;
     console.log("Retrying Blockchain Write for:", uniqueString);
     
     const txHash = await blockchainService.recordPermitOnChain(uniqueString);
     console.log("New Hash:", txHash);
     
     if (txHash) {
         await db.query("UPDATE permits SET transaction_hash = $1 WHERE permit_id = $2", [txHash, permit.permit_id]);
         console.log("DB Updated");
     }
  } catch (err) {
    console.error("Retry failed:", err);
  } finally {
    process.exit();
  }
}

fix();
