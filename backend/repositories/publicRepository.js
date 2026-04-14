const db = require("../config/db");

const listApprovedVendors = async () => {
  const result = await db.query(
    `
    SELECT DISTINCT ON (v.vendor_id)
      v.vendor_id,
      v.business_name,
      v.category,
      v.license_number,
      v.is_active,
      v.operating_hours,
      u.name AS vendor_name,
      sr.request_id,
      sr.space_id,
      sr.max_width,
      sr.max_length,
      sr.start_time,
      sr.end_time,
      ST_Y(sr.center::geometry) AS lat,
      ST_X(sr.center::geometry) AS lng,
      s.space_name,
      s.address,
      p.permit_id,
      p.status AS permit_status,
      p.valid_from,
      p.valid_to,
      v.menu_items,
      v.stall_photo
    FROM vendors v
    JOIN users u ON u.user_id = v.user_id
    LEFT JOIN space_requests sr ON sr.vendor_id = v.vendor_id AND sr.status = 'APPROVED'
    LEFT JOIN spaces s ON s.space_id = sr.space_id
    LEFT JOIN permits p ON p.request_id = sr.request_id AND (p.status IS NULL OR p.status = 'VALID')
    ORDER BY v.vendor_id, sr.start_time DESC;
    `
  );
  return result.rows;
};

const searchVendors = async ({ query, category, spaceId }) => {
  let sql = `
    SELECT DISTINCT ON (v.vendor_id)
      v.vendor_id,
      v.business_name,
      v.category,
      v.license_number,
      v.is_active,
      v.operating_hours,
      u.name AS vendor_name,
      sr.request_id,
      sr.space_id,
      sr.max_width,
      sr.max_length,
      sr.start_time,
      sr.end_time,
      ST_Y(sr.center::geometry) AS lat,
      ST_X(sr.center::geometry) AS lng,
      s.space_name,
      s.address,
      p.permit_id,
      p.status AS permit_status,
      p.valid_from,
      p.valid_to,
      v.menu_items,
      v.stall_photo
    FROM vendors v
    JOIN users u ON u.user_id = v.user_id
    LEFT JOIN space_requests sr ON sr.vendor_id = v.vendor_id AND sr.status = 'APPROVED'
    LEFT JOIN spaces s ON s.space_id = sr.space_id
    LEFT JOIN permits p ON p.request_id = sr.request_id AND (p.status IS NULL OR p.status = 'VALID')
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (query) {
    sql += ` AND (
      v.business_name ILIKE $${paramIndex}
      OR v.category ILIKE $${paramIndex}
      OR s.space_name ILIKE $${paramIndex}
      OR s.address ILIKE $${paramIndex}
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(v.menu_items) AS item 
        WHERE item->>'name' ILIKE $${paramIndex}
      )
    )`;
    params.push(`%${query}%`);
    paramIndex++;
  }

  if (category) {
    sql += ` AND v.category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  if (spaceId) {
    sql += ` AND sr.space_id = $${paramIndex}`;
    params.push(spaceId);
    paramIndex++;
  }

  sql += ` ORDER BY v.vendor_id, sr.start_time DESC;`;

  const result = await db.query(sql, params);
  return result.rows;
};

const getVendorDensity = async ({ bounds, zoom }) => {
  if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
    return [];
  }

  const result = await db.query(
    `
    WITH viewport AS (
      SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326)::geography AS geom
    ),
    vendors_in_view AS (
      SELECT
        sr.center AS centroid,
        v.vendor_id,
        v.business_name,
        v.category,
        s.space_name
      FROM space_requests sr
      JOIN vendors v ON v.vendor_id = sr.vendor_id
      JOIN spaces s ON s.space_id = sr.space_id
      LEFT JOIN permits p ON p.request_id = sr.request_id
      CROSS JOIN viewport vp
      WHERE sr.status = 'APPROVED'
        AND (p.status IS NULL OR p.status = 'VALID')
        AND NOW() BETWEEN sr.start_time AND sr.end_time
        AND ST_DWithin(sr.center, vp.geom, 0)
    )
    SELECT
      ST_X(centroid::geometry) AS lng,
      ST_Y(centroid::geometry) AS lat,
      COUNT(*) AS vendor_count,
      json_agg(json_build_object(
        'vendor_id', vendor_id,
        'business_name', business_name,
        'category', category,
        'space_name', space_name
      )) AS vendors
    FROM vendors_in_view
    GROUP BY centroid
    ORDER BY vendor_count DESC;
    `,
    [bounds.west, bounds.south, bounds.east, bounds.north]
  );
  return result.rows;
};

const findPermitByQrData = async qrPayload => {
  const result = await db.query(
    `
    SELECT
      p.permit_id,
      p.request_id,
      p.qr_payload,
      p.valid_from,
      p.valid_to,
      p.status AS permit_status,
      p.issued_at,
      p.transaction_hash,
      sr.vendor_id,
      sr.space_id,
      sr.max_width,
      sr.max_length,
      sr.start_time,
      sr.end_time,
      sr.status,
      ST_Y(sr.center::geometry) AS lat,
      ST_X(sr.center::geometry) AS lng,
      v.business_name,
      v.category,
      v.license_number,
      u.name AS vendor_name,
      s.space_name,
      s.address,
      ST_Y(s.center::geometry) AS space_lat,
      ST_X(s.center::geometry) AS space_lng,
      s.allowed_radius
    FROM permits p
    JOIN space_requests sr ON sr.request_id = p.request_id
    JOIN vendors v ON v.vendor_id = sr.vendor_id
    JOIN users u ON u.user_id = v.user_id
    LEFT JOIN spaces s ON s.space_id = sr.space_id
    WHERE p.qr_payload = $1;
    `,
    [qrPayload]
  );
  return result.rows[0] || null;
};

const findPermitById = async permitId => {
  const result = await db.query(
    `
    SELECT
      p.permit_id,
      p.request_id,
      p.qr_payload,
      p.valid_from,
      p.valid_to,
      p.status AS permit_status,
      p.issued_at,
      p.transaction_hash,
      sr.vendor_id,
      sr.space_id,
      sr.max_width,
      sr.max_length,
      sr.start_time,
      sr.end_time,
      sr.status,
      ST_Y(sr.center::geometry) AS lat,
      ST_X(sr.center::geometry) AS lng,
      v.business_name,
      v.category,
      v.license_number,
      u.name AS vendor_name,
      s.space_name,
      s.address,
      ST_Y(s.center::geometry) AS space_lat,
      ST_X(s.center::geometry) AS space_lng,
      s.allowed_radius
    FROM permits p
    JOIN space_requests sr ON sr.request_id = p.request_id
    JOIN vendors v ON v.vendor_id = sr.vendor_id
    JOIN users u ON u.user_id = v.user_id
    LEFT JOIN spaces s ON s.space_id = sr.space_id
    WHERE p.permit_id::text LIKE $1 || '%';
    `,
    [permitId]
  );
  return result.rows[0] || null;
};

module.exports = {
  listApprovedVendors,
  searchVendors,
  getVendorDensity,
  findPermitByQrData,
  findPermitById
};
