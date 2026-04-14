const router = require("express").Router();
const notificationController = require("../controllers/notificationController");
const { authenticate } = require("../middleware/authMiddleware");

router.use(authenticate);

router.get("/", notificationController.getNotifications);
router.put("/:id/read", notificationController.markAsRead);
router.put("/mark-all-read", notificationController.markAllAsRead);

module.exports = router;