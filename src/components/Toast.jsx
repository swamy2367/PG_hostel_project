import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from './Icons';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev =>
          prev.map(t => (t.id === id ? { ...t, exiting: true } : t))
        );
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, 250);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev =>
      prev.map(t => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 250);
  }, []);

  const toast = useCallback({
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
  }, [addToast]);

  const iconMap = {
    success: <CheckCircleIcon size={18} style={{ color: 'var(--success)' }} />,
    error: <XCircleIcon size={18} style={{ color: 'var(--danger)' }} />,
    warning: <AlertTriangleIcon size={18} style={{ color: 'var(--warning)' }} />,
    info: <InfoIcon size={18} style={{ color: 'var(--info)' }} />,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast toast-${t.type} ${t.exiting ? 'toast-exit' : ''}`}
          >
            {iconMap[t.type]}
            <span style={{ flex: 1 }}>{t.message}</span>
            <button className="toast-close" onClick={() => removeToast(t.id)}>
              <XIcon size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Return a no-op fallback if used outside provider
    return {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    };
  }
  return ctx;
}

export default ToastProvider;
