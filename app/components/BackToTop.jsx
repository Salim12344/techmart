'use client';

import { useState, useEffect } from 'react';

export default function BackToTop() {
  const [show, setShow] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    // Hysteresis (show above 500px, hide below 400px) prevents the button from
    // rapidly fading in/out and jumping when scroll position hovers near a single threshold.
    function onScroll() {
      setShow((prev) => {
        if (window.scrollY > 500) return true;
        if (window.scrollY < 400) return false;
        return prev;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <button
        className="back-to-top-btn"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          width: 44, height: 44, borderRadius: '50%',
          background: hovered ? '#0071e3' : 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          color: '#fff', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: hovered ? '0 8px 28px rgba(0,113,227,0.35)' : '0 4px 16px rgba(0,0,0,0.15)',
          transition: 'all 0.3s cubic-bezier(0.25,0.1,0.25,1)',
          opacity: show ? 1 : 0,
          transform: show ? (hovered ? 'translateY(-2px) scale(1.05)' : 'translateY(0) scale(1)') : 'translateY(16px) scale(0.8)',
          pointerEvents: show ? 'auto' : 'none',
          zIndex: 100,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
      <style>{`
        @media (max-width: 768px) {
          .back-to-top-btn {
            bottom: calc(64px + env(safe-area-inset-bottom, 0px) + 1rem) !important;
          }
        }
      `}</style>
    </>
  );
}
