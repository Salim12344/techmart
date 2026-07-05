'use client';

import { use, useState, useEffect, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/Toast';
import { ArrowLeft, Send, Clock, User, Shield } from 'lucide-react';

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

const PRIORITY_STYLES = {
  'low': { bg: C.greenBg, color: C.green, label: 'Low' },
  'medium': { bg: C.orangeBg, color: C.orange, label: 'Medium' },
  'high': { bg: C.redBg, color: C.red, label: 'High' },
};

const CATEGORIES = {
  'general': 'General',
  'order-issue': 'Order Issue',
  'payment': 'Payment',
  'account': 'Account',
  'other': 'Other',
};

function SupportTicketContent({ params }) {
  const { id } = use(params);
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const messagesEndRef = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/support/${id}`);
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to load ticket'); return; }
      setTicket(data.ticket);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/login?redirect=/support');
      return;
    }
    if (authStatus === 'authenticated') {
      fetchTicket();
      window.dispatchEvent(new Event('support-read'));
    }
  }, [authStatus]);

  // Poll every 30s
  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    const interval = setInterval(fetchTicket, 30000);
    return () => clearInterval(interval);
  }, [authStatus, id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to send message'); return; }
      setTicket(data.ticket);
      setReply('');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSending(false);
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

  if (!ticket) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem 1rem', textAlign: 'center' }}>
        <p style={{ color: C.muted }}>Ticket not found</p>
        <button onClick={() => router.push('/support')} style={{ background: 'none', border: 'none', color: C.blue, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9375rem' }}>
          Back to Support
        </button>
      </div>
    );
  }

  const ss = STATUS_STYLES[ticket.status] || STATUS_STYLES.open;
  const ps = PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.medium;

  return (
    <div className="support-chat-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)' }}>
      {/* Back button */}
      <button
        onClick={() => router.push('/support')}
        style={{ background: 'none', border: 'none', color: C.blue, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9375rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem' }}
      >
        <ArrowLeft size={16} /> Back to Support
      </button>

      {/* Ticket Header */}
      <div style={{
        background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
        padding: '1.25rem 1.5rem', marginBottom: '1rem',
      }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: C.text, margin: '0 0 0.75rem' }}>
          {ticket.subject}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ padding: '0.2rem 0.625rem', borderRadius: '980px', fontSize: '0.6875rem', fontWeight: 600, background: ss.bg, color: ss.color }}>
            {ss.label}
          </span>
          <span style={{ padding: '0.2rem 0.625rem', borderRadius: '980px', fontSize: '0.6875rem', fontWeight: 600, background: C.bg, color: C.muted }}>
            {CATEGORIES[ticket.category] || ticket.category}
          </span>
          <span style={{ padding: '0.2rem 0.625rem', borderRadius: '980px', fontSize: '0.6875rem', fontWeight: 600, background: ps.bg, color: ps.color }}>
            {ps.label} Priority
          </span>
        </div>
      </div>

      {/* Messages Thread */}
      <div style={{
        background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
        padding: '1.5rem', flex: 1, overflowY: 'auto', marginBottom: '1rem',
        maxHeight: '500px', minHeight: '200px',
      }}>
        {ticket.messages?.map((msg, i) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={i}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                marginBottom: i < ticket.messages.length - 1 ? '1rem' : 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                {isUser ? <User size={12} color={C.blue} /> : <Shield size={12} color={C.green} />}
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: isUser ? C.blue : C.green }}>
                  {isUser ? 'You' : 'Support Team'}
                </span>
              </div>
              <div style={{
                maxWidth: '75%', padding: '0.75rem 1rem', borderRadius: '14px',
                background: isUser ? C.blue : C.bg,
                color: isUser ? '#fff' : C.text,
                fontSize: '0.875rem', lineHeight: 1.5,
                borderBottomRightRadius: isUser ? '4px' : '14px',
                borderBottomLeftRadius: isUser ? '14px' : '4px',
              }}>
                {msg.text}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                <Clock size={10} color={C.muted} />
                <span style={{ fontSize: '0.625rem', color: C.muted }}>
                  {new Date(msg.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Form */}
      {ticket.status !== 'closed' ? (
        <form
          onSubmit={handleSend}
          style={{
            background: C.card, borderRadius: '14px', border: `1px solid ${C.border}`,
            padding: '0.75rem', display: 'flex', alignItems: 'flex-end', gap: '0.75rem',
          }}
        >
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Type your reply..."
            rows={2}
            style={{
              flex: 1, padding: '0.5rem 0.75rem', borderRadius: '10px',
              border: `1px solid ${C.inputBorder}`, background: C.bg, color: C.text,
              fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none',
              resize: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
          />
          <button
            type="submit"
            disabled={sending || !reply.trim()}
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: (sending || !reply.trim()) ? C.bg : C.blue,
              color: (sending || !reply.trim()) ? C.muted : '#fff',
              border: 'none', cursor: (sending || !reply.trim()) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.2s',
            }}
          >
            <Send size={18} />
          </button>
        </form>
      ) : (
        <div style={{
          background: C.card, borderRadius: '14px', border: `1px solid ${C.border}`,
          padding: '1rem', textAlign: 'center', color: C.muted, fontSize: '0.875rem',
        }}>
          This ticket has been closed.
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .support-chat-page { padding: 1.5rem 0.75rem !important; }
          .support-chat-page h1 { font-size: 1.125rem !important; }
        }
      `}</style>
    </div>
  );
}

export default function SupportTicketPage({ params }) {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center', color: '#86868b' }}>Loading...</div>}>
      <SupportTicketContent params={params} />
    </Suspense>
  );
}
