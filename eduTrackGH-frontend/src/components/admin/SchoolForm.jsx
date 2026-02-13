/**
 * School Form Component
 * Purpose: Reusable form for creating and editing schools
 */

import { FormInput, Button } from '../common';

const SchoolForm = ({ formData, onFormChange, onSubmit, onCancel, submitting, headteachers, mode = 'create' }) => {
  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [section, key] = field.split('.');
      onFormChange({
        ...formData,
        [section]: {
          ...formData[section],
          [key]: value,
        },
      });
    } else {
      onFormChange({
        ...formData,
        [field]: value,
      });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormInput
        label="School Name"
        name="name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="Tamale Central Primary School"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          School Level <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.schoolLevel}
          onChange={(e) => handleChange('schoolLevel', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
          required
        >
          <option value="PRIMARY">Primary School</option>
          <option value="JHS">Junior High School</option>
          <option value="BOTH">Both Primary & JHS</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
        <div className="space-y-2">
          <FormInput
            label="Region"
            value={formData.location.region}
            onChange={(e) => handleChange('location.region', e.target.value)}
            placeholder="Northern Region"
          />
          <FormInput
            label="District"
            value={formData.location.district}
            onChange={(e) => handleChange('location.district', e.target.value)}
            placeholder="Tamale Metropolitan"
          />
          <FormInput
            label="Address"
            value={formData.location.address}
            onChange={(e) => handleChange('location.address', e.target.value)}
            placeholder="Street address"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact</label>
        <div className="space-y-2">
          <FormInput
            label="Phone"
            value={formData.contact.phone}
            onChange={(e) => handleChange('contact.phone', e.target.value)}
            placeholder="0241234567"
          />
          <FormInput
            label="Email"
            type="email"
            value={formData.contact.email}
            onChange={(e) => handleChange('contact.email', e.target.value)}
            placeholder="school@example.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Assign Headteacher (Optional)
        </label>
        <select
          value={formData.headteacherId}
          onChange={(e) => handleChange('headteacherId', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select headteacher...</option>
          {headteachers
            .filter(ht => ht.isActive && !ht.school)
            .map(ht => (
              <option key={ht._id} value={ht._id}>
                {ht.fullName} ({ht.schoolLevel || 'N/A'})
              </option>
            ))}
        </select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          {submitting ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create School' : 'Update School')}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          className="px-6 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default SchoolForm;
