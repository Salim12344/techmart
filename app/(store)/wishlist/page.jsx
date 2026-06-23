// app/(store)/wishlist/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Trash2, ShoppingCart, Eye } from 'lucide-react';
import { useToast } from '@/app/components/Toast';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  inputBorder: '#d2d2d7', red: '#ff453a', green: '#30d158',
  orange: '#ff9f0a', greenBg: 'rgba(48,209,88,0.1)',
  orangeBg: 'rgba(255,159,10,0.1)', redBg: 'rgba(255,69,58,0.08)',
  blueBg: 'rgba(0,113,227,0.08)',
};

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/auth/login?redirect=/wishlist');
      return;
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const fetchWishlist = async () => {
      try {
        const res = await fetch('/api/wishlist');
        const data = await res.json();
        if (res.ok) {
          setWishlist(data.wishlist || []);
        } else {
          showToast(data.error || 'Failed to load wishlist');
        }
      } catch (err) {
        showToast(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [status]);

  const handleRemove = async (productId) => {
    if (!confirm('Remove this item from your wishlist?')) return;
    setRemovingId(productId);
    try {
      const res = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (res.ok) {
        setWishlist(prev => prev.filter(p => p._id !== productId));
        showToast('Removed from wishlist', 'success');
      } else {
        showToast(data.error || 'Failed to remove item');
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = (product) => {
    const inStockVariant = product.variants?.find(v => v.stock > 0);
    if (!inStockVariant) {
      showToast('No variants in stock');
      return;
    }

    const cartItem = {
      productId: product._id,
      name: product.name,
      color: inStockVariant.color,
      storage: inStockVariant.storage,
      sku: inStockVariant.sku,
      price: inStockVariant.price,
      quantity: 1,
      image: product.image,
    };

    const existing = JSON.parse(localStorage.getItem('techmart-cart') || '[]');
    const existingIndex = existing.findIndex(item => item.sku === cartItem.sku);
    if (existingIndex >= 0) {
      existing[existingIndex].quantity += 1;
    } else {
      existing.push(cartItem);
    }
    localStorage.setItem('techmart-cart', JSON.stringify(existing));
    window.dispatchEvent(new Event('cart-updated'));
    showToast('Added to cart', 'success');
  };

  const getStartingPrice = (product) => {
    if (!product.variants || product.variants.length === 0) return null;
    const prices = product.variants.map(v => v.price).filter(p => p > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ width: '200px', height: '32px', background: '#e8e8ed', borderRadius: '8px', marginBottom: '0.5rem' }} />
          <div style={{ width: '120px', height: '18px', background: '#e8e8ed', borderRadius: '6px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              background: C.card,
              borderRadius: '20px',
              overflow: 'hidden',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}>
              <div style={{ aspectRatio: '1', background: '#f0f0f3' }} />
              <div style={{ padding: '1.25rem' }}>
                <div style={{ width: '70%', height: '16px', background: '#e8e8ed', borderRadius: '6px', marginBottom: '0.75rem' }} />
                <div style={{ width: '40%', height: '14px', background: '#e8e8ed', borderRadius: '6px', marginBottom: '1rem' }} />
                <div style={{ width: '50%', height: '20px', background: '#e8e8ed', borderRadius: '6px' }} />
              </div>
            </div>
          ))}
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <Heart size={24} style={{ color: C.red }} />
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: C.text, margin: 0 }}>
            Wishlist
          </h1>
        </div>
        <p style={{ color: C.muted, fontSize: '0.9375rem', margin: 0 }}>
          {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      {/* Empty state */}
      {wishlist.length === 0 && (
        <div style={{
          background: C.card,
          borderRadius: '20px',
          border: `1px solid ${C.border}`,
          padding: '4rem 2rem',
          textAlign: 'center',
        }}>
          <Heart size={48} style={{ color: C.muted, marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: C.text, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
            Your wishlist is empty
          </h2>
          <p style={{ color: C.muted, fontSize: '0.9375rem', margin: '0 0 1.5rem' }}>
            Browse products to add items you love
          </p>
          <Link href="/products" style={{
            display: 'inline-block',
            background: C.blue,
            color: '#fff',
            borderRadius: '980px',
            padding: '0.75rem 1.75rem',
            fontSize: '0.9375rem',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'background 0.2s',
          }}>
            Explore Products
          </Link>
        </div>
      )}

      {/* Product grid */}
      {wishlist.length > 0 && (
        <div className="wishlist-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}>
          {wishlist.map(product => {
            const startingPrice = getStartingPrice(product);
            const hasStock = product.variants?.some(v => v.stock > 0);
            return (
              <div
                key={product._id}
                style={{
                  background: C.card,
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
                }}
              >
                {/* Image */}
                <div style={{
                  aspectRatio: '1',
                  background: '#fafafa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      style={{ objectFit: 'contain', padding: '1.5rem' }}
                    />
                  ) : (
                    <div style={{ color: C.muted, fontSize: '3rem' }}>
                      <Heart size={48} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '1.25rem' }}>
                  {/* Category badge */}
                  {product.category && (
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.625rem',
                      borderRadius: '980px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      background: C.blueBg,
                      color: C.blue,
                      marginBottom: '0.5rem',
                      letterSpacing: '0.02em',
                    }}>
                      {product.category}
                    </span>
                  )}

                  {/* Product name */}
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: C.text,
                    margin: '0 0 0.5rem',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.3,
                  }}>
                    {product.name}
                  </h3>

                  {/* Starting price */}
                  {startingPrice && (
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: C.text,
                      margin: '0 0 1rem',
                      letterSpacing: '-0.02em',
                    }}>
                      From {'₦'}{startingPrice.toLocaleString()}
                    </p>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Add to Cart */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={!hasStock}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        background: hasStock ? C.blue : C.muted,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '980px',
                        padding: '0.65rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: hasStock ? 'pointer' : 'not-allowed',
                        fontFamily: 'inherit',
                        transition: 'background 0.2s',
                      }}
                    >
                      <ShoppingCart size={16} />
                      {hasStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>

                    {/* Bottom row: View + Remove */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link href={`/products/${product._id}`} style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem',
                        background: C.bg,
                        color: C.text,
                        border: `1px solid ${C.border}`,
                        borderRadius: '980px',
                        padding: '0.55rem 0.75rem',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        textDecoration: 'none',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.2s',
                      }}>
                        <Eye size={14} />
                        View Product
                      </Link>
                      <button
                        onClick={() => handleRemove(product._id)}
                        disabled={removingId === product._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.375rem',
                          background: C.redBg,
                          color: C.red,
                          border: 'none',
                          borderRadius: '980px',
                          padding: '0.55rem 0.75rem',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          cursor: removingId === product._id ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit',
                          transition: 'background 0.2s',
                        }}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .wishlist-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }
        }
        @media (max-width: 420px) {
          .wishlist-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
