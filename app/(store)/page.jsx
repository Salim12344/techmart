'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Star, ChevronRight, Truck, Shield, Lock, Headphones } from 'lucide-react';

const FONT = "'Mona Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const SERIF = "'Instrument Serif', serif";

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  inputBorder: '#d2d2d7', red: '#ff453a', green: '#30d158',
  orange: '#ff9f0a', greenBg: 'rgba(48,209,88,0.1)',
  orangeBg: 'rgba(255,159,10,0.1)', redBg: 'rgba(255,69,58,0.08)',
  blueBg: 'rgba(0,113,227,0.08)',
};

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

function useScrollReveal() {
  // Some sections (Categories, Newsletter) only mount once async data/session state
  // resolves, so a one-time useRef+effect can miss them entirely (ref.current is
  // still null when the effect runs). A callback ref re-fires whenever the node
  // actually mounts, so the observer always gets attached.
  const [el, setEl] = useState(null);
  const ref = useCallback((node) => {
    if (node) setEl(node);
  }, []);

  useEffect(() => {
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    );
    const targets = el.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    targets.forEach((t) => {
      // If element is already in viewport on load, reveal immediately
      const rect = t.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        t.classList.add('visible');
      } else {
        observer.observe(t);
      }
    });
    return () => observer.disconnect();
  }, [el]);
  return ref;
}

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          let start = 0;
          const step = target / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, started]);

  return { count, ref };
}

function StatItem({ value, suffix = '', label }) {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="reveal" style={{ textAlign: 'center', flex: '1 1 200px' }}>
      <div style={{
        fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
        fontWeight: 700,
        color: '#ffffff',
        fontFamily: FONT,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        marginBottom: '0.5rem',
      }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{
        fontSize: '1rem',
        color: '#a1a1a6',
        fontFamily: FONT,
        fontWeight: 400,
      }}>
        {label}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredCat, setHoveredCat] = useState(null);
  const [heroHover, setHeroHover] = useState(false);
  const [secondaryHover, setSecondaryHover] = useState(false);
  const [hoveredBenefit, setHoveredBenefit] = useState(null);
  const [subscribeHover, setSubscribeHover] = useState(false);
  const [siteStats, setSiteStats] = useState(null);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeMsg, setSubscribeMsg] = useState('');
  const [subscribeType, setSubscribeType] = useState('');

  const sectionRef1 = useScrollReveal();
  const sectionRef2 = useScrollReveal();
  const sectionRef3 = useScrollReveal();
  const sectionRef4 = useScrollReveal();
  const sectionRef5 = useScrollReveal();
  const sectionRef6 = useScrollReveal();

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => { if (!data.error) setSiteStats(data); })
      .catch(() => {});
  }, []);

  const featured = products.slice(0, 8);
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  const categoryCounts = {};
  products.forEach((p) => {
    if (p.category) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }
  });

  const benefits = [
    { icon: Truck, title: 'Free Delivery', desc: 'Free shipping on orders over ₦500,000', color: '#30d158', bg: 'rgba(48,209,88,0.12)' },
    { icon: Shield, title: 'Genuine Products', desc: '100% authentic Apple products guaranteed', color: '#0071e3', bg: 'rgba(0,113,227,0.12)' },
    { icon: Lock, title: 'Secure Payments', desc: 'Your payment information is always safe', color: '#ff9f0a', bg: 'rgba(255,159,10,0.12)' },
    { icon: Headphones, title: '24/7 Support', desc: 'Round-the-clock customer assistance', color: '#bf5af2', bg: 'rgba(191,90,242,0.12)' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#000000', fontFamily: FONT }}>

      {/* ── HERO SECTION ─────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '6rem 1.5rem 4rem',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #000000 0%, #1d1d1f 100%)',
          overflow: 'hidden',
        }}
      >
        {/* Gradient orbs */}
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,113,227,0.15) 0%, transparent 70%)',
          filter: 'blur(80px)', pointerEvents: 'none',
          animation: 'glowPulse 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', left: '-10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(88,86,214,0.12) 0%, transparent 70%)',
          filter: 'blur(80px)', pointerEvents: 'none',
          animation: 'glowPulse 10s ease-in-out 2s infinite',
        }} />
        <div style={{
          position: 'absolute', top: '30%', left: '50%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(191,90,242,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
          animation: 'glowPulse 12s ease-in-out 4s infinite',
          transform: 'translateX(-50%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(3.5rem, 10vw, 7rem)',
              fontWeight: 700,
              letterSpacing: '-0.06em',
              color: '#ffffff',
              margin: '0 0 1rem',
              lineHeight: 0.95,
              fontFamily: FONT,
            }}>
            TechMart
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
              margin: '0 0 2.5rem',
              maxWidth: '560px',
              lineHeight: 1.5,
              fontWeight: 500,
              fontFamily: FONT,
              letterSpacing: '-0.01em',
              background: 'linear-gradient(90deg, #a1a1a6, #f5f5f7, #a1a1a6)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            Premium Apple products, delivered to your&nbsp;door.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
            }}>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/products"
                onMouseEnter={() => setHeroHover(true)}
                onMouseLeave={() => setHeroHover(false)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.9375rem 2.25rem',
                  background: heroHover ? C.blue : '#ffffff',
                  color: heroHover ? '#ffffff' : '#1d1d1f',
                  borderRadius: '980px', fontSize: '1.0625rem', fontWeight: 600,
                  fontFamily: FONT, textDecoration: 'none', letterSpacing: '-0.01em',
                  border: 'none',
                  transition: 'background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease',
                  boxShadow: heroHover
                    ? '0 0 30px rgba(0,113,227,0.4), 0 4px 20px rgba(0,0,0,0.3)'
                    : '0 2px 12px rgba(0,0,0,0.2)',
                }}
              >
                Shop Now
                <ArrowRight size={18} strokeWidth={2} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
              href="/products"
              onMouseEnter={() => setSecondaryHover(true)}
              onMouseLeave={() => setSecondaryHover(false)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.9375rem 2.25rem',
                background: secondaryHover ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                borderRadius: '980px', fontSize: '1.0625rem', fontWeight: 500,
                fontFamily: FONT, textDecoration: 'none', letterSpacing: '-0.01em',
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'all 0.4s cubic-bezier(0.25,0.1,0.25,1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              Explore
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Product Image Slider */}
        {featured.filter(p => p.image).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.36, ease: [0.16, 1, 0.3, 1] }}
            style={{
            overflow: 'hidden', width: '100%', marginTop: '4rem',
            position: 'relative', zIndex: 1,
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          }}>
            <div style={{
              display: 'flex', gap: '1.5rem',
              animation: 'scrollLeft 30s linear infinite',
              width: 'fit-content',
            }}>
              {[...featured.filter(p => p.image), ...featured.filter(p => p.image)].map((product, i) => (
                <Link
                  key={`${product._id}-${i}`}
                  href={`/products/${product._id}`}
                  style={{
                    flexShrink: 0, width: '200px', height: '200px',
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={160}
                      height={160}
                      style={{ objectFit: 'contain', padding: '1.25rem' }}
                    />
                  ) : (
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '16px',
                      background: 'rgba(255,255,255,0.08)',
                    }} />
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </section>

      {/* ── TAGLINE BAND ─────────────────────────────────── */}
      <section ref={sectionRef1} style={{ background: '#ffffff', padding: '6rem 1.5rem', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 700, letterSpacing: '-0.04em',
            color: C.text, margin: '0 0 0.5rem',
            fontFamily: FONT, lineHeight: 1.1,
          }}>
            Premium Apple products.
          </h2>
          <p style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontFamily: SERIF, fontStyle: 'italic',
            color: C.muted, margin: 0,
            fontWeight: 400, lineHeight: 1.2,
          }}>
            Delivered to your door.
          </p>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────────── */}
      <section ref={sectionRef2} style={{ background: C.bg }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '5rem 1.5rem 6rem' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end',
            justifyContent: 'space-between', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem',
          }}>
            <div>
              <span style={{
                display: 'inline-block', fontSize: '0.75rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: C.blue, background: C.blueBg,
                padding: '0.375rem 1rem', borderRadius: '980px',
                marginBottom: '1rem', fontFamily: FONT,
              }}>
                Featured Collection
              </span>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700, letterSpacing: '-0.04em',
                color: C.text, margin: '0 0 0.375rem',
                fontFamily: FONT, lineHeight: 1.1,
              }}>
                Explore Our Products
              </h2>
              <p style={{ fontSize: '1.0625rem', color: C.muted, margin: 0, fontFamily: FONT }}>
                A closer look at what we offer
              </p>
            </div>
            <Link href="/products" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              color: C.blue, fontSize: '1rem', fontWeight: 500,
              fontFamily: FONT, textDecoration: 'none',
            }}>
              View All <ChevronRight size={17} />
            </Link>
          </div>

          {loading ? (
            <div className="featured-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              gap: '1.5rem',
            }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{
                  background: '#ffffff', borderRadius: '20px', height: '420px',
                  animation: 'shimmer 1.5s ease-in-out infinite',
                  backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                }} />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '5rem 1rem',
              color: C.muted, fontSize: '1.125rem', fontFamily: FONT,
            }}>
              No products available yet.
            </div>
          ) : (
            <div className="featured-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1.25rem',
            }}>
              {featured.filter(p => p.image).map((product) => {
                const isHovered = hoveredCard === product._id;
                return (
                  <Link
                    key={product._id}
                    href={`/products/${product._id}`}
                    onMouseEnter={() => setHoveredCard(product._id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      textDecoration: 'none',
                      display: 'block',
                      position: 'relative',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      background: '#ffffff',
                      transition: 'all 0.4s cubic-bezier(0.25,0.1,0.25,1)',
                      transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                      boxShadow: isHovered
                        ? '0 16px 48px rgba(0,0,0,0.12)'
                        : '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div style={{
                      width: '100%', aspectRatio: '1',
                      background: '#fafafa',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      <Image
                        src={product.image} alt={product.name}
                        width={280} height={280}
                        style={{
                          objectFit: 'contain', padding: '1.5rem',
                          transition: 'transform 0.5s cubic-bezier(0.25,0.1,0.25,1)',
                          transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                        }}
                      />
                    </div>
                    <div style={{
                      padding: '0.875rem 1rem',
                      textAlign: 'center',
                    }}>
                      <p style={{
                        fontSize: '0.875rem', fontWeight: 600, color: C.text,
                        margin: '0 0 0.125rem', fontFamily: FONT, letterSpacing: '-0.01em',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {product.name}
                      </p>
                      <p style={{
                        fontSize: '0.8125rem', fontWeight: 500, color: C.muted,
                        margin: 0, fontFamily: FONT,
                      }}>
                        From {'₦'}{formatPrice(getMinPrice(product.variants))}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── WHY TECHMART ─────────────────────────────────── */}
      <section ref={sectionRef3} style={{ background: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '5rem 1.5rem 6rem' }}>
          <div className="reveal-scale" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 700, letterSpacing: '-0.04em',
              color: C.text, margin: '0 0 0.5rem',
              fontFamily: FONT, lineHeight: 1.1,
            }}>
              Why TechMart?
            </h2>
            <p style={{
              fontSize: '1.125rem', color: C.muted, margin: 0,
              fontFamily: FONT, maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto',
            }}>
              We go the extra mile for every customer
            </p>
          </div>
          <div className="benefits-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.5rem',
          }}>
            {benefits.map((b, i) => {
              const Icon = b.icon;
              const isHov = hoveredBenefit === i;
              return (
                <div
                  key={b.title}
                  className={`reveal-scale delay-${i + 1}`}
                  onMouseEnter={() => setHoveredBenefit(i)}
                  onMouseLeave={() => setHoveredBenefit(null)}
                  style={{
                    textAlign: 'center', padding: '2.5rem 1.5rem',
                    borderRadius: '20px',
                    background: isHov ? C.bg : '#ffffff',
                    border: `1px solid ${isHov ? 'transparent' : C.border}`,
                    transition: 'all 0.4s cubic-bezier(0.25,0.1,0.25,1)',
                    transform: isHov ? 'translateY(-6px)' : 'translateY(0)',
                    boxShadow: isHov ? '0 16px 48px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                    cursor: 'default',
                  }}
                >
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: b.bg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    transition: 'transform 0.4s ease',
                    transform: isHov ? 'scale(1.1)' : 'scale(1)',
                  }}>
                    <Icon size={28} color={b.color} strokeWidth={1.8} />
                  </div>
                  <h3 style={{
                    fontSize: '1.125rem', fontWeight: 600, color: C.text,
                    margin: '0 0 0.5rem', fontFamily: FONT, letterSpacing: '-0.02em',
                  }}>
                    {b.title}
                  </h3>
                  <p style={{
                    fontSize: '0.9375rem', color: C.muted, margin: 0,
                    fontFamily: FONT, lineHeight: 1.5,
                  }}>
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────── */}
      {categories.length > 0 && (
        <section ref={sectionRef4} style={{ background: '#1d1d1f' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '5rem 1.5rem 6rem' }}>
            <div className="reveal-right" style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700, letterSpacing: '-0.04em',
                color: '#ffffff', margin: '0 0 0.375rem',
                fontFamily: FONT, lineHeight: 1.1,
              }}>
                Categories
              </h2>
              <p style={{
                fontSize: '1.0625rem', color: '#a1a1a6', margin: 0, fontFamily: FONT,
              }}>
                Shop by what you need
              </p>
            </div>
            <div className="categories-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1rem',
            }}>
              {categories.map((cat, i) => {
                const isHovered = hoveredCat === cat;
                const count = categoryCounts[cat] || 0;
                return (
                  <Link
                    key={cat}
                    href={`/products?category=${encodeURIComponent(cat)}`}
                    className={`reveal delay-${(i % 4) + 1}`}
                    onMouseEnter={() => setHoveredCat(cat)}
                    onMouseLeave={() => setHoveredCat(null)}
                    style={{
                      textDecoration: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '1.5rem 1.75rem',
                      background: isHovered ? 'rgba(0,113,227,0.12)' : 'rgba(255,255,255,0.06)',
                      borderRadius: '16px',
                      border: isHovered ? '1px solid rgba(0,113,227,0.25)' : '1px solid rgba(255,255,255,0.1)',
                      transition: 'all 0.4s cubic-bezier(0.25,0.1,0.25,1)',
                      transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                      boxShadow: isHovered ? '0 8px 32px rgba(0,113,227,0.15)' : 'none',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                    }}
                  >
                    <div>
                      <span style={{
                        display: 'block', fontSize: '1.125rem', fontWeight: 600,
                        color: '#ffffff', letterSpacing: '-0.02em',
                        fontFamily: FONT, marginBottom: '0.25rem',
                      }}>
                        {cat}
                      </span>
                      <span style={{
                        fontSize: '0.8125rem', color: '#a1a1a6', fontFamily: FONT,
                      }}>
                        {count} {count === 1 ? 'product' : 'products'}
                      </span>
                    </div>
                    <ChevronRight size={18} style={{
                      color: isHovered ? '#0071e3' : 'rgba(255,255,255,0.4)',
                      transition: 'all 0.3s ease',
                      transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
                      flexShrink: 0,
                    }} />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── STATS SECTION ────────────────────────────────── */}
      <section ref={sectionRef5} style={{
        background: 'linear-gradient(180deg, #000000 0%, #1d1d1f 100%)',
        padding: '5rem 1.5rem',
      }}>
        <div style={{
          maxWidth: '1000px', margin: '0 auto',
          display: 'flex', flexWrap: 'wrap',
          gap: '2rem', justifyContent: 'center',
        }} className="stats-row">
          <StatItem value={siteStats?.totalProducts || 0} suffix="" label="Products" />
          <StatItem value={siteStats?.totalCustomers || 0} suffix="" label="Registered Customers" />
          <StatItem value={siteStats?.deliveredOrders || 0} suffix="" label="Orders Delivered" />
          <StatItem value={siteStats?.satisfactionPercent || 0} suffix="%" label={`Satisfaction${siteStats?.totalReviews ? ` (${siteStats.totalReviews} review${siteStats.totalReviews === 1 ? '' : 's'})` : ''}`} />
        </div>
      </section>

      {/* ── NEWSLETTER / CTA ─────────────────────────────── */}
      {!session && <section ref={sectionRef6} style={{ background: C.bg, padding: '5rem 1.5rem 6rem' }}>
        <div className="reveal-scale" style={{
          maxWidth: '720px', margin: '0 auto', textAlign: 'center',
          padding: '3.5rem 2.5rem',
          borderRadius: '28px',
          background: 'linear-gradient(135deg, #1d1d1f 0%, #2d2d30 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Subtle gradient glow */}
          <div style={{
            position: 'absolute', top: '-50%', right: '-30%',
            width: '400px', height: '400px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,113,227,0.15) 0%, transparent 70%)',
            filter: 'blur(60px)', pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 700, letterSpacing: '-0.04em',
              color: '#ffffff', margin: '0 0 0.75rem',
              fontFamily: FONT,
            }}>
              Stay Updated
            </h2>
            <p style={{
              fontSize: '1.0625rem', color: '#a1a1a6', margin: '0 0 2rem',
              fontFamily: FONT, lineHeight: 1.5,
            }}>
              Get notified about new products and exclusive deals
            </p>
            <form className="newsletter-form" onSubmit={async (e) => {
              e.preventDefault();
              if (!subscribeEmail.trim() || subscribing) return;
              setSubscribing(true);
              setSubscribeMsg('');
              setSubscribeType('');
              try {
                const res = await fetch('/api/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: subscribeEmail }),
                });
                const data = await res.json();
                setSubscribeMsg(data.message || data.error || 'Subscribed!');
                setSubscribeType(data.type || '');
                if (res.ok && data.type === 'new_subscriber') setSubscribeEmail('');
              } catch { setSubscribeMsg('Something went wrong. Please try again.'); }
              finally { setSubscribing(false); }
            }} style={{
              display: 'flex', gap: '0.75rem',
              maxWidth: '440px', margin: '0 auto',
            }}>
              <input
                type="email"
                placeholder="Enter your email"
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
                required
                style={{
                  flex: 1, padding: '0.875rem 1.25rem',
                  borderRadius: '980px', border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#ffffff', fontSize: '0.9375rem',
                  fontFamily: FONT, outline: 'none',
                  transition: 'border-color 0.3s ease',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(0,113,227,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
              />
              <button
                type="submit"
                disabled={subscribing}
                onMouseEnter={() => setSubscribeHover(true)}
                onMouseLeave={() => setSubscribeHover(false)}
                style={{
                  padding: '0.875rem 1.75rem',
                  borderRadius: '980px', border: 'none',
                  background: subscribing ? '#555' : subscribeHover ? '#0077ED' : C.blue,
                  color: '#ffffff', fontSize: '0.9375rem',
                  fontWeight: 600, fontFamily: FONT,
                  cursor: subscribing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  transform: subscribeHover && !subscribing ? 'scale(1.03)' : 'scale(1)',
                  whiteSpace: 'nowrap',
                }}
              >
                {subscribing ? 'Sending...' : 'Subscribe'}
              </button>
            </form>
            {subscribeMsg && (
              <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                <p style={{
                  color: subscribeType === 'existing_customer' ? '#ff9f0a' : '#30d158',
                  fontSize: '0.9375rem', fontFamily: FONT, margin: '0 0 0.75rem',
                }}>
                  {subscribeMsg}
                </p>
                {(subscribeType === 'new_subscriber' || subscribeType === 'already_subscribed') && (
                  <Link href="/auth/register" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.75rem 1.75rem', background: '#ffffff', color: '#000',
                    borderRadius: '980px', fontSize: '0.9375rem', fontWeight: 600,
                    fontFamily: FONT, textDecoration: 'none',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}>
                    Create Account <ArrowRight size={16} />
                  </Link>
                )}
                {subscribeType === 'existing_customer' && (
                  <Link href="/auth/login" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.75rem 1.75rem', background: '#ffffff', color: '#000',
                    borderRadius: '980px', fontSize: '0.9375rem', fontWeight: 600,
                    fontFamily: FONT, textDecoration: 'none',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}>
                    Sign In <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>}

      {/* ── Global Styles ────────────────────────────────── */}
      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.08); }
        }
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 1s cubic-bezier(0.25, 0.1, 0.25, 1), transform 1s cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0) scale(1) translateX(0);
        }
        .reveal-left {
          opacity: 0;
          transform: translateX(-40px);
          transition: opacity 1s cubic-bezier(0.25, 0.1, 0.25, 1), transform 1s cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        .reveal-left.visible {
          opacity: 1;
          transform: translateX(0);
        }
        .reveal-right {
          opacity: 0;
          transform: translateX(40px);
          transition: opacity 1s cubic-bezier(0.25, 0.1, 0.25, 1), transform 1s cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        .reveal-right.visible {
          opacity: 1;
          transform: translateX(0);
        }
        .reveal-scale {
          opacity: 0;
          transform: scale(0.92);
          transition: opacity 1.1s cubic-bezier(0.25, 0.1, 0.25, 1), transform 1.1s cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        .reveal-scale.visible {
          opacity: 1;
          transform: scale(1);
        }
        .delay-1 { transition-delay: 0.08s; }
        .delay-2 { transition-delay: 0.16s; }
        .delay-3 { transition-delay: 0.24s; }
        .delay-4 { transition-delay: 0.32s; }
        .delay-5 { transition-delay: 0.4s; }
        .delay-6 { transition-delay: 0.48s; }

        @media (max-width: 1024px) {
          .featured-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .benefits-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .featured-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }
          .categories-grid {
            grid-template-columns: 1fr !important;
          }
          .benefits-grid {
            grid-template-columns: 1fr !important;
          }
          .stats-row {
            flex-direction: column !important;
            align-items: center !important;
          }
          .newsletter-form {
            flex-direction: column !important;
          }
        }
        @media (max-width: 420px) {
          .featured-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
