'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/Toast';
import { MessageSquare, Plus, ChevronRight, Clock, Phone } from 'lucide-react';

const SUPPORT_PHONE = '+2348001234567';
const SUPPORT_PHONE_DISPLAY = '+234 800 123 4567';

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
      if (!res.ok) { showToast(data.error || 'Unable to load tickets right now'); return; }
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
        body: JSON.stringify({ ...form, subject: form.subject.trim(), message: form.message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Unable to create ticket right now'); return; }
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
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ width: '200px', height: '28px', background: '#e8e8ed', borderRadius: '8px', marginBottom: '0.5rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ width: '140px', height: '16px', background: '#e8e8ed', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.1s' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              background: '#ffffff', borderRadius: '14px', padding: '1.125rem 1.25rem',
              border: '1px solid #e8e8ed',
            }}>
              <div style={{ height: 16, width: '60%', background: '#e8e8ed', borderRadius: 8, marginBottom: '0.75rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 12, width: '40%', background: '#e8e8ed', borderRadius: 8, marginBottom: '0.5rem', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.1s' }} />
              <div style={{ height: 10, width: '25%', background: '#e8e8ed', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }} />
            </div>
          ))}
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
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

      {/* Call Us */}
      <a
        href={`tel:${SUPPORT_PHONE}`}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', padding: '1.25rem 1.5rem', borderRadius: '18px',
          background: C.card, border: `1px solid ${C.border}`,
          marginBottom: '1.5rem', textDecoration: 'none',
          transition: 'box-shadow 0.2s',
        }}
        className="support-call-card"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px',
            background: C.greenBg, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <Phone size={20} color={C.green} />
          </div>
          <div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: C.text, margin: 0 }}>
              Prefer to talk? Call us
            </p>
            <p style={{ fontSize: '0.8125rem', color: C.muted, margin: '0.125rem 0 0' }}>
              {SUPPORT_PHONE_DISPLAY} &middot; Mon-Sat, 9am-6pm
            </p>
          </div>
        </div>
        <ChevronRight size={18} color={C.muted} />
      </a>

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
          textAlign: 'center', padding: '4rem 1.5rem',
          background: C.card, borderRadius: 20,
          border: `1px solid ${C.border}`,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(0,113,227,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <MessageSquare size={28} color="#0071e3" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: C.text, margin: '0 0 0.5rem' }}>
            No tickets yet
          </h3>
          <p style={{ color: C.muted, fontSize: '0.9375rem', margin: '0 0 1.5rem', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
            When you need help, create a support ticket and our team will get back to you as soon as possible.
          </p>
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', background: C.blue, color: '#fff',
              borderRadius: '980px', fontSize: '0.9375rem', fontWeight: 500,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Plus size={16} /> Create a Ticket
          </button>
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
        .support-call-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
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
    <Suspense fallback={
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ width: '200px', height: '28px', background: '#e8e8ed', borderRadius: '8px', marginBottom: '0.5rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ width: '140px', height: '16px', background: '#e8e8ed', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ background: '#ffffff', borderRadius: '14px', padding: '1.125rem 1.25rem', border: '1px solid #e8e8ed', marginBottom: '0.75rem' }}>
            <div style={{ height: 16, width: '60%', background: '#e8e8ed', borderRadius: 8, marginBottom: '0.75rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: 12, width: '40%', background: '#e8e8ed', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        ))}
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>
    }>
      <SupportContent />
    </Suspense>
  );
}
