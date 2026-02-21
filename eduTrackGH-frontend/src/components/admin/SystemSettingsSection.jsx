/**
 * System Settings Section Component
 * Purpose: System-wide configuration section
 */

import { Card } from '../common';

const SystemSettingsSection = ({ settings, onUpdate }) => {
  const updateSetting = (key, value) => {
    onUpdate('system', key, value);
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">System Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Maintenance Mode
            </span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
            Temporarily disable system access for maintenance
          </p>
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.allowRegistration}
              onChange={(e) => updateSetting('allowRegistration', e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Allow Public Registration
            </span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
            Allow new users to register accounts
          </p>
        </div>
      </div>
    </Card>
  );
};

export default SystemSettingsSection;
