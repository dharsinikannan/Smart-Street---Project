const router = require("express").Router();
const publicController = require("../controllers/publicController");

router.get("/vendors", publicController.listVendors);
router.get("/search", publicController.searchVendors);
router.get("/routes", publicController.getRoutes);
router.get("/verify-permit/:permitId", publicController.verifyPermit);
router.post("/verify-permit", publicController.verifyPermit);

module.exports = router;
