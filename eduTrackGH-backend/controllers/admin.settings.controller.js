/**
 * Admin – system settings (persisted in AdminConfig)
 */

const {
  getSystemSettings,
  saveSystemSettings,
  invalidateSystemSettingsCache,
} = require("../services/adminConfigService");

const getSystemSettingsHandler = async (_req, res) => {
  try {
    const settings = await getSystemSettings();
    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to get settings" });
  }
};

const updateSystemSettings = async (req, res) => {
  try {
    const { settings } = req.body || {};
    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ success: false, message: "Settings payload is required" });
    }
    const saved = await saveSystemSettings(settings);
    invalidateSystemSettingsCache();
    return res.json({
      success: true,
      message: "Settings updated successfully",
      settings: saved,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update settings" });
  }
};

module.exports = {
  getSystemSettings: getSystemSettingsHandler,
  updateSystemSettings,
};
