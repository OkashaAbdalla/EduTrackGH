/**
 * Manage Schools Page (Admin)
 * Purpose: View, create, edit, and manage schools
 */

import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button, Modal } from '../../components/common';
import { SchoolCard, SchoolForm } from '../../components/admin';
import useSchools from '../../hooks/useSchools';

const ManageSchools = () => {
  const { schools, headteachers, loading, createSchool, updateSchool, toggleSchoolStatus } = useSchools();
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData());

  function getInitialFormData() {
    return {
      name: '',
      schoolLevel: 'PRIMARY',
      location: { region: '', district: '', address: '' },
      contact: { phone: '', email: '' },
      headteacherId: '',
    };
  }

  const resetForm = () => {
    setFormData(getInitialFormData());
  };

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await createSchool(formData);
    if (result.success) {
      setShowCreateModal(false);
      resetForm();
    }
    setSubmitting(false);
  };

  const handleUpdateSchool = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await updateSchool(selectedSchool._id, formData);
    if (result.success) {
      setShowEditModal(false);
      setSelectedSchool(null);
      resetForm();
    }
    setSubmitting(false);
  };

  const handleEdit = (school) => {
    setSelectedSchool(school);
    setFormData({
      name: school.name || '',
      schoolLevel: school.schoolLevel || 'PRIMARY',
      location: {
        region: school.location?.region || '',
        district: school.location?.district || '',
        address: school.location?.address || '',
      },
      contact: {
        phone: school.contact?.phone || '',
        email: school.contact?.email || '',
      },
      headteacherId: school.headteacher?._id || '',
    });
    setShowEditModal(true);
  };

  const handleToggleStatus = async (school) => {
    await toggleSchoolStatus(school);
  };

  const filteredSchools = filter === 'all' 
    ? schools 
    : schools.filter(s => filter === 'active' ? s.isActive : !s.isActive);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Manage Schools</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">View and manage all schools in the system</p>
          </div>
          <div className="flex gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Schools</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              + Add School
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filteredSchools.length === 0 ? (
          <Card className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Schools Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Get started by creating your first school</p>
            <Button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Create School
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchools.map((school) => (
              <SchoolCard
                key={school._id}
                school={school}
                onEdit={handleEdit}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}

        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="Create New School"
        >
          <SchoolForm
            formData={formData}
            onFormChange={setFormData}
            onSubmit={handleCreateSchool}
            onCancel={() => {
              setShowCreateModal(false);
              resetForm();
            }}
            submitting={submitting}
            headteachers={headteachers}
            mode="create"
          />
        </Modal>

        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSchool(null);
            resetForm();
          }}
          title="Edit School"
        >
          <SchoolForm
            formData={formData}
            onFormChange={setFormData}
            onSubmit={handleUpdateSchool}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedSchool(null);
              resetForm();
            }}
            submitting={submitting}
            headteachers={headteachers}
            mode="edit"
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default ManageSchools;
