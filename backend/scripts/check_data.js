const path = require('path');
const db = require(path.join(__dirname, '..', 'config', 'db'));

async function checkData() {
    try {
        const owners = await db.query("SELECT owner_id, user_id FROM owners LIMIT 5");
        console.log("OWNERS:", owners.rows);

        const spaces = await db.query("SELECT space_id, owner_id FROM spaces WHERE owner_id IS NOT NULL LIMIT 5");
        console.log("SPACES:", spaces.rows);

        // Check if spaces.owner_id matches any owners.owner_id
        if (spaces.rows.length > 0) {
            const soid = spaces.rows[0].owner_id;
            const matchOwner = await db.query("SELECT * FROM owners WHERE owner_id = $1", [soid]);
            console.log(`Spaces.owner_id ${soid} matches owners.owner_id?`, matchOwner.rows.length > 0);

            const matchUser = await db.query("SELECT * FROM users WHERE user_id = $1", [soid]);
            console.log(`Spaces.owner_id ${soid} matches users.user_id?`, matchUser.rows.length > 0);
        }

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        process.exit(0);
    }
}

checkData();
