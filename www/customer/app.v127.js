
// --- Image preloading & cache for faster category switching (v151) ---
const __IMG_CACHE = new Map(); // url -> Promise<HTMLImageElement>
function preloadImage(url){
  if(!url) return Promise.resolve(null);
  if(__IMG_CACHE.has(url)) return __IMG_CACHE.get(url);
  const p = new Promise((resolve)=>{
    const img = new Image();
    // Hint the browser to prioritize visible images
    img.decoding = 'async';
    img.loading = 'eager';
    img.onload = ()=>resolve(img);
    img.onerror = ()=>resolve(null);
    img.src = url;
    // decode() can help on some browsers
    if (img.decode) { img.decode().then(()=>resolve(img)).catch(()=>{}); }
  });
  __IMG_CACHE.set(url, p);
  return p;
}
function preloadCategoryItemImages(items){
  if(!Array.isArray(items)) return;
  // Preload first screen worth with higher priority, then the rest
  const first = items.slice(0, 10);
  const rest  = items.slice(10);
  first.forEach(it=>preloadImage(it?.image || it?.img || it?.imageUrl || it?.imageURL));
  // spread rest over time to avoid blocking UI
  let i=0;
  function step(){
    const chunk = rest.slice(i, i+8);
    chunk.forEach(it=>preloadImage(it?.image || it?.img || it?.imageUrl || it?.imageURL));
    i += 8;
    if(i < rest.length) requestIdleCallback ? requestIdleCallback(step) : setTimeout(step, 60);
  }
  if(rest.length) (requestIdleCallback ? requestIdleCallback(step) : setTimeout(step, 60));
}
// -------------------------------------------------------------------

// ---------- Firebase (modular) ----------

// --- POS/CUSTOMER compatibility shim: ensure isPizza exists (older builds may call isPizza in UI)
window.isPizza = window.isPizza || function(item){
  try{
    const cat = (item && (item.category || item.cat || item.categoryId || "")) + "";
    const c = cat.toLowerCase();
    if(c.includes("pizza") || c.includes("piza")) return true;
    // if item has type hints
    const t = ((item && (item.type || item.kind)) || "").toLowerCase();
    return t === "pizza";
  }catch(e){ return false; }
};
// Make sure bare identifier resolves in non-module scripts
var isPizza = window.isPizza;
// --- Compatibility shim: ensure isPastry exists (used by modal title / pastry logic)
window.isPastry = window.isPastry || function(item){
  try{
    const id = (item && (item.id || item.itemId || item.sku || "")) + "";
    const cat = (item && (item.category || item.cat || item.categoryId || "")) + "";
    const he = (item && (item.nameHe || item.name_he || "")) + "";
    const ar = (item && (item.nameAr || item.name_ar || "")) + "";
    const en = (item && (item.nameEn || item.name_en || "")) + "";
    const name =
      (item && (
        (item.name && (item.name.ar || item.name.he || item.name.en)) ||
        item["العربية"] || item["עברית"] || item["English"] ||
        item.name || item.title || item.label
      )) + "";
    const s = (id + " " + cat + " " + he + " " + ar + " " + en + " " + name).toLowerCase();
    // Pastry keywords (Latin)
    if(/sfiha|sficha|sfi7|manaoushe|manoushe|manous|manakish|malawach|bourek|burek|pastry|maafe/.test(s)) return true;
    // Hebrew
    if(/מאפה|מלאוח|בורקס|ספיחה|מנאושה|מנאקיש/.test(s)) return true;
    // Arabic
    if(/معجن|مناقي|منقوش|مناقيش|سفي|فطا/.test(s)) return true;
    return false;
  }catch(e){ return false; }
};
// Make sure bare identifier resolves in module/non-module scripts
var isPastry = window.isPastry;

// --- Compatibility shim: ensure isPastryToppable exists (some builds call it from modal logic)
window.isPastryToppable = window.isPastryToppable || function(item){
  try{
    // explicit flag from Firestore if present
    if(item && item.allowToppings === false) return false;
    const id = (item && (item.id || item.itemId || item.sku || "")) + "";
    const cat = (item && (item.category || item.cat || item.categoryId || "")) + "";
    const name =
      (item && (
        (item.name && (item.name.ar || item.name.he || item.name.en)) ||
        item["العربية"] || item["עברית"] || item["English"] ||
        item.name || item.title || item.label
      )) + "";
    const s = (id + " " + cat + " " + name).toLowerCase();
    // exclude jachnun explicitly
    if(s.includes("jachnun") || s.includes("jahnun") || s.includes("גחנון") || s.includes("جح")) return false;
    if(typeof window.isPastry === "function" && window.isPastry(item)) return true;
    // fallback by category keywords
    const c = cat.toLowerCase();
    return c.includes("pastry") || c.includes("maafe") || c.includes("معجن") || c.includes("מאפה");
  }catch(e){ return false; }
};
var isPastryToppable = window.isPastryToppable;


import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, where, limit, getDocs, getDoc,
  serverTimestamp, onSnapshot, orderBy, updateDoc, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getStorage, ref as sRef, uploadBytesResumable, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// --- Kind normalizer (supports Hebrew/Arabic/custom labels) ---
function __normKind(k){
  const s = (k ?? "").toString().trim().toLowerCase();
  if(!s) return "regular";
  // shrimp
  if(s.includes("shrimp") || s.includes("روبي") || s.includes("שרימ")) return "shrimp";
  // minced/meat
  if(s.includes("meat") || s.includes("mince") || s.includes("בשר") || s.includes("لحمة") || s.includes("لحم")) return "meat";
  // special / premium
  if(s.includes("special") || s.includes("premium") || s.includes("מיוחד") || s.includes("ספיישל") || s.includes("مميز") ) return "special";
  // sauce
  if(s.includes("sauce") || s.includes("صوص") || s.includes("רוטב")) return "sauce";
  // free
  if(s.includes("free") || s.includes("חינם") || s.includes("مجانا")) return "free";
  return "regular";
}

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
let __lockedScrollY = 0;
function __lockBodyScroll(){
  // lock background scroll (iOS-safe)
  __lockedScrollY = window.scrollY || 0;
  document.body.classList.add("modal-open");
  document.body.style.position = "fixed";
  document.body.style.top = `-${__lockedScrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}
function __unlockBodyScroll(){
  document.body.classList.remove("modal-open");
  document.body.style.position = "";
  const top = document.body.style.top;
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  const y = top ? Math.abs(parseInt(top, 10)) : __lockedScrollY;
  window.scrollTo(0, isFinite(y) ? y : __lockedScrollY);
}

function setAriaOpen(el, open){
  if(!el) return;
  el.setAttribute("aria-hidden", open ? "false" : "true");
  el.classList.toggle("is-open", open);

  // Make modals behave like an independent page on iPhone
  const isModalOrDrawer = el.classList.contains("modal") || el.classList.contains("drawer");
  if(isModalOrDrawer){
    const isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    el.classList.toggle("modal--fullscreen", !!(open && isMobile && el.classList.contains("modal")));
    const anyOpen = document.querySelectorAll('.modal[aria-hidden="false"], .drawer[aria-hidden="false"]').length > 0;
    if(anyOpen) __lockBodyScroll(); else __unlockBodyScroll();
  }
}

// Pizza Olive Customer UI + Firestore (olive-kopa)
// - pulls categories + menu
// - sends orders into the SAME 'orders' collection that the POS (kopa) reads

const firebaseConfig = {
  "apiKey": "AIzaSyDX-R1XONKy3cGzdon4Nd38coZV94Z99aA",
  "authDomain": "olive-kopa.firebaseapp.com",
  "projectId": "olive-kopa",
  "storageBucket": "olive-kopa.firebasestorage.app",
  "messagingSenderId": "260791001433",
  "appId": "1:260791001433:web:4cfbfd3b2230e734362c48",
  "measurementId": "G-7C3PB6WYPT"
};
const app = (getApps().length ? getApps()[0] : initializeApp(firebaseConfig));
const db = getFirestore(app);
const storage = getStorage(app);

const fmtILS = (n) => `₪${Number(n||0).toFixed(2)}`;

// ---------- Accent helpers (no canvas / no CORS) ----------
function _hashHue(str){
  str = String(str||'');
  let h = 0;
  for(let i=0;i<str.length;i++){ h = (h*31 + str.charCodeAt(i)) >>> 0; }
  return h % 360;
}
function pickAccent(id){
  const hue = _hashHue(id);
  return `hsl(${hue} 70% 55%)`;
}
function accentBgFrom(color){
  if(!color) return null;
  if(color.startsWith('#')){
    const h = color.slice(1);
    const full = h.length===3 ? h.split('').map(x=>x+x).join('') : h;
    if(full.length!==6) return null;
    const r = parseInt(full.slice(0,2),16);
    const g = parseInt(full.slice(2,4),16);
    const b = parseInt(full.slice(4,6),16);
    return `rgba(${r},${g},${b},0.14)`;
  }
  return null;
}


// ---------- WOW HERO (young/trendy) ----------
const HERO_BANNERS = [
  {
    "id": "pizza",
    "kicker": "🔥 Pizza Olive",
    "headline": "Cheesy & Crispy",
    "sub": "בנו את הפיצה שלכם • רבעים • חצאים • תוספות",
    "chips": [
      "🍕 פיצות",
      "🧀 תוספות",
      "🫒 Olive vibe"
    ],
    "asset": "assets/banner_pizza.svg"
  },
  {
    "id": "pasta",
    "kicker": "🍝 Pasta Bar",
    "headline": "Build Your Pasta",
    "sub": "בחרו סוג • רוטב • ירקות • תוספות",
    "chips": [
      "🍝 פסטות",
      "🥫 רטבים",
      "✨ WOW taste"
    ],
    "asset": "assets/banner_pasta.svg"
  },
  {
    "id": "salad",
    "kicker": "🥗 Fresh Zone",
    "headline": "Fresh & Crunchy",
    "sub": "סלטים טריים • רטבים • תוספות",
    "chips": [
      "🥗 סלטים",
      "🌿 טרי",
      "💚 בריא"
    ],
    "asset": "assets/banner_salad.svg"
  },
  {
    "id": "bakery",
    "kicker": "🥙 Bakery",
    "headline": "Hot From Oven",
    "sub": "מאפים • ספיחה • קריספי",
    "chips": [
      "🥙 מאפים",
      "🔥 חם",
      "😋 ממכר"
    ],
    "asset": "assets/banner_bakery.svg"
  }
];
let heroIndex = 0;
let heroTimer = null;

function renderHero() {
  const slides = document.getElementById("heroSlides");
  const SOURCE = (Array.isArray(LIVE_BANNERS) && LIVE_BANNERS.length) ? LIVE_BANNERS : HERO_BANNERS;
  const chips = document.getElementById("heroChips");
  if(!slides) return;

  if(!slides.dataset.ready) {
    slides.innerHTML = SOURCE.map((b, i) => {
      const isVideo = (b.type === "video") || (!!b.url && String(b.url).includes(".mp4"));
      const bg = b.url ? `background-image:url('${b.url}')` : `background-image:url('${b.asset}')`;
      if(isVideo && b.url){
        return `
          <div class="heroSlide ${i===0 ? 'is-active' : ''}" data-idx="${i}" style="background-image:none">
            <video class="heroVid" src="${b.url}" playsinline muted loop preload="metadata"></video>
          </div>`;
      }
      return `
        <div class="heroSlide ${i===0 ? 'is-active' : ''}" data-idx="${i}" style="${bg}"></div>`;
    }).join("");
    // autoplay active video
    const v = slides.querySelector(".heroSlide.is-active .heroVid");
    if(v){ try{ v.play(); }catch(e){} }

    slides.dataset.ready = "1";
  }

  const b = SOURCE[heroIndex % SOURCE.length];
  const k = document.getElementById("heroKicker");
  const h = document.getElementById("heroHeadline");
  const s = document.getElementById("heroSub");
  if(k) k.textContent = b.kicker;
  if(h) h.textContent = b.headline;
  if(s) s.textContent = b.sub;

  if(chips) {
    chips.innerHTML = b.chips.map(t => `<span class="chip"><span class="chipDot"></span>${t}</span>`).join("");
  }

  const all = Array.from(slides.querySelectorAll(".heroSlide"));
  all.forEach(el => el.classList.remove("is-active"));
  const active = slides.querySelector(`.heroSlide[data-idx="${heroIndex % SOURCE.length}"]`);
  // play/pause videos
  const allV = slides.querySelectorAll(".heroVid");
  allV.forEach(v=>{ try{ v.pause(); }catch(e){} });
  const av = slides.querySelector(`.heroSlide[data-idx="${heroIndex % SOURCE.length}"] .heroVid`);
  if(av){ try{ av.play(); }catch(e){} }
  if(active) active.classList.add("is-active");
}

function startHero() {
  renderHero();
  if(heroTimer) clearInterval(heroTimer);
  heroTimer = setInterval(() => {
  // CUSTOMER FORCE HEBREW
  window.APP_LANG = "he";
  try{ localStorage.setItem("lang","he"); }catch(e){}
  document.documentElement.lang="he";
  document.documentElement.dir="rtl";
    heroIndex = (heroIndex + 1) % ((Array.isArray(LIVE_BANNERS) && LIVE_BANNERS.length) ? LIVE_BANNERS.length : HERO_BANNERS.length);
    renderHero();
  }, 7500);
}


// ---------- LIVE BANNERS (Firestore) ----------
let LIVE_BANNERS = null;

function bannerDocToHero(b){
  // normalize
  const chips = Array.isArray(b.chips) ? b.chips : (typeof b.chips === "string" ? b.chips.split(",").map(s=>s.trim()).filter(Boolean) : []);
  return {
    kicker: b.kicker || "🔥 Pizza Olive",
    headline: b.headline || "Hot & Fresh",
    sub: b.sub || "פיצה • פסטה • סלטים • מאפים",
    chips: chips.length ? chips : ["🍕 פיצות","🍝 פסטות","🥗 טרי"],
    type: b.type || "image", // image|video
    url: b.url || null,
    active: (b.active !== false)
  };
}

function listenBanners(){
  const qy = query(collection(db,"banners"), orderBy("order","asc"));
  onSnapshot(qy, (snap)=>{
    const arr = [];
    snap.forEach(d=>{
      const data = d.data();
      if(data && data.active !== false) arr.push({id:d.id, ...data});
    });
    LIVE_BANNERS = arr.map(bannerDocToHero);
    // reset and render
    heroIndex = 0;
    const slides = document.getElementById("heroSlides");
  const SOURCE = (Array.isArray(LIVE_BANNERS) && LIVE_BANNERS.length) ? LIVE_BANNERS : HERO_BANNERS;
    if(slides){ slides.dataset.ready = ""; }
    renderHero();
  }, (err)=>{
    console.warn("banners snapshot error", err);
  });
}


function pulseCartBadge() {
  const b = document.getElementById("cartCount");
  const cartBtn = document.getElementById("btnCart");
  if(!b) return;

  // ensure visible state
  const n = Number(b.textContent||"0");
  b.style.display = n>0 ? "grid" : "none";

  // restart CSS animations
  b.classList.remove("badgePop","badgeGlow");
  // force reflow
  void b.offsetWidth;
  b.classList.add("badgePop","badgeGlow");

  // cart micro-shake + bounce (premium, subtle)
  if(cartBtn){
    cartBtn.classList.remove("cartShake","cartPulse");
    void cartBtn.offsetWidth;
    cartBtn.classList.add("cartShake","cartPulse");
    setTimeout(()=>{ try{ cartBtn.classList.remove("cartShake"); }catch(e){} }, 520);
    setTimeout(()=>{ try{ cartBtn.classList.remove("cartPulse"); }catch(e){} }, 480);
  }

  // iOS-like number pop (slight vertical move)
  try{
    b.animate(
      [
        { transform:'translateY(0) scale(1)' , filter:'brightness(1)'},
        { transform:'translateY(-1px) scale(1.28)', filter:'brightness(1.15)'},
        { transform:'translateY(0) scale(1)', filter:'brightness(1)'}
      ],
      { duration: 360, easing: 'cubic-bezier(.2,.95,.2,1)' }
    );
  }catch(e){}
}
let toastEl=null;
function toast(title, sub=''){
  if(!toastEl){
    toastEl=document.createElement('div');
    toastEl.className='toast';
    toastEl.innerHTML='<div class="toast__title"></div><div class="toast__sub"></div>';
    document.body.appendChild(toastEl);
  }
  toastEl.querySelector('.toast__title').textContent=title;
  toastEl.querySelector('.toast__sub').textContent=sub;
  toastEl.classList.add('is-show');
  clearTimeout(toastEl._t);
  toastEl._t=setTimeout(()=>toastEl.classList.remove('is-show'), 2800);
}

// Button ripple (subtle, premium)
function spawnRipple(btn, ev){
  if(!btn) return;
  const r = document.createElement('span');
  r.className = 'ripple';
  const rect = btn.getBoundingClientRect();
  const x = (ev?.clientX ?? (rect.left + rect.width/2)) - rect.left;
  const y = (ev?.clientY ?? (rect.top + rect.height/2)) - rect.top;
  r.style.left = x + 'px';
  r.style.top = y + 'px';
  btn.appendChild(r);
  setTimeout(()=>{ try{ r.remove(); }catch(e){} }, 680);
}

// ---------- WOW add-to-cart animation (American-app style) ----------
// Creates a flying clone of the pizza hero into the cart button.
function animateAddToCartFromModal(){
  const hero = document.getElementById('heroPizza');
  const cartBtn = document.getElementById('btnCart');
  if(!hero || !cartBtn) return Promise.resolve();

  const from = hero.getBoundingClientRect();
  const to = cartBtn.getBoundingClientRect();

  // clone the hero (includes overlay toppings)
  const clone = hero.cloneNode(true);
  clone.classList.add('flyToCart');
  clone.style.position = 'fixed';
  clone.style.left = from.left + 'px';
  clone.style.top = from.top + 'px';
  clone.style.width = from.width + 'px';
  clone.style.height = from.height + 'px';
  clone.style.margin = '0';
  clone.style.zIndex = '99999';
  clone.style.pointerEvents = 'none';
  clone.style.borderRadius = '18px';
  clone.style.overflow = 'hidden';
  clone.style.transformOrigin = 'center center';
  document.body.appendChild(clone);

  // soft glass trail
  const glow = document.createElement('div');
  glow.className = 'flyGlow';
  document.body.appendChild(glow);

  // calculate target center (cart icon)
  const targetX = to.left + to.width/2;
  const targetY = to.top + to.height/2;
  const startX = from.left + from.width/2;
  const startY = from.top + from.height/2;

  const dx = targetX - startX;
  const dy = targetY - startY;

  // kick animation in next frame
  return new Promise((resolve)=>{
    requestAnimationFrame(()=>{
      clone.style.transition = 'transform 720ms cubic-bezier(.2,.95,.2,1), opacity 720ms ease';
      clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.14) rotate(-8deg)`;
      clone.style.opacity = '0.15';

      glow.style.left = (startX - 14) + 'px';
      glow.style.top = (startY - 14) + 'px';
      glow.style.transition = 'transform 720ms cubic-bezier(.2,.95,.2,1), opacity 720ms ease';
      glow.style.transform = `translate(${dx}px, ${dy}px) scale(0.35)`;
      glow.style.opacity = '0';
    });

    setTimeout(()=>{
      try{ clone.remove(); }catch(e){}
      try{ glow.remove(); }catch(e){}
      // premium cart feedback: shake + flash + sparkles
      try{ spawnCartFlash(cartBtn); }catch(e){}
      try{ spawnCartSparkles(cartBtn); }catch(e){}
      try{ cartBtn.classList.add('cartShake'); }catch(e){}
      setTimeout(()=>{ try{ cartBtn.classList.remove('cartShake'); }catch(e){} }, 520);
      resolve();
    }, 760);
  });

/* Level 3 FX: sparkles + flash near cart (premium) */
function spawnCartFlash(cartBtn){
  try{
    const to = cartBtn.getBoundingClientRect();
    const x = to.left + to.width/2;
    const y = to.top + to.height/2;
    const flash = document.createElement('div');
    flash.className = 'cartFlash';
    flash.style.left = (x-18) + 'px';
    flash.style.top  = (y-18) + 'px';
    document.body.appendChild(flash);
    setTimeout(()=>{ try{ flash.remove(); }catch(e){} }, 520);
  }catch(e){}
}
function spawnCartSparkles(cartBtn){
  try{
    const to = cartBtn.getBoundingClientRect();
    const x = to.left + to.width/2;
    const y = to.top + to.height/2;

    const box = document.createElement('div');
    box.className = 'cartSparkles';
    box.style.left = x + 'px';
    box.style.top  = y + 'px';
    document.body.appendChild(box);

    const count = 7;
    for(let i=0;i<count;i++){
      const p = document.createElement('span');
      p.className = 'spark';
      const ang = (Math.PI*2) * (i/count) + (Math.random()*0.35);
      const dist = 22 + Math.random()*18;
      const dx = Math.cos(ang)*dist;
      const dy = Math.sin(ang)*dist;
      p.style.setProperty('--dx', dx.toFixed(2)+'px');
      p.style.setProperty('--dy', dy.toFixed(2)+'px');
      p.style.setProperty('--d', (420 + Math.random()*220).toFixed(0)+'ms');
      box.appendChild(p);
    }
    setTimeout(()=>{ try{ box.remove(); }catch(e){} }, 760);
  }catch(e){}
}

}

const state = {
  cat: null,
  categories: [],
  menu: [],
  cart: [],
  pendingAdd: null,
  // Wolt-style flow: cart -> checkout
  cartStep: "cart", // cart|checkout
  serviceType: "delivery", // delivery|pickup
  paymentStatus: "unpaid", // unpaid|paid (matches kopa)
  checkout: {
    addressText: "",
    etaText: "",
    distanceKm: null,
    userLatLng: null,
  }
};

// Store location (Jaffa) for delivery ETA. You can adjust later.
const STORE_LATLNG = window.STORE_LATLNG || (window.STORE_LATLNG = { lat: 32.0542, lng: 34.7516 });
const ASSUMED_COURIER_KMH = 22; // used for ETA estimate when only distance is known
const ASSUMED_PREP_MIN = 12; // base prep time

// Store location (Jaffa). You can change this later from Firebase settings if you want.
// const STORE_LATLNG = { lat: 32.0539, lng: 34.7500 }; // (deduped)
const ASSUMED_SPEED_KMH = 23; // delivery rider average
const PICKUP_PREP_MIN = 18;


// hero buttons
const heroBtn1 = document.getElementById("heroBtn1");
const heroBtn2 = document.getElementById("heroBtn2");
if(heroBtn1) heroBtn1.onclick = () => {
  const pizza = state.categories.find(c => c.id === 'pizza');
  if(pizza){ state.cat = pizza.id; render(); window.scrollTo({top:0, behavior:'smooth'}); }
};
if(heroBtn2) heroBtn2.onclick = () => {
  if(state.categories.length){ state.cat = state.categories[0].id; render(); window.scrollTo({top:0, behavior:'smooth'}); }
};

// ---------- Load categories + menu ----------
let categoriesMap = new Map(); // id -> {label, sortOrder, active}
let toppingMediaMap = new Map(); // id -> {pieces:[]}

// --- Performance: preload topping images so they appear instantly on first tap ---
const __toppingImgCache = new Map(); // url -> HTMLImageElement
function __preloadToppingUrl(url){
  try{
    url = String(url||"").trim();
    if(!url || __toppingImgCache.has(url)) return;
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = url;
    // decode() makes first paint faster when supported
    try{ if(img.decode) img.decode().catch(()=>{}); }catch(e){}
    __toppingImgCache.set(url, img);
  }catch(e){}
}


// Normalize category ids so Admin (which saves category docs with slug ids)
// matches the customer app even if menu items use uppercase/extra spaces, etc.
function catIdOf(raw){
  return String(raw||"")
    .trim()
    .toLowerCase()
    .replace(/\s+/g,"-")
    .replace(/[^a-z0-9\u0590-\u05FF\u0600-\u06FF\-_.]/g,"")
    .replace(/-+/g,"-")
    .slice(0,80) || "uncat";
}
function listenCategories(){
  const colRef = collection(db, "categories");
  onSnapshot(colRef, (snap) => {
    const m = new Map();
    snap.forEach((d)=> {
      const data = d.data() || {};
      m.set(d.id, { id: d.id, ...data });
    });
    categoriesMap = m;
    rebuildCategories();
  });
}


function listenToppingsMedia(){
  const colRef = collection(db, "toppingsMedia");
  onSnapshot(colRef, (snap) => {
    const m = new Map();
    snap.forEach((d)=> m.set(d.id, d.data() || {}));
    toppingMediaMap = m;

// Preload all pieces (best effort) so first tap has zero delay
try{
  for(const [tid, data] of m.entries()){
    const pieces = Array.isArray(data?.pieces) ? data.pieces : [];
    for(const u of pieces) __preloadToppingUrl(u);
  }
}catch(e){}

    try{ if(window.__pendingPizza) renderPizzaOverlay(window.__pendingPizza); }catch(e){}
  });
}

function pickToppingPieceUrl(tid, rnd){
  const data = toppingMediaMap.get(tid) || {};
  const rawPieces = Array.isArray(data.pieces) ? data.pieces : [];
  // Accept any image URL except SVG (no extension checks, Firebase URLs may not end with .png)
  const pieces = rawPieces
    .filter(u => typeof u === "string")
    .map(u => u.trim())
    .filter(Boolean)
    .filter(u => !/\.svg(\?|$)/i.test(u));
  if(pieces.length){
    const idx = Math.floor(rnd()*pieces.length);
    const url = pieces[idx]; __preloadToppingUrl(url); return url;
  }
  return null;
}

function listenMenu(){
  const qRef = query(collection(db,"menu"), where("active","==", true));
  onSnapshot(qRef, (snap) => {
    const docs = [];
    snap.forEach((d)=> {
      const data = d.data() || {};
      // auto-split manaoushe from sfiha if not yet categorized
      try{
        const cat = (data.category||"").toString();
        const arName = (data.nameAr||data.name_ar||"").toString();
        const heName = (data.nameHe||data.name_he||"").toString();
        if(cat==="sfiha" && (/(منقوش|مناقيش)/.test(arName) || /(מנאושה|מנאקי|מנאקיש)/.test(heName))){
          data.category = "manaoushe";
        }
      }catch(e){}
      docs.push({ id: d.id, ...data });
    });
    // sort by sortOrder then name
    docs.sort((a,b)=> (Number(a.sortOrder||0)-Number(b.sortOrder||0)) || String(a.nameAr||"").localeCompare(String(b.nameAr||"")));
    state.menu = docs;
    rebuildCategories();
  });
}

function rebuildCategories(){
  // derive categories from menu, then apply categoriesMap ordering/labels if exists
  const catMap = new Map();
  for(const m of state.menu){
    if(!m.category) continue;
    const rawKey = String(m.category||"").trim();
    if(!rawKey) continue;
    const cid = catIdOf(rawKey);
    const so = Number(m.sortOrder||0)||0;
    if(!catMap.has(cid)) catMap.set(cid, { id:cid, rawKey, sortOrder: so });
    else {
      const cur = catMap.get(cid);
      cur.sortOrder = Math.min(cur.sortOrder, so);
      // keep the first seen rawKey
    }
  }
  let cats = Array.from(catMap.values());

  // include categories defined in Firestore even if no items yet
  try{
    for(const [cid,cfg] of (categoriesMap||new Map()).entries()){
      if(cfg && cfg.active===false) continue;
      if(!cats.find(x=>x.id===cid)){
        cats.push({ id: cid, rawKey: cid, sortOrder: (cfg && cfg.sortOrder!=null)?Number(cfg.sortOrder||0):9999 });
      }
    }
  }catch(e){}

  cats = cats.map((c)=> {
    const cfg = categoriesMap.get(c.id);
    if(cfg && cfg.active === false) return {...c, __disabled:true};
    return {
      ...c,
      label: (cfg && (cfg.label || cfg.nameHe || cfg.nameAr)) ? (cfg.label || cfg.nameHe || cfg.nameAr) : (c.rawKey || c.id),
      imageUrl: (cfg && cfg.imageUrl) ? cfg.imageUrl : null,
      sortOrder: (cfg && cfg.sortOrder!=null) ? Number(cfg.sortOrder||0) : c.sortOrder
    };
  }).filter(c=>!c.__disabled);

  cats.sort((a,b)=> (Number(a.sortOrder||0)-Number(b.sortOrder||0)) || String(a.label||"").localeCompare(String(b.label||"")));

  // add some fallback icons
  const icoMap = {
    pizza:"🍕", pasta:"🍝", sfiha:"🥙", salads:"🥗", salad:"🥗", drinks:"🥤",
    kids:"🧒", burgers:"🍔", burger:"🍔", starters:"🍟", desserts:"🍰", fish:"🐟", meat:"🥩"
  };
  state.categories = cats.map(c=>({...c, ico: icoMap[c.id] || "🍽️" }));

  if(!state.cat && state.categories.length) state.cat = state.categories[0].id;
  render();
}

function renderCats(){
  const wrap = $("#cats");
  wrap.innerHTML = "";
  for(const c of state.categories){
    const div = document.createElement("div");
    div.className = "cat" + (c.id === state.cat ? " cat--active" : "");
    div.innerHTML = `<div class="cat__ico">${c.imageUrl ? `<img class="cat__img" src="${c.imageUrl}" alt="">` : c.ico}</div><div class="cat__txt">${c.label}</div>`;
    div.onclick = () => { state.cat = c.id; render(); };
    wrap.appendChild(div);

    // Accent color: prefer category.accent (hex) from Firestore; otherwise deterministic per category id.
    const accent = c.accent || pickAccent(c.id);
    div.style.setProperty('--accent', accent);
    const bg = accentBgFrom(accent);
    if(bg) div.style.setProperty('--accentBg', bg);
  }
}

function renderHeader(){
  const cat = state.categories.find(x=>x.id===state.cat);
  $("#catTitle").textContent = cat ? cat.label : "תפריט";
  $("#catDesc").textContent = "בחר מוצר, והתאם בדיוק כמו שאתה אוהב.";
}

function cardImgFor(item){
  // use Storage URL if exists
  const url = item.imageUrl || item.img || null;
  if(url) return url;
  // fallback based on category
  const c = String(item.category||"");
  if(c==="pizza") return "assets/pizza-xl.svg";
  if(c==="pasta") return "assets/pasta.svg";
  return "assets/olive-icon.svg";
}

function basePriceFor(item){
  return Number(item.basePrice ?? item.price ?? 0) || 0;
}

function renderCards(){
  const cards = $("#cards");
  cards.innerHTML = "";
  let items = state.menu.filter(m => catIdOf(m.category) === state.cat);
  if(searchTerm){
    const t = normalize(searchTerm);
    items = items.filter(it => {
      const hay = normalize(it.nameHe) + ' ' + normalize(it.nameAr) + ' ' + normalize(it.descHe) + ' ' + normalize(it.desc) + ' ' + normalize(it.category);
      return hay.includes(t);
    });
  }

  if(!items.length){
    cards.innerHTML = `<div class="section"><div class="hint">אין פריטים בקטגוריה הזו כרגע.</div></div>`;
    return;
  }
  for(const it of items){
    const price = basePriceFor(it);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card__meta">
        <div class="card__name">${it.nameHe || it.nameAr || "פריט"}</div>
        <div class="card__desc">${it.descHe || it.desc || it.size || ""}</div>
        <div class="card__price">${fmtILS(price)}</div>
      </div>
      <img class="card__img" src="${cardImgFor(it)}" alt="${it.nameHe || it.nameAr || ""}" />
    `;
    card.onclick = () => openItemModal(it);
    cards.appendChild(card);
  }
}

function cartTotals(){
  const total = state.cart.reduce((s,x)=>s + x.total, 0);
  const count = state.cart.reduce((s,x)=>s + x.qty, 0);
  return { total, count };
}

// ---------- Delivery ETA helpers (Wolt-style) ----------
function haversineKm(a,b){
  const toRad = (d)=> d * Math.PI/180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s1 = Math.sin(dLat/2);
  const s2 = Math.sin(dLng/2);
  const h = s1*s1 + Math.cos(lat1)*Math.cos(lat2)*s2*s2;
  return 2*R*Math.asin(Math.min(1, Math.sqrt(h)));
}

function etaFromDistanceKm(km){
  if(km==null || !isFinite(km)) return "";
  // travel minutes + prep, then give a range like Wolt
  const travel = Math.max(3, Math.round((km / ASSUMED_COURIER_KMH) * 60));
  const base = ASSUMED_PREP_MIN + travel;
  const min = Math.max(10, Math.round(base*0.85));
  const max = Math.max(min+5, Math.round(base*1.15));
  return `${min}-${max} דק׳`;
}

function getUserLatLng(){
  return new Promise((resolve)=>{
    if(!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos)=> resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()=> resolve(null),
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 15000 }
    );
  });
}

let __checkoutMap = null;
let __checkoutUserMarker = null;
let __checkoutStoreMarker = null;
let __checkoutLine = null;

async function ensureCheckoutMap(){
  const el = document.getElementById("checkoutMap");
  if(!el) return;
  if(typeof L === "undefined") return; // Leaflet not loaded

  if(!__checkoutMap){
    __checkoutMap = L.map(el, { zoomControl: false, attributionControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(__checkoutMap);
    __checkoutStoreMarker = L.marker([STORE_LATLNG.lat, STORE_LATLNG.lng]).addTo(__checkoutMap);
    __checkoutMap.setView([STORE_LATLNG.lat, STORE_LATLNG.lng], 13);
  }

  // Update user marker + ETA if we can
  const u = await getUserLatLng();
  state.checkout.userLatLng = u;
  if(u){
    if(!__checkoutUserMarker) __checkoutUserMarker = L.marker([u.lat, u.lng]).addTo(__checkoutMap);
    else __checkoutUserMarker.setLatLng([u.lat, u.lng]);

    const km = haversineKm(STORE_LATLNG, u);
    state.checkout.distanceKm = km;
    state.checkout.etaText = etaFromDistanceKm(km);

    if(__checkoutLine){ __checkoutLine.remove(); __checkoutLine = null; }
    __checkoutLine = L.polyline([[STORE_LATLNG.lat, STORE_LATLNG.lng],[u.lat,u.lng]], { weight: 4, opacity: 0.8 }).addTo(__checkoutMap);
    const bounds = L.latLngBounds([[STORE_LATLNG.lat, STORE_LATLNG.lng],[u.lat,u.lng]]);
    __checkoutMap.fitBounds(bounds, { padding: [28,28] });
  } else {
    state.checkout.distanceKm = null;
    state.checkout.etaText = "";
    if(__checkoutUserMarker){ __checkoutUserMarker.remove(); __checkoutUserMarker = null; }
    if(__checkoutLine){ __checkoutLine.remove(); __checkoutLine = null; }
    __checkoutMap.setView([STORE_LATLNG.lat, STORE_LATLNG.lng], 13);
  }
}

function renderBottom(){
  const { total, count } = cartTotals();
  $("#ctaPrice").textContent = fmtILS(total);
  $("#cartCount").textContent = String(count);
}


// ---------- Search ----------
let searchTerm = "";
function normalize(s){ return String(s||"").toLowerCase().trim(); }
function applySearchUI(){
  const inp = document.getElementById("searchInput");
  const clear = document.getElementById("searchClear");
  if(!inp || !clear) return;
  const box = inp.closest(".search");
  if(box) box.classList.toggle("hasText", !!searchTerm);
  clear.onclick = () => { searchTerm=""; inp.value=""; render(); };
  inp.oninput = () => { searchTerm = inp.value; render(); };
}

function render(){
  renderCats();
  renderHeader();
  renderCards();
  renderBottom();
  applySearchUI();
}

function openCart(open){
  renderCart();
  setAriaOpen($("#cartDrawer"), open);
}

$("#btnCart").onclick = () => openCart(true);
$("#btnCheckout").onclick = () => openCart(true);
$("#btnBack").onclick = () => alert("דמו: חזרה למסך קודם באפליקציה אמיתית.");

// escapeHtml: use var so redeclaration will not crash if the script is injected twice (some lockdown tools do that)
var escapeHtml = (globalThis && globalThis.escapeHtml) ? globalThis.escapeHtml : function(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("\'","&#039;");
};
try{ if(globalThis) globalThis.escapeHtml = escapeHtml; }catch(e){}

function cryptoRandomId(){ return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16); }

// ---------- Customization editors (pizza/pasta) ----------

// ---- Live toppings (from Firestore) ----
let TOPPINGS_DB = null; // array of {id, kind, name}
let PRICING_RULES = null; // {L:{...},M:{...},P:{...}}
let SAUCES_DB = null; // unified sauces from Firestore i18n/sauces
let PASTA_TOPPINGS_DB = null; // from Firestore pastaOptions (optional)


function sizeKeyForItem(item){
  const s = (item?.size || item?.sizeAr || item?.nameHe || item?.nameAr || item?.id || "").toString();
  if(/(xl|xlarge|גדול|كبيرة|كبير|LARGE)/i.test(s)) return "L";
  if(/(medium|בינונ|وسط|M\b)/i.test(s)) return "M";
  if(/(personal|אישי|صغير|P\b)/i.test(s)) return "P";
  // fallback: many "pizza-xl" etc
  if(/xl/i.test(item?.id||"")) return "L";
  if(/m(edium)?/i.test(item?.id||"")) return "M";
  return "M";
}

function toppingKindFor(id, fallbackKind="regular"){
  if(!TOPPINGS_DB) return fallbackKind;
  const o = TOPPINGS_DB.find(x=>x.id===id);
  return o?.kind || fallbackKind;
}



// Map customer-side coverage/area selection into a normalized value for the POS/kitchen.
// In ultra-clean mode we may not have any area picker; default to "all".
function mapCoverageForKopa(cfg){
  // Customer topping-area selection uses: { mode: "all" | "halfLeft" | "halfRight" | "quarters", quarters:[1..4] }
  // POS expects: "all" | "half_left" | "half_right" | "q_right_top" | "q_right_bottom" | "q_left_top" | "q_left_bottom"
  try{
    if(!cfg) return "all";

    // Backward compatibility if someone stored {coverage:"..."}
    const raw = cfg.coverage || cfg.cover || cfg.area || cfg.zone || cfg.region || cfg.part;
    if(raw){
      if(typeof raw === "string") return raw;
      if(typeof raw === "object" && raw.key) return String(raw.key);
    }

    const mode = String(cfg.mode || "all");
    if(mode === "all") return "all";
    if(mode === "halfLeft") return "half_left";
    if(mode === "halfRight") return "half_right";

    if(mode === "quarters"){
      // caller should split by quarters; return a sensible default if needed
      const qs = Array.isArray(cfg.quarters) ? cfg.quarters : [];
      const q = qs[0] || 1;
      switch(q){
        case 1: return "q_right_top";
        case 2: return "q_right_bottom";
        case 3: return "q_left_top";
        case 4: return "q_left_bottom";
        default: return "q_right_top";
      }
    }

    return "all";
  }catch(e){
    return "all";
  }
}

// Stable language-neutral IDs for coverage (best for saving to Firestore and translating in POS/print).
// Customer UI config uses: { mode: "all" | "halfLeft" | "halfRight" | "quarters", quarters:[1..4] }
function mapCoverageId(cfg){
  try{
    if(!cfg) return "ALL";

    // Backward compatibility if someone stored {coverageId:"..."}
    const rawId = cfg.coverageId || cfg.covId || cfg.coverage_id;
    if(rawId && typeof rawId === "string") return rawId;

    const raw = cfg.coverage || cfg.cover || cfg.area || cfg.zone || cfg.region || cfg.part;
    if(raw && typeof raw === "string"){
      // Map legacy strings into IDs
      const s = raw;
      if(s === "all" || s === "full") return "ALL";
      if(s === "half_left" || s === "half-left") return "HALF_LEFT";
      if(s === "half_right" || s === "half-right") return "HALF_RIGHT";
      if(s === "q_right_top" || s === "quarter-right-top" || s === "quarter_right_top") return "Q1";
      if(s === "q_right_bottom" || s === "quarter-right-bottom" || s === "quarter_right_bottom") return "Q2";
      if(s === "q_left_top" || s === "quarter-left-top" || s === "quarter_left_top") return "Q3";
      if(s === "q_left_bottom" || s === "quarter-left-bottom" || s === "quarter_left_bottom") return "Q4";
      return "ALL";
    }

    const mode = String(cfg.mode || "all");
    if(mode === "all") return "ALL";
    if(mode === "halfLeft") return "HALF_LEFT";
    if(mode === "halfRight") return "HALF_RIGHT";

    if(mode === "quarters"){
      const qs = Array.isArray(cfg.quarters) ? cfg.quarters : [];
      const q = qs[0] || 1;
      if(q === 1) return "Q1";
      if(q === 2) return "Q2";
      if(q === 3) return "Q3";
      if(q === 4) return "Q4";
      return "Q1";
    }
    return "ALL";
  }catch(e){
    return "ALL";
  }
}

// Map coverageId -> the legacy coverage key used by the current POS logic.
// (POS already supports underscore format in printing; we keep it consistent.)
function coverageIdToLegacy(coverageId){
  switch(String(coverageId||"ALL")){
    case "ALL": return "all";
    case "HALF_LEFT": return "half_left";
    case "HALF_RIGHT": return "half_right";
    case "Q1": return "q_right_top";
    case "Q2": return "q_right_bottom";
    case "Q3": return "q_left_top";
    case "Q4": return "q_left_bottom";
    default: return "all";
  }
}

function toppingPriceFor(item, tid){
  const key = sizeKeyForItem(item);
  const kind = toppingKindFor(tid, "regular");
  let pkey = (kind==="special") ? "special" : "regular";
  if(tid==="shrimp") pkey = "shrimp";
  if(tid==="cheese_crust") pkey = "cheese_crust";
  const pr = PRICING_RULES?.[key]?.[pkey];
  // For pastries/manoushe/sfiha: allow per-topping override from Firestore (options.pastryPrice)
  try{
    const cat = normKey(item?.category);
    const isPastryLike = (cat.includes("pastry") || cat.includes("sfiha") || cat.includes("mana") || cat.includes("manak") || cat.includes("burek") || cat.includes("calzone"));
    if(isPastryLike && TOPPINGS_DB){
      const o = TOPPINGS_DB.find(x=>x.id===tid);
      const pp = o?.pastryPrice;
      if(Number.isFinite(Number(pp))) return Number(pp);
    }
  }catch(e){}
  return Number.isFinite(Number(pr)) ? Number(pr) : 0;
}

async function loadToppingsAndPricing(){
  try{
    // pricingRules/pizza_toppings_by_size
    const prSnap = await getDoc(doc(db, "pricingRules", "pizza_toppings_by_size"));
    PRICING_RULES = prSnap.exists() ? (prSnap.data()||{}) : null;

    // options collection
    const optSnap = await getDocs(collection(db, "options"));
    const arr = [];
    optSnap.forEach(d=>{
      const v = d.data()||{};
      const nameObj = (v.name && typeof v.name==='object') ? v.name : { ar: (v.ar||v['العربية']||v['Arabic']||v['name_ar']||v['nameAr']||v.name||''), he: (v.he||v['עברית']||v['Hebrew']||v['name_he']||v['nameHe']||''), en: (v.en||v['English']||v['name_en']||v['nameEn']||'') };
      const ar = nameObj.ar || '';
      const he = nameObj.he || '';
      const en = nameObj.en || '';
      arr.push({ id:d.id, ...v, kind: __normKind(v.kind||'regular'), name: nameObj, ar, he, en, label: ar||he||en||d.id, sort: (v.sort??v.sortOrder??999), isActive: v.isActive!==false });
    });
    TOPPINGS_DB = arr.filter(x=>x.isActive);
  }catch(e){
    console.warn("loadToppingsAndPricing failed", e);
  }
}

async function loadUnifiedSauces(){
  try{
    const sSnap = await getDoc(doc(db, "i18n", "sauces"));
    if(!sSnap.exists()) { SAUCES_DB = null; return; }
    const data = sSnap.data() || {};
    const arr = [];
    for(const [id, v] of Object.entries(data)){
      if(!id) continue;
      const o = v || {};
      arr.push({
        id,
        ar: o.ar || o["العربية"] || o.arabic || "",
        he: o.he || o["עברית"] || "",
        en: o.en || o["English"] || "",
        img: o.img || o.iconUrl || null,
        imgPath: o.imgPath || o.iconPath || null,
        sort: (o.sort ?? 999)
      });
    }
    SAUCES_DB = arr.sort((a,b)=>(a.sort??999)-(b.sort??999));
  }catch(e){
    console.warn('loadUnifiedSauces failed', e);
    SAUCES_DB = null;
  }
}

async function loadPastaOptions(){
  try{
    const snap = await getDocs(collection(db, "pastaOptions"));
    const arr = [];
    snap.forEach(d=>{
      const v = d.data()||{};
      const ar = v.ar || v["العربية"] || v.nameAr || "";
      const he = v.he || v["עברית"] || v.nameHe || "";
      const en = v.en || v["English"] || v.nameEn || "";
      const kind = __normKind(v.kind || "regular");
      arr.push({ id:d.id, ...v, ar, he, en, kind, price: Number(v.price||0)||0, sort:(v.sort??v.sortOrder??999), isActive: v.isActive!==false });
    });
    PASTA_TOPPINGS_DB = arr.filter(x=>x.isActive).sort((a,b)=>(a.sort??999)-(b.sort??999));
  }catch(e){
    console.warn('loadPastaOptions failed', e);
    PASTA_TOPPINGS_DB = null;
  }
}

const TOPPINGS_DEMO = [
  { id:"corn", label:"תירס", price:5 },
  { id:"mush", label:"פטריות", price:6 },
  { id:"olives", label:"זיתים", price:6 },
  { id:"tomato", label:"עגבניות", price:6 },

  // Added (Arabic)
  { id:"green_olives", label:"زتون اخضر", price:6 },
  { id:"black_olives", label:"زتون اسمر", price:6 },
  { id:"tires", label:"تيرس", price:7 },
  { id:"patriot", label:"بتريوت", price:7 },
  { id:"belgriet", label:"بلجريت", price:7 },
  { id:"egg", label:"بيضه", price:7 },
  { id:"shrimp", label:"جمبا", price:12 },
  { id:"onion", label:"بصل", price:5 },
  { id:"hot_pepper", label:"فلفل حار", price:5 },
];

function toppingSvgFor(id){
  const map = {
    corn: "assets/t_corn.svg",
    mush: "assets/t_mush.svg",
    olives: "assets/t_olives.svg",
    tomato: "assets/t_tomato.svg",

    // Arabic / extras
    green_olives: "assets/t_green_olives.svg",
    black_olives: "assets/t_black_olives.svg",
    tires: "assets/t_tires.svg",
    patriot: "assets/t_patriot.svg",
    belgriet: "assets/t_belgriet.svg",
    egg: "assets/t_egg.svg",
    shrimp: "assets/t_shrimp.svg",
    onion: "assets/t_onion.svg",
    hot_pepper: "assets/t_hot_pepper.svg",
  };
  return map[id] || "assets/t_olives.svg";
}

function seedFromString(str){
  let h = 2166136261 >>> 0;
  for(let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function lcg(seed){
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return (s >>> 0) / 4294967296;
  };
}

function setOverlaySize(){
  const img = $("#modalImg");
  const overlay = null;
  if(!img || !overlay) return;
  const rect = img.getBoundingClientRect();
  const size = Math.max(140, Math.min(rect.width, rect.height) - 32);
  overlay.style.width = size + "px";
  overlay.style.height = size + "px";
}

// Customer pizza overlay: base number of topping pieces per topping
// Keep this relatively low so the pizza looks elegant (no clutter)
// Base amount of pieces per topping when coverage is "all".
// Kept moderate (user asked: less clutter) and the spread algorithm handles an elegant distribution.
const BASE_PIECE_COUNT = 24;

function toppingVisualProfile(tid){
  // Controls density + spacing so it looks premium and proportional.
  // Small toppings (corn/olives/onion rings) should be denser.
  const small = new Set(["onion","corn","black_olives","green_olives","olives","tires"]);
  const large = new Set(["mushrooms","patriot","belgriet","shrimp","egg"]);
  if(small.has(tid)) return { baseCount: 44, distSame: 0.56, distGlobal: 0.46 };
  if(large.has(tid)) return { baseCount: 18, distSame: 0.78, distGlobal: 0.58 };
  return { baseCount: 24, distSame: 0.66, distGlobal: 0.52 };
}


function renderPizzaOverlay(pending){
  const hero = document.getElementById("heroPizza");
  const base = document.getElementById("modalImg");
  if(!hero || !base) return;

  // Smoothly fade-out old pieces (instead of hard remove)
const oldPieces = Array.from(hero.querySelectorAll("img.pizzaPiece"));
oldPieces.forEach(n=>{
  n.classList.remove("is-in");
  n.classList.add("is-out");
});
// remove after transition
if(oldPieces.length){
  setTimeout(()=>{ oldPieces.forEach(n=>{ try{ n.remove(); }catch(e){} }); }, 260);
}

// Remove old legend immediately (we don't animate it)
const oldLegend = hero.querySelector('#pizzaPiecesLegend');
if(oldLegend) oldLegend.remove();

if(!pending) return;

  // Collect selected toppings from config
  const selections = [];
  try{
    const tcfg = pending?.config?.toppings || {};
    for(const [tid, cfg] of Object.entries(tcfg)){
      if(!cfg) continue;
      if(cfg.mode === "quarters" && Array.isArray(cfg.quarters) && cfg.quarters.length===0) continue;
      if(cfg.mode === "none") continue;
      selections.push({ id: tid, cfg });
    }
  }catch(e){}

  if(selections.length===0) return;

  const w = hero.clientWidth || 260;
  const h = hero.clientHeight || 260;
  const cx = w/2, cy = h/2;

  // Support pastries (sfiha / manoushe) using an ellipse mask (image isn't a perfect circle like pizza).
  const isPastryMode = !!(pending?.baseItem && !isPizza(pending.baseItem) && isPastryToppable(pending.baseItem));
  const maskKind = isPastryMode ? "ellipse" : "circle";

  const baseR = Math.min(w,h)/2;
  const rx = (maskKind==="ellipse") ? (baseR * 0.92) : baseR;
  const ry = (maskKind==="ellipse") ? (baseR * 0.70) : baseR;

  // Keep everything inside the visible shape (avoid edges)
  // Piece size scales with preview size
  const uniformSize = Math.max(30, Math.round(Math.min(w,h) * 0.115));
  // Safety margin (never on the edge). Also subtract half the piece size.
  const crustGap = Math.max(10, Math.round(uniformSize * 0.25));
  const safeRx = Math.max(30, rx - crustGap - Math.round(uniformSize/2));
  const safeRy = Math.max(22, ry - crustGap - Math.round(uniformSize/2));
  const safeR0 = Math.max(24, Math.min(safeRx, safeRy)); // reference radius for sampling
  // Avoid extreme center stacking: do not place directly in the center point.
  const minR = Math.max(10, Math.round(uniformSize * 0.35));

  function angleRangesForCfg(cfg){
    // Screen coords: +x right, +y down. atan2(dy,dx).
    if(!cfg || !cfg.mode || cfg.mode === "all") return [[-Math.PI, Math.PI]];
    if(cfg.mode === "halfRight") return [[-Math.PI/2, Math.PI/2]];
    if(cfg.mode === "halfLeft")  return [[Math.PI/2, Math.PI], [-Math.PI, -Math.PI/2]];
    if(cfg.mode === "quarters"){
      const qs = Array.isArray(cfg.quarters) ? cfg.quarters : [];
      const ranges = [];
      // q1 top-right, q2 bottom-right, q3 top-left, q4 bottom-left
      if(qs.includes(1)) ranges.push([-Math.PI/2, 0]);
      if(qs.includes(2)) ranges.push([0, Math.PI/2]);
      if(qs.includes(3)) ranges.push([-Math.PI, -Math.PI/2]);
      if(qs.includes(4)) ranges.push([Math.PI/2, Math.PI]);
      return ranges.length ? ranges : [[-Math.PI, Math.PI]];
    }
    return [[-Math.PI, Math.PI]];
  }

  function pickRange(ranges, rnd){
    const spans = ranges.map(r=>Math.max(0, r[1]-r[0]));
    const total = spans.reduce((a,b)=>a+b,0) || 1;
    let t = rnd()*total;
    for(let i=0;i<ranges.length;i++){
      t -= spans[i];
      if(t <= 0) return ranges[i];
    }
    return ranges[0];
  }

  function samplePointInZone(cfg, rnd){
    const ranges = angleRangesForCfg(cfg);
    let [a0,a1] = pickRange(ranges, rnd);

    // Add a small angular padding so pieces don't cross half/quarter borders (visual spill)
    const mode = cfg?.mode || "all";
    const pad = (mode === "all") ? 0 : 0.18; // ~10deg
    if(pad){
      a0 += pad; a1 -= pad;
      if(a1 <= a0){ // fallback if range too tight
        a0 -= pad; a1 += pad;
      }
    }

    const ang = a0 + rnd()*(a1-a0);
    // Uniform area distribution across the *whole* pizza surface,
    // but keep a safe distance from the crust and avoid the absolute center.
    const maxR = Math.max(minR + 1, safeR0);
    const rr = minR + Math.sqrt(rnd()) * (maxR - minR);
    let x = cx + rr * Math.cos(ang);
    let y = cy + rr * Math.sin(ang);

    if(maskKind === "ellipse"){
      // Map circle sample to ellipse by stretching axes proportionally.
      const dx = x - cx, dy = y - cy;
      const nx = dx / Math.max(1e-6, safeR0);
      const ny = dy / Math.max(1e-6, safeR0);
      x = cx + nx * safeRx;
      y = cy + ny * safeRy;
    }
    return {x,y};
  }

  function dist2(a,b){
    const dx = a.x - b.x, dy = a.y - b.y;
    return dx*dx + dy*dy;
  }

  function generatePoints(cfg, count, minDistSame, minDistGlobal, globalPts, rnd){
  // Premium look: evenly spread pieces (no random clumps), while still respecting borders + spacing.
  // Strategy:
  // 1) Build stratified "cells" over angle+r (per allowed zone) and try 1–2 darts per cell.
  // 2) If still missing, fall back to random fill with progressive relaxation (like before).

  const pts = [];

  function dist2(a,b){
    const dx = a.x - b.x, dy = a.y - b.y;
    return dx*dx + dy*dy;
  }

  function angleRangesForCfg(cfg){
    if(!cfg || !cfg.mode || cfg.mode === "all") return [[-Math.PI, Math.PI]];
    if(cfg.mode === "halfRight") return [[-Math.PI/2, Math.PI/2]];
    if(cfg.mode === "halfLeft")  return [[Math.PI/2, Math.PI], [-Math.PI, -Math.PI/2]];
    if(cfg.mode === "quarters"){
      const qs = Array.isArray(cfg.quarters) ? cfg.quarters : [];
      const ranges = [];
      // q1 top-right, q2 bottom-right, q3 top-left, q4 bottom-left
      if(qs.includes(1)) ranges.push([-Math.PI/2, 0]);
      if(qs.includes(2)) ranges.push([0, Math.PI/2]);
      if(qs.includes(3)) ranges.push([-Math.PI, -Math.PI/2]);
      if(qs.includes(4)) ranges.push([Math.PI/2, Math.PI]);
      return ranges.length ? ranges : [[-Math.PI, Math.PI]];
    }
    return [[-Math.PI, Math.PI]];
  }

  function shuffleInPlace(arr){
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(rnd()*(i+1));
      const tmp = arr[i]; arr[i]=arr[j]; arr[j]=tmp;
    }
    return arr;
  }

  function samplePointInCell(a0,a1, r0,r1){
    // honor same padding rule used elsewhere to avoid visual spill across borders
    const mode = cfg?.mode || "all";
    const pad = (mode === "all") ? 0 : 0.18;
    let aa0 = a0 + pad, aa1 = a1 - pad;
    if(aa1 <= aa0){ aa0 = a0; aa1 = a1; }
    const ang = aa0 + rnd()*(aa1-aa0);

    // area-uniform within annulus slice
    const rr = Math.sqrt(r0*r0 + rnd()*((r1*r1)-(r0*r0)));

    return { x: cx + rr*Math.cos(ang), y: cy + rr*Math.sin(ang) };
  }

  function isOk(p, md2, gd2){
    for(const q of pts){
      if(dist2(p,q) < md2) return false;
    }
    for(const g of globalPts){
      if(dist2(p,g) < gd2) return false;
    }
    return true;
  }

  function tryStratifiedFill(target, md, gd){
    if(target <= 0) return;
    const md2 = md*md;
    const gd2 = gd*gd;

    const ranges = angleRangesForCfg(cfg);
    const totalSpan = ranges.reduce((s,r)=>s+Math.max(0,r[1]-r[0]),0) || (2*Math.PI);

    // bins: more cells than pieces so we can pick evenly
    const binsA = Math.max(3, Math.ceil(Math.sqrt(target*3.2)));
    const binsR = Math.max(3, Math.ceil(Math.sqrt(target*2.2)));

    // radial bands: avoid crust + avoid absolute center like before
    const maxR = Math.max(minR + 1, safeR);
    const rSpan = Math.max(1, (maxR - minR));
    const dr = rSpan / binsR;

    const cells = [];
    for(const [ra0,ra1] of ranges){
      const span = Math.max(0, ra1-ra0);
      const aBins = Math.max(1, Math.round(binsA * (span / totalSpan)));
      const da = span / aBins;
      for(let ai=0; ai<aBins; ai++){
        const a0 = ra0 + ai*da;
        const a1 = ra0 + (ai+1)*da;
        for(let ri=0; ri<binsR; ri++){
          const r0 = minR + ri*dr;
          const r1 = minR + (ri+1)*dr;
          cells.push({a0,a1,r0,r1});
        }
      }
    }

    shuffleInPlace(cells);

    // 1 pass: one try per cell
    for(const c of cells){
      if(pts.length >= target) break;
      const p = samplePointInCell(c.a0,c.a1,c.r0,c.r1);
      if(isOk(p, md2, gd2)) pts.push(p);
    }

    // 2nd pass: try again in cells we didn't use (helps when spacing is tight)
    if(pts.length < target){
      for(const c of cells){
        if(pts.length >= target) break;
        const p = samplePointInCell(c.a0,c.a1,c.r0,c.r1);
        if(isOk(p, md2, gd2)) pts.push(p);
      }
    }
  }

  function randomFill(target, md, gd, triesPerMissing){
    const md2 = md*md;
    const gd2 = gd*gd;
    const missing = Math.max(0, target - pts.length);
    // IMPORTANT: keep this bounded so clicks never freeze the UI.
    // We try a limited number of darts per *missing* point.
    const triesMax = Math.min(700, Math.max(120, Math.round(missing * (triesPerMissing || 40))));
    for(let t=0; t<triesMax && pts.length<target; t++){
      const p = samplePointInZone(cfg, rnd);
      if(isOk(p, md2, gd2)) pts.push(p);
    }
  }

  // Stage 0: stratified (prevents clumps and looks "designed")
  tryStratifiedFill(count, minDistSame, minDistGlobal);

  // Stage 1: if still short (tight spacing), random fill
  if(pts.length < count){
    randomFill(count, minDistSame, minDistGlobal, 140);
  }

  // Stage 2: relax a bit if needed (many toppings at once)
  if(pts.length < Math.max(2, Math.floor(count * 0.92))){
    randomFill(count, Math.max(9, minDistSame * 0.80), Math.max(7, minDistGlobal * 0.78), 170);
  }

  // Stage 3: last resort
  if(pts.length < Math.max(2, Math.floor(count * 0.98))){
    randomFill(count, Math.max(8, minDistSame * 0.70), Math.max(6, minDistGlobal * 0.66), 220);
  }

  // Commit to global points
  for(const p of pts) globalPts.push(p);

  return pts;
}

  const globalPts = [];

  // Stable deterministic RNG per topping+coverage so the toppings do NOT move on every click/render.
  function cfgKey(cfg){
    const m = cfg?.mode || "all";
    if(m === "quarters"){
      const qs = Array.isArray(cfg?.quarters) ? cfg.quarters.slice().sort((a,b)=>a-b) : [];
      return `quarters:${qs.join(',')}`;
    }
    return m;
  }

  // Deterministic order so later toppings don't always "lose" placement when many are selected.
  const order = selections.slice();
  try{
    const baseSeed = seedFromString(String(pending?.baseItem?.id || pending?.baseItem?.nameHe || pending?.baseItem?.nameAr || "item") + "|overlayOrder");
    const ro = lcg(baseSeed);
    for(let i = order.length - 1; i > 0; i--){
      const j = Math.floor(ro() * (i + 1));
      const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
    }
  }catch(e){}

  order.forEach(sel=>{
    const tid = sel.id;
    const cfg = sel.cfg;
    
    // Deterministic seed PER topping + item (NOT per selected area),
    // so the same topping keeps the exact same pattern whether you pick all/half/quarters.
    const seedStr = `${pending?.baseItem?.id || pending?.baseItem?.nameHe || pending?.baseItem?.nameAr || "item"}|${tid}|base`;
    const rnd = lcg(seedFromString(seedStr));

    // Coverage fraction so quantity always scales correctly:
    // - all: 1
    // - half: 0.5
    // - quarters: (#selected)/4
    function coverageFraction(cfg){
      const mode = cfg?.mode || "all";
      if(mode === "all") return 1;
      if(mode === "halfRight" || mode === "halfLeft") return 0.5;
      if(mode === "quarters"){
        const qs = Array.isArray(cfg?.quarters) ? cfg.quarters : [];
        const k = Math.max(0, Math.min(4, qs.length));
        if(k===4) return 1;
        return k/4;
      }
      return 1;
    }

    // Pre-generate a FULL-pizza pattern once, then "mask" it for half/quarters.
    // This keeps the same positions + same amount proportional to area.
    window.__pizzaOverlayCache = window.__pizzaOverlayCache || {};
    const cacheKey = `${pending?.baseItem?.id || pending?.baseItem?.nameHe || pending?.baseItem?.nameAr || "item"}|${tid}`;
    const cache = window.__pizzaOverlayCache[cacheKey] || (window.__pizzaOverlayCache[cacheKey] = { base: null });

    const toppingN = Math.max(1, selections.length);

    const profile = toppingVisualProfile(tid);
    // If many toppings are selected, slightly reduce density to avoid clutter.
    const crowd = (toppingN > 7) ? 0.78 : (toppingN > 5 ? 0.88 : 1);
    const baseCount = Math.max(8, Math.round((profile.baseCount || BASE_PIECE_COUNT) * crowd));
    const frac = coverageFraction(cfg);
    // Exact proportional count (no artificial min that breaks quarter/half)
    const targetCount = Math.max(1, Math.round(baseCount * frac));

    // Spacing tuned per topping size (small toppings can be closer).
    const minDist = Math.max(8, Math.round(uniformSize * (profile.distSame || 0.66))); // within same topping
    const globalMinDist = Math.max(6, Math.round(uniformSize * (profile.distGlobal || 0.52)));

    function isAngleInRanges(a, ranges){
      for(const r of ranges){
        if(r[0] <= r[1]){
          if(a >= r[0] && a <= r[1]) return true;
        }else{
          // wrapped range (rare)
          if(a >= r[0] || a <= r[1]) return true;
        }
      }
      return false;
    }

    function maskedBasePieces(basePieces, cfg, need){
      if(!cfg) return basePieces.slice(0, need);
      const mode0 = (cfg.mode||"all");
      if(mode0==="all") return basePieces.slice(0, need);
      if(mode0==="quarters"){
        const qs0 = Array.isArray(cfg?.quarters) ? cfg.quarters : [];
        if(qs0.length===4) return basePieces.slice(0, need);
      }

      const ranges = angleRangesForCfg(cfg);
      const mode = cfg?.mode || "all";
      const pad = (mode === "all") ? 0 : 0.18;
      const padded = ranges.map(([a0,a1])=>{
        let b0=a0, b1=a1;
        if(pad){ b0 += pad; b1 -= pad; }
        if(b1 <= b0){ b0 = a0; b1 = a1; } // fallback
        return [b0,b1];
      });

      const out = [];
      for(const piece of basePieces){
        const ang = Math.atan2(piece.y - cy, piece.x - cx);
        if(isAngleInRanges(ang, padded)) out.push(piece);
        if(out.length >= need) break;
      }
      return out;
    }

    // Ensure base pattern exists and has enough candidates for masking.
    // IMPORTANT PERF FIX:
    // `generatePoints()` returns only {x,y} points. Older code mistakenly expected p.url,
    // so it generated a LOT of points (and polluted globalPts) but created ZERO pieces,
    // then immediately generated AGAIN in the "extra" block. That caused big delays
    // on iPhone and desktop.
    if(!cache.base){
      const needBase = Math.max(60, baseCount*6);
      const pts = generatePoints({mode:"all"}, needBase, minDist, globalMinDist, globalPts, rnd);
      const basePieces = [];
      for(const p of pts){
        const url = pickToppingPieceUrl(tid, rnd);
        if(!url) continue;
        basePieces.push({
          x: p.x, y: p.y,
          url,
          rot: (rnd()*360).toFixed(1)+"deg"
        });
        if(basePieces.length >= needBase) break;
      }
      cache.base = basePieces;
    }

    // If masking doesn't have enough pieces (rare), top up base.
    let pieces = maskedBasePieces(cache.base, cfg, targetCount);
    if(pieces.length < targetCount){
      // generate extra base points deterministically with a second stream
      const rnd2 = lcg(seedFromString(seedStr + "|extra"));
      const extraPts = generatePoints({mode:"all"}, Math.max(40, baseCount*6), Math.max(9, minDist*0.75), Math.max(6, globalMinDist*0.7), globalPts, rnd2);
      for(const p of extraPts){
        const url = pickToppingPieceUrl(tid, rnd2);
        if(!url) continue;
        cache.base.push({ x:p.x, y:p.y, url, rot:(rnd2()*360).toFixed(1)+"deg" });
        if(cache.base.length >= Math.max(80, baseCount*12)) break;
      }
      pieces = maskedBasePieces(cache.base, cfg, targetCount);
    }
    
    const pts = pieces;


    for(const p of pts){
      const url = p.url;
      if(!url) continue;
      const img = document.createElement("img");
      img.className = "pizzaPiece";
      img.src = url;
      img.alt = "";
      img.decoding = "async";
      img.loading = "eager";
      img.style.width = uniformSize+"px";
      img.style.height = uniformSize+"px";
      img.style.left = (p.x)+"px";
      img.style.top  = (p.y)+"px";
      img.style.setProperty("--rot", (p.rot || "0deg"));
      hero.appendChild(img);
      requestAnimationFrame(()=>{ try{ img.classList.add("is-in"); }catch(e){} });
    }
  });
}

const SAUCES_SHARED = [
  // Firestore: /i18n/sauces
  // (אם לא קיים בפיירבייס, אלה ברירות מחדל)
  { id:"cream", he:"בשמל", ar:"شمنت", en:"Cream" },
  { id:"rose", he:"רוזה", ar:"روزه", en:"Rose" },
  { id:"tomato", he:"עגבניה", ar:"بندوره", en:"Tomato" },
];

// pasta + ravioli use the same sauces list
const PASTA_SAUCES = SAUCES_SHARED;
const RAVIOLI_SAUCES = SAUCES_SHARED;

function normKey(s){
  return String(s||"")
    .toLowerCase()
    .replace(/[\u200f\u200e]/g,"")
    .replace(/\s+/g,"")
    .replace(/[-_]/g,"");
}

function isPizzaLike(item){
  const c = normKey(item?.category);
  if(!c) return false;
  // pizza
  if(c.includes("pizza") || c.includes("piza")) return true;
  // sfiha / manoushe variants
  if(c.includes("sfiha") || c.includes("sficha") || c.includes("sfi7") || c.includes("manous") || c.includes("mana2") ) return true;
  // hebrew category keys
  if(c.includes("ספיחה") || c.includes("מנאקיש")) return true;
  // arabic keys if someone stored them
  if(c.includes("سفي") || c.includes("منق")) return true;
  return false;


// Strict pizza category (not pastries like sfiha/manoushe)
function isPizza(item){
  const c = normKey(item?.category);
  if(!c) return false;
  return (c.includes("pizza") || c.includes("piza"));
}

// Jachnun should NOT have toppings
function isJachnun(item){
  const id = (item?.id || "").toString().toLowerCase();
  const name = (item?.nameHe || item?.nameAr || item?.nameEn || item?.name || "").toString().toLowerCase();
  return /jach|jahn|jahno|gach|גחנ|جح/.test(id) || /jach|jahn|jahno|gach|גחנ|جح/.test(name);
}

// Manoushe rolled (מנאושה מגולגל/מגוגל) should NOT have toppings
function isManousheRolled(item){
  const id = (item?.id || "").toString().toLowerCase();
  const name = (item?.nameHe || item?.nameAr || item?.nameEn || item?.name || "").toString().toLowerCase();
  // Hebrew: מגולגל/מגוגל (common typo), Arabic: ملفوف
  return /מגולג|מגוג|מגוגל/.test(name) || /מגולג|מגוג|מגוגל/.test(id) || /ملفوف/.test(name) || /rolled/.test(name);
}

// Pastry-like categories (maafe/sfiha/manakish/malawach etc.)
function isPastry(item){
  // Some menu items may not have a clean `category` (or it may be localized).
  // Detect pastries by looking at category + names + id.
  const c = normKey(item?.category);
  const he = String(item?.nameHe||item?.name_he||"");
  const ar = String(item?.nameAr||item?.name_ar||"");
  const en = String(item?.nameEn||item?.name_en||"");
  const id = String(item?.id||"");
  const hay = `${c} ${he} ${ar} ${en} ${id}`;

  // Latin keys
  if(/sfiha|sficha|sfi7|manaoushe|manoushe|manous|mana2|manakish|malawach|malaw|malawe|bourek|burek|pastry/i.test(hay)) return true;

  // Hebrew keys
  if(/מאפה|מלאוח|בורקס|ספיחה|מנאושה|מנאקיש/i.test(hay)) return true;

  // Arabic keys
  if(/معجن|مناقي|منقوش|مناقيش|سفي|فطا/i.test(hay)) return true;

  return false;
}

function isPastryToppable(item){
  if(!isPastry(item)) return false;
  if(isJachnun(item)) return false;
  if(isManousheRolled(item)) return false;
  if(item && Object.prototype.hasOwnProperty.call(item, "allowToppings") && item.allowToppings === false) return false;
  return true;
}



function pastryKind(item){
  const c = normKey(item?.category);
  const he = String(item?.nameHe||item?.name_he||"");
  const ar = String(item?.nameAr||item?.name_ar||"");
  const en = String(item?.nameEn||item?.name_en||"");
  const id = String(item?.id||"");
  const hay = `${c} ${he} ${ar} ${en} ${id}`.toLowerCase();

  // Sfiha / صفيحة
  if(c==="sfiha" || c==="sfih" || hay.includes("ספיחה") || hay.includes("صفيحة") || hay.includes("صفيحه") || hay.includes("sfiha")) return "sfiha";
  // Manoushe / منقوشة / مناقيش
  if(c==="manoushe" || c==="manousha" || c==="manakish" || hay.includes("מנאושה") || hay.includes("מנואשה") || hay.includes("منقوش") || hay.includes("مناقيش") || hay.includes("manoushe") || hay.includes("manakish")) return "manoushe";

  return "pastry";
}

function pastryHebLabel(item){
  const k = pastryKind(item);
  if(k==="sfiha") return "ספיחה";
  if(k==="manoushe") return "מנאושה";
  return "מאפה";
}

function isPasta(item){
  const c = normKey(item?.category);
  return c==="pasta" || c==="ravioli";
}

function isRavioli(item){ return normKey(item?.category)==="ravioli"; }

function sizeFromItem(item){
  const txt = `${item?.size||""} ${item?.nameHe||""} ${item?.nameAr||""}`;
  const t = String(txt).toLowerCase();
  if(/קטן|صغير|small/.test(t)) return "small";
  if(/בינונ|وسط|medium/.test(t)) return "medium";
  if(/גדול|كبير|large|xl/.test(t)) return "large";
  return "medium";
}

function baseTypeFromItem(item){
  const c = normKey(item?.category);
  if(c.includes("pizza") || c.includes("piza")) return "pizza";
  return "sfiha";
}

function openItemModal(item){
  const modal = $("#itemModal");
  // Match the video-style title for pizza toppings screen
  $("#modalTitle").textContent = isPizza(item) ? "תוספות וירקות לפיצה" : (isPastry(item) ? ("תוספות וירקות ל" + pastryHebLabel(item)) : (item.nameHe || item.nameAr || "פריט"));
  $("#modalImg").src = cardImgFor(item);
  $("#modalImg").alt = item.nameHe || item.nameAr || "";

  // keep overlay sized correctly
  const imgEl = $("#modalImg");
  if(imgEl){
    imgEl.onload = () => {
      setOverlaySize();
      if(state?.pendingAdd) renderPizzaOverlay(state.pendingAdd);
    };
  }

  let qty = 1;
  const qtyValEl = $("#qtyVal");
  if(qtyValEl) qtyValEl.textContent = String(qty);

  const pending = {
    baseItem: item,
    qty: 1,
    config: {}
  };

  const body = $("#modalBody");
  body.innerHTML = "";

  // ensure summary is hidden on open
  try{ const s = document.getElementById("modalSummary"); if(s) s.hidden = true; }catch(e){}
  try{ const f = document.getElementById("modalEditFoot"); if(f) f.style.display = ""; }catch(e){}

  // shrink pizza image when scrolling toppings list (like video)
  setupHeroShrink(body);

  if(isPizza(item)){
    window.__pendingPizza = pending;
    pending.config = {
      size: item.size || null,
      crust: "reg",
      cheese: "reg",
      toppings: {} // tid -> {coverage}
    };
    body.appendChild(buildPizzaEditor(pending));
    // show toppings on top of the pizza image (kiosk style)
    renderPizzaOverlay(pending);
  } else if(isPastryToppable(item)) {
    pending.config = { toppings: {} };
    body.appendChild(buildPizzaEditor(pending));
  
    // show toppings on top of the pastry/manoushe/sfiha image
    renderPizzaOverlay(pending);
  } else if(isPasta(item)){
    // Pasta/Ravioli editor is handled by buildPastaEditor + finalizePending.
    // Do NOT touch firestoreItem/lines here (those are built later).
    pending.config = pending.config || {};
    if(!pending.config.pastaToppings) pending.config.pastaToppings = {};
    body.appendChild(buildPastaEditor(pending));
  }

  // Direct add-to-cart (no summary screen) + WOW animation to cart
  const addBtn = $("#btnAddItem");
  addBtn.onclick = async (ev) => {
    try{ addBtn.classList.add('cta--pressed'); }catch(e){}
    try{ if(ev) spawnRipple(addBtn, ev); }catch(e){}

// premium micro-interaction: shimmer + text swap
const __origTxt = addBtn.textContent;
addBtn.classList.add('cta--shimmer');
addBtn.textContent = "מוסיף…";


    const built = finalizePending(pending);
    state.cart.push(built);
    renderBottom();
    pulseCartBadge();

    // Start animation while the modal is still visible (clone flies to cart)
    const animP = animateAddToCartFromModal();

    // Close quickly so it feels instant, but after clone is created
    setTimeout(()=>{ try{ setAriaOpen(modal, false); }catch(e){} }, 60);
// show success state quickly, then revert
addBtn.classList.add('cta--success');
addBtn.textContent = "✔ נוסף";
setTimeout(()=>{
  try{
    addBtn.classList.remove('cta--success','cta--shimmer');
    addBtn.textContent = __origTxt || "הוסף לסל";
  }catch(e){}
}, 900);

    try{ await animP; }catch(e){}
    try{ addBtn.classList.remove('cta--pressed'); }catch(e){}
  };

  state.pendingAdd = pending;
  setAriaOpen(modal, true);
  updateModalPrice(pending);
}

function setupHeroShrink(scrollEl){
  try{
    const heroWrap = document.getElementById("heroPizza");
    if(!scrollEl || !heroWrap) return;
    const apply = ()=>{
      const st = scrollEl.scrollTop || 0;
      const t = Math.min(1, st/260);
      const sc = 1 - 0.22*t; // subtle shrink (wrapper + toppings together)
      heroWrap.style.transformOrigin = "center center";
      heroWrap.style.transform = `scale(${sc.toFixed(3)})`;
    };
    scrollEl.removeEventListener("scroll", apply);
    scrollEl.addEventListener("scroll", apply, { passive:true });
    apply();
  }catch(e){}
}

function buildSection(title, tag){
  const sec = document.createElement("div");
  sec.className = "section";
  sec.innerHTML = `
    <div class="section__title">
      <h3>${title}</h3>
      <div class="tag">${tag || ""}</div>
    </div>
    <div class="section__content"></div>
  `;
  return sec;
}


// --------- Inline area picker (per-topping, like screenshot) ----------
function buildInlineAreaPicker({ toppingId, pending, onChanged, compact=false }){
  const cfg0 = pending?.config?.toppings?.[toppingId] || { mode:"all", quarters:[] };
  let cfg = JSON.parse(JSON.stringify(cfg0));
  if(!cfg.mode) cfg.mode="all";
  if(cfg.mode!=="quarters") cfg.quarters = [];
  if(!Array.isArray(cfg.quarters)) cfg.quarters = [];

  const root = document.createElement("div");
  root.className = "inlineArea" + (compact ? " inlineArea--compact" : "");
  // Prevent clicks inside the picker from bubbling to the topping card
  // (otherwise it may toggle/close the picker unexpectedly).
  root.addEventListener("pointerdown", (ev)=>{ try{ ev.stopPropagation(); }catch(e){} }, true);

  const wrap = document.createElement("div");
  wrap.className = "inlineArea__wrap";

  if(!compact){
  const wheel = document.createElement("div");
  wheel.className = "inlineArea__wheel";
  wheel.innerHTML = `
    <svg class="areaWheel" viewBox="0 0 100 100" aria-hidden="true">
      <circle class="areaWheel__rim" cx="50" cy="50" r="46"></circle>

      <!-- segments -->
      <path class="areaWheel__seg" data-seg="q1" d="M50 50 L50 4 A46 46 0 0 1 96 50 Z"></path>
      <path class="areaWheel__seg" data-seg="q2" d="M50 50 L96 50 A46 46 0 0 1 50 96 Z"></path>
      <path class="areaWheel__seg" data-seg="q4" d="M50 50 L50 96 A46 46 0 0 1 4 50 Z"></path>
      <path class="areaWheel__seg" data-seg="q3" d="M50 50 L4 50 A46 46 0 0 1 50 4 Z"></path>

      <!-- lines -->
      <line class="areaWheel__line" x1="50" y1="4"  x2="50" y2="96"></line>
      <line class="areaWheel__line" x1="4"  y1="50" x2="96" y2="50"></line>

      <circle class="areaWheel__core" cx="50" cy="50" r="14"></circle>
      <text class="areaWheel__txt" x="50" y="54" text-anchor="middle"></text>
    </svg>
  `;
  wrap.appendChild(wheel);
  }


  const icons = document.createElement("div");
  icons.className = "inlineArea__icons";
  // order for RTL: ALL first (rightmost), then right-half, then left-half, then quarters
  icons.appendChild(areaBtn("על הכל","all"));
  icons.appendChild(areaBtn("חצי ימין","halfRight"));
  icons.appendChild(areaBtn("חצי שמאל","halfLeft"));
  icons.appendChild(areaBtn("רבע 1","q1"));
  icons.appendChild(areaBtn("רבע 2","q2"));
  icons.appendChild(areaBtn("רבע 3","q3"));
  icons.appendChild(areaBtn("רבע 4","q4"));
  wrap.appendChild(icons);

  root.appendChild(wrap);

  const row3 = document.createElement("div");
  row3.className = "inlineArea__actions";
  const rm = document.createElement("button");
  rm.type = "button";
  rm.className = "inlineArea__remove";
  rm.textContent = "הסר תוספת";
  rm.onclick = ()=>{
    delete pending.config.toppings[toppingId];
    try{ if(typeof onChanged==="function") onChanged(); }catch(e){}
  };
  row3.appendChild(rm);
  root.appendChild(row3);

  function areaBtnIcon(key){
    switch(key){
      // "All" should look like a FULL circle (not a ring)
      case "all": return `<svg class="inlineArea__ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="currentColor"/><circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2"/></svg>`;
      case "halfLeft": return `<svg class="inlineArea__ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18z" fill="currentColor"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
      case "halfRight": return `<svg class="inlineArea__ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 1 0 18z" fill="currentColor"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
      case "q1": return `<svg class="inlineArea__ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12 L12 3 A9 9 0 0 1 21 12 Z" fill="currentColor"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
      case "q2": return `<svg class="inlineArea__ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12 L21 12 A9 9 0 0 1 12 21 Z" fill="currentColor"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
      case "q3": return `<svg class="inlineArea__ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12 L3 12 A9 9 0 0 1 12 3 Z" fill="currentColor"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
      case "q4": return `<svg class="inlineArea__ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12 L12 21 A9 9 0 0 1 3 12 Z" fill="currentColor"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
      default: return `<svg class="inlineArea__ico" viewBox="0 0 24 24" aria-hidden="true"></svg>`;
    }
  }

function areaBtn(label, key){
    const b = document.createElement("button");
    b.type = "button";
    b.className = "inlineArea__btn";
    b.dataset.area = key;
    b.setAttribute("aria-label", label);
    b.innerHTML = `${areaBtnIcon(key)}`;
    b.onclick = (ev)=>{
      try{ ev.stopPropagation(); }catch(e){}
      if(key==="all" || key==="halfLeft" || key==="halfRight"){
        cfg = { mode:key, quarters:[] };
      }else if(/^q[1-4]$/.test(key)){
        const q = parseInt(key.slice(1),10);
        if(cfg.mode!=="quarters") cfg = { mode:"quarters", quarters:[] };
        const set = new Set(cfg.quarters||[]);
        if(set.has(q)) set.delete(q); else set.add(q);
        cfg.quarters = Array.from(set).sort((a,b)=>a-b);
        if(cfg.quarters.length===0){
          delete pending.config.toppings[toppingId];
          try{ if(typeof onChanged==="function") onChanged(); }catch(e){}
          return;
        }
      }
      pending.config.toppings[toppingId] = cfg;
      setActive();
      try{ if(typeof onChanged==="function") onChanged(); }catch(e){}
    };
    return b;
  }

  function setActive(){
    const btns = Array.from(root.querySelectorAll(".inlineArea__btn"));
    btns.forEach(x=>x.classList.remove("is-on"));
    const on = (k)=>{ const el = btns.find(x=>x.dataset.area===k); if(el) el.classList.add("is-on"); };

    // buttons
    if(cfg.mode==="all") on("all");
    else if(cfg.mode==="halfLeft") on("halfLeft");
    else if(cfg.mode==="halfRight") on("halfRight");
    else if(cfg.mode==="quarters"){
      (cfg.quarters||[]).forEach(q=> on("q"+q));
    }

    // wheel preview
    const wheelEl = root.querySelector(".areaWheel");
    if(wheelEl){
      // Keep wheel styling consistent; "all" just means all segments are on.
      const segs = Array.from(wheelEl.querySelectorAll(".areaWheel__seg"));
      segs.forEach(s=>s.classList.remove("is-on"));
      const txtEl = wheelEl.querySelector(".areaWheel__txt");
      const setSeg = (id)=>{ const s = segs.find(x=>x.dataset.seg===id); if(s) s.classList.add("is-on"); };

      let label = "";
      if(cfg.mode==="all"){
        ["q1","q2","q3","q4"].forEach(setSeg);
        label = "ALL";
      }else if(cfg.mode==="halfRight"){
        ["q1","q2"].forEach(setSeg);
        label = "1/2";
      }else if(cfg.mode==="halfLeft"){
        ["q3","q4"].forEach(setSeg);
        label = "1/2";
      }else if(cfg.mode==="quarters"){
        (cfg.quarters||[]).forEach(q=>setSeg("q"+q));
        label = (cfg.quarters||[]).length ? String(cfg.quarters.length)+"/4" : "";
      }
      if(txtEl) txtEl.textContent = label;
    }
  }
  setActive();
  return root;
}

// Close the inline area picker only when clicking outside (not on every selection).
let __areaOutsideCloser = null;
function ensureInlineAreaOutsideClose(pending, editorRoot){
  try{
    if(__areaOutsideCloser){
      document.removeEventListener("pointerdown", __areaOutsideCloser, true);
      __areaOutsideCloser = null;
    }
    if(!pending || !pending.__openTopping) return;
    __areaOutsideCloser = (ev)=>{
      try{
        const t = ev.target;
        // Click inside the editor/picker should not close.
        if(t && t.closest && (t.closest(".inlineArea") || t.closest(".toppingCard"))) return;
      }catch(e){}
      pending.__openTopping = null;
      try{ editorRoot.replaceWith(buildPizzaEditor(pending)); }catch(e){}
      try{ renderPizzaOverlay(pending); }catch(e){}
    };
    document.addEventListener("pointerdown", __areaOutsideCloser, true);
  }catch(e){}
}

function buildPizzaEditor(pending){
  const wrap = document.createElement("div");

  const topSec = buildSection("תוספות", "");
  const listEl = document.createElement("div");
  listEl.className = "toppingList";

  const __list = (Array.isArray(TOPPINGS_DB) && TOPPINGS_DB.length)
    ? TOPPINGS_DB.slice().sort((a,b)=>(a.sort??999)-(b.sort??999))
    : TOPPINGS_DEMO;

  
  const rowControllers = [];
  const refreshAll = ()=>{
    for(const rc of rowControllers){
      try{ rc.refresh(); }catch(e){}
    }
  };

  const afterChange = ()=>{
    try{ updateModalPrice(pending); }catch(e){}
    try{ renderPizzaOverlay(pending); }catch(e){}
  };

  const onAreaChanged = (tId)=>{
    // keep picker open if still selected
    if(!pending.config.toppings[tId] && pending.__openTopping===tId){
      pending.__openTopping = null;
    }
    refreshAll();
    afterChange();
  };

  for(const t of __list){
    const active = !!pending.config.toppings[t.id];
    const open = (pending.__openTopping === t.id) && active;

    const tLabel = t.label || (t.name?.he || t.name?.ar || t.name?.en || t.id);
    const tPrice = (typeof toppingPriceFor==="function" && TOPPINGS_DB)
      ? toppingPriceFor(pending.baseItem, t.id)
      : (t.price||0);

    const row = document.createElement("div");
    row.className = "toppingRow" + (active ? " is-on" : "");

    const top = document.createElement("div");
    top.className = "toppingRow__top";
    top.innerHTML = `
      <div class="toppingRow__img"><img src="${t.image || toppingSvgFor(t.id)}" alt="" /></div>
      <div class="toppingRow__main">
        <div class="toppingRow__name">${tLabel}</div>
        <div class="toppingRow__sub">${active ? ("אזור: " + coverageText(pending.config.toppings[t.id])) : "לחצו לבחירת אזור תוספת"}</div>
      </div>
      <div class="toppingRow__checkWrap">
        <div class="toppingRow__price">+${fmtILS(tPrice)}</div>
        <div class="toppingRow__check" role="checkbox" aria-checked="${active ? "true":"false"}" tabindex="0"></div>
      </div>
    `;

    const areaHost = document.createElement("div");
    areaHost.className = "toppingRow__area";
    areaHost.style.display = open ? "block" : "none";
    if(open){
      areaHost.appendChild(buildInlineAreaPicker({
        toppingId: t.id,
        pending,
        compact: true,
        onChanged: ()=>onAreaChanged(t.id)
      }));
    }

    const refreshRow = ()=>{
      const isOnNow = !!pending.config.toppings[t.id];
      const isOpenNow = isOnNow && (pending.__openTopping === t.id);

      row.classList.toggle("is-on", isOnNow);

      const subEl = top.querySelector(".toppingRow__sub");
      if(subEl){
        subEl.textContent = isOnNow ? ("אזור: " + coverageText(pending.config.toppings[t.id])) : "לחצו לבחירת אזור תוספת";
      }

      const chkEl = top.querySelector(".toppingRow__check");
      if(chkEl){
        chkEl.setAttribute("aria-checked", isOnNow ? "true" : "false");
      }

      areaHost.style.display = isOpenNow ? "block" : "none";
      if(isOpenNow){
        if(!areaHost.firstChild){
          areaHost.appendChild(buildInlineAreaPicker({
            toppingId: t.id,
            pending,
            compact: true,
            onChanged: ()=>onAreaChanged(t.id)
          }));
        }
      }else{
        // keep it light on mobile: remove picker DOM when closed
        if(areaHost.firstChild) areaHost.innerHTML = "";
      }
    };

    rowControllers.push({ refresh: refreshRow });
    // initial state
    refreshRow();

    const toggleOpenOrSelect = ()=>{
      if(!pending.config.toppings[t.id]){
        pending.config.toppings[t.id] = { mode:"all", quarters:[] };
        pending.__openTopping = t.id;
      }else{
        pending.__openTopping = (pending.__openTopping===t.id) ? null : t.id;
      }
      refreshAll();
      afterChange();
    };

    const toggleCheckbox = (force)=>{
      const isOn = !!pending.config.toppings[t.id];
      const next = (typeof force==="boolean") ? force : !isOn;
      if(!next){
        delete pending.config.toppings[t.id];
        if(pending.__openTopping===t.id) pending.__openTopping = null;
      }else{
        pending.config.toppings[t.id] = pending.config.toppings[t.id] || { mode:"all", quarters:[] };
        pending.__openTopping = t.id;
      }
      refreshAll();
      afterChange();
    };

    // Click anywhere on the row toggles open/select
    top.addEventListener("click", (ev)=>{
      // If user clicked on checkbox area, let checkbox handler run
      if(ev.target && ev.target.closest && ev.target.closest(".toppingRow__checkWrap")) return;
      toggleOpenOrSelect();
    });

    // Checkbox click toggles on/off
    const chkWrap = top.querySelector(".toppingRow__checkWrap");
    if(chkWrap){
      chkWrap.addEventListener("click", (ev)=>{ ev.stopPropagation(); toggleCheckbox(); });
    }
    const chk = top.querySelector(".toppingRow__check");
    if(chk){
      chk.addEventListener("keydown", (ev)=>{
        if(ev.key==="Enter" || ev.key===" "){
          ev.preventDefault();
          toggleCheckbox();
        }
      });
    }

    row.appendChild(top);
    row.appendChild(areaHost);
    listEl.appendChild(row);
  }

  topSec.querySelector(".section__content").appendChild(listEl);

  const summary = document.createElement("div");
  summary.className = "hint";
  summary.style.marginTop = "10px";
  const chosen = Object.entries(pending.config.toppings || {});
  summary.textContent = chosen.length
    ? "נבחרו: " + chosen.map(([id,cfg])=> {
        const t = (__list||TOPPINGS_DEMO).find(x=>x.id===id);
        const lab = t?.label || (t?.name?.he||t?.name?.ar||t?.name?.en) || id;
        return `${lab} (${coverageText(cfg)})`;
      }).join(" • ")
    : "לא נבחרו תוספות.";
  topSec.querySelector(".section__content").appendChild(summary);

  wrap.appendChild(topSec);
  setTimeout(()=>renderPizzaOverlay(pending),0);
  return wrap;
}

function coverageText(cfg){
  if(!cfg) return "כלום";
  if(cfg.mode==="none") return "כלום";
  if(cfg.mode==="halfLeft") return "חצי שמאל";
  if(cfg.mode==="halfRight") return "חצי ימין";
  if(cfg.mode==="all") return "הכל";
  if(cfg.mode==="quarters"){
    const qs = (cfg.quarters||[]).slice().sort((a,b)=>a-b);
    return qs.length ? ("רבעים: " + qs.join(",")) : "כלום";
  }
  if(cfg.mode==="thirds") return "שלישים";
  if(cfg.mode==="slices") return "פרוסות";
  return "הכל";
  if(cfg.mode==="none") return "כלום";
  if(cfg.mode==="halfLeft") return "חצי שמאל";
  if(cfg.mode==="halfRight") return "חצי ימין";
  if(cfg.mode==="all") return "הכל";
  if(cfg.mode==="thirds") return "שלישים";
  if(cfg.mode==="slices") return "פרוסות";
  return "הכל";
}

function buildPastaEditor(pending){
  const wrap = document.createElement("div");

  const SAUCES = (Array.isArray(SAUCES_DB) && SAUCES_DB.length) ? SAUCES_DB : (isRavioli(pending.baseItem) ? RAVIOLI_SAUCES : PASTA_SAUCES);

  // --- Sauce (required) ---
  const sSec = buildSection("صوص", "إجباري");
  const sg = document.createElement("div");
  sg.className = "grid";

  // default sauce
  if(!pending.config.sauce && SAUCES[0]) pending.config.sauce = SAUCES[0].id;

  for(const s of SAUCES){
    const b = document.createElement("div");
    b.className = "choice" + (pending.config.sauce===s.id ? " choice--active":"");
    const label = (s.ar || s.he || s.en || s.label || s.id);
    const img = (s.img || s.imgUrl || null);
    b.innerHTML = `
      <img class="choice__img" src="${img ? img : `assets/s_${s.id}.svg`}" alt="" onerror="this.style.display='none'"/>
      <div class="choice__txt">${label}</div>
      <div class="choice__sub"> </div>
    `;
    b.onclick = () => {
      pending.config.sauce = s.id;
      wrap.replaceWith(buildPastaEditor(pending));
      updateModalPrice(pending);
    };
    sg.appendChild(b);
  }
  sSec.querySelector(".section__content").appendChild(sg);
  wrap.appendChild(sSec);

  // --- Toppings under sauce (from Firebase) ---
  if(!pending.config.pastaToppings) pending.config.pastaToppings = {};

  const list = (Array.isArray(PASTA_TOPPINGS_DB) && PASTA_TOPPINGS_DB.length)
    ? PASTA_TOPPINGS_DB
    : ((Array.isArray(TOPPINGS_DB) && TOPPINGS_DB.length) ? TOPPINGS_DB : TOPPINGS_DEMO);

  const allowedKinds = new Set(["regular","special","shrimp","meat"]);
  const regular = [], special = [], premium = [];

  // Ensure premium fallbacks exist even if not in Firestore yet
  const premiumFallback = [
    { id:"shrimp", kind:"shrimp", ar:"روبيان", he:"שרימפס", en:"Shrimp", price:10 },
    { id:"shrimp_double", kind:"shrimp", ar:"روبيان مضاعف", he:"שרימפס כפול", en:"Double shrimp", price:20 },
    { id:"minced_meat", kind:"meat", ar:"لحمة مفرومة", he:"בשר טחון", en:"Minced meat", price:10 },
    { id:"mkrm", kind:"special", ar:"مكرام", he:"מוקרם", en:"Gratin", price:0 }
  ];
  const listById = new Map(list.map(x=>[x.id,x]));
  for(const f of premiumFallback){
    if(!listById.has(f.id)) listById.set(f.id, f);
  }

  for(const t of Array.from(listById.values())){
    const kind = __normKind(t.kind || "regular");
    if(!allowedKinds.has(kind)) continue;
    if(kind==="regular") regular.push(t);
    else if(kind==="special") special.push(t);
    else premium.push(t);
  }

  const tSec = buildSection("إضافات", "اختياري");
  const host = document.createElement("div");
  host.className = "toppingList";

  const priceForPastaTopping = (tid)=>{
    const it = listById.get(tid);
    const p = Number(it?.price||0)||0;
    if(p>0) return p;
    if(tid==="shrimp") return 10;
    if(tid==="shrimp_double") return 20;
    if(tid==="minced_meat") return 10;
    return 0;
  };

  const renderGroup = (title, arr)=>{
    if(!arr.length) return;
    const g = document.createElement("div");
    g.className = "pastryGroup";
    const h = document.createElement("div");
    h.className = "subTitle";
    h.textContent = title;
    g.appendChild(h);

    for(const t of arr){
      const tid = t.id;
      const row = document.createElement("div");
      row.className = "checkRow";
      const checked = !!pending.config.pastaToppings[tid];
      const label = (t.ar || t.he || t.en || t.label || (t.name && (t.name.ar||t.name.he||t.name.en)) || tid);
      const pr = priceForPastaTopping(tid);
      row.innerHTML = `
        <label><input type="checkbox" ${checked?"checked":""}> ${label}</label>
        <div class="price">${pr>0?("+"+fmtILS(pr)):""}</div>
      `;
      row.querySelector("input").onchange = (ev)=>{
        pending.config.pastaToppings[tid] = ev.target.checked;
        updateModalPrice(pending);
      };
      g.appendChild(row);
    }
    host.appendChild(g);
  };

  renderGroup("إضافات عادية", regular);
  renderGroup("إضافات خاصة", special);
  renderGroup("بريميوم", premium);

  tSec.querySelector(".section__content").appendChild(host);
  wrap.appendChild(tSec);

  return wrap;
}


function buildPastryEditor(pending){
  const wrap = document.createElement("div");

  const topSec = buildSection("תוספות למאפה", "");
  // buildSection() returns a single section element. Content lives in .section__content.
  const topBody = (topSec && topSec.querySelector) ? (topSec.querySelector(".section__content") || topSec) : wrap;
  const listEl = document.createElement("div");
  listEl.className = "toppingList";

  const list = (Array.isArray(TOPPINGS_DB) && TOPPINGS_DB.length)
    ? TOPPINGS_DB.slice().sort((a,b)=>(a.sort??999)-(b.sort??999))
    : TOPPINGS_DEMO;

  const allowedKinds = new Set(["regular","special","shrimp","meat"]);
  const regular = [];
  const special = [];
  const premium = [];

  for(const t of list){
    const kind = (t.kind || "regular").toString();
    if(!allowedKinds.has(kind)) continue;
    if(kind==="regular") regular.push(t);
    else if(kind==="special") special.push(t);
    else premium.push(t);
  }

  const renderGroup = (title, arr)=>{
    if(!arr.length) return;
    const g = document.createElement("div");
    g.className = "pastryGroup";
    const h = document.createElement("div");
    h.className = "subTitle";
    h.textContent = title;
    g.appendChild(h);

    const row = document.createElement("div");
    row.className = "chipRow";

    for(const t of arr){
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      const isOn = ()=> !!pending.config.toppings?.[t.id];
      const label = (t.label || t.ar || t.he || t.en || t.name || t.id);
      btn.textContent = label;

      const refresh = ()=>{
        if(isOn()) btn.classList.add("on"); else btn.classList.remove("on");
      };
      btn.addEventListener("click", ()=>{
        if(isOn()){
          delete pending.config.toppings[t.id];
          refresh();
          try{ updateModalPrice(pending); }catch(e){}
          try{ renderPizzaOverlay(pending); }catch(e){}
          return;
        }

        // Turn on: let user choose coverage (same as pizza)
        const current = pending.config.toppings[t.id] || { mode:"all", quarters:[] };
        openAreaPicker({
          title: `בחר אזור לתוספת: ${label}`,
          current,
          onSave: (cfg)=>{
            pending.config.toppings[t.id] = cfg || { mode:"all", quarters:[] };
            refresh();
            try{ updateModalPrice(pending); }catch(e){}
            try{ renderPizzaOverlay(pending); }catch(e){}
          },
          onRemove: ()=>{
            delete pending.config.toppings[t.id];
            refresh();
            try{ updateModalPrice(pending); }catch(e){}
            try{ renderPizzaOverlay(pending); }catch(e){}
          },
          autoDismissMs: 4000
        });
      });
      refresh();
      row.appendChild(btn);
    }
    g.appendChild(row);
    listEl.appendChild(g);
  };

  renderGroup("תוספות רגילות", regular);
  renderGroup("תוספות מיוחדות", special);
  renderGroup("פרימיום", premium);

  topBody.appendChild(listEl);
  wrap.appendChild(topSec);
  return wrap;
}

function finalizePending(pending){
  const item = pending.baseItem;
  const qty = pending.qty;

  let unit = basePriceFor(item);
  const lines = [];
  const firestoreItem = {
    id: item.id,
    nameAr: item.nameAr || item.nameHe || "Item",
    category: item.category || null,
    size: item.size || null,
    qty,
    basePrice: unit,
    price: unit, // will update below
    toppings: [],
    pastaSauce: null,
    pastaSauceId: null,
    pastaFreeToppings: [],
    pastaPaidToppings: [],
    extrasText: null,
    notes: null,
    extraNote: null,
    hasFreeDrink: false,
    freeDrink: null,
  };

  if(isPizza(item)){
    // Store toppings in a language-neutral format:
    // - id: topping id (matches Firestore /options doc id)
    // - coverageId: ALL / HALF_LEFT / HALF_RIGHT / Q1..Q4 (translate in POS/print)
    // - coverage: legacy key kept for backward compatibility with current POS logic
    // Our UI supports multi-quarter for a single topping => split into multiple entries.
    for(const [tid, cfg] of Object.entries(pending.config.toppings || {})){
      // price is counted once per topping selection (even if multiple quarters were chosen)
      unit += toppingPriceFor(item, tid);

      const mode = cfg && cfg.mode;
      if(mode === "quarters" && Array.isArray(cfg.quarters) && cfg.quarters.length){
        for(const q of cfg.quarters){
          const coverageId = mapCoverageId({ mode:"quarters", quarters:[q] });
          const cov = coverageIdToLegacy(coverageId);
          firestoreItem.toppings.push({ id: tid, coverageId, coverage: cov });
          lines.push(`${tid} • ${coverageId}`);
        }
      } else {
        const coverageId = mapCoverageId(cfg);
        const cov = coverageIdToLegacy(coverageId);
        firestoreItem.toppings.push({ id: tid, coverageId, coverage: cov });
        lines.push(`${tid} • ${coverageId}`);
      }
    }
  }
  if(isPastryToppable(item)){
    // Same coverage logic as pizza (ALL / halves / quarters), except rolled manoushe is excluded by isPastryToppable().
    for(const [tid, cfg] of Object.entries(pending.config.toppings || {})){
      // price counted once per topping selection (even if multiple quarters)
      unit += toppingPriceFor(item, tid);

      const mode = cfg && cfg.mode;
      if(mode === "quarters" && Array.isArray(cfg.quarters) && cfg.quarters.length){
        for(const q of cfg.quarters){
          const coverageId = mapCoverageId({ mode:"quarters", quarters:[q] });
          const cov = coverageIdToLegacy(coverageId);
          firestoreItem.toppings.push({ id: tid, coverageId, coverage: cov });
          lines.push(`${tid} • ${coverageId}`);
        }
      } else {
        const coverageId = mapCoverageId(cfg || {mode:"all"});
        const cov = coverageIdToLegacy(coverageId);
        firestoreItem.toppings.push({ id: tid, coverageId, coverage: cov });
        lines.push(`${tid} • ${coverageId}`);
      }
    }
  }



    if(isPasta(item)){
    const SAUCES = (Array.isArray(SAUCES_DB) && SAUCES_DB.length) ? SAUCES_DB : (isRavioli(item) ? RAVIOLI_SAUCES : PASTA_SAUCES);
    const sauceId = pending.config.sauce || (SAUCES[0]?.id) || "cream";
    const sauce = SAUCES.find(x=>x.id===sauceId) || SAUCES[0] || { id:sauceId, ar:sauceId, he:sauceId, en:sauceId, label:sauceId };
    firestoreItem.pastaSauceId = sauce.id;
    firestoreItem.pastaSauce = sauce.ar || sauce.he || sauce.en || sauce.id; // IMPORTANT for POS validation
    lines.push(`רוטב: ${sauce.ar || sauce.he || sauce.en || sauce.id}`);

    const selected = pending.config.pastaToppings || pending.config.veggies || {};
    const list = (Array.isArray(PASTA_TOPPINGS_DB) && PASTA_TOPPINGS_DB.length) ? PASTA_TOPPINGS_DB : (Array.isArray(TOPPINGS_DB)&&TOPPINGS_DB.length?TOPPINGS_DB:[]);
    const byId = new Map(list.map(x=>[x.id,x]));

    const priceFor = (tid)=>{
      const it = byId.get(tid);
      const p = Number(it?.price||0)||0;
      if(p>0) return p;
      if(tid==="shrimp") return 10;
      if(tid==="shrimp_double") return 20;
      if(tid==="minced_meat") return 10;
      return 0;
    };
    const labelArFor = (tid)=>{
      const it = byId.get(tid);
      const ar = it?.ar || it?.name?.ar || it?.labelAr || it?.label || "";
      if(ar) return ar;
      if(tid==="shrimp") return "روبيان";
      if(tid==="shrimp_double") return "روبيان مضاعف";
      if(tid==="minced_meat") return "لحمة مفرومة";
      if(tid==="mkrm") return "مكرام";
      return tid;
    };

    for(const [tid, on] of Object.entries(selected)){
      if(!on) continue;
      const add = priceFor(tid);
      unit += add;
      firestoreItem.pastaPaidToppings.push(labelArFor(tid));
      lines.push(`${tid} +${add}`);
    }
  }

  firestoreItem.price = unit;
  const total = unit * qty;

  return {
    id: cryptoRandomId(),
    name: item.nameHe || item.nameAr || "פריט",
    qty,
    unit,
    total,
    meta: lines.join("\n"),
    firestoreItem
  };
}

function updateModalPrice(pending){
  const built = finalizePending({ ...pending, qty: pending.qty });

  // modalPrice might not exist in some dynamic renders (e.g., cart/checkout view)
  let priceEl = document.getElementById("modalPrice");
  if(!priceEl){
    const btn = document.getElementById("btnAddItem");
    if(btn){
      // try to find an existing right-side span, otherwise create one
      priceEl = btn.querySelector(".cta__right") || btn.querySelector("[data-role='modalPrice']");
      if(!priceEl){
        priceEl = document.createElement("span");
        priceEl.className = "cta__right";
        priceEl.id = "modalPrice";
        btn.appendChild(priceEl);
      }else{
        // ensure id for future lookups
        if(!priceEl.id) priceEl.id = "modalPrice";
      }
    }
  }
  if(priceEl) priceEl.textContent = fmtILS(built.total);
}

// --------- Area picker (simple modal, no canvas) ----------
function openAreaPicker({ title, current, onSave, onRemove, onlyQuarters=false, autoDismissMs=0 }){
  const modal = document.getElementById("areaModal");
  if(!modal){
    // Fallback: just apply to all
    try{ if(typeof onSave==="function") onSave({ mode:"all" }); }catch(e){}
    return;
  }

  const titleEl = document.getElementById("areaTitle");
  if(titleEl) titleEl.textContent = title || "אזור לתוספת";

  // normalize current
  let cfg = (current && typeof current === "object") ? JSON.parse(JSON.stringify(current)) : { mode:"all" };
  if(!cfg.mode) cfg.mode = "all";
  if(cfg.mode !== "quarters") cfg.quarters = [];
  if(cfg.mode === "quarters" && !Array.isArray(cfg.quarters)) cfg.quarters = [];

  let __touched = false;
  // UI mode (quarters-only)
  try{ modal.classList.toggle('only-quarters', !!onlyQuarters); }catch(e){}
  if(onlyQuarters){
    // force quarters mode
    if(cfg.mode!=='quarters') cfg = { mode:'quarters', quarters: Array.isArray(cfg.quarters)?cfg.quarters:[] };
  }
  if(!autoDismissMs && onlyQuarters) autoDismissMs = 4000;
  let __dismissTimer = null;
  if(autoDismissMs>0){
    __dismissTimer = setTimeout(()=>{
      if(__touched) return;
      try{ if(typeof onRemove==='function') onRemove(); }catch(e){}
      setAriaOpen(modal,false);
    }, autoDismissMs);
  }

  // UI highlight helpers
  const pills = Array.from(modal.querySelectorAll("[data-area]"));
  function setActive(){
    pills.forEach(p=>p.classList.remove("is-on"));
    const mark = (sel)=>{
      const el = pills.find(x=>x.dataset.area===sel);
      if(el) el.classList.add("is-on");
    };
    if(cfg.mode==="all") mark("all");
    else if(cfg.mode==="halfLeft") mark("halfLeft");
    else if(cfg.mode==="halfRight") mark("halfRight");
    else if(cfg.mode==="quarters"){
      (cfg.quarters||[]).forEach(q=> mark("q"+q));
    }

    // feedback under the wheel
    const fb = document.getElementById("areaFeedback");
    if(fb){
      fb.innerHTML = "";
      const line1 = document.createElement("div");
      line1.className = "areaFbLine";
      line1.textContent = "הכיסוי הנבחר: " + coverageText(cfg);
      fb.appendChild(line1);

      if(cfg.mode === "quarters"){
        const qs = (cfg.quarters||[]).slice().sort((a,b)=>a-b);
        const line2 = document.createElement("div");
        line2.className = "areaFbLine areaFbLine--muted";
        line2.textContent = qs.length ? ("רבעים: " + qs.join(", ")) : "לא נבחרו רבעים עדיין.";
        fb.appendChild(line2);
      } else if(cfg.mode === "halfLeft" || cfg.mode === "halfRight" || cfg.mode === "all"){
      }
    }
  }

  // bind pill clicks
  pills.forEach(p=>{
    p.onclick = ()=>{
      __touched = true;
      if(__dismissTimer){ try{ clearTimeout(__dismissTimer);}catch(e){} __dismissTimer=null; }
      const a = p.dataset.area;
      if(a==="all" || a==="halfLeft" || a==="halfRight"){
        cfg = { mode: a, quarters: [] };
      }else if(/^q[1-4]$/.test(a)){
        const q = parseInt(a.slice(1),10);
        if(cfg.mode !== "quarters") cfg = { mode:"quarters", quarters: [] };
        const set = new Set(cfg.quarters||[]);
        if(set.has(q)) set.delete(q); else set.add(q);
        cfg.quarters = Array.from(set).sort((x,y)=>x-y);
      }
      setActive();
    };
  });

  // buttons
  const btnSave = document.getElementById("btnAreaSave");
  const btnRemove = document.getElementById("btnAreaRemove");
  if(btnSave) btnSave.onclick = ()=>{
    __touched = true;
    if(__dismissTimer){ try{ clearTimeout(__dismissTimer);}catch(e){} __dismissTimer=null; }

    try{ if(typeof onSave==="function") onSave(cfg); }catch(e){}
    setAriaOpen(modal, false);
  };
  if(btnRemove) btnRemove.onclick = ()=>{
    __touched = true;
    if(__dismissTimer){ try{ clearTimeout(__dismissTimer);}catch(e){} __dismissTimer=null; }

    try{ if(typeof onRemove==="function") onRemove(); }catch(e){}
    setAriaOpen(modal, false);
  };

  setActive();
  setAriaOpen(modal, true);
}

// --------- Close on scrim ----------
function closeOnScrim(root){
  if(!root) return;
  root.addEventListener("click", (ev)=>{
    const t = ev.target;
    if(t && t.getAttribute("data-close")==="true") setAriaOpen(root,false);
  });
}
closeOnScrim($("#itemModal"));
closeOnScrim($("#areaModal"));
closeOnScrim($("#cartDrawer"));

// --------- Cart rendering ----------
function renderCart(){
  if(!renderCart._loaded){ renderCart._loaded=true; loadDeliveryDefaults(); setJaffaDefault(); }

  const drawerTitle = document.querySelector("#cartDrawer .drawer__title");
  if(drawerTitle){ drawerTitle.textContent = state.cartStep==="checkout" ? "מעבר לתשלום" : "השקית"; }

  // Wolt: show meta (delivery/pickup, payment, delivery form) only in checkout step
  const metaBox = document.querySelector("#cartDrawer .drawer__meta");
  if(metaBox) metaBox.style.display = state.cartStep==="checkout" ? "block" : "none";
  const deliveryForm = $("#deliveryForm");
  if(deliveryForm) deliveryForm.style.display = (state.cartStep==="checkout" && state.serviceType==="delivery") ? "block" : "none";

  const wrap = $("#cartBody");
  wrap.innerHTML = "";
  if(sendingOrder) return;

  if(!state.cart.length){
    state.cartStep = "cart";
    wrap.innerHTML = `<div class="section"><div class="hint">השקית ריקה. בחר מוצר להוספה.</div></div>`;
  } else if(state.cartStep==="cart") {
    // ====== Cart summary + recommendations (Wolt style) ======
    const top = document.createElement("div");
    top.className = "cartTopSummary";
    top.innerHTML = `
      <div class="cartTopSummary__title">
        <span>סיכום ההזמנה</span>
        <span class="cartTopSummary__count">${state.cart.length} פריטים</span>
      </div>
    `;
    wrap.appendChild(top);

    for(const it of state.cart){
      const div = document.createElement("div");
      div.className = "cartRow";
      const meta = escapeHtml(it.meta || "").replaceAll("\n","<br>");
      div.innerHTML = `
        <div class="cartRow__main">
          <div class="cartRow__name">${escapeHtml(it.name)} <span class="cartRow__qty">×${it.qty}</span></div>
          ${meta ? `<div class="cartRow__meta">${meta}</div>` : ``}
        </div>
        <div class="cartRow__price">${fmtILS(it.total)}</div>
        <div class="cartRow__acts">
          <button class="miniIcon" data-act="dup" aria-label="שכפל">＋</button>
          <button class="miniIcon miniIcon--danger" data-act="del" aria-label="מחק">✕</button>
        </div>
      `;
      div.querySelector('[data-act="dup"]').onclick = () => {
        state.cart.push({ ...it, id: cryptoRandomId() });
        renderBottom();
        renderCart();
      };
      div.querySelector('[data-act="del"]').onclick = () => {
        state.cart = state.cart.filter(x=>x.id!==it.id);
        renderBottom();
        renderCart();
      };
      wrap.appendChild(div);
    }

    // Recommendations (simple): show 8 menu items not already in cart
    const rec = document.createElement("div");
    rec.className = "cartRecs";
    rec.innerHTML = `
      <div class="cartRecs__title">המלצות בשבילך</div>
      <div class="cartRecs__rail" id="cartRecsRail"></div>
    `;
    wrap.appendChild(rec);
    renderCartRecs();
  } else {
    // ====== Checkout (Wolt style): map + ETA + delivery/pickup + payment ======
    const sec = document.createElement("div");
    sec.className = "checkout";
    sec.innerHTML = `
      <div class="checkout__mapWrap">
        <div class="checkout__map" id="checkoutMap"></div>
        <div class="checkout__pill" id="checkoutEtaPill">מחשב זמן הגעה…</div>
      </div>

      <div class="checkout__block">
        <div class="checkout__label">זמן משלוח</div>
        <div class="checkoutBtns" id="etaBtns">
          <button class="checkoutBtn is-on" data-eta="asap">הכי מהר שאפשר</button>
          <button class="checkoutBtn" data-eta="scheduled">הזמנה עתידית</button>
        </div>
        <div class="checkout__hint" id="etaHint">זמן ההגעה מחושב לפי מרחק מהמפה.</div>
      </div>

      <div class="checkout__block">
        <div class="checkout__label">כתובת</div>
        <input class="input" id="checkoutAddress" placeholder="רחוב + מספר, עיר" />
        <div class="checkout__hint" id="locHint">הפעל/י מיקום כדי לקבל זמן הגעה מדויק.</div>
      </div>

      <div class="checkout__block">
        <div class="checkout__label">סיכום</div>
        <div class="checkout__sumRow"><span>סכום</span><span id="sumSubtotal"></span></div>
        <div class="checkout__sumRow"><span>דמי משלוח</span><span id="sumDelivery"></span></div>
        <div class="checkout__sumRow checkout__sumRow--total"><span>סה״כ</span><span id="sumTotal"></span></div>
      </div>

      <button class="ghostBack" id="btnBackToCart">חזרה לשקית</button>
    `;
    wrap.appendChild(sec);

    // bind checkout ui
    const addr = $("#checkoutAddress");
    if(addr){
      addr.value = state.checkout.addressText || "";
      addr.oninput = ()=>{ state.checkout.addressText = addr.value; };
    }
    const backBtn = $("#btnBackToCart");
    if(backBtn) backBtn.onclick = ()=>{ state.cartStep="cart"; renderCart(); };
    $$("#etaBtns .checkoutBtn").forEach(b=>{
      b.onclick = ()=>{
        $$("#etaBtns .checkoutBtn").forEach(x=>x.classList.toggle("is-on", x===b));
      };
    });

    updateCheckoutTotalsAndEta();
    // Map + ETA
    ensureCheckoutMap().then(updateCheckoutTotalsAndEta);
  }

  // footer total
  const { total } = cartTotals();
  $("#cartTotal").textContent = fmtILS(total);

  // footer button label (Wolt style)
  const left = document.querySelector("#btnPlaceOrder .cta__left");
  if(left){ left.textContent = state.cartStep==="checkout" ? "החלק לאישור הזמנה" : "מעבר לתשלום"; }
}

function renderCartRecs(){
  const rail = document.getElementById("cartRecsRail");
  if(!rail) return;
  rail.innerHTML = "";
  if(!Array.isArray(state.menu) || !state.menu.length) return;
  const inCart = new Set(state.cart.map(it=> String(it.itemId||it.menuId||it.id||"")));
  const candidates = state.menu
    .filter(m => m && !inCart.has(String(m.id||"")))
    .slice(0, 40);
  // simple shuffle
  for(let i=candidates.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    const tmp = candidates[i]; candidates[i]=candidates[j]; candidates[j]=tmp;
  }
  const picks = candidates.slice(0, 8);
  for(const it of picks){
    const price = basePriceFor(it);
    const card = document.createElement("div");
    card.className = "recCard";
    card.innerHTML = `
      <img class="recCard__img" src="${cardImgFor(it)}" alt="" />
      <div class="recCard__name">${escapeHtml(it.nameHe || it.nameAr || "")}</div>
      <div class="recCard__row">
        <div class="recCard__price">${fmtILS(price)}</div>
        <button class="recCard__add" type="button">+</button>
      </div>
    `;
    card.querySelector(".recCard__add").onclick = (ev)=>{
      ev.stopPropagation();
      openItemModal(it);
    };
    card.onclick = ()=> openItemModal(it);
    rail.appendChild(card);
  }
}

function updateCheckoutTotalsAndEta(){
  const { total } = cartTotals();
  const subtotalEl = document.getElementById("sumSubtotal");
  const deliveryEl = document.getElementById("sumDelivery");
  const totalEl = document.getElementById("sumTotal");
  const etaPill = document.getElementById("checkoutEtaPill");
  const locHint = document.getElementById("locHint");

  const deliveryFee = state.serviceType === "delivery" ? Math.max(0, Math.round((state.checkout.distanceKm||0) * 2)) : 0;
  const grand = total + deliveryFee;
  if(subtotalEl) subtotalEl.textContent = fmtILS(total);
  if(deliveryEl) deliveryEl.textContent = deliveryFee ? fmtILS(deliveryFee) : "₪0";
  if(totalEl) totalEl.textContent = fmtILS(grand);

  let eta = "";
  if(state.serviceType === "pickup"){
    eta = `${Math.max(12, ASSUMED_PREP_MIN)}-${Math.max(18, ASSUMED_PREP_MIN+6)} דק׳`;
  } else {
    eta = state.checkout.etaText || "";
  }
  if(etaPill){
    etaPill.textContent = eta ? `הגעה משוערת: ${eta}` : (state.serviceType==="pickup" ? "איסוף מהיר" : "הפעל מיקום לזמן הגעה");
  }
  if(locHint){
    locHint.style.display = (state.serviceType==="delivery" && !state.checkout.userLatLng) ? "block" : "none";
  }
}

function bindMetaButtons(){
  $$("#serviceBtns .metaBtn").forEach(b=>{
    b.onclick = ()=> {
      state.serviceType = b.getAttribute("data-service");
      $$("#serviceBtns .metaBtn").forEach(x=>x.classList.toggle("metaBtn--active", x===b));
      renderCart();
    };
  });
  $$("#payBtns .metaBtn").forEach(b=>{
    b.onclick = ()=> {
      state.paymentStatus = b.getAttribute("data-pay");
      $$("#payBtns .metaBtn").forEach(x=>x.classList.toggle("metaBtn--active", x===b));
      renderCart();
    };
  });
}
bindMetaButtons();

// ---------- Send order to POS ----------
const ORDER_CODE_RANGES = {
  delivery: { min: 1000, max: 1999 },
  pickup:   { min: 3000, max: 3999 },
};

async function generateOrderCode(orderType) {
  const range = ORDER_CODE_RANGES[orderType] || {min:1000,max:9999};
  const min = range.min, max = range.max;

  function buildBaseCode() {
    const rand = Math.floor(Math.random() * (max - min + 1)) + min;
    return String(rand);
  }

  while(true) {
    const code = buildBaseCode();
    try {
      const qRef = query(collection(db,"orders"), where("orderCode","==", code), limit(1));
      const snap = await getDocs(qRef);
      if(snap.empty) return code;
    } catch(e) {
      console.warn("orderCode check failed", e);
      return code;
    }
  }
}

function isValidPhone(phone){
  const digits = String(phone||"").replace(/\D/g,"");
  return digits.length===10 && digits.startsWith("05");
}

// ---------- Customers (block + autofill) ----------
let CUSTOMER_BLOCKED = false;
let LAST_PHONE_LOOKUP = "";
async function lookupCustomerByPhone(phoneRaw){
  const digits = String(phoneRaw||"").replace(/\D/g,"");
  if(digits.length!==10 || !digits.startsWith("05")) return;
  if(digits === LAST_PHONE_LOOKUP) return;
  LAST_PHONE_LOOKUP = digits;
  try{
    const snap = await getDoc(doc(db,"customers", digits));
    if(!snap.exists()){
      CUSTOMER_BLOCKED = false;
      return;
    }
    const c = snap.data() || {};
    CUSTOMER_BLOCKED = !!c.blocked;

    // autofill (only if empty OR always? we prefer to fill if empty)
    if(c.name && !($("#custName").value||"").trim()) $("#custName").value = c.name;
    if(c.street && !($("#custStreet").value||"").trim()) $("#custStreet").value = c.street;
    if(c.house && !($("#custHouse").value||"").trim()) $("#custHouse").value = c.house;
    if(c.city && !($("#custCity").value||"").trim()) $("#custCity").value = c.city;
    if(c.floor && !($("#custFloor").value||"").trim()) $("#custFloor").value = c.floor;
    if(c.apt && !($("#custApt").value||"").trim()) $("#custApt").value = c.apt;

    if(CUSTOMER_BLOCKED){
      const phoneErr = $("#phoneErr");
      if(phoneErr){
        phoneErr.textContent = "לקוח חסום. לא ניתן לבצע הזמנה.";
        phoneErr.style.display = "block";
      }
      toast("לקוח חסום", "לא ניתן להזמין");
    }
  }catch(e){
    console.warn("customer lookup failed", e);
  }
}

// ---------- Restaurant hours (settings) ----------
let RESTAURANT_HOURS = null;
async function loadRestaurantSettings(){
  try{
    const snap = await getDoc(doc(db,"settings","restaurant"));
    RESTAURANT_HOURS = snap.exists() ? (snap.data().hours || null) : null;
  }catch(e){
    console.warn("settings/restaurant load failed", e);
  }
}
function isRestaurantOpenNow(){
  if(!RESTAURANT_HOURS) return true; // if not configured, don't block
  const d = new Date();
  const dayIdx = d.getDay();
  const map = ["sun","mon","tue","wed","thu","fri","sat"];
  const key = map[dayIdx] || "sun";
  const cfg = RESTAURANT_HOURS[key];
  if(!cfg) return true;
  if(cfg.closed) return false;
  const hhmm = (n)=> String(n).padStart(2,"0");
  const now = `${hhmm(d.getHours())}:${hhmm(d.getMinutes())}`;
  const from = cfg.from || "00:00";
  const to = cfg.to || "23:59";
  return (now >= from && now <= to);
}

let sendingOrder = false;
$("#btnPlaceOrder").onclick = async () => {
  // Step 1 (cart): go to checkout UI instead of sending
  if(state.cartStep === "cart"){
    state.cartStep = "checkout";
    renderCart();
    // try to compute ETA + draw map
    ensureCheckoutMap().then(updateCheckoutTotalsAndEta);
    return;
  }
  const statusEl = $("#sendStatus");
  statusEl.textContent = "";

  if(sendingOrder) return;
  if(!state.cart.length){
    statusEl.textContent = "השקית ריקה.";
    return;
  }

  // validate phone if delivery and provided
  const phoneErr = $("#phoneErr");
  phoneErr.style.display="none";
  if(state.serviceType==="delivery") {
    const phone = ($("#custPhone").value||"").trim();
    if(phone && !isValidPhone(phone)) {
      phoneErr.textContent = "טלפון לא תקין (10 ספרות ומתחיל ב-05).";
      phoneErr.style.display="block";
      return;
    }

    // blocked customer check (based on /customers/{phone})
    if(phone){
      await lookupCustomerByPhone(phone);
      if(CUSTOMER_BLOCKED){
        phoneErr.textContent = "לקוח חסום. לא ניתן לבצע הזמנה.";
        phoneErr.style.display="block";
        return;
      }
    }
  }

  // hours check
  if(!isRestaurantOpenNow()){
    statusEl.textContent = "המסעדה סגורה כרגע.";
    toast("סגור כרגע","בדוק שעות פעילות");
    return;
  }

  try {
    sendingOrder = true;
    $("#btnPlaceOrder").classList.add("is-loading");
    statusEl.textContent = "שולח לקופה…";
    toast("שולח לקופה…","רק שנייה");

    const items = state.cart.map(ci => ci.firestoreItem);

    const itemsTotal = items.reduce((s,it)=> s + (Number(it.price||0) * Number(it.qty||1)), 0);
    const orderCode = await generateOrderCode(state.serviceType);

    const baseData = {
      orderCode,
      serviceType: state.serviceType,
      paymentStatus: state.paymentStatus,
      isPaid: state.paymentStatus === "paid",
      paymentNotes: null,
      items,
      totalAmount: itemsTotal,
      deliveryFee: 0,
      status: "open",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docData = { ...baseData };

    if(state.serviceType==="delivery") {
      docData.customerType = "delivery";
      docData.customerName = ($("#custName").value||"").trim() || null;
      const phone = ($("#custPhone").value||"").trim();
      docData.phone = phone || null;
      docData.address = {
        street: ($("#custStreet").value||"").trim() || null,
        houseNumber: ($("#custHouse").value||"").trim() || null,
        city: ($("#custCity").value||"").trim() || null,
        floor: ($("#custFloor").value||"").trim() || null,
        apartment: ($("#custApt").value||"").trim() || null,
        entrance: null
      };
    } else {
      // pickup (maps to takeaway in POS)
      docData.customerType = "takeaway";
      docData.customerName = null;
      docData.phone = null;
    }

    await addDoc(collection(db,"orders"), docData);
    if(state.serviceType==="delivery"){ saveDeliveryDefaults(); }

    statusEl.textContent = `נשלח! מספר הזמנה: ${orderCode} ✅`;
    toast("הזמנה התקבלה ✅", `מספר הזמנה: ${orderCode}`);
    // clear cart
    state.cart = [];
    renderBottom();
    renderCart();
  } catch(e) {
    console.error(e);
    toast("לא נשלח 😕","בדוק אינטרנט / הרשאות");
    statusEl.textContent = "שגיאה בשליחה לקופה. בדוק Rules / חיבור אינטרנט.";
  }
    sendingOrder = false;
    $("#btnPlaceOrder").classList.remove("is-loading");
};

// ---------- init ----------
listenCategories();
listenMenu();
listenToppingsMedia();
loadToppingsAndPricing();
loadUnifiedSauces();
loadPastaOptions();
listenBanners();
if (typeof loadVisualSettings === "function") { loadVisualSettings(); }
loadRestaurantSettings();
render();
startHero();
bindAdminUI();
setTimeout(hideSplash, 650);


function hideSplash(){
  const s=document.getElementById('splash');
  if(!s) return;
  s.classList.add('is-hide');
  setTimeout(()=>s.remove(), 500);
}

// ---------- Delivery defaults + persist ----------
const LS_KEY = "olive_delivery_v1";
function loadDeliveryDefaults(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return;
    const d = JSON.parse(raw);
    if(d.name) $("#custName").value = d.name;
    if(d.phone) $("#custPhone").value = d.phone;
    if(d.street) $("#custStreet").value = d.street;
    if(d.house) $("#custHouse").value = d.house;
    if(d.city) $("#custCity").value = d.city;
    if(d.floor) $("#custFloor").value = d.floor;
    if(d.apt) $("#custApt").value = d.apt;
  }catch(e){}
}
function saveDeliveryDefaults(){
  try{
    const d = {
      name: ($("#custName").value||"").trim(),
      phone: ($("#custPhone").value||"").trim(),
      street: ($("#custStreet").value||"").trim(),
      house: ($("#custHouse").value||"").trim(),
      city: ($("#custCity").value||"").trim(),
      floor: ($("#custFloor").value||"").trim(),
      apt: ($("#custApt").value||"").trim(),
    };
    localStorage.setItem(LS_KEY, JSON.stringify(d));
  }catch(e){}
}
function setJaffaDefault(){
  const city = $("#custCity");
  if(city && !city.value) city.value = "יפו";
}
(function bindDeliveryPersist(){
  const ids = ["custName","custPhone","custStreet","custHouse","custCity","custFloor","custApt"];
  ids.forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.addEventListener('blur', saveDeliveryDefaults);
    el.addEventListener('change', saveDeliveryDefaults);
  });
})();

// Auto-lookup customer when phone complete (10 digits)
(function bindCustomerLookup(){
  const el = document.getElementById("custPhone");
  if(!el) return;
  el.addEventListener("input", ()=>{
    const digits = String(el.value||"").replace(/\D/g,"");
    if(digits.length===10 && digits.startsWith("05")){
      lookupCustomerByPhone(digits);
    }
  });
})();

// ---------- Notifications (optional) ----------
function supportsNotifications(){ return ("Notification" in window); }
function updateNotifUI(){
  const st = document.getElementById("notifStatus");
  if(!st) return;
  if(!supportsNotifications()){ st.textContent = "בדפדפן זה לא נתמך."; return; }
  if(Notification.permission === "granted") st.textContent = "מופעל ✅";
  else if(Notification.permission === "denied") st.textContent = "נחסם בהגדרות הדפדפן";
  else st.textContent = "כבוי (אפשר להפעיל)";
}
async function askNotifications(){
  if(!supportsNotifications()){ toast("התראות לא נתמכות","במכשיר/דפדפן הזה"); return; }
  try{
    const res = await Notification.requestPermission();
    updateNotifUI();
    if(res==="granted") toast("התראות הופעלו ✅","נעדכן כשזה מוכן");
    else toast("ההתראות לא הופעלו","אפשר תמיד אחר כך");
  }catch(e){ toast("בעיה בהפעלת התראות","נסה שוב"); }
}
(function bindNotifButtons(){
  const en = document.getElementById("btnEnableNotif");
  const la = document.getElementById("btnNotifLater");
  if(en) en.onclick = ()=> askNotifications();
  if(la) la.onclick = ()=> toast("סבבה 😄","אפשר להפעיל בהמשך");
  updateNotifUI();
})();


// ---------- ADMIN_MEDIA_MANAGER ----------
const ADMIN_PIN = "2468"; // <-- שנה כאן PIN (לדוגמה 2468)
function isAdminEnabled(){
  return new URLSearchParams(location.search).get("admin") === "1";
}
function setAriaOpenById(id, open){
  const el = document.getElementById(id);
  if(!el) return;
  el.setAttribute("aria-hidden", open ? "false" : "true");
  el.classList.toggle("is-open", open);
}
function openAdmin(open){
  setAriaOpenById("adminModal", open);
}
function bindAdminUI(){
  if(!isAdminEnabled()){
    document.body.classList.remove("is-admin");
    return;
  }
  document.body.classList.add("is-admin");

  const btn = document.getElementById("btnAdmin");
  const modal = document.getElementById("adminModal");
  if(btn) btn.onclick = ()=> openAdmin(true);

  if(modal){
    modal.addEventListener("click", (e)=>{
      const t = e.target;
      if(t && (t.dataset && t.dataset.close==="admin")) openAdmin(false);
    });
  }

  // tabs
  const tabs = Array.from(document.querySelectorAll(".adminTab"));
  const panes = Array.from(document.querySelectorAll(".adminPane"));
  tabs.forEach(tb=>{
    tb.onclick = ()=>{
      tabs.forEach(x=>x.classList.remove("is-on"));
      tb.classList.add("is-on");
      const tab = tb.dataset.tab;
      panes.forEach(p=> p.style.display = (p.dataset.pane===tab) ? "" : "none");
    };
  });

  // pin
  const lock = document.getElementById("adminLock");
  const content = document.getElementById("adminContent");
  const pinInp = document.getElementById("adminPin");
  const pinBtn = document.getElementById("adminPinBtn");
  const pinHint = document.getElementById("adminPinHint");

  function unlock(){
    lock.style.display="none";
    content.style.display="";
    refreshAdminLists();
  }

  const saved = localStorage.getItem("olive_admin_ok");
  if(saved==="1") unlock();

  if(pinBtn){
    pinBtn.onclick = ()=>{
      const v = (pinInp.value||"").trim();
      if(v===ADMIN_PIN){
        localStorage.setItem("olive_admin_ok","1");
        pinHint.textContent="נכנסת ✅";
        unlock();
      }else{
        pinHint.textContent="PIN לא נכון";
      }
    };
  }

  // banner upload
  const upBan = document.getElementById("btnUploadBanner");
  if(upBan){
    upBan.onclick = async ()=>{
      const st = document.getElementById("banStatus");
      const f = document.getElementById("banFile").files?.[0];
      if(!f){ st.textContent="בחר קובץ"; return; }
      st.textContent="מעלה…";
      const isVid = f.type.startsWith("video");
      const path = `banners/${Date.now()}_${f.name}`.replace(/\s+/g,"_");
      const r = sRef(storage, path);
      const task = uploadBytesResumable(r, f);
      await new Promise((res,rej)=>{
        task.on("state_changed", (snap)=>{
          const p = Math.round((snap.bytesTransferred/snap.totalBytes)*100);
          st.textContent = `מעלה… ${p}%`;
        }, rej, res);
      });
      const url = await getDownloadURL(r);
      const chipsRaw = (document.getElementById("banChips").value||"").split(",").map(s=>s.trim()).filter(Boolean);
      const docData = {
        kicker: (document.getElementById("banKicker").value||"").trim(),
        headline: (document.getElementById("banHeadline").value||"").trim(),
        sub: (document.getElementById("banSub").value||"").trim(),
        chips: chipsRaw,
        type: isVid ? "video" : "image",
        url,
        active: true,
        order: Date.now(),
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db,"banners"), docData);
      st.textContent="נשמר ✅";
      toast("נשמר ✅","באנר חדש התווסף");
      document.getElementById("banFile").value="";
    };
  }

  // product upload
  const upProd = document.getElementById("btnUploadProductImg");
  if(upProd){
    upProd.onclick = async ()=>{
      const st = document.getElementById("prodStatus");
      const sel = document.getElementById("prodSelect");
      const id = sel.value;
      const f = document.getElementById("prodFile").files?.[0];
      if(!id){ st.textContent="בחר מוצר"; return; }
      if(!f){ st.textContent="בחר תמונה"; return; }
      st.textContent="מעלה…";
      const ext = (f.name.split(".").pop()||"jpg").toLowerCase();
      const path = `products/${id}.${ext}`.replace(/\s+/g,"_");
      const r = sRef(storage, path);
      const task = uploadBytesResumable(r, f);
      await new Promise((res,rej)=>{
        task.on("state_changed", (snap)=>{
          const p = Math.round((snap.bytesTransferred/snap.totalBytes)*100);
          st.textContent = `מעלה… ${p}%`;
        }, rej, res);
      });
      const url = await getDownloadURL(r);
      await updateDoc(doc(db,"menu", id), { imageUrl: url, updatedAt: serverTimestamp() });
      st.textContent="נשמר ✅";
      toast("תמונה עודכנה ✅", "המוצר יתעדכן מיד");
      document.getElementById("prodFile").value="";
    };
  }

  // notifications card UI already bound elsewhere
}

function refreshAdminLists(){
  // populate products select
  const sel = document.getElementById("prodSelect");
  if(sel && state.menu?.length){
    const opts = state.menu.map(it=>{
      const nm = it.nameHe || it.nameAr || it.name || it.id;
      return `<option value="${it.id}">${nm}</option>`;
    }).join("");
    sel.innerHTML = `<option value="">בחר…</option>` + opts;
  }
  // list banners
  const list = document.getElementById("bannerList");
  if(!list) return;

  const qy = query(collection(db,"banners"), orderBy("order","asc"));
  onSnapshot(qy, (snap)=>{
    const items = [];
    snap.forEach(d=>{
      const b = d.data()||{};
      items.push({id:d.id, ...b});
    });
    list.innerHTML = items.map(b=>{
      const title = (b.headline || b.kicker || "Banner");
      const sub = (b.type || "") + " • " + (b.active===false ? "כבוי" : "פעיל");
      const thumb = b.url ? (b.type==="video"
        ? `<video src="${b.url}" muted playsinline></video>`
        : `<img src="${b.url}" alt="">`) : "—";
      return `
        <div class="adminItem">
          <div class="adminThumb">${thumb}</div>
          <div class="adminMeta">
            <div class="adminMeta__t">${title}</div>
            <div class="adminMeta__s">${sub}</div>
          </div>
          <div class="adminActions">
            <button class="smallBtn" data-ban-toggle="${b.id}">${b.active===false ? "הפעל" : "כבה"}</button>
            <button class="smallBtn smallBtn--danger" data-ban-del="${b.id}">מחק</button>
          </div>
        </div>
      `;
    }).join("");

    // bind actions
    list.querySelectorAll("[data-ban-toggle]").forEach(btn=>{
      btn.onclick = async ()=>{
        const id = btn.dataset.banToggle;
        const ref = doc(db,"banners", id);
        const cur = items.find(x=>x.id===id);
        await updateDoc(ref, { active: !(cur?.active!==false), updatedAt: serverTimestamp() });
      };
    });
    list.querySelectorAll("[data-ban-del]").forEach(btn=>{
      btn.onclick = async ()=>{
        const id = btn.dataset.banDel;
        await deleteDoc(doc(db,"banners", id));
        toast("נמחק ✅","באנר הוסר");
      };
    });
  });
}