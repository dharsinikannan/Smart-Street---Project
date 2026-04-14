/**
 * Database Migration Script - Polygon to Pin-Based Model
 * This script drops old tables and creates the new pin-based schema
 * 
 * WARNING: This will DELETE ALL EXISTING DATA!
 * 
 * Usage: node migrate-db.js
 */

require("dotenv").config();
const db = require("../config/db");
const fs = require("fs");
const path = require("path");

const migrateDatabase = async () => {
  console.log("🔄 Migrating Smart Street database to pin-based model...\n");
  console.log("⚠️  WARNING: This will DELETE all existing data!\n");

  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    // Step 1: Drop old tables (in reverse dependency order)
    console.log("Step 1: Dropping old tables...");
    const tablesToDrop = [
      "audit_logs",
      "permits",
      "space_requests",
      "spaces",
      "vendors",
      "owners",
      "users"
    ];

    let droppedCount = 0;
    for (const table of tablesToDrop) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
        droppedCount++;
        console.log(`   ✓ Dropped table: ${table}`);
      } catch (err) {
        if (err.code === "42P01") {
          // Table doesn't exist, skip
          console.log(`   ⊘ Table doesn't exist: ${table}`);
        } else {
          console.warn(`   ⚠️  Error dropping ${table}: ${err.message}`);
        }
      }
    }
    console.log(`✅ Dropped ${droppedCount} tables\n`);

    // Step 2: Drop old enum types
    console.log("Step 2: Dropping old enum types...");
    const enumsToDrop = [
      "permit_status",
      "request_status",
      "space_type",
      "user_role"
    ];

    let droppedEnumCount = 0;
    for (const enumType of enumsToDrop) {
      try {
        await client.query(`DROP TYPE IF EXISTS ${enumType} CASCADE;`);
        droppedEnumCount++;
        console.log(`   ✓ Dropped type: ${enumType}`);
      } catch (err) {
        if (err.code === "42704") {
          // Type doesn't exist, skip
          console.log(`   ⊘ Type doesn't exist: ${enumType}`);
        } else {
          console.warn(`   ⚠️  Error dropping ${enumType}: ${err.message}`);
        }
      }
    }
    console.log(`✅ Dropped ${droppedEnumCount} enum types\n`);

    // Step 3: Drop old indexes if they exist
    console.log("Step 3: Cleaning up old indexes...");
    const indexesToDrop = [
      "idx_permits_status",
      "idx_space_requests_time",
      "idx_space_requests_geometry",
      "idx_spaces_geometry"
    ];

    for (const index of indexesToDrop) {
      try {
        await client.query(`DROP INDEX IF EXISTS ${index};`);
      } catch (err) {
        // Ignore errors - index may not exist
      }
    }
    console.log("✅ Cleaned up old indexes\n");

    await client.query("COMMIT");
    console.log("✅ Old schema dropped successfully\n");

    // Step 4: Enable PostGIS extension
    console.log("Step 4: Enabling PostGIS extension...");
    try {
      await db.query("CREATE EXTENSION IF NOT EXISTS postgis;");
      const postgisResult = await db.query("SELECT PostGIS_version() as version;");
      console.log(`✅ PostGIS enabled: ${postgisResult.rows[0].version}\n`);
    } catch (err) {
      if (err.message.includes("permission denied") || err.message.includes("must be superuser")) {
        console.error("❌ Error: Cannot create PostGIS extension");
        console.error("   💡 In Aiven: Go to your service → Extensions → Enable PostGIS");
        console.error("   💡 Or contact Aiven support to enable PostGIS extension\n");
        throw err;
      } else {
        throw err;
      }
    }

    // Step 5: Create new schema
    console.log("Step 5: Creating new pin-based schema...");
    const schemaPath = path.join(__dirname, "database", "schema.sql");
    
    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Schema file not found: ${schemaPath}`);
      process.exit(1);
    }

    const schemaSQL = fs.readFileSync(schemaPath, "utf8");
    
    // Clean SQL: remove comments and split statements
    const cleanedSQL = schemaSQL
      .split("\n")
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith("--") && !trimmed.startsWith("\\c");
      })
      .join("\n");

    const statements = cleanedSQL
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      const upperStatement = statement.toUpperCase();
      
      // Skip PostGIS extension (already handled)
      if (upperStatement.includes("CREATE EXTENSION") && upperStatement.includes("POSTGIS")) {
        skipCount++;
        continue;
      }
      
      try {
        await db.query(statement + ";");
        successCount++;
      } catch (err) {
        // Ignore "already exists" errors
        if (
          err.code === "42P07" || // relation already exists
          err.code === "42710" || // duplicate object
          err.message.includes("already exists")
        ) {
          skipCount++;
        } else {
          console.error(`❌ Error executing statement: ${err.message}`);
          console.error(`   Code: ${err.code}`);
          console.error(`   Statement: ${statement.substring(0, 100)}...`);
          throw err;
        }
      }
    }

    console.log(`✅ Schema creation completed`);
    console.log(`   ✓ Executed: ${successCount} statements`);
    console.log(`   ⊘ Skipped (already exists): ${skipCount} statements\n`);

    // Step 6: Verify new tables
    console.log("Step 6: Verifying new tables...");
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const expectedTables = [
      "users",
      "vendors",
      "owners",
      "spaces",
      "space_requests",
      "permits",
      "audit_logs"
    ];

    const existingTables = tablesResult.rows.map(r => r.table_name);
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));

    if (missingTables.length > 0) {
      console.error(`❌ Missing tables: ${missingTables.join(", ")}`);
      throw new Error("Schema verification failed");
    } else {
      console.log(`✅ All ${expectedTables.length} tables exist\n`);
    }

    // Step 7: Verify columns (check for pin-based columns)
    console.log("Step 7: Verifying pin-based columns...");
    const spacesColumns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'spaces' 
      AND column_name IN ('center', 'allowed_radius', 'geometry')
      ORDER BY column_name;
    `);

    const hasCenter = spacesColumns.rows.some(r => r.column_name === "center");
    const hasAllowedRadius = spacesColumns.rows.some(r => r.column_name === "allowed_radius");
    const hasOldGeometry = spacesColumns.rows.some(r => r.column_name === "geometry");

    if (hasCenter && hasAllowedRadius && !hasOldGeometry) {
      console.log("✅ Spaces table has pin-based columns (center, allowed_radius)");
      console.log("   ✓ No polygon geometry column found\n");
    } else {
      console.warn("⚠️  Spaces table structure may not match pin-based model");
      console.warn(`   center: ${hasCenter}, allowed_radius: ${hasAllowedRadius}, geometry: ${hasOldGeometry}\n`);
    }

    // Step 8: Verify PostGIS functions
    console.log("Step 8: Verifying PostGIS functions...");
    const functionsResult = await db.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name LIKE 'st_%'
      LIMIT 5;
    `);

    if (functionsResult.rows.length > 0) {
      console.log(`✅ PostGIS functions available (${functionsResult.rows.length}+ found)\n`);
    } else {
      console.warn("⚠️  No PostGIS functions found\n");
    }

    console.log("🎉 Database migration completed successfully!");
    console.log("\n📋 Summary:");
    console.log("   ✓ Old polygon-based tables dropped");
    console.log("   ✓ New pin-based schema created");
    console.log("   ✓ PostGIS extension enabled");
    console.log("   ✓ All tables verified");
    console.log("\nNext steps:");
    console.log("   1. Start the server: npm run dev");
    console.log("   2. Register users via /api/auth/register");
    console.log("   3. Create spaces via /api/owner/spaces (pin + radius)");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n❌ Database migration failed!");
    console.error(`   Error: ${err.message}`);
    if (err.code) {
      console.error(`   Code: ${err.code}`);
    }
    if (err.position) {
      console.error(`   Position: ${err.position}`);
    }
    process.exit(1);
  } finally {
    client.release();
    await db.pool.end();
  }
};

// Run migration
migrateDatabase().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
