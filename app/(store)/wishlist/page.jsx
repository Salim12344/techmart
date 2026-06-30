// app/(store)/wishlist/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Trash2, ShoppingCart, Eye, X, Package, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useToast } from '@/app/components/Toast';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  inputBorder: '#d2d2d7', red: '#ff453a', green: '#30d158',
  orange: '#ff9f0a', greenBg: 'rgba(48,209,88,0.1)',
  orangeBg: 'rgba(255,159,10,0.1)', redBg: 'rgba(255,69,58,0.08)',
  blueBg: 'rgba(0,113,227,0.08)',
};

const LOW_STOCK_THRESHOLD = 5;
const CART_KEY = 'techmart-cart';

function formatPrice(price) {
  return new Intl.NumberFormat('en-NG').format(price);
}

function addVariantToCart({ product, variant, color, storage, quantity, toast }) {
  const cartItem = {
    productId: product._id,
    name: product.name,
    color: color || '',
    storage: storage || '',
    sku: variant.sku || '',
    price: variant.price,
    quantity,
    image: product.image || '',
  };

  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    cart = [];
  }

  const existingIdx = cart.findIndex((c) => c.sku === cartItem.sku);
  if (existingIdx > -1) {
    const newQty = cart[existingIdx].quantity + quantity;
    if (newQty > variant.stock) {
      if (cart[existingIdx].quantity >= variant.stock) {
        toast(`Only ${variant.stock} in stock`, 'error');
        return;
      }
      cart[existingIdx].quantity = variant.stock;
    } else {
      cart[existingIdx].quantity = newQty;
    }
  } else {
    cartItem.quantity = Math.min(quantity, variant.stock);
    cart.push(cartItem);
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cart-updated'));
  toast(`${quantity} × ${product.name} added to cart`, 'success');
}

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [quickAddProduct, setQuickAddProduct] = useState(null);
  const [quickAddColor, setQuickAddColor] = useState(null);
  const [quickAddStorage, setQuickAddStorage] = useState(null);
  const [quickAddQuantity, setQuickAddQuantity] = useState(1);

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
    const hasMultipleColors = (product.colors?.length || 0) > 1;
    const hasMultipleStorage = (product.storageOptions?.length || 0) > 1;

    if (hasMultipleColors || hasMultipleStorage) {
      setQuickAddProduct(product);
      setQuickAddColor(product.colors?.[0]?.name || null);
      setQuickAddStorage(product.storageOptions?.[0] || null);
      setQuickAddQuantity(1);
      return;
    }

    const variant = product.variants?.find(v => v.stock > 0) || product.variants?.[0];
    if (!variant) {
      showToast('No variants available for this product', 'error');
      return;
    }
    addVariantToCart({
      product,
      variant,
      color: variant.color,
      storage: variant.storage,
      quantity: 1,
      toast: showToast,
    });
  };

  function closeQuickAdd() {
    setQuickAddProduct(null);
    setQuickAddColor(null);
    setQuickAddStorage(null);
    setQuickAddQuantity(1);
  }

  const quickAddVariant = quickAddProduct?.variants?.find(
    (v) => v.color === quickAddColor && v.storage === quickAddStorage
  ) || null;

  const quickAddStockStatus = (() => {
    if (!quickAddVariant) return { label: 'Unavailable', color: C.muted, bg: '#f0f0f0', dot: C.muted };
    if (quickAddVariant.stock === 0)
      return { label: 'Out of Stock', color: C.red, bg: C.redBg, dot: C.red };
    if (quickAddVariant.stock <= LOW_STOCK_THRESHOLD)
      return { label: `Low Stock (${quickAddVariant.stock} left)`, color: C.orange, bg: C.orangeBg, dot: C.orange };
    return { label: `In Stock (${quickAddVariant.stock} available)`, color: C.green, bg: C.greenBg, dot: C.green };
  })();

  function handleQuickAddSubmit() {
    if (!quickAddProduct || !quickAddVariant || quickAddVariant.stock === 0) return;
    addVariantToCart({
      product: quickAddProduct,
      variant: quickAddVariant,
      color: quickAddColor,
      storage: quickAddStorage,
      quantity: quickAddQuantity,
      toast: showToast,
    });
    closeQuickAdd();
  }

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

      {/* Quick Add Modal */}
      {quickAddProduct && (
        <div
          onClick={closeQuickAdd}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.card,
              borderRadius: '24px',
              width: '100%',
              maxWidth: '420px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'modalPop 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)',
              padding: '1.75rem',
              boxSizing: 'border-box',
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeQuickAdd}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: C.muted,
                padding: 0,
                zIndex: 1,
              }}
            >
              <X size={16} />
            </button>

            {/* Image + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingRight: '2rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '14px',
                  background: '#fafafa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {quickAddProduct.image ? (
                  <Image
                    src={quickAddProduct.image}
                    alt={quickAddProduct.name}
                    width={64}
                    height={64}
                    style={{ objectFit: 'contain', width: '100%', height: '100%', padding: '0.375rem' }}
                  />
                ) : (
                  <Package size={28} color="#d2d2d7" />
                )}
              </div>
              <h3
                style={{
                  fontSize: '1.0625rem',
                  fontWeight: 700,
                  color: C.text,
                  margin: 0,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.3,
                }}
              >
                {quickAddProduct.name}
              </h3>
            </div>

            {/* Color Selector */}
            {quickAddProduct.colors?.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: C.text, marginBottom: '0.625rem' }}>
                  Color <span style={{ fontWeight: 400, color: C.muted }}>{quickAddColor}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {quickAddProduct.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setQuickAddColor(color.name)}
                      title={color.name}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: color.hex,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        padding: 0,
                        boxShadow:
                          quickAddColor === color.name
                            ? `0 0 0 2px #ffffff, 0 0 0 4px ${C.blue}`
                            : `inset 0 0 0 1px rgba(0,0,0,0.1)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Storage Selector */}
            {quickAddProduct.storageOptions?.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: C.text, marginBottom: '0.625rem' }}>
                  Storage
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {quickAddProduct.storageOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setQuickAddStorage(opt)}
                      style={{
                        padding: '0.4375rem 1.125rem',
                        borderRadius: '980px',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit',
                        border: quickAddStorage === opt ? `2px solid ${C.blue}` : `1px solid ${C.border}`,
                        background: quickAddStorage === opt ? C.blueBg : C.card,
                        color: quickAddStorage === opt ? C.blue : C.text,
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '0 0 1.25rem' }} />

            {/* Price & Stock */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.625rem',
                marginBottom: '1.25rem',
              }}
            >
              <span
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: quickAddVariant?.stock === 0 ? C.muted : C.text,
                  letterSpacing: '-0.03em',
                }}
              >
                {quickAddVariant ? `₦${formatPrice(quickAddVariant.price)}` : '—'}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: quickAddStockStatus.color,
                  background: quickAddStockStatus.bg,
                  padding: '0.3125rem 0.875rem',
                  borderRadius: '980px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: quickAddStockStatus.dot }} />
                {quickAddStockStatus.label}
              </span>
            </div>

            {/* Quantity Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: C.text }}>Quantity</span>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: '980px',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setQuickAddQuantity((q) => Math.max(1, q - 1))}
                  disabled={quickAddQuantity <= 1}
                  style={{
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'transparent',
                    cursor: quickAddQuantity <= 1 ? 'not-allowed' : 'pointer',
                    color: quickAddQuantity <= 1 ? '#d2d2d7' : C.text,
                  }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ width: '32px', textAlign: 'center', fontSize: '0.9375rem', fontWeight: 600, color: C.text, userSelect: 'none' }}>
                  {quickAddQuantity}
                </span>
                <button
                  onClick={() => setQuickAddQuantity((q) => Math.min(q + 1, quickAddVariant?.stock || 1))}
                  disabled={!quickAddVariant || quickAddQuantity >= quickAddVariant.stock}
                  style={{
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'transparent',
                    cursor: !quickAddVariant || quickAddQuantity >= quickAddVariant.stock ? 'not-allowed' : 'pointer',
                    color: !quickAddVariant || quickAddQuantity >= quickAddVariant.stock ? '#d2d2d7' : C.text,
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleQuickAddSubmit}
              disabled={!quickAddVariant || quickAddVariant.stock === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.875rem',
                borderRadius: '980px',
                border: 'none',
                background: !quickAddVariant || quickAddVariant.stock === 0 ? '#e8e8ed' : C.blue,
                color: !quickAddVariant || quickAddVariant.stock === 0 ? C.muted : '#ffffff',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: !quickAddVariant || quickAddVariant.stock === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.25s ease',
              }}
            >
              <ShoppingBag size={16} />
              {!quickAddVariant || quickAddVariant.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
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
