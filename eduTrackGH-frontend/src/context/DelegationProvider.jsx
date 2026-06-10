/**
 * Shared delegation status for headteacher & assistant headteacher.
 * Single fetch — prevents sidebar menu flicker on route changes.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DelegationContext } from './delegationContext';
import { useAuthContext } from './AuthContext';
import { useSocket } from './SocketContext';
import { ROLES } from '../utils/constants';
import headteacherService from '../services/headteacherService';
import assistantHeadteacherService from '../services/assistantHeadteacherService';

export function DelegationProvider({ children }) {
  const { user } = useAuthContext();
  const { socket } = useSocket();
  const userId = user?._id || user?.id || null;
  const role = user?.role;
  const isRelevant = role === ROLES.ASSISTANT_HEADTEACHER || role === ROLES.HEADTEACHER;

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const lastUserIdRef = useRef(null);
  const statusRef = useRef(null);
  statusRef.current = status;

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      if (!user || !isRelevant) {
        setStatus(null);
        setLoading(false);
        lastUserIdRef.current = null;
        return;
      }

      if (!silent) setLoading(true);
      try {
        const res =
          role === ROLES.ASSISTANT_HEADTEACHER
            ? await assistantHeadteacherService.getDelegationStatus()
            : await headteacherService.getDelegationStatus();
        setStatus(res);
        lastUserIdRef.current = userId;
      } catch {
        if (!statusRef.current) setStatus(null);
      } finally {
        setLoading(false);
      }
    },
    [user, userId, role, isRelevant]
  );

  useEffect(() => {
    if (!isRelevant) {
      setStatus(null);
      setLoading(false);
      lastUserIdRef.current = null;
      return;
    }

    if (lastUserIdRef.current === userId && status !== null) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res =
          role === ROLES.ASSISTANT_HEADTEACHER
            ? await assistantHeadteacherService.getDelegationStatus()
            : await headteacherService.getDelegationStatus();
        if (!cancelled) {
          setStatus(res);
          lastUserIdRef.current = userId;
        }
      } catch {
        if (!cancelled && lastUserIdRef.current !== userId) setStatus(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, role, isRelevant]);

  useEffect(() => {
    if (!socket || !isRelevant) return undefined;
    const handler = () => refresh({ silent: true });
    socket.on('delegation_update', handler);
    socket.on('staff_notification', handler);
    return () => {
      socket.off('delegation_update', handler);
      socket.off('staff_notification', handler);
    };
  }, [socket, isRelevant, refresh]);

  const value = {
    loading: isRelevant ? loading : false,
    status: isRelevant ? status : null,
    isActing: Boolean(status?.isActing),
    pendingDelegation: status?.pendingDelegation || null,
    activeDelegation: status?.activeDelegation || null,
    refresh,
  };

  return <DelegationContext.Provider value={value}>{children}</DelegationContext.Provider>;
}
