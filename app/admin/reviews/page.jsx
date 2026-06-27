'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/Toast';
import { ArrowLeft, Star, Trash2 } from 'lucide-react';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  red: '#ff453a', orange: '#ff9f0a',
};

export default function AdminReviewsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const router = useRouter();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (session?.user?.role === 'admin') fetchReviews();
  }, [session]);

  async function fetchReviews() {
    try {
      const res = await fetch('/api/admin/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch {
      showToast('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(reviewId) {
    const reason = prompt('Reason for removing this review (optional):');
    if (reason === null) return; // cancelled

    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || undefined }),
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r._id !== reviewId));
        showToast('Review deleted successfully', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete review', 'error');
      }
    } catch {
      showToast('Failed to delete review', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => router.push('/admin')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '10px',
            background: C.card, border: `1px solid ${C.border}`,
            cursor: 'pointer', color: C.text, flexShrink: 0,
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: C.text, margin: 0, letterSpacing: '-0.03em' }}>
            Reviews
          </h1>
          <p style={{ fontSize: '0.875rem', color: C.muted, margin: '0.25rem 0 0' }}>
            {reviews.length} total review{reviews.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: C.muted }}>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem', background: C.card,
          borderRadius: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <Star size={40} color="#d2d2d7" style={{ marginBottom: '1rem' }} />
          <p style={{ color: C.muted, fontSize: '1rem', margin: 0, fontWeight: 500 }}>No reviews yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {reviews.map((review) => (
            <div
              key={review._id}
              style={{
                background: C.card, borderRadius: '16px', padding: '1.25rem 1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                gap: '1rem', flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Product name */}
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: C.text, marginBottom: '0.25rem' }}>
                    {review.productId?.name || 'Unknown Product'}
                  </div>
                  {/* Customer */}
                  <div style={{ fontSize: '0.8125rem', color: C.muted, marginBottom: '0.5rem' }}>
                    by {review.userId?.name || 'Unknown'} ({review.userId?.email || ''})
                  </div>
                  {/* Stars */}
                  <div style={{ display: 'inline-flex', gap: '2px', alignItems: 'center', marginBottom: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i <= Math.round(review.rating) ? '#ff9f0a' : 'none'}
                        stroke={i <= Math.round(review.rating) ? '#ff9f0a' : '#d2d2d7'}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  {/* Comment preview */}
                  {review.comment && (
                    <p style={{
                      fontSize: '0.875rem', color: C.text, lineHeight: 1.5, margin: '0.25rem 0 0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px',
                    }}>
                      {review.comment}
                    </p>
                  )}
                  {/* Date */}
                  <div style={{ fontSize: '0.75rem', color: C.muted, marginTop: '0.5rem' }}>
                    {new Date(review.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                {/* Delete button */}
                <button
                  onClick={() => handleDelete(review._id)}
                  disabled={deletingId === review._id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.5rem 1rem', borderRadius: '10px',
                    border: `1px solid ${C.red}`, background: 'rgba(255,69,58,0.06)',
                    color: C.red, fontSize: '0.8125rem', fontWeight: 600,
                    cursor: deletingId === review._id ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', opacity: deletingId === review._id ? 0.5 : 1,
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={14} />
                  {deletingId === review._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Responsive */}
      <style>{`
        @media (max-width: 640px) {
          div[style*="maxWidth: '500px'"] {
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
