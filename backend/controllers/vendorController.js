const vendorService = require("../services/vendorService");
const spaceRepository = require("../repositories/spaceRepository");

const submitRequest = async (req, res, next) => {
  try {
    const request = await vendorService.submitRequest(req.user.userId, req.body);
    res.status(201).json({
      success: true,
      message: "Space request submitted successfully",
      request
    });
  } catch (err) {
    next(err);
  }
};

const listRequests = async (req, res, next) => {
  try {
    const requests = await vendorService.listRequests(req.user.userId);
    res.json({
      success: true,
      requests
    });
  } catch (err) {
    next(err);
  }
};

const listPublicSpaces = async (req, res, next) => {
  try {
    const spaces = await spaceRepository.listPublic();
    res.json({
      success: true,
      spaces
    });
  } catch (err) {
    next(err);
  }
};

const listPermits = async (req, res, next) => {
  try {
    const permits = await vendorService.listPermits(req.user.userId);
    res.json({
      success: true,
      permits
    });
  } catch (err) {
    next(err);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await vendorService.getAnalytics(req.user.userId);
    res.json({ success: true, analytics });
  } catch (err) {
    next(err);
  }
};

const getFavorites = async (req, res, next) => {
  try {
    const favorites = await vendorService.getFavorites(req.user.userId);
    res.json({ success: true, favorites });
  } catch (err) {
    next(err);
  }
};

const toggleFavorite = async (req, res, next) => {
  try {
    const { spaceId } = req.body;
    const result = await vendorService.toggleFavorite(req.user.userId, spaceId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const updateStorefront = async (req, res, next) => {
  try {
    const storefront = await vendorService.updateStorefront(req.user.userId, req.body);
    res.json({ success: true, storefront });
  } catch (err) {
    next(err);
  }
};

const getStorefront = async (req, res, next) => {
  try {
    const storefront = await vendorService.getStorefront(req.user.userId);
    res.json({ success: true, storefront });
  } catch (err) {
    next(err);
  }
};

const addStorefront = async (req, res, next) => {
  try {
    const storefront = await vendorService.addStorefront(req.user.userId, req.body);
    res.status(201).json({ success: true, storefront });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitRequest,
  listRequests,
  listPublicSpaces,
  listPermits,
  getAnalytics,
  getFavorites,
  toggleFavorite,
  updateStorefront,
  getStorefront,
  addStorefront
};
