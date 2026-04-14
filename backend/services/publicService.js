const jwt = require("jsonwebtoken");
const publicRepository = require("../repositories/publicRepository");

const listVendors = async () => {
  return await publicRepository.listApprovedVendors();
};

const searchVendors = async filters => {
  return await publicRepository.searchVendors(filters);
};

const getCongestionData = async ({ bounds, zoom }) => {
  return await publicRepository.getVendorDensity({ bounds, zoom });
};

const verifyPermit = async qrCodeData => {
  if (!qrCodeData) {
    const err = new Error("Data is required");
    err.status = 400;
    throw err;
  }

  let decoded = null;
  let permit = null;
  const isUUID = /^[0-9a-fA-F-]{8,36}$/.test(qrCodeData.trim());

  if (isUUID) {
    // It's a Permit ID (or fragment)
    permit = await publicRepository.findPermitById(qrCodeData.trim());
  } else {
    // It's likely a JWT
    try {
      decoded = jwt.verify(qrCodeData, process.env.JWT_SECRET);
      permit = await publicRepository.findPermitByQrData(qrCodeData);
    } catch (err) {
      // If not UUID and not valid JWT, throw 401
      const error = new Error("Invalid QR code signature or ID format");
      error.status = 401;
      throw error;
    }
  }

  if (!permit) {
    const err = new Error("Permit not found");
    err.status = 404;
    throw err;
  }

  const now = new Date();
  const validFrom = new Date(permit.valid_from);
  const validTo = new Date(permit.valid_to);

  const checks = {
    permitStatus: permit.permit_status === "VALID",
    timeValidity: now <= validTo, // Not expired
    isFuture: now < validFrom,
    isActiveNow: now >= validFrom && now <= validTo,
    requestStatus: permit.status === "APPROVED",
    spatialCorrectness: true
  };

  const isValid = checks.permitStatus && checks.timeValidity && checks.requestStatus && checks.spatialCorrectness;

  return {
    valid: isValid,
    permit: {
      permitId: permit.permit_id,
      businessName: permit.business_name,
      category: permit.category,
      licenseNumber: permit.license_number,
      vendorName: permit.vendor_name,
      spaceName: permit.space_name,
      address: permit.address,
      validFrom: permit.valid_from,
      validTo: permit.valid_to,
      permitStatus: permit.permit_status,
      issuedAt: permit.issued_at,
      transactionHash: permit.transaction_hash // Expose to Frontend
    },
    checks,
    decoded
  };
};

module.exports = {
  listVendors,
  searchVendors,
  getCongestionData,
  verifyPermit
};
