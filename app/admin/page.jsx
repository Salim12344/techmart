// app/admin/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/Button';
import { Package, ShoppingCart, Users, Truck, ArrowLeft } from 'lucide-react';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Failed to load stats'); return; }
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'admin') fetchStats();
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#86868b' }}>
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#ff453a' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#1d1d1f', margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ color: '#86868b', marginTop: '0.25rem', fontSize: '0.9375rem' }}>
          Welcome back, {session?.user?.name}
        </p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <MetricCard
          label="Total Products"
          value={stats?.totalProducts || 0}
          subtitle={`${stats?.lowStockProducts || 0} low stock`}
          icon={<Package size={20} />}
          accentColor="#30d158"
        />
        <MetricCard
          label="Pending Orders"
          value={stats?.pendingOrders || 0}
          subtitle="waiting to ship"
          icon={<ShoppingCart size={20} />}
          accentColor="#ff9f0a"
          action={<Link href="/admin/orders"><Button variant="secondary" size="sm">View</Button></Link>}
        />
        <MetricCard
          label="Registered Users"
          value={stats?.totalUsers || 0}
          subtitle="total registered"
          icon={<Users size={20} />}
          accentColor="#0071e3"
          action={<Link href="/admin/users"><Button variant="secondary" size="sm">View</Button></Link>}
        />
      </div>

      {/* Quick Actions — only 2 now */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1d1d1f', marginBottom: '1rem', letterSpacing: '-0.015em' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <Link href="/admin/products" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e8e8ed',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0071e3';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e8e8ed';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#0071e3' }}><Package size={24} /></div>
              <h3 style={{ fontWeight: 600, color: '#1d1d1f', margin: '0 0 0.25rem', fontSize: '1rem' }}>
                Products & Categories
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#86868b', margin: 0 }}>
                Add, edit, or remove products
              </p>
            </div>
          </Link>

          <Link href="/admin/orders" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e8e8ed',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0071e3';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e8e8ed';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#0071e3' }}><Truck size={24} /></div>
              <h3 style={{ fontWeight: 600, color: '#1d1d1f', margin: '0 0 0.25rem', fontSize: '1rem' }}>
                Manage Orders
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#86868b', margin: 0 }}>
                View and ship customer orders
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      {stats?.recentOrders && stats.recentOrders.length > 0 && (
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e8e8ed',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 600, fontSize: '1.0625rem', color: '#1d1d1f', margin: 0 }}>
              Recent Orders
            </h2>
            <Link href="/admin/orders" style={{ fontSize: '0.875rem', color: '#0071e3', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stats.recentOrders.map((order) => (
              <div key={order._id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.875rem 1rem',
                background: '#f5f5f7',
                borderRadius: '12px',
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#1d1d1f', margin: '0 0 0.125rem' }}>
                    {order.orderNumber}
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: '#86868b', margin: 0 }}>
                    {order.customerName} · {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, subtitle, icon, accentColor, action }) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '18px',
      border: '1px solid #e8e8ed',
      padding: '1.5rem',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: `${accentColor}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.125rem',
        marginBottom: '0.75rem',
      }}>
        {icon}
      </div>
      <p style={{ fontSize: '0.8125rem', color: '#86868b', fontWeight: 500, margin: '0 0 0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 700, color: '#1d1d1f', margin: '0 0 0.25rem', letterSpacing: '-0.03em' }}>
        {value}
      </p>
      <p style={{ fontSize: '0.8125rem', color: '#86868b', margin: 0 }}>
        {subtitle}
      </p>
      {action && <div style={{ marginTop: '0.75rem' }}>{action}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending:   { background: 'rgba(255,159,10,0.12)', color: '#ff9f0a' },
    confirmed: { background: 'rgba(0,113,227,0.12)',  color: '#0071e3' },
    shipped:   { background: 'rgba(48,209,88,0.12)',  color: '#30d158' },
    delivered: { background: 'rgba(48,209,88,0.12)',  color: '#30d158' },
  };

  const s = styles[status] || styles.pending;

  return (
    <span style={{
      ...s,
      padding: '0.25rem 0.75rem',
      borderRadius: '980px',
      fontSize: '0.75rem',
      fontWeight: 600,
    }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
