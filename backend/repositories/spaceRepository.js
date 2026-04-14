const db = require("../config/db");
const { pointFromLatLng } = require("../services/spatialService");

const createSpace = async ({
  ownerId,
  spaceName,
  address,
  lat,
  lng,
  allowedRadius,
  pricePerRadius,
  aadharNumber,
  aadharName,
  chittaNumber,
  chittaName,
  image1Url,
  image2Url
}) => {
  const result = await db.query(
    `
    INSERT INTO spaces (
      owner_id,
      space_name,
      address,
      center,
      allowed_radius,
      price_per_radius,
      aadhar_number,
      aadhar_name,
      chitta_number,
      chitta_name,
      image_1_url,
      image_2_url,
      status
    )
    VALUES (
      $1,
      $2,
      $3,
      ${pointFromLatLng(lat, lng)},
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10,
      $11,
      'PENDING'
    )
    RETURNING
      space_id,
      owner_id,
      space_name,
      address,
      allowed_radius,
      price_per_radius,
      ST_X(center::geometry) AS lng,
      aadhar_number,
      aadhar_name,
      chitta_number,
      chitta_name,
      image_1_url,
      image_2_url,
      status,
      created_at;
    `,
    [ownerId, spaceName, address, allowedRadius, pricePerRadius, aadharNumber, aadharName, chittaNumber, chittaName, image1Url, image2Url]
  );

  return result.rows[0];
};

const listByOwner = async ownerId => {
  const result = await db.query(
    `
    SELECT
      space_id,
      owner_id,
      space_name,
      address,
      allowed_radius,
      price_per_radius,
      ST_Y(center::geometry) AS lat,
      ST_X(center::geometry) AS lng,
      created_at
    FROM spaces
    WHERE owner_id = $1
    ORDER BY created_at DESC;
    `,
    [ownerId]
  );
  return result.rows;
};

const findById = async spaceId => {
  const result = await db.query(
    `
    SELECT
      space_id,
      owner_id,
      space_name,
      address,
      allowed_radius,
      price_per_radius,
      ST_Y(center::geometry) AS lat,
      ST_X(center::geometry) AS lng,
      created_at
    FROM spaces
    WHERE space_id = $1;
    `,
    [spaceId]
  );
  return result.rows[0] || null;
};

const listPublic = async () => {
  // Enhanced to detect current occupancy status
  const result = await db.query(
    `
    SELECT
      s.space_id,
      s.owner_id,
      s.space_name,
      s.address,
      s.allowed_radius,
      s.price_per_radius,
      ST_Y(s.center::geometry) AS lat,
      ST_X(s.center::geometry) AS lng,
      s.created_at,
      CASE 
        WHEN sr_occupied.request_id IS NOT NULL THEN 'RED'
        WHEN sr_soon.request_id IS NOT NULL THEN 'YELLOW'
        ELSE 'GREEN'
      END as occupancy_status
    FROM spaces s
    LEFT JOIN space_requests sr_occupied ON s.space_id = sr_occupied.space_id 
      AND sr_occupied.status = 'APPROVED'
      AND NOW() BETWEEN sr_occupied.start_time AND sr_occupied.end_time
    LEFT JOIN space_requests sr_soon ON s.space_id = sr_soon.space_id
      AND sr_soon.status = 'APPROVED'
      AND sr_soon.start_time BETWEEN NOW() AND NOW() + INTERVAL '1 hour'
    ORDER BY s.created_at DESC;
    `
  );
  return result.rows;
};

module.exports = {
  createSpace,
  listByOwner,
  findById,
  listPublic
};
