const router = require("express").Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const validateRequest = require("../middleware/validateRequest");
const { authenticate } = require("../middleware/authMiddleware");

// Temporary dict to hold memory-based tokens for demo
global.resetTokens = global.resetTokens || {};

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("name is required"),
    body("email").isEmail().withMessage("valid email required"),
    body("password").isLength({ min: 8 }).withMessage("password must be at least 8 characters"),
    body("role").isIn(["VENDOR", "OWNER", "ADMIN", "USER"]).withMessage("role must be VENDOR, OWNER, ADMIN, or USER"),
    body("phone").optional().isString()
  ],
  validateRequest,
  authController.register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("valid email required"),
    body("password").isLength({ min: 8 }).withMessage("password must be at least 8 characters"),
    body("rememberMe").optional().isBoolean()
  ],
  validateRequest,
  authController.login
);

// Auto-login: validates the remember_me cookie, returns a fresh JWT
router.post("/auto-login", authController.autoLogin);

// Logout: revokes the current remember-me token and clears the cookie
router.post("/logout", authController.logout);

// Logout all sessions: requires valid JWT + revokes all remember-me tokens
router.post("/logout-all", authenticate, authController.logoutAll);

router.post(
  "/forgot-password",
  [
    body("email").isEmail().withMessage("valid email required")
  ],
  validateRequest,
  authController.forgotPassword
);

router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("token required"),
    body("newPassword").isLength({ min: 8 }).withMessage("new password must be at least 8 characters")
  ],
  validateRequest,
  authController.resetPassword
);

router.get("/me", authenticate, authController.me);

router.put(
  "/me",
  [authenticate, body("name").trim().notEmpty().withMessage("name is required"), validateRequest],
  authController.updateProfile
);

router.put(
  "/me/password",
  [
    authenticate,
    body("currentPassword").notEmpty().withMessage("current password required"),
    body("newPassword").isLength({ min: 8 }).withMessage("new password must be at least 8 characters"),
    validateRequest
  ],
  authController.changePassword
);

module.exports = router;
