// app/auth/register/page.jsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Step 1: form details, Step 2: OTP verification
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // OTP fields
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Password strength
  const passwordChecks = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    number: /\d/.test(form.password),
    special: /[@$!%*?&]/.test(form.password),
  };
  const passwordStrong = Object.values(passwordChecks).every(Boolean);

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Step 1: Send OTP (don't create user yet)
  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) { showToast('Full name is required'); return; }
    if (!form.email.trim()) { showToast('Email is required'); return; }
    if (!form.phone.trim()) { showToast('Phone number is required'); return; }
    if (!passwordStrong) { showToast('Please meet all password requirements'); return; }
    if (form.password !== form.confirmPassword) { showToast('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), purpose: 'SIGNUP_VERIFY' }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to send OTP'); return; }

      setOtpToken(data.otpTokenId);
      setStep(2);
      showToast(`Verification code sent to ${form.email}`, 'success');

      // Start resend cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
      }, 1000);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

// Step 2: Verify OTP then create user
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) { showToast('Please enter the full 6-digit code'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          otp: otpCode,
          otpTokenId: otpToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Registration failed'); return; }

      // Auto sign-in after successful registration
      showToast('Account created! Signing you in...', 'success');
      const signInResult = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push('/');
      } else {
        showToast('Account created! Please sign in.', 'success');
        router.push('/auth/login');
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), purpose: 'SIGNUP_VERIFY' }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to resend OTP'); return; }

      setOtpToken(data.otpTokenId);
      setOtp(['', '', '', '', '', '']);
      showToast('New code sent!', 'success');
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
      }, 1000);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  // OTP input handler — auto-advance and handle backspace
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: C.text, margin: '0 0 0.375rem' }}>
            TechMart
          </h1>
          <p style={{ color: C.muted, fontSize: '0.9375rem', margin: 0 }}>
            {step === 1 ? 'Create your account' : 'Verify your email'}
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step >= s ? C.blue : C.bg, border: `2px solid ${step >= s ? C.blue : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: step >= s ? '#fff' : C.muted }}>
                {step > s ? '✓' : s}
              </div>
              <span style={{ fontSize: '0.8125rem', color: step >= s ? C.text : C.muted, fontWeight: step >= s ? 500 : 400 }}>
                {s === 1 ? 'Details' : 'Verify'}
              </span>
              {s < 2 && <div style={{ width: '40px', height: '2px', background: step > s ? C.blue : C.border }} />}
            </div>
          ))}
        </div>

        <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, padding: '2rem' }}>

          {/* ── STEP 1: Registration form ── */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: C.text, marginBottom: '0.5rem' }}>Full Name</label>
                <input style={inputStyle} type="text" placeholder="John Doe" value={form.name} onChange={e => handleFormChange('name', e.target.value)} required {...focusHandlers} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: C.text, marginBottom: '0.5rem' }}>Email</label>
                <input style={inputStyle} type="email" placeholder="you@example.com" value={form.email} onChange={e => handleFormChange('email', e.target.value)} required {...focusHandlers} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: C.text, marginBottom: '0.5rem' }}>Phone Number</label>
                <input style={inputStyle} type="tel" maxLength={11} placeholder="08012345678" value={form.phone} onChange={e => handleFormChange('phone', e.target.value)} required {...focusHandlers} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: C.text, marginBottom: '0.5rem' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input style={inputStyle} type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => handleFormChange('password', e.target.value)} required {...focusHandlers} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '0.8125rem' }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                {/* Password strength */}
                {form.password && (
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

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: C.text, marginBottom: '0.5rem' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...inputStyle, borderColor: form.confirmPassword && form.password !== form.confirmPassword ? C.red : C.inputBorder }}
                    type={showConfirm ? 'text' : 'password'} placeholder="••••••••" value={form.confirmPassword} onChange={e => handleFormChange('confirmPassword', e.target.value)} required
                    onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = form.confirmPassword && form.password !== form.confirmPassword ? C.red : C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '0.8125rem' }}>
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p style={{ fontSize: '0.75rem', color: C.red, margin: '0.375rem 0 0' }}>Passwords do not match</p>
                )}
              </div>

              <button type="submit" disabled={loading || !passwordStrong || form.password !== form.confirmPassword}
                style={{ width: '100%', background: loading || !passwordStrong || form.password !== form.confirmPassword ? C.muted : C.blue, color: '#fff', border: 'none', borderRadius: '980px', padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: '0.5rem', transition: 'background 0.2s' }}>
                {loading ? 'Sending code...' : 'Continue'}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyAndRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(0,113,227,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem' }}>
                  ✉️
                </div>
                <p style={{ fontSize: '0.9375rem', color: C.muted, margin: 0 }}>
                  We sent a 6-digit code to<br />
                  <strong style={{ color: C.text }}>{form.email}</strong>
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
                {loading ? 'Creating account...' : 'Verify & Create Account'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: C.muted, margin: '0 0 0.5rem' }}>Didn't receive the code?</p>
                <button type="button" onClick={handleResendOTP} disabled={resendCooldown > 0}
                  style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? C.muted : C.blue, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 500, fontFamily: 'inherit' }}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>

              <button type="button" onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', textAlign: 'center' }}>
                ← Back to details
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.9375rem', color: C.muted, marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: C.blue, textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
