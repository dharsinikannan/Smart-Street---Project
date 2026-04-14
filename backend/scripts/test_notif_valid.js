const path = require('path');
const db = require(path.join(__dirname, '..', 'config', 'db'));
const notificationService = require(path.join(__dirname, '..', 'services', 'notificationService'));

async function testNotifValid() {
    try {
        // Get valid owner user ID and request ID
        const data = await db.query(`
      SELECT 
        sr.request_id, 
        s.owner_id AS space_owner_pk, 
        o.user_id AS owner_user_id
      FROM space_requests sr
      JOIN spaces s ON s.space_id = sr.space_id
      JOIN owners o ON o.owner_id = s.owner_id
      LIMIT 1
    `);

        if (data.rows.length === 0) {
            console.log("No valid data found to test");
            return;
        }

        const { request_id, owner_user_id } = data.rows[0];
        console.log(`Testing with Request: ${request_id}, Owner User: ${owner_user_id}`);

        const result = await notificationService.createOwnerSpaceRequestNotification(
            owner_user_id,
            request_id,
            "Test Business",
            "Test Space"
        );
        console.log("Notification created:", result);

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        process.exit(0);
    }
}

testNotifValid();
