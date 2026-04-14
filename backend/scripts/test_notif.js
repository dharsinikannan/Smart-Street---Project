const path = require('path');
const db = require(path.join(__dirname, '..', 'config', 'db'));
const notificationService = require(path.join(__dirname, '..', 'services', 'notificationService'));

async function testNotif() {
    try {
        // Get an owner user ID
        const owners = await db.query("SELECT user_id, owner_id FROM owners LIMIT 1");
        if (owners.rows.length === 0) {
            console.log("No owners found");
            return;
        }
        const userId = owners.rows[0].user_id;
        console.log("Testing notification for owner user ID:", userId);

        // Create a fake notification
        const result = await notificationService.createOwnerSpaceRequestNotification(
            userId,
            "test-request-id", // random string, hopefully request_id is not enforced as UUID in db unless it's a FK constraint!
            // Wait, related_request_id IS a FK? Let's check schema for notifications
            "Test Business",
            "Test Space"
        );
        console.log("Result:", result);

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        process.exit(0);
    }
}

testNotif();
