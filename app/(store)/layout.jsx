'use client';

import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

export default function StoreLayout({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#f5f5f7' }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
