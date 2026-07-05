export function formatPrice(amount) {
  return '₦' + Number(amount || 0).toLocaleString('en-NG');
}
