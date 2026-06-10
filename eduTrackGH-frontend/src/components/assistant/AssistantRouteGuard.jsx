/**
 * Blocks assistant operational pages until delegation is active
 */

import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { useDelegationStatus } from '../../hooks/useDelegationStatus';

const AssistantRouteGuard = ({ children }) => {
  const { loading, isActing, status } = useDelegationStatus();

  // Only block on the very first load — keep content stable while refreshing in background
  if (loading && status === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="ui-spinner w-8 h-8" />
      </div>
    );
  }

  if (!isActing) {
    return <Navigate to={ROUTES.ASSISTANT_DASHBOARD} replace />;
  }

  return children;
};

export default AssistantRouteGuard;
