/**
 * Socket Context
 * Connects to backend Socket.IO, provides socket instance and event listeners
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthContext } from './AuthContext';

// Provide a non-null default so consumers can safely destructure
const defaultSocketContext = {
  socket: null,
  connected: false,
};

const SocketContext = createContext(defaultSocketContext);

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

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

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', () => setConnected(false));

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
