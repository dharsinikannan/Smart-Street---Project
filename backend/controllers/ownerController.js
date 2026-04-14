const ownerService = require("../services/ownerService");

const createSpace = async (req, res, next) => {
  try {
    const result = await ownerService.createSpace(req.user.userId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const listSpaces = async (req, res, next) => {
  try {
    console.log(`[DEBUG] Controller listSpaces user: ${req.user.userId}`);
    const result = await ownerService.listSpaces(req.user.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const listRequests = async (req, res, next) => {
  try {
    const result = await ownerService.listRequests(req.user.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const approveRequest = async (req, res, next) => {
  try {
    const result = await ownerService.approveRequest(req.user.userId, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const rejectRequest = async (req, res, next) => {
  try {
    const result = await ownerService.rejectRequest(req.user.userId, req.params.id, req.body.remarks);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSpace,
  listSpaces,
  listRequests,
  approveRequest,
  rejectRequest
};
