/** Haversine distance in meters (WGS84) */
export function haversineMeters(lat1, lon1, lat2, lon2) {
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

export function isGeoFenceConfigured(schoolLike) {
  const loc = schoolLike?.location;
  if (!loc) return false;
  const lat = Number(loc.latitude);
  const lng = Number(loc.longitude);
  const r = Number(loc.radius);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Number.isFinite(r) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    r >= 10 &&
    r <= 1000
  );
}
