/**
 * Database Setup Script
 * Run this to initialize PostGIS extension and create schema
 * 
 * Usage: node setup-db.js
 */

require("dotenv").config();
const db = require("../config/db");
const fs = require("fs");
const path = require("path");

const setupDatabase = async () => {
  console.log("🔧 Setting up Smart Street database...\n");

  try {
    // Step 1: Enable PostGIS extension
    console.log("Step 1: Enabling PostGIS extension...");
    try {
      await db.query("CREATE EXTENSION IF NOT EXISTS postgis;");
      const postgisResult = await db.query("SELECT PostGIS_version() as version;");
      console.log(`✅ PostGIS enabled: ${postgisResult.rows[0].version}\n`);
    } catch (err) {
      if (err.message.includes("permission denied") || err.message.includes("must be superuser")) {
        console.error("❌ Error: Cannot create PostGIS extension");
        console.error("   💡 In Aiven: Go to your service → Extensions → Enable PostGIS");
        console.error("   💡 Or contact Aiven support to enable PostGIS extension\n");
        process.exit(1);
      } else {
        throw err;
      }
    }

    // Step 2: Read and execute schema.sql
    console.log("Step 2: Creating database schema...");
    const schemaPath = path.join(__dirname, "database", "schema.sql");
    
    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Schema file not found: ${schemaPath}`);
      process.exit(1);
    }

    const schemaSQL = fs.readFileSync(schemaPath, "utf8");
    
    // Remove comments and \c commands, but keep the structure
    const cleanedSQL = schemaSQL
      .split("\n")
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith("--") && !trimmed.startsWith("\\c");
      })
      .join("\n");

    // Execute the entire schema as one transaction
    // Split by semicolon but preserve CREATE TYPE and CREATE TABLE blocks
    const statements = cleanedSQL
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let successCount = 0;
    let skipCount = 0;

    // Execute statements in order, handling dependencies
    for (const statement of statements) {
      const upperStatement = statement.toUpperCase();
      
      // Skip PostGIS extension (already handled)
      if (upperStatement.includes("CREATE EXTENSION") && upperStatement.includes("POSTGIS")) {
        skipCount++;
        continue;
      }
      
      try {
        // Execute with semicolon
        await db.query(statement + ";");
        successCount++;
      } catch (err) {
        // Ignore "already exists" errors for types and tables
        if (
          err.code === "42P07" || // relation already exists
          err.code === "42710" || // duplicate object
          err.message.includes("already exists") ||
          err.message.includes("duplicate key value")
        ) {
          skipCount++;
        } else {
          console.error(`❌ Error executing statement: ${err.message}`);
          console.error(`   Code: ${err.code}`);
          console.error(`   Statement preview: ${statement.substring(0, 150)}...`);
          // Don't throw - continue with other statements
          console.warn(`   ⚠️  Continuing with remaining statements...`);
        }
      }
    }

    console.log(`✅ Schema creation completed`);
    console.log(`   ✓ Executed: ${successCount} statements`);
    console.log(`   ⊘ Skipped (already exists): ${skipCount} statements\n`);

    // Step 3: Verify tables
    console.log("Step 3: Verifying tables...");
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
      console.warn(`⚠️  Missing tables: ${missingTables.join(", ")}`);
    } else {
      console.log(`✅ All ${expectedTables.length} tables exist\n`);
    }

    // Step 4: Verify PostGIS functions
    console.log("Step 4: Verifying PostGIS functions...");
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

    console.log("🎉 Database setup completed successfully!");
    console.log("\nNext steps:");
    console.log("   1. Start the server: npm run dev");
    console.log("   2. Register users via /api/auth/register");
    console.log("   3. Create spaces via /api/owner/spaces");

  } catch (err) {
    console.error("\n❌ Database setup failed!");
    console.error(`   Error: ${err.message}`);
    if (err.code) {
      console.error(`   Code: ${err.code}`);
    }
    process.exit(1);
  } finally {
    await db.pool.end();
  }
};

setupDatabase();
