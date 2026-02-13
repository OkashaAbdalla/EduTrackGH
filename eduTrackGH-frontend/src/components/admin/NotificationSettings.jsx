/**
 * Notification Settings Component
 * Purpose: Notification configuration section
 */

import { Card } from '../common';

const NotificationSettings = ({ settings, onUpdate }) => {
  const updateSetting = (key, value) => {
    onUpdate('notifications', key, value);
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notification Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.emailEnabled}
              onChange={(e) => updateSetting('emailEnabled', e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Email Notifications
            </span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
            Send email notifications to parents and teachers
          </p>
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.smsEnabled}
              onChange={(e) => updateSetting('smsEnabled', e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable SMS Notifications
            </span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
            Send SMS notifications (requires SMS service configuration)
          </p>
        </div>
      </div>
    </Card>
  );
};

export default NotificationSettings;
