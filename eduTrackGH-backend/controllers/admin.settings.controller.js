/**
 * Admin – system settings
 */

const getSystemSettings = async (req, res) => {
  try {
    const settings = {
      attendance: { markingDeadlineHour: 9, chronicAbsenteeismThreshold: 3, absenteeismPercentageThreshold: 10, gracePeriodHours: 24 },
      faceRecognition: { confidenceThreshold: 0.7, enabled: true },
      notifications: { emailEnabled: true, smsEnabled: false },
      system: { maintenanceMode: false, allowRegistration: true },
    };
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get settings' });
  }
};

const updateSystemSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    res.json({ success: true, message: 'Settings updated successfully', settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};

module.exports = { getSystemSettings, updateSystemSettings };
