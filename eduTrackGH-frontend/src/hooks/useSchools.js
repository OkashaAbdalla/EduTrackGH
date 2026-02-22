/**
 * useSchools Hook
 * Purpose: Custom hook for school management logic
 */

import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import cacheService from '../utils/cache';
import { useToast } from '../context';

const useSchools = () => {
  const { showToast } = useToast();
  const [schools, setSchools] = useState([]);
  const [headteachers, setHeadteachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchSchools(), fetchHeadteachers()]);
  };

  const fetchSchools = async () => {
    try {
      setLoading(true);
      // Try cached data first for instant display
      const cachedResponse = await adminService.getSchools(true);
      if (cachedResponse?.success && cachedResponse.schools) {
        setSchools(cachedResponse.schools);
        setLoading(false);
      }
      
      // Fetch fresh data
      const response = await adminService.getSchools(false);
      if (response.success) {
        setSchools(response.schools || []);
      }
    } catch (error) {
      showToast('Failed to load schools', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHeadteachers = async () => {
    try {
      // Try cached data first
      const cachedResponse = await adminService.getHeadteachers(true);
      if (cachedResponse?.success && cachedResponse.headteachers) {
        setHeadteachers(cachedResponse.headteachers);
      }
      
      // Fetch fresh data
      const response = await adminService.getHeadteachers(false);
      if (response.success) {
        setHeadteachers(response.headteachers || []);
      }
    } catch (error) {
      console.error('Failed to load headteachers:', error);
    }
  };

  const createSchool = async (formData) => {
    try {
      const response = await adminService.createSchool(formData);
      if (response.success) {
        showToast('School created successfully', 'success');
        await fetchSchools();
        return { success: true };
      } else {
        showToast(response.message || 'Failed to create school', 'error');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create school';
      showToast(message, 'error');
      return { success: false, message };
    }
  };

  const updateSchool = async (id, formData) => {
    try {
      const payload = {
        name: formData.name,
        schoolLevel: formData.schoolLevel,
        location: formData.location,
        contact: formData.contact,
        headteacherId: formData.headteacherId || null,
      };
      const response = await adminService.updateSchool(id, payload);
      if (response.success) {
        showToast('School updated successfully', 'success');
        cacheService.invalidate('/admin/schools');
        cacheService.invalidate('/admin/headteachers');
        await Promise.all([fetchSchools(), fetchHeadteachers()]);
        return { success: true };
      } else {
        showToast(response.message || 'Failed to update school', 'error');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update school';
      showToast(message, 'error');
      return { success: false, message };
    }
  };

  const toggleSchoolStatus = async (school) => {
    try {
      // Optimistic update - update UI immediately
      const newStatus = !school.isActive;
      setSchools(prevSchools => 
        prevSchools.map(s => 
          s._id === school._id ? { ...s, isActive: newStatus } : s
        )
      );

      const response = await adminService.toggleSchoolStatus(school._id);
      if (response.success) {
        showToast(`School ${response.school.isActive ? 'activated' : 'deactivated'}`, 'success');
        // Refresh to get latest data
        await fetchSchools();
        return { success: true };
      } else {
        // Revert on failure
        setSchools(prevSchools => 
          prevSchools.map(s => 
            s._id === school._id ? { ...s, isActive: !newStatus } : s
          )
        );
      }
      return { success: false };
    } catch (error) {
      // Revert on error
      setSchools(prevSchools => 
        prevSchools.map(s => 
          s._id === school._id ? { ...s, isActive: school.isActive } : s
        )
      );
      showToast('Failed to toggle school status', 'error');
      return { success: false };
    }
  };

  return {
    schools,
    headteachers,
    loading,
    createSchool,
    updateSchool,
    toggleSchoolStatus,
    refetch: fetchSchools,
  };
};

export default useSchools;
