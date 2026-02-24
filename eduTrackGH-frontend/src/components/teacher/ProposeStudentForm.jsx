/**
 * Propose Student Form - Teacher Component
 * Optimized for performance: minimal re-renders, fast validation
 */

import { useState } from 'react';
import { Button, FormInput, Modal } from '../common';
import { studentService } from '../../services';
import { useToast } from '../../context';

const ProposeStudentForm = ({ isOpen, onClose, classrooms = [], onSuccess }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    fullName: '',
    dateOfBirth: '',
    gender: '',
    classroomId: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.fullName || !formData.classroomId) {
      showToast('Student ID, name, and classroom are required', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await studentService.proposeStudent(formData);
      if (result.success) {
        showToast('Student proposed successfully. Awaiting headteacher approval.', 'success');
        setFormData({
          studentId: '',
          fullName: '',
          dateOfBirth: '',
          gender: '',
          classroomId: '',
          parentName: '',
          parentEmail: '',
          parentPhone: '',
        });
        onSuccess?.();
        onClose();
      } else {
        showToast(result.message || 'Failed to propose student', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to propose student', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Propose New Student">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Student ID"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            placeholder="e.g., P1-2026-001"
            required
          />
          <FormInput
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Student's full name"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Classroom *
          </label>
          <select
            name="classroomId"
            value={formData.classroomId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select classroom</option>
            {classrooms.map((classroom) => (
              <option key={classroom._id} value={classroom._id}>
                {classroom.name} - {classroom.grade}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Parent/Guardian Information (Optional)
          </h4>
          <div className="space-y-4">
            <FormInput
              label="Parent Name"
              name="parentName"
              value={formData.parentName}
              onChange={handleChange}
              placeholder="Parent/Guardian name"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Parent Email"
                name="parentEmail"
                type="email"
                value={formData.parentEmail}
                onChange={handleChange}
                placeholder="parent@example.com"
              />
              <FormInput
                label="Parent Phone"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                placeholder="0241234567"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            Propose Student
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProposeStudentForm;