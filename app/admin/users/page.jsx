// app/admin/users/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Failed to load users'); return; }
        setUsers(data.users || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'admin') fetchUsers();
  }, [session]);

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#86868b' }}>
        Loading users...
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '2rem' }}>
      <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: '#0071e3', cursor: 'pointer', fontSize: '0.9375rem', fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
        <ArrowLeft size={16} /> Dashboard
      </button>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#1d1d1f', margin: 0 }}>
          Users
        </h1>
        <p style={{ color: '#86868b', marginTop: '0.25rem', fontSize: '0.9375rem' }}>
          {users.length} registered user{users.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(255,69,58,0.08)',
          border: '1px solid rgba(255,69,58,0.2)',
          borderRadius: '12px',
          padding: '0.875rem 1rem',
          color: '#ff453a',
          fontSize: '0.9375rem',
          marginBottom: '1.5rem',
        }}>
          {error}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: '1px solid #d2d2d7',
            background: '#ffffff',
            color: '#1d1d1f',
            fontSize: '0.9375rem',
            fontFamily: 'inherit',
            outline: 'none',
            maxWidth: '400px',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#0071e3';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#d2d2d7';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Users list */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e8e8ed',
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 100px 80px',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid #e8e8ed',
            background: '#f5f5f7',
          }}>
            {['User', 'Role', 'Orders'].map((h) => (
              <span key={h} style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#86868b',
              }}>
                {h}
              </span>
            ))}
          </div>

          {filteredUsers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#86868b', fontSize: '0.9375rem' }}>
              {searchQuery ? 'No users match your search.' : 'No users yet.'}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                onClick={() => setSelectedUser(selectedUser?._id === user._id ? null : user)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 80px',
                  padding: '0.875rem 1rem',
                  borderBottom: '1px solid #f5f5f7',
                  cursor: 'pointer',
                  background: selectedUser?._id === user._id ? '#f0f6ff' : '#ffffff',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (selectedUser?._id !== user._id) e.currentTarget.style.background = '#f5f5f7';
                }}
                onMouseLeave={(e) => {
                  if (selectedUser?._id !== user._id) e.currentTarget.style.background = '#ffffff';
                }}
              >
                {/* Name + email */}
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#1d1d1f', margin: '0 0 0.125rem' }}>
                    {user.name}
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: '#86868b', margin: 0 }}>
                    {user.email}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#b0b0b5', margin: '0.125rem 0 0' }}>
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Role */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    padding: '0.2rem 0.625rem',
                    borderRadius: '980px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: user.role === 'admin' ? 'rgba(0,113,227,0.1)' : '#f5f5f7',
                    color: user.role === 'admin' ? '#0071e3' : '#86868b',
                  }}>
                    {user.role === 'admin' ? 'Admin' : 'Customer'}
                  </span>
                </div>

                {/* Orders count */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9375rem', color: '#1d1d1f', fontWeight: 500 }}>
                    {user.orders?.length || 0}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div style={{ position: 'sticky', top: '1.5rem' }}>
          {selectedUser ? (
            <div style={{
              background: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e8e8ed',
              padding: '1.5rem',
            }}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#0071e3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {selectedUser.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: '#1d1d1f', margin: 0 }}>
                    {selectedUser.name}
                  </p>
                  <span style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: '980px',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    background: selectedUser.role === 'admin' ? 'rgba(0,113,227,0.1)' : '#f5f5f7',
                    color: selectedUser.role === 'admin' ? '#0071e3' : '#86868b',
                  }}>
                    {selectedUser.role === 'admin' ? 'Admin' : 'Customer'}
                  </span>
                </div>
              </div>

              <DetailSection label="Contact">
                <DetailRow label="Email" value={selectedUser.email} />
                {selectedUser.phone && <DetailRow label="Phone" value={selectedUser.phone} />}
              </DetailSection>

              <DetailSection label="Account">
                <DetailRow label="Email verified" value={selectedUser.emailVerified ? '✓ Yes' : '✗ No'} />
                <DetailRow label="2FA enabled" value={selectedUser.twoFAEnabled ? '✓ Yes' : '✗ No'} />
                <DetailRow label="Joined" value={new Date(selectedUser.createdAt).toLocaleDateString()} />
                <DetailRow
                  label="Last active"
                  value={selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}
                />
              </DetailSection>

              <DetailSection label={`Orders (${selectedUser.orders?.length || 0})`} last>
                {selectedUser.orders && selectedUser.orders.length > 0 ? (
                  selectedUser.orders.map((order) => (
                    <div key={order._id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.625rem',
                      background: '#f5f5f7',
                      borderRadius: '8px',
                      marginBottom: '0.375rem',
                      fontSize: '0.8125rem',
                    }}>
                      <span style={{ color: '#86868b' }}>{order.orderNumber}</span>
                      <span style={{ fontWeight: 600, color: '#1d1d1f' }}>
                        ₦{order.totalAmount?.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.8125rem', color: '#86868b', margin: 0 }}>No orders yet</p>
                )}
              </DetailSection>
            </div>
          ) : (
            <div style={{
              background: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e8e8ed',
              padding: '2rem',
              textAlign: 'center',
              color: '#86868b',
              fontSize: '0.9375rem',
            }}>
              Select a user to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSection({ label, children, last }) {
  return (
    <div style={{
      marginBottom: last ? 0 : '1.25rem',
      paddingBottom: last ? 0 : '1.25rem',
      borderBottom: last ? 'none' : '1px solid #f5f5f7',
    }}>
      <p style={{
        fontSize: '0.6875rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: '#86868b',
        margin: '0 0 0.625rem',
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.375rem',
      fontSize: '0.8125rem',
    }}>
      <span style={{ color: '#86868b' }}>{label}</span>
      <span style={{ color: '#1d1d1f', fontWeight: 500 }}>{value}</span>
    </div>
  );
}
