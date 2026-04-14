const path = require('path');
const db = require(path.join(__dirname, '..', 'config', 'db'));

async function debug() {
    try {
        // 1. Get ALL requests that are for spaces with owners
        const reqs = await db.query(`
      SELECT sr.request_id, sr.status, sr.vendor_id, sr.space_id, s.owner_id, sr.submitted_at
      FROM space_requests sr
      JOIN spaces s ON s.space_id = sr.space_id
      WHERE s.owner_id IS NOT NULL
      ORDER BY sr.submitted_at DESC
      LIMIT 10
    `);

        console.log("RECENT REQ FOR OWNER SPACES:", reqs.rows);

        if (reqs.rows.length > 0) {
            const ownerId = reqs.rows[0].owner_id;
            // 2. Check notifications for this owner
            const notifs = await db.query(`
        SELECT type, title, created_at, related_request_id FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [ownerId]);

            console.log(`NOTIFICATIONS FOR OWNER ${ownerId}:`, notifs.rows);
        }

        const enums = await db.query(`SELECT unnest(enum_range(NULL::notification_type))`);
        console.log("NOTIFICATION TYPES:", enums.rows.map(r => r.unnest));

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        process.exit(0);
    }
}

debug();
