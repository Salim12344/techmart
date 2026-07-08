'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Lock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '@/app/components/Toast';
import { useConfirm } from '@/app/components/ConfirmDialog';
import { getCart, saveCart } from '@/lib/cart';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  green: '#30d158', orange: '#ff9f0a', red: '#ff453a',
};

const DELIVERY_FEE = 3500;
const FREE_DELIVERY_THRESHOLD = 500000;

function formatPrice(amount) {
  return '₦' + Number(amount).toLocaleString('en-NG');
}

export default function CartPage() {
  const { status } = useSession();
  const [cart, setCart] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [stockMap, setStockMap] = useState({});
  const [stockChecked, setStockChecked] = useState(false);
  const { showToast } = useToast();
  const confirmAction = useConfirm();

  useEffect(() => {
    if (status === 'loading') return;
    let cancelled = false;
    getCart(status).then((items) => {
      if (!cancelled) {
        setCart(items);
        setLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, [status]);

  // Fetch current stock levels and clamp quantities that exceed them. Items
  // that have sold out entirely are kept (not removed) and flagged as out of
  // stock in the UI instead - see rendering below.
  useEffect(() => {
    if (!loaded || cart.length === 0) return;
    let cancelled = false;
    async function fetchStock() {
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const products = data.products || [];
        const map = {};
        products.forEach((p) => {
          (p.variants || []).forEach((v) => {
            if (v.sku) map[v.sku] = v.stock;
          });
        });
        if (cancelled) return;
        setStockMap(map);
        setStockChecked(true);

        // Clamp quantities that exceed current stock, but keep out-of-stock
        // items in the cart (quantity floored at 1) so the user can see them.
        let changed = false;
        const clamped = cart.map((item) => {
          const stock = map[item.sku];
          if (stock !== undefined && stock > 0 && item.quantity > stock) {
            changed = true;
            showToast(`Reduced quantity for ${item.name} - only ${stock} in stock`, 'warning');
            return { ...item, quantity: stock };
          }
          return item;
        });

        if (changed) {
          setCart(clamped);
          saveCart(clamped, status);
        }
      } catch {
        // ignore - stock check is best-effort
      }
    }
    fetchStock();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  function persist(updated) {
    setCart(updated);
    saveCart(updated, status);
  }

  function updateQuantity(index, delta) {
    const item = cart[index];
    if (delta > 0) {
      const stock = stockChecked ? (stockMap[item.sku] ?? 0) : Infinity;
      if (item.quantity >= stock) {
        showToast(`Only ${stock} in stock`, 'error');
        return;
      }
    }
    const updated = cart.map((item, i) => {
      if (i !== index) return item;
      const newQty = item.quantity + delta;
      if (newQty < 1) return item;
      return { ...item, quantity: newQty };
    });
    persist(updated);
  }

  async function removeItem(index) {
    if (!(await confirmAction('Remove this item from your bag?'))) return;
    const updated = cart.filter((_, i) => i !== index);
    persist(updated);
    showToast('Item removed from your bag', 'success');
  }

  if (!loaded) {
    return (
      <div style={{
        minHeight: '80vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: C.bg,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: `3px solid ${C.border}`,
            borderTopColor: C.blue, borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem',
          }} />
          <p style={{ color: C.muted, fontSize: '0.9375rem', margin: 0 }}>Loading your bag...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div style={{
        minHeight: '80vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: C.bg,
        padding: '2rem',
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.card} 0%, #f0f0f2 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '2rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          <ShoppingBag size={48} strokeWidth={1.2} color={C.muted} />
        </div>
        <h2 style={{
          fontSize: '1.75rem', fontWeight: 700, color: C.text,
          margin: '0 0 0.625rem', letterSpacing: '-0.025em',
        }}>
          Your bag is empty
        </h2>
        <p style={{
          fontSize: '1.0625rem', color: C.muted, margin: '0 0 2rem',
          maxWidth: 340, textAlign: 'center', lineHeight: 1.5,
        }}>
          Looks like you haven&apos;t added anything yet. Browse our collection to find something you love.
        </p>
        <Link href="/products" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.875rem 2rem', borderRadius: '980px',
          background: C.blue, color: '#ffffff', textDecoration: 'none',
          fontSize: '1rem', fontWeight: 500, border: 'none',
          transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
          boxShadow: '0 2px 8px rgba(0,113,227,0.25)',
        }}>
          Continue Shopping
          <ArrowRight size={16} strokeWidth={2.5} />
        </Link>
      </div>
    );
  }

  const isOutOfStock = (item) => stockMap[item.sku] !== undefined && stockMap[item.sku] <= 0;
  const isDiscontinued = (item) => stockChecked && stockMap[item.sku] === undefined;
  const isUnavailable = (item) => isOutOfStock(item) || isDiscontinued(item);
  const availableItems = cart.filter((item) => !isUnavailable(item));
  const hasOutOfStockItems = availableItems.length !== cart.length;
  const subtotal = availableItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  const totalItems = availableItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <div className="cart-page-wrap" style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{
            fontSize: '2.5rem', fontWeight: 700, color: C.text,
            margin: 0, letterSpacing: '-0.035em',
            lineHeight: 1.1,
          }}>
            Your Bag
          </h1>
          <p style={{
            fontSize: '1.0625rem', color: C.muted,
            margin: '0.5rem 0 0', fontWeight: 400,
          }}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your bag
          </p>
        </div>

        {/* Main Layout */}
        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }} className="cart-layout">
          {/* Cart Items Column */}
          <div className="cart-items-column" style={{ flex: 1, minWidth: 0 }}>
            <AnimatePresence initial={false}>
            {cart.map((item, index) => (
              <motion.div
                key={`${item.productId}-${item.sku}`}
                layout
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -24, scale: 0.97 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="cart-item-row"
                style={{
                  display: 'flex', gap: '1.5rem', padding: '1.5rem',
                  width: '100%', boxSizing: 'border-box',
                  background: C.card, borderRadius: 16,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  marginBottom: '1rem',
                  opacity: isUnavailable(item) ? 0.6 : 1,
                  filter: isDiscontinued(item) ? 'blur(0.4px) grayscale(0.3)' : 'none',
                }}
              >
                {/* Product Image */}
                <Link href={`/products/${item.productId}?from=cart`} style={{
                  width: 80, height: 80, borderRadius: 12,
                  background: '#f5f5f7', flexShrink: 0, overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={80}
                      height={80}
                      style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                    />
                  ) : (
                    <ShoppingBag size={28} color={C.muted} strokeWidth={1.2} />
                  )}
                </Link>

                {/* Item Details */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  {/* Top Row: Name + Line Total */}
                  <div className="cart-item-details-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <Link href={`/products/${item.productId}?from=cart`} style={{ textDecoration: 'none' }}>
                        <h3 style={{
                          fontSize: '1.0625rem', fontWeight: 600, color: C.text,
                          margin: 0, letterSpacing: '-0.01em', lineHeight: 1.3,
                        }}>
                          {item.name}
                        </h3>
                      </Link>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        flexWrap: 'wrap', marginTop: '0.375rem',
                      }}>
                        {item.color && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                            fontSize: '0.8125rem', color: C.muted,
                          }}>
                            <span style={{
                              width: 10, height: 10, borderRadius: '50%',
                              background: item.color.toLowerCase(),
                              border: '1px solid rgba(0,0,0,0.1)',
                              flexShrink: 0,
                            }} />
                            {item.color}
                          </span>
                        )}
                        {item.storage && (
                          <span style={{
                            fontSize: '0.8125rem', color: C.muted,
                            background: '#f5f5f7', padding: '0.125rem 0.5rem',
                            borderRadius: 6,
                          }}>
                            {item.storage}
                          </span>
                        )}
                        {isOutOfStock(item) && (
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 600, color: C.red,
                            background: 'rgba(255,69,58,0.08)', padding: '0.1875rem 0.625rem',
                            borderRadius: 980,
                          }}>
                            Out of Stock
                          </span>
                        )}
                        {isDiscontinued(item) && (
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 600, color: C.muted,
                            background: '#f5f5f7', padding: '0.1875rem 0.625rem',
                            borderRadius: 980,
                          }}>
                            Sorry, we no longer sell this product
                          </span>
                        )}
                      </div>
                    </div>
                    <p style={{
                      fontSize: '1.0625rem', fontWeight: 700, color: C.text,
                      margin: 0, whiteSpace: 'nowrap',
                    }}>
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>

                  {/* Unit Price */}
                  <p style={{
                    fontSize: '0.875rem', color: C.muted, margin: '0.375rem 0 0',
                    fontWeight: 400,
                  }}>
                    {formatPrice(item.price)} each
                  </p>

                  {/* Bottom Row: Quantity + Remove */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: 'auto', paddingTop: '0.875rem',
                  }}>
                    {/* Quantity Controls */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center',
                      borderRadius: 980, background: '#f5f5f7',
                      overflow: 'hidden',
                    }}>
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        disabled={item.quantity <= 1 || isUnavailable(item)}
                        style={{
                          width: 36, height: 36, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          background: 'transparent', border: 'none',
                          cursor: (item.quantity <= 1 || isUnavailable(item)) ? 'not-allowed' : 'pointer',
                          color: (item.quantity <= 1 || isUnavailable(item)) ? C.border : C.text,
                          transition: 'all 0.2s ease',
                          opacity: (item.quantity <= 1 || isUnavailable(item)) ? 0.4 : 1,
                        }}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} strokeWidth={2.5} />
                      </button>
                      <span style={{
                        minWidth: 32, textAlign: 'center',
                        fontSize: '0.875rem', fontWeight: 600, color: C.text,
                        lineHeight: '36px', userSelect: 'none',
                      }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        disabled={isUnavailable(item)}
                        style={{
                          width: 36, height: 36, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          background: 'transparent', border: 'none',
                          cursor: isUnavailable(item) ? 'not-allowed' : 'pointer',
                          color: isUnavailable(item) ? C.border : C.text,
                          opacity: isUnavailable(item) ? 0.4 : 1,
                          transition: 'all 0.2s ease',
                        }}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(index)}
                      className="cart-remove-btn"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                        background: 'transparent', border: 'none',
                        color: C.muted, fontSize: '0.8125rem', fontWeight: 500,
                        cursor: 'pointer', padding: '0.5rem 0.625rem',
                        borderRadius: 10, transition: 'all 0.2s ease',
                        fontFamily: 'inherit',
                      }}
                    >
                      <Trash2 size={15} strokeWidth={1.8} />
                      Remove
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>

            {/* Continue Shopping Link */}
            <Link href="/products" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              color: C.blue, textDecoration: 'none', fontSize: '0.9375rem',
              fontWeight: 500, marginTop: '0.5rem', padding: '0.5rem 0',
              transition: 'opacity 0.2s',
            }}>
              Continue Shopping
              <ChevronRight size={16} strokeWidth={2} />
            </Link>
          </div>

          {/* Order Summary Sidebar */}
          <div style={{
            width: 380, flexShrink: 0,
            position: 'sticky', top: 80,
          }} className="cart-summary">
            <div style={{
              background: C.card, borderRadius: 20,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              padding: '1.75rem',
              transition: 'box-shadow 0.3s ease',
            }}>
              <h2 style={{
                fontSize: '1.25rem', fontWeight: 700, color: C.text,
                margin: '0 0 1.5rem', letterSpacing: '-0.02em',
              }}>
                Order Summary
              </h2>

              {/* Subtotal */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginBottom: '0.875rem',
              }}>
                <span style={{ fontSize: '0.9375rem', color: C.muted }}>
                  Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                </span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: C.text }}>
                  {formatPrice(subtotal)}
                </span>
              </div>

              {/* Delivery */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '0.875rem',
              }}>
                <span style={{ fontSize: '0.9375rem', color: C.muted }}>Delivery</span>
                {deliveryFee === 0 ? (
                  <span style={{
                    fontSize: '0.8125rem', fontWeight: 600, color: C.green,
                    background: 'rgba(48,209,88,0.1)', padding: '0.1875rem 0.625rem',
                    borderRadius: 980,
                  }}>
                    Free
                  </span>
                ) : (
                  <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: C.text }}>
                    {formatPrice(deliveryFee)}
                  </span>
                )}
              </div>

              {/* Free delivery hint */}
              {deliveryFee > 0 && (
                <div style={{
                  fontSize: '0.8125rem', color: C.muted, margin: '0 0 1rem',
                  padding: '0.75rem 1rem', background: '#f5f5f7',
                  borderRadius: 12, lineHeight: 1.5,
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <span style={{ fontSize: '1rem' }}>&#x1F69A;</span>
                  Free delivery on orders over {formatPrice(FREE_DELIVERY_THRESHOLD)}
                </div>
              )}

              {/* Divider + Total */}
              <div style={{
                borderTop: `1px solid ${C.border}`, paddingTop: '1.125rem',
                marginTop: '0.25rem', marginBottom: '1.75rem',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'baseline',
              }}>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: C.text }}>
                  Total
                </span>
                <span style={{
                  fontSize: '1.375rem', fontWeight: 700, color: C.blue,
                  letterSpacing: '-0.02em',
                }}>
                  {formatPrice(total)}
                </span>
              </div>

              {/* Out-of-stock hint */}
              {hasOutOfStockItems && (
                <p style={{
                  fontSize: '0.8125rem', color: C.red, margin: '0 0 0.875rem',
                  textAlign: 'center', lineHeight: 1.5,
                }}>
                  Remove the unavailable item{cart.length - availableItems.length > 1 ? 's' : ''} above to check out.
                </p>
              )}

              {/* Checkout Button */}
              {availableItems.length === 0 ? (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '100%', padding: '1rem', borderRadius: 980,
                  background: C.border, color: C.muted,
                  fontSize: '1.0625rem', fontWeight: 500,
                  letterSpacing: '-0.01em', boxSizing: 'border-box',
                  cursor: 'not-allowed',
                }}>
                  Checkout
                </div>
              ) : (
                <Link href="/checkout" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '100%', padding: '1rem', borderRadius: 980,
                  background: C.blue, color: '#ffffff', textDecoration: 'none',
                  fontSize: '1.0625rem', fontWeight: 500, border: 'none',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  letterSpacing: '-0.01em', boxSizing: 'border-box',
                  boxShadow: '0 2px 8px rgba(0,113,227,0.25)',
                }}>
                  Checkout
                </Link>
              )}

              {/* Continue Shopping */}
              <Link href="/products" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.25rem', width: '100%', padding: '0.75rem',
                marginTop: '0.875rem', borderRadius: 980,
                background: 'transparent', color: C.blue,
                textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500,
                border: 'none', transition: 'opacity 0.2s',
              }}>
                Continue Shopping
              </Link>

              {/* Security Badge */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.375rem', marginTop: '1.25rem', paddingTop: '1.25rem',
                borderTop: `1px solid ${C.border}`,
              }}>
                <Lock size={13} strokeWidth={2} color={C.muted} />
                <span style={{ fontSize: '0.75rem', color: C.muted, fontWeight: 500 }}>
                  Secure checkout
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animations and responsive styles */}
      <style>{`
        .cart-remove-btn:hover {
          color: ${C.red} !important;
          background: rgba(255,69,58,0.08) !important;
        }
        @media (max-width: 860px) {
          .cart-layout {
            flex-direction: column !important;
          }
          .cart-summary {
            width: 100% !important;
            position: static !important;
          }
          .cart-items-column {
            width: 100% !important;
          }
        }
        @media (max-width: 768px) {
          .cart-page-wrap { padding: 1.5rem 1rem 3rem !important; }
          .cart-page-wrap h1 { font-size: 1.75rem !important; }
          .cart-item-row { gap: 1rem !important; padding: 1rem !important; }
          .cart-item-details-top { flex-direction: column !important; gap: 0.25rem !important; }
        }
      `}</style>
    </div>
  );
}
