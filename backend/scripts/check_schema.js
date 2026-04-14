const path = require('path');
const db = require(path.join(__dirname, '..', 'config', 'db'));

async function checkSchema() {
    try {
        const spacesCols = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'spaces'");
        console.log("SPACES COLUMNS:", spacesCols.rows.map(r => r.column_name));

        const ownersCols = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'owners'");
        console.log("OWNERS COLUMNS:", ownersCols.rows.map(r => r.column_name));

        // Check FK constraints
        const fks = await db.query(`
      SELECT
        tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('spaces', 'owners')
    `);

        fks.rows.forEach(r => {
            console.log(`${r.table_name}.${r.column_name} -> ${r.foreign_table_name}.${r.foreign_column_name}`);
        });

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        process.exit(0);
    }
}

checkSchema();
