const db = require("../config/db");
const { pointFromLatLng, radiusFromDims } = require("../services/spatialService");

const listPendingRequests = async () => {
  const result = await db.query(
    `
    SELECT
      sr.request_id,
      sr.vendor_id,
      sr.space_id,
      sr.max_width,
      sr.max_length,
      sr.start_time,
      sr.end_time,
      sr.status,
      sr.submitted_at,
      ST_Y(sr.center::geometry) AS lat,
      ST_X(sr.center::geometry) AS lng,
      s.space_name,
      s.address,
      ST_Y(s.center::geometry) AS space_lat,
      ST_X(s.center::geometry) AS space_lng,
      s.allowed_radius,
      u.name AS vendor_name,
      v.business_name
    FROM space_requests sr
    LEFT JOIN spaces s ON s.space_id = sr.space_id
    JOIN vendors v ON v.vendor_id = sr.vendor_id
    JOIN users u ON u.user_id = v.user_id
    WHERE sr.status IN ('PENDING', 'OWNER_APPROVED')
    ORDER BY sr.submitted_at ASC;
    `
  );
  return result.rows;
};

const listAllRequests = async ({ status } = {}) => {
  const result = await db.query(
    `
    SELECT
      sr.request_id,
      sr.vendor_id,
      sr.space_id,
      sr.max_width,
      sr.max_length,
      sr.start_time,
      sr.end_time,
      sr.status,
      sr.reviewed_by,
      sr.reviewed_at,
      sr.remarks,
      sr.submitted_at,
      ST_Y(sr.center::geometry) AS lat,
      ST_X(sr.center::geometry) AS lng,
      s.space_name,
      s.address,
      u.name AS vendor_name,
      v.business_name
    FROM space_requests sr
    LEFT JOIN spaces s ON s.space_id = sr.space_id
    JOIN vendors v ON v.vendor_id = sr.vendor_id
    JOIN users u ON u.user_id = v.user_id
    WHERE ($1::request_status IS NULL OR sr.status = $1::request_status)
    ORDER BY sr.submitted_at DESC;
    `,
    [status || null]
  );
  return result.rows;
};

const getRequestForUpdate = async (client, requestId) => {
  const result = await client.query(
    `
    SELECT
      request_id,
      vendor_id,
      space_id,
      start_time,
      end_time,
      status,
      max_width,
      max_length,
      ST_Y(center::geometry) AS lat,
      ST_X(center::geometry) AS lng
    FROM space_requests
    WHERE request_id = $1
    FOR UPDATE;
    `,
    [requestId]
  );
  return result.rows[0] || null;
};

const checkApprovedConflictsTx = async (client, { spaceId, lat, lng, maxWidth, maxLength, startTime, endTime, requestId }) => {
  const requestRadius = radiusFromDims(maxWidth, maxLength);

  const result = await client.query(
    `
    WITH req_point AS (
      SELECT ${pointFromLatLng(lat, lng)} AS g
    )
    SELECT
      sr.request_id,
      sr.vendor_id,
      sr.start_time,
      sr.end_time,
      sr.status,
      ST_Y(sr.center::geometry) AS lat,
      ST_X(sr.center::geometry) AS lng,
      sr.max_width,
      sr.max_length
    FROM space_requests sr, req_point
    WHERE ($1::uuid IS NULL OR sr.space_id = $1)
      AND sr.status = 'APPROVED'
      AND ($5::uuid IS NULL OR sr.request_id != $5)
      AND ST_DWithin(
        sr.center,
        req_point.g,
        $2 + (
          SQRT(POWER(sr.max_width, 2) + POWER(sr.max_length, 2)) / 2
        )::float
      )
      AND (sr.start_time < $4::timestamptz AND sr.end_time > $3::timestamptz);
    `,
    [spaceId, requestRadius, startTime, endTime, requestId || null]
  );
  return result.rows;
};

const listConflictsForPending = async requestId => {
  const result = await db.query(
    `
    WITH pending AS (
      SELECT
        space_id,
        start_time,
        end_time,
        ST_Y(center::geometry) AS lat,
        ST_X(center::geometry) AS lng,
        max_width,
        max_length
      FROM space_requests
      WHERE request_id = $1
    )
    SELECT
      sr.request_id,
      sr.vendor_id,
      sr.space_id,
      sr.start_time,
      sr.end_time,
      sr.status,
      ST_Y(sr.center::geometry) AS lat,
      ST_X(sr.center::geometry) AS lng,
      sr.max_width,
      sr.max_length
    FROM space_requests sr
    JOIN pending p ON p.space_id = sr.space_id
    WHERE sr.status = 'APPROVED'
      AND sr.request_id != $1
      AND ST_DWithin(
        sr.center,
        ${pointFromLatLng("p.lat", "p.lng")},
        (
          SELECT SQRT(POWER(p.max_width, 2) + POWER(p.max_length, 2)) / 2
        ) + (
          SELECT SQRT(POWER(sr.max_width, 2) + POWER(sr.max_length, 2)) / 2
        )
      )
      AND (sr.start_time < p.end_time AND sr.end_time > p.start_time);
    `,
    [requestId]
  );
  return result.rows;
};

// Fix listConflictsForPending to use proper SQL
const listConflictsForPendingFixed = async requestId => {
  const result = await db.query(
    `
    WITH pending AS (
      SELECT
        space_id,
        start_time,
        end_time,
        center,
        max_width,
        max_length
      FROM space_requests
      WHERE request_id = $1
    )
    SELECT
      sr.request_id,
      sr.vendor_id,
      sr.space_id,
      sr.start_time,
      sr.end_time,
      sr.status,
      ST_Y(sr.center::geometry) AS lat,
      ST_X(sr.center::geometry) AS lng,
      sr.max_width,
      sr.max_length
    FROM space_requests sr
    JOIN pending p ON (sr.space_id IS NOT DISTINCT FROM p.space_id)
    WHERE sr.status = 'APPROVED'
      AND sr.request_id != $1
      AND ST_DWithin(
        sr.center,
        p.center,
        (
          SQRT(POWER(p.max_width, 2) + POWER(p.max_length, 2)) / 2 +
          SQRT(POWER(sr.max_width, 2) + POWER(sr.max_length, 2)) / 2
        )
      )
      AND (sr.start_time < p.end_time AND sr.end_time > p.start_time);
    `,
    [requestId]
  );
  return result.rows;
};

const updateRequestStatusTx = async (client, { requestId, status, reviewedBy, remarks }) => {
  const result = await client.query(
    `
    UPDATE space_requests
    SET status = $2::request_status,
        reviewed_by = $3,
        reviewed_at = NOW(),
        remarks = $4
    WHERE request_id = $1
    RETURNING *;
    `,
    [requestId, status, reviewedBy, remarks || null]
  );
  return result.rows[0];
};

const createPermitTx = async (client, { requestId, qrPayload, validFrom, validTo }) => {
  const result = await client.query(
    `
    INSERT INTO permits (request_id, qr_payload, valid_from, valid_to, status)
    VALUES ($1, $2, $3::timestamptz, $4::timestamptz, 'VALID'::permit_status)
    RETURNING *;
    `,
    [requestId, qrPayload, validFrom, validTo]
  );
  return result.rows[0];
};

const listPermits = async () => {
  const result = await db.query(
    `
    SELECT
      p.permit_id,
      p.request_id,
      p.qr_payload,
      p.status AS permit_status,
      p.valid_from,
      p.valid_to,
      p.issued_at,
      sr.vendor_id,
      sr.space_id,
      ST_Y(sr.center::geometry) AS lat,
      ST_X(sr.center::geometry) AS lng,
      s.space_name,
      s.address
    FROM permits p
    JOIN space_requests sr ON sr.request_id = p.request_id
    LEFT JOIN spaces s ON s.space_id = sr.space_id
    ORDER BY p.issued_at DESC;
    `
  );
  return result.rows;
};

const getVendorUserId = async vendorId => {
  const result = await db.query(
    `SELECT user_id FROM vendors WHERE vendor_id = $1`,
    [vendorId]
  );
  return result.rows[0]?.user_id || null;
};

const getDashboardStats = async () => {
  const result = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM vendors) AS total_vendors,
      (SELECT COUNT(*) FROM spaces) AS total_spaces,
      (SELECT COUNT(*) FROM permits WHERE status = 'VALID') AS active_permits,
      (SELECT COUNT(*) FROM permits) AS total_permits,
      (SELECT COUNT(*) FROM space_requests WHERE status = 'PENDING') AS pending_requests
  `);
  return result.rows[0];
};

const listVendors = async () => {
  const result = await db.query(`
    SELECT 
      v.vendor_id,
      v.business_name,
      v.category,
      u.name AS vendor_name,
      u.email,
      u.phone AS phone_number,
      v.created_at,
      (SELECT COUNT(*) FROM space_requests sr WHERE sr.vendor_id = v.vendor_id) AS total_requests,
      (SELECT COUNT(*) FROM permits p 
       JOIN space_requests sr ON sr.request_id = p.request_id 
       WHERE sr.vendor_id = v.vendor_id AND p.status = 'VALID') AS active_permits
    FROM vendors v
    JOIN users u ON u.user_id = v.user_id
    ORDER BY v.created_at DESC
  `);
  return result.rows;
};

const listOwners = async () => {
  const result = await db.query(`
    SELECT 
      o.owner_id,
      o.owner_name,
      o.contact_info,
      u.email,
      u.phone AS phone_number,
      u.name AS user_name,
      o.created_at,
      (SELECT COUNT(*) FROM spaces s WHERE s.owner_id = o.owner_id) AS total_spaces
    FROM owners o
    JOIN users u ON u.user_id = o.user_id
    ORDER BY o.created_at DESC
  `);
  return result.rows;
};

const getAdminUserIds = async () => {
  const result = await db.query(
    `SELECT user_id FROM users WHERE role = 'ADMIN'`
  );
  return result.rows.map(r => r.user_id);
};

const getOwnerDetails = async (ownerId) => {
  const result = await db.query(`
    SELECT
      o.owner_id,
      o.owner_name,
      o.contact_info,
      o.created_at,
      u.email,
      u.phone AS phone_number,
      u.name AS user_name,
      (SELECT COUNT(*) FROM spaces s WHERE s.owner_id = o.owner_id) AS total_spaces,
      (SELECT COALESCE(SUM(sr.total_price), 0) FROM space_requests sr JOIN spaces s ON s.space_id = sr.space_id WHERE s.owner_id = o.owner_id AND sr.status = 'APPROVED') AS total_revenue
    FROM owners o
    JOIN users u ON u.user_id = o.user_id
    WHERE o.owner_id = $1
  `, [ownerId]);

  const owner = result.rows[0];
  if (!owner) return null;

  const spacesResult = await db.query(`
    SELECT space_id, space_name, address, price_per_radius, allowed_radius, 'VERIFIED' AS status, created_at,
           (SELECT COALESCE(SUM(total_price), 0) FROM space_requests WHERE space_id = spaces.space_id AND status = 'APPROVED') AS revenue
    FROM spaces
    WHERE owner_id = $1
    ORDER BY created_at DESC
  `, [ownerId]);

  owner.spaces = spacesResult.rows;
  return owner;
};

const getVendorDetails = async (vendorId) => {
  const result = await db.query(`
    SELECT
      v.vendor_id,
      v.business_name,
      v.category,
      v.created_at,
      u.name AS vendor_name,
      u.email,
      u.phone AS phone_number,
      (SELECT COUNT(*) FROM permits p JOIN space_requests sr ON sr.request_id = p.request_id WHERE sr.vendor_id = v.vendor_id AND p.status = 'VALID') AS active_permits,
      (SELECT COALESCE(SUM(total_price), 0) FROM space_requests WHERE vendor_id = v.vendor_id AND status = 'APPROVED') AS total_spent
    FROM vendors v
    JOIN users u ON u.user_id = v.user_id
    WHERE v.vendor_id = $1
  `, [vendorId]);

  const vendor = result.rows[0];
  if (!vendor) return null;

  const requestsResult = await db.query(`
    SELECT 
      sr.request_id,
      sr.start_time,
      sr.end_time,
      sr.status,
      sr.total_price,
      sr.submitted_at,
      s.space_name,
      s.address
    FROM space_requests sr
    LEFT JOIN spaces s ON s.space_id = sr.space_id
    WHERE sr.vendor_id = $1
    ORDER BY sr.submitted_at DESC
  `, [vendorId]);

  vendor.requests = requestsResult.rows;
  return vendor;
};

const listPendingSpaces = async () => {
  const result = await db.query(
    `
    SELECT
      s.space_id,
      s.owner_id,
      s.space_name,
      s.address,
      s.allowed_radius,
      s.price_per_radius,
      s.status,
      s.aadhar_number,
      s.aadhar_name,
      s.chitta_number,
      s.chitta_name,
      s.image_1_url,
      s.image_2_url,
      s.terms_conditions,
      s.created_at,
      ST_Y(s.center::geometry) AS lat,
      ST_X(s.center::geometry) AS lng,
      o.owner_name,
      o.contact_info,
      u.email
    FROM spaces s
    JOIN owners o ON o.owner_id = s.owner_id
    JOIN users u ON u.user_id = o.user_id
    WHERE s.status = 'PENDING'
    ORDER BY s.created_at ASC;
    `
  );
  return result.rows;
};

const updateSpaceStatus = async (spaceId, status, termsConditions) => {
  const result = await db.query(
    `
    UPDATE spaces
    SET status = $2::space_status,
        terms_conditions = $3
    WHERE space_id = $1
    RETURNING *;
    `,
    [spaceId, status, termsConditions || null]
  );
  return result.rows[0];
};

module.exports = {
  listPendingRequests,
  listAllRequests,
  listConflictsForPending: listConflictsForPendingFixed,
  getRequestForUpdate,
  checkApprovedConflictsTx,
  updateRequestStatusTx,
  createPermitTx,
  listPermits,
  getVendorUserId,
  getAdminUserIds,
  getDashboardStats,
  listVendors,
  listOwners,
  getOwnerDetails,
  getVendorDetails,
  listPendingSpaces,
  updateSpaceStatus
};
