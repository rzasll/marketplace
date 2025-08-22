// common.js - shared logic for all pages (FIXED & more robust)
// - Fixes: waUrl encoding, initCommon safer DOM updates, cart helpers robust, renderMiniCart stable
// - Usage: include this file on all pages, call await initCommon() in DOMContentLoaded

const SHOP = {
  name: "Bolen & Es Teler",
  wa: "6288299435445" // wa.me format (no + or leading 0)
};

const PRODUCTS_JSON = 'products.json';
const CART_KEY = 'bolen_cart_v1';

// --- Utility ---
function formatRp(n){
  n = Number(n) || 0;
  return 'Rp ' + n.toLocaleString('id-ID');
}
function debounce(fn, wait){ let t; return (...a)=>{ clearTimeout(t); t = setTimeout(()=>fn(...a), wait); }; }
function qs(sel, ctx=document){ return ctx.querySelector(sel); }
function qsa(sel, ctx=document){ return Array.from(ctx.querySelectorAll(sel)); }

// --- Fetch products (cached) ---
async function fetchProducts(){
  if (window._cachedProducts) return window._cachedProducts;
  try {
    const res = await fetch(PRODUCTS_JSON, {cache: "no-cache"});
    if (!res.ok) {
      console.warn('fetchProducts: failed to load', PRODUCTS_JSON, res.status);
      window._cachedProducts = [];
      return window._cachedProducts;
    }
    const data = await res.json();
    window._cachedProducts = data;
    return data;
  } catch (err) {
    console.error('fetchProducts error', err);
    window._cachedProducts = [];
    return window._cachedProducts;
  }
}

// --- Cart storage helpers ---
// raw format in localStorage: [{ key, productId, variant, qty }]
function readRawCart(){
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e){
    console.error('readRawCart parse error', e);
    return [];
  }
}
function writeRawCart(arr){
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(arr));
  } catch(e){
    console.error('writeRawCart error', e);
  }
}

// return enriched cart items (with product data)
function getCart(){
  const raw = readRawCart();
  const prods = window._cachedProducts || [];
  return raw.map(i => {
    const prod = prods.find(p => p.id === i.productId) || {};
    return {
      key: i.key,
      productId: i.productId,
      variant: i.variant || null,
      label: i.variant ? `${(prod.name || i.productId)} ${i.variant}` : (prod.name || i.productId),
      emoji: prod.emoji || '🍽️',
      qty: Number(i.qty) || 0,
      price: Number(prod.price || 0)
    };
  });
}

function addToCart(productId, variant=null, qty=1){
  qty = Math.max(1, Number(qty) || 1);
  const raw = readRawCart();
  const key = `${productId}::${variant || ''}`;
  const found = raw.find(r => r.key === key);
  if (found) found.qty = Number(found.qty) + qty;
  else raw.push({ key, productId, variant, qty });
  writeRawCart(raw);
  refreshTopCart();
}

function updateCartQty(key, qty){
  qty = Math.max(1, Number(qty) || 1);
  const raw = readRawCart();
  const f = raw.find(r => r.key === key);
  if (f) f.qty = qty;
  writeRawCart(raw);
  refreshTopCart();
}

function removeFromCart(key){
  let raw = readRawCart();
  raw = raw.filter(r => r.key !== key);
  writeRawCart(raw);
  refreshTopCart();
}

function clearCart(){
  try { localStorage.removeItem(CART_KEY); } catch(e){ console.error(e); }
  refreshTopCart();
}

function cartTotal(){
  const items = getCart();
  return items.reduce((s,it) => s + (it.price * it.qty), 0);
}

// --- WA URL builder (encoded) ---
function waUrl(message=''){
  if (!message) return `https://wa.me/${SHOP.wa}`;
  // ensure message encoded for URL
  return `https://wa.me/${SHOP.wa}?text=${encodeURIComponent(message)}`;
}

// --- UI helpers: top counters & mini cart drawer ---
function refreshTopCart(){
  const count = getCart().reduce((s,i)=>s + i.qty, 0);
  qsa('#topCartCount, #topCartCountP, #topCartCountProd').forEach(el => { if (el) el.textContent = count; });
  // update any other counters
  qsa('.cart-count-badge').forEach(el => el.textContent = count);
  renderMiniCart(); // keep mini cart in sync
}

function renderMiniCart(){
  const items = getCart();
  const container = qs('#miniCartItems');
  const totalEl = qs('#miniCartTotal');
  if (!container) return;
  container.innerHTML = '';
  if (items.length === 0) {
    const e = document.createElement('div'); e.className = 'muted'; e.textContent = 'Keranjang kosong.'; container.appendChild(e);
  } else {
    items.forEach(it => {
      const row = document.createElement('div'); row.className = 'mini-row';
      row.innerHTML = `
        <div class="emoji">${it.emoji}</div>
        <div class="meta"><div class="label">${it.label}</div><div class="small muted">${formatRp(it.price)} x ${it.qty}</div></div>
        <div class="actions"><button class="btn outline mini-remove" data-key="${it.key}">Hapus</button></div>
      `;
      container.appendChild(row);
    });
    // attach remove listeners
    container.querySelectorAll('.mini-remove').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const k = btn.dataset.key;
        removeFromCart(k);
        renderMiniCart();
      });
    });
  }
  if (totalEl) totalEl.textContent = formatRp(cartTotal());
}

// small pulse animation class toggler (requires CSS .pulse)
function flashCartCount(){
  const el = qs('#topCartCount') || qs('#topCartCountP') || qs('#topCartCountProd');
  if (!el) return;
  el.classList.add('pulse');
  setTimeout(()=>el.classList.remove('pulse'), 300);
}

// --- Product card helper used by pages ---
function cardDOM(p, showDetailLink){
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <div class="card-media">${p.emoji || ''}</div>
    <div class="card-body">
      <div class="card-title"><strong>${p.name}</strong><div class="card-price">${formatRp(p.price)}</div></div>
      <p class="muted small">${p.description || ''}</p>
    </div>
    <div class="card-actions"></div>
  `;
  const actions = el.querySelector('.card-actions');
  // quick buy (WA short)
  const buy = document.createElement('button'); buy.className='btn primary'; buy.textContent='Beli';
  buy.addEventListener('click', ()=> buyNow(p, null, 1));
  // add to cart
  const add = document.createElement('button'); add.className='btn outline'; add.textContent='Tambah';
  add.addEventListener('click', ()=> { addToCart(p.id, null, 1); flashCartCount(); renderMiniCart(); });
  actions.appendChild(buy); actions.appendChild(add);
  if (showDetailLink) {
    const d = document.createElement('a'); d.className = 'btn ghost'; d.href = `product.html?id=${encodeURIComponent(p.id)}`; d.textContent = 'Detail';
    actions.appendChild(d);
  }
  return el;
}

// --- immediate buy (short WA message) ---
function buyNow(product, variant=null, qty=1){
  const label = variant ? `${product.name} ${variant}` : product.name;
  const qtyText = qty > 1 ? ` x${qty}` : '';
  const message = `kak mau beli ${label}${qtyText} ya`;
  window.open(waUrl(message), '_blank');
}

// --- initCommon: safe DOM wiring for many page variants ---
async function initCommon(){
  // fill shop name into common selectors
  qsa('.brand a, .shop-name, #shopName, .menu-shop').forEach(el => {
    try {
      if (el.tagName === 'A') el.textContent = SHOP.name;
      else el.textContent = SHOP.name;
    } catch(e){ /* ignore */ }
  });

  // menu toggle(s): toggles mainMenu presence
  qsa('[id^="menuToggle"], #menuToggle, .menu-toggle, #menuToggleP, #menuToggleProd, #menuToggleCart').forEach(btn=>{
    if (!btn) return;
    btn.addEventListener('click', () => {
      const menu = qs('#mainMenu');
      if (!menu) return;
      const open = menu.getAttribute('data-open') === '1';
      menu.setAttribute('data-open', open ? '0' : '1');
      menu.style.display = open ? 'none' : 'flex';
    });
  });

  // cart toggles (open mini cart)
  qsa('#cartToggle, #cartToggleP, #cartToggleProd, #cartBtn').forEach(b=>{
    if (!b) return;
    b.addEventListener('click', () => {
      const mini = qs('#miniCart');
      if (!mini) return;
      mini.style.display = mini.style.display === 'block' ? 'none' : 'block';
      renderMiniCart();
    });
  });

  // attach close for mini cart close btn
  const miniClose = qs('#miniCartClose');
  if (miniClose) miniClose.addEventListener('click', () => {
    const mini = qs('#miniCart'); if (mini) mini.style.display = 'none';
  });

  // set WA links if elements present
  qsa('#waContact, #waContactInline, #quickOrder, .wa-btn').forEach(el => {
    try {
      if (el.tagName === 'A') {
        const id = el.id;
        if (id === 'quickOrder') el.href = waUrl('kak mau beli Es Teler ya');
        else el.href = waUrl('');
      }
    } catch(e){}
  });

  // refresh counters
  refreshTopCart();
  // ensure mini cart renders initial state (if exists)
  renderMiniCart();
}

// expose common functions globally (for page scripts)
window.fetchProducts = fetchProducts;
window.cardDOM = cardDOM;
window.formatRp = formatRp;
window.addToCart = addToCart;
window.getCart = getCart;
window.removeFromCart = removeFromCart;
window.updateCartQty = updateCartQty;
window.clearCart = clearCart;
window.cartTotal = cartTotal;
window.buyNow = buyNow;
window.waUrl = waUrl;
window.initCommon = initCommon;
window.refreshTopCart = refreshTopCart;
window.renderMiniCart = renderMiniCart;
window.flashCartCount = flashCartCount;
window.debounce = debounce;
