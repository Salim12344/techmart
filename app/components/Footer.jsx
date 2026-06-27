'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const FONT_FAMILY = "'Mona Sans', -apple-system, sans-serif";

export default function Footer() {
  const { data: session } = useSession();
  const [hovered, setHovered] = useState(null);

  const linkStyle = (key) => ({
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontFamily: FONT_FAMILY,
    color: hovered === key ? '#ffffff' : 'rgba(255,255,255,0.56)',
    transition: 'color 0.2s ease',
  });

  const headingStyle = {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#a1a1a6',
    margin: '0 0 1rem',
    fontFamily: FONT_FAMILY,
  };

  return (
    <footer style={{ background: '#1d1d1f', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3.5rem 1.5rem 2rem' }}>
        <div className="footer-columns" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '2rem', marginBottom: '3rem',
        }}>
          <div>
            <h4 style={headingStyle}>Shop</h4>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { href: '/products', label: 'Products' },
                { href: '/products?category=iPhone', label: 'iPhone' },
                { href: '/products?category=MacBook', label: 'MacBook' },
                { href: '/products?category=iPad', label: 'iPad' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href}
                    onMouseEnter={() => setHovered(item.label)}
                    onMouseLeave={() => setHovered(null)}
                    style={linkStyle(item.label)}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={headingStyle}>Account</h4>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { href: '/orders', label: 'Orders' },
                { href: '/wishlist', label: 'Wishlist' },
                { href: '/account', label: 'My Account' },
                ...(!session ? [{ href: '/auth/login', label: 'Sign In' }] : []),
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href}
                    onMouseEnter={() => setHovered(item.label)}
                    onMouseLeave={() => setHovered(null)}
                    style={linkStyle(item.label)}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={headingStyle}>Support</h4>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { href: '/support', label: 'Contact Us' },
                { href: '/faq', label: 'FAQ' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href}
                    onMouseEnter={() => setHovered(`s-${item.label}`)}
                    onMouseLeave={() => setHovered(null)}
                    style={linkStyle(`s-${item.label}`)}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <p style={{
            fontSize: '0.8125rem', color: 'rgba(255,255,255,0.36)',
            margin: 0, fontFamily: FONT_FAMILY,
          }}>
            &copy; 2026 TechMart. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-columns { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
