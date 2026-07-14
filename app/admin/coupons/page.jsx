'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/Toast';
import { useConfirm } from '@/app/components/ConfirmDialog';
import { ArrowLeft, Plus, Trash2, Tag } from 'lucide-react';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  red: '#ff453a', green: '#30d158', greenBg: 'rgba(48,209,88,0.1)',
  redBg: 'rgba(255,69,58,0.08)', inputBorder: '#d2d2d7',
  orange: '#ff9f0a', orangeBg: 'rgba(255,159,10,0.1)',
};

export default function AdminCouponsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const confirmAction = useConfirm();
  const router = useRouter();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '',
    discountPercent: 5,
    expiresAt: '',
    maxUses: 100,
  });

  useEffect(() => {
    if (session?.user?.role === 'admin') fetchCoupons();
  }, [session]);

  async function fetchCoupons() {
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (res.ok) setCoupons(data.coupons || []);
    } catch (err) {
      showToast('Unable to load coupons right now');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.code.trim() || !form.expiresAt) {
      showToast('Please fill all fields', 'error');
      return;
    }
    if (form.discountPercent < 1 || form.discountPercent > 10) {
      showToast('Discount must be between 1% and 10%', 'error');
      return;
    }
    if (new Date(form.expiresAt) <= new Date()) {
      showToast('Expiry date must be in the future', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Unable to create coupon right now'); return; }
      setCoupons([data.coupon, ...coupons]);
      setShowForm(false);
      setForm({ code: '', discountPercent: 5, expiresAt: '', maxUses: 100 });
      showToast('Coupon created', 'success');
    } catch {
      showToast('Unable to create coupon right now');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(coupon) {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      if (res.ok) {
        setCoupons(coupons.map(c => c._id === coupon._id ? { ...c, isActive: !c.isActive } : c));
        showToast(`Coupon ${!coupon.isActive ? 'activated' : 'deactivated'}`, 'success');
      }
    } catch {
      showToast('Unable to update coupon right now');
    }
  }

  async function handleDelete(id) {
    if (!(await confirmAction({ title: 'Delete this coupon?', confirmLabel: 'Delete' }))) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCoupons(coupons.filter(c => c._id !== id));
        showToast('Coupon deleted', 'success');
      }
    } catch {
      showToast('Unable to delete coupon right now');
    }
  }

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: C.muted }}>Loading coupons...</div>;
  }

  const inputStyle = {
    width: '100%', padding: '0.65rem 0.875rem', borderRadius: '10px',
    border: `1px solid ${C.inputBorder}`, background: C.card, color: C.text,
    fontSize: '0.9375rem', fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block', fontSize: '0.6875rem', fontWeight: 600,
    color: C.muted, marginBottom: '0.375rem', textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  return (
    <div style={{ paddingTop: '2rem' }}>
      <style>{`
        .coupon-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .coupon-header-row, .coupon-data-row {
          display: grid; grid-template-columns: 1fr 80px 120px 100px 80px 80px;
        }
        @media (max-width: 768px) {
          .coupon-form-grid { grid-template-columns: 1fr !important; }
          .coupon-header-row { display: none !important; }
          .coupon-data-row {
            grid-template-columns: 1fr !important;
            gap: 0.5rem;
            padding: 1rem !important;
          }
          .coupon-data-row .coupon-field { display: flex; justify-content: space-between; align-items: center; }
          .coupon-data-row .coupon-field-label {
            font-size: 0.6875rem; font-weight: 600; text-transform: uppercase;
            letter-spacing: 0.04em; color: ${C.muted};
          }
        }
      `}</style>
      <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: C.blue, cursor: 'pointer', fontSize: '0.9375rem', fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
        <ArrowLeft size={16} /> Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: C.text, margin: 0 }}>
            Coupons
          </h1>
          <p style={{ color: C.muted, marginTop: '0.25rem', fontSize: '0.9375rem' }}>
            {coupons.length} coupon{coupons.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            background: C.blue, color: '#fff', border: 'none', borderRadius: '980px',
            padding: '0.625rem 1.25rem', fontSize: '0.9375rem', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Plus size={16} />
          New Coupon
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div style={{
          background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
          padding: '1.5rem', marginBottom: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: C.text, margin: '0 0 1.25rem' }}>
            Create New Coupon
          </h2>
          <form onSubmit={handleCreate} className="coupon-form-grid">
            <div>
              <label style={labelStyle}>Coupon Code</label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. SAVE10"
                style={{ ...inputStyle, textTransform: 'uppercase' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Discount % (max 10%)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.discountPercent}
                onChange={e => setForm({ ...form, discountPercent: Math.min(10, Math.max(1, Number(e.target.value))) })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Expiry Date</label>
              <input
                type="date"
                value={form.expiresAt}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Max Uses</label>
              <input
                type="number"
                min={1}
                value={form.maxUses}
                onChange={e => setForm({ ...form, maxUses: Number(e.target.value) })}
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '0.625rem 1.25rem', borderRadius: '980px',
                  border: `1px solid ${C.border}`, background: 'none',
                  color: C.muted, fontSize: '0.9375rem', fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.625rem 1.5rem', borderRadius: '980px',
                  border: 'none', background: saving ? C.muted : C.blue,
                  color: '#fff', fontSize: '0.9375rem', fontWeight: 500,
                  cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}
              >
                {saving ? 'Creating...' : 'Create Coupon'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons Table */}
      <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {/* Header */}
        <div className="coupon-header-row" style={{
          padding: '0.75rem 1rem', background: C.bg, borderBottom: `1px solid ${C.border}`,
        }}>
          {['Code', 'Discount', 'Expiry', 'Uses', 'Status', 'Actions'].map(h => (
            <span key={h} style={{
              fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.04em', color: C.muted,
            }}>
              {h}
            </span>
          ))}
        </div>

        {coupons.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: C.muted }}>
            No coupons yet. Create one to get started.
          </div>
        ) : (
          coupons.map(coupon => {
            const expired = new Date() > new Date(coupon.expiresAt);
            const exhausted = coupon.usedCount >= coupon.maxUses;
            return (
              <div key={coupon._id} className="coupon-data-row" style={{
                padding: '0.875rem 1rem', borderBottom: `1px solid ${C.bg}`,
                alignItems: 'center',
              }}>
                <div className="coupon-field">
                  <span className="coupon-field-label">Code</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Tag size={14} color={C.blue} />
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: C.text, fontFamily: 'monospace' }}>
                      {coupon.code}
                    </span>
                  </div>
                </div>
                <div className="coupon-field">
                  <span className="coupon-field-label">Discount</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: C.blue }}>
                    {coupon.discountPercent}%
                  </span>
                </div>
                <div className="coupon-field">
                  <span className="coupon-field-label">Expiry</span>
                  <span style={{ fontSize: '0.8125rem', color: expired ? C.red : C.muted }}>
                    {new Date(coupon.expiresAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="coupon-field">
                  <span className="coupon-field-label">Uses</span>
                  <span style={{ fontSize: '0.8125rem', color: exhausted ? C.red : C.muted }}>
                    {coupon.usedCount} / {coupon.maxUses}
                  </span>
                </div>
                <div className="coupon-field">
                  <span className="coupon-field-label">Status</span>
                  <button
                    onClick={() => handleToggleActive(coupon)}
                    style={{
                      padding: '0.2rem 0.625rem', borderRadius: '980px',
                      fontSize: '0.6875rem', fontWeight: 600, border: 'none',
                      cursor: 'pointer', fontFamily: 'inherit',
                      background: coupon.isActive ? C.greenBg : C.redBg,
                      color: coupon.isActive ? C.green : C.red,
                    }}
                  >
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <div className="coupon-field">
                  <span className="coupon-field-label">Actions</span>
                  <button
                    onClick={() => handleDelete(coupon._id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: C.red, padding: '0.25rem', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
