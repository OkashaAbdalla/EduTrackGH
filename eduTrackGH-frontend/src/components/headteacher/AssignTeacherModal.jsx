/**
 * Modal to assign a teacher to a class (Manage Classes)
 */

import { Card } from '../common';

export default function AssignTeacherModal({
  editingClass,
  teachers,
  selectedTeacher,
  setSelectedTeacher,
  saving,
  onSave,
  onUnassign,
  onCancel,
}) {
  if (!editingClass) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 animate-scale-in">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Teacher</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Class: <span className="font-semibold">{editingClass.name}</span>
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Teacher</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{editingClass.teacherName || 'Unassigned'}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select New Teacher</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full bg-white dark:bg-gray-700/80 border-2 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-500/30 transition"
            >
              <option value="">-- Select a teacher --</option>
              {teachers.map((teacher) => (
                <option key={teacher.id || teacher._id} value={teacher.id || teacher._id}>
                  {teacher.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-3 pt-4">
            {editingClass?.teacherId && onUnassign && (
              <button
                onClick={() => onUnassign(editingClass)}
                disabled={saving}
                className="px-4 py-2.5 rounded-lg border-2 border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium disabled:opacity-50"
              >
                Unassign
              </button>
            )}
            <button
              onClick={onCancel}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving || !selectedTeacher}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 dark:from-green-600 dark:to-green-700 text-white hover:from-green-700 hover:to-green-800 transition font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Assign Teacher</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
