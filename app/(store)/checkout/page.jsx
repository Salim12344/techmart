'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, CreditCard, ArrowLeft, Truck, Lock, ShoppingBag, Check, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/app/components/Toast';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
  inputBorder: '#d2d2d7', red: '#ff453a', green: '#30d158',
  orange: '#ff9f0a',
};

const DELIVERY_FEE = 3500;
const FREE_DELIVERY_THRESHOLD = 500000;

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'Abuja',
];

function formatPrice(amount) {
  return '₦' + Number(amount).toLocaleString('en-NG');
}

const STEPS = [
  { num: 1, label: 'Shipping' },
  { num: 2, label: 'Review' },
  { num: 3, label: 'Confirm' },
];

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [cart, setCart] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
  });

  // Auth redirect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login?redirect=/checkout');
    }
  }, [status, router]);

  // Pre-fill name from session
  useEffect(() => {
    if (session?.user?.name) {
      setForm((prev) => ({ ...prev, fullName: prev.fullName || session.user.name }));
    }
  }, [session]);

  // Load cart
  useEffect(() => {
    try {
      const raw = localStorage.getItem('techmart-cart');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed);
          setLoaded(true);
          return;
        }
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  // Redirect if cart is empty (after load)
  useEffect(() => {
    if (loaded && cart.length === 0) {
      router.replace('/cart');
    }
  }, [loaded, cart, router]);

  function getInputStyle(fieldName) {
    const hasError = !!errors[fieldName];
    const isFocused = focusedField === fieldName;
    return {
      width: '100%',
      height: 52,
      padding: '0 1rem',
      borderRadius: 12,
      border: `1.5px solid ${hasError ? C.red : isFocused ? C.blue : C.inputBorder}`,
      fontSize: '1rem',
      color: C.text,
      background: C.card,
      outline: 'none',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      boxShadow: hasError
        ? '0 0 0 3px rgba(255,69,58,0.12)'
        : isFocused
          ? '0 0 0 3px rgba(0,113,227,0.15)'
          : 'none',
    };
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: C.muted,
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim()) { setCouponError('Please enter a coupon code'); return; }
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({ code: data.code, discountPercent: data.discountPercent });
        showToast(`Coupon applied! ${data.discountPercent}% off`, 'success');
      } else {
        setCouponError(data.error || 'Invalid coupon');
      }
    } catch {
      setCouponError('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  }

  function validate() {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (form.phone.replace(/\D/g, '').length !== 11) newErrors.phone = 'Phone number must be 11 digits';
    if (!form.street.trim()) newErrors.street = 'Street address is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.state) newErrors.state = 'Please select a state';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const body = {
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.name,
          color: item.color || '',
          storage: item.storage || '',
          sku: item.sku || '',
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        shippingAddress: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state,
          country: form.country,
        },
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
      };

      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start payment');
      }

      window.location.href = data.url;
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error');
      setSubmitting(false);
    }
  }

  // Loading / auth states
  if (status === 'loading' || !loaded || (loaded && cart.length === 0)) {
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
          <p style={{ color: C.muted, fontSize: '0.9375rem', margin: 0 }}>Preparing checkout...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedCoupon ? Math.round(subtotal * appliedCoupon.discountPercent / 100) : 0;
  const deliveryFee = subtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal - discountAmount + deliveryFee;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/cart" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            color: C.blue, textDecoration: 'none', fontSize: '0.875rem',
            fontWeight: 500, marginBottom: '1rem',
            transition: 'opacity 0.2s',
          }}>
            <ArrowLeft size={15} strokeWidth={2.5} />
            Back to Bag
          </Link>
          <h1 style={{
            fontSize: '2.5rem', fontWeight: 700, color: C.text,
            margin: '0.5rem 0 0', letterSpacing: '-0.035em', lineHeight: 1.1,
          }}>
            Checkout
          </h1>
        </div>


        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }} className="checkout-layout">

            {/* Left - Shipping Form */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                background: C.card, borderRadius: 20,
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                padding: '2rem',
              }}>
                {/* Section Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  marginBottom: '2rem', paddingBottom: '1.5rem',
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(0,113,227,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <MapPin size={20} strokeWidth={1.8} color={C.blue} />
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.1875rem', fontWeight: 700, color: C.text,
                      margin: 0, letterSpacing: '-0.02em',
                    }}>
                      Shipping Address
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: C.muted, margin: '0.125rem 0 0' }}>
                      Where should we deliver your order?
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Full Name */}
                  <div>
                    <label style={labelStyle} htmlFor="fullName">Full Name</label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('fullName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your full name"
                      style={getInputStyle('fullName')}
                    />
                    {errors.fullName && (
                      <p style={{ fontSize: '0.75rem', color: C.red, margin: '0.375rem 0 0', fontWeight: 500 }}>
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={labelStyle} htmlFor="phone">Phone Number</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      maxLength={11}
                      value={form.phone}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="+234 800 000 0000"
                      style={getInputStyle('phone')}
                    />
                    {errors.phone && (
                      <p style={{ fontSize: '0.75rem', color: C.red, margin: '0.375rem 0 0', fontWeight: 500 }}>
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Street */}
                  <div>
                    <label style={labelStyle} htmlFor="street">Street Address</label>
                    <input
                      id="street"
                      name="street"
                      type="text"
                      value={form.street}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('street')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="House number, street name"
                      style={getInputStyle('street')}
                    />
                    {errors.street && (
                      <p style={{ fontSize: '0.75rem', color: C.red, margin: '0.375rem 0 0', fontWeight: 500 }}>
                        {errors.street}
                      </p>
                    )}
                  </div>

                  {/* City + State Row */}
                  <div style={{ display: 'flex', gap: '1rem' }} className="checkout-city-state">
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle} htmlFor="city">City</label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        value={form.city}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('city')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Enter city"
                        style={getInputStyle('city')}
                      />
                      {errors.city && (
                        <p style={{ fontSize: '0.75rem', color: C.red, margin: '0.375rem 0 0', fontWeight: 500 }}>
                          {errors.city}
                        </p>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle} htmlFor="state">State</label>
                      <select
                        id="state"
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('state')}
                        onBlur={() => setFocusedField(null)}
                        style={{
                          ...getInputStyle('state'),
                          appearance: 'none',
                          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2386868b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 1rem center',
                          paddingRight: '2.5rem',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">Select state</option>
                        {NIGERIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {errors.state && (
                        <p style={{ fontSize: '0.75rem', color: C.red, margin: '0.375rem 0 0', fontWeight: 500 }}>
                          {errors.state}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label style={labelStyle} htmlFor="country">Country</label>
                    <input
                      id="country"
                      name="country"
                      type="text"
                      value={form.country}
                      readOnly
                      style={{
                        ...getInputStyle('country'),
                        background: '#f5f5f7',
                        color: C.muted,
                        cursor: 'not-allowed',
                        borderColor: C.border,
                        boxShadow: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Order Summary */}
            <div style={{ width: 400, flexShrink: 0 }} className="checkout-summary">
              <div style={{
                background: C.card, borderRadius: 20,
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                padding: '1.75rem',
                position: 'sticky', top: 80,
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: '1.5rem',
                }}>
                  <h2 style={{
                    fontSize: '1.1875rem', fontWeight: 700, color: C.text,
                    margin: 0, letterSpacing: '-0.02em',
                  }}>
                    In Your Bag
                  </h2>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 600, color: C.blue,
                    background: 'rgba(0,113,227,0.08)',
                    padding: '0.25rem 0.625rem', borderRadius: 980,
                  }}>
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Compact Items List */}
                <div style={{
                  marginBottom: '1.5rem',
                  maxHeight: 280, overflowY: 'auto',
                  paddingRight: 4,
                }}>
                  {cart.map((item, index) => (
                    <div key={index} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 0',
                      borderBottom: index < cart.length - 1 ? `1px solid ${C.border}` : 'none',
                    }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 10,
                        background: '#f5f5f7', flexShrink: 0, overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={48}
                            height={48}
                            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                          />
                        ) : (
                          <ShoppingBag size={18} color={C.muted} strokeWidth={1.5} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '0.8125rem', fontWeight: 600, color: C.text,
                          margin: 0, whiteSpace: 'nowrap', overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {item.name}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: C.muted, margin: '0.125rem 0 0' }}>
                          {item.color && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span style={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: item.color.toLowerCase(),
                                border: '1px solid rgba(0,0,0,0.08)',
                                display: 'inline-block',
                              }} />
                              {item.color}
                            </span>
                          )}
                          {item.color && item.storage && ' / '}
                          {item.storage && item.storage}
                        </p>
                      </div>
                      <p style={{
                        fontSize: '0.8125rem', fontWeight: 600, color: C.text,
                        margin: 0, flexShrink: 0, whiteSpace: 'nowrap',
                      }}>
                        {item.quantity} x {formatPrice(item.price)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}>
                  <span style={{ fontSize: '0.9375rem', color: C.muted }}>Subtotal</span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: C.text }}>
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '0.75rem',
                }}>
                  <span style={{
                    fontSize: '0.9375rem', color: C.muted,
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                  }}>
                    <Truck size={14} strokeWidth={1.8} />
                    Delivery
                  </span>
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

                {/* Discount line */}
                {appliedCoupon && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '0.75rem',
                  }}>
                    <span style={{ fontSize: '0.9375rem', color: C.green, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Tag size={14} strokeWidth={1.8} />
                      Discount ({appliedCoupon.discountPercent}%)
                    </span>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: C.green }}>
                      -{formatPrice(discountAmount)}
                    </span>
                  </div>
                )}

                {/* Coupon Section */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setCouponOpen(!couponOpen)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '0.875rem', color: C.blue, fontWeight: 500,
                      fontFamily: 'inherit', padding: 0,
                    }}
                  >
                    <Tag size={14} />
                    Have a coupon?
                    {couponOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {couponOpen && !appliedCoupon && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
                        placeholder="Enter code"
                        style={{
                          flex: 1, padding: '0.5rem 0.75rem', borderRadius: 10,
                          border: `1.5px solid ${couponError ? C.red : C.inputBorder}`,
                          fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none',
                          color: C.text, textTransform: 'uppercase',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                        style={{
                          padding: '0.5rem 1rem', borderRadius: 10,
                          background: couponLoading ? C.muted : C.blue, color: '#fff',
                          border: 'none', fontSize: '0.875rem', fontWeight: 500,
                          cursor: couponLoading ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit', whiteSpace: 'nowrap',
                        }}
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p style={{ fontSize: '0.75rem', color: C.red, margin: '0.375rem 0 0', fontWeight: 500 }}>
                      {couponError}
                    </p>
                  )}
                  {appliedCoupon && couponOpen && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8125rem', color: C.green, fontWeight: 500 }}>
                        {appliedCoupon.code} applied
                      </span>
                      <button
                        type="button"
                        onClick={() => { setAppliedCoupon(null); setCouponCode(''); setCouponError(''); }}
                        style={{
                          background: 'none', border: 'none', color: C.red,
                          fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Divider + Total */}
                <div style={{
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: '1rem', marginTop: '0.5rem',
                  marginBottom: '1.75rem',
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

                {/* Place Order Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="checkout-place-order-btn"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem', width: '100%', padding: '1rem',
                    borderRadius: 980,
                    background: submitting ? C.muted : C.blue,
                    color: '#ffffff', fontSize: '1.0625rem', fontWeight: 500,
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    fontFamily: 'inherit',
                    letterSpacing: '-0.01em',
                    boxShadow: submitting ? 'none' : '0 2px 8px rgba(0,113,227,0.25)',
                  }}
                >
                  {submitting ? (
                    <>
                      <div style={{
                        width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff', borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                      Redirecting to payment...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} strokeWidth={2} />
                      Pay Now
                    </>
                  )}
                </button>

                {/* Back to Bag link */}
                <Link href="/cart" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.375rem', width: '100%', padding: '0.75rem',
                  marginTop: '0.875rem', borderRadius: 980,
                  background: 'transparent', color: C.blue,
                  textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500,
                  border: 'none', transition: 'opacity 0.2s',
                }}>
                  <ArrowLeft size={15} strokeWidth={2} />
                  Back to Bag
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
        </form>
      </div>

      {/* Responsive styles + animations */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .checkout-place-order-btn:hover:not(:disabled) {
          transform: scale(1.015);
          box-shadow: 0 4px 16px rgba(0,113,227,0.35) !important;
        }
        .checkout-place-order-btn:active:not(:disabled) {
          transform: scale(0.985);
        }
        @media (max-width: 860px) {
          .checkout-layout {
            flex-direction: column !important;
          }
          .checkout-summary {
            width: 100% !important;
          }
          .checkout-city-state {
            flex-direction: column !important;
          }
        }
        @media (max-width: 768px) {
          .checkout-summary > div {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}
