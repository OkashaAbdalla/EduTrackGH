/**
 * Attendance Settings Component
 * Purpose: Attendance configuration section
 */

import { Card, FormInput } from '../common';

const parseNumberField = (raw, fallback) => {
  const trimmed = String(raw ?? '').trim();
  if (trimmed === '') return fallback;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : fallback;
};

const AttendanceSettings = ({ settings, onUpdate }) => {
  const updateSetting = (key, value) => {
    onUpdate('attendance', key, value);
  };

  const onNumberChange = (key, raw, fallback) => {
    const trimmed = String(raw ?? '').trim();
    if (trimmed === '') {
      updateSetting(key, '');
      return;
    }
    const n = Number(trimmed);
    if (Number.isFinite(n)) updateSetting(key, n);
  };

  const onNumberBlur = (key, fallback, min) => {
    const val = settings[key];
    if (val === '' || val === null || val === undefined || !Number.isFinite(Number(val))) {
      updateSetting(key, fallback);
      return;
    }
    let n = Number(val);
    if (min != null) n = Math.max(min, n);
    updateSetting(key, n);
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Attendance Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Marking Window Start
          </label>
          <FormInput
            type="time"
            value={settings.markingWindowStart || '07:30'}
            onChange={(e) => updateSetting('markingWindowStart', e.target.value)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Earliest time teachers can start marking attendance (24-hour format)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Marking Window End
          </label>
          <FormInput
            type="time"
            value={settings.markingWindowEnd || '09:00'}
            onChange={(e) => updateSetting('markingWindowEnd', e.target.value)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Latest time teachers can mark attendance for the current day (e.g. 7:30 AM – 9:00 AM)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Chronic Absenteeism Threshold
          </label>
          <FormInput
            type="number"
            min="1"
            value={settings.chronicAbsenteeismThreshold ?? ''}
            onChange={(e) => onNumberChange('chronicAbsenteeismThreshold', e.target.value, 3)}
            onBlur={() => onNumberBlur('chronicAbsenteeismThreshold', 3, 1)}
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
            value={settings.absenteeismPercentageThreshold ?? ''}
            onChange={(e) => onNumberChange('absenteeismPercentageThreshold', e.target.value, 10)}
            onBlur={() => onNumberBlur('absenteeismPercentageThreshold', 10, 0)}
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
            value={settings.gracePeriodHours ?? ''}
            onChange={(e) => onNumberChange('gracePeriodHours', e.target.value, 24)}
            onBlur={() => onNumberBlur('gracePeriodHours', 24, 0)}
            placeholder="24"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Allow marking previous day&apos;s attendance within this time window
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AttendanceSettings;
