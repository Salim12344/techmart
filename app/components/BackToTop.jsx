'use client';

import { useState, useEffect } from 'react';

export default function BackToTop() {
  const [show, setShow] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    function onScroll() { setShow(window.scrollY > 500); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
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
  );
}
