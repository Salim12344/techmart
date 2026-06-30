'use client';

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, Heart, ShoppingBag, Star, X, ChevronDown, Package, GitCompareArrows, ArrowRight, Plus, Minus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/Toast';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  inputBorder: '#d2d2d7', red: '#ff453a', green: '#30d158',
  orange: '#ff9f0a', greenBg: 'rgba(48,209,88,0.1)',
  orangeBg: 'rgba(255,159,10,0.1)', redBg: 'rgba(255,69,58,0.08)',
  blueBg: 'rgba(0,113,227,0.08)',
};

function getMinPrice(variants) {
  if (!variants || variants.length === 0) return 0;
  return Math.min(...variants.map((v) => v.price));
}

function getTotalStock(variants) {
  if (!variants || variants.length === 0) return 0;
  return variants.reduce((sum, v) => sum + (v.stock || 0), 0);
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-NG').format(price);
}

function StarRating({ rating, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '1px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= Math.round(rating) ? '#ff9f0a' : 'none'}
          stroke={i <= Math.round(rating) ? '#ff9f0a' : '#d2d2d7'}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

function addToCart(product, toast) {
  const variant = product.variants?.find((v) => v.stock > 0) || product.variants?.[0];
  if (!variant) {
    toast('No variants available for this product', 'error');
    return;
  }

  const cartItem = {
    productId: product._id,
    name: product.name,
    color: variant.color || '',
    storage: variant.storage || '',
    sku: variant.sku || '',
    price: variant.price,
    quantity: 1,
    image: product.image || '',
  };

  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem('techmart-cart') || '[]');
  } catch {
    cart = [];
  }

  const existingIdx = cart.findIndex((c) => c.sku === cartItem.sku);
  if (existingIdx > -1) {
    if (cart[existingIdx].quantity >= variant.stock) {
      toast(`Only ${variant.stock} in stock`, 'error');
      return;
    }
    cart[existingIdx].quantity += 1;
  } else {
    cartItem.quantity = Math.min(1, variant.stock);
    cart.push(cartItem);
  }

  localStorage.setItem('techmart-cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('cart-updated'));
  toast(`${product.name} added to cart`, 'success');
}

const LOW_STOCK_THRESHOLD = 5;
const CART_KEY = 'techmart-cart';

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

export default function ProductsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#86868b' }}>Loading products...</p></div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredHeart, setHoveredHeart] = useState(null);
  const [hoveredCompare, setHoveredCompare] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [wishlistedIds, setWishlistedIds] = useState(new Set());
  const [cartProductIds, setCartProductIds] = useState(new Set());
  const [quickAddProduct, setQuickAddProduct] = useState(null);
  const [quickAddColor, setQuickAddColor] = useState(null);
  const [quickAddStorage, setQuickAddStorage] = useState(null);
  const [quickAddQuantity, setQuickAddQuantity] = useState(1);

  useEffect(() => {
    function syncCart() {
      try {
        const cart = JSON.parse(localStorage.getItem('techmart-cart') || '[]');
        setCartProductIds(new Set(cart.map(item => item.productId)));
      } catch { setCartProductIds(new Set()); }
    }
    syncCart();
    window.addEventListener('cart-updated', syncCart);
    window.addEventListener('storage', syncCart);
    return () => { window.removeEventListener('cart-updated', syncCart); window.removeEventListener('storage', syncCart); };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('techmart-compare');
      if (stored) {
        const ids = JSON.parse(stored);
        if (Array.isArray(ids)) setCompareIds(ids.slice(0, 3));
      }
    } catch {}
  }, []);

  useEffect(() => {
    async function fetchWishlist() {
      try {
        const res = await fetch('/api/wishlist');
        if (res.ok) {
          const data = await res.json();
          setWishlistedIds(new Set((data.wishlist || []).map(p => p._id)));
        }
      } catch {}
    }
    fetchWishlist();
  }, []);

  async function toggleWishlist(productId) {
    const isWishlisted = wishlistedIds.has(productId);
    try {
      const res = await fetch('/api/wishlist', {
        method: isWishlisted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (res.status === 401) { showToast('Sign in to use wishlist'); return; }
      const data = await res.json();
      setWishlistedIds(prev => {
        const next = new Set(prev);
        if (isWishlisted) next.delete(productId);
        else next.add(productId);
        return next;
      });
      showToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success');
    } catch { showToast('Something went wrong'); }
  }

  function toggleCompare(product) {
    setCompareIds((prev) => {
      if (prev.includes(product._id)) {
        const updated = prev.filter((id) => id !== product._id);
        localStorage.setItem('techmart-compare', JSON.stringify(updated));
        showToast('Removed from compare', 'info');
        return updated;
      }
      if (prev.length >= 3) {
        showToast('You can compare up to 3 products', 'warning');
        return prev;
      }
      if (prev.length > 0) {
        const existingProduct = products.find((p) => p._id === prev[0]);
        if (existingProduct && existingProduct.category !== product.category) {
          showToast(`You can only compare products in the same category (${existingProduct.category})`, 'warning');
          return prev;
        }
      }
      const updated = [...prev, product._id];
      localStorage.setItem('techmart-compare', JSON.stringify(updated));
      showToast(`${product.name} added to compare`, 'success');
      return updated;
    });
  }

  useEffect(() => {
    function onScroll() {
      setShowBackToTop(window.scrollY > 600);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) setSelectedCategory(catParam);
  }, [searchParams]);

  const allCategories = useMemo(
    () => ['All', ...([...new Set(products.map((p) => p.category).filter(Boolean))].sort())],
    [products]
  );

  function handleAddToCartClick(product) {
    const hasMultipleColors = (product.colors?.length || 0) > 1;
    const hasMultipleStorage = (product.storageOptions?.length || 0) > 1;
    if (hasMultipleColors || hasMultipleStorage) {
      setQuickAddProduct(product);
      setQuickAddColor(product.colors?.[0]?.name || null);
      setQuickAddStorage(product.storageOptions?.[0] || null);
      setQuickAddQuantity(1);
    } else {
      addToCart(product, showToast);
    }
  }

  function closeQuickAdd() {
    setQuickAddProduct(null);
    setQuickAddColor(null);
    setQuickAddStorage(null);
    setQuickAddQuantity(1);
  }

  const quickAddVariant = useMemo(() => {
    if (!quickAddProduct?.variants) return null;
    return (
      quickAddProduct.variants.find(
        (v) => v.color === quickAddColor && v.storage === quickAddStorage
      ) || null
    );
  }, [quickAddProduct, quickAddColor, quickAddStorage]);

  const quickAddStockStatus = useMemo(() => {
    if (!quickAddVariant) return { label: 'Unavailable', color: C.muted, bg: '#f0f0f0', dot: C.muted };
    if (quickAddVariant.stock === 0)
      return { label: 'Out of Stock', color: C.red, bg: C.redBg, dot: C.red };
    if (quickAddVariant.stock <= LOW_STOCK_THRESHOLD)
      return { label: `Low Stock (${quickAddVariant.stock} left)`, color: C.orange, bg: C.orangeBg, dot: C.orange };
    return { label: `In Stock (${quickAddVariant.stock} available)`, color: C.green, bg: C.greenBg, dot: C.green };
  }, [quickAddVariant]);

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

  const clearFilters = useCallback(() => {
    setSelectedCategory('All');
    setInStockOnly(false);
    setSearchQuery('');
    setSortBy('newest');
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (inStockOnly) {
      result = result.filter((p) => getTotalStock(p.variants) > 0);
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => getMinPrice(a.variants) - getMinPrice(b.variants));
        break;
      case 'price-desc':
        result.sort((a, b) => getMinPrice(b.variants) - getMinPrice(a.variants));
        break;
      case 'name-az':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'rating':
        result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    return result;
  }, [products, searchQuery, selectedCategory, inStockOnly, sortBy]);

  const sortLabels = {
    newest: 'Newest',
    'price-asc': 'Price: Low to High',
    'price-desc': 'Price: High to Low',
    'name-az': 'Name A-Z',
    rating: 'Top Rated',
  };

  const hasActiveFilters =
    selectedCategory !== 'All' || inStockOnly || searchQuery.trim() !== '';

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '3rem 2rem 6rem',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: C.text,
              margin: '0 0 0.5rem',
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
            }}
          >
            Products
          </h1>
          <p
            style={{
              fontSize: '1.125rem',
              color: C.muted,
              margin: 0,
              fontWeight: 400,
            }}
          >
            {loading
              ? 'Loading our collection...'
              : `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {/* Search Bar */}
        <div
          style={{
            maxWidth: '680px',
            margin: '0 auto 2rem',
            position: 'sticky',
            top: 48,
            zIndex: 50,
            padding: '0.75rem 1rem',
            background: 'rgba(245,245,247,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ position: 'relative' }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '1.25rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: searchFocused ? C.blue : C.muted,
                pointerEvents: 'none',
                transition: 'color 0.25s ease',
              }}
            />
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                width: '100%',
                height: '52px',
                padding: '0 1.25rem 0 3.25rem',
                borderRadius: '980px',
                border: searchFocused ? `2px solid ${C.blue}` : '1px solid transparent',
                background: searchFocused ? C.card : 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                color: C.text,
                fontSize: '1rem',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                boxShadow: searchFocused
                  ? '0 0 0 4px rgba(0,113,227,0.12), 0 4px 20px rgba(0,0,0,0.06)'
                  : '0 1px 3px rgba(0,0,0,0.04)',
                boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: C.muted,
                  padding: 0,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {/* Category Pills */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {allCategories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '980px',
                    border: 'none',
                    background: isActive ? C.text : 'rgba(255,255,255,0.72)',
                    backdropFilter: isActive ? 'none' : 'blur(20px)',
                    WebkitBackdropFilter: isActive ? 'none' : 'blur(20px)',
                    color: isActive ? '#ffffff' : C.text,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    boxShadow: isActive
                      ? '0 2px 8px rgba(0,0,0,0.15)'
                      : '0 1px 3px rgba(0,0,0,0.04)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div
            style={{
              width: '1px',
              height: '24px',
              background: C.border,
              flexShrink: 0,
            }}
          />

          {/* In Stock Toggle */}
          <button
            onClick={() => setInStockOnly(!inStockOnly)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '980px',
              border: 'none',
              background: inStockOnly ? 'rgba(48,209,88,0.12)' : 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              color: inStockOnly ? C.green : C.muted,
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.25s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: inStockOnly ? C.green : '#d2d2d7',
                transition: 'background 0.25s ease',
              }}
            />
            In Stock
          </button>

          {/* Sort Dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '980px',
                border: 'none',
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                color: C.text,
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                whiteSpace: 'nowrap',
                transition: 'all 0.25s ease',
              }}
            >
              {sortLabels[sortBy]}
              <ChevronDown
                size={14}
                style={{
                  transition: 'transform 0.25s ease',
                  transform: showSortDropdown ? 'rotate(180deg)' : 'rotate(0)',
                  color: C.muted,
                }}
              />
            </button>
            {showSortDropdown && (
              <>
                <div
                  onClick={() => setShowSortDropdown(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    right: 0,
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'saturate(180%) blur(20px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                    borderRadius: '16px',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    zIndex: 20,
                    minWidth: '220px',
                    padding: '0.375rem',
                  }}
                >
                  {Object.entries(sortLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSortBy(key);
                        setShowSortDropdown(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.625rem 1rem',
                        border: 'none',
                        borderRadius: '10px',
                        background: sortBy === key ? C.blueBg : 'transparent',
                        color: sortBy === key ? C.blue : C.text,
                        fontSize: '0.875rem',
                        fontWeight: sortBy === key ? 600 : 400,
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (sortBy !== key) e.target.style.background = '#f5f5f7';
                      }}
                      onMouseLeave={(e) => {
                        if (sortBy !== key) e.target.style.background = 'transparent';
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                borderRadius: '980px',
                border: 'none',
                background: 'rgba(255,69,58,0.08)',
                color: C.red,
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div
            className="products-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.5rem',
            }}
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                style={{
                  background: C.card,
                  borderRadius: '20px',
                  height: '460px',
                  animation: 'pulse 1.8s ease-in-out infinite',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '5rem 2rem',
              background: C.card,
              borderRadius: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <Package size={64} style={{ color: '#d2d2d7', marginBottom: '1.5rem' }} />
            <h3
              style={{
                fontSize: '1.375rem',
                fontWeight: 600,
                color: C.text,
                margin: '0 0 0.5rem',
                letterSpacing: '-0.02em',
              }}
            >
              No products found
            </h3>
            <p
              style={{
                color: C.muted,
                fontSize: '1rem',
                margin: '0 0 2rem',
                maxWidth: '400px',
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: 1.5,
              }}
            >
              We couldn't find anything matching your criteria. Try adjusting your filters.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  padding: '0.75rem 2rem',
                  borderRadius: '980px',
                  border: 'none',
                  background: C.blue,
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.04)';
                  e.target.style.boxShadow = '0 4px 16px rgba(0,113,227,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div
            className="products-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.5rem',
            }}
          >
            {filteredProducts.map((product) => {
              const minPrice = getMinPrice(product.variants);
              const totalStock = getTotalStock(product.variants);
              const isHovered = hoveredCard === product._id;

              return (
                <div
                  key={product._id}
                  onMouseEnter={() => setHoveredCard(product._id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: C.card,
                    borderRadius: '20px',
                    overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                    boxShadow: isHovered
                      ? '0 20px 60px rgba(0,0,0,0.12)'
                      : '0 1px 3px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  {/* Image Area */}
                  <Link
                    href={`/products/${product._id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1',
                        background: '#fafafa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={300}
                          height={300}
                          style={{
                            objectFit: 'contain',
                            padding: '2rem',
                            transition: 'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
                            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                            width: '100%',
                            height: '100%',
                          }}
                        />
                      ) : (
                        <Package size={56} color="#d2d2d7" />
                      )}

                      {/* Compare Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleCompare(product);
                        }}
                        onMouseEnter={() => setHoveredCompare(product._id)}
                        onMouseLeave={() => setHoveredCompare(null)}
                        title={compareIds.includes(product._id) ? 'Remove from compare' : 'Add to compare'}
                        style={{
                          position: 'absolute',
                          top: '0.875rem',
                          right: '3.25rem',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: 'none',
                          background: compareIds.includes(product._id)
                            ? C.blue
                            : hoveredCompare === product._id
                              ? 'rgba(0,113,227,0.12)'
                              : 'rgba(255,255,255,0.85)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          transform: hoveredCompare === product._id ? 'scale(1.1)' : 'scale(1)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          padding: 0,
                          zIndex: 2,
                        }}
                      >
                        <GitCompareArrows
                          size={16}
                          stroke={compareIds.includes(product._id) ? '#fff' : hoveredCompare === product._id ? C.blue : C.muted}
                          strokeWidth={1.5}
                        />
                      </button>

                      {/* Wishlist Heart */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist(product._id);
                        }}
                        onMouseEnter={() => setHoveredHeart(product._id)}
                        onMouseLeave={() => setHoveredHeart(null)}
                        style={{
                          position: 'absolute',
                          top: '0.875rem',
                          right: '0.875rem',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: 'none',
                          background: wishlistedIds.has(product._id)
                            ? 'rgba(255,69,58,0.12)'
                            : hoveredHeart === product._id
                              ? 'rgba(255,69,58,0.12)'
                              : 'rgba(255,255,255,0.85)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          transform: hoveredHeart === product._id ? 'scale(1.1)' : 'scale(1)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          padding: 0,
                          zIndex: 2,
                        }}
                      >
                        <Heart
                          size={16}
                          stroke={wishlistedIds.has(product._id) ? C.red : hoveredHeart === product._id ? C.red : C.muted}
                          fill={wishlistedIds.has(product._id) ? C.red : hoveredHeart === product._id ? C.red : 'none'}
                          strokeWidth={1.5}
                        />
                      </button>
                    </div>
                  </Link>

                  {/* Details */}
                  <div
                    style={{
                      padding: '1.125rem 1.25rem 1.375rem',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Link
                      href={`/products/${product._id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      {product.category && (
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            color: C.blue,
                            background: C.blueBg,
                            padding: '0.2rem 0.625rem',
                            borderRadius: '980px',
                            marginBottom: '0.5rem',
                          }}
                        >
                          {product.category}
                        </span>
                      )}
                      <h3
                        style={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: C.text,
                          margin: '0 0 0.375rem',
                          letterSpacing: '-0.02em',
                          lineHeight: 1.3,
                        }}
                      >
                        {product.name}
                      </h3>
                    </Link>

                    {/* Rating */}
                    {product.reviewCount > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          marginBottom: '0.625rem',
                        }}
                      >
                        <StarRating rating={product.averageRating} size={12} />
                        <span style={{ fontSize: '0.75rem', color: C.muted, fontWeight: 500 }}>
                          ({product.reviewCount})
                        </span>
                      </div>
                    )}

                    {/* Color Swatches */}
                    {product.colors && product.colors.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.25rem',
                          marginBottom: '0.75rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        {product.colors.map((color, i) => (
                          <span
                            key={i}
                            title={color.name}
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: color.hex || '#ccc',
                              border: '1.5px solid #ffffff',
                              boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Price Row */}
                    <div
                      style={{
                        marginTop: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: C.text,
                          margin: 0,
                          letterSpacing: '-0.02em',
                          flex: 1,
                        }}
                      >
                        {'₦'}{formatPrice(minPrice)}
                      </p>

                      {/* Stock Dot */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.6875rem',
                          fontWeight: 500,
                          color: totalStock > 10 ? C.green : totalStock > 0 ? C.orange : C.red,
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background:
                              totalStock > 10 ? C.green : totalStock > 0 ? C.orange : C.red,
                          }}
                        />
                        {totalStock > 10
                          ? 'In Stock'
                          : totalStock > 0
                          ? `${totalStock} left`
                          : 'Sold Out'}
                      </span>
                    </div>

                    {/* Add to Cart */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToCartClick(product);
                      }}
                      disabled={totalStock === 0}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        padding: '0.625rem',
                        marginTop: '0.875rem',
                        borderRadius: '980px',
                        border: 'none',
                        background: totalStock === 0 ? '#e8e8ed' : C.blue,
                        color: totalStock === 0 ? C.muted : '#ffffff',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: totalStock === 0 ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
                        opacity: 1,
                        transform: 'translateY(0)',
                        pointerEvents: 'auto',
                      }}
                    >
                      <ShoppingBag size={14} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compare Bar */}
      {compareIds.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(29,29,31,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '0.875rem 1.5rem',
          zIndex: 99,
          animation: 'slideUp 0.3s ease-out',
        }}>
          <div style={{
            maxWidth: 1200, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <GitCompareArrows size={20} color="#fff" />
              <span style={{ color: '#fff', fontSize: '0.9375rem', fontWeight: 500 }}>
                {compareIds.length} of 3 selected
              </span>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: i < compareIds.length ? C.blue : 'rgba(255,255,255,0.2)',
                    transition: 'background 0.2s',
                  }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setCompareIds([]);
                  localStorage.removeItem('techmart-compare');
                }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 980, padding: '0.5rem 1rem',
                  color: '#fff', fontSize: '0.8125rem', fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Clear
              </button>
              <button
                onClick={() => router.push('/compare')}
                disabled={compareIds.length < 2}
                style={{
                  background: compareIds.length < 2 ? 'rgba(255,255,255,0.1)' : C.blue,
                  border: 'none',
                  borderRadius: 980, padding: '0.5rem 1.25rem',
                  color: '#fff', fontSize: '0.8125rem', fontWeight: 600,
                  cursor: compareIds.length < 2 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  opacity: compareIds.length < 2 ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                Compare <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back to Top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'rgba(29,29,31,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
          opacity: showBackToTop ? 1 : 0,
          transform: showBackToTop ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.8)',
          pointerEvents: showBackToTop ? 'auto' : 'none',
          zIndex: 100,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = C.blue;
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,113,227,0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(29,29,31,0.85)';
          e.currentTarget.style.transform = showBackToTop ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.8)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>

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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (max-width: 768px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
}
