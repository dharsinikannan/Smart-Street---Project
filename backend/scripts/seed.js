require("dotenv").config();
const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const ERODE_LAT = 11.3410;
const ERODE_LNG = 77.7172;

// Helper to generate random lat/lng around Erode
const getRandomLocation = () => {
  const lat = ERODE_LAT + (Math.random() - 0.5) * 0.08; // Roughly 8-9km spread
  const lng = ERODE_LNG + (Math.random() - 0.5) * 0.08;
  return { lat, lng };
};

const seed = async () => {
    // Dynamic import for CommonJS compatibility
  const { faker } = await import("@faker-js/faker");
  
  console.log("🌱 Starting Database Seed with Mock Data...");

  try {
    // 1. Drop existing tables and types
    console.log("🔥 Dropping existing tables and types...");
    await db.query(`
      DROP TABLE IF EXISTS 
        notifications, 
        audit_logs, 
        permits, 
        space_requests, 
        spaces, 
        owners, 
        vendors, 
        users 
      CASCADE;

      DROP TYPE IF EXISTS 
        notification_type,
        permit_status,
        request_status,
        user_role
      CASCADE;
    `);

    // 2. Re-create schema
    console.log("🏗️ Re-creating schema from sql file...");
    const schemaPath = path.join(__dirname, "database", "schema.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");
    await db.query(schemaSQL);
    console.log("✅ Schema created.");

    // 3. Base Data (Admin)
    console.log("🔑 Creating Admin...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    await db.query(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES ('Super Admin', 'admin@smartstreet.com', $1, 'ADMIN', '9999999999')
    `, [hashedPassword]);

    // 4. Create 100 Vendors
    console.log("🧑‍🍳 Generating 100 Vendors...");
    const vendorIds = [];
    
    for (let i = 0; i < 100; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({ firstName, lastName }).toLowerCase();
        
        const userRes = await db.query(`
            INSERT INTO users (name, email, password_hash, role, phone)
            VALUES ($1, $2, $3, 'VENDOR', $4)
            RETURNING user_id;
        `, [`${firstName} ${lastName}`, email, hashedPassword, faker.phone.number('9#########')]);
        
        const userId = userRes.rows[0].user_id;

        const businessName = faker.company.name() + (Math.random() > 0.5 ? " Foods" : " Store");
        const category = faker.helpers.arrayElement(['Food & Beverage', 'Retail', 'service', 'Handicrafts', 'Apparel']);
        
        const vendorRes = await db.query(`
            INSERT INTO vendors (user_id, business_name, category, license_number, verified)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING vendor_id;
        `, [userId, businessName, category, `LIC-${faker.string.alphanumeric(8).toUpperCase()}`, Math.random() > 0.2]);
        
        vendorIds.push(vendorRes.rows[0].vendor_id);
    }

    // 5. Create 100 Owners & Spaces
    console.log("🏘️ Generating 100 Owners & Spaces...");
    const spaceIds = [];

    for (let i = 0; i < 100; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({ firstName, lastName, provider: 'realty.com' }).toLowerCase();

        const userRes = await db.query(`
            INSERT INTO users (name, email, password_hash, role, phone)
            VALUES ($1, $2, $3, 'OWNER', $4)
            RETURNING user_id;
        `, [`${firstName} ${lastName}`, email, hashedPassword, faker.phone.number('9#########')]);
        
        const userId = userRes.rows[0].user_id;

        const ownerRes = await db.query(`
            INSERT INTO owners (user_id, owner_name, contact_info)
            VALUES ($1, $2, $3)
            RETURNING owner_id;
        `, [userId, `${firstName} Properties`, faker.phone.number()]);
        
        const ownerId = ownerRes.rows[0].owner_id;

        // Create 1-3 spaces per owner
        const numSpaces = faker.number.int({ min: 1, max: 3 });
        for (let j = 0; j < numSpaces; j++) {
            const loc = getRandomLocation();
            const spaceName = faker.location.street() + " Spot " + faker.string.alpha(1).toUpperCase();
            
            const spaceRes = await db.query(`
                INSERT INTO spaces (owner_id, space_name, address, allowed_radius, center)
                VALUES (
                    $1, 
                    $2, 
                    $3, 
                    $4, 
                    ST_SetSRID(ST_MakePoint($5, $6), 4326)
                )
                RETURNING space_id;
            `, [
                ownerId, 
                spaceName, 
                faker.location.streetAddress(), 
                faker.number.int({ min: 20, max: 100 }), 
                loc.lng, 
                loc.lat
            ]);
            spaceIds.push(spaceRes.rows[0].space_id);
        }
    }

    // 6. Create Random Requests
    console.log("📨 Generating Random Requests...");
    for (let i = 0; i < 150; i++) {
        const vendorId = faker.helpers.arrayElement(vendorIds);
        const spaceId = faker.helpers.arrayElement(spaceIds);
        const status = faker.helpers.arrayElement(['PENDING', 'APPROVED', 'REJECTED']);
        
        // Random time in next 7 days
        const startTime = faker.date.soon({ days: 7 });
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 4);

        const loc = getRandomLocation(); // Slightly off center if needed, but requests usually match space or pin
        // For simplicity, let's just point to the space location +- tiny bit or just random pin if new request

        await db.query(`
            INSERT INTO space_requests (
                vendor_id, 
                space_id, 
                center, 
                max_width, 
                max_length, 
                start_time, 
                end_time, 
                status
            )
            VALUES (
                $1, 
                $2, 
                ST_SetSRID(ST_MakePoint($3, $4), 4326), 
                3.0, 
                4.0, 
                $5, 
                $6, 
                $7
            );
        `, [
            vendorId, 
            spaceId, 
            loc.lng, 
            loc.lat, 
            startTime, 
            endTime, 
            status
        ]);
    }

    console.log("✨ Seeding Completed! User Logins:");
    console.log("   Admin: admin@smartstreet.com / password123");
    console.log("   Others: [random]@(gmail|realty).com / password123");

  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    db.pool.end();
  }
};

seed();
