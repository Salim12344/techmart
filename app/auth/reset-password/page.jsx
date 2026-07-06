// app/auth/reset-password/page.jsx
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  inputBorder: '#d2d2d7', red: '#ff453a', green: '#30d158',
};

const inputStyle = {
  width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
  border: `1px solid ${C.inputBorder}`, background: C.card, color: C.text,
  fontSize: '0.9375rem', fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const focusHandlers = {
  onFocus: e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; },
  onBlur: e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; },
};

export default function ResetPasswordPage() {
  return (<Suspense fallback={<div style={{ minHeight: '100vh', background: '#f5f5f7' }} />}><ResetPasswordContent /></Suspense>);
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const otpTokenId = searchParams.get('token');
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  // Password strength
  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[@$!%*?&]/.test(newPassword),
  };
  const passwordStrong = Object.values(passwordChecks).every(Boolean);

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
      router.push('/auth/forgot-password');
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
      if (!res.ok) { showToast(data.error || 'Unable to resend code right now'); return; }

      setOtp(['', '', '', '', '', '']);
      showToast('New code sent!', 'success');
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
      }, 1000);
    } catch (err) {
      showToast(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) { showToast('Please enter the full 6-digit code'); return; }
    if (!passwordStrong) { showToast('Please meet all password requirements'); return; }
    if (newPassword !== confirmPassword) { showToast('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otpTokenId,
          otp: otpCode,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Password reset failed');
        return;
      }

      showToast(data.message || 'Password reset successful!', 'success');
      router.push('/auth/login');
    } catch (err) {
      showToast(err.message || 'Something went wrong. Please try again.');
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
          <p style={{ color: C.muted, fontSize: '0.9375rem', margin: 0 }}>Reset your password</p>
        </div>

        <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Email display */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(0,113,227,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem' }}>
                🔒
              </div>
              <p style={{ fontSize: '0.9375rem', color: C.muted, margin: 0 }}>
                Enter the 6-digit code sent to<br />
                <strong style={{ color: C.text }}>{email}</strong>
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

            {/* New password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: C.text, marginBottom: '0.5rem' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input style={inputStyle} type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} required {...focusHandlers} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '0.8125rem' }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Password strength */}
              {newPassword && (
                <div style={{ marginTop: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {[
                    { check: passwordChecks.length, label: 'At least 8 characters' },
                    { check: passwordChecks.uppercase, label: 'One uppercase letter' },
                    { check: passwordChecks.number, label: 'One number' },
                    { check: passwordChecks.special, label: 'One special character (@$!%*?&)' },
                  ].map(({ check, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}>
                      <span style={{ color: check ? C.green : C.muted, fontSize: '0.875rem' }}>{check ? '✓' : '○'}</span>
                      <span style={{ color: check ? C.green : C.muted }}>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: C.text, marginBottom: '0.5rem' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inputStyle, borderColor: confirmPassword && newPassword !== confirmPassword ? C.red : C.inputBorder }}
                  type={showConfirm ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = confirmPassword && newPassword !== confirmPassword ? C.red : C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '0.8125rem' }}>
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p style={{ fontSize: '0.75rem', color: C.red, margin: '0.375rem 0 0' }}>Passwords do not match</p>
              )}
            </div>

            <button type="submit" disabled={loading || !passwordStrong || newPassword !== confirmPassword || otp.join('').length !== 6}
              style={{ width: '100%', background: loading || !passwordStrong || newPassword !== confirmPassword || otp.join('').length !== 6 ? C.muted : C.blue, color: '#fff', border: 'none', borderRadius: '980px', padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}>
              {loading ? 'Resetting password...' : 'Reset Password'}
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
