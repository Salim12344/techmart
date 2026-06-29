'use client';

import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import BackToTop from '@/app/components/BackToTop';

export default function StoreLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="store-main" style={{ minHeight: '100vh', background: '#f5f5f7' }}>
        {children}
      </main>
      <Footer />
      <BackToTop />
      <style>{`
        @media (max-width: 768px) {
          .store-main { padding-bottom: 80px !important; }
        }
      `}</style>
    </>
  );
}
