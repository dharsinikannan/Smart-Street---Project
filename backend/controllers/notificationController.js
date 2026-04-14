const notificationService = require("../services/notificationService");

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.repository.findByUserId(req.user.userId);
    const unreadCount = await notificationService.repository.getUnreadCount(req.user.userId);
    res.json({
      notifications,
      unreadCount
    });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.repository.markAsRead(req.user.userId, req.params.id);
    if (!notification) {
      const err = new Error("Notification not found");
      err.status = 404;
      throw err;
    }
    res.json(notification);
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const notifications = await notificationService.repository.markAllAsRead(req.user.userId);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};