function getCart(){
  try { return JSON.parse(localStorage.getItem('cart')) || []; } catch(e){ return []; }
}
function saveCart(cart){
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
}
function addToCart(item){
  const cart = getCart();
  const existing = cart.find(c => c.productId === item.productId && c.size === item.size && c.color === item.color);
  if (existing) existing.qty += item.qty;
  else cart.push(item);
  saveCart(cart);
}
function updateCartQty(idx, qty){
  const cart = getCart();
  if (!cart[idx]) return;
  cart[idx].qty = Math.max(1, qty);
  saveCart(cart);
}
function removeFromCart(idx){
  const cart = getCart();
  cart.splice(idx, 1);
  saveCart(cart);
}
function cartCount(){
  return getCart().reduce((s, c) => s + c.qty, 0);
}
function cartTotal(){
  return getCart().reduce((s, c) => s + c.price * c.qty, 0);
}
function clearCart(){
  localStorage.removeItem('cart');
  updateCartBadge();
}
function updateCartBadge(){
  const el = document.getElementById('cartCount');
  if (el) el.textContent = cartCount();
}
document.addEventListener('DOMContentLoaded', updateCartBadge);
