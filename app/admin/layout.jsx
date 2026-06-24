// app/admin/layout.jsx
'use client';

import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ToastProvider } from '@/app/components/Toast';
import { LayoutDashboard, Package, ShoppingCart, Users, ChevronRight, ChevronLeft, MessageSquare } from 'lucide-react';

function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} />, exact: true },
    { href: '/admin/products', label: 'Products & Categories', icon: <Package size={18} /> },
    { href: '/admin/orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
    { href: '/admin/users', label: 'Users', icon: <Users size={18} /> },
    { href: '/admin/support', label: 'Support', icon: <MessageSquare size={18} /> },
  ];

  const isActive = (item) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <aside
      style={{
        width: collapsed ? '64px' : '240px',
        minHeight: '100vh',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderRight: '1px solid #e8e8ed',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1rem',
        borderBottom: '1px solid #e8e8ed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: '0.5rem',
      }}>
        {!collapsed && (
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <span style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: '#1d1d1f',
              letterSpacing: '-0.02em',
            }}>
              TechMart
            </span>
            <span style={{
              display: 'block',
              fontSize: '0.6875rem',
              color: '#86868b',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              Admin
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: '#f5f5f7',
            border: 'none',
            borderRadius: '8px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#86868b',
            fontSize: '0.75rem',
            flexShrink: 0,
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav style={{ padding: '0.75rem 0.5rem', flex: 1 }}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 0.75rem',
              borderRadius: '10px',
              marginBottom: '2px',
              textDecoration: 'none',
              color: isActive(item) ? '#0071e3' : '#3d3d40',
              background: isActive(item) ? 'rgba(0, 113, 227, 0.08)' : 'transparent',
              fontWeight: isActive(item) ? 600 : 400,
              fontSize: '0.9375rem',
              transition: 'all 0.15s ease',
              justifyContent: collapsed ? 'center' : 'flex-start',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
            title={collapsed ? item.label : ''}
          >
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* User info */}
      {!collapsed && session?.user && (
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #e8e8ed',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#0071e3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.8125rem',
              fontWeight: 600,
              flexShrink: 0,
            }}>
              {session.user.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#1d1d1f',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {session.user.name}
              </p>
              <p style={{
                fontSize: '0.6875rem',
                color: '#86868b',
                margin: 0,
              }}>
                Administrator
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to sign out?')) {
                signOut({ callbackUrl: '/' });
              }
            }}
            style={{ display: 'block', width: '100%', marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#f5f5f7', borderRadius: '8px', fontSize: '0.8125rem', color: '#ff453a', textAlign: 'center', fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}

function AdminLayoutInner({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace(`/auth/login?redirect=${pathname}`);
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.replace('/');
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f7',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '2px solid #e8e8ed',
            borderTopColor: '#0071e3',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{ color: '#86868b', fontSize: '0.9375rem' }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status !== 'authenticated' || session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f7' }}>
      <AdminSidebar />
      <main style={{
        flex: 1,
        minWidth: 0,
        padding: '0 2rem 2rem',
        overflowX: 'hidden',
      }}>
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <AdminLayoutInner>
          {children}
        </AdminLayoutInner>
      </ToastProvider>
    </SessionProvider>
  );
}
