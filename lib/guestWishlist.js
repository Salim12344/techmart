const KEY = 'techmart-wishlist';

export function getGuestWishlist() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function isInGuestWishlist(productId) {
  return getGuestWishlist().includes(productId);
}

export function toggleGuestWishlist(productId) {
  const current = getGuestWishlist();
  const exists = current.includes(productId);
  const updated = exists ? current.filter(id => id !== productId) : [...current, productId];
  localStorage.setItem(KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('wishlist-updated'));
  return !exists; // returns true if now in wishlist, false if removed
}

export function clearGuestWishlist() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event('wishlist-updated'));
}
