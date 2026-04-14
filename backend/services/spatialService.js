// Spatial service for pin-based geometry conversion (server-side only)

/**
 * Convert latitude and longitude to a PostGIS GEOGRAPHY(POINT)
 * Returns SQL fragment for direct use in queries
 */
const pointFromLatLng = (lat, lng) => {
  return `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
};

/**
 * Calculate radius from max_width and max_length (diagonal half)
 * Returns approximate radius in meters
 */
const radiusFromDims = (maxWidth, maxLength) => {
  // Approximate radius as half of diagonal
  const halfDiag = Math.sqrt(maxWidth ** 2 + maxLength ** 2) / 2;
  return halfDiag;
};

/**
 * Create a bounding box geometry from center point and dimensions
 * Returns SQL fragment for ST_MakeEnvelope
 */
const envelopeFromCenterAndDims = (lat, lng, maxWidth, maxLength) => {
  // Approximate: convert meters to degrees (rough approximation)
  const latDegPerMeter = 1 / 111320; // ~111.32 km per degree latitude
  const lngDegPerMeter = 1 / (111320 * Math.cos((lat * Math.PI) / 180));
  
  const halfWidthDeg = (maxWidth / 2) * lngDegPerMeter;
  const halfLengthDeg = (maxLength / 2) * latDegPerMeter;
  
  const west = lng - halfWidthDeg;
  const east = lng + halfWidthDeg;
  const south = lat - halfLengthDeg;
  const north = lat + halfLengthDeg;
  
  return `ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)::geography`;
};

module.exports = {
  pointFromLatLng,
  radiusFromDims,
  envelopeFromCenterAndDims
};
