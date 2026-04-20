/**
 * Active GES calendar — fetched from API; engine drives attendance UI rules.
 * Non-blocking: engine uses embedded fallback until API returns; dedupes concurrent fetches.
 */

import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthContext } from './AuthContext';
import calendarService from '../services/calendarService';
import { buildEngineFromPayload, getEmbeddedFallbackPayload } from '../utils/gesCalendarEngine';

const CalendarContext = createContext({
  engine: null,
  loading: false,
  refresh: async () => {},
  academicYear: null,
  source: null,
});

export function CalendarProvider({ children }) {
  const { isAuthenticated } = useAuthContext();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const fetchPromiseRef = useRef(null);

  const load = useCallback(async () => {
    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }
    fetchPromiseRef.current = (async () => {
      try {
        const { data } = await calendarService.getActiveCalendar();
        if (data?.success && data.terms?.length) {
          setPayload(data);
          return;
        }
      } catch (e) {
        console.warn('Calendar API unavailable, using embedded fallback', e?.message);
      }
      setPayload(null);
    })().finally(() => {
      fetchPromiseRef.current = null;
    });
    return fetchPromiseRef.current;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setPayload(null);
      setLoading(false);
      fetchPromiseRef.current = null;
      return;
    }
    setLoading(false);
    load();
  }, [isAuthenticated, load]);

  const engine = useMemo(() => {
    const p = payload?.terms?.length ? payload : getEmbeddedFallbackPayload();
    return buildEngineFromPayload(p);
  }, [payload]);

  const value = useMemo(
    () => ({
      engine,
      loading,
      refresh: load,
      academicYear: engine.academicYearLabel,
      source: payload?.source || (payload ? 'api' : 'fallback'),
    }),
    [engine, loading, load, payload]
  );

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendar() {
  return useContext(CalendarContext);
}
