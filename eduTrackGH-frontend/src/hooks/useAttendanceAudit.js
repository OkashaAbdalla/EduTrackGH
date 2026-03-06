/**
 * useAttendanceAudit – data and handlers for admin Attendance Audit page
 */

import { useState, useEffect, useCallback } from 'react';
import adminService from '../services/adminService';
import { useToast } from '../context';

export function formatAuditTime(d) {
  if (!d) return '-';
  const dt = new Date(d);
  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatAuditDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString();
}

export function useAttendanceAudit() {
  const { showToast } = useToast();
  const [schools, setSchools] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [filters, setFilters] = useState({ schoolId: '', classroomId: '', date: '' });
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [flagsLoading, setFlagsLoading] = useState(false);

  useEffect(() => {
    const loadSchools = async () => {
      try {
        const res = await adminService.getSchools(false);
        if (res.success && res.schools) setSchools(res.schools);
      } catch (err) {
        console.error(err);
        showToast('Failed to load schools', 'error');
      }
    };
    loadSchools();
  }, [showToast]);

  useEffect(() => {
    if (filters.schoolId) {
      adminService.getSchoolClassrooms(filters.schoolId).then((res) => {
        if (res.success && res.classrooms) setClassrooms(res.classrooms);
        else setClassrooms([]);
      }).catch(() => setClassrooms([]));
    } else setClassrooms([]);
  }, [filters.schoolId]);

  useEffect(() => {
    const loadAudit = async () => {
      if (!filters.schoolId && !filters.classroomId && !filters.date) {
        setRecords([]);
        setSummary(null);
        return;
      }
      setLoading(true);
      try {
        const params = {};
        if (filters.schoolId) params.schoolId = filters.schoolId;
        if (filters.classroomId) params.classroomId = filters.classroomId;
        if (filters.date) params.date = filters.date;
        const res = await adminService.getAttendanceAudit(params);
        if (res.success) {
          setRecords(res.records || []);
          setSummary(res.summary || null);
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to load audit data', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadAudit();
  }, [filters.schoolId, filters.classroomId, filters.date, showToast]);

  useEffect(() => {
    setFlagsLoading(true);
    adminService.getAttendanceFlags({ resolved: 'false' })
      .then((res) => { if (res.success && res.flags) setFlags(res.flags); })
      .catch(() => setFlags([]))
      .finally(() => setFlagsLoading(false));
  }, []);

  const handleUnlock = useCallback(async (classroomId, date) => {
    try {
      const res = await adminService.unlockAttendance(classroomId, date);
      if (res.success) {
        showToast(res.message || 'Attendance unlocked', 'success');
        setFilters((f) => ({ ...f, date: f.date ? `${f.date}` : '' }));
      } else showToast(res.message || 'Failed to unlock', 'error');
    } catch (err) {
      showToast('Failed to unlock attendance', 'error');
    }
  }, [showToast]);

  return {
    schools,
    classrooms,
    filters,
    setFilters,
    records,
    summary,
    flags,
    loading,
    flagsLoading,
    handleUnlock,
  };
}
