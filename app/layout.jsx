// app/layout.jsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/app/components/Toast';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
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
            {children}
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
