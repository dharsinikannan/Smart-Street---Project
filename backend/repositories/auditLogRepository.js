const db = require("../config/db");

const createLog = async ({ adminId, action, entityType, targetId, ipAddress }) => {
  const result = await db.query(
    `
    INSERT INTO audit_logs (admin_id, action, entity_type, target_id, ip_address)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
    `,
    [adminId, action, entityType, targetId, ipAddress || null]
  );
  return result.rows[0];
};

const listRecent = async ({ limit = 200 } = {}) => {
  const result = await db.query(
    `
    SELECT *
    FROM audit_logs
    ORDER BY created_at DESC
    LIMIT $1;
    `,
    [limit]
  );
  return result.rows;
};

module.exports = {
  createLog,
  listRecent
};

