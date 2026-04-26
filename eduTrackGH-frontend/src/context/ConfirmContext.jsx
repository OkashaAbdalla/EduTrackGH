import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Modal from '../components/common/Modal';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [pending, setPending] = useState(null);

  const requestConfirmation = useCallback(({ title, message, confirmText, cancelText, tone } = {}) => {
    return new Promise((resolve) => {
      setPending({
        title: title || 'Please confirm',
        message: message || 'Are you sure you want to continue?',
        confirmText: confirmText || 'Confirm',
        cancelText: cancelText || 'Cancel',
        tone: tone || 'danger',
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    if (!pending) return;
    pending.resolve(false);
    setPending(null);
  }, [pending]);

  const handleConfirm = useCallback(() => {
    if (!pending) return;
    pending.resolve(true);
    setPending(null);
  }, [pending]);

  const value = useMemo(() => ({ requestConfirmation }), [requestConfirmation]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal isOpen={!!pending} onClose={handleClose} title={pending?.title || 'Please confirm'} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {pending?.message}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              {pending?.cancelText || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`rounded-lg px-3 py-2 text-sm font-semibold text-white ${
                pending?.tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {pending?.confirmText || 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context;
};

