/**
 * Create Teacher modal – form only
 */

import { Button } from '../common';
import { generateSecurePassword } from '../../hooks/useManageTeachers';

export default function CreateTeacherModal({
  open,
  onClose,
  formData,
  setFormData,
  errors,
  saving,
  onSave,
  showToast,
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Teacher</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Teacher will be linked to your school automatically.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form className="space-y-4" onSubmit={onSave}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="e.g. Ama Mensah" />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="teacher@example.com" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone (optional)</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="0241234567" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Temporary Password</label>
              <button type="button" onClick={() => { setFormData((p) => ({ ...p, password: generateSecurePassword() })); showToast('New password generated', 'success'); }} className="text-xs text-green-700 dark:text-green-300 hover:underline">Regenerate</button>
            </div>
            <div className="flex items-center space-x-2">
              <input type="text" name="password" value={formData.password} onChange={handleChange} className="flex-1 px-3 py-2 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              <button type="button" onClick={() => { navigator.clipboard.writeText(formData.password || ''); showToast('Password copied', 'success'); }} className="px-3 py-2 text-xs border rounded-lg border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">Copy</button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving}>Create Teacher</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
