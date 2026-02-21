/**
 * Attendance Settings Component
 * Purpose: Attendance configuration section
 */

import { Card, FormInput } from '../common';

const AttendanceSettings = ({ settings, onUpdate }) => {
  const updateSetting = (key, value) => {
    onUpdate('attendance', key, value);
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Attendance Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Marking Deadline Hour
          </label>
          <FormInput
            type="number"
            min="0"
            max="23"
            value={settings.markingDeadlineHour}
            onChange={(e) => updateSetting('markingDeadlineHour', parseInt(e.target.value))}
            placeholder="9"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Teachers must mark attendance by this hour (24-hour format)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Chronic Absenteeism Threshold
          </label>
          <FormInput
            type="number"
            min="1"
            value={settings.chronicAbsenteeismThreshold}
            onChange={(e) => updateSetting('chronicAbsenteeismThreshold', parseInt(e.target.value))}
            placeholder="3"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Number of consecutive absences before flagging a student
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Absenteeism Percentage Threshold (%)
          </label>
          <FormInput
            type="number"
            min="0"
            max="100"
            value={settings.absenteeismPercentageThreshold}
            onChange={(e) => updateSetting('absenteeismPercentageThreshold', parseInt(e.target.value))}
            placeholder="10"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Flag students with absenteeism above this percentage
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Grace Period (Hours)
          </label>
          <FormInput
            type="number"
            min="0"
            value={settings.gracePeriodHours}
            onChange={(e) => updateSetting('gracePeriodHours', parseInt(e.target.value))}
            placeholder="24"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Allow marking previous day's attendance within this time window
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AttendanceSettings;
