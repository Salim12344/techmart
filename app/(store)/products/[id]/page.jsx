'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';
import {
  Star, Heart, ShoppingBag, Plus, Minus,
  ChevronRight, Shield, Truck, Package,
} from 'lucide-react';

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

function StarRating({ rating, size = 16, interactive = false, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = interactive
          ? i <= (hovered || rating)
          : i <= Math.round(rating);
        return (
          <Star
            key={i}
            size={size}
            fill={filled ? '#ff9f0a' : 'none'}
            stroke={filled ? '#ff9f0a' : '#d2d2d7'}
            strokeWidth={1.5}
            style={interactive ? { cursor: 'pointer' } : undefined}
            onMouseEnter={interactive ? () => setHovered(i) : undefined}
            onMouseLeave={interactive ? () => setHovered(0) : undefined}
            onClick={interactive && onChange ? () => onChange(i) : undefined}
          />
        );
      })}
    </span>
  );
}

function RatingBar({ count, total, stars }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.8125rem',
      }}
    >
      <span style={{ color: C.muted, width: '14px', textAlign: 'right', fontWeight: 500 }}>
        {stars}
      </span>
      <Star size={11} fill="#ff9f0a" stroke="#ff9f0a" strokeWidth={1.5} />
      <div
        style={{
          flex: 1,
          height: '6px',
          borderRadius: '3px',
          background: '#f0f0f0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: '3px',
            background: '#ff9f0a',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
      <span style={{ color: C.muted, width: '28px', fontSize: '0.75rem' }}>{count}</span>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Breadcrumb skeleton */}
        <div
          style={{
            height: '14px',
            width: '280px',
            background: '#e8e8ed',
            borderRadius: '7px',
            marginBottom: '2.5rem',
            animation: 'pulse 1.8s ease-in-out infinite',
          }}
        />
        <div
          className="detail-grid-skeleton"
          style={{
            display: 'grid',
            gridTemplateColumns: '55% 45%',
            gap: '3.5rem',
            alignItems: 'start',
          }}
        >
          {/* Image skeleton */}
          <div
            style={{
              background: C.card,
              borderRadius: '24px',
              aspectRatio: '1',
              animation: 'pulse 1.8s ease-in-out infinite',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          />
          {/* Details skeleton */}
          <div style={{ paddingTop: '0.5rem' }}>
            <div
              style={{
                height: '16px',
                width: '80px',
                background: '#e8e8ed',
                borderRadius: '980px',
                marginBottom: '1rem',
                animation: 'pulse 1.8s ease-in-out infinite',
              }}
            />
            <div
              style={{
                height: '28px',
                width: '90%',
                background: '#e8e8ed',
                borderRadius: '8px',
                marginBottom: '0.75rem',
                animation: 'pulse 1.8s ease-in-out infinite',
                animationDelay: '0.1s',
              }}
            />
            <div
              style={{
                height: '18px',
                width: '60%',
                background: '#e8e8ed',
                borderRadius: '8px',
                marginBottom: '2rem',
                animation: 'pulse 1.8s ease-in-out infinite',
                animationDelay: '0.15s',
              }}
            />
            {[160, 200, 120, 180].map((w, i) => (
              <div
                key={i}
                style={{
                  height: '16px',
                  width: `${w}px`,
                  background: '#e8e8ed',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  animation: 'pulse 1.8s ease-in-out infinite',
                  animationDelay: `${0.2 + i * 0.05}s`,
                }}
              />
            ))}
            <div
              style={{
                height: '52px',
                width: '100%',
                background: '#e8e8ed',
                borderRadius: '980px',
                marginTop: '1.5rem',
                animation: 'pulse 1.8s ease-in-out infinite',
                animationDelay: '0.4s',
              }}
            />
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 768px) {
          .detail-grid-skeleton {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function ProductDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hoveredAddCart, setHoveredAddCart] = useState(false);
  const [hoveredWishlist, setHoveredWishlist] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [prodRes, revRes] = await Promise.all([
          fetch(`/api/products/${id}`),
          fetch(`/api/reviews?productId=${id}`),
        ]);

        if (!prodRes.ok) {
          showToast('Product not found', 'error');
          router.push('/products');
          return;
        }

        const prodData = await prodRes.json();
        const revData = await revRes.json();

        if (cancelled) return;

        const p = prodData.product;
        setProduct(p);
        setReviews(revData.reviews || []);

        if (p.colors?.length > 0) setSelectedColor(p.colors[0].name);
        if (p.storageOptions?.length > 0) setSelectedStorage(p.storageOptions[0]);
      } catch {
        if (!cancelled) showToast('Failed to load product', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants) return null;
    return (
      product.variants.find(
        (v) => v.color === selectedColor && v.storage === selectedStorage
      ) || null
    );
  }, [product, selectedColor, selectedStorage]);

  useEffect(() => {
    setQuantity(1);
  }, [selectedColor, selectedStorage]);

  const stockStatus = useMemo(() => {
    if (!selectedVariant) return { label: 'Unavailable', color: C.muted, bg: '#f0f0f0', dot: C.muted };
    if (selectedVariant.stock === 0)
      return { label: 'Out of Stock', color: C.red, bg: C.redBg, dot: C.red };
    if (selectedVariant.stock <= LOW_STOCK_THRESHOLD)
      return {
        label: `Only ${selectedVariant.stock} left`,
        color: C.orange,
        bg: C.orangeBg,
        dot: C.orange,
      };
    return { label: 'In Stock', color: C.green, bg: C.greenBg, dot: C.green };
  }, [selectedVariant]);

  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      const idx = Math.round(r.rating) - 1;
      if (idx >= 0 && idx < 5) dist[idx]++;
    });
    return dist;
  }, [reviews]);

  function handleAddToCart() {
    if (!selectedVariant || selectedVariant.stock === 0) return;

    const cartItem = {
      productId: product._id,
      name: product.name,
      color: selectedColor,
      storage: selectedStorage,
      sku: selectedVariant.sku,
      price: selectedVariant.price,
      quantity,
      image: product.image,
    };

    try {
      const raw = localStorage.getItem(CART_KEY);
      const cart = raw ? JSON.parse(raw) : [];

      const existingIdx = cart.findIndex((item) => item.sku === cartItem.sku);

      if (existingIdx > -1) {
        cart[existingIdx].quantity += quantity;
      } else {
        cart.push(cartItem);
      }

      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      window.dispatchEvent(new Event('cart-updated'));
      showToast(`${product.name} added to cart`, 'success');
    } catch {
      showToast('Failed to add to cart', 'error');
    }
  }

  async function handleAddToWishlist() {
    setWishlistLoading(true);
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id }),
      });

      if (res.status === 401) {
        showToast('Please log in to add to wishlist', 'warning');
        return;
      }

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Added to wishlist', 'success');
      } else {
        showToast(data.error || 'Failed to add to wishlist', 'error');
      }
    } catch {
      showToast('Failed to add to wishlist', 'error');
    } finally {
      setWishlistLoading(false);
    }
  }

  if (loading) return <SkeletonLoader />;
  if (!product) return null;

  const colorObj = product.colors?.find((c) => c.name === selectedColor);

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <nav
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1.5rem 2rem 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.8125rem',
            color: C.muted,
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/"
            style={{
              color: C.muted,
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.color = C.text)}
            onMouseLeave={(e) => (e.target.style.color = C.muted)}
          >
            Home
          </Link>
          <span style={{ color: '#d2d2d7', margin: '0 0.125rem' }}>/</span>
          <Link
            href="/products"
            style={{
              color: C.muted,
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.color = C.text)}
            onMouseLeave={(e) => (e.target.style.color = C.muted)}
          >
            Products
          </Link>
          {product.category && (
            <>
              <span style={{ color: '#d2d2d7', margin: '0 0.125rem' }}>/</span>
              <Link
                href={`/products?category=${encodeURIComponent(product.category)}`}
                style={{
                  color: C.muted,
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.target.style.color = C.text)}
                onMouseLeave={(e) => (e.target.style.color = C.muted)}
              >
                {product.category}
              </Link>
            </>
          )}
          <span style={{ color: '#d2d2d7', margin: '0 0.125rem' }}>/</span>
          <span style={{ color: C.text, fontWeight: 500 }}>{product.name}</span>
        </div>
      </nav>

      {/* Main Content */}
      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2.5rem 2rem 5rem',
        }}
      >
        <div
          className="product-detail-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '55% 45%',
            gap: '3.5rem',
            alignItems: 'start',
          }}
        >
          {/* Left Column - Image */}
          <div
            style={{
              background: C.card,
              borderRadius: '24px',
              overflow: 'hidden',
              position: 'sticky',
              top: '2rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <div
              style={{
                position: 'relative',
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2.5rem',
              }}
            >
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={500}
                  height={500}
                  style={{
                    objectFit: 'contain',
                    width: '100%',
                    height: '100%',
                    opacity: imageLoaded ? 1 : 0,
                    transition: 'opacity 0.5s ease',
                  }}
                  onLoad={() => setImageLoaded(true)}
                  priority
                />
              ) : (
                <Package size={100} color="#d2d2d7" />
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div style={{ paddingTop: '0.5rem' }}>
            {/* Category Badge */}
            {product.category && (
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: C.blue,
                  background: C.blueBg,
                  padding: '0.25rem 0.875rem',
                  borderRadius: '980px',
                  marginBottom: '1rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {product.category}
              </span>
            )}

            {/* Product Name */}
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: C.text,
                margin: '0 0 0.75rem',
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
              }}
            >
              {product.name}
            </h1>

            {/* Rating */}
            {product.reviewCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                }}
              >
                <StarRating rating={product.averageRating} />
                <span
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: C.text,
                  }}
                >
                  {product.averageRating?.toFixed(1)}
                </span>
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: C.muted,
                  }}
                >
                  ({product.reviewCount}{' '}
                  {product.reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p
                style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.7,
                  color: C.muted,
                  margin: '0 0 1.75rem',
                }}
              >
                {product.description}
              </p>
            )}

            {/* Divider */}
            <hr
              style={{
                border: 'none',
                borderTop: `1px solid ${C.border}`,
                margin: '0 0 1.75rem',
              }}
            />

            {/* Color Selector */}
            {product.colors?.length > 0 && (
              <div style={{ marginBottom: '1.75rem' }}>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: C.text,
                    marginBottom: '0.875rem',
                  }}
                >
                  Color{' '}
                  <span style={{ fontWeight: 400, color: C.muted }}>
                    {' '}{selectedColor}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      title={color.name}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: color.hex,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        padding: 0,
                        boxShadow:
                          selectedColor === color.name
                            ? `0 0 0 2px #ffffff, 0 0 0 4px ${C.blue}`
                            : `inset 0 0 0 1px rgba(0,0,0,0.1)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Storage Selector */}
            {product.storageOptions?.length > 0 && (
              <div style={{ marginBottom: '1.75rem' }}>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: C.text,
                    marginBottom: '0.875rem',
                  }}
                >
                  Storage
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {product.storageOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedStorage(opt)}
                      style={{
                        padding: '0.5rem 1.5rem',
                        borderRadius: '980px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        fontFamily: 'inherit',
                        border:
                          selectedStorage === opt
                            ? `2px solid ${C.blue}`
                            : `1px solid ${C.border}`,
                        background: selectedStorage === opt ? C.blueBg : C.card,
                        color: selectedStorage === opt ? C.blue : C.text,
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <hr
              style={{
                border: 'none',
                borderTop: `1px solid ${C.border}`,
                margin: '0 0 1.75rem',
              }}
            />

            {/* Price & Stock */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                {selectedVariant ? (
                  <span
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      color: selectedVariant.stock === 0 ? C.muted : C.text,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {'₦'}{selectedVariant.price.toLocaleString()}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 500,
                      color: C.muted,
                    }}
                  >
                    Select options to see price
                  </span>
                )}
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: stockStatus.color,
                  background: stockStatus.bg,
                  padding: '0.375rem 1rem',
                  borderRadius: '980px',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: stockStatus.dot,
                  }}
                />
                {stockStatus.label}
              </span>
            </div>

            {/* Quantity */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.75rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: C.text,
                }}
              >
                Quantity
              </span>
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
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  style={{
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'transparent',
                    cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    color: quantity <= 1 ? '#d2d2d7' : C.text,
                    transition: 'color 0.2s',
                  }}
                >
                  <Minus size={16} />
                </button>
                <span
                  style={{
                    width: '40px',
                    textAlign: 'center',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: C.text,
                    userSelect: 'none',
                  }}
                >
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((q) =>
                      Math.min(q + 1, selectedVariant?.stock || 1)
                    )
                  }
                  disabled={!selectedVariant || quantity >= selectedVariant.stock}
                  style={{
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'transparent',
                    cursor:
                      !selectedVariant || quantity >= selectedVariant.stock
                        ? 'not-allowed'
                        : 'pointer',
                    color:
                      !selectedVariant || quantity >= selectedVariant.stock
                        ? '#d2d2d7'
                        : C.text,
                    transition: 'color 0.2s',
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '2rem',
                alignItems: 'stretch',
              }}
            >
              <button
                onClick={handleAddToCart}
                onMouseEnter={() => setHoveredAddCart(true)}
                onMouseLeave={() => setHoveredAddCart(false)}
                disabled={!selectedVariant || selectedVariant.stock === 0}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.9375rem 1.5rem',
                  borderRadius: '980px',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor:
                    !selectedVariant || selectedVariant.stock === 0
                      ? 'not-allowed'
                      : 'pointer',
                  background:
                    !selectedVariant || selectedVariant.stock === 0
                      ? '#e8e8ed'
                      : hoveredAddCart
                      ? '#0077ed'
                      : C.blue,
                  color:
                    !selectedVariant || selectedVariant.stock === 0
                      ? C.muted
                      : '#ffffff',
                  transition: 'all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  transform: hoveredAddCart && selectedVariant?.stock > 0 ? 'scale(1.02)' : 'scale(1)',
                  boxShadow:
                    hoveredAddCart && selectedVariant?.stock > 0
                      ? '0 4px 16px rgba(0,113,227,0.3)'
                      : 'none',
                }}
              >
                <ShoppingBag size={18} />
                {selectedVariant?.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleAddToWishlist}
                onMouseEnter={() => setHoveredWishlist(true)}
                onMouseLeave={() => setHoveredWishlist(false)}
                disabled={wishlistLoading}
                style={{
                  width: '52px',
                  height: '52px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  border: `1.5px solid ${hoveredWishlist ? C.red : C.border}`,
                  background: hoveredWishlist ? 'rgba(255,69,58,0.06)' : C.card,
                  cursor: wishlistLoading ? 'not-allowed' : 'pointer',
                  color: hoveredWishlist ? C.red : C.muted,
                  transition: 'all 0.25s ease',
                  flexShrink: 0,
                  padding: 0,
                  transform: hoveredWishlist ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                <Heart
                  size={20}
                  fill={hoveredWishlist ? C.red : 'none'}
                  stroke={hoveredWishlist ? C.red : C.muted}
                />
              </button>
            </div>

            {/* Delivery & Warranty Info Cards */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  padding: '1rem 1.25rem',
                  background: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  border: `1px solid rgba(0,0,0,0.04)`,
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(0,113,227,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Truck size={18} color={C.blue} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: C.text }}>
                    Free Delivery
                  </div>
                  <div style={{ fontSize: '0.75rem', color: C.muted, marginTop: '1px' }}>
                    On orders over {'₦'}500,000
                  </div>
                </div>
              </div>

              {product.warranty && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    padding: '1rem 1.25rem',
                    background: 'rgba(255,255,255,0.72)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: `1px solid rgba(0,0,0,0.04)`,
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(48,209,88,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Shield size={18} color={C.green} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: C.text }}>
                      Warranty
                    </div>
                    <div style={{ fontSize: '0.75rem', color: C.muted, marginTop: '1px' }}>
                      {product.warranty}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Specifications */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <section style={{ marginTop: '5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.75rem',
              }}
            >
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: C.text,
                  margin: 0,
                  letterSpacing: '-0.03em',
                  whiteSpace: 'nowrap',
                }}
              >
                Specifications
              </h2>
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  background: C.border,
                }}
              />
            </div>
            <div
              style={{
                background: C.card,
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {Object.entries(product.specs).map(([key, value], idx) => (
                <div
                  key={key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    padding: '1rem 1.75rem',
                    background: idx % 2 === 0 ? '#fafafa' : C.card,
                    fontSize: '0.9375rem',
                  }}
                >
                  <span style={{ color: C.muted, fontWeight: 500 }}>{key}</span>
                  <span style={{ color: C.text, fontWeight: 500 }}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <section style={{ marginTop: '5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.75rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: C.text,
                margin: 0,
                letterSpacing: '-0.03em',
                whiteSpace: 'nowrap',
              }}
            >
              Customer Reviews
            </h2>
            <div
              style={{
                flex: 1,
                height: '1px',
                background: C.border,
              }}
            />
          </div>

          {/* Rating Summary Card */}
          {product.reviewCount > 0 && (
            <div
              style={{
                display: 'flex',
                gap: '2.5rem',
                padding: '2rem',
                background: C.card,
                borderRadius: '20px',
                marginBottom: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {/* Big Number */}
              <div style={{ textAlign: 'center', minWidth: '100px' }}>
                <div
                  style={{
                    fontSize: '3.5rem',
                    fontWeight: 700,
                    color: C.text,
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                  }}
                >
                  {product.averageRating?.toFixed(1)}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <StarRating rating={product.averageRating} size={16} />
                </div>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    color: C.muted,
                    marginTop: '0.375rem',
                    fontWeight: 500,
                  }}
                >
                  {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
                </div>
              </div>

              {/* Rating Bars */}
              <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {[5, 4, 3, 2, 1].map((stars) => (
                  <RatingBar
                    key={stars}
                    stars={stars}
                    count={ratingDistribution[stars - 1]}
                    total={reviews.length}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Review List */}
          {reviews.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: C.card,
                borderRadius: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <Star size={40} color="#d2d2d7" style={{ marginBottom: '1rem' }} />
              <p
                style={{
                  color: C.muted,
                  fontSize: '1rem',
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                No reviews yet. Be the first to review this product.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {reviews.map((review, idx) => (
                <div
                  key={review._id || idx}
                  style={{
                    background: C.card,
                    borderRadius: '20px',
                    padding: '1.5rem 1.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'box-shadow 0.3s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${C.blue}, #64acff)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: '#ffffff',
                          flexShrink: 0,
                        }}
                      >
                        {(review.userId?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: '0.9375rem',
                            fontWeight: 600,
                            color: C.text,
                          }}
                        >
                          {review.userId?.name || 'Anonymous'}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: C.muted,
                            marginTop: '1px',
                          }}
                        >
                          {new Date(review.createdAt).toLocaleDateString('en-NG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size={14} />
                  </div>
                  {review.comment && (
                    <p
                      style={{
                        fontSize: '0.9375rem',
                        color: C.text,
                        lineHeight: 1.65,
                        margin: '0.5rem 0 0',
                      }}
                    >
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Responsive + Utility Styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        @media (max-width: 768px) {
          .product-detail-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .product-detail-grid > div:first-child {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}
