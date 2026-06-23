'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star, ChevronRight } from 'lucide-react';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  inputBorder: '#d2d2d7', red: '#ff453a', green: '#30d158',
  orange: '#ff9f0a', greenBg: 'rgba(48,209,88,0.1)',
  orangeBg: 'rgba(255,159,10,0.1)', redBg: 'rgba(255,69,58,0.08)',
  blueBg: 'rgba(0,113,227,0.08)',
};

const FONT_FAMILY = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif";

function getMinPrice(variants) {
  if (!variants || variants.length === 0) return 0;
  return Math.min(...variants.map((v) => v.price));
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-NG').format(price);
}

function StarRating({ rating, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= Math.round(rating) ? '#ff9f0a' : 'none'}
          stroke={i <= Math.round(rating) ? '#ff9f0a' : '#d2d2d7'}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredCat, setHoveredCat] = useState(null);
  const [heroHover, setHeroHover] = useState(false);
  const [hoveredFooterLink, setHoveredFooterLink] = useState(null);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const featured = products.slice(0, 8);
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  // Count products per category
  const categoryCounts = {};
  products.forEach((p) => {
    if (p.category) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }
  });

  return (
    <div style={{ minHeight: '100vh', background: '#000000', fontFamily: FONT_FAMILY }}>

      {/* ── Hero Section ─────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '4rem 1.5rem',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #000000 0%, #1d1d1f 100%)',
          overflow: 'hidden',
        }}
      >
        {/* Gradient orb - top right */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,113,227,0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        {/* Gradient orb - bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            left: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(88,86,214,0.12) 0%, transparent 70%)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
            animation: 'float 10s ease-in-out 2s infinite',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
          <h1
            style={{
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontWeight: 700,
              letterSpacing: '-0.06em',
              color: '#ffffff',
              margin: '0 0 1.25rem',
              lineHeight: 1,
              fontFamily: FONT_FAMILY,
            }}
          >
            TechMart
          </h1>
          <p
            className="hero-subtitle-animated"
            style={{
              fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
              margin: '0 0 3rem',
              maxWidth: '560px',
              lineHeight: 1.5,
              fontWeight: 500,
              fontFamily: FONT_FAMILY,
              letterSpacing: '-0.01em',
              background: 'linear-gradient(90deg, #a1a1a6, #f5f5f7, #a1a1a6)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'gradientShift 4s ease-in-out infinite',
            }}
          >
            The Apple experience, reimagined.
          </p>
          <Link
            href="/products"
            onMouseEnter={() => setHeroHover(true)}
            onMouseLeave={() => setHeroHover(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.9375rem 2.25rem',
              background: heroHover
                ? 'rgba(255, 255, 255, 0.18)'
                : 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              borderRadius: '980px',
              fontSize: '1.0625rem',
              fontWeight: 500,
              fontFamily: FONT_FAMILY,
              textDecoration: 'none',
              letterSpacing: '-0.01em',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
              transform: heroHover ? 'scale(1.03)' : 'scale(1)',
              boxShadow: heroHover
                ? '0 0 30px rgba(0, 113, 227, 0.35), 0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 2px 12px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            Explore Products
            <ArrowRight size={18} strokeWidth={1.8} />
          </Link>
        </div>
      </section>

      {/* ── Featured Products ────────────────────────────── */}
      <section style={{ background: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '5rem 1.5rem 6rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: '3rem',
              animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  color: C.text,
                  margin: '0 0 0.375rem',
                  fontFamily: FONT_FAMILY,
                  lineHeight: 1.1,
                }}
              >
                Featured
              </h2>
              <p
                style={{
                  fontSize: '1.0625rem',
                  color: C.muted,
                  margin: 0,
                  fontWeight: 400,
                  fontFamily: FONT_FAMILY,
                }}
              >
                Handpicked for you
              </p>
            </div>
            <Link
              href="/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: C.blue,
                fontSize: '1rem',
                fontWeight: 500,
                fontFamily: FONT_FAMILY,
                textDecoration: 'none',
                letterSpacing: '-0.01em',
              }}
            >
              View All
              <ChevronRight size={17} />
            </Link>
          </div>

          {loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: '#fafafa',
                    borderRadius: '20px',
                    height: '420px',
                    animation: 'shimmer 1.5s ease-in-out infinite',
                    backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                  }}
                />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '5rem 1rem',
                color: C.muted,
                fontSize: '1.125rem',
                fontFamily: FONT_FAMILY,
              }}
            >
              No products available yet.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {featured.map((product, index) => {
                const minPrice = getMinPrice(product.variants);
                const isHovered = hoveredCard === product._id;

                return (
                  <Link
                    key={product._id}
                    href={`/products/${product._id}`}
                    onMouseEnter={() => setHoveredCard(product._id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      background: '#ffffff',
                      borderRadius: '20px',
                      border: isHovered ? '1px solid transparent' : '1px solid rgba(0, 0, 0, 0.06)',
                      overflow: 'hidden',
                      transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
                      transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
                      boxShadow: isHovered
                        ? '0 20px 60px rgba(0, 0, 0, 0.12)'
                        : '0 1px 4px rgba(0, 0, 0, 0.04)',
                      animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.06}s both`,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1',
                        background: 'linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={300}
                          height={300}
                          style={{
                            objectFit: 'contain',
                            padding: '2rem',
                            transition: 'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
                            transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8ed 50%, #f5f5f7 100%)',
                            backgroundSize: '200% 200%',
                            animation: 'gradientShift 6s ease-in-out infinite',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '16px',
                              background: 'rgba(0, 0, 0, 0.03)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #d2d2d7, #e8e8ed)',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '1.125rem 1.375rem 1.375rem' }}>
                      {product.category && (
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: C.blue,
                            background: 'rgba(0, 113, 227, 0.06)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '980px',
                            marginBottom: '0.625rem',
                            fontFamily: FONT_FAMILY,
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: '1px solid rgba(0, 113, 227, 0.08)',
                          }}
                        >
                          {product.category}
                        </span>
                      )}
                      <h3
                        style={{
                          fontSize: '1.0625rem',
                          fontWeight: 600,
                          color: C.text,
                          margin: '0 0 0.375rem',
                          letterSpacing: '-0.02em',
                          lineHeight: 1.3,
                          fontFamily: FONT_FAMILY,
                        }}
                      >
                        {product.name}
                      </h3>
                      {product.reviewCount > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <StarRating rating={product.averageRating} size={13} />
                          <span style={{ fontSize: '0.75rem', color: C.muted, fontFamily: FONT_FAMILY }}>
                            ({product.reviewCount})
                          </span>
                        </div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '1.0625rem',
                            fontWeight: 600,
                            color: C.text,
                            margin: 0,
                            fontFamily: FONT_FAMILY,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {'₦'}{formatPrice(minPrice)}
                        </p>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: C.blue,
                            fontFamily: FONT_FAMILY,
                            opacity: isHovered ? 1 : 0,
                            transform: isHovered ? 'translateX(0)' : 'translateX(-6px)',
                            transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                          }}
                        >
                          View
                          <ArrowRight size={14} strokeWidth={2} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Shop by Category ─────────────────────────────── */}
      {categories.length > 0 && (
        <section
          style={{
            background: '#1d1d1f',
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '5rem 1.5rem 6rem',
            }}
          >
            <div style={{ marginBottom: '3rem' }}>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  color: '#ffffff',
                  margin: '0 0 0.375rem',
                  fontFamily: FONT_FAMILY,
                  lineHeight: 1.1,
                }}
              >
                Categories
              </h2>
              <p
                style={{
                  fontSize: '1.0625rem',
                  color: '#a1a1a6',
                  margin: 0,
                  fontWeight: 400,
                  fontFamily: FONT_FAMILY,
                }}
              >
                Shop by what you need
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '1rem',
              }}
            >
              {categories.map((cat) => {
                const isHovered = hoveredCat === cat;
                const count = categoryCounts[cat] || 0;
                return (
                  <Link
                    key={cat}
                    href={`/products?category=${encodeURIComponent(cat)}`}
                    onMouseEnter={() => setHoveredCat(cat)}
                    onMouseLeave={() => setHoveredCat(null)}
                    style={{
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1.5rem 1.75rem',
                      background: isHovered
                        ? 'rgba(0, 113, 227, 0.12)'
                        : 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '16px',
                      border: isHovered
                        ? '1px solid rgba(0, 113, 227, 0.25)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
                      transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                      boxShadow: isHovered
                        ? '0 8px 32px rgba(0, 113, 227, 0.15)'
                        : 'none',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '1.125rem',
                          fontWeight: 600,
                          color: '#ffffff',
                          letterSpacing: '-0.02em',
                          fontFamily: FONT_FAMILY,
                          marginBottom: '0.25rem',
                        }}
                      >
                        {cat}
                      </span>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          color: '#a1a1a6',
                          fontFamily: FONT_FAMILY,
                          fontWeight: 400,
                        }}
                      >
                        {count} {count === 1 ? 'product' : 'products'}
                      </span>
                    </div>
                    <ChevronRight
                      size={18}
                      style={{
                        color: isHovered ? '#0071e3' : 'rgba(255, 255, 255, 0.4)',
                        transition: 'all 0.3s ease',
                        transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
                        flexShrink: 0,
                      }}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────── */}
      <footer
        style={{
          background: '#1d1d1f',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '3.5rem 1.5rem 2rem',
          }}
        >
          {/* Footer columns */}
          <div
            className="footer-columns"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '2rem',
              marginBottom: '3rem',
            }}
          >
            {/* Shop */}
            <div>
              <h4
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#a1a1a6',
                  margin: '0 0 1rem',
                  fontFamily: FONT_FAMILY,
                }}
              >
                Shop
              </h4>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <li>
                  <Link
                    href="/products"
                    onMouseEnter={() => setHoveredFooterLink('products')}
                    onMouseLeave={() => setHoveredFooterLink(null)}
                    style={{
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontFamily: FONT_FAMILY,
                      color: hoveredFooterLink === 'products' ? '#ffffff' : 'rgba(255, 255, 255, 0.56)',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    Products
                  </Link>
                </li>
                {categories.slice(0, 4).map((cat) => (
                  <li key={cat}>
                    <Link
                      href={`/products?category=${encodeURIComponent(cat)}`}
                      onMouseEnter={() => setHoveredFooterLink(`cat-${cat}`)}
                      onMouseLeave={() => setHoveredFooterLink(null)}
                      style={{
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontFamily: FONT_FAMILY,
                        color: hoveredFooterLink === `cat-${cat}` ? '#ffffff' : 'rgba(255, 255, 255, 0.56)',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#a1a1a6',
                  margin: '0 0 1rem',
                  fontFamily: FONT_FAMILY,
                }}
              >
                Account
              </h4>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {[
                  { href: '/orders', label: 'Orders' },
                  { href: '/wishlist', label: 'Wishlist' },
                  { href: '/auth/login', label: 'Sign In' },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onMouseEnter={() => setHoveredFooterLink(item.label)}
                      onMouseLeave={() => setHoveredFooterLink(null)}
                      style={{
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontFamily: FONT_FAMILY,
                        color: hoveredFooterLink === item.label ? '#ffffff' : 'rgba(255, 255, 255, 0.56)',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#a1a1a6',
                  margin: '0 0 1rem',
                  fontFamily: FONT_FAMILY,
                }}
              >
                Support
              </h4>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {[
                  { href: '#', label: 'Contact' },
                  { href: '#', label: 'FAQ' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onMouseEnter={() => setHoveredFooterLink(`support-${item.label}`)}
                      onMouseLeave={() => setHoveredFooterLink(null)}
                      style={{
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontFamily: FONT_FAMILY,
                        color: hoveredFooterLink === `support-${item.label}` ? '#ffffff' : 'rgba(255, 255, 255, 0.56)',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'rgba(255, 255, 255, 0.36)',
                margin: 0,
                fontFamily: FONT_FAMILY,
                fontWeight: 400,
              }}
            >
              &copy; 2026 TechMart. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ── Global animations ─────────────────────────────── */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 640px) {
          .footer-columns {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}
