import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import Toast from '../components/Toast';

export interface ToastContextState {
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
}

const ToastContext = createContext<ToastContextState | null>(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ visible: true, message, type });
    timerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type as any}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
