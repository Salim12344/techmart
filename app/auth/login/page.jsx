// app/auth/login/page.jsx
'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  inputBorder: '#d2d2d7',
};

const inputStyle = {
  width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
  border: `1px solid ${C.inputBorder}`, background: C.card, color: C.text,
  fontSize: '0.9375rem', fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

export default function LoginPage() {
  return (<Suspense fallback={<div style={{ minHeight: '100vh', background: '#f5f5f7' }} />}><LoginContent /></Suspense>);
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        showToast(result?.error || 'Incorrect email or password');
        setLoading(false);
        return;
      }

      let session = null;
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 400));
        const res = await fetch('/api/auth/session');
        session = await res.json();
        if (session?.user?.role) break;
      }

      if (session?.user?.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = redirectTo.startsWith('/admin') ? '/' : redirectTo;
      }
    } catch (err) {
      showToast(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: C.text, margin: '0 0 0.375rem' }}>TechMart</h1>
          <p style={{ color: C.muted, fontSize: '0.9375rem', margin: 0 }}>Sign in to your account</p>
        </div>

        <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: C.text, marginBottom: '0.5rem' }}>Email</label>
              <input style={inputStyle} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required
                onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: C.text }}>Password</label>
                <Link href="/auth/forgot-password" style={{ fontSize: '0.8125rem', color: C.blue, textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <input style={inputStyle} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
                onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }} />
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', background: loading ? C.muted : C.blue, color: '#fff', border: 'none', borderRadius: '980px', padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: '0.5rem' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: C.border }} />
            <span style={{ fontSize: '0.8125rem', color: C.muted }}>or</span>
            <div style={{ flex: 1, height: '1px', background: C.border }} />
          </div>

          <button onClick={() => signIn('google', { callbackUrl: redirectTo })}
            style={{ width: '100%', background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: '980px', padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem' }}
            onMouseEnter={e => e.currentTarget.style.background = C.bg}
            onMouseLeave={e => e.currentTarget.style.background = C.card}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.9375rem', color: C.muted, marginTop: '1.5rem' }}>
          Don't have an account?{' '}
          <Link href="/auth/register" style={{ color: C.blue, textDecoration: 'none', fontWeight: 500 }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
