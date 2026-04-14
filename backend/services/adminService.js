const jwt = require("jsonwebtoken");
const db = require("../config/db");
const adminRepository = require("../repositories/adminRepository");
const auditLogRepository = require("../repositories/auditLogRepository");
const notificationService = require("../services/notificationService");

const listPendingRequests = async () => {
  const pending = await adminRepository.listPendingRequests();
  const withConflicts = await Promise.all(
    pending.map(async r => {
      const conflicts = await adminRepository.listConflictsForPending(r.request_id);
      return { ...r, conflicts };
    })
  );
  return { requests: withConflicts };
};

const listHistoryRequests = async () => {
  // Returns all requests (APPROVED, REJECTED, PENDING)
  const all = await adminRepository.listAllRequests();
  return { requests: all };
};

const approveRequest = async ({ adminUserId, requestId, remarks, ipAddress }) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const request = await adminRepository.getRequestForUpdate(client, requestId);
    if (!request) {
      const err = new Error("Request not found");
      err.status = 404;
      throw err;
    }

    if (request.status !== "PENDING" && request.status !== "OWNER_APPROVED") {
      const err = new Error(`Only PENDING or OWNER_APPROVED requests can be approved (current: ${request.status})`);
      err.status = 409;
      throw err;
    }

    // Re-check conflicts inside the transaction to prevent race approvals
    const conflicts = await adminRepository.checkApprovedConflictsTx(client, {
      spaceId: request.space_id,
      lat: request.lat,
      lng: request.lng,
      maxWidth: request.max_width,
      maxLength: request.max_length,
      startTime: request.start_time,
      endTime: request.end_time,
      requestId: request.request_id
    });

    if (conflicts.length > 0) {
      const err = new Error("Cannot approve: spatial/temporal conflicts with existing approved request(s)");
      err.status = 409;
      err.conflicts = conflicts;
      throw err;
    }

    const updated = await adminRepository.updateRequestStatusTx(client, {
      requestId,
      status: "APPROVED",
      reviewedBy: adminUserId,
      remarks
    });

    // Create QR payload with all necessary info (will be updated with permit_id after creation)
    const qrPayloadObj = {
      permit_id: null, // Will be set after creation
      request_id: updated.request_id,
      vendor_id: updated.vendor_id,
      start_time: updated.start_time,
      end_time: updated.end_time
    };

    const permit = await adminRepository.createPermitTx(client, {
      requestId: updated.request_id,
      qrPayload: jwt.sign({ temp: "pending" }, process.env.JWT_SECRET), // Temporary, will update
      validFrom: updated.start_time,
      validTo: updated.end_time
    });

    // Update QR payload with permit_id
    qrPayloadObj.permit_id = permit.permit_id;
    const finalQrPayload = jwt.sign(qrPayloadObj, process.env.JWT_SECRET, { expiresIn: "1y" });

    // Update permit with final QR payload
    await client.query(
      `UPDATE permits SET qr_payload = $1 WHERE permit_id = $2`,
      [finalQrPayload, permit.permit_id]
    );

    permit.qr_payload = finalQrPayload;

    await client.query("COMMIT");

    // Audit log outside tx is fine; failure won't break legality
    await auditLogRepository.createLog({
      adminId: adminUserId,
      action: "APPROVE_REQUEST",
      entityType: "space_requests",
      targetId: updated.request_id,
      ipAddress
    });

    // Send notifications
    const vendorUserId = await adminRepository.getVendorUserId(updated.vendor_id);
    if (vendorUserId) {
      await notificationService.createRequestApprovedNotification(vendorUserId, updated.request_id);
      await notificationService.createPermitIssuedNotification(vendorUserId, updated.request_id, permit.permit_id);
    }

    // --- BLOCKCHAIN INTEGRATION ---
    // We do this asynchronously/after commit so we don't block the UI if blockchain is slow
    // But for this demo, we'll await it to ensure we get the hash back immediately
    try {
      const blockchainService = require('./blockchainService');
      // Unique data to hash: Permit ID + Valid From + Vendor ID
      const uniqueString = `${permit.permit_id}-${permit.valid_from}-${updated.vendor_id}`;
      const txHash = await blockchainService.recordPermitOnChain(uniqueString);

      if (txHash) {
        // Update DB with the hash
        await db.query(
          `UPDATE permits SET transaction_hash = $1 WHERE permit_id = $2`,
          [txHash, permit.permit_id]
        );
        permit.transaction_hash = txHash;
      }
    } catch (bcError) {
      console.error("Blockchain recording failed but permit issued:", bcError);
      // We do NOT rollback the permit.
    }
    // -----------------------------    


    return { request: updated, permit };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const rejectRequest = async ({ adminUserId, requestId, remarks, ipAddress }) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const request = await adminRepository.getRequestForUpdate(client, requestId);
    if (!request) {
      const err = new Error("Request not found");
      err.status = 404;
      throw err;
    }

    if (request.status !== "PENDING" && request.status !== "OWNER_APPROVED") {
      const err = new Error(`Only PENDING or OWNER_APPROVED requests can be rejected (current: ${request.status})`);
      err.status = 409;
      throw err;
    }

    const updated = await adminRepository.updateRequestStatusTx(client, {
      requestId,
      status: "REJECTED",
      reviewedBy: adminUserId,
      remarks
    });

    await client.query("COMMIT");

    await auditLogRepository.createLog({
      adminId: adminUserId,
      action: "REJECT_REQUEST",
      entityType: "space_requests",
      targetId: updated.request_id,
      ipAddress
    });

    // Send notification
    // Send notification
    const vendorUserId = await adminRepository.getVendorUserId(updated.vendor_id);
    if (vendorUserId) {
      await notificationService.createRequestRejectedNotification(vendorUserId, updated.request_id, remarks);
    }

    return { request: updated };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const listPermits = async () => {
  const permits = await adminRepository.listPermits();
  return { permits };
};

const listAuditLogs = async () => {
  const logs = await auditLogRepository.listRecent({ limit: 200 });
  return { logs };
};

const getDashboardStats = async () => {
  const stats = await adminRepository.getDashboardStats();
  return { stats };
};

const listVendors = async () => {
  const vendors = await adminRepository.listVendors();
  return { vendors };
};

const listOwners = async () => {
  const owners = await adminRepository.listOwners();
  return { owners };
};

const getOwnerDetails = async (ownerId) => {
  const owner = await adminRepository.getOwnerDetails(ownerId);
  return { owner };
};

const getVendorDetails = async (vendorId) => {
  const vendor = await adminRepository.getVendorDetails(vendorId);
  return { vendor };
};

const listPendingSpaces = async () => {
  const spaces = await adminRepository.listPendingSpaces();
  return { spaces };
};

const approveSpace = async ({ adminUserId, spaceId, termsConditions, ipAddress }) => {
  const updated = await adminRepository.updateSpaceStatus(spaceId, 'APPROVED', termsConditions);
  
  if (!updated) {
    const err = new Error("Space not found");
    err.status = 404;
    throw err;
  }

  await auditLogRepository.createLog({
    adminId: adminUserId,
    action: "APPROVE_SPACE",
    entityType: "spaces",
    targetId: spaceId,
    ipAddress
  });

  try {
    const spaceWithOwner = await db.query(`SELECT owner_id, space_name FROM spaces WHERE space_id = $1`, [spaceId]);
    if (spaceWithOwner.rows.length > 0) {
        const ownerRec = spaceWithOwner.rows[0];
        const userRec = await db.query(`SELECT user_id FROM owners WHERE owner_id = $1`, [ownerRec.owner_id]);
        if (userRec.rows.length > 0) {
             const ownerUserId = userRec.rows[0].user_id;
             await notificationService.createSpaceApprovedNotification(ownerUserId, ownerRec.space_name);
        }
    }
  } catch(e) { console.error("Could not notify owner:", e); }

  return { space: updated };
};

const rejectSpace = async ({ adminUserId, spaceId, ipAddress }) => {
  const updated = await adminRepository.updateSpaceStatus(spaceId, 'REJECTED', null);
  
  if (!updated) {
    const err = new Error("Space not found");
    err.status = 404;
    throw err;
  }

  await auditLogRepository.createLog({
    adminId: adminUserId,
    action: "REJECT_SPACE",
    entityType: "spaces",
    targetId: spaceId,
    ipAddress
  });
  
  try {
    const spaceWithOwner = await db.query(`SELECT owner_id, space_name FROM spaces WHERE space_id = $1`, [spaceId]);
    if (spaceWithOwner.rows.length > 0) {
        const ownerRec = spaceWithOwner.rows[0];
        const userRec = await db.query(`SELECT user_id FROM owners WHERE owner_id = $1`, [ownerRec.owner_id]);
        if (userRec.rows.length > 0) {
             const ownerUserId = userRec.rows[0].user_id;
             await notificationService.createSpaceRejectedNotification(ownerUserId, ownerRec.space_name);
        }
    }
  } catch(e) { console.error("Could not notify owner:", e); }

  return { space: updated };
};

module.exports = {
  listPendingRequests,
  listHistoryRequests,
  approveRequest,
  rejectRequest,
  listPermits,
  listPermits,
  listAuditLogs,
  getDashboardStats,
  listVendors,
  listOwners,
  listOwners,
  getOwnerDetails,
  getVendorDetails,
  listPendingSpaces,
  approveSpace,
  rejectSpace
};

