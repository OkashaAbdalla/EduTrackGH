/**
 * Toast Context
 * Purpose: Global toast notification management
 * Provides toast functionality to entire app
 */

import { createContext, useContext, useRef, useState, useCallback } from 'react';
import Toast from '../components/common/Toast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  // Single-toast system (prevents stacked spam).
  const [toast, setToast] = useState(null);
  const lastToastRef = useRef({ key: '', at: 0 });

  const showToast = useCallback((message, type = 'info') => {
    const safeMessage = String(message || '').trim();
    if (!safeMessage) return;

    const now = Date.now();
    const key = `${type}:${safeMessage}`;
    // Ignore exact duplicates fired repeatedly in a short window (common on multi-mount fetches).
    if (lastToastRef.current.key === key && now - lastToastRef.current.at < 2500) return;
    lastToastRef.current = { key, at: now };

    const id = `${now}-${Math.random().toString(36).slice(2)}`;
    setToast({ id, message: safeMessage, type });
  }, []);

  const hideToast = useCallback((id) => {
    setToast((prev) => (prev?.id === id ? null : prev));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toast ? (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => hideToast(toast.id)}
          />
        ) : null}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export default ToastContext;
