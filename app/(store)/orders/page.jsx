'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';
import { Package, ChevronRight, Clock, Truck, Check } from 'lucide-react';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  inputBorder: '#d2d2d7', red: '#ff453a', green: '#30d158',
  orange: '#ff9f0a', greenBg: 'rgba(48,209,88,0.1)',
  orangeBg: 'rgba(255,159,10,0.1)', redBg: 'rgba(255,69,58,0.08)',
  blueBg: 'rgba(0,113,227,0.08)',
};

const STATUS_CONFIG = {
  pending:   { bg: C.orangeBg, color: C.orange, icon: Clock, label: 'Pending' },
  confirmed: { bg: C.blueBg, color: C.blue, icon: Check, label: 'Confirmed' },
  shipped:   { bg: C.blueBg, color: C.blue, icon: Truck, label: 'Shipped' },
  delivered: { bg: C.greenBg, color: C.green, icon: Check, label: 'Delivered' },
};

function formatPrice(price) {
  return new Intl.NumberFormat('en-NG').format(price);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function OrdersPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;

    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || 'Failed to load orders');
          return;
        }
        setOrders(data.orders || []);
      } catch (err) {
        showToast('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [authStatus]);

  if (authStatus === 'loading' || authStatus === 'unauthenticated') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.muted, fontSize: '1rem' }}>Loading...</p>
      </div>
    );
  }

  function getItemsSummary(items) {
    if (!items || items.length === 0) return 'No items';
    const first = items.slice(0, 2).map(item => item.productName).join(', ');
    if (items.length > 2) {
      return `${first} and ${items.length - 2} more`;
    }
    return first;
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em',
            color: C.text, margin: '0 0 0.25rem',
          }}>
            My Orders
          </h1>
          <p style={{ color: C.muted, fontSize: '0.9375rem', margin: 0 }}>
            Track and manage your orders
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{
                background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
                height: '140px', animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
            padding: '4rem 2rem', textAlign: 'center',
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', background: C.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <Package size={28} strokeWidth={1.5} color={C.muted} />
            </div>
            <h3 style={{
              fontSize: '1.25rem', fontWeight: 600, color: C.text,
              margin: '0 0 0.5rem', letterSpacing: '-0.02em',
            }}>
              No orders yet
            </h3>
            <p style={{
              fontSize: '0.9375rem', color: C.muted, margin: '0 0 1.5rem',
              maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5,
            }}>
              When you place an order, it will appear here for you to track.
            </p>
            <Link href="/products" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', background: C.blue, color: '#ffffff',
              borderRadius: '980px', fontSize: '0.9375rem', fontWeight: 500,
              textDecoration: 'none', transition: 'background 0.2s',
            }}>
              Start Shopping
              <ChevronRight size={16} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const isHovered = hoveredCard === order._id;

              return (
                <Link
                  key={order._id}
                  href={`/orders/${order._id}`}
                  onMouseEnter={() => setHoveredCard(order._id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    textDecoration: 'none', color: 'inherit',
                    background: C.card, borderRadius: '18px',
                    border: `1px solid ${C.border}`,
                    padding: '1.25rem 1.5rem',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    boxShadow: isHovered
                      ? '0 8px 30px rgba(0,0,0,0.08)'
                      : '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: statusConfig.bg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <StatusIcon size={22} strokeWidth={1.8} color={statusConfig.color} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      marginBottom: '0.375rem', flexWrap: 'wrap',
                    }}>
                      <span style={{
                        fontSize: '0.9375rem', fontWeight: 600, color: C.text,
                        letterSpacing: '-0.01em',
                      }}>
                        {order.orderNumber}
                      </span>
                      <span style={{
                        padding: '0.15rem 0.625rem', borderRadius: '980px',
                        fontSize: '0.6875rem', fontWeight: 600,
                        background: statusConfig.bg, color: statusConfig.color,
                      }}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '0.8125rem', color: C.muted, margin: '0 0 0.25rem',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {getItemsSummary(order.items)}
                    </p>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                    }}>
                      <span style={{ fontSize: '0.8125rem', color: C.muted }}>
                        {formatDate(order.createdAt)}
                      </span>
                      <span style={{
                        fontSize: '0.9375rem', fontWeight: 600, color: C.text,
                      }}>
                        {'₦'}{formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    size={20}
                    strokeWidth={1.8}
                    color={C.muted}
                    style={{
                      flexShrink: 0,
                      transition: 'transform 0.2s ease',
                      transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
                    }}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
