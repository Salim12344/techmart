'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  ShoppingBag,
  Heart,
  User,
  Search,
  Menu,
  X,
  Package,
  LogOut,
  ChevronDown,
} from 'lucide-react';

const C = {
  bg: '#f5f5f7',
  card: '#ffffff',
  border: '#e8e8ed',
  text: '#1d1d1f',
  muted: '#86868b',
  blue: '#0071e3',
  inputBorder: '#d2d2d7',
  red: '#ff453a',
  green: '#30d158',
  orange: '#ff9f0a',
};

const FONT_FAMILY = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [hoveredDropItem, setHoveredDropItem] = useState(null);
  const [supportUnread, setSupportUnread] = useState(0);
  const dropdownRef = useRef(null);

  // Read cart count from localStorage
  useEffect(() => {
    function updateCartCount() {
      try {
        const raw = localStorage.getItem('techmart-cart');
        if (raw) {
          const cart = JSON.parse(raw);
          const total = Array.isArray(cart)
            ? cart.reduce((sum, item) => sum + (item.quantity || 1), 0)
            : 0;
          setCartCount(total);
        } else {
          setCartCount(0);
        }
      } catch {
        setCartCount(0);
      }
    }

    updateCartCount();

    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cart-updated', updateCartCount);
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cart-updated', updateCartCount);
    };
  }, []);

  // Track scroll
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  // Check for unread support messages
  useEffect(() => {
    if (status !== 'authenticated') return;
    async function checkSupport() {
      try {
        const res = await fetch('/api/support');
        if (res.ok) {
          const data = await res.json();
          const unread = (data.tickets || []).filter(t => {
            if (t.status === 'closed' || !t.messages || t.messages.length === 0) return false;
            const lastMsg = t.messages[t.messages.length - 1];
            if (lastMsg.sender !== 'admin') return false;
            const readAt = t.userLastReadAt ? new Date(t.userLastReadAt) : new Date(0);
            return new Date(lastMsg.timestamp) > readAt;
          }).length;
          setSupportUnread(unread);
        }
      } catch {}
    }
    checkSupport();
    const interval = setInterval(checkSupport, 60000);
    window.addEventListener('support-read', checkSupport);
    return () => { clearInterval(interval); window.removeEventListener('support-read', checkSupport); };
  }, [status]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navLinks = [
    { href: '/products', label: 'Products' },
    { href: '/orders', label: 'Orders' },
    { href: '/support', label: 'Support' },
  ];

  const isActive = (href) => pathname === href;

  function handleSignOut() {
    if (confirm('Are you sure you want to sign out?')) {
      signOut({ callbackUrl: '/' });
    }
  }

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          fontFamily: FONT_FAMILY,
          background: scrolled
            ? 'rgba(255, 255, 255, 0.62)'
            : 'rgba(255, 255, 255, 0.88)',
          backdropFilter: scrolled
            ? 'saturate(180%) blur(30px)'
            : 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: scrolled
            ? 'saturate(180%) blur(30px)'
            : 'saturate(180%) blur(20px)',
          borderBottom: scrolled
            ? '1px solid rgba(0, 0, 0, 0.06)'
            : '1px solid rgba(0, 0, 0, 0.04)',
          boxShadow: scrolled
            ? '0 1px 16px rgba(0, 0, 0, 0.06)'
            : 'none',
          transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
        }}
      >
        <div
          className="navbar-inner"
          style={{
            padding: '0 2.5rem',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="24" viewBox="0 0 814 1000" style={{ flexShrink: 0 }}>
              <path fill={C.text} d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4c-58.3-81.6-105.5-208.5-105.5-327.9 0-192.8 125.3-295.1 248.6-295.1 65.5 0 120.1 43 161.3 43s100.2-45.6 174.5-45.6c28.2 0 129.3 2.5 195.7 96zM554.1 159.4c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.2 32.4-54.4 83.6-54.4 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 134.8-71.3z"/>
            </svg>
          </Link>

          {/* Center: Nav Links (desktop) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginLeft: '2.5rem',
            }}
            className="navbar-desktop-links"
          >
            {navLinks.map((link) => {
              const active = isActive(link.href);
              const hovered = hoveredLink === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => setHoveredLink(link.href)}
                  onMouseLeave={() => setHoveredLink(null)}
                  style={{
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: active ? 600 : 500,
                    fontFamily: FONT_FAMILY,
                    color: active ? C.text : '#424245',
                    transition: 'color 0.2s ease',
                    letterSpacing: '-0.01em',
                    padding: '0.375rem 0.75rem',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {link.label}
                    {link.label === 'Support' && supportUnread > 0 && (
                      <span
                        style={{
                          minWidth: '15px',
                          height: '15px',
                          borderRadius: '8px',
                          background: C.red,
                          color: '#ffffff',
                          fontSize: '0.5625rem',
                          fontWeight: 700,
                          fontFamily: FONT_FAMILY,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 3px',
                          lineHeight: 1,
                          boxShadow: '0 1px 4px rgba(255,69,58,0.4)',
                        }}
                      >
                        {supportUnread > 99 ? '99+' : supportUnread}
                      </span>
                    )}
                  </span>
                  {/* Animated underline */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      left: '50%',
                      height: '1.5px',
                      background: C.text,
                      borderRadius: '1px',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                      transform: (active || hovered)
                        ? 'translateX(-50%) scaleX(1)'
                        : 'translateX(-50%) scaleX(0)',
                      width: '16px',
                      transformOrigin: 'center',
                    }}
                  />
                </Link>
              );
            })}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Always-visible icons: Wishlist + Cart (visible on both mobile and desktop) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.125rem',
            }}
            className="navbar-always-icons"
          >
            {/* Wishlist */}
            <Link
              href="/wishlist"
              onMouseEnter={() => setHoveredIcon('wishlist')}
              onMouseLeave={() => setHoveredIcon(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: hoveredIcon === 'wishlist' ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                color: C.text,
                textDecoration: 'none',
                transition: 'all 0.25s ease',
              }}
              title="Wishlist"
            >
              <Heart size={17} strokeWidth={1.6} />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              onMouseEnter={() => setHoveredIcon('cart')}
              onMouseLeave={() => setHoveredIcon(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: hoveredIcon === 'cart' ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                color: C.text,
                textDecoration: 'none',
                position: 'relative',
                transition: 'all 0.25s ease',
              }}
              title="Cart"
            >
              <ShoppingBag size={17} strokeWidth={1.6} />
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '1px',
                    right: '1px',
                    minWidth: '15px',
                    height: '15px',
                    borderRadius: '8px',
                    background: C.blue,
                    color: '#ffffff',
                    fontSize: '0.5625rem',
                    fontWeight: 700,
                    fontFamily: FONT_FAMILY,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    lineHeight: 1,
                    boxShadow: '0 1px 4px rgba(0,113,227,0.4)',
                  }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Desktop-only icons: Search + User Dropdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.125rem',
            }}
            className="navbar-desktop-icons"
          >
            {/* Search */}
            <Link
              href="/products"
              onMouseEnter={() => setHoveredIcon('search')}
              onMouseLeave={() => setHoveredIcon(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: hoveredIcon === 'search' ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                color: C.text,
                textDecoration: 'none',
                transition: 'all 0.25s ease',
              }}
              title="Search Products"
            >
              <Search size={17} strokeWidth={1.6} />
            </Link>

            {/* User Dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                onMouseEnter={() => setHoveredIcon('user')}
                onMouseLeave={() => setHoveredIcon(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  width: 'auto',
                  height: '34px',
                  padding: '0 8px',
                  borderRadius: '17px',
                  background: hoveredIcon === 'user' ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                  color: C.text,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  fontFamily: FONT_FAMILY,
                }}
                title="Account"
              >
                <User size={17} strokeWidth={1.6} />
                <ChevronDown
                  size={11}
                  strokeWidth={2}
                  style={{
                    transition: 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                    opacity: 0.6,
                  }}
                />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    minWidth: '220px',
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'saturate(200%) blur(30px)',
                    WebkitBackdropFilter: 'saturate(200%) blur(30px)',
                    borderRadius: '14px',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    padding: '6px',
                    fontFamily: FONT_FAMILY,
                    animation: 'navDropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  }}
                >
                  {status === 'authenticated' && session?.user ? (
                    <>
                      {/* User Info */}
                      <div
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                          marginBottom: '4px',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: C.text,
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontFamily: FONT_FAMILY,
                          }}
                        >
                          {session.user.name || 'User'}
                        </p>
                        <p
                          style={{
                            fontSize: '0.6875rem',
                            color: C.muted,
                            margin: '3px 0 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontFamily: FONT_FAMILY,
                          }}
                        >
                          {session.user.email || ''}
                        </p>
                      </div>

                      {/* Account Link */}
                      <Link
                        href="/account"
                        onClick={() => setUserDropdownOpen(false)}
                        onMouseEnter={() => setHoveredDropItem('account')}
                        onMouseLeave={() => setHoveredDropItem(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '9px 14px',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          color: C.text,
                          fontSize: '0.8125rem',
                          fontWeight: 400,
                          fontFamily: FONT_FAMILY,
                          transition: 'background 0.15s ease',
                          background: hoveredDropItem === 'account' ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                        }}
                      >
                        <User size={15} strokeWidth={1.6} color={C.muted} />
                        My Account
                      </Link>

                      {/* Orders Link */}
                      <Link
                        href="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        onMouseEnter={() => setHoveredDropItem('orders')}
                        onMouseLeave={() => setHoveredDropItem(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '9px 14px',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          color: C.text,
                          fontSize: '0.8125rem',
                          fontWeight: 400,
                          fontFamily: FONT_FAMILY,
                          transition: 'background 0.15s ease',
                          background: hoveredDropItem === 'orders' ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                        }}
                      >
                        <Package size={15} strokeWidth={1.6} color={C.muted} />
                        Orders
                      </Link>

                      {/* Sign Out */}
                      <div
                        style={{
                          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                          marginTop: '4px',
                          paddingTop: '4px',
                        }}
                      >
                        <button
                          onClick={handleSignOut}
                          onMouseEnter={() => setHoveredDropItem('signout')}
                          onMouseLeave={() => setHoveredDropItem(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            padding: '9px 14px',
                            borderRadius: '10px',
                            background: hoveredDropItem === 'signout' ? 'rgba(255, 69, 58, 0.06)' : 'transparent',
                            border: 'none',
                            color: C.red,
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: FONT_FAMILY,
                            transition: 'background 0.15s ease',
                            textAlign: 'left',
                          }}
                        >
                          <LogOut size={15} strokeWidth={1.6} />
                          Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        onClick={() => setUserDropdownOpen(false)}
                        onMouseEnter={() => setHoveredDropItem('signin')}
                        onMouseLeave={() => setHoveredDropItem(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '9px 14px',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          color: C.text,
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          fontFamily: FONT_FAMILY,
                          transition: 'background 0.15s ease',
                          background: hoveredDropItem === 'signin' ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                        }}
                      >
                        <User size={15} strokeWidth={1.6} color={C.muted} />
                        Sign In
                      </Link>
                      <Link
                        href="/auth/register"
                        onClick={() => setUserDropdownOpen(false)}
                        onMouseEnter={() => setHoveredDropItem('register')}
                        onMouseLeave={() => setHoveredDropItem(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '9px 14px',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          color: C.blue,
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          fontFamily: FONT_FAMILY,
                          transition: 'background 0.15s ease',
                          background: hoveredDropItem === 'register' ? 'rgba(0, 113, 227, 0.06)' : 'transparent',
                        }}
                      >
                        <span
                          style={{
                            width: '15px',
                            height: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            color: C.muted,
                          }}
                        >
                          +
                        </span>
                        Register
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile: Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              color: C.text,
              cursor: 'pointer',
              marginLeft: '0.5rem',
              transition: 'background 0.2s ease',
            }}
            className="navbar-mobile-toggle"
            title={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <X size={20} strokeWidth={1.6} />
            ) : (
              <Menu size={20} strokeWidth={1.6} />
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobile Full-Screen Overlay ──────────────────────── */}
      {mobileOpen && (
        <div
          className="navbar-mobile-overlay"
          style={{
            display: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            background: 'rgba(255, 255, 255, 0.97)',
            backdropFilter: 'saturate(180%) blur(40px)',
            WebkitBackdropFilter: 'saturate(180%) blur(40px)',
            fontFamily: FONT_FAMILY,
            animation: 'navMobileOverlayIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            overflowY: 'auto',
          }}
        >
          {/* Mobile overlay header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 1.5rem',
              height: '48px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            <Link href="/" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'linear-gradient(135deg, #0071e3 0%, #5856d6 100%)' }} />
              <span style={{ fontSize: '1.125rem', fontWeight: 600, fontFamily: FONT_FAMILY, color: C.text, letterSpacing: '-0.03em' }}>TechMart</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.04)',
                border: 'none',
                color: C.text,
                cursor: 'pointer',
              }}
            >
              <X size={18} strokeWidth={1.6} />
            </button>
          </div>

          {/* Mobile nav content */}
          <div style={{ padding: '2rem 1.5rem' }}>
            {/* Nav Links */}
            {navLinks.map((link, idx) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block',
                  padding: '1.25rem 0',
                  textDecoration: 'none',
                  fontSize: '1.75rem',
                  fontWeight: isActive(link.href) ? 700 : 500,
                  fontFamily: FONT_FAMILY,
                  color: isActive(link.href) ? C.text : '#424245',
                  letterSpacing: '-0.03em',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                  animation: `navMobileLinkIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.05}s both`,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  {link.label}
                  {link.label === 'Support' && supportUnread > 0 && (
                    <span
                      style={{
                        minWidth: '20px',
                        height: '20px',
                        borderRadius: '10px',
                        background: C.red,
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        fontFamily: FONT_FAMILY,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 5px',
                        lineHeight: 1,
                        boxShadow: '0 1px 4px rgba(255,69,58,0.4)',
                      }}
                    >
                      {supportUnread > 99 ? '99+' : supportUnread}
                    </span>
                  )}
                </span>
              </Link>
            ))}

            {/* Mobile Icons Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '1.5rem 0',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                animation: 'navMobileLinkIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
              }}
            >
              <Link
                href="/products"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '980px',
                  background: 'rgba(0, 0, 0, 0.04)',
                  textDecoration: 'none',
                  color: C.text,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  fontFamily: FONT_FAMILY,
                }}
              >
                <Search size={15} strokeWidth={1.6} />
                Search
              </Link>
              <Link
                href="/wishlist"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '980px',
                  background: 'rgba(0, 0, 0, 0.04)',
                  textDecoration: 'none',
                  color: C.text,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  fontFamily: FONT_FAMILY,
                }}
              >
                <Heart size={15} strokeWidth={1.6} />
                Wishlist
              </Link>
              <Link
                href="/cart"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '980px',
                  background: 'rgba(0, 0, 0, 0.04)',
                  textDecoration: 'none',
                  color: C.text,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  fontFamily: FONT_FAMILY,
                  position: 'relative',
                }}
              >
                <ShoppingBag size={15} strokeWidth={1.6} />
                Cart
                {cartCount > 0 && (
                  <span
                    style={{
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '9px',
                      background: C.blue,
                      color: '#ffffff',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      fontFamily: FONT_FAMILY,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 5px',
                      boxShadow: '0 1px 4px rgba(0,113,227,0.4)',
                    }}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile User Section */}
            <div style={{ paddingTop: '1.5rem', animation: 'navMobileLinkIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both' }}>
              {status === 'authenticated' && session?.user ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0071e3 0%, #5856d6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        fontFamily: FONT_FAMILY,
                        flexShrink: 0,
                      }}
                    >
                      {session.user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: C.text,
                          margin: 0,
                          fontFamily: FONT_FAMILY,
                        }}
                      >
                        {session.user.name || 'User'}
                      </p>
                      <p
                        style={{
                          fontSize: '0.8125rem',
                          color: C.muted,
                          margin: '2px 0 0',
                          fontFamily: FONT_FAMILY,
                        }}
                      >
                        {session.user.email || ''}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 0',
                      textDecoration: 'none',
                      color: C.text,
                      fontSize: '1.0625rem',
                      fontWeight: 500,
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    <User size={18} strokeWidth={1.6} color={C.muted} />
                    My Account
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 0',
                      textDecoration: 'none',
                      color: C.text,
                      fontSize: '1.0625rem',
                      fontWeight: 500,
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    <Package size={18} strokeWidth={1.6} color={C.muted} />
                    Orders
                  </Link>
                  <button
                    onClick={handleSignOut}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '12px 0',
                      marginTop: '0.5rem',
                      background: 'transparent',
                      border: 'none',
                      color: C.red,
                      fontSize: '1.0625rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: FONT_FAMILY,
                      textAlign: 'left',
                    }}
                  >
                    <LogOut size={18} strokeWidth={1.6} />
                    Sign Out
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      flex: 1,
                      display: 'block',
                      padding: '14px',
                      borderRadius: '14px',
                      background: 'rgba(0, 0, 0, 0.04)',
                      textDecoration: 'none',
                      color: C.text,
                      fontSize: '1rem',
                      fontWeight: 600,
                      fontFamily: FONT_FAMILY,
                      textAlign: 'center',
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      flex: 1,
                      display: 'block',
                      padding: '14px',
                      borderRadius: '14px',
                      background: C.blue,
                      textDecoration: 'none',
                      color: '#ffffff',
                      fontSize: '1rem',
                      fontWeight: 600,
                      fontFamily: FONT_FAMILY,
                      textAlign: 'center',
                      boxShadow: '0 2px 12px rgba(0,113,227,0.3)',
                    }}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Responsive styles and animations */}
      <style>{`
        @keyframes navDropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes navMobileOverlayIn {
          from { opacity: 0; transform: translateX(8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes navMobileLinkIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .navbar-inner { padding: 0 1rem !important; }
          .navbar-desktop-links { display: none !important; }
          .navbar-desktop-icons { display: none !important; }
          .navbar-always-icons { display: flex !important; }
          .navbar-mobile-toggle { display: flex !important; }
          .navbar-mobile-overlay { display: block !important; }
        }
        @media (min-width: 769px) {
          .navbar-mobile-toggle { display: none !important; }
          .navbar-mobile-overlay { display: none !important; }
        }
      `}</style>
    </>
  );
}
