const db = require('./config/db');

async function test() {
    try {
        const ownerId = 'bbe4e835-a195-4536-aab30-02ad9f5c4770';
        const spacesResult = await db.query(`
      SELECT space_id, space_name, address, base_price, allowed_radius, status, created_at,
             (SELECT COALESCE(SUM(total_price), 0) FROM space_requests WHERE space_id = spaces.space_id AND status = 'APPROVED') AS revenue
      FROM spaces
      WHERE owner_id = $1
      ORDER BY created_at DESC
    `, [ownerId]);
        console.log("SPACES:", spacesResult.rows);
    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        process.exit();
    }
}

test();
