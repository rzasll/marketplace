// common.js - shared logic for all pages
// Edit only SHOP and paths if needed
const SHOP = {
  name: "Bolen & Es Teler",
  wa: "6288299435445" // format wa.me (Indonesia)
};

const PRODUCTS_JSON = 'products.json';
const CART_KEY = 'bolen_cart_v1';

// util
function formatRp(n){ return 'Rp ' + Number(n).toLocaleString('id-ID'); }
function debounce(fn, wait){ let t; return (...a)=>{ clearTimeout(t); t = setTimeout(()=>fn(...a), wait); }; }
function qs(sel, el=document){ return el.querySelector(sel); }

// fetch products
async function fetchProducts(){
  if (window._cachedProducts) return window._cachedProducts;
  const res = await fetch(PRODUCTS_JSON);
  const data = await res.json();
  window._cachedProducts = data;
  return data;
}

// DOM helper to create product card
function cardDOM(p, showDetailLink){
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <div class="card-media">${p.emoji}</div>
    <div class="card-body">
      <div class="card-title"><strong>${p.name}</strong><div class="card-price">${formatRp(p.price)}</div></div>
      <p class="muted small">${p.description}</p>
    </div>
    <div class="card-actions"></div>
  `;
  const actions = el.querySelector('.card-actions');
  const buy = document.createElement('button'); buy.className='btn primary'; buy.textContent='Beli';
  buy.addEventListener('click', ()=> buyNow(p, null, 1));
  const add = document.createElement('button'); add.className='btn outline'; add.textContent='Tambah';
  add.addEventListener('click', ()=> { addToCart(p.id, null, 1); refreshTopCart(); flashCartCount(); });
  const detail = document.createElement('a'); detail.className='btn ghost'; detail.href = `product.html?id=${encodeURIComponent(p.id)}`; detail.textContent='Detail';
  actions.appendChild(buy); actions.appendChild(add); actions.appendChild(detail);
  return el;
}

// cart stored in localStorage
function getCart(){
  try {
    const raw = localStorage.getItem(CART_KEY);
    const cart = raw ? JSON.parse(raw) : [];
    // enrich each item
    return cart.map(i => {
      const prod = (window._cachedProducts||[]).find(p=>p.id===i.productId) || {};
      return {
        key: i.key,
        productId: i.productId,
        label: i.variant ? `${prod.name} ${i.variant}` : (prod.name||i.productId),
        emoji: prod.emoji || '🍽️',
        qty: i.qty,
        price: prod.price || i.price || 0
      };
    });
  } catch(e){
    return [];
  }
}
function saveCartRaw(list){
  localStorage.setItem(CART_KEY, JSON.stringify(list));
}
function addToCart(productId, variant=null, qty=1){
  const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  const key = `${productId}::${variant||''}`;
  const found = raw.find(i=>i.key===key);
  if (found) found.qty += qty; else raw.push({ key, productId, variant, qty });
  saveCartRaw(raw);
}
function updateCartQty(key, qty){
  const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  const found = raw.find(i=>i.key===key);
  if (found) found.qty = Math.max(1, parseInt(qty,10) || 1);
  saveCartRaw(raw);
}
function removeFromCart(key){
  let raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  raw = raw.filter(i=>i.key!==key);
  saveCartRaw(raw);
}
function clearCart(){
  localStorage.removeItem(CART_KEY);
}
function cartTotal(){
  const items = getCart();
  return items.reduce((s,it)=>s + (it.price * it.qty), 0);
}

// UI helpers
async function initCommon(){
  // set shop name
  document.querySelectorAll('.brand a, .brand, #shopName').forEach(e=> {
    if (e.tagName === 'A') e.textContent = SHOP.name;
    else if (e.querySelector) e.textContent = SHOP.name;
  });
  // nav toggles (simple)
  document.querySelectorAll('#menuToggle, #menuToggleP, #menuToggleProd, #menuToggleCart').forEach(b=>{
    if (!b) return;
    b.addEventListener('click', ()=> {
      const menu = document.getElementById('mainMenu');
      if (!menu) return;
      const open = menu.getAttribute('data-open') === '1';
      menu.setAttribute('data-open', open ? '0' : '1');
      menu.style.display = open ? 'none' : 'flex';
    });
  });

  // cart toggle
  document.querySelectorAll('#cartToggle, #cartToggleP, #cartToggleProd').forEach(b=>{
    if (!b) return;
    b.addEventListener('click', ()=> {
      const mini = document.getElementById('miniCart');
      if (!mini) return mini.style.display = 'block';
      mini.style.display = mini.style.display === 'block' ? 'none' : 'block';
      renderMiniCart();
    });
  });

  // top cart refresh
  refreshTopCart();
}

// refresh small cart counters
function refreshTopCart(){
  const count = getCart().reduce((s,i)=>s + i.qty, 0);
  document.querySelectorAll('#topCartCount, #topCartCountP, #topCartCountProd').forEach(el=>{
    if (el) el.textContent = count;
  });
}

// render mini cart drawer
function renderMiniCart(){
  const items = getCart();
  const container = document.getElementById('miniCartItems');
  const totalEl = document.getElementById('miniCartTotal');
  if (!container) return;
  container.innerHTML = '';
  if (items.length === 0) container.innerHTML = '<div class="muted">Keranjang kosong.</div>';
  else {
    items.forEach(it=>{
      const row = document.createElement('div');
      row.className = 'mini-row';
      row.innerHTML = `<div class="emoji">${it.emoji}</div><div class="meta"><div class="label">${it.label}</div><div class="small muted">${formatRp(it.price)} x ${it.qty}</div></div>
        <div><button class="btn outline" data-key="${it.key}">Hapus</button></div>`;
      container.appendChild(row);
    });
    container.querySelectorAll('.btn.outline[data-key]').forEach(btn=>{
      btn.addEventListener('click', (e)=> {
        removeFromCart(e.target.dataset.key);
        renderMiniCart(); refreshTopCart();
      });
    });
  }
  if (totalEl) totalEl.textContent = formatRp(cartTotal());
}

// immediate-buy (short WA message)
function buyNow(product, variant=null, qty=1){
  const label = variant ? `${product.name} ${variant}` : product.name;
  const qtyText = qty > 1 ? ` x${qty}` : '';
  const msg = `kak mau beli ${label}${qtyText} ya`;
  window.open(waUrl(msg), '_blank');
}

// wa URL builder
function waUrl(message=''){
  const q = message ? `?text=${message}` : '';
  return `https://wa.me/${SHOP.wa}${q}`;
}

// flash animation
function flashCartCount(){
  const el = document.querySelector('#topCartCount, #topCartCountP, #topCartCountProd');
  if (!el) return;
  el.classList.add('pulse');
  setTimeout(()=>el.classList.remove('pulse'), 300);
}

// helper to refresh top counters (public)
function refreshTopCartPublic(){ refreshTopCart(); renderMiniCart(); }

// expose functions globally used by inline page scripts
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
window.flashCartCount = flashCartCount;
window.debounce = debounce;
