/**
 * Assign teacher to classroom modal
 */

import { Modal, Button } from '../common';

export default function AssignClassroomModal({
  teacher,
  classrooms,
  assignClassroomId,
  setAssignClassroomId,
  assigning,
  onAssign,
  onClose,
}) {
  if (!teacher) return null;

  return (
    <Modal isOpen={!!teacher} onClose={onClose} title="Assign Classroom" size="md">
      <form onSubmit={onAssign} className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Assign <span className="font-medium text-gray-900 dark:text-white">{teacher.fullName}</span> to a classroom.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Classroom</label>
          <select
            value={assignClassroomId}
            onChange={(e) => setAssignClassroomId(e.target.value)}
            className="ui-select w-full"
          >
            <option value="">Select a classroom</option>
            {classrooms.map((c) => (
              <option key={c._id} value={c._id}>{c.name} ({c.grade})</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={assigning}>Cancel</Button>
          <Button type="submit" variant="primary" loading={assigning}>Assign</Button>
        </div>
      </form>
    </Modal>
  );
}
