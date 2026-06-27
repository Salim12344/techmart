'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  red: '#ff453a', green: '#30d158', orange: '#ff9f0a',
  greenBg: 'rgba(48,209,88,0.1)', orangeBg: 'rgba(255,159,10,0.1)',
  redBg: 'rgba(255,69,58,0.08)',
};

const REASON_LABELS = {
  ITEM_NOT_RECEIVED: 'Item Not Received',
  WRONG_ITEM: 'Wrong Item',
  ITEM_DAMAGED: 'Item Damaged',
  CHANGE_OF_MIND: 'Change of Mind',
};

export default function DisputesPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/auth/login');
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    const fetchDisputes = async () => {
      try {
        const res = await fetch('/api/disputes');
        const data = await res.json();
        if (res.ok) setDisputes(data.disputes || []);
        else showToast(data.error || 'Failed to load disputes');
      } catch {
        showToast('Failed to load disputes');
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, [authStatus]);

  if (authStatus === 'loading' || authStatus === 'unauthenticated') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.muted }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        <Link href="/orders" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
          color: C.blue, fontSize: '0.9375rem', fontWeight: 500,
          textDecoration: 'none', marginBottom: '1.5rem',
        }}>
          <ArrowLeft size={18} />
          Back to Orders
        </Link>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: C.text, margin: '0 0 0.25rem' }}>
          My Disputes
        </h1>
        <p style={{ color: C.muted, fontSize: '0.9375rem', margin: '0 0 1.5rem' }}>
          {disputes.length} dispute{disputes.length !== 1 ? 's' : ''}
        </p>

        {loading ? (
          <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, height: '200px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ) : disputes.length === 0 ? (
          <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, padding: '3rem', textAlign: 'center' }}>
            <AlertTriangle size={32} color={C.muted} style={{ marginBottom: '0.75rem' }} />
            <p style={{ color: C.muted, fontSize: '0.9375rem' }}>No disputes found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {disputes.map(d => {
              const statusStyle = d.status === 'OPEN'
                ? { bg: C.orangeBg, color: C.orange }
                : d.status === 'APPROVED'
                ? { bg: C.greenBg, color: C.green }
                : { bg: C.redBg, color: C.red };
              const orderNum = d.orderId?.orderNumber || d.orderNumber || '-';
              const orderId = d.orderId?._id || d.orderId;
              return (
                <Link key={d._id} href={`/orders/${orderId}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
                    padding: '1.25rem 1.5rem', transition: 'box-shadow 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: C.text, margin: 0 }}>
                        Order {orderNum}
                      </p>
                      <span style={{
                        padding: '0.2rem 0.625rem', borderRadius: '980px', fontSize: '0.6875rem',
                        fontWeight: 600, background: statusStyle.bg, color: statusStyle.color,
                      }}>
                        {d.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: C.muted, margin: '0 0 0.25rem' }}>
                      {REASON_LABELS[d.reason] || d.reason}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: C.muted, margin: 0 }}>
                      {new Date(d.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
