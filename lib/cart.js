// Client-side cart helper. Guests use localStorage; signed-in users' carts live in
// the DB (see app/api/cart), merged from localStorage once on login (see Navbar.jsx).
const GUEST_KEY = 'techmart-cart';

export function getGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function setGuestCart(items) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(items));
}

export function clearGuestCart() {
  localStorage.removeItem(GUEST_KEY);
}

// status is next-auth's useSession() status ('authenticated' | 'unauthenticated' | 'loading')
export async function getCart(status) {
  if (status === 'authenticated') {
    try {
      const res = await fetch('/api/cart');
      if (!res.ok) return [];
      const data = await res.json();
      return data.items || [];
    } catch {
      return [];
    }
  }
  return getGuestCart();
}

export async function saveCart(items, status) {
  if (status === 'authenticated') {
    try {
      await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
    } catch {
      // best-effort - UI state already updated optimistically by the caller
    }
  } else {
    setGuestCart(items);
  }
  window.dispatchEvent(new Event('cart-updated'));
}

export async function clearCart(status) {
  if (status === 'authenticated') {
    try {
      await fetch('/api/cart', { method: 'DELETE' });
    } catch {
      // best-effort
    }
  } else {
    clearGuestCart();
  }
  window.dispatchEvent(new Event('cart-updated'));
}
