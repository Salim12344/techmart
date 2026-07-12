// app/admin/orders/page.jsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/app/components/Toast';
import { ArrowLeft } from 'lucide-react';
import { formatPrice } from '@/lib/formatPrice';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  red: '#ff453a', redBg: 'rgba(255,69,58,0.08)',
  green: '#30d158', greenBg: 'rgba(48,209,88,0.1)',
  orange: '#ff9f0a', orangeBg: 'rgba(255,159,10,0.1)',
  purple: '#bf5af2', purpleBg: 'rgba(191,90,242,0.1)',
  inputBorder: '#d2d2d7',
};

const STATUS_STYLES = {
  pending:   { bg: C.orangeBg, color: C.orange },
  confirmed: { bg: C.purpleBg, color: C.purple },
  shipped:   { bg: 'rgba(0,113,227,0.1)', color: C.blue },
  delivered: { bg: C.greenBg, color: C.green },
  cancelled: { bg: C.redBg, color: C.red },
};

const STATUS_FLOW = ['pending', 'confirmed', 'shipped', 'delivered'];

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center', color: '#86868b' }}>Loading orders...</div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}

function AdminOrdersContent() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/admin/orders');
        const data = await res.json();
        if (!res.ok) { showToast(data.error || 'Unable to load orders right now'); return; }
        setOrders(data.orders || []);

        const highlightId = searchParams.get('order');
        if (highlightId) {
          const match = (data.orders || []).find((o) => o._id === highlightId);
          if (match) setSelectedOrder(match);
        }
      } catch (err) {
        showToast(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'admin') fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Unable to update order right now'); return; }

      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      window.dispatchEvent(new Event('admin-orders-read'));
      showToast(`Order marked as ${newStatus}`, 'success');
    } catch (err) {
      showToast(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchSearch = !searchQuery ||
      o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.shippingAddress?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const nextStatus = (current) => {
    const idx = STATUS_FLOW.indexOf(current);
    // indexOf returns -1 for a status outside the normal flow (cancelled, refunded) -
    // treat that as "no next step" instead of wrapping around to STATUS_FLOW[0].
    if (idx === -1) return null;
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  };

  const renderOrderDetail = (order) => (
    <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Order number + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.muted, margin: '0 0 0.25rem' }}>Order</p>
          <p style={{ fontWeight: 700, fontSize: '1rem', color: C.text, margin: 0 }}>{order.orderNumber}</p>
        </div>
        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '980px', fontSize: '0.75rem', fontWeight: 600, background: STATUS_STYLES[order.status]?.bg, color: STATUS_STYLES[order.status]?.color }}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          {STATUS_FLOW.map((s, i) => {
            const current = STATUS_FLOW.indexOf(order.status);
            const done = i <= current;
            return (
              <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', flex: 1 }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: done ? C.blue : C.bg, border: `2px solid ${done ? C.blue : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {done && <span style={{ color: '#fff', fontSize: '0.625rem', fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: '0.625rem', color: done ? C.blue : C.muted, fontWeight: done ? 600 : 400, textAlign: 'center' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem' }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.muted, margin: '0 0 0.625rem' }}>Items</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {order.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: C.muted }}>{item.productName} × {item.quantity}</span>
              <span style={{ fontWeight: 600, color: C.text }}>{formatPrice(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: C.muted, marginBottom: '0.375rem' }}>
          <span>Subtotal</span>
          <span>{formatPrice(order.items?.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0))}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: C.muted, marginBottom: '0.5rem' }}>
          <span>Delivery</span>
          <span>{order.deliveryFee ? formatPrice(order.deliveryFee) : 'Free'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', fontWeight: 700, color: C.text }}>
          <span>Total</span>
          <span style={{ color: C.blue }}>{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      {/* Shipping address */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem' }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.muted, margin: '0 0 0.625rem' }}>Shipping Address</p>
        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: C.text, margin: '0 0 0.125rem' }}>{order.shippingAddress?.fullName}</p>
        <p style={{ fontSize: '0.8125rem', color: C.muted, margin: '0 0 0.125rem' }}>{order.shippingAddress?.street}</p>
        <p style={{ fontSize: '0.8125rem', color: C.muted, margin: '0 0 0.125rem' }}>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
        <p style={{ fontSize: '0.8125rem', color: C.muted, margin: 0 }}>Phone: {order.shippingAddress?.phone}</p>
      </div>

      {/* Dates */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
          <span style={{ color: C.muted }}>Ordered</span>
          <span style={{ color: C.text }}>{new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
        {order.confirmedAt && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <span style={{ color: C.muted }}>Confirmed</span>
            <span style={{ color: C.text }}>{new Date(order.confirmedAt).toLocaleDateString()}</span>
          </div>
        )}
        {order.shippedAt && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <span style={{ color: C.muted }}>Shipped</span>
            <span style={{ color: C.text }}>{new Date(order.shippedAt).toLocaleDateString()}</span>
          </div>
        )}
        {order.deliveredAt && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <span style={{ color: C.muted }}>Delivered</span>
            <span style={{ color: C.text }}>{new Date(order.deliveredAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Action button */}
      {nextStatus(order.status) && (
        <button
          onClick={() => handleUpdateStatus(order._id, nextStatus(order.status))}
          disabled={updating}
          style={{ width: '100%', background: updating ? C.muted : C.blue, color: '#fff', border: 'none', borderRadius: '980px', padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 500, cursor: updating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}>
          {updating ? 'Updating...' : `Mark as ${nextStatus(order.status).charAt(0).toUpperCase() + nextStatus(order.status).slice(1)}`}
        </button>
      )}

      {!nextStatus(order.status) && (
        <div style={{
          textAlign: 'center', padding: '0.75rem', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 500,
          background: order.status === 'delivered' ? C.greenBg : C.redBg,
          color: order.status === 'delivered' ? C.green : C.red,
        }}>
          {order.status === 'delivered' ? '✓ Order completed' : `This order was ${order.status} - no further action available`}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: C.muted }}>Loading orders...</div>;
  }

  return (
    <div className="admin-orders-page" style={{ paddingTop: '2rem' }}>
      <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: '#0071e3', cursor: 'pointer', fontSize: '0.9375rem', fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
        <ArrowLeft size={16} /> Dashboard
      </button>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: C.text, margin: 0 }}>
          Orders
        </h1>
        <p style={{ color: C.muted, marginTop: '0.25rem', fontSize: '0.9375rem' }}>
          {orders.length} total order{orders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {/* Status tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
            <button key={s} onClick={() => { setFilterStatus(s); setSelectedOrder(null); }}
              style={{ padding: '0.375rem 0.875rem', borderRadius: '980px', fontSize: '0.8125rem', fontWeight: 500, border: `1px solid ${filterStatus === s ? C.blue : C.border}`, background: filterStatus === s ? C.blue : C.card, color: filterStatus === s ? '#fff' : C.text, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              {s === 'all' ? `All (${orders.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${orders.filter(o => o.status === s).length})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <input type="text" placeholder="Search by order number or customer name..."
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding: '0.65rem 0.875rem', borderRadius: '10px', border: `1px solid ${C.inputBorder}`, background: C.card, color: C.text, fontSize: '0.9375rem', fontFamily: 'inherit', outline: 'none' }}
          onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }} />
      </div>

      {/* Main layout */}
      <div className="admin-orders-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Orders list */}
        <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          {/* Table header */}
          <div className="admin-orders-list-header" style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 90px', padding: '0.75rem 1rem', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
            {['Order', 'Customer', 'Amount', 'Status'].map(h => (
              <span key={h} className={h === 'Customer' || h === 'Amount' ? 'admin-orders-hide-mobile' : ''} style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.muted }}>{h}</span>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: C.muted }}>
              No orders found.
            </div>
          ) : (
            filteredOrders.map(order => {
              const isSelected = selectedOrder?._id === order._id;
              const ss = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
              return (
                <div key={order._id}>
                <div onClick={() => setSelectedOrder(isSelected ? null : order)}
                  className="admin-orders-list-row"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 90px', padding: '0.875rem 1rem', borderBottom: `1px solid ${C.bg}`, cursor: 'pointer', background: isSelected ? '#f0f6ff' : C.card, transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = C.bg; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = C.card; }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: C.text, margin: '0 0 0.125rem' }}>{order.orderNumber}</p>
                    <p style={{ fontSize: '0.75rem', color: C.muted, margin: 0 }}>{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="admin-orders-hide-mobile" style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: C.text }}>{order.shippingAddress?.fullName}</span>
                  </div>
                  <div className="admin-orders-hide-mobile" style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: C.text }}>{formatPrice(order.totalAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ padding: '0.2rem 0.625rem', borderRadius: '980px', fontSize: '0.6875rem', fontWeight: 600, background: ss.bg, color: ss.color }}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <div className="admin-orders-detail-inline" style={{ display: 'none', padding: '0 1rem 1rem' }}>
                    {renderOrderDetail(order)}
                  </div>
                )}
                </div>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        <div className="admin-orders-detail" style={{ position: 'sticky', top: '1.5rem' }}>
          {selectedOrder ? renderOrderDetail(selectedOrder) : (
            <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, padding: '2rem', textAlign: 'center', color: C.muted }}>
              Select an order to view details
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-orders-layout {
            grid-template-columns: 1fr !important;
          }
          .admin-orders-detail {
            display: none !important;
          }
          .admin-orders-detail-inline {
            display: block !important;
          }
          .admin-orders-page h1 {
            font-size: 1.5rem !important;
          }
          .admin-orders-list-header,
          .admin-orders-list-row {
            grid-template-columns: 1fr 90px !important;
          }
          .admin-orders-hide-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
