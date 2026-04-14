const db = require("../config/db");

const findByUserId = async userId => {
  const result = await db.query(
    `SELECT * FROM vendors WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

const findAllByUserId = async userId => {
  const result = await db.query(
    `SELECT * FROM vendors WHERE user_id = $1 ORDER BY created_at ASC`,
    [userId]
  );
  return result.rows;
};

const getAnalytics = async (vendorIds) => {
  const statsResult = await db.query(
    `
    SELECT 
      COUNT(*) FILTER (WHERE status = 'APPROVED') as total_permits,
      COUNT(*) FILTER (WHERE status = 'PENDING') as pending_requests,
      COALESCE(SUM(total_price) FILTER (WHERE status = 'APPROVED'), 0) as total_spent
    FROM space_requests
    WHERE vendor_id = ANY($1)
    `,
    [vendorIds]
  );

  const recentRequests = await db.query(
    `
    SELECT sr.*, s.space_name, s.address
    FROM space_requests sr
    LEFT JOIN spaces s ON sr.space_id = s.space_id
    WHERE sr.vendor_id = ANY($1)
    ORDER BY sr.submitted_at DESC
    LIMIT 5
    `,
    [vendorIds]
  );

  const locationStats = await db.query(
    `
    SELECT s.space_name, COUNT(*) as visit_count
    FROM space_requests sr
    JOIN spaces s ON sr.space_id = s.space_id
    WHERE sr.vendor_id = ANY($1) AND sr.status = 'APPROVED'
    GROUP BY s.space_name
    ORDER BY visit_count DESC
    LIMIT 5
    `,
    [vendorIds]
  );

  return {
    summary: statsResult.rows[0],
    recentRequests: recentRequests.rows,
    locationStats: locationStats.rows
  };
};

const getFavorites = async (vendorId) => {
  const result = await db.query(
    `
    SELECT f.*, s.space_name, s.address, s.allowed_radius, s.price_per_radius,
           ST_Y(s.center::geometry) as lat, ST_X(s.center::geometry) as lng
    FROM vendor_favorites f
    JOIN spaces s ON f.space_id = s.space_id
    WHERE f.vendor_id = $1
    ORDER BY f.created_at DESC
    `,
    [vendorId]
  );
  return result.rows;
};

const toggleFavorite = async (vendorId, spaceId) => {
  const check = await db.query(
    `SELECT * FROM vendor_favorites WHERE vendor_id = $1 AND space_id = $2`,
    [vendorId, spaceId]
  );

  if (check.rows.length > 0) {
    await db.query(`DELETE FROM vendor_favorites WHERE vendor_id = $1 AND space_id = $2`, [vendorId, spaceId]);
    return { favorited: false };
  } else {
    await db.query(
      `INSERT INTO vendor_favorites (vendor_id, space_id) VALUES ($1, $2)`,
      [vendorId, spaceId]
    );
    return { favorited: true };
  }
};

const updateStorefront = async (vendorId, { businessName, category, stallPhoto, menuItems, isActive, operatingHours }) => {
  const result = await db.query(
    `
    UPDATE vendors
    SET 
      business_name = COALESCE($2, business_name),
      category = COALESCE($3, category),
      stall_photo = COALESCE($4, stall_photo),
      menu_items = COALESCE($5, menu_items),
      is_active = COALESCE($6, is_active),
      operating_hours = COALESCE($7, operating_hours)
    WHERE vendor_id = $1
    RETURNING *
    `,
    [
      vendorId, 
      businessName, 
      category, 
      stallPhoto, 
      menuItems ? JSON.stringify(menuItems) : null,
      isActive,
      operatingHours ? JSON.stringify(operatingHours) : null
    ]
  );
  return result.rows[0];
};

module.exports = {
  findByUserId,
  findAllByUserId,
  getAnalytics,
  getFavorites,
  toggleFavorite,
  updateStorefront
};
