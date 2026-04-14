const notificationRepository = require("../repositories/notificationRepository");

const createRequestApprovedNotification = async (vendorId, requestId) => {
  return await notificationRepository.createNotification({
    userId: vendorId,
    type: "REQUEST_APPROVED",
    title: "Request Approved",
    message: "Your space request has been approved by an administrator.",
    relatedRequestId: requestId
  });
};

const createRequestRejectedNotification = async (vendorId, requestId, remarks) => {
  return await notificationRepository.createNotification({
    userId: vendorId,
    type: "REQUEST_REJECTED",
    title: "Request Rejected",
    message: remarks ? `Your space request was rejected: ${remarks}` : "Your space request has been rejected by an administrator.",
    relatedRequestId: requestId
  });
};

const createPermitIssuedNotification = async (vendorId, requestId, permitId) => {
  return await notificationRepository.createNotification({
    userId: vendorId,
    type: "PERMIT_ISSUED",
    title: "Permit Issued",
    message: "Your permit has been issued and is now valid.",
    relatedRequestId: requestId,
    relatedPermitId: permitId
  });
};

const createPermitRevokedNotification = async (vendorId, permitId) => {
  return await notificationRepository.createNotification({
    userId: vendorId,
    type: "PERMIT_REVOKED",
    title: "Permit Revoked",
    message: "Your permit has been revoked by an administrator.",
    relatedPermitId: permitId
  });
};

const createNewVendorRequestNotification = async (adminUserId, requestId, vendorName) => {
  return await notificationRepository.createNotification({
    userId: adminUserId,
    type: "NEW_VENDOR_REQUEST",
    title: "New Vendor Request",
    message: `Vendor "${vendorName}" has submitted a new space request.`,
    relatedRequestId: requestId
  });
};

const createNewOwnerSpaceNotification = async (adminUserId, spaceName, ownerName) => {
  return await notificationRepository.createNotification({
    userId: adminUserId,
    type: "NEW_OWNER_SPACE",
    title: "New Owner Location",
    message: `Owner "${ownerName}" has registered a new space "${spaceName}".`
  });
};

const createSpaceApprovedNotification = async (ownerUserId, spaceName) => {
  return await notificationRepository.createNotification({
    userId: ownerUserId,
    type: "SPACE_APPROVED",
    title: "Space Approved",
    message: `Your space "${spaceName}" has been approved by an administrator and is now live.`
  });
};

const createSpaceRejectedNotification = async (ownerUserId, spaceName) => {
  return await notificationRepository.createNotification({
    userId: ownerUserId,
    type: "SPACE_REJECTED",
    title: "Space Rejected",
    message: `Your space "${spaceName}" was rejected by an administrator following verification.`
  });
};

const createOwnerSpaceRequestNotification = async (ownerUserId, requestId, vendorName, spaceName) => {
  return await notificationRepository.createNotification({
    userId: ownerUserId,
    type: "OWNER_SPACE_REQUEST",
    title: "Vendor Space Request",
    message: `Vendor "${vendorName}" has requested to use your space "${spaceName}". Please review and approve or reject.`,
    relatedRequestId: requestId
  });
};

const createOwnerApprovalGrantedNotification = async (vendorUserId, requestId, spaceName) => {
  return await notificationRepository.createNotification({
    userId: vendorUserId,
    type: "OWNER_APPROVAL_GRANTED",
    title: "Owner Approved Your Request",
    message: `The owner of space "${spaceName}" has approved your request. It is now pending admin review.`,
    relatedRequestId: requestId
  });
};

const createOwnerApprovalRejectedNotification = async (vendorUserId, requestId, spaceName, remarks) => {
  return await notificationRepository.createNotification({
    userId: vendorUserId,
    type: "OWNER_APPROVAL_REJECTED",
    title: "Owner Rejected Your Request",
    message: remarks
      ? `The owner of space "${spaceName}" rejected your request: ${remarks}`
      : `The owner of space "${spaceName}" has rejected your request.`,
    relatedRequestId: requestId
  });
};

module.exports = {
  createRequestApprovedNotification,
  createRequestRejectedNotification,
  createPermitIssuedNotification,
  createPermitRevokedNotification,
  createNewVendorRequestNotification,
  createNewOwnerSpaceNotification,
  createSpaceApprovedNotification,
  createSpaceRejectedNotification,
  createOwnerSpaceRequestNotification,
  createOwnerApprovalGrantedNotification,
  createOwnerApprovalRejectedNotification,
  repository: notificationRepository
};