'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, AlertCircle } from 'lucide-react';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  green: '#30d158', red: '#ff453a',
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <p style={{ color: C.muted }}>Loading...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference');
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!reference) {
      router.replace('/');
      return;
    }

    localStorage.removeItem('techmart-cart');
    window.dispatchEvent(new Event('cart-updated'));

    async function verifyPayment() {
      try {
        const res = await fetch(`/api/checkout/verify?reference=${reference}`);
        const data = await res.json();
        setVerified(data.verified === true);
      } catch {
        setVerified(false);
      } finally {
        setVerifying(false);
      }
    }

    verifyPayment();
  }, [reference, router]);

  if (!reference) return null;

  if (verifying) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.blue,
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem',
          }} />
          <p style={{ color: C.muted, fontSize: '0.9375rem', margin: 0 }}>Verifying your payment...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '80vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '2rem 1.5rem', background: C.bg,
    }}>
      <div style={{
        width: '100%', maxWidth: 520, textAlign: 'center',
        animation: 'fadeInUp 0.6s ease-out forwards',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: verified ? 'rgba(48,209,88,0.1)' : 'rgba(255,69,58,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
          animation: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
        }}>
          {verified
            ? <CheckCircle size={40} color={C.green} strokeWidth={1.5} />
            : <AlertCircle size={40} color={C.red} strokeWidth={1.5} />
          }
        </div>

        <h1 style={{
          fontSize: '2rem', fontWeight: 700, color: C.text,
          letterSpacing: '-0.03em', margin: '0 0 0.75rem',
        }}>
          {verified ? 'Order Confirmed' : 'Payment Pending'}
        </h1>

        <p style={{
          fontSize: '1.0625rem', color: C.muted, margin: '0 0 2.5rem',
          lineHeight: 1.5, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto',
        }}>
          {verified
            ? 'Thank you for your purchase. You\'ll receive a confirmation email shortly with your order details.'
            : 'Your payment is being processed. If it was successful, your order will be confirmed shortly.'
          }
        </p>

        <div style={{
          background: C.card, borderRadius: 20, padding: '1.5rem',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '2rem',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            justifyContent: 'center', marginBottom: '1rem',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(0,113,227,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Package size={20} color={C.blue} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: C.text, margin: 0 }}>
                {verified ? 'What happens next?' : 'Order Reference'}
              </p>
              <p style={{ fontSize: '0.8125rem', color: C.muted, margin: 0 }}>
                {verified ? 'We\'ll prepare your order for shipping' : reference}
              </p>
            </div>
          </div>

          {verified && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              {['Confirmed', 'Preparing', 'Shipped', 'Delivered'].map((step, i) => (
                <div key={step} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: i === 0 ? C.green : C.border,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 0.375rem',
                    fontSize: '0.625rem', fontWeight: 700,
                    color: i === 0 ? '#fff' : C.muted,
                  }}>
                    {i === 0 ? '✓' : i + 1}
                  </div>
                  <span style={{
                    fontSize: '0.6875rem', color: i === 0 ? C.green : C.muted,
                    fontWeight: i === 0 ? 600 : 400,
                  }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/orders" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.875rem 1.75rem', background: C.blue, color: '#fff',
            borderRadius: 980, fontSize: '0.9375rem', fontWeight: 500,
            textDecoration: 'none',
          }}>
            View Orders
          </Link>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.875rem 1.75rem',
            background: 'rgba(0,0,0,0.04)', color: C.text,
            borderRadius: 980, fontSize: '0.9375rem', fontWeight: 500,
            textDecoration: 'none',
          }}>
            Continue Shopping <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
