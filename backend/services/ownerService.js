const ownerRepository = require("../repositories/ownerRepository");
const spaceRepository = require("../repositories/spaceRepository");
const requestRepository = require("../repositories/requestRepository");
const notificationService = require("../services/notificationService");
const adminRepository = require("../repositories/adminRepository");
const userRepository = require("../repositories/userRepository");

const ensureOwnerProfile = async userId => {
  const owner = await ownerRepository.findByUserId(userId);
  if (!owner) {
    const err = new Error("Owner profile not found for this user");
    err.status = 404;
    throw err;
  }
  return owner;
};

const createSpace = async (userId, payload) => {
  const owner = await ensureOwnerProfile(userId);
  const {
    spaceName,
    address,
    lat,
    lng,
    allowedRadius,
    pricePerRadius,
    aadharNumber,
    aadharName,
    chittaNumber,
    chittaName,
    image1Url,
    image2Url
  } = payload;

  if (!lat || !lng) {
    const err = new Error("lat and lng are required");
    err.status = 400;
    throw err;
  }

  if (!allowedRadius || allowedRadius <= 0) {
    const err = new Error("allowedRadius must be a positive number");
    err.status = 400;
    throw err;
  }

  const space = await spaceRepository.createSpace({
    ownerId: owner.owner_id,
    spaceName,
    address,
    lat: Number(lat),
    lng: Number(lng),
    allowedRadius: Number(allowedRadius),
    pricePerRadius: Number(pricePerRadius || 0),
    aadharNumber,
    aadharName,
    chittaNumber,
    chittaName,
    image1Url,
    image2Url
  });

  // Notify all admin users about the new space
  try {
    const user = await userRepository.findById(userId);
    const ownerName = user?.name || owner.owner_name || "Unknown";
    const adminUserIds = await adminRepository.getAdminUserIds();
    await Promise.all(
      adminUserIds.map(adminId =>
        notificationService.createNewOwnerSpaceNotification(adminId, spaceName || "Unnamed", ownerName)
      )
    );
  } catch (notifErr) {
    console.error("Failed to send admin notifications:", notifErr);
  }

  return { space };
};

const listSpaces = async userId => {
  console.log(`[DEBUG] listSpaces called for userId: ${userId}`);
  const owner = await ensureOwnerProfile(userId);
  console.log(`[DEBUG] Resolved ownerId: ${owner.owner_id}`);
  const spaces = await spaceRepository.listByOwner(owner.owner_id);
  console.log(`[DEBUG] Found ${spaces.length} spaces`);
  return { spaces };
};

const listRequests = async userId => {
  const owner = await ensureOwnerProfile(userId);
  const requests = await requestRepository.listOwnerRequests(owner.owner_id);
  return { requests };
};

const approveRequest = async (ownerUserId, requestId) => {
  // Get the request
  const request = await requestRepository.getRequestById(requestId);
  if (!request) {
    const err = new Error("Request not found");
    err.status = 404;
    throw err;
  }

  // Verify this owner owns the space
  const owner = await ensureOwnerProfile(ownerUserId);
  const space = await spaceRepository.findById(request.space_id);
  if (!space || String(space.owner_id) !== String(owner.owner_id)) {
    const err = new Error("You do not own this space");
    err.status = 403;
    throw err;
  }

  if (request.status !== "OWNER_PENDING") {
    const err = new Error(`Only OWNER_PENDING requests can be approved by owner (current: ${request.status})`);
    err.status = 409;
    throw err;
  }

  // Update to OWNER_APPROVED (now goes to admin queue)
  const updated = await requestRepository.updateOwnerApproval({
    requestId,
    status: "OWNER_APPROVED",
    ownerUserId
  });

  // Notify vendor that owner approved
  try {
    const vendorUserId = await adminRepository.getVendorUserId(request.vendor_id);
    if (vendorUserId) {
      await notificationService.createOwnerApprovalGrantedNotification(
        vendorUserId,
        requestId,
        space.space_name || "Unnamed"
      );
    }
  } catch (notifErr) {
    console.error("Failed to notify vendor of owner approval:", notifErr);
  }

  // Notify admins about the new pending request
  try {
    const adminUserIds = await adminRepository.getAdminUserIds();
    await Promise.all(
      adminUserIds.map(adminId =>
        notificationService.createNewVendorRequestNotification(
          adminId,
          requestId,
          request.business_name || "Unknown"
        )
      )
    );
  } catch (notifErr) {
    console.error("Failed to notify admins:", notifErr);
  }

  return { request: updated };
};

const rejectRequest = async (ownerUserId, requestId, remarks) => {
  // Get the request
  const request = await requestRepository.getRequestById(requestId);
  if (!request) {
    const err = new Error("Request not found");
    err.status = 404;
    throw err;
  }

  // Verify this owner owns the space
  const owner = await ensureOwnerProfile(ownerUserId);
  const space = await spaceRepository.findById(request.space_id);
  if (!space || String(space.owner_id) !== String(owner.owner_id)) {
    const err = new Error("You do not own this space");
    err.status = 403;
    throw err;
  }

  if (request.status !== "OWNER_PENDING") {
    const err = new Error(`Only OWNER_PENDING requests can be rejected by owner (current: ${request.status})`);
    err.status = 409;
    throw err;
  }

  // Update to OWNER_REJECTED
  const updated = await requestRepository.updateOwnerApproval({
    requestId,
    status: "OWNER_REJECTED",
    ownerUserId
  });

  // Notify vendor
  try {
    const vendorUserId = await adminRepository.getVendorUserId(request.vendor_id);
    if (vendorUserId) {
      await notificationService.createOwnerApprovalRejectedNotification(
        vendorUserId,
        requestId,
        space.space_name || "Unnamed",
        remarks
      );
    }
  } catch (notifErr) {
    console.error("Failed to notify vendor of owner rejection:", notifErr);
  }

  return { request: updated };
};

module.exports = {
  createSpace,
  listSpaces,
  listRequests,
  approveRequest,
  rejectRequest
};
