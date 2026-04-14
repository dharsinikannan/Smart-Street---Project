const db = require("../config/db");

const findByUserId = async userId => {
  const result = await db.query(
    `SELECT * FROM owners WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return result.rows[0];
};

const getOwnerUserIdBySpaceId = async spaceId => {
  const result = await db.query(
    `SELECT o.user_id FROM owners o
     JOIN spaces s ON s.owner_id = o.owner_id
     WHERE s.space_id = $1 LIMIT 1`,
    [spaceId]
  );
  return result.rows[0]?.user_id || null;
};

module.exports = {
  findByUserId,
  getOwnerUserIdBySpaceId
};
