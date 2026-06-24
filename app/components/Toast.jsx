'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'error') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed', top: '3.75rem', right: '1.25rem', zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '0.75rem', pointerEvents: 'none',
      }}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const styles = {
    error:   { bg: '#ff453a', icon: '✕', label: 'Error' },
    success: { bg: '#30d158', icon: '✓', label: 'Done' },
    warning: { bg: '#ff9f0a', icon: '!', label: 'Warning' },
    info:    { bg: '#0071e3', icon: 'i', label: 'Info' },
  };

  const s = styles[toast.type] || styles.error;

  return (
    <div style={{
      pointerEvents: 'auto', display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
      padding: '0.75rem 1rem', borderRadius: '1rem', minWidth: '280px', maxWidth: '24rem',
      background: 'rgba(28, 28, 30, 0.95)', backdropFilter: 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: 'saturate(180%) blur(20px)', border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      animation: 'toastSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    }}>
      <div style={{
        flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: s.bg, color: '#fff', fontSize: '0.75rem', fontWeight: 700, marginTop: '2px',
      }}>
        {s.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: '0 0 2px', color: s.bg }}>{s.label}</p>
        <p style={{ fontSize: '0.875rem', color: '#fff', margin: 0, lineHeight: 1.4 }}>{toast.message}</p>
      </div>
      <button onClick={onClose} style={{
        flexShrink: 0, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
        cursor: 'pointer', fontSize: '1.125rem', lineHeight: 1, marginTop: '2px', padding: 0,
      }}>
        ×
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
