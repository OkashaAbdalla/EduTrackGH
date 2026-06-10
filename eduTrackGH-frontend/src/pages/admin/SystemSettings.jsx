/**
 * System Settings Page (Admin)
 * Purpose: Configure system-wide settings
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Button } from '../../components/common';
import {
  AttendanceSettings,
  FaceRecognitionSettings,
  NotificationSettings,
  SystemSettingsSection,
} from '../../components/admin';
import adminService from '../../services/adminService';
import { useToast, useConfirm } from '../../context';

const SystemSettings = () => {
  const { showToast } = useToast();
  const { requestConfirmation } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    attendance: {
      markingWindowStart: '07:30',
      markingWindowEnd: '09:00',
      chronicAbsenteeismThreshold: 3,
      absenteeismPercentageThreshold: 10,
      gracePeriodHours: 24,
    },
    faceRecognition: {
      confidenceThreshold: 0.7,
      enabled: true,
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
    },
    system: {
      maintenanceMode: false,
      allowRegistration: true,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSystemSettings();
      if (response.success && response.settings) {
        setSettings(response.settings);
      }
    } catch (error) {
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const ok = await requestConfirmation({
      title: 'Save system settings',
      message:
        'Applies attendance deadlines, absenteeism thresholds, notifications, and system access rules for all schools.',
      confirmText: 'Save',
      cancelText: 'Cancel',
      tone: 'primary',
    });
    if (!ok) return;

    const payload = {
      ...settings,
      attendance: {
        ...settings.attendance,
        chronicAbsenteeismThreshold:
          settings.attendance.chronicAbsenteeismThreshold === '' ||
          settings.attendance.chronicAbsenteeismThreshold == null
            ? 3
            : Number(settings.attendance.chronicAbsenteeismThreshold),
        absenteeismPercentageThreshold:
          settings.attendance.absenteeismPercentageThreshold === '' ||
          settings.attendance.absenteeismPercentageThreshold == null
            ? 10
            : Number(settings.attendance.absenteeismPercentageThreshold),
        gracePeriodHours:
          settings.attendance.gracePeriodHours === '' || settings.attendance.gracePeriodHours == null
            ? 24
            : Number(settings.attendance.gracePeriodHours),
      },
    };

    try {
      setSaving(true);
      const response = await adminService.updateSystemSettings(payload);
      if (response.success) {
        if (response.settings) setSettings(response.settings);
        showToast('Settings saved successfully', 'success');
      } else {
        showToast(response.message || 'Failed to save settings', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">System Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Configure system-wide settings and preferences</p>
        </div>

        <div className="space-y-6">
          <AttendanceSettings
            settings={settings.attendance}
            onUpdate={updateSetting}
          />

          <FaceRecognitionSettings
            settings={settings.faceRecognition}
            onUpdate={updateSetting}
          />

          <NotificationSettings
            settings={settings.notifications}
            onUpdate={updateSetting}
          />

          <SystemSettingsSection
            settings={settings.system}
            onUpdate={updateSetting}
          />

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SystemSettings;
