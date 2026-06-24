'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, MessageSquare } from 'lucide-react';

const C = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ed',
  text: '#1d1d1f', muted: '#86868b', blue: '#0071e3',
};

const faqs = [
  { category: 'Orders', items: [
    { q: 'How do I place an order?', a: 'Browse our products, add items to your cart, proceed to checkout, fill in your shipping details, and complete payment via Paystack.' },
    { q: 'How can I track my order?', a: 'Go to My Orders from the navbar or your account page. Click on any order to see its current status and delivery timeline.' },
    { q: 'Can I cancel my order?', a: 'Orders can be cancelled before they are confirmed. Once confirmed, please contact our support team for assistance.' },
    { q: 'What are the delivery fees?', a: 'Delivery is ₦3,500 for orders under ₦500,000. Orders above ₦500,000 get free delivery.' },
    { q: 'How long does delivery take?', a: 'Delivery typically takes 3-7 business days depending on your location within Nigeria.' },
  ]},
  { category: 'Payments', items: [
    { q: 'What payment methods do you accept?', a: 'We accept all major debit/credit cards, bank transfers, and mobile money through Paystack.' },
    { q: 'Is my payment information secure?', a: 'Yes. All payments are processed through Paystack, which is PCI DSS compliant. We never store your card details.' },
    { q: 'What currency do you charge in?', a: 'All prices are in Nigerian Naira (₦).' },
  ]},
  { category: 'Products', items: [
    { q: 'Are all products genuine Apple products?', a: 'Yes, we only sell 100% authentic Apple products with manufacturer warranty.' },
    { q: 'Do products come with warranty?', a: 'Yes, all products come with warranty as specified on the product page.' },
    { q: 'Can I compare products?', a: 'Yes! On the products page, click the compare icon on up to 3 products of the same category to see a side-by-side comparison.' },
  ]},
  { category: 'Account', items: [
    { q: 'How do I create an account?', a: 'Click "Register" from the sign-in page. You\'ll need to verify your email with a one-time code.' },
    { q: 'I forgot my password. What do I do?', a: 'Click "Forgot password?" on the login page. We\'ll send you a verification code to reset it.' },
    { q: 'Can I sign in with Google?', a: 'Yes, click "Continue with Google" on the login page to sign in with your Google account.' },
  ]},
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (key) => setOpenIndex(openIndex === key ? null : key);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: C.text, letterSpacing: '-0.04em', margin: '0 0 0.5rem' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ fontSize: '1.0625rem', color: C.muted, margin: 0 }}>
          Everything you need to know about TechMart
        </p>
      </div>

      {faqs.map((section) => (
        <div key={section.category} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: C.text, letterSpacing: '-0.02em', margin: '0 0 1rem' }}>
            {section.category}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {section.items.map((faq, i) => {
              const key = `${section.category}-${i}`;
              const isOpen = openIndex === key;
              return (
                <div key={key} style={{
                  background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
                  overflow: 'hidden', transition: 'box-shadow 0.2s',
                  boxShadow: isOpen ? '0 4px 20px rgba(0,0,0,0.06)' : 'none',
                }}>
                  <button onClick={() => toggle(key)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1.125rem 1.25rem', background: 'none', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  }}>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: C.text }}>{faq.q}</span>
                    <ChevronDown size={18} style={{
                      color: C.muted, flexShrink: 0, transition: 'transform 0.25s ease',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                    }} />
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: '0 1.25rem 1.125rem',
                      fontSize: '0.9375rem', color: C.muted, lineHeight: 1.6,
                      animation: 'fadeIn 0.2s ease-out',
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{
        textAlign: 'center', marginTop: '3rem', padding: '2rem',
        background: C.card, borderRadius: 20, border: `1px solid ${C.border}`,
      }}>
        <MessageSquare size={32} color={C.blue} style={{ marginBottom: '0.75rem' }} />
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: C.text, margin: '0 0 0.375rem' }}>
          Still have questions?
        </h3>
        <p style={{ fontSize: '0.9375rem', color: C.muted, margin: '0 0 1.25rem' }}>
          Our support team is here to help
        </p>
        <Link href="/support" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.75rem 1.5rem', background: C.blue, color: '#fff',
          borderRadius: 980, fontSize: '0.9375rem', fontWeight: 500, textDecoration: 'none',
        }}>
          Contact Support
        </Link>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
