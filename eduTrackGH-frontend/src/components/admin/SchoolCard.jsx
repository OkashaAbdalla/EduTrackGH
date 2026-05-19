/**
 * School Card — solid glass panel for readable school metadata
 */

import { Card, Button } from '../common';

const SchoolCard = ({ school, onEdit, onToggleStatus }) => {
  const levelBadge =
    school.schoolLevel === 'PRIMARY'
      ? 'badge-neutral'
      : school.schoolLevel === 'JHS'
        ? 'badge-neutral'
        : 'badge-neutral';

  return (
    <Card variant="solid" className="p-5 h-full flex flex-col" hover>
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="ui-section-title ui-truncate mb-1.5" title={school.name}>
            {school.name}
          </h3>
          <span className={`${levelBadge} capitalize`}>{school.schoolLevel}</span>
        </div>
        <span className={school.isActive ? 'badge-success shrink-0' : 'badge-danger shrink-0'}>
          {school.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {school.location?.region && (
        <p className="text-sm text-[color:var(--text-secondary)] mb-2 truncate" title={school.location.region}>
          {school.location.region}
          {school.location.district ? `, ${school.location.district}` : ''}
        </p>
      )}

      {school.schoolLevel === 'BOTH' ? (
        <div className="text-sm text-[color:var(--text-secondary)] space-y-1 mb-2">
          <p className="ui-truncate" title={school.primaryHeadteacher?.fullName}>
            Primary: {school.primaryHeadteacher?.fullName || 'Unassigned'}
          </p>
          <p className="ui-truncate" title={school.jhsHeadteacher?.fullName}>
            JHS: {school.jhsHeadteacher?.fullName || 'Unassigned'}
          </p>
        </div>
      ) : school.headteacher ? (
        <p className="text-sm text-[color:var(--text-secondary)] mb-2 ui-truncate" title={school.headteacher.fullName}>
          {school.headteacher.fullName}
        </p>
      ) : (
        <p className="text-sm text-[color:var(--warning)] mb-2">No headteacher assigned</p>
      )}

      <div className="flex gap-2 mt-auto pt-4">
        <Button onClick={() => onEdit(school)} variant="primary" size="sm" className="flex-1">
          {school.schoolLevel === 'BOTH' ? 'Edit' : school.headteacher ? 'Edit' : 'Assign Headteacher'}
        </Button>
        <Button
          onClick={() => onToggleStatus(school)}
          variant={school.isActive ? 'danger' : 'primary'}
          size="sm"
          className="flex-1"
        >
          {school.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </Card>
  );
};

export default SchoolCard;
