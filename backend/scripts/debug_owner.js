const path = require('path');
const db = require(path.join(__dirname, '..', 'config', 'db'));

async function debugOwnerNotifs() {
    try {
        // 1. Find the owner who has pending requests
        const owners = await db.query(`
      SELECT DISTINCT s.owner_id, u.name, u.email
      FROM space_requests sr
      JOIN spaces s ON s.space_id = sr.space_id
      JOIN users u ON u.user_id = s.owner_id
      WHERE sr.status = 'OWNER_PENDING'
    `);

        console.log("OWNERS WITH PENDING REQS:", owners.rows);

        if (owners.rows.length > 0) {
            const ownerId = owners.rows[0].owner_id;

            // 2. Check notifications for this owner
            const notifs = await db.query(`
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [ownerId]);

            console.log(`NOTIFICATIONS FOR ${owners.rows[0].name} (${ownerId}):`, notifs.rows);

            // 3. Check if there are any OWNER_SPACE_REQUEST notifications in the system at all
            const allNotifs = await db.query(`
        SELECT * FROM notifications WHERE type = 'OWNER_SPACE_REQUEST' LIMIT 5
      `);
            console.log("SAMPLE OWNER_SPACE_REQUEST NOTIFS:", allNotifs.rows);
        } else {
            console.log("No owners with pending requests found.");
        }

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        process.exit(0);
    }
}

debugOwnerNotifs();
