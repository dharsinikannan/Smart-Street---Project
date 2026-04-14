const publicService = require("../services/publicService");

const listVendors = async (req, res, next) => {
  try {
    const vendors = await publicService.listVendors();
    res.json({
      success: true,
      vendors
    });
  } catch (err) {
    next(err);
  }
};

const searchVendors = async (req, res, next) => {
  try {
    const { query, category, spaceId } = req.query;
    const vendors = await publicService.searchVendors({ query, category, spaceId });
    res.json({
      success: true,
      vendors
    });
  } catch (err) {
    next(err);
  }
};

const getRoutes = async (req, res, next) => {
  try {
    const { bounds, zoom } = req.query;
    const parsedBounds = bounds ? JSON.parse(bounds) : null;
    const congestionData = await publicService.getCongestionData({
      bounds: parsedBounds,
      zoom: zoom ? Number(zoom) : null
    });
    res.json({
      success: true,
      congestion: congestionData
    });
  } catch (err) {
    next(err);
  }
};

const verifyPermit = async (req, res, next) => {
  try {
    const { permitId } = req.params || {};
    const { qrCodeData } = req.body || {};

    const codeToVerify = qrCodeData || permitId;
    if (!codeToVerify) {
      return res.status(400).json({
        success: false,
        message: "Either permitId (URL param) or qrCodeData (body) is required"
      });
    }

    const result = await publicService.verifyPermit(codeToVerify);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listVendors,
  searchVendors,
  getRoutes,
  verifyPermit
};
