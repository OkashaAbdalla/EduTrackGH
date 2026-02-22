/**
 * School Card Component
 * Purpose: Display individual school information card
 */

import { Card, Button } from '../common';

const SchoolCard = ({ school, onEdit, onToggleStatus }) => {
  const getLevelBadgeClass = (level) => {
    switch (level) {
      case 'PRIMARY':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'JHS':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Card className="p-5 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{school.name}</h3>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeClass(school.schoolLevel)}`}>
            {school.schoolLevel}
          </span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          school.isActive
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {school.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {school.location?.region && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          📍 {school.location.region}{school.location.district ? `, ${school.location.district}` : ''}
        </p>
      )}

      {school.headteacher ? (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          👤 {school.headteacher.fullName}
        </p>
      ) : (
        <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
          ⚠️ No headteacher assigned
        </p>
      )}

      <div className="flex gap-2 mt-4">
        <Button
          onClick={() => onEdit(school)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
        >
          {school.headteacher ? 'Edit' : 'Assign Headteacher'}
        </Button>
        <Button
          onClick={() => onToggleStatus(school)}
          className={`flex-1 text-sm py-2 ${
            school.isActive
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {school.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </Card>
  );
};

export default SchoolCard;
