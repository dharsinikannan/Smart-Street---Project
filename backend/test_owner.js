const db = require('./config/db');

async function test() {
    try {
        const ownerId = 'bbe4e835-a195-4536-aab30-02ad9f5c4770'; // hardcoded example
        const result = await db.query(`
      SELECT
        o.owner_id,
        o.owner_name,
        o.contact_info,
        o.created_at,
        u.email,
        u.phone AS phone_number,
        u.name AS user_name,
        (SELECT COUNT(*) FROM spaces s WHERE s.owner_id = o.owner_id) AS total_spaces,
        (SELECT COALESCE(SUM(sr.total_price), 0) FROM space_requests sr JOIN spaces s ON s.space_id = sr.space_id WHERE s.owner_id = o.owner_id AND sr.status = 'APPROVED') AS total_revenue
      FROM owners o
      JOIN users u ON u.user_id = o.user_id
        LIMIT 1
    `);
        console.log("OWNER:", result.rows[0]);
    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        process.exit();
    }
}

test();
