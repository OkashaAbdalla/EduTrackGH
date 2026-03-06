/**
 * Show generated password after creating teacher
 */

import { Button } from '../common';

export default function PasswordRevealModal({ open, password, onCopy, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Teacher Account Created</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Share this temporary password with the teacher. They can change it after first login.
        </p>
        <div className="flex items-center justify-between px-3 py-2 border rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 mb-4">
          <span className="font-mono text-sm text-gray-900 dark:text-white">{password}</span>
          <button onClick={onCopy} className="text-xs text-green-700 dark:text-green-300 hover:underline">Copy</button>
        </div>
        <div className="flex justify-end">
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}
