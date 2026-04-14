const db = require('../config/db');

// Helper to increment view count
exports.recordView = async (vendorId) => {
  if (!vendorId) return;
  try {
    await db.query(
      `INSERT INTO vendor_stats (vendor_id, date, profile_views)
       VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (vendor_id, date)
       DO UPDATE SET profile_views = vendor_stats.profile_views + 1`,
      [vendorId]
    );
  } catch (error) {
    console.error("Error recording view:", error);
  }
};

// Route handler for public view tracking (optional usage)
exports.trackView = async (req, res) => {
  const { vendorId } = req.params;
  await exports.recordView(vendorId);
  res.status(200).send("OK");
};

// Get stats for dashboard
exports.getVendorStats = async (req, res) => {
  const vendorId = req.user.vendorId; // Requires vendor auth middleware

  try {
    const result = await db.query(
      `SELECT date, profile_views, map_impressions
       FROM vendor_stats
       WHERE vendor_id = $1
       ORDER BY date DESC
       LIMIT 30`,
      [vendorId]
    );

    // Format for chart (reverse to chronological order)
    const stats = result.rows.map(row => ({
      ...row,
      date: row.date.toISOString().split('T')[0] // Format YYYY-MM-DD
    })).reverse();

    res.json({ stats });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
