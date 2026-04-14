require("dotenv").config();
const app = require("./app");
const db = require("./config/db");

const cron = require("node-cron");
const axios = require("axios");

const PORT = process.env.PORT || 5000;

// Keep Render backend awake
const keepAlive = () => {
  // Only run if an external URL is defined (automatically set by Render)
  if (process.env.RENDER_EXTERNAL_URL) {
    console.log("🕒 keepAlive: Setting up heartbeat...");
    cron.schedule("*/14 * * * *", () => {
      console.log("💓 Keep-alive ping...");
      axios
        .get(`${process.env.RENDER_EXTERNAL_URL}/health`)
        .then(() => console.log("✅ Keep-alive success"))
        .catch((err) => console.error("❌ Keep-alive failed:", err.message));
    });
  } else {
    console.log("⚠️ Keep-alive skipped: RENDER_EXTERNAL_URL not set (Local Development)");
  }
};

// Test database connection before starting server
const startServer = async () => {
  console.log("🔌 Testing database connection...");
  const connected = await db.testConnection();

  if (!connected) {
    console.error("\n❌ Server startup aborted due to database connection failure");
    process.exit(1);
  }
  
  console.log("\n🚀 Starting Smart Street backend server...");
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 API endpoints available at http://localhost:${PORT}/api`);
    
    // Start keep-alive cron job
    keepAlive();
  });
};

startServer();
