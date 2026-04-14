const path = require('path');
const db = require(path.join(__dirname, '..', 'config', 'db'));

async function checkEnum() {
    try {
        const enums = await db.query(`SELECT unnest(enum_range(NULL::notification_type))`);
        console.log("ALL NOTIFICATION TYPES:", enums.rows.map(r => r.unnest));
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        process.exit(0);
    }
}

checkEnum();
