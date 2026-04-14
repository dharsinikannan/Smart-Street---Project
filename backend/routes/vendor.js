const router = require("express").Router();
const { body } = require("express-validator");
const vendorController = require("../controllers/vendorController");
const { authenticate, requireRoles } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

router.use(authenticate);

router.get("/spaces", vendorController.listPublicSpaces);

router.use(requireRoles("VENDOR"));

router.post(
  "/requests",
  [
    body("spaceId").optional({ nullable: true }).isUUID().withMessage("valid spaceId (UUID) is required"),
    body("lat").isFloat({ min: -90, max: 90 }).withMessage("lat must be between -90 and 90"),
    body("lng").isFloat({ min: -180, max: 180 }).withMessage("lng must be between -180 and 180"),
    body("maxWidth").isFloat({ gt: 0 }).withMessage("maxWidth must be a positive number"),
    body("maxLength").isFloat({ gt: 0 }).withMessage("maxLength must be a positive number"),
    body("startTime").isISO8601().withMessage("startTime must be ISO8601 timestamp"),
    body("endTime").isISO8601().withMessage("endTime must be ISO8601 timestamp")
  ],
  validateRequest,
  vendorController.submitRequest
);

router.get("/requests", vendorController.listRequests);
router.get("/permits", vendorController.listPermits);
router.get("/analytics", vendorController.getAnalytics);
router.get("/favorites", vendorController.getFavorites);
router.post("/favorites", vendorController.toggleFavorite);
router.get("/storefront", vendorController.getStorefront);
router.post("/storefront", vendorController.addStorefront);
router.put("/storefront", vendorController.updateStorefront);

module.exports = router;
