'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Package, Heart, LogOut, ChevronRight, Shield, Pencil, Lock, Check, X, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/app/components/Toast';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  inputBorder: '#d2d2d7', red: '#ff453a', green: '#30d158',
  orange: '#ff9f0a', greenBg: 'rgba(48,209,88,0.1)',
  redBg: 'rgba(255,69,58,0.08)', blueBg: 'rgba(0,113,227,0.08)',
};

const inputStyle = {
  width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
  border: `1.5px solid ${C.inputBorder}`, background: C.card, color: C.text,
  fontSize: '0.9375rem', fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: C.muted,
  marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em',
};

const focusHandlers = {
  onFocus: (e) => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.12)'; },
  onBlur: (e) => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; },
};

export default function AccountPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const passwordChecks = {
    length: passwordForm.newPassword.length >= 8,
    uppercase: /[A-Z]/.test(passwordForm.newPassword),
    number: /\d/.test(passwordForm.newPassword),
    special: /[@$!%*?&]/.test(passwordForm.newPassword),
  };
  const passwordStrong = Object.values(passwordChecks).every(Boolean);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/auth/login?redirect=/account');
      return;
    }
    fetchProfile();
  }, [status, router]);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/account');
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        setProfileForm({ name: data.user.name || '', phone: data.user.phone || '' });
      }
    } catch {}
    finally { setLoading(false); }
  }

  async function handleProfileSave() {
    if (!profileForm.name.trim()) { showToast('Name is required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to update'); return; }
      setProfile(data.user);
      setEditingProfile(false);
      await update({ name: data.user.name });
      showToast('Profile updated', 'success');
    } catch (err) { showToast(err.message); }
    finally { setSaving(false); }
  }

  async function handlePasswordChange() {
    if (!passwordForm.currentPassword) { showToast('Enter your current password'); return; }
    if (!passwordStrong) { showToast('New password doesn\'t meet requirements'); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { showToast('Passwords do not match'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to change password'); return; }
      setChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed successfully', 'success');
    } catch (err) { showToast(err.message); }
    finally { setSaving(false); }
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center', color: C.muted }}>
        Loading...
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  const user = profile || session?.user;
  const initial = user?.name?.[0]?.toUpperCase() || 'U';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <User size={24} style={{ color: C.blue }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: C.text, margin: 0 }}>
          Account
        </h1>
      </div>

      {/* Profile Card */}
      <div style={{
        background: C.card, borderRadius: 20, border: `1px solid ${C.border}`,
        padding: '2rem', marginBottom: '1.5rem',
      }}>
        <div className="account-profile-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: editingProfile ? '1.5rem' : 0 }}>
          <div className="account-profile-info" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: C.blue,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '1.5rem', fontWeight: 700, flexShrink: 0,
            }}>
              {initial}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>
                  {user?.name || 'User'}
                </h2>
                {user?.role === 'admin' && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    padding: '0.2rem 0.625rem', borderRadius: 980,
                    fontSize: '0.6875rem', fontWeight: 600, background: C.blueBg, color: C.blue,
                  }}>
                    <Shield size={12} /> Admin
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.9375rem', color: C.muted, margin: 0 }}>{user?.email}</p>
              {user?.phone && !editingProfile && (
                <p style={{ fontSize: '0.875rem', color: C.muted, margin: '0.25rem 0 0' }}>{user.phone}</p>
              )}
            </div>
          </div>
          {!editingProfile && (
            <button onClick={() => setEditingProfile(true)} style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: 980,
              padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 500,
              color: C.text, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Pencil size={14} /> Edit
            </button>
          )}
        </div>

        {editingProfile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input style={inputStyle} type="text" value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} {...focusHandlers} />
            </div>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input style={inputStyle} type="tel" placeholder="08012345678" value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} {...focusHandlers} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleProfileSave} disabled={saving} style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                background: C.blue, color: '#fff', border: 'none', borderRadius: 980,
                padding: '0.625rem 1.25rem', fontSize: '0.9375rem', fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1,
              }}>
                <Check size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => {
                setEditingProfile(false);
                setProfileForm({ name: profile?.name || '', phone: profile?.phone || '' });
              }} style={{
                background: C.bg, color: C.text, border: `1px solid ${C.border}`,
                borderRadius: 980, padding: '0.625rem 1.25rem', fontSize: '0.9375rem',
                fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Card */}
      <div style={{
        background: C.card, borderRadius: 20, border: `1px solid ${C.border}`,
        padding: '1.5rem 2rem', marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: C.blueBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue, flexShrink: 0,
            }}>
              <Lock size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: C.text, margin: 0 }}>Password</h3>
              <p style={{ fontSize: '0.8125rem', color: C.muted, margin: '0.125rem 0 0' }}>Change your account password</p>
            </div>
          </div>
          {!changingPassword && (
            <button onClick={() => setChangingPassword(true)} style={{
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: 980,
              padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 500,
              color: C.text, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Change
            </button>
          )}
        </div>

        {changingPassword && (
          <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input style={inputStyle} type={showCurrentPw ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  {...focusHandlers} />
                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} style={{
                  position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 0,
                }}>
                  {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input style={inputStyle} type={showNewPw ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  {...focusHandlers} />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)} style={{
                  position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 0,
                }}>
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordForm.newPassword && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {[
                    { check: passwordChecks.length, label: '8+ characters' },
                    { check: passwordChecks.uppercase, label: 'Uppercase letter' },
                    { check: passwordChecks.number, label: 'Number' },
                    { check: passwordChecks.special, label: 'Special character (@$!%*?&)' },
                  ].map(({ check, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}>
                      <span style={{ color: check ? C.green : C.muted }}>{check ? '✓' : '○'}</span>
                      <span style={{ color: check ? C.green : C.muted }}>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input style={{
                ...inputStyle,
                borderColor: passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword ? C.red : C.inputBorder,
              }} type="password" value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                {...focusHandlers} />
              {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p style={{ fontSize: '0.75rem', color: C.red, margin: '0.375rem 0 0' }}>Passwords do not match</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handlePasswordChange} disabled={saving || !passwordStrong || passwordForm.newPassword !== passwordForm.confirmPassword} style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                background: saving || !passwordStrong || passwordForm.newPassword !== passwordForm.confirmPassword ? C.muted : C.blue,
                color: '#fff', border: 'none', borderRadius: 980,
                padding: '0.625rem 1.25rem', fontSize: '0.9375rem', fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
                <Lock size={16} /> {saving ? 'Changing...' : 'Change Password'}
              </button>
              <button onClick={() => {
                setChangingPassword(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }} style={{
                background: C.bg, color: C.text, border: `1px solid ${C.border}`,
                borderRadius: 980, padding: '0.625rem 1.25rem', fontSize: '0.9375rem',
                fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="account-quick-links" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { href: '/orders', icon: <Package size={20} />, color: C.orange, bg: 'rgba(255,159,10,0.1)', title: 'My Orders', sub: 'View order history' },
          { href: '/wishlist', icon: <Heart size={20} />, color: C.red, bg: C.redBg, title: 'Wishlist', sub: 'Items you\'ve saved' },
        ].map((item) => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
              padding: '1.5rem', cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', background: item.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: C.text, margin: '0 0 0.125rem' }}>{item.title}</h3>
                    <p style={{ fontSize: '0.8125rem', color: C.muted, margin: 0 }}>{item.sub}</p>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: C.muted }} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Sign Out */}
      <div style={{
        background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
        padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: C.text, margin: '0 0 0.125rem' }}>Sign Out</h3>
          <p style={{ fontSize: '0.8125rem', color: C.muted, margin: 0 }}>Sign out of your account</p>
        </div>
        <button onClick={() => { if (confirm('Are you sure you want to sign out?')) signOut({ callbackUrl: '/auth/login' }); }} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'transparent', color: C.red, border: `1px solid ${C.red}`,
          borderRadius: 980, padding: '0.625rem 1.25rem', fontSize: '0.9375rem',
          fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .account-quick-links {
            grid-template-columns: 1fr !important;
          }
          .account-profile-header {
            flex-direction: column !important;
            gap: 1rem !important;
          }
          .account-profile-info {
            flex-direction: column !important;
            align-items: flex-start !important;
            text-align: left !important;
          }
        }
      `}</style>
    </div>
  );
}
