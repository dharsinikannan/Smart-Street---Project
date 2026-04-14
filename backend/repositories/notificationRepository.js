const db = require("../config/db");

const createNotification = async ({ userId, type, title, message, relatedRequestId, relatedPermitId }) => {
  const result = await db.query(
    `INSERT INTO notifications (user_id, type, title, message, related_request_id, related_permit_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *;`,
    [userId, type, title, message, relatedRequestId, relatedPermitId]
  );
  return result.rows[0];
};

const findByUserId = async userId => {
  const result = await db.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC;`,
    [userId]
  );
  return result.rows;
};

const markAsRead = async (userId, notificationId) => {
  const result = await db.query(
    `UPDATE notifications SET is_read = true WHERE notification_id = $1 AND user_id = $2 RETURNING *;`,
    [notificationId, userId]
  );
  return result.rows[0];
};

const markAllAsRead = async userId => {
  const result = await db.query(
    `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false RETURNING *;`,
    [userId]
  );
  return result.rows;
};

const getUnreadCount = async userId => {
  const result = await db.query(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false;`,
    [userId]
  );
  return parseInt(result.rows[0].count);
};

module.exports = {
  createNotification,
  findByUserId,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};