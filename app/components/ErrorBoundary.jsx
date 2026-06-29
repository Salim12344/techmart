'use client';

import { Component } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '2rem', background: '#f5f5f7',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(255,59,48,0.08)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <AlertTriangle size={28} color="#ff3b30" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1d1d1f', margin: '0 0 0.5rem' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#86868b', fontSize: '0.9375rem', margin: '0 0 2rem', lineHeight: 1.5 }}>
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => this.setState({ hasError: false })}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.5rem', background: '#0071e3', color: '#fff',
                  borderRadius: '980px', border: 'none', fontSize: '0.9375rem',
                  fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <RefreshCw size={16} /> Try Again
              </button>
              <Link href="/" style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0.75rem 1.5rem', background: '#e8e8ed', color: '#1d1d1f',
                borderRadius: '980px', fontSize: '0.9375rem', fontWeight: 500,
                textDecoration: 'none',
              }}>
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
