'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/Toast';
import { MessageSquare, ArrowLeft, Send, Search, Filter } from 'lucide-react';

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

export default function AdminSupportPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const router = useRouter();
  const messagesEndRef = useRef(null);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reply, setReply] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user?.role === 'admin') fetchTickets();
  }, [session]);

  useEffect(() => {
    if (selectedTicket) {
      setEditStatus(selectedTicket.status);
      setEditPriority(selectedTicket.priority);
      setReply('');
    }
  }, [selectedTicket?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/admin/support');
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to load tickets'); return; }
      setTickets(data.tickets || []);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTicket) return;
    setSaving(true);
    try {
      const body = {};
      if (reply.trim()) body.message = reply;
      if (editStatus !== selectedTicket.status) body.status = editStatus;
      if (editPriority !== selectedTicket.priority) body.priority = editPriority;

      if (!Object.keys(body).length) {
        showToast('No changes to save', 'warning');
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/admin/support/${selectedTicket._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to update ticket'); return; }

      setSelectedTicket(data.ticket);
      setTickets(prev => prev.map(t => t._id === data.ticket._id ? data.ticket : t));
      setReply('');
      showToast('Ticket updated', 'success');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchSearch = !searchQuery ||
      t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: C.muted }}>Loading tickets...</div>;
  }

  return (
    <div style={{ paddingTop: '2rem' }}>
      {/* Back button */}
      <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: C.blue, cursor: 'pointer', fontSize: '0.9375rem', fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
        <ArrowLeft size={16} /> Dashboard
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <MessageSquare size={24} color={C.blue} />
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: C.text, margin: 0 }}>Support</h1>
          <p style={{ color: C.muted, marginTop: '0.25rem', fontSize: '0.9375rem', margin: 0 }}>
            {tickets.length} total ticket{tickets.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {/* Status tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'open', 'in-progress', 'resolved', 'closed'].map(s => {
            const label = s === 'all' ? 'All' : (STATUS_STYLES[s]?.label || s);
            const count = s === 'all' ? tickets.length : tickets.filter(t => t.status === s).length;
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{
                  padding: '0.375rem 0.875rem', borderRadius: '980px', fontSize: '0.8125rem',
                  fontWeight: 500, border: `1px solid ${filterStatus === s ? C.blue : C.border}`,
                  background: filterStatus === s ? C.blue : C.card,
                  color: filterStatus === s ? '#fff' : C.text,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}>
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={16} color={C.muted} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by subject or customer name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '0.65rem 0.875rem 0.65rem 2.25rem', borderRadius: '10px',
              border: `1px solid ${C.inputBorder}`, background: C.card, color: C.text,
              fontSize: '0.9375rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
      </div>

      {/* Main Layout */}
      <div className="admin-support-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Tickets List */}
        <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          {filteredTickets.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: C.muted }}>No tickets found.</div>
          ) : (
            filteredTickets.map(ticket => {
              const isSelected = selectedTicket?._id === ticket._id;
              const ss = STATUS_STYLES[ticket.status] || STATUS_STYLES.open;
              const ps = PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.medium;
              const customerName = ticket.userId?.name || 'Unknown';
              return (
                <div
                  key={ticket._id}
                  onClick={() => setSelectedTicket(isSelected ? null : ticket)}
                  style={{
                    padding: '1rem 1.25rem', borderBottom: `1px solid ${C.bg}`,
                    cursor: 'pointer', background: isSelected ? '#f0f6ff' : C.card,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = C.bg; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = C.card; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                      {ticket.subject}
                    </h3>
                    <span style={{ fontSize: '0.6875rem', color: C.muted, flexShrink: 0 }}>{timeAgo(ticket.updatedAt)}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: C.muted, margin: '0 0 0.5rem' }}>{customerName}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <span style={{ padding: '0.125rem 0.5rem', borderRadius: '980px', fontSize: '0.625rem', fontWeight: 600, background: ss.bg, color: ss.color }}>
                      {ss.label}
                    </span>
                    <span style={{ padding: '0.125rem 0.5rem', borderRadius: '980px', fontSize: '0.625rem', fontWeight: 600, background: ps.bg, color: ps.color }}>
                      {ps.label}
                    </span>
                    <span style={{ padding: '0.125rem 0.5rem', borderRadius: '6px', fontSize: '0.625rem', fontWeight: 500, background: C.bg, color: C.muted }}>
                      {CATEGORIES[ticket.category] || ticket.category}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Panel */}
        <div className="admin-support-detail" style={{ position: 'sticky', top: '1.5rem' }}>
          {selectedTicket ? (
            <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Ticket Header */}
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${C.border}` }}>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: C.text, margin: '0 0 0.25rem' }}>{selectedTicket.subject}</h2>
                <p style={{ fontSize: '0.8125rem', color: C.muted, margin: '0 0 0.75rem' }}>
                  {selectedTicket.userId?.name || 'Unknown'} &middot; {selectedTicket.userId?.email || ''}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: '980px', fontSize: '0.6875rem', fontWeight: 600, background: STATUS_STYLES[selectedTicket.status]?.bg, color: STATUS_STYLES[selectedTicket.status]?.color }}>
                    {STATUS_STYLES[selectedTicket.status]?.label}
                  </span>
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: '980px', fontSize: '0.6875rem', fontWeight: 600, background: PRIORITY_STYLES[selectedTicket.priority]?.bg, color: PRIORITY_STYLES[selectedTicket.priority]?.color }}>
                    {PRIORITY_STYLES[selectedTicket.priority]?.label}
                  </span>
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 500, background: C.bg, color: C.muted }}>
                    {CATEGORIES[selectedTicket.category] || selectedTicket.category}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div style={{ padding: '1rem 1.5rem', maxHeight: '320px', overflowY: 'auto', flex: 1 }}>
                {selectedTicket.messages?.map((msg, i) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div key={i} style={{ marginBottom: i < selectedTicket.messages.length - 1 ? '0.875rem' : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: isUser ? C.blue : C.green }}>
                          {isUser ? (selectedTicket.userId?.name || 'Customer') : 'Admin'}
                        </span>
                        <span style={{ fontSize: '0.625rem', color: C.muted }}>
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div style={{
                        padding: '0.625rem 0.875rem', borderRadius: '10px',
                        background: isUser ? C.bg : C.blueBg,
                        fontSize: '0.8125rem', lineHeight: 1.5, color: C.text,
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Controls */}
              <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Reply */}
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Type a reply..."
                  rows={3}
                  style={{
                    width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px',
                    border: `1px solid ${C.inputBorder}`, background: C.bg, color: C.text,
                    fontSize: '0.8125rem', fontFamily: 'inherit', outline: 'none',
                    resize: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
                />

                {/* Status + Priority */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.muted, marginBottom: '0.25rem' }}>Status</label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value)}
                      style={{
                        width: '100%', padding: '0.5rem 0.625rem', borderRadius: '8px',
                        border: `1px solid ${C.inputBorder}`, background: C.card, color: C.text,
                        fontSize: '0.8125rem', fontFamily: 'inherit', outline: 'none',
                        cursor: 'pointer', boxSizing: 'border-box',
                      }}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.muted, marginBottom: '0.25rem' }}>Priority</label>
                    <select
                      value={editPriority}
                      onChange={e => setEditPriority(e.target.value)}
                      style={{
                        width: '100%', padding: '0.5rem 0.625rem', borderRadius: '8px',
                        border: `1px solid ${C.inputBorder}`, background: C.card, color: C.text,
                        fontSize: '0.8125rem', fontFamily: 'inherit', outline: 'none',
                        cursor: 'pointer', boxSizing: 'border-box',
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    width: '100%', background: saving ? C.muted : C.blue, color: '#fff',
                    border: 'none', borderRadius: '980px', padding: '0.625rem',
                    fontSize: '0.875rem', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', transition: 'background 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  }}
                >
                  <Send size={14} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, padding: '2rem', textAlign: 'center', color: C.muted }}>
              <MessageSquare size={32} color={C.muted} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-support-layout {
            grid-template-columns: 1fr !important;
          }
          .admin-support-detail {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}
