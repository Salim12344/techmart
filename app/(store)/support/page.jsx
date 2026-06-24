'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/Toast';
import { MessageSquare, Plus, ChevronRight, Clock } from 'lucide-react';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  inputBorder: '#d2d2d7', red: '#ff453a', green: '#30d158',
  orange: '#ff9f0a', greenBg: 'rgba(48,209,88,0.1)',
  orangeBg: 'rgba(255,159,10,0.1)', redBg: 'rgba(255,69,58,0.08)',
  blueBg: 'rgba(0,113,227,0.08)',
};

const STATUS_STYLES = {
  'open': { bg: C.blueBg, color: C.blue, label: 'Open' },
  'in-progress': { bg: C.orangeBg, color: C.orange, label: 'In Progress' },
  'resolved': { bg: C.greenBg, color: C.green, label: 'Resolved' },
  'closed': { bg: C.redBg, color: C.red, label: 'Closed' },
};

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'order-issue', label: 'Order Issue' },
  { value: 'payment', label: 'Payment' },
  { value: 'account', label: 'Account' },
  { value: 'other', label: 'Other' },
];

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function SupportContent() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'general', message: '' });

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/login?redirect=/support');
      return;
    }
    if (authStatus === 'authenticated') fetchTickets();
  }, [authStatus]);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support');
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to load tickets'); return; }
      setTickets(data.tickets || []);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      showToast('Subject and message are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to create ticket'); return; }
      showToast('Ticket created successfully', 'success');
      setForm({ subject: '', category: 'general', message: '' });
      setShowForm(false);
      fetchTickets();
    } catch (err) {
      showToast(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: C.muted }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #e8e8ed', borderTopColor: '#0071e3', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="support-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: C.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={22} color={C.blue} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: C.text, margin: 0 }}>Support</h1>
            <p style={{ color: C.muted, fontSize: '0.875rem', margin: 0 }}>Get help with your orders and account</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.625rem 1.25rem', borderRadius: '980px',
            background: showForm ? C.bg : C.blue, color: showForm ? C.text : '#fff',
            border: showForm ? `1px solid ${C.border}` : 'none',
            fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        >
          <Plus size={16} style={{ transform: showForm ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
          {showForm ? 'Cancel' : 'New Ticket'}
        </button>
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <div style={{
          background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
          padding: '1.5rem', marginBottom: '1.5rem',
          animation: 'fadeSlideIn 0.25s ease forwards',
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: C.text, margin: '0 0 1.25rem' }}>Create New Ticket</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: C.text, marginBottom: '0.375rem' }}>Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                placeholder="Brief description of your issue"
                style={{
                  width: '100%', padding: '0.65rem 0.875rem', borderRadius: '10px',
                  border: `1px solid ${C.inputBorder}`, background: C.card, color: C.text,
                  fontSize: '0.9375rem', fontFamily: 'inherit', outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: C.text, marginBottom: '0.375rem' }}>Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                style={{
                  width: '100%', padding: '0.65rem 0.875rem', borderRadius: '10px',
                  border: `1px solid ${C.inputBorder}`, background: C.card, color: C.text,
                  fontSize: '0.9375rem', fontFamily: 'inherit', outline: 'none',
                  boxSizing: 'border-box', cursor: 'pointer',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: C.text, marginBottom: '0.375rem' }}>Message</label>
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Describe your issue in detail..."
                rows={4}
                style={{
                  width: '100%', padding: '0.65rem 0.875rem', borderRadius: '10px',
                  border: `1px solid ${C.inputBorder}`, background: C.card, color: C.text,
                  fontSize: '0.9375rem', fontFamily: 'inherit', outline: 'none',
                  resize: 'vertical', boxSizing: 'border-box',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                alignSelf: 'flex-end', padding: '0.625rem 1.5rem', borderRadius: '980px',
                background: submitting ? C.muted : C.blue, color: '#fff', border: 'none',
                fontSize: '0.875rem', fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'background 0.2s',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </div>
      )}

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div style={{
          background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
          padding: '3rem', textAlign: 'center',
        }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <MessageSquare size={28} color={C.muted} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: C.text, margin: '0 0 0.5rem' }}>No tickets yet</h3>
          <p style={{ color: C.muted, fontSize: '0.875rem', margin: 0, maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
            When you need help, create a support ticket and our team will get back to you as soon as possible.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tickets.map(ticket => {
            const ss = STATUS_STYLES[ticket.status] || STATUS_STYLES.open;
            const lastMsg = ticket.messages?.[ticket.messages.length - 1];
            const catLabel = CATEGORIES.find(c => c.value === ticket.category)?.label || ticket.category;
            return (
              <div
                key={ticket._id}
                onClick={() => router.push(`/support/${ticket._id}`)}
                style={{
                  background: C.card, borderRadius: '14px', border: `1px solid ${C.border}`,
                  padding: '1.125rem 1.25rem', cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ticket.subject}
                    </h3>
                    <span style={{
                      padding: '0.125rem 0.5rem', borderRadius: '980px', fontSize: '0.6875rem',
                      fontWeight: 600, background: ss.bg, color: ss.color, flexShrink: 0,
                    }}>
                      {ss.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: C.muted, background: C.bg, padding: '0.125rem 0.5rem', borderRadius: '6px' }}>
                      {catLabel}
                    </span>
                    {lastMsg && (
                      <p style={{ fontSize: '0.8125rem', color: C.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                        {lastMsg.sender === 'admin' ? 'Admin: ' : ''}{lastMsg.text}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.375rem' }}>
                    <Clock size={12} color={C.muted} />
                    <span style={{ fontSize: '0.75rem', color: C.muted }}>{timeAgo(ticket.updatedAt)}</span>
                  </div>
                </div>
                <ChevronRight size={18} color={C.muted} style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .support-page { padding: 1.5rem 0.75rem !important; }
          .support-page h1 { font-size: 1.5rem !important; }
        }
      `}</style>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center', color: '#86868b' }}>Loading...</div>}>
      <SupportContent />
    </Suspense>
  );
}
