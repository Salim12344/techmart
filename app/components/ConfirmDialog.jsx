'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ConfirmContext = createContext(null);

const C = {
  card: '#ffffff', text: '#1d1d1f', muted: '#86868b',
  border: '#e8e8ed', blue: '#0071e3', red: '#ff453a',
};

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirmAction = useCallback((options) => {
    const opts = typeof options === 'string' ? { message: options } : options;
    setState({
      title: opts.title || 'Are you sure?',
      message: opts.message || '',
      confirmLabel: opts.confirmLabel || 'Confirm',
      cancelLabel: opts.cancelLabel || 'Cancel',
      destructive: opts.destructive !== false,
    });
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const handle = (result) => {
    setState(null);
    if (resolver.current) {
      resolver.current(result);
      resolver.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={confirmAction}>
      {children}
      {state && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-message"
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => handle(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.card, borderRadius: '20px', padding: '1.75rem',
              width: '100%', maxWidth: '360px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
              animation: 'confirmDialogIn 0.2s cubic-bezier(0.25,0.1,0.25,1) both',
            }}
          >
            <h2 id="confirm-dialog-title" style={{ fontSize: '1.125rem', fontWeight: 700, color: C.text, margin: '0 0 0.5rem', letterSpacing: '-0.01em' }}>
              {state.title}
            </h2>
            {state.message && (
              <p id="confirm-dialog-message" style={{ fontSize: '0.9375rem', color: C.muted, margin: '0 0 1.5rem', lineHeight: 1.5 }}>
                {state.message}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: state.message ? 0 : '1.5rem' }}>
              <button
                onClick={() => handle(false)}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '980px',
                  border: `1px solid ${C.border}`, background: 'transparent',
                  color: C.text, fontSize: '0.9375rem', fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {state.cancelLabel}
              </button>
              <button
                onClick={() => handle(true)}
                autoFocus
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '980px',
                  border: 'none', background: state.destructive ? C.red : C.blue,
                  color: '#fff', fontSize: '0.9375rem', fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
          <style>{`
            @keyframes confirmDialogIn {
              from { opacity: 0; transform: scale(0.95) translateY(8px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
