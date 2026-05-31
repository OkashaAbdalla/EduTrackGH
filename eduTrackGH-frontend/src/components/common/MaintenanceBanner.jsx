/**
 * Shows a banner when the system is under maintenance (public pages).
 */

import { useEffect, useState } from 'react';
import publicService from '../../services/publicService';

const MaintenanceBanner = () => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    publicService.getSystemStatus().then((res) => {
      if (res.success) setStatus(res);
    });
  }, []);

  if (!status?.maintenanceMode) return null;

  return (
    <div
      role="alert"
      className="bg-amber-500 text-amber-950 px-4 py-3 text-center text-sm font-medium shadow-md"
    >
      {status.message || 'EduTrack GH is under maintenance. Sign-in is temporarily unavailable for teachers and parents.'}
    </div>
  );
};

export default MaintenanceBanner;
