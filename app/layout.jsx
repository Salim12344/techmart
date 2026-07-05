// app/layout.jsx
'use client';

import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/app/components/Toast';
import { ConfirmProvider } from '@/app/components/ConfirmDialog';
import './globals.css';

export default function RootLayout({ children }) {
  // Runs once per hard page load (not on client-side route changes, since the
  // root layout doesn't remount for those) - browsers otherwise restore the
  // previous scroll position on refresh, which we don't want.
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          @keyframes toastSlideIn {
            from { opacity: 0; transform: translateX(100%) scale(0.9); }
            to   { opacity: 1; transform: translateX(0) scale(1); }
          }
        `}</style>
      </head>
      <body>
        <SessionProvider>
          <ToastProvider>
            <ConfirmProvider>
              {children}
            </ConfirmProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
