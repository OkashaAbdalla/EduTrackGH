/**
 * Public endpoints (no authentication required)
 */

const { getSystemSettings } = require("../services/adminConfigService");

const getSystemStatus = async (_req, res) => {
  try {
    const settings = await getSystemSettings();
    const maintenanceMode = !!settings.system?.maintenanceMode;
    return res.json({
      success: true,
      maintenanceMode,
      allowRegistration: settings.system?.allowRegistration !== false,
      message: maintenanceMode
        ? "EduTrack GH is currently under maintenance. Please try again later. Administrators can still sign in."
        : null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load system status" });
  }
};

module.exports = { getSystemStatus };
