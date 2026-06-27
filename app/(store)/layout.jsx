'use client';

import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import BackToTop from '@/app/components/BackToTop';

export default function StoreLayout({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#f5f5f7' }}>
        {children}
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
