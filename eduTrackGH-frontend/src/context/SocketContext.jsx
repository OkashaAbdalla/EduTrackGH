/**
 * Socket Context
 * Connects to backend Socket.IO, provides socket instance and event listeners
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthContext } from './AuthContext';
import { assertProductionApiConfigured, getSocketBaseUrl } from '../utils/envApi';

assertProductionApiConfigured();

// Provide a non-null default so consumers can safely destructure
const defaultSocketContext = {
  socket: null,
  connected: false,
};

const SocketContext = createContext(defaultSocketContext);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuthContext();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const sessionToken = sessionStorage.getItem('auth_token');
    let token = sessionToken;
    if (!token) {
      const localRole = localStorage.getItem('user_role');
      if (localRole === 'admin' || localRole === 'super_admin') {
        ['auth_token', 'user_role', 'user_email', 'user_name', 'user_schoolLevel'].forEach((k) =>
          localStorage.removeItem(k)
        );
        token = null;
      } else {
        token = localStorage.getItem('auth_token');
      }
    }
    if (!isAuthenticated || !token) {
      // Ensure we disconnect on logout
      if (socket) socket.disconnect();
      setSocket(null);
      setConnected(false);
      return;
    }

    const socketUrl = getSocketBaseUrl();
    if (!socketUrl) {
      if (import.meta.env.DEV) console.warn('[socket] Missing socket URL; set VITE_API_URL or enable dev proxy.');
      setSocket(null);
      setConnected(false);
      return;
    }

    const s = io(socketUrl, {
      auth: { token },
      // Polling first: Brave / strict networks sometimes block or delay WS upgrade; fallback works reliably.
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 12,
      reconnectionDelay: 750,
      timeout: 20000,
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', (err) => {
      setConnected(false);
      if (import.meta.env.DEV) console.warn('[socket] connect_error', err?.message || err);
    });

    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  // Reconnect whenever auth state changes (login/logout)
  }, [isAuthenticated]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context || defaultSocketContext;
};
