const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;

// Check if connection requires SSL (Aiven, or explicit DB_SSL setting)
const requiresSSL = () => {
  if (process.env.DB_SSL === "true") return true;
  if (connectionString && connectionString.includes("sslmode=require")) return true;
  if (connectionString && connectionString.includes("aivencloud.com")) return true;
  if (process.env.DB_HOST && process.env.DB_HOST.includes("aivencloud.com")) return true;
  return false;
};

const sslConfig = requiresSSL()
  ? { rejectUnauthorized: false } // Aiven doesn't require CA cert verification in most cases
  : undefined;

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: sslConfig
      }
    : {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 5432,
        ssl: sslConfig
      }
);

pool.on("error", err => {
  console.error("❌ Unexpected Postgres error", err);
  process.exit(1);
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW(), version()");
    const dbVersion = result.rows[0].version.split(" ")[0] + " " + result.rows[0].version.split(" ")[1];
    
    // Check for PostGIS extension and install if missing
    let postgisVersion = null;
    try {
      const postgisCheck = await client.query("SELECT PostGIS_version() as postgis_version");
      postgisVersion = postgisCheck.rows[0].postgis_version;
    } catch (postgisErr) {
      if (postgisErr.message.includes("does not exist") || postgisErr.message.includes("function postgis_version")) {
        console.log("   🔧 PostGIS extension not found, attempting to install...");
        try {
          await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");
          console.log("   ✅ PostGIS extension installed successfully");
          // Verify installation
          const verifyCheck = await client.query("SELECT PostGIS_version() as postgis_version");
          postgisVersion = verifyCheck.rows[0].postgis_version;
        } catch (installErr) {
          if (installErr.message.includes("permission denied") || installErr.message.includes("must be superuser")) {
            console.warn("   ⚠️  Cannot install PostGIS: insufficient permissions");
            console.warn("   💡 For Aiven: Enable PostGIS extension via Aiven Console");
            console.warn("   💡 Or run as superuser: CREATE EXTENSION IF NOT EXISTS postgis;");
          } else if (installErr.message.includes("could not open extension control file")) {
            console.warn("   ⚠️  PostGIS extension files not available on server");
            console.warn("   💡 PostGIS must be installed on the PostgreSQL server");
          } else {
            console.warn(`   ⚠️  Failed to install PostGIS: ${installErr.message}`);
          }
        }
      } else {
        throw postgisErr;
      }
    }
    
    client.release();
    
    console.log("✅ Database connected successfully");
    console.log(`   📊 PostgreSQL: ${dbVersion}`);
    if (postgisVersion) {
      console.log(`   🗺️  PostGIS: ${postgisVersion}`);
    } else {
      console.log(`   🗺️  PostGIS: Not available (spatial features will not work)`);
    }
    console.log(`   🕐 Server time: ${result.rows[0].now}`);
    
    return true;
  } catch (err) {
    console.error("❌ Database connection failed!");
    console.error(`   Error: ${err.message}`);
    if (err.code === "ECONNREFUSED") {
      console.error("   💡 Check if PostgreSQL is running and connection details are correct");
    } else if (err.code === "3D000") {
      console.error("   💡 Database does not exist. Run schema.sql to create it");
    } else if (err.code === "28P01") {
      console.error("   💡 Authentication failed. Check DB_USER and DB_PASSWORD");
    } else if (err.message.includes("no pg_hba.conf entry") || err.message.includes("no encryption")) {
      console.error("   💡 SSL/TLS required but not enabled");
      console.error("   💡 For Aiven: Set DB_SSL=true or ensure connection string has sslmode=require");
    }
    return false;
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  testConnection
};
