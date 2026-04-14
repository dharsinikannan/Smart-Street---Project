const router = require("express").Router();
const { body, param } = require("express-validator");
const adminController = require("../controllers/adminController");
const { authenticate, requireRoles } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

router.use(authenticate, requireRoles("ADMIN"));

router.get("/requests", adminController.listRequests);

router.post(
  "/requests/:id/approve",
  [
    param("id").isUUID().withMessage("valid request id is required"),
    body("remarks").optional().isString().isLength({ max: 2000 })
  ],
  validateRequest,
  adminController.approve
);

router.post(
  "/requests/:id/reject",
  [
    param("id").isUUID().withMessage("valid request id is required"),
    body("remarks").optional().isString().isLength({ max: 2000 })
  ],
  validateRequest,
  adminController.reject
);

router.get("/permits", adminController.listPermits);
router.get("/audit-logs", adminController.listAuditLogs);
router.get("/stats", adminController.getStats);
router.get("/vendors", adminController.listVendors);
router.get("/vendors/:id", [
  param("id").isUUID().withMessage("valid vendor id is required")
],
  validateRequest,
  adminController.getVendor
);

router.get("/owners", adminController.listOwners);
router.get("/owners/:id", [
  param("id").isUUID().withMessage("valid owner id is required")
],
  validateRequest,
  adminController.getOwner
);

// Space Verification Endpoints (Phase 2)
router.get("/spaces/pending", adminController.listPendingSpaces);

router.post(
  "/spaces/:id/approve",
  [
    param("id").isUUID().withMessage("valid space id is required"),
    body("termsConditions").optional().isString().isLength({ max: 5000 })
  ],
  validateRequest,
  adminController.approveSpace
);

router.post(
  "/spaces/:id/reject",
  [
    param("id").isUUID().withMessage("valid space id is required")
  ],
  validateRequest,
  adminController.rejectSpace
);

module.exports = router;

