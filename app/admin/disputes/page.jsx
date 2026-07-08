'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/Toast';
import { useConfirm } from '@/app/components/ConfirmDialog';
import { ArrowLeft } from 'lucide-react';
import { formatPrice } from '@/lib/formatPrice';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  red: '#ff453a', redBg: 'rgba(255,69,58,0.08)',
  green: '#30d158', greenBg: 'rgba(48,209,88,0.1)',
  orange: '#ff9f0a', orangeBg: 'rgba(255,159,10,0.1)',
  inputBorder: '#d2d2d7',
};

const STATUS_STYLES = {
  OPEN: { bg: C.orangeBg, color: C.orange },
  APPROVED: { bg: C.greenBg, color: C.green },
  REJECTED: { bg: C.redBg, color: C.red },
};

const REASON_LABELS = {
  ITEM_NOT_RECEIVED: 'Item Not Received',
  WRONG_ITEM: 'Wrong Item',
  ITEM_DAMAGED: 'Item Damaged',
  CHANGE_OF_MIND: 'Change of Mind',
};

export default function AdminDisputesPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const confirmAction = useConfirm();
  const router = useRouter();

  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [adminResponse, setAdminResponse] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (session?.user?.role === 'admin') fetchDisputes();
  }, [session]);

  const fetchDisputes = async () => {
    try {
      const res = await fetch('/api/admin/disputes');
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Unable to load disputes right now'); return; }
      setDisputes(data.disputes || []);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (status) => {
    if (!selectedDispute) return;

    if (status === 'APPROVED') {
      const amount = selectedDispute.orderId?.totalAmount;
      if (!(await confirmAction({ title: 'Approve refund?', message: `This will refund ${formatPrice(amount)} to the customer.`, confirmLabel: 'Refund', destructive: false }))) return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/disputes/${selectedDispute._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminResponse }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Unable to resolve dispute right now'); return; }

      setDisputes(disputes.map(d => d._id === selectedDispute._id ? { ...d, status, adminNote: adminResponse } : d));
      setSelectedDispute({ ...selectedDispute, status, adminNote: adminResponse });
      setAdminResponse('');
      window.dispatchEvent(new Event('admin-disputes-read'));
      showToast(`Dispute ${status.toLowerCase()}`, 'success');
    } catch (err) {
      showToast(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredDisputes = disputes.filter(d => filterStatus === 'all' || d.status === filterStatus);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: C.muted }}>Loading disputes...</div>;
  }

  return (
    <div className="admin-disputes-page" style={{ paddingTop: '2rem' }}>
      <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: C.blue, cursor: 'pointer', fontSize: '0.9375rem', fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
        <ArrowLeft size={16} /> Dashboard
      </button>

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: C.text, margin: 0 }}>
          Disputes
        </h1>
        <p style={{ color: C.muted, marginTop: '0.25rem', fontSize: '0.9375rem' }}>
          {disputes.length} total dispute{disputes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {['all', 'OPEN', 'APPROVED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            style={{
              padding: '0.375rem 0.875rem', borderRadius: '980px', fontSize: '0.8125rem',
              fontWeight: 500, border: `1px solid ${filterStatus === s ? C.blue : C.border}`,
              background: filterStatus === s ? C.blue : C.card,
              color: filterStatus === s ? '#fff' : C.text,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}>
            {s === 'all' ? `All (${disputes.length})` : `${s.charAt(0) + s.slice(1).toLowerCase()} (${disputes.filter(d => d.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div className="admin-disputes-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem', alignItems: 'start' }}>
        {/* List */}
        <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div className="admin-disputes-list-header" style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 90px', padding: '0.75rem 1rem', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
            {['Order', 'Customer', 'Reason', 'Status'].map(h => (
              <span key={h} className={h === 'Customer' || h === 'Reason' ? 'admin-disputes-hide-mobile' : ''} style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.muted }}>{h}</span>
            ))}
          </div>

          {filteredDisputes.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: C.muted }}>No disputes found.</div>
          ) : (
            filteredDisputes.map(d => {
              const isSelected = selectedDispute?._id === d._id;
              const ss = STATUS_STYLES[d.status] || STATUS_STYLES.OPEN;
              return (
                <div key={d._id}
                  onClick={() => { setSelectedDispute(isSelected ? null : d); setAdminResponse(''); }}
                  className="admin-disputes-list-row"
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 140px 120px 90px',
                    padding: '0.875rem 1rem', borderBottom: `1px solid ${C.bg}`,
                    cursor: 'pointer', background: isSelected ? '#f0f6ff' : C.card,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = C.bg; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = C.card; }}
                >
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: C.text, margin: '0 0 0.125rem' }}>
                      {d.orderId?.orderNumber || d.orderNumber || '-'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: C.muted, margin: 0 }}>
                      {new Date(d.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="admin-disputes-hide-mobile" style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: C.text }}>
                      {d.userId?.name || '-'}
                    </span>
                  </div>
                  <div className="admin-disputes-hide-mobile" style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', color: C.muted }}>
                      {REASON_LABELS[d.reason] || d.reason}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      padding: '0.2rem 0.625rem', borderRadius: '980px', fontSize: '0.6875rem',
                      fontWeight: 600, background: ss.bg, color: ss.color,
                    }}>
                      {d.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        <div className="admin-disputes-detail" style={{ position: 'sticky', top: '1.5rem' }}>
          {selectedDispute ? (
            <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.muted, margin: '0 0 0.25rem' }}>Dispute</p>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: C.text, margin: 0 }}>
                    {selectedDispute.orderId?.orderNumber || selectedDispute.orderNumber || '-'}
                  </p>
                </div>
                <span style={{
                  padding: '0.25rem 0.75rem', borderRadius: '980px', fontSize: '0.75rem', fontWeight: 600,
                  background: STATUS_STYLES[selectedDispute.status]?.bg,
                  color: STATUS_STYLES[selectedDispute.status]?.color,
                }}>
                  {selectedDispute.status}
                </span>
              </div>

              {/* Customer info */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.muted, margin: '0 0 0.5rem' }}>Customer</p>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: C.text, margin: '0 0 0.125rem' }}>
                  {selectedDispute.userId?.name || '-'}
                </p>
                <p style={{ fontSize: '0.8125rem', color: C.muted, margin: 0 }}>
                  {selectedDispute.userId?.email || '-'}
                </p>
              </div>

              {/* Dispute details */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.muted, margin: '0 0 0.5rem' }}>Details</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
                  <span style={{ color: C.muted }}>Reason</span>
                  <span style={{ color: C.text, fontWeight: 500 }}>{REASON_LABELS[selectedDispute.reason] || selectedDispute.reason}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
                  <span style={{ color: C.muted }}>Filed</span>
                  <span style={{ color: C.text }}>{new Date(selectedDispute.createdAt).toLocaleDateString()}</span>
                </div>
                {selectedDispute.description && (
                  <div style={{ background: C.bg, borderRadius: '10px', padding: '0.75rem', marginTop: '0.5rem' }}>
                    <p style={{ fontSize: '0.8125rem', color: C.text, margin: 0, lineHeight: 1.5 }}>
                      {selectedDispute.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Order details */}
              {selectedDispute.orderId && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem' }}>
                  <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.muted, margin: '0 0 0.5rem' }}>Order</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {selectedDispute.orderId.items?.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                        <span style={{ color: C.muted }}>{item.productName} x{item.quantity}</span>
                        <span style={{ color: C.text, fontWeight: 500 }}>{formatPrice(item.unitPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', fontWeight: 700, color: C.text, marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: `1px solid ${C.border}` }}>
                    <span>Total</span>
                    <span style={{ color: C.blue }}>{formatPrice(selectedDispute.orderId.totalAmount)}</span>
                  </div>
                </div>
              )}

              {/* Admin note if already resolved */}
              {selectedDispute.adminNote && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem' }}>
                  <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.muted, margin: '0 0 0.5rem' }}>Admin Response</p>
                  <div style={{ background: C.bg, borderRadius: '10px', padding: '0.75rem' }}>
                    <p style={{ fontSize: '0.8125rem', color: C.text, margin: 0, lineHeight: 1.5 }}>{selectedDispute.adminNote}</p>
                  </div>
                </div>
              )}

              {/* Actions (only for OPEN disputes) */}
              {selectedDispute.status === 'OPEN' && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem' }}>
                  <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.muted, margin: '0 0 0.5rem' }}>Response</p>
                  <textarea
                    value={adminResponse}
                    onChange={e => setAdminResponse(e.target.value)}
                    placeholder="Write your response to the customer..."
                    rows={3}
                    style={{
                      width: '100%', padding: '0.65rem 0.875rem', borderRadius: '10px',
                      border: `1px solid ${C.inputBorder}`, background: C.card, color: C.text,
                      fontSize: '0.875rem', fontFamily: 'inherit', marginBottom: '0.75rem',
                      outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => handleResolve('APPROVED')}
                      disabled={processing}
                      style={{
                        flex: 1, background: processing ? C.muted : C.green, color: '#fff',
                        border: 'none', borderRadius: '980px', padding: '0.75rem',
                        fontSize: '0.9375rem', fontWeight: 500,
                        cursor: processing ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {processing ? 'Processing...' : 'Approve & Refund'}
                    </button>
                    <button
                      onClick={() => handleResolve('REJECTED')}
                      disabled={processing}
                      style={{
                        flex: 1, background: processing ? C.muted : C.red, color: '#fff',
                        border: 'none', borderRadius: '980px', padding: '0.75rem',
                        fontSize: '0.9375rem', fontWeight: 500,
                        cursor: processing ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Completed state */}
              {selectedDispute.status !== 'OPEN' && (
                <div style={{
                  textAlign: 'center', padding: '0.75rem', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 500,
                  background: selectedDispute.status === 'APPROVED' ? C.greenBg : C.redBg,
                  color: selectedDispute.status === 'APPROVED' ? C.green : C.red,
                }}>
                  {selectedDispute.status === 'APPROVED' ? 'Dispute approved & refund initiated' : 'Dispute rejected'}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, padding: '2rem', textAlign: 'center', color: C.muted }}>
              Select a dispute to view details
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-disputes-layout {
            grid-template-columns: 1fr !important;
          }
          .admin-disputes-detail {
            position: static !important;
          }
          .admin-disputes-page h1 {
            font-size: 1.5rem !important;
          }
          .admin-disputes-list-header,
          .admin-disputes-list-row {
            grid-template-columns: 1fr 90px !important;
          }
          .admin-disputes-hide-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
