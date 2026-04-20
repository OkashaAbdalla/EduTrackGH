/**
 * Haversine distance in meters between two WGS84 points.
 */
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function isValidLatLng(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/** True when school document has an active attendance geo-fence configured */
function isGeoFenceActive(location) {
  if (!location || typeof location !== "object") return false;
  const lat = Number(location.latitude);
  const lng = Number(location.longitude);
  const r = Number(location.radius);
  return (
    isValidLatLng(lat, lng) &&
    Number.isFinite(r) &&
    r >= 10 &&
    r <= 1000
  );
}

module.exports = { haversineMeters, isValidLatLng, isGeoFenceActive };
