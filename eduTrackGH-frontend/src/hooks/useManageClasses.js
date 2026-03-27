/**
 * useManageClasses – data and handlers for headteacher Manage Classes page
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast, useAuthContext } from '../context';
import { headteacherService } from '../services';

export function useManageClasses() {
  const { showToast } = useToast();
  const { user } = useAuthContext();
  const schoolLevel = user?.schoolLevel;
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingClass, setEditingClass] = useState(null);
  const [viewDetailsClass, setViewDetailsClass] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const mapClassrooms = (classrooms) =>
    (classrooms || []).map((cls) => ({
      id: cls._id,
      name: cls.name,
      grade: cls.grade,
      teacherId: cls.teacherId?._id || cls.teacherId || '',
      teacherName: cls.teacherId?.fullName || 'Unassigned',
      teacherEmail: cls.teacherId?.email || '',
      teacherStatus: cls.teacherId?.isActive ? 'Available' : 'Inactive',
      students: cls.studentCount || 0,
    }));

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [teachersResult, classroomsResult] = await Promise.all([
        headteacherService.getTeachers(),
        headteacherService.getClassrooms(),
      ]);
      if (teachersResult.success) setTeachers(teachersResult.teachers || []);
      else showToast(teachersResult.message || 'Failed to load teachers', 'error');
      if (classroomsResult.success) setClasses(mapClassrooms(classroomsResult.classrooms));
      else showToast(classroomsResult.message || 'Failed to load classes', 'error');
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEditTeacher = useCallback((classItem) => {
    setEditingClass(classItem);
    setSelectedTeacher(classItem.teacherId || '');
  }, []);

  const handleUnassignTeacher = useCallback(async (classItem) => {
    if (!classItem.teacherId) return;
    setSaving(true);
    try {
      const result = await headteacherService.assignClassTeacher(classItem.id, null);
      if (result.success) {
        setClasses((prev) =>
          prev.map((cls) =>
            cls.id === classItem.id
              ? { ...cls, teacherId: '', teacherName: 'Unassigned', teacherEmail: '', teacherStatus: '' }
              : cls
          )
        );
        showToast(`${classItem.name} teacher unassigned`, 'success');
      } else showToast(result.message || 'Failed to unassign', 'error');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to unassign', 'error');
    } finally {
      setSaving(false);
    }
  }, [showToast]);

  const handleSaveAssignment = useCallback(async () => {
    if (!selectedTeacher) {
      showToast('Please select a teacher', 'error');
      return;
    }
    setSaving(true);
    try {
      const result = await headteacherService.assignClassTeacher(editingClass.id, selectedTeacher);
      if (result.success) {
        const updated = result.classroom;
        const teacherName = updated.teacherId?.fullName || 'Unassigned';
        const teacherEmail = updated.teacherId?.email || '';
        const teacherStatus = updated.teacherId?.isActive ? 'Available' : 'Inactive';
        setClasses((prev) =>
          prev.map((cls) =>
            cls.id === editingClass.id
              ? { ...cls, teacherId: updated.teacherId?._id || updated.teacherId, teacherName, teacherEmail, teacherStatus }
              : cls
          )
        );
        showToast(`${editingClass.name} assigned to ${teacherName}`, 'success');
        setEditingClass(null);
        setSelectedTeacher('');
      } else showToast(result.message || 'Failed to save assignment', 'error');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save assignment', 'error');
    } finally {
      setSaving(false);
    }
  }, [editingClass, selectedTeacher, showToast]);

  const handleCancel = useCallback(() => {
    setEditingClass(null);
    setSelectedTeacher('');
  }, []);

  const handleSeedDefaultClasses = useCallback(async () => {
    setSeeding(true);
    try {
      const result = await headteacherService.seedDefaultClassrooms();
      if (result.success) {
        setClasses(mapClassrooms(result.classrooms));
        const createdCount = result.createdCount || 0;
        const label = schoolLevel === 'JHS' ? 'JHS 1–3' : schoolLevel === 'PRIMARY' ? 'P1–P6' : 'default classrooms';
        const msg = createdCount > 0 ? `Created ${createdCount} ${label} for your school` : `All ${label} already exist for your school`;
        showToast(msg, 'success');
      } else showToast(result.message || 'Failed to create default classes', 'error');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create default classes', 'error');
    } finally {
      setSeeding(false);
    }
  }, [schoolLevel, showToast]);

  return {
    classes,
    teachers,
    loading,
    editingClass,
    selectedTeacher,
    setSelectedTeacher,
    saving,
    seeding,
    schoolLevel,
    viewDetailsClass,
    setViewDetailsClass,
    handleEditTeacher,
    handleUnassignTeacher,
    handleSaveAssignment,
    handleCancel,
    handleSeedDefaultClasses,
  };
}
