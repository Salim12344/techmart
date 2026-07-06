'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';
import { useConfirm } from '@/app/components/ConfirmDialog';
import { isInGuestWishlist, toggleGuestWishlist } from '@/lib/guestWishlist';
import { getCart, saveCart } from '@/lib/cart';
import { formatPrice } from '@/lib/formatPrice';
import {
  Star, Heart, ShoppingBag, Plus, Minus,
  ChevronRight, Shield, Truck, Package, Send, ArrowLeft, ThumbsUp,
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
  const confirmAction = useConfirm();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hoveredAddCart, setHoveredAddCart] = useState(false);
  const [hoveredWishlist, setHoveredWishlist] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cameFromCart, setCameFromCart] = useState(false);

  useEffect(() => {
    setCameFromCart(new URLSearchParams(window.location.search).get('from') === 'cart');
  }, []);

  // Review form state
  const { data: session, status: authStatus } = useSession();
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [hoveredSubmit, setHoveredSubmit] = useState(false);

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
        if (!cancelled) showToast('Unable to load product right now', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  // Wishlist status: authenticated -> API, guest -> localStorage
  useEffect(() => {
    if (authStatus === 'loading') return;
    if (authStatus === 'authenticated') {
      let cancelled = false;
      async function fetchWishlistStatus() {
        try {
          const wRes = await fetch('/api/wishlist');
          if (wRes.ok) {
            const wData = await wRes.json();
            if (!cancelled) setIsWishlisted((wData.wishlist || []).some(p => p._id === id));
          }
        } catch {}
      }
      fetchWishlistStatus();
      return () => { cancelled = true; };
    } else {
      setIsWishlisted(isInGuestWishlist(id));
    }
  }, [id, authStatus]);

  useEffect(() => {
    function syncGuestWishlist() {
      if (authStatus !== 'authenticated') setIsWishlisted(isInGuestWishlist(id));
    }
    window.addEventListener('wishlist-updated', syncGuestWishlist);
    return () => window.removeEventListener('wishlist-updated', syncGuestWishlist);
  }, [id, authStatus]);

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

  // Track live cart contents so the quantity stepper stays in sync with the actual bag
  useEffect(() => {
    if (authStatus === 'loading') return;
    async function syncCart() {
      const cart = await getCart(authStatus);
      setCartItems(cart);
    }
    syncCart();
    window.addEventListener('cart-updated', syncCart);
    window.addEventListener('storage', syncCart);
    return () => {
      window.removeEventListener('cart-updated', syncCart);
      window.removeEventListener('storage', syncCart);
    };
  }, [id, authStatus]);

  const cartItemForVariant = useMemo(() => {
    if (!selectedVariant) return null;
    return cartItems.find((item) => item.sku === selectedVariant.sku) || null;
  }, [cartItems, selectedVariant]);

  // How many more of this variant can still be added on top of what's already in the bag
  const roomLeft = useMemo(() => {
    if (!selectedVariant) return 0;
    return Math.max(0, selectedVariant.stock - (cartItemForVariant?.quantity || 0));
  }, [selectedVariant, cartItemForVariant]);

  // Keep the "quantity to add" selector within whatever room is actually left
  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(q, 1), Math.max(roomLeft, 1)));
  }, [roomLeft]);


  // Fetch user's delivered orders to check purchase eligibility for review
  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          const delivered = (data.orders || []).filter(
            (o) => o.status === 'delivered' && o.items.some((item) => {
              const pid = String(item.productId?._id || item.productId || '');
              return pid === id;
            })
          );
          setDeliveredOrders(delivered);
        }
      } catch {}
      setOrdersLoaded(true);
    }
    fetchOrders();
  }, [authStatus, id]);

  // Determine if user already reviewed this product
  const userAlreadyReviewed = useMemo(() => {
    if (!session?.user) return false;
    return reviews.some((r) => {
      const reviewerId = r.userId?._id || r.userId;
      return reviewerId === session.user.id;
    });
  }, [reviews, session]);

  // Find a delivered order containing this product that hasn't been used for a review yet
  const eligibleOrder = useMemo(() => {
    if (userAlreadyReviewed || deliveredOrders.length === 0) return null;
    return deliveredOrders[0];
  }, [deliveredOrders, userAlreadyReviewed]);

  async function handleSubmitReview() {
    if (reviewRating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }
    if (!eligibleOrder) return;
    setReviewSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          rating: reviewRating,
          comment: reviewComment,
          orderId: eligibleOrder._id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Unable to submit review right now', 'error');
        return;
      }
      const data = await res.json();
      // Add the new review to the list with user info
      const newReview = {
        ...data.review,
        userId: { _id: session.user.id, name: session.user.name || 'You' },
      };
      setReviews((prev) => [newReview, ...prev]);
      setReviewRating(0);
      setReviewComment('');
      showToast('Review submitted successfully!', 'success');
    } catch {
      showToast('Unable to submit review right now', 'error');
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!(await confirmAction({ title: 'Delete your review?', confirmLabel: 'Delete' }))) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Unable to delete review right now', 'error');
        return;
      }
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      showToast('Review deleted', 'success');
    } catch {
      showToast('Unable to delete review right now', 'error');
    }
  }

  async function handleLikeReview(reviewId) {
    if (!session?.user) {
      showToast('Sign in to like a review');
      return;
    }
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like' }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Unable to like review right now', 'error');
        return;
      }
      setReviews((prev) => prev.map((r) => {
        if (r._id !== reviewId) return r;
        const likes = data.liked
          ? [...(r.likes || []), session.user.id]
          : (r.likes || []).filter((u) => u !== session.user.id);
        return { ...r, likes };
      }));
    } catch {
      showToast('Unable to like review right now', 'error');
    }
  }

  const stockStatus = useMemo(() => {
    if (!selectedVariant) return { label: 'Unavailable', color: C.muted, bg: '#f0f0f0', dot: C.muted };
    if (selectedVariant.stock <= 0)
      return { label: 'Out of Stock', color: C.red, bg: C.redBg, dot: C.red };
    if (selectedVariant.stock <= LOW_STOCK_THRESHOLD)
      return {
        label: `Low Stock (${selectedVariant.stock} left)`,
        color: C.orange,
        bg: C.orangeBg,
        dot: C.orange,
      };
    return { label: `In Stock (${selectedVariant.stock} available)`, color: C.green, bg: C.greenBg, dot: C.green };
  }, [selectedVariant]);

  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      const idx = Math.round(r.rating) - 1;
      if (idx >= 0 && idx < 5) dist[idx]++;
    });
    return dist;
  }, [reviews]);

  async function handleAddToCart() {
    if (!selectedVariant || selectedVariant.stock <= 0) return;

    // Re-check live stock at the moment of adding - the page's own data could be
    // stale if someone else bought the last unit while this page was open.
    let liveStock = selectedVariant.stock;
    try {
      const res = await fetch(`/api/products/${product._id}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const liveVariant = data.product?.variants?.find((v) => v.sku === selectedVariant.sku);
        liveStock = liveVariant ? liveVariant.stock : 0;
      }
    } catch {
      // if the re-check itself fails, fall back to the page's own data rather than blocking the user
    }
    if (liveStock <= 0) {
      showToast('This item just sold out', 'error');
      return;
    }

    const cartItem = {
      productId: product._id,
      name: product.name,
      color: selectedColor,
      storage: selectedStorage,
      sku: selectedVariant.sku,
      price: selectedVariant.price,
      quantity,
      image: displayImage,
    };

    try {
      const cart = await getCart(authStatus);

      const existingIdx = cart.findIndex((item) => item.sku === cartItem.sku);

      if (existingIdx > -1) {
        const alreadyInBag = cart[existingIdx].quantity;
        if (alreadyInBag + quantity > liveStock) {
          const room = liveStock - alreadyInBag;
          if (room <= 0) {
            showToast(`Only ${liveStock} in stock (${alreadyInBag} already in your bag)`, 'error');
            return;
          }
          cart[existingIdx].quantity = liveStock;
          showToast(`Only ${room} more available (${alreadyInBag} already in your bag)`, 'error');
        } else {
          cart[existingIdx].quantity += quantity;
        }
      } else {
        cartItem.quantity = Math.min(quantity, liveStock);
        cart.push(cartItem);
      }

      await saveCart(cart, authStatus);
      showToast(`${product.name} added to cart`, 'success');
    } catch {
      showToast('Unable to add to cart right now', 'error');
    }
  }

  async function handleToggleWishlist() {
    if (authStatus !== 'authenticated') {
      const nowInWishlist = toggleGuestWishlist(id);
      setIsWishlisted(nowInWishlist);
      showToast(nowInWishlist ? 'Added to wishlist' : 'Removed from wishlist', 'success');
      return;
    }

    setWishlistLoading(true);
    try {
      const res = await fetch('/api/wishlist', {
        method: isWishlisted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id }),
      });
      if (res.status === 401) { showToast('Sign in to use wishlist'); return; }
      setIsWishlisted(!isWishlisted);
      showToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success');
    } catch { showToast('Something went wrong. Please try again.'); }
    finally { setWishlistLoading(false); }
  }

  if (loading) return <SkeletonLoader />;
  if (!product) return null;

  const colorObj = product.colors?.find((c) => c.name === selectedColor);

  const displayImage = (() => {
    if (selectedColor) {
      const colorWithImage = product.colors?.find(c => c.name === selectedColor);
      if (colorWithImage?.image) return colorWithImage.image;
    }
    return product.image;
  })();

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      {/* Back to Products + Breadcrumb */}
      <nav
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1.5rem 2rem 0',
        }}
      >
        <Link href={cameFromCart ? '/cart' : '/products'} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#0071e3', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> {cameFromCart ? 'Back to Bag' : 'Back to Products'}
        </Link>
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
              {displayImage ? (
                <Image
                  key={displayImage}
                  src={displayImage}
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
                      color: selectedVariant.stock <= 0 ? C.muted : C.text,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {formatPrice(selectedVariant.price)}
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
              <span
                style={{
                  fontSize: '0.8125rem',
                  color: C.muted,
                  fontWeight: 400,
                }}
              >
                {cartItemForVariant
                  ? `(${cartItemForVariant.quantity} already in bag, ${roomLeft} more available)`
                  : `(${selectedVariant?.stock || 0} available)`}
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
                  onClick={() => setQuantity((q) => Math.min(q + 1, Math.max(roomLeft, 1)))}
                  disabled={!selectedVariant || quantity >= roomLeft}
                  style={{
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'transparent',
                    cursor: !selectedVariant || quantity >= roomLeft ? 'not-allowed' : 'pointer',
                    color: !selectedVariant || quantity >= roomLeft ? '#d2d2d7' : C.text,
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
                disabled={!selectedVariant || selectedVariant.stock <= 0 || roomLeft === 0}
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
                    !selectedVariant || selectedVariant.stock <= 0 || roomLeft === 0
                      ? 'not-allowed'
                      : 'pointer',
                  background: !selectedVariant || selectedVariant.stock <= 0 || roomLeft === 0
                      ? '#e8e8ed'
                      : hoveredAddCart
                      ? '#0077ed'
                      : C.blue,
                  color: !selectedVariant || selectedVariant.stock <= 0 || roomLeft === 0
                      ? C.muted
                      : '#ffffff',
                  transition: 'all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  transform: hoveredAddCart && selectedVariant?.stock > 0 && roomLeft > 0 ? 'scale(1.02)' : 'scale(1)',
                  boxShadow:
                    hoveredAddCart && selectedVariant?.stock > 0 && roomLeft > 0
                      ? '0 4px 16px rgba(0,113,227,0.3)'
                      : 'none',
                }}
              >
                <ShoppingBag size={18} />
                {selectedVariant?.stock <= 0
                  ? 'Out of Stock'
                  : roomLeft === 0
                  ? 'Max in Bag'
                  : 'Add to Cart'}
              </button>
              <button
                onClick={handleToggleWishlist}
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
                  border: `1.5px solid ${isWishlisted || hoveredWishlist ? C.red : C.border}`,
                  background: isWishlisted || hoveredWishlist ? 'rgba(255,69,58,0.06)' : C.card,
                  cursor: wishlistLoading ? 'not-allowed' : 'pointer',
                  color: isWishlisted || hoveredWishlist ? C.red : C.muted,
                  transition: 'all 0.25s ease',
                  flexShrink: 0,
                  padding: 0,
                  transform: hoveredWishlist ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                <Heart
                  size={20}
                  fill={isWishlisted ? C.red : 'none'}
                  stroke={isWishlisted ? C.red : C.muted}
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
                  {!review.isApproved && review.userId?._id === session?.user?.id && (
                    <span style={{
                      display: 'inline-block', fontSize: '0.75rem', fontWeight: 600,
                      color: C.orange, background: C.orangeBg, padding: '0.2rem 0.625rem',
                      borderRadius: '980px', marginBottom: '0.5rem',
                    }}>
                      Pending approval
                    </span>
                  )}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.875rem' }}>
                    {review.userId?._id === session?.user?.id ? (
                      <button
                        onClick={() => handleDeleteReview(review._id)}
                        style={{
                          background: 'none', border: 'none', padding: 0,
                          color: C.red, fontSize: '0.8125rem', fontWeight: 500,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLikeReview(review._id)}
                        disabled={!session?.user}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.375rem',
                          background: 'none', border: 'none', padding: 0,
                          color: (review.likes || []).includes(session?.user?.id) ? C.blue : C.muted,
                          fontSize: '0.8125rem', fontWeight: 500,
                          cursor: session?.user ? 'pointer' : 'default',
                          fontFamily: 'inherit',
                        }}
                      >
                        <ThumbsUp size={14} fill={(review.likes || []).includes(session?.user?.id) ? C.blue : 'none'} />
                        {(review.likes || []).length > 0 ? review.likes.length : ''} Helpful
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Write a Review Section */}
          {authStatus === 'authenticated' && ordersLoaded && (
            <div
              style={{
                marginTop: '2rem',
                background: C.card,
                borderRadius: '20px',
                padding: '2rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: C.text,
                  margin: '0 0 1.25rem',
                  letterSpacing: '-0.02em',
                }}
              >
                Write a Review
              </h3>

              {userAlreadyReviewed ? (
                <p
                  style={{
                    fontSize: '0.9375rem',
                    color: C.muted,
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  You've already reviewed this product
                </p>
              ) : !eligibleOrder ? (
                <p
                  style={{
                    fontSize: '0.9375rem',
                    color: C.muted,
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  Purchase and receive this product to leave a review
                </p>
              ) : (
                <div>
                  {/* Star Rating Selector */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: C.text,
                        marginBottom: '0.5rem',
                      }}
                    >
                      Rating
                    </label>
                    <StarRating
                      rating={reviewRating}
                      size={28}
                      interactive
                      onChange={setReviewRating}
                    />
                  </div>

                  {/* Comment Textarea */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: C.text,
                        marginBottom: '0.5rem',
                      }}
                    >
                      Comment
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        borderRadius: '12px',
                        border: `1px solid ${C.inputBorder}`,
                        fontSize: '0.9375rem',
                        fontFamily: 'inherit',
                        color: C.text,
                        background: '#fafafa',
                        resize: 'vertical',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = C.blue)}
                      onBlur={(e) => (e.target.style.borderColor = C.inputBorder)}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitReview}
                    onMouseEnter={() => setHoveredSubmit(true)}
                    onMouseLeave={() => setHoveredSubmit(false)}
                    disabled={reviewSubmitting || reviewRating === 0}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.75rem',
                      borderRadius: '980px',
                      border: 'none',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      cursor: reviewSubmitting || reviewRating === 0 ? 'not-allowed' : 'pointer',
                      background: reviewSubmitting || reviewRating === 0 ? '#e8e8ed' : hoveredSubmit ? '#0077ed' : C.blue,
                      color: reviewSubmitting || reviewRating === 0 ? C.muted : '#ffffff',
                      transition: 'all 0.25s ease',
                      transform: hoveredSubmit && !reviewSubmitting && reviewRating > 0 ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    <Send size={16} />
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              )}
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
