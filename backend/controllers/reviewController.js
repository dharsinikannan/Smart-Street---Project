const db = require('../config/db');
const { recordView } = require('./analyticsController');

exports.addReview = async (req, res) => {
  const { vendorId, rating, comment } = req.body;
  const userId = req.user.userId; // From auth middleware

  if (!vendorId || !rating) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  try {
    // Check if review already exists
    const existing = await db.query(
      "SELECT review_id FROM reviews WHERE vendor_id = $1 AND user_id = $2",
      [vendorId, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "You have already reviewed this vendor" });
    }

    const { rows } = await db.query(
      `INSERT INTO reviews (vendor_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING review_id, created_at`,
      [vendorId, userId, rating, comment]
    );

    res.status(201).json({ message: "Review added", review: rows[0] });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getVendorReviews = async (req, res) => {
  const { vendorId } = req.params;

  // Track that this vendor profile was viewed
  recordView(vendorId);

  try {
    const reviewsResult = await db.query(
      `SELECT r.review_id, r.rating, r.comment, r.created_at, u.name as user_name, u.role as user_role
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.vendor_id = $1
       ORDER BY r.created_at DESC`,
      [vendorId]
    );

    const statsResult = await db.query(
      `SELECT AVG(rating)::numeric(10,1) as average_rating, COUNT(*) as total_reviews
       FROM reviews
       WHERE vendor_id = $1`,
      [vendorId]
    );

    res.json({
      reviews: reviewsResult.rows,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
