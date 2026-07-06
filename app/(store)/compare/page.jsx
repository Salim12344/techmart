// app/(store)/compare/page.jsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, ShoppingBag, ArrowLeft, GitCompareArrows } from 'lucide-react';
import { useToast } from '@/app/components/Toast';
import { formatPrice } from '@/lib/formatPrice';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  inputBorder: '#d2d2d7', red: '#ff453a', green: '#30d158',
  orange: '#ff9f0a', greenBg: 'rgba(48,209,88,0.1)',
  orangeBg: 'rgba(255,159,10,0.1)', redBg: 'rgba(255,69,58,0.08)',
  blueBg: 'rgba(0,113,227,0.08)',
};

const DIFF_BG = 'rgba(255,159,10,0.06)';

export default function ComparePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShowBackToTop(window.scrollY > 400);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Load compare IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('techmart-compare');
      if (stored) {
        const ids = JSON.parse(stored);
        if (Array.isArray(ids)) setCompareIds(ids.slice(0, 3));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Fetch product details
  useEffect(() => {
    if (compareIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        const allProducts = data.products || [];
        const matched = compareIds
          .map((id) => allProducts.find((p) => p._id === id))
          .filter(Boolean);
        setProducts(matched);
      } catch (err) {
        showToast('Unable to load products right now');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [compareIds]);

  const removeProduct = (id) => {
    const updated = compareIds.filter((cid) => cid !== id);
    setCompareIds(updated);
    localStorage.setItem('techmart-compare', JSON.stringify(updated));
    if (updated.length === 0) setProducts([]);
  };

  const clearAll = () => {
    setCompareIds([]);
    setProducts([]);
    localStorage.removeItem('techmart-compare');
    showToast('Comparison cleared', 'success');
  };

  const addToCart = (product) => {
    const firstVariant = product.variants?.find((v) => v.stock > 0);
    if (!firstVariant) {
      showToast('No available variants in stock');
      return;
    }

    try {
      const stored = localStorage.getItem('techmart-cart');
      const cart = stored ? JSON.parse(stored) : [];
      const existingIndex = cart.findIndex((item) => item.sku === firstVariant.sku);

      if (existingIndex >= 0) {
        if (cart[existingIndex].quantity >= firstVariant.stock) {
          showToast(`Only ${firstVariant.stock} in stock`, 'error');
          return;
        }
        cart[existingIndex].quantity += 1;
      } else {
        cart.push({
          productId: product._id,
          name: product.name,
          image: product.colors?.find((c) => c.name === firstVariant.color)?.image || product.image,
          color: firstVariant.color,
          storage: firstVariant.storage,
          sku: firstVariant.sku,
          price: firstVariant.price,
          quantity: 1,
        });
      }

      localStorage.setItem('techmart-cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cart-updated'));
      showToast(`${product.name} added to cart`, 'success');
    } catch {
      showToast('Unable to add to cart right now');
    }
  };

  // Check for category mismatch
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );
  const hasCategoryMismatch = categories.length > 1;

  // Collect all spec keys across products
  const allSpecKeys = useMemo(() => {
    const keys = new Map();
    products.forEach((p) => {
      if (p.specs) {
        Object.keys(p.specs).forEach((key) => {
          if (!keys.has(key)) {
            // Try to make a nice label from the key
            const label = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (s) => s.toUpperCase())
              .trim();
            keys.set(key, label);
          }
        });
      }
    });
    return keys;
  }, [products]);

  // Helper to check if values differ across products for a row
  const valuesDiffer = (values) => {
    const nonEmpty = values.filter((v) => v !== undefined && v !== null && v !== '' && v !== '-');
    if (nonEmpty.length <= 1) return false;
    return new Set(nonEmpty.map((v) => String(v).toLowerCase())).size > 1;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.muted, fontSize: '0.9375rem' }}>Loading comparison...</p>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px',
          background: C.blueBg, display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 1.5rem',
        }}>
          <GitCompareArrows size={28} color={C.blue} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: C.text, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
          No products to compare
        </h1>
        <p style={{ fontSize: '0.9375rem', color: C.muted, margin: '0 0 2rem', lineHeight: 1.5 }}>
          Add products to compare from the product listing page
        </p>
        <Link href="/products" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: C.blue, color: '#fff', border: 'none',
            borderRadius: '980px', padding: '0.75rem 1.5rem',
            fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <ArrowLeft size={16} />
            Browse Products
          </button>
        </Link>
      </div>
    );
  }

  // Helper to get starting price
  const getStartingPrice = (product) => {
    if (!product.variants || product.variants.length === 0) return 0;
    return Math.min(...product.variants.map((v) => v.price).filter(Boolean));
  };

  // Helper to get total stock
  const getTotalStock = (product) => {
    return product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
  };

  // Build comparison rows
  const buildRows = () => {
    const rows = [];

    rows.push({
      label: 'Category',
      values: products.map((p) => p.category || '-'),
    });

    rows.push({
      label: 'Starting Price',
      values: products.map((p) => {
        const price = getStartingPrice(p);
        return price ? formatPrice(price) : '-';
      }),
    });

    rows.push({
      label: 'Colors Available',
      values: products.map((p) =>
        p.colors && p.colors.length > 0
          ? p.colors.map((c) => c.name).join(', ')
          : '-'
      ),
    });

    rows.push({
      label: 'Storage Options',
      values: products.map((p) =>
        p.storageOptions && p.storageOptions.length > 0
          ? p.storageOptions.join(', ')
          : '-'
      ),
    });

    // Dynamic spec fields
    allSpecKeys.forEach((specLabel, specKey) => {
      rows.push({
        label: specLabel,
        values: products.map((p) => p.specs?.[specKey] || '-'),
      });
    });

    rows.push({
      label: 'Warranty',
      values: products.map((p) => p.warranty || '-'),
    });

    rows.push({
      label: 'Average Rating',
      values: products.map((p) =>
        p.averageRating
          ? `${p.averageRating.toFixed(1)} / 5 (${p.reviewCount || 0} reviews)`
          : 'No ratings yet'
      ),
    });

    rows.push({
      label: 'Stock Status',
      values: products.map((p) => {
        const total = getTotalStock(p);
        if (total === 0) return 'Out of Stock';
        if (total <= 5) return `Low Stock (${total})`;
        return `In Stock (${total})`;
      }),
    });

    return rows;
  };

  const rows = buildRows();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none', border: 'none', color: C.blue,
              cursor: 'pointer', fontSize: '0.9375rem', fontFamily: 'inherit',
              padding: 0, display: 'flex', alignItems: 'center', gap: '0.25rem',
              marginBottom: '0.75rem',
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 style={{
            fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em',
            color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '0.625rem',
          }}>
            <GitCompareArrows size={28} />
            Compare Products
          </h1>
          <p style={{ color: C.muted, marginTop: '0.25rem', fontSize: '0.9375rem' }}>
            Comparing {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={clearAll}
          style={{
            background: C.redBg, color: C.red, border: 'none',
            borderRadius: '980px', padding: '0.5rem 1.25rem',
            fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.375rem',
          }}
        >
          <X size={14} /> Clear All
        </button>
      </div>

      {/* Category mismatch warning */}
      {hasCategoryMismatch && (
        <div style={{
          background: C.orangeBg, border: `1px solid ${C.orange}33`,
          borderRadius: '12px', padding: '0.875rem 1rem',
          marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.625rem',
        }}>
          <span style={{ fontSize: '0.9375rem', color: C.orange, fontWeight: 500 }}>
            These products are from different categories ({categories.join(', ')}). Comparison may not be fully meaningful.
          </span>
        </div>
      )}

      {/* Comparison table - desktop */}
      <div className="compare-table-wrapper" style={{
        background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            {/* Product header row */}
            <thead>
              <tr>
                <th style={{
                  padding: '1.5rem 1rem', textAlign: 'left', borderBottom: `1px solid ${C.border}`,
                  background: C.bg, width: '180px', verticalAlign: 'top',
                  fontSize: '0.75rem', fontWeight: 600, color: C.muted,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  position: 'sticky', left: 0, zIndex: 2,
                }}>
                  Product
                </th>
                {products.map((product) => (
                  <th key={product._id} style={{
                    padding: '1.5rem 1rem', textAlign: 'center',
                    borderBottom: `1px solid ${C.border}`, background: C.bg,
                    verticalAlign: 'top', minWidth: '200px',
                  }}>
                    {/* Remove button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                      <button
                        onClick={() => removeProduct(product._id)}
                        style={{
                          background: C.redBg, border: 'none', borderRadius: '50%',
                          width: '28px', height: '28px', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: C.red,
                        }}
                        title="Remove from comparison"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Product image */}
                    {product.image && (
                      <div style={{
                        width: '120px', height: '120px', margin: '0 auto 0.75rem',
                        borderRadius: '16px', overflow: 'hidden',
                        border: `1px solid ${C.border}`, background: C.card,
                      }}>
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={120}
                          height={120}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}

                    {/* Product name */}
                    <p style={{
                      fontWeight: 700, fontSize: '1rem', color: C.text,
                      margin: '0 0 0.375rem', letterSpacing: '-0.01em',
                    }}>
                      {product.name}
                    </p>

                    {/* Starting price */}
                    <p style={{
                      fontSize: '0.9375rem', fontWeight: 600, color: C.blue,
                      margin: '0 0 0.75rem',
                    }}>
                      From {formatPrice(getStartingPrice(product))}
                    </p>

                    {/* Add to Cart button */}
                    <button
                      onClick={() => addToCart(product)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                        background: C.blue, color: '#fff', border: 'none',
                        borderRadius: '980px', padding: '0.5rem 1rem',
                        fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <ShoppingBag size={14} /> Add to Cart
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Comparison rows */}
            <tbody>
              {rows.map((row, i) => {
                const differs = valuesDiffer(row.values);
                return (
                  <tr key={i}>
                    <td style={{
                      padding: '0.875rem 1rem',
                      fontSize: '0.8125rem', fontWeight: 600, color: C.muted,
                      textTransform: 'uppercase', letterSpacing: '0.03em',
                      borderBottom: `1px solid ${C.bg}`,
                      background: differs ? DIFF_BG : C.card,
                      position: 'sticky', left: 0, zIndex: 1,
                    }}>
                      {row.label}
                    </td>
                    {row.values.map((value, j) => {
                      // Determine stock status styling
                      let valueColor = C.text;
                      if (row.label === 'Stock Status') {
                        if (value.startsWith('Out')) valueColor = C.red;
                        else if (value.startsWith('Low')) valueColor = C.orange;
                        else if (value.startsWith('In')) valueColor = C.green;
                      }

                      return (
                        <td key={j} style={{
                          padding: '0.875rem 1rem',
                          fontSize: '0.9375rem', color: valueColor,
                          textAlign: 'center',
                          borderBottom: `1px solid ${C.bg}`,
                          background: differs ? DIFF_BG : C.card,
                          fontWeight: row.label === 'Starting Price' ? 600 : 400,
                        }}>
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile stacked card view */}
      <div className="compare-mobile" style={{ display: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {products.map((product, pIndex) => (
            <div key={product._id} style={{
              background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
              overflow: 'hidden',
            }}>
              {/* Card header */}
              <div style={{
                padding: '1.25rem', background: C.bg,
                borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: '1rem',
              }}>
                {/* Product image */}
                {product.image && (
                  <div style={{
                    width: '80px', height: '80px', flexShrink: 0,
                    borderRadius: '14px', overflow: 'hidden',
                    border: `1px solid ${C.border}`, background: C.card,
                  }}>
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={80}
                      height={80}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontWeight: 700, fontSize: '1rem', color: C.text,
                    margin: '0 0 0.25rem', letterSpacing: '-0.01em',
                  }}>
                    {product.name}
                  </p>
                  <p style={{
                    fontSize: '1rem', fontWeight: 600, color: C.blue,
                    margin: '0 0 0.625rem',
                  }}>
                    From ₦{getStartingPrice(product).toLocaleString()}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => addToCart(product)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                        background: C.blue, color: '#fff', border: 'none',
                        borderRadius: '980px', padding: '0.5rem 1rem',
                        fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <ShoppingBag size={14} /> Add to Cart
                    </button>
                    <button
                      onClick={() => removeProduct(product._id)}
                      style={{
                        background: C.redBg, border: 'none', borderRadius: '50%',
                        width: '28px', height: '28px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: C.red, flexShrink: 0,
                      }}
                      title="Remove from comparison"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Spec rows */}
              <div style={{ padding: '0.5rem 0' }}>
                {rows.map((row, i) => {
                  let valueColor = C.text;
                  const value = row.values[pIndex];
                  if (row.label === 'Stock Status') {
                    if (typeof value === 'string' && value.startsWith('Out')) valueColor = C.red;
                    else if (typeof value === 'string' && value.startsWith('Low')) valueColor = C.orange;
                    else if (typeof value === 'string' && value.startsWith('In')) valueColor = C.green;
                  }
                  return (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '0.625rem 1.25rem',
                      borderBottom: i < rows.length - 1 ? `1px solid ${C.bg}` : 'none',
                    }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600, color: C.muted,
                        textTransform: 'uppercase', letterSpacing: '0.03em',
                      }}>
                        {row.label}
                      </span>
                      <span style={{
                        fontSize: '0.875rem', color: valueColor,
                        fontWeight: row.label === 'Starting Price' ? 600 : 400,
                        textAlign: 'right', maxWidth: '55%',
                      }}>
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .compare-table-wrapper {
            display: none !important;
          }
          .compare-mobile {
            display: block !important;
          }
        }
      `}</style>

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
    </div>
  );
}
