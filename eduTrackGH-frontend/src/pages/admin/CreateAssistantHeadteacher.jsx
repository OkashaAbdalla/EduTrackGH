/**
 * Create Assistant Headteacher (Admin)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { FormInput } from '../../components/common';
import { ROUTES } from '../../utils/constants';
import adminService from '../../services/adminService';
import { useToast } from '../../context';

const CreateAssistantHeadteacher = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [schools, setSchools] = useState([]);
  const [headteachers, setHeadteachers] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    schoolId: '',
    schoolLevel: 'PRIMARY',
    linkedHeadteacherId: '',
    tempPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([adminService.getSchools(false), adminService.getHeadteachers(false)]).then(([schoolRes, htRes]) => {
      if (schoolRes.success) setSchools(schoolRes.schools || []);
      if (htRes.success) setHeadteachers(htRes.headteachers || []);
    }).catch(() => {});
  }, []);

  const filteredHeadteachers = headteachers.filter(
    (ht) =>
      (!formData.schoolId || String(ht.school?._id || ht.school) === String(formData.schoolId)) &&
      ht.schoolLevel === formData.schoolLevel
  );

  const generatePassword = () => {
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
    setFormData((prev) => ({ ...prev, tempPassword: password }));
    return password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const tempPassword = formData.tempPassword?.trim() || generatePassword();
    setLoading(true);
    try {
      const result = await adminService.createAssistantHeadteacher({
        ...formData,
        tempPassword,
      });
      if (result.success) {
        showToast('Assistant headteacher created', 'success');
        navigate(ROUTES.MANAGE_ASSISTANT_HEADTEACHERS);
      } else {
        setError(result.message || 'Failed to create assistant');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create assistant headteacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Create Assistant Headteacher</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Link an assistant to a headteacher for temporary school cover</p>
        </div>
        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 ui-card p-6">
          <FormInput label="Full Name" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
          <FormInput label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          <FormInput label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          <div>
            <label className="block text-sm font-medium mb-1">School</label>
            <select
              value={formData.schoolId}
              onChange={(e) => setFormData({ ...formData, schoolId: e.target.value, linkedHeadteacherId: '' })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              required
            >
              <option value="">Select school</option>
              {schools.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Section</label>
            <select
              value={formData.schoolLevel}
              onChange={(e) => setFormData({ ...formData, schoolLevel: e.target.value, linkedHeadteacherId: '' })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <option value="PRIMARY">Primary</option>
              <option value="JHS">JHS</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Linked Headteacher</label>
            <select
              value={formData.linkedHeadteacherId}
              onChange={(e) => setFormData({ ...formData, linkedHeadteacherId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              required
            >
              <option value="">Select headteacher</option>
              {filteredHeadteachers.map((ht) => (
                <option key={ht.id || ht._id} value={ht.id || ht._id}>{ht.fullName} ({ht.email})</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <FormInput
              label="Temporary Password"
              type="text"
              value={formData.tempPassword}
              onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
              className="flex-1"
              required
            />
            <button type="button" onClick={generatePassword} className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm mb-0.5">
              Generate
            </button>
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Assistant Headteacher'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateAssistantHeadteacher;
