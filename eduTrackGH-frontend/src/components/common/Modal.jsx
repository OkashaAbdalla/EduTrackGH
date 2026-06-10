/**
 * Modal — glass overlay dialog
 */

import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="ui-modal-backdrop fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="flex min-h-full items-end sm:items-center justify-center p-2 sm:p-4">
        <div
          className={`ui-modal w-full ${sizeClasses[size]} max-h-[92dvh] flex flex-col transform transition-all`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {title && (
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-[color:var(--glass-border)] shrink-0">
              <h3 className="ui-section-title text-base sm:text-lg pr-2">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--glass)] transition"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="px-4 sm:px-5 py-4 overflow-y-auto flex-1 min-h-0">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
