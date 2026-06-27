'use client';

import { use, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';
import { ArrowLeft, Package, MapPin, Calendar, Check, AlertTriangle } from 'lucide-react';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  inputBorder: '#d2d2d7', red: '#ff453a', green: '#30d158',
  orange: '#ff9f0a', greenBg: 'rgba(48,209,88,0.1)',
  orangeBg: 'rgba(255,159,10,0.1)', redBg: 'rgba(255,69,58,0.08)',
  blueBg: 'rgba(0,113,227,0.08)',
};

const STATUS_FLOW = ['pending', 'confirmed', 'shipped', 'delivered'];

const STATUS_CONFIG = {
  pending:   { bg: C.orangeBg, color: C.orange, label: 'Pending' },
  confirmed: { bg: C.blueBg, color: C.blue, label: 'Confirmed' },
  shipped:   { bg: C.blueBg, color: C.blue, label: 'Shipped' },
  delivered: { bg: C.greenBg, color: C.green, label: 'Delivered' },
};

function formatPrice(price) {
  return new Intl.NumberFormat('en-NG').format(price);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-NG', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function OrderDetailPage({ params }) {
  const { id } = use(params);
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backHover, setBackHover] = useState(false);
  const [dispute, setDispute] = useState(null);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !id) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || 'Failed to load order');
          router.push('/orders');
          return;
        }
        setOrder(data.order);
        // Fetch existing dispute for this order
        try {
          const dRes = await fetch('/api/disputes');
          const dData = await dRes.json();
          if (dRes.ok && dData.disputes) {
            const existing = dData.disputes.find(d => d.orderId?._id === id || d.orderId === id);
            if (existing) setDispute(existing);
          }
        } catch {}
      } catch (err) {
        showToast('Failed to load order');
        router.push('/orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [authStatus, id]);

  const handleSubmitDispute = async () => {
    if (!disputeReason) { showToast('Please select a reason'); return; }
    setSubmittingDispute(true);
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, reason: disputeReason, description: disputeDesc }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to submit dispute'); return; }
      setDispute(data.dispute);
      setShowDisputeForm(false);
      showToast('Dispute submitted successfully', 'success');
    } catch (err) {
      showToast('Failed to submit dispute');
    } finally {
      setSubmittingDispute(false);
    }
  };

  if (authStatus === 'loading' || authStatus === 'unauthenticated') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.muted, fontSize: '1rem' }}>Loading...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <div style={{
            background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
            height: '600px', animation: 'pulse 1.5s ease-in-out infinite',
          }} />
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

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.muted, fontSize: '1rem' }}>Order not found</p>
      </div>
    );
  }

  const STATUS_CONFIG_FULL = {
    ...STATUS_CONFIG,
    refunded: { bg: 'rgba(191,90,242,0.1)', color: '#bf5af2', label: 'Refunded' },
  };
  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const statusConfig = STATUS_CONFIG_FULL[order.status] || STATUS_CONFIG.pending;
  const subtotal = order.items?.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) || 0;
  const deliveryFee = order.totalAmount - subtotal;

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {/* Back Button */}
        <Link
          href="/orders"
          onMouseEnter={() => setBackHover(true)}
          onMouseLeave={() => setBackHover(false)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            color: C.blue, fontSize: '0.9375rem', fontWeight: 500,
            textDecoration: 'none', marginBottom: '1.5rem',
            transition: 'opacity 0.2s',
            opacity: backHover ? 0.7 : 1,
          }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
          Back to Orders
        </Link>

        {/* Order Header */}
        <div style={{
          background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
          padding: '1.5rem', marginBottom: '1rem',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            flexWrap: 'wrap', gap: '0.75rem',
          }}>
            <div>
              <p style={{
                fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.04em', color: C.muted, margin: '0 0 0.25rem',
              }}>
                Order
              </p>
              <h1 style={{
                fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em',
                color: C.text, margin: 0,
              }}>
                {order.orderNumber}
              </h1>
            </div>
            <span style={{
              padding: '0.3rem 0.875rem', borderRadius: '980px',
              fontSize: '0.8125rem', fontWeight: 600,
              background: statusConfig.bg, color: statusConfig.color,
            }}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div style={{
          background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
          padding: '1.5rem', marginBottom: '1rem',
        }}>
          <p style={{
            fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.04em', color: C.muted, margin: '0 0 1.25rem',
          }}>
            Order Progress
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
            {STATUS_FLOW.map((step, i) => {
              const done = i <= currentIndex;
              const isLast = i === STATUS_FLOW.length - 1;
              return (
                <div key={step} style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', position: 'relative',
                }}>
                  {/* Connector line */}
                  {!isLast && (
                    <div style={{
                      position: 'absolute', top: '12px', left: '50%', right: '-50%',
                      height: '2px',
                      background: i < currentIndex ? C.blue : C.border,
                      zIndex: 0,
                    }} />
                  )}
                  {/* Circle */}
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: done ? C.blue : C.bg,
                    border: `2px solid ${done ? C.blue : C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1, position: 'relative',
                    transition: 'all 0.3s ease',
                  }}>
                    {done && <Check size={14} strokeWidth={2.5} color="#ffffff" />}
                  </div>
                  {/* Label */}
                  <span style={{
                    fontSize: '0.6875rem', fontWeight: done ? 600 : 400,
                    color: done ? C.blue : C.muted,
                    marginTop: '0.5rem', textAlign: 'center',
                  }}>
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items */}
        <div style={{
          background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
          padding: '1.5rem', marginBottom: '1rem',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginBottom: '1rem',
          }}>
            <Package size={18} strokeWidth={1.8} color={C.muted} />
            <p style={{
              fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.04em', color: C.muted, margin: 0,
            }}>
              Items ({order.items?.length || 0})
            </p>
          </div>

          {/* Table header */}
          <div className="order-items-header" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 80px 60px 90px 90px',
            padding: '0.5rem 0', borderBottom: `1px solid ${C.border}`,
            gap: '0.5rem',
          }}>
            {['Product', 'Color', 'Qty', 'Unit Price', 'Total'].map(h => (
              <span key={h} style={{
                fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.04em', color: C.muted,
                textAlign: h === 'Qty' || h === 'Unit Price' || h === 'Total' ? 'right' : 'left',
              }}>
                {h}
              </span>
            ))}
          </div>

          {/* Table rows */}
          {order.items?.map((item, i) => (
            <div key={i} className="order-items-row" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 80px 60px 90px 90px',
              padding: '0.75rem 0',
              borderBottom: i < order.items.length - 1 ? `1px solid ${C.bg}` : 'none',
              gap: '0.5rem',
              alignItems: 'center',
            }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: C.text, margin: 0 }}>
                  {item.productName}
                </p>
                {item.storage && (
                  <p style={{ fontSize: '0.75rem', color: C.muted, margin: '0.125rem 0 0' }}>
                    {item.storage}
                  </p>
                )}
              </div>
              <span style={{ fontSize: '0.8125rem', color: C.muted }}>
                {item.color || '-'}
              </span>
              <span style={{ fontSize: '0.8125rem', color: C.text, textAlign: 'right' }}>
                {item.quantity}
              </span>
              <span style={{ fontSize: '0.8125rem', color: C.muted, textAlign: 'right' }}>
                {'₦'}{formatPrice(item.unitPrice)}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: C.text, textAlign: 'right' }}>
                {'₦'}{formatPrice(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Shipping Address & Order Summary side by side */}
        <div className="order-detail-grid" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
          marginBottom: '1rem',
        }}>
          {/* Shipping Address */}
          <div style={{
            background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
            padding: '1.5rem',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              marginBottom: '1rem',
            }}>
              <MapPin size={18} strokeWidth={1.8} color={C.muted} />
              <p style={{
                fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.04em', color: C.muted, margin: 0,
              }}>
                Shipping Address
              </p>
            </div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: C.text, margin: '0 0 0.375rem' }}>
              {order.shippingAddress?.fullName}
            </p>
            <p style={{ fontSize: '0.8125rem', color: C.muted, margin: '0 0 0.25rem', lineHeight: 1.5 }}>
              {order.shippingAddress?.street}
            </p>
            <p style={{ fontSize: '0.8125rem', color: C.muted, margin: '0 0 0.25rem' }}>
              {order.shippingAddress?.city}, {order.shippingAddress?.state}
            </p>
            {order.shippingAddress?.phone && (
              <p style={{ fontSize: '0.8125rem', color: C.muted, margin: '0.5rem 0 0' }}>
                Tel: {order.shippingAddress.phone}
              </p>
            )}
          </div>

          {/* Order Summary */}
          <div style={{
            background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
            padding: '1.5rem',
          }}>
            <p style={{
              fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.04em', color: C.muted, margin: '0 0 1rem',
            }}>
              Order Summary
            </p>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.875rem', color: C.muted, marginBottom: '0.5rem',
            }}>
              <span>Subtotal</span>
              <span>{'₦'}{formatPrice(subtotal)}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.875rem', color: C.muted, marginBottom: '0.75rem',
              paddingBottom: '0.75rem', borderBottom: `1px solid ${C.border}`,
            }}>
              <span>Delivery Fee</span>
              <span>{deliveryFee > 0 ? `₦${formatPrice(deliveryFee)}` : 'Free'}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '1.0625rem', fontWeight: 700, color: C.text,
            }}>
              <span>Total</span>
              <span style={{ color: C.blue }}>{'₦'}{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div style={{
          background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
          padding: '1.5rem',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginBottom: '1rem',
          }}>
            <Calendar size={18} strokeWidth={1.8} color={C.muted} />
            <p style={{
              fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.04em', color: C.muted, margin: 0,
            }}>
              Timeline
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: C.muted }}>Ordered</span>
              <span style={{ color: C.text, fontWeight: 500 }}>{formatDate(order.createdAt)}</span>
            </div>
            {order.confirmedAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: C.muted }}>Confirmed</span>
                <span style={{ color: C.text, fontWeight: 500 }}>{formatDate(order.confirmedAt)}</span>
              </div>
            )}
            {order.shippedAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: C.muted }}>Shipped</span>
                <span style={{ color: C.text, fontWeight: 500 }}>{formatDate(order.shippedAt)}</span>
              </div>
            )}
            {order.deliveredAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: C.muted }}>Delivered</span>
                <span style={{ color: C.text, fontWeight: 500 }}>{formatDate(order.deliveredAt)}</span>
              </div>
            )}
          </div>
        </div>
        {/* Dispute Section */}
        {order.status === 'delivered' && !dispute && (
          <div style={{
            background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
            padding: '1.5rem', marginTop: '1rem',
          }}>
            {!showDisputeForm ? (
              <button
                onClick={() => setShowDisputeForm(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'none', border: `1px solid ${C.red}`, borderRadius: '980px',
                  padding: '0.625rem 1.25rem', color: C.red, fontSize: '0.9375rem',
                  fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <AlertTriangle size={16} />
                Report Issue
              </button>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <AlertTriangle size={18} color={C.red} />
                  <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.muted, margin: 0 }}>
                    Report an Issue
                  </p>
                </div>
                <select
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  style={{
                    width: '100%', padding: '0.65rem 0.875rem', borderRadius: '10px',
                    border: `1px solid ${C.inputBorder}`, background: C.card, color: C.text,
                    fontSize: '0.9375rem', fontFamily: 'inherit', marginBottom: '0.75rem',
                    outline: 'none', appearance: 'none', WebkitAppearance: 'none',
                  }}
                >
                  <option value="">Select a reason...</option>
                  <option value="ITEM_NOT_RECEIVED">Item Not Received</option>
                  <option value="WRONG_ITEM">Wrong Item</option>
                  <option value="ITEM_DAMAGED">Item Damaged</option>
                  <option value="CHANGE_OF_MIND">Change of Mind</option>
                </select>
                <textarea
                  value={disputeDesc}
                  onChange={e => setDisputeDesc(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  style={{
                    width: '100%', padding: '0.65rem 0.875rem', borderRadius: '10px',
                    border: `1px solid ${C.inputBorder}`, background: C.card, color: C.text,
                    fontSize: '0.9375rem', fontFamily: 'inherit', marginBottom: '0.75rem',
                    outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handleSubmitDispute}
                    disabled={submittingDispute}
                    style={{
                      background: submittingDispute ? C.muted : C.red, color: '#fff',
                      border: 'none', borderRadius: '980px', padding: '0.625rem 1.5rem',
                      fontSize: '0.9375rem', fontWeight: 500, cursor: submittingDispute ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {submittingDispute ? 'Submitting...' : 'Submit Dispute'}
                  </button>
                  <button
                    onClick={() => { setShowDisputeForm(false); setDisputeReason(''); setDisputeDesc(''); }}
                    style={{
                      background: 'none', border: `1px solid ${C.border}`, borderRadius: '980px',
                      padding: '0.625rem 1.5rem', color: C.muted, fontSize: '0.9375rem',
                      fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Existing Dispute Status */}
        {dispute && (
          <div style={{
            background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
            padding: '1.5rem', marginTop: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertTriangle size={18} color={C.orange} />
              <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.muted, margin: 0 }}>
                Dispute
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: C.muted }}>Reason: {dispute.reason?.replace(/_/g, ' ')}</span>
              <span style={{
                padding: '0.2rem 0.625rem', borderRadius: '980px', fontSize: '0.6875rem', fontWeight: 600,
                background: dispute.status === 'OPEN' ? C.orangeBg : dispute.status === 'APPROVED' ? C.greenBg : C.redBg,
                color: dispute.status === 'OPEN' ? C.orange : dispute.status === 'APPROVED' ? C.green : C.red,
              }}>
                {dispute.status}
              </span>
            </div>
            {dispute.description && (
              <p style={{ fontSize: '0.875rem', color: C.text, margin: '0 0 0.5rem', lineHeight: 1.5 }}>{dispute.description}</p>
            )}
            {dispute.adminNote && (
              <div style={{ background: C.bg, borderRadius: '10px', padding: '0.75rem', marginTop: '0.5rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: C.muted, margin: '0 0 0.25rem' }}>Admin Response</p>
                <p style={{ fontSize: '0.875rem', color: C.text, margin: 0, lineHeight: 1.5 }}>{dispute.adminNote}</p>
              </div>
            )}
          </div>
        )}

        {/* Refunded status banner */}
        {order.status === 'refunded' && (
          <div style={{
            background: 'rgba(191,90,242,0.08)', borderRadius: '12px', padding: '0.75rem 1rem',
            marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#bf5af2', fontWeight: 500,
          }}>
            This order has been refunded
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 768px) {
          .order-detail-grid {
            grid-template-columns: 1fr !important;
          }
          .order-items-header,
          .order-items-row {
            grid-template-columns: 1fr 60px 40px 80px !important;
          }
          .order-items-header span:nth-child(5),
          .order-items-row span:nth-child(5),
          .order-items-row > *:nth-child(5) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
