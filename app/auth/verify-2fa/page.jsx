// app/auth/verify-2fa/page.jsx
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  inputBorder: '#d2d2d7',
};

export default function Verify2faPage() {
  return (<Suspense fallback={<div style={{ minHeight: '100vh', background: '#f5f5f7' }} />}><Verify2faContent /></Suspense>);
}

function Verify2faContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const otpTokenId = searchParams.get('token');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  // Start resend cooldown on mount
  useEffect(() => {
    const interval = setInterval(() => {
      setResendCooldown(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Redirect if missing params
  useEffect(() => {
    if (!otpTokenId) {
      router.push('/auth/login');
    }
  }, [otpTokenId, router]);

  // OTP handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    paste.split('').forEach((char, i) => { if (i < 6) newOtp[i] = char; });
    setOtp(newOtp);
    document.getElementById(`otp-${Math.min(paste.length, 5)}`)?.focus();
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpTokenId }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to resend code'); return; }

      setOtp(['', '', '', '', '', '']);
      showToast('New code sent!', 'success');
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
      }, 1000);
    } catch (err) {
      showToast(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) { showToast('Please enter the full 6-digit code'); return; }

    setLoading(true);
    try {
      // Verify the 2FA code
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpTokenId, otp: otpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || '2FA verification failed');
        return;
      }

      // Sign in the user using next-auth
      const signInResult = await signIn('credentials', {
        email: data.user.email,
        twoFactorToken: otpTokenId,
        redirect: false,
      });

      if (signInResult?.ok) {
        showToast('Signed in successfully!', 'success');

        // Check if admin
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();

        if (session?.user?.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
      } else {
        showToast(signInResult?.error || 'Sign in failed after 2FA');
        router.push('/auth/login');
      }
    } catch (err) {
      showToast(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!otpTokenId) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: C.text, margin: '0 0 0.375rem' }}>TechMart</h1>
          <p style={{ color: C.muted, fontSize: '0.9375rem', margin: 0 }}>Two-factor authentication</p>
        </div>

        <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Icon and description */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(0,113,227,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem' }}>
                🔐
              </div>
              <p style={{ fontSize: '0.9375rem', color: C.muted, margin: 0, lineHeight: 1.5 }}>
                Enter the 6-digit verification code sent to your email to complete sign in.
              </p>
            </div>

            {/* OTP inputs */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  style={{ width: '48px', height: '56px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 700, borderRadius: '12px', border: `2px solid ${digit ? C.blue : C.inputBorder}`, background: C.card, color: C.text, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                  onFocus={e => e.currentTarget.style.borderColor = C.blue}
                  onBlur={e => e.currentTarget.style.borderColor = otp[i] ? C.blue : C.inputBorder}
                />
              ))}
            </div>

            <button type="submit" disabled={loading || otp.join('').length !== 6}
              style={{ width: '100%', background: loading || otp.join('').length !== 6 ? C.muted : C.blue, color: '#fff', border: 'none', borderRadius: '980px', padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}>
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>

            {/* Resend code */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: C.muted, margin: '0 0 0.5rem' }}>Didn't receive the code?</p>
              <button type="button" onClick={handleResendOTP} disabled={resendCooldown > 0}
                style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? C.muted : C.blue, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 500, fontFamily: 'inherit' }}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.9375rem', color: C.muted, marginTop: '1.5rem' }}>
          Back to{' '}
          <Link href="/auth/login" style={{ color: C.blue, textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
