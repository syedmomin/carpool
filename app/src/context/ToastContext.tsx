import React, { createContext, useContext, useCallback } from 'react';
import { showGlobalBanner } from '../utils/bannerBus';

export interface ToastContextState {
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
}

const ToastContext = createContext<ToastContextState | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', _duration?: number) => {
    if (!message) return;
    showGlobalBanner({ title: message, kind: type });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
