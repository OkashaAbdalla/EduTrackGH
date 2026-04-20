/**
 * Headteacher – school GPS boundary for attendance (geo-fence)
 */

const School = require('../models/School');
const { isValidLatLng } = require('../utils/geo');

const MIN_RADIUS = 10;
const MAX_RADIUS = 1000;

function getSchoolId(req) {
  return req.user?.school || null;
}

const getSchoolLocation = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }
    const school = await School.findById(schoolId).select('location').lean();
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    const { latitude, longitude, radius } = school.location || {};
    return res.json({
      success: true,
      location:
        latitude != null && longitude != null && radius != null
          ? { latitude, longitude, radius }
          : null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to load school location' });
  }
};

const setSchoolLocation = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }
    const lat = Number(req.body?.latitude);
    const lng = Number(req.body?.longitude);
    const radius = Number(req.body?.radius);

    if (!isValidLatLng(lat, lng)) {
      return res.status(400).json({ success: false, message: 'Invalid latitude or longitude' });
    }
    if (!Number.isFinite(radius) || radius < MIN_RADIUS || radius > MAX_RADIUS) {
      return res.status(400).json({
        success: false,
        message: `Radius must be between ${MIN_RADIUS} and ${MAX_RADIUS} meters`,
      });
    }

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    school.set('location.latitude', lat);
    school.set('location.longitude', lng);
    school.set('location.radius', radius);
    await school.save();

    return res.json({
      success: true,
      message: 'School location updated successfully',
      location: { latitude: lat, longitude: lng, radius },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to update school location' });
  }
};

module.exports = { getSchoolLocation, setSchoolLocation };
