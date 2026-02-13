/**
 * Face Recognition Settings Component
 * Purpose: Face recognition configuration section
 */

import { Card, FormInput } from '../common';

const FaceRecognitionSettings = ({ settings, onUpdate }) => {
  const updateSetting = (key, value) => {
    onUpdate('faceRecognition', key, value);
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Face Recognition Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => updateSetting('enabled', e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Face Recognition
            </span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
            Allow students to mark attendance using face recognition
          </p>
        </div>

        {settings.enabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confidence Threshold (0.0 - 1.0)
            </label>
            <FormInput
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={settings.confidenceThreshold}
              onChange={(e) => updateSetting('confidenceThreshold', parseFloat(e.target.value))}
              placeholder="0.7"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum confidence score required for face recognition match (higher = more strict)
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FaceRecognitionSettings;
