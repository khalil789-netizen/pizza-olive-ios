import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, getDoc, setDoc, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getStorage, ref as sRef, uploadBytesResumable, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ------------------ Config ------------------
const firebaseConfig = {
  apiKey: "AIzaSyDX-R1XONKy3cGzdon4Nd38coZV94Z99aA",
  authDomain: "olive-kopa.firebaseapp.com",
  projectId: "olive-kopa",
  storageBucket: "olive-kopa.firebasestorage.app",
  messagingSenderId: "260791001433",
  appId: "1:260791001433:web:4cfbfd3b2230e734362c48",
  measurementId: "G-7C3PB6WYPT",
};

const app = (getApps().length ? getApps()[0] : initializeApp(firebaseConfig));
const db = getFirestore(app);
const storage = getStorage(app);

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

// ---- Options (Toppings/Sauces/Extras) in Firestore ----
const OPT_COL = "options";
const PR_DOC_PATH = "pricingRules/pizza_toppings_by_size";

/**
 * Default seed (you can edit later from Admin)
 * Each option:
 *  - id: doc id
 *  - kind: regular | special | edges | other
 *  - name: {he, ar, en}
 */
const DEFAULT_OPTIONS = [
  { id:"green_olives", kind:"regular", sort:10,  name:{ he:"זית ירוק", ar:"زيتون أخضر", en:"Green olives" } },
  { id:"black_olives", kind:"regular", sort:20,  name:{ he:"זית שחור", ar:"زيتون أسمر", en:"Black olives" } },
  { id:"corn",         kind:"regular", sort:30,  name:{ he:"תירס",    ar:"ذرة",        en:"Corn" } },
  { id:"mushrooms",    kind:"regular", sort:40,  name:{ he:"פטריות",  ar:"فطر",        en:"Mushrooms" } },
  { id:"tuna",         kind:"regular", sort:50,  name:{ he:"טונה",    ar:"طونة",       en:"Tuna" } },
  { id:"tomato",       kind:"regular", sort:60,  name:{ he:"עגבניות", ar:"بندورة",     en:"Tomato" } },
  { id:"onion",        kind:"regular", sort:70,  name:{ he:"בצל",     ar:"بصل",        en:"Onion" } },
  { id:"hot_pepper",   kind:"regular", sort:80,  name:{ he:"פלפל חריף",ar:"فلفل حار",   en:"Hot pepper" } },

  { id:"egg",          kind:"special", sort:110, name:{ he:"ביצה",    ar:"بيضة",       en:"Egg" } },
  { id:"shrimp",       kind:"special", sort:120, name:{ he:"שרימפס",  ar:"روبيان",     en:"Shrimp" } },

  { id:"cheese_crust", kind:"edges",   sort:200, name:{ he:"מסביב גבינה", ar:"أطراف جبنة", en:"Cheese crust" } },
];

async function ensureSeedOptions(){
  const snap = await getDocs(collection(db, OPT_COL));
  if(!snap.empty) return;
  for(const o of DEFAULT_OPTIONS){
    await setDoc(doc(db, OPT_COL, o.id), {
      kind: o.kind || "regular",
      name: o.name || { ar:o.id, he:o.id, en:o.id },
      sort: Number.isFinite(o.sort) ? o.sort : 999,
      isActive: true,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  }
}

async function ensureSeedPricingRules(){
  const d = await getDoc(doc(db, ...PR_DOC_PATH.split("/")));
  if(d.exists()) return;
  await setDoc(doc(db, ...PR_DOC_PATH.split("/")), {
    L: { regular: 7, special: 10, shrimp: 10, cheese_crust: 25 },
    M: { regular: 5, special: 10, shrimp: 10, cheese_crust: 20 },
    P: { regular: 0, special: 0,  shrimp: 0,  cheese_crust: 10 },
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}

function labelOf(opt, lang="ar"){
  return opt?.name?.[lang] || opt?.name?.ar || opt?.name?.he || opt?.name?.en || opt?.id || "";
}

function priceKeyForOption(optId, kind){
  if(optId === "shrimp") return "shrimp";
  if(optId === "cheese_crust") return "cheese_crust";
  return (kind === "special") ? "special" : "regular";
}

// ------------------ Admin PIN ------------------

// שנה כאן PIN (אל תשתף אותו עם עובדים)
const ADMIN_PIN = "2468";
const LS_KEY = "olive_admin_ok_v1";

function toast(msg, sub=""){
  const el = document.getElementById("toast");
  if(!el) return;
  el.querySelector(".t").textContent = msg;
  el.querySelector(".s").textContent = sub;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(()=> el.classList.remove("show"), 2600);
}

function setLoading(on){
  const ld = document.getElementById("loading");
  if(ld) ld.hidden = !on;
}

function lockUI(lock){
  // Match IDs in admin/index.html
  const lockEl = document.getElementById("lockCard");
  const appEl = document.getElementById("adminGrid");
  if(lockEl) lockEl.style.display = lock ? "" : "none";
  if(appEl) appEl.style.display = lock ? "none" : "";
}

function isAuthed(){
  return localStorage.getItem(LS_KEY) === "1";
}

function doLogout(){
  localStorage.removeItem(LS_KEY);
  lockUI(true);
  toast("התנתקת", "");
}

// ------------------ Data ------------------
let MENU = [];
let unsubBanners = null;
let CATEGORIES = [];
let unsubCustomers = null;
let unsubZones = null;
let CURRENT_CUSTOMERS = [];
let CURRENT_ZONES = [];
let editingCustomerId = null; // phone digits
let editingZoneId = null;
let RESTAURANT_SETTINGS = null;

async function loadMenuOnce(){
  const snap = await getDocs(collection(db, "menu"));
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  // sort nicely without requiring Firestore indexes
  arr.sort((a,b)=>{
    const ao = Number(a.displayOrder ?? a.order ?? 999999);
    const bo = Number(b.displayOrder ?? b.order ?? 999999);
    if(ao !== bo) return ao - bo;
    const an = String(a.nameHe || a.nameAr || a.name || a.id);
    const bn = String(b.nameHe || b.nameAr || b.name || b.id);
    return an.localeCompare(bn, 'he');
  });
  MENU = arr;

  const sel = document.getElementById("prodSelect");
  if(sel){
    sel.innerHTML = `<option value="">בחר מוצר…</option>` + MENU.map(it=>{
      const nm = it.nameHe || it.nameAr || it.name || it.id;
      return `<option value="${it.id}">${escapeHtml(nm)}</option>`;
    }).join("");
  }
}

function slugId(s){
  // Firestore doc id safe (no slashes)
  return String(s||"")
    .trim()
    .toLowerCase()
    .replace(/\s+/g,"-")
    .replace(/[^a-z0-9\u0590-\u05FF\u0600-\u06FF\-_.]/g,"")
    .replace(/-+/g,"-")
    .slice(0,80) || `cat_${Date.now()}`;
}

function extractCategoriesFromMenu(){
  const set = new Map();
  MENU.forEach(it=>{
    const raw = it.category ?? it.categoryId ?? it.cat ?? it.section ?? it.group ?? "";
    const key = String(raw||"").trim();
    if(!key) return;
    if(!set.has(key)) set.set(key, { key, id: slugId(key) });
  });
  // stable order
  return Array.from(set.values()).sort((a,b)=> a.key.localeCompare(b.key,'he'));
}

async function loadCategoriesOnce(){
  // categories are stored as docs in /categories
  const snap = await getDocs(collection(db, "categories"));
  const map = new Map();
  snap.forEach(d=> map.set(d.id, { id:d.id, ...d.data() }));

  const derived = extractCategoriesFromMenu();
  CATEGORIES = derived.map(c=> ({
    id: c.id,
    key: c.key,
    ...(map.get(c.id) || {})
  }));

  const sel = document.getElementById("catSelect");
  if(sel){
    sel.innerHTML = `<option value="">בחר קטגוריה…</option>` + CATEGORIES.map(c=>
      `<option value="${c.id}">${escapeHtml(c.key)}</option>`
    ).join("");
  }
}

function escapeHtml(s){
  return String(s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/\"/g,"&quot;");
}

function bindBannersLive(){
  const list = document.getElementById("bannerList");
  if(!list) return;

  // prefer orderBy("order") but if it fails (missing index/field) fallback.
  const qy = query(collection(db, "banners"), orderBy("order", "asc"));

  if(unsubBanners) unsubBanners();
  unsubBanners = onSnapshot(qy, (snap)=>{
    const items = [];
    snap.forEach(d=> items.push({ id: d.id, ...d.data() }));

    if(!items.length){
      list.innerHTML = `<div class="empty">אין עדיין באנרים. תוסיף באנר חדש למעלה.</div>`;
      return;
    }

    list.innerHTML = items.map(b=>{
      const title = b.headline || b.kicker || "Banner";
      const active = (b.active !== false);
      const kind = b.type || (b.url && String(b.url).includes(".mp4") ? "video" : "image");

      const thumb = b.url ? (
        kind === "video"
          ? `<video src="${b.url}" muted playsinline></video>`
          : `<img src="${b.url}" alt="" />`
      ) : `<div class="thumbPh">No media</div>`;

      return `
        <div class="item">
          <div class="thumb">${thumb}</div>
          <div class="meta">
            <div class="t">${escapeHtml(title)}</div>
            <div class="s">${kind} • ${active ? "פעיל" : "כבוי"}</div>
            <div class="s dim">${escapeHtml(b.sub || "")}</div>
          </div>
          <div class="acts">
            <button class="btn sm" data-ban-toggle="${b.id}">${active ? "כבה" : "הפעל"}</button>
            <button class="btn sm danger" data-ban-del="${b.id}">מחק</button>
          </div>
        </div>`;
    }).join("");

    // bind actions
    $$('[data-ban-toggle]', list).forEach(btn=>{
      btn.onclick = async ()=>{
        const id = btn.dataset.banToggle;
        const cur = items.find(x=>x.id===id);
        try{
          await updateDoc(doc(db,"banners",id), {
            active: !(cur?.active !== false),
            updatedAt: serverTimestamp(),
          });
        }catch(e){
          console.error(e);
          toast("שגיאה", "לא הצלחתי לעדכן באנר");
        }
      };
    });

    $$('[data-ban-del]', list).forEach(btn=>{
      btn.onclick = async ()=>{
        const id = btn.dataset.banDel;
        if(!confirm("למחוק את הבאנר?")) return;
        try{
          await deleteDoc(doc(db,"banners",id));
          toast("נמחק ✅", "הבאנר הוסר");
        }catch(e){
          console.error(e);
          toast("שגיאה", "לא הצלחתי למחוק");
        }
      };
    });
  }, (err)=>{
    console.warn("banners snapshot error", err);
    list.innerHTML = `<div class="empty">שגיאה בטעינת באנרים. בדוק הרשאות Storage/Firestore.</div>`;
  });
}

async function uploadFileToStorage(file, folder){
  const safeName = `${Date.now()}_${file.name}`.replace(/\s+/g,"_");
  const path = `${folder}/${safeName}`;
  const r = sRef(storage, path);
  const task = uploadBytesResumable(r, file);

  const st = document.getElementById("loading");
  setLoading(true);

  await new Promise((res, rej)=>{
    task.on("state_changed", (snap)=>{
      const p = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
      if(st) st.textContent = `מעלה… ${p}%`;
    }, rej, res);
  });

  const url = await getDownloadURL(r);
  setLoading(false);
  return url;
}

async function handleAddBanner(){
  const f = document.getElementById("banFile").files?.[0];
  if(!f){ toast("בחר קובץ", "תמונה או וידאו"); return; }

  const isVid = f.type.startsWith("video");

  try{
    const url = await uploadFileToStorage(f, "banners");
    const chips = (document.getElementById("banChips").value||"")
      .split(",").map(s=>s.trim()).filter(Boolean);

    const docData = {
      kicker: (document.getElementById("banKicker").value||"").trim(),
      headline: (document.getElementById("banHeadline").value||"").trim(),
      sub: (document.getElementById("banSub").value||"").trim(),
      chips,
      type: isVid ? "video" : "image",
      url,
      active: true,
      order: Date.now(),
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "banners"), docData);
    document.getElementById("banFile").value = "";
    toast("נשמר ✅", "באנר חדש התווסף");
  }catch(e){
    console.error(e);
    toast("שגיאה", "לא הצלחתי להוסיף באנר");
  }
}

async function handleUploadProductImage(){
  const id = document.getElementById("prodSelect").value;
  const f = document.getElementById("prodFile").files?.[0];
  if(!id){ toast("בחר מוצר", ""); return; }
  if(!f){ toast("בחר תמונה", ""); return; }

  try{
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
    const path = `products/${id}.${ext}`.replace(/\s+/g,"_");

    const r = sRef(storage, path);
    const task = uploadBytesResumable(r, f);
    setLoading(true);

    await new Promise((res, rej)=>{
      task.on("state_changed", (snap)=>{
        const p = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        const ld = document.getElementById("loading");
        if(ld) ld.textContent = `מעלה… ${p}%`;
      }, rej, res);
    });

    const url = await getDownloadURL(r);
    setLoading(false);

    await updateDoc(doc(db, "menu", id), {
      imageUrl: url,
      updatedAt: serverTimestamp(),
    });

    document.getElementById("prodFile").value = "";
    toast("נשמר ✅", "התמונה עודכנה במוצר");

    // show preview
    const pv = document.getElementById("prodPreview");
    if(pv) pv.src = url;
  }catch(e){
    console.error(e);
    toast("שגיאה", "לא הצלחתי להעלות תמונת מוצר");
    setLoading(false);
  }
}

async function handleUploadCategoryImage(){
  const id = document.getElementById("catSelect")?.value;
  const f = document.getElementById("catFile")?.files?.[0];
  if(!id){ toast("בחר קטגוריה", ""); return; }
  if(!f){ toast("בחר תמונה", ""); return; }

  try{
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
    const path = `categories/${id}.${ext}`.replace(/\s+/g,"_");

    const r = sRef(storage, path);
    const task = uploadBytesResumable(r, f);
    setLoading(true);

    await new Promise((res, rej)=>{
      task.on("state_changed", (snap)=>{
        const p = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        const ld = document.getElementById("loading");
        if(ld) ld.textContent = `מעלה… ${p}%`;
      }, rej, res);
    });

    const url = await getDownloadURL(r);
    setLoading(false);

    const key = CATEGORIES.find(x=>x.id===id)?.key || id;
    const nameHe = (document.getElementById("catNameHe")?.value||"").trim();
    const nameAr = (document.getElementById("catNameAr")?.value||"").trim();

    await setDoc(doc(db, "categories", id), {
      key,
      nameHe: nameHe || null,
      nameAr: nameAr || null,
      label: nameHe || nameAr || id,
      imageUrl: url,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });

    document.getElementById("catFile").value = "";
    toast("נשמר ✅", "תמונת קטגוריה עודכנה");

    const pv = document.getElementById("catPreview");
    if(pv){ pv.src = url; pv.style.opacity = "1"; }

    await loadCategoriesOnce();
  }catch(e){
    console.error(e);
    toast("שגיאה", "לא הצלחתי להעלות תמונת קטגוריה");
    setLoading(false);
  }
}

// ------------------ Base images for area selector (pizza / sfiha) ------------------
let VISUAL_DOC_CACHE = null;

async function loadVisualsDoc(){
  try{
    const snap = await getDoc(doc(db,"settings","visuals"));
    VISUAL_DOC_CACHE = snap.exists() ? (snap.data()||{}) : {};
  }catch(e){
    VISUAL_DOC_CACHE = {};
  }
  return VISUAL_DOC_CACHE;
}

async function refreshBasePreview(){
  const type = document.getElementById("baseType")?.value || "pizza";
  const size = document.getElementById("baseSize")?.value || "medium";
  const pv = document.getElementById("basePreview");
  const scale = document.getElementById("baseScale");
  const scaleVal = document.getElementById("baseScaleVal");
  const d = VISUAL_DOC_CACHE || (await loadVisualsDoc());
  const url = d?.bases?.[type]?.[size] ?? d?.bases?.[type]?.[`${size}Url`] ?? null;
  const sc = Number(d?.scales?.[type]?.[size] ?? (size==="large"?1.05:(size==="small"?0.92:0.98)));
  if(pv){
    pv.src = url || "";
    pv.style.opacity = url ? "1" : "0";
  }
  if(scale){
    scale.value = String(sc);
  }
  if(scaleVal){
    scaleVal.textContent = sc.toFixed(2);
  }
}

async function handleUploadBaseImage(){
  const type = document.getElementById("baseType")?.value || "pizza";
  const size = document.getElementById("baseSize")?.value || "medium";
  const f = document.getElementById("baseFile")?.files?.[0];
  if(!f){ toast("בחר תמונה", ""); return; }
  try{
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
    const path = `bases/${type}_${size}.${ext}`.replace(/\s+/g,"_");
    const r = sRef(storage, path);
    const task = uploadBytesResumable(r, f);
    setLoading(true);

    await new Promise((res, rej)=>{
      task.on("state_changed", (snap)=>{
        const p = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        const ld = document.getElementById("loading");
        if(ld) ld.textContent = `מעלה… ${p}%`;
      }, rej, res);
    });

    const url = await getDownloadURL(r);
    setLoading(false);

    await setDoc(doc(db,"settings","visuals"), {
      bases: { [type]: { [size]: url } },
      updatedAt: serverTimestamp(),
    }, { merge: true });

    const st = document.getElementById("baseStatus");
    if(st) st.textContent = "נשמר ✅";
    document.getElementById("baseFile").value = "";
    await loadVisualsDoc();
    await refreshBasePreview();
    toast("נשמר ✅", "תמונת בסיס עודכנה");
  }catch(e){
    console.error(e);
    setLoading(false);
    toast("שגיאה", "לא הצלחתי להעלות תמונת בסיס");
  }
}

async function handleSaveBaseScale(){
  const type = document.getElementById("baseType")?.value || "pizza";
  const size = document.getElementById("baseSize")?.value || "medium";
  const sc = Number(document.getElementById("baseScale")?.value || "1");
  try{
    await setDoc(doc(db,"settings","visuals"), {
      scales: { [type]: { [size]: sc } },
      updatedAt: serverTimestamp(),
    }, { merge: true });
    const st = document.getElementById("baseStatus");
    if(st) st.textContent = "Scale נשמר ✅";
    await loadVisualsDoc();
    toast("נשמר ✅", "גודל עיגול עודכן");
  }catch(e){
    console.error(e);
    toast("שגיאה", "לא הצלחתי לשמור Scale");
  }
}

// ------------------ Customers ------------------
function normPhoneId(phone){
  return String(phone||"").replace(/\D/g,"").slice(0,10);
}

function getCustomerForm(){
  return {
    phone: normPhoneId(document.getElementById("cPhone")?.value),
    name: (document.getElementById("cName")?.value||"").trim(),
    street: (document.getElementById("cStreet")?.value||"").trim(),
    house: (document.getElementById("cHouse")?.value||"").trim(),
    city: (document.getElementById("cCity")?.value||"").trim(),
    floor: (document.getElementById("cFloor")?.value||"").trim(),
    apt: (document.getElementById("cApt")?.value||"").trim(),
    notes: (document.getElementById("cNotes")?.value||"").trim(),
  };
}

function fillCustomerForm(c){
  document.getElementById("cPhone").value = c.phone || c.id || "";
  document.getElementById("cName").value = c.name || "";
  document.getElementById("cStreet").value = c.street || "";
  document.getElementById("cHouse").value = c.house || "";
  document.getElementById("cCity").value = c.city || "";
  document.getElementById("cFloor").value = c.floor || "";
  document.getElementById("cApt").value = c.apt || "";
  document.getElementById("cNotes").value = c.notes || "";
  editingCustomerId = c.id || c.phone || null;
  const st = document.getElementById("custStatus");
  if(st){
    st.textContent = editingCustomerId ? `עריכה: ${editingCustomerId} ${c.blocked ? "(חסום)" : ""}` : "";
  }
}

function clearCustomerForm(){
  ["cPhone","cName","cStreet","cHouse","cCity","cFloor","cApt","cNotes"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = (id==="cCity" ? "יפו" : "");
  });
  editingCustomerId = null;
  const st = document.getElementById("custStatus");
  if(st) st.textContent = "";
}

function renderCustomersList(filter=""){
  const list = document.getElementById("customersList");
  if(!list) return;

  const q = String(filter||"").trim().toLowerCase();
  let items = CURRENT_CUSTOMERS;
  if(q){
    items = items.filter(c=>{
      const blob = `${c.id||""} ${c.name||""} ${c.street||""} ${c.city||""}`.toLowerCase();
      return blob.includes(q);
    });
  }

  if(!items.length){
    list.innerHTML = `<div class="empty">אין לקוחות להצגה.</div>`;
    return;
  }

  list.innerHTML = items.map(c=>{
    const title = c.name ? escapeHtml(c.name) : "(ללא שם)";
    const addr = [c.street, c.house, c.city].filter(Boolean).join(" ");
    const sub = [addr, c.floor ? `קומה ${c.floor}` : "", c.apt ? `דירה ${c.apt}` : ""].filter(Boolean).join(" • ");
    const badge = c.blocked ? `<span class="badge" style="border-color:rgba(255,77,109,.35);color:#ffd6de;">חסום</span>` : `<span class="badge">פעיל</span>`;
    return `
      <div class="item" data-cust="${c.id}">
        <div class="meta">
          <div class="meta__t">${title} ${badge}</div>
          <div class="meta__s">${escapeHtml(c.id)}</div>
          <div class="meta__s">${escapeHtml(sub)}</div>
        </div>
        <div class="itemActions">
          <button class="btn sm" data-cust-edit="${c.id}">ערוך</button>
          <button class="btn sm ${c.blocked ? "" : "danger"}" data-cust-block="${c.id}">${c.blocked ? "בטל חסימה" : "חסום"}</button>
        </div>
      </div>`;
  }).join("");

  $$('[data-cust-edit]', list).forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.custEdit;
      const c = CURRENT_CUSTOMERS.find(x=>x.id===id);
      if(c) fillCustomerForm(c);
    };
  });
  $$('[data-cust-block]', list).forEach(btn=>{
    btn.onclick = async ()=>{
      const id = btn.dataset.custBlock;
      const c = CURRENT_CUSTOMERS.find(x=>x.id===id);
      if(!c) return;
      try{
        await setDoc(doc(db,"customers",id), { blocked: !c.blocked, updatedAt: serverTimestamp() }, { merge:true });
        toast(!c.blocked ? "הלקוח נחסם" : "החסימה בוטלה", id);
      }catch(e){ console.error(e); toast("שגיאה","לא הצלחתי לעדכן"); }
    };
  });
}

function bindCustomersLive(){
  const list = document.getElementById("customersList");
  if(!list) return;
  if(unsubCustomers) unsubCustomers();
  const qy = query(collection(db,"customers"), orderBy("updatedAt","desc"), limit(60));
  unsubCustomers = onSnapshot(qy, (snap)=>{
    const arr = [];
    snap.forEach(d=> arr.push({ id:d.id, ...d.data() }));
    // normalize
    CURRENT_CUSTOMERS = arr.map(c=>({
      ...c,
      blocked: !!c.blocked,
    }));
    renderCustomersList(document.getElementById("custSearch")?.value||"");
  }, (err)=>{
    console.warn("customers snapshot error", err);
    list.innerHTML = `<div class="empty">שגיאה בטעינת לקוחות. בדוק הרשאות Firestore.</div>`;
  });
}

async function saveCustomer(){
  const f = getCustomerForm();
  if(!f.phone || f.phone.length !== 10){ toast("טלפון לא תקין","צריך 10 ספרות"); return; }
  try{
    const ref = doc(db,"customers", f.phone);
    const prev = await getDoc(ref);
    const prevData = prev.exists() ? prev.data() : {};
    await setDoc(ref, {
      phone: f.phone,
      name: f.name || null,
      street: f.street || null,
      house: f.house || null,
      city: f.city || null,
      floor: f.floor || null,
      apt: f.apt || null,
      notes: f.notes || null,
      blocked: !!prevData.blocked,
      updatedAt: serverTimestamp(),
      createdAt: prev.exists() ? (prevData.createdAt || serverTimestamp()) : serverTimestamp(),
    }, { merge:true });
    toast("נשמר ✅", f.phone);
    editingCustomerId = f.phone;
  }catch(e){ console.error(e); toast("שגיאה","לא הצלחתי לשמור"); }
}

async function toggleBlockCustomer(){
  const id = normPhoneId(document.getElementById("cPhone")?.value) || editingCustomerId;
  if(!id){ toast("בחר לקוח",""); return; }
  try{
    const ref = doc(db,"customers", id);
    const snap = await getDoc(ref);
    if(!snap.exists()){ toast("לא נמצא", id); return; }
    const cur = !!snap.data().blocked;
    await setDoc(ref, { blocked: !cur, updatedAt: serverTimestamp() }, { merge:true });
    toast(!cur ? "הלקוח נחסם" : "החסימה בוטלה", id);
  }catch(e){ console.error(e); toast("שגיאה","לא הצלחתי לעדכן"); }
}

async function deleteCustomer(){
  const id = normPhoneId(document.getElementById("cPhone")?.value) || editingCustomerId;
  if(!id){ toast("בחר לקוח",""); return; }
  if(!confirm(`למחוק לקוח ${id}?`)) return;
  try{
    await deleteDoc(doc(db,"customers", id));
    toast("נמחק ✅", id);
    clearCustomerForm();
  }catch(e){ console.error(e); toast("שגיאה","לא הצלחתי למחוק"); }
}

// ------------------ Restaurant hours (settings) ------------------
const DAYS = [
  { k:"sun", t:"ראשון" },
  { k:"mon", t:"שני" },
  { k:"tue", t:"שלישי" },
  { k:"wed", t:"רביעי" },
  { k:"thu", t:"חמישי" },
  { k:"fri", t:"שישי" },
  { k:"sat", t:"שבת" },
];

function defaultHours(){
  const base = {};
  DAYS.forEach(d=>{
    base[d.k] = { from:"12:00", to:"23:59", closed:false };
  });
  return base;
}

function renderHoursTable(hours){
  const box = document.getElementById("hoursTable");
  if(!box) return;
  const h = hours || defaultHours();
  box.innerHTML = DAYS.map(d=>{
    const v = h[d.k] || { from:"", to:"", closed:false };
    return `
      <div class="tr" data-day="${d.k}">
        <div class="day">${d.t}</div>
        <input class="input" type="time" data-from value="${escapeHtml(v.from||"")}" />
        <input class="input" type="time" data-to value="${escapeHtml(v.to||"")}" />
        <label class="chk"><input type="checkbox" data-closed ${v.closed ? "checked" : ""}/> סגור</label>
      </div>`;
  }).join("");
}

async function loadRestaurantSettings(){
  const ref = doc(db,"settings","restaurant");
  const snap = await getDoc(ref);
  if(snap.exists()){
    RESTAURANT_SETTINGS = snap.data();
  }else{
    RESTAURANT_SETTINGS = { hours: defaultHours() };
  }
  renderHoursTable(RESTAURANT_SETTINGS.hours);
}

async function saveRestaurantHours(){
  const rows = $$("#hoursTable .tr");
  const hours = {};
  rows.forEach(r=>{
    const k = r.dataset.day;
    const from = r.querySelector('[data-from]')?.value || "";
    const to = r.querySelector('[data-to]')?.value || "";
    const closed = !!r.querySelector('[data-closed]')?.checked;
    hours[k] = { from, to, closed };
  });
  try{
    await setDoc(doc(db,"settings","restaurant"), {
      hours,
      updatedAt: serverTimestamp(),
    }, { merge:true });
    toast("נשמר ✅","שעות פעילות עודכנו");
  }catch(e){ console.error(e); toast("שגיאה","לא הצלחתי לשמור שעות"); }
}

// ------------------ Delivery zones ------------------
function zoneForm(){
  return {
    name: (document.getElementById("zName")?.value||"").trim(),
    fee: Number(String(document.getElementById("zFee")?.value||"").replace(/[^0-9.]/g,"")) || 0,
    etaMin: Number(String(document.getElementById("zEtaMin")?.value||"").replace(/\D/g,"")) || 0,
    etaMax: Number(String(document.getElementById("zEtaMax")?.value||"").replace(/\D/g,"")) || 0,
    notes: (document.getElementById("zNotes")?.value||"").trim(),
    active: !!document.getElementById("zActive")?.checked,
  };
}

function clearZoneForm(){
  ["zName","zFee","zEtaMin","zEtaMax","zNotes"].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=""; });
  const act = document.getElementById("zActive");
  if(act) act.checked = true;
  editingZoneId = null;
  toast("מוכן","אפשר להוסיף אזור חדש");
}

function fillZoneForm(z){
  document.getElementById("zName").value = z.name || "";
  document.getElementById("zFee").value = z.fee ?? "";
  document.getElementById("zEtaMin").value = z.etaMin ?? "";
  document.getElementById("zEtaMax").value = z.etaMax ?? "";
  document.getElementById("zNotes").value = z.notes || "";
  document.getElementById("zActive").checked = (z.active !== false);
  editingZoneId = z.id;
  toast("עריכה","אזור: " + (z.name||z.id));
}

function renderZones(){
  const list = document.getElementById("zonesList");
  if(!list) return;
  if(!CURRENT_ZONES.length){
    list.innerHTML = `<div class="empty">אין עדיין אזורים. הוסף אזור חדש למעלה.</div>`;
    return;
  }
  list.innerHTML = CURRENT_ZONES.map(z=>{
    const badge = (z.active !== false) ? `<span class="badge">פעיל</span>` : `<span class="badge" style="opacity:.75">כבוי</span>`;
    const fee = `₪${Number(z.fee||0).toFixed(2)}`;
    const eta = (z.etaMin || z.etaMax) ? `${z.etaMin||"?"}–${z.etaMax||"?"} דק'` : "";
    return `
      <div class="item">
        <div class="meta">
          <div class="meta__t">${escapeHtml(z.name||"אזור")} ${badge}</div>
          <div class="meta__s">${escapeHtml([fee, eta, z.notes||""].filter(Boolean).join(" • "))}</div>
        </div>
        <div class="itemActions">
          <button class="btn sm" data-zone-edit="${z.id}">ערוך</button>
          <button class="btn sm" data-zone-toggle="${z.id}">${(z.active !== false) ? "כבה" : "הפעל"}</button>
          <button class="btn sm danger" data-zone-del="${z.id}">מחק</button>
        </div>
      </div>`;
  }).join("");

  $$('[data-zone-edit]', list).forEach(btn=>{
    btn.onclick = ()=>{
      const z = CURRENT_ZONES.find(x=>x.id===btn.dataset.zoneEdit);
      if(z) fillZoneForm(z);
    };
  });
  $$('[data-zone-toggle]', list).forEach(btn=>{
    btn.onclick = async ()=>{
      const id = btn.dataset.zoneToggle;
      const z = CURRENT_ZONES.find(x=>x.id===id);
      if(!z) return;
      try{
        await setDoc(doc(db,"deliveryZones", id), { active: !(z.active !== false), updatedAt: serverTimestamp() }, { merge:true });
      }catch(e){ console.error(e); toast("שגיאה","לא הצלחתי לעדכן"); }
    };
  });
  $$('[data-zone-del]', list).forEach(btn=>{
    btn.onclick = async ()=>{
      const id = btn.dataset.zoneDel;
      if(!confirm("למחוק אזור זה?")) return;
      try{ await deleteDoc(doc(db,"deliveryZones", id)); toast("נמחק ✅", "אזור הוסר"); }
      catch(e){ console.error(e); toast("שגיאה","לא הצלחתי למחוק"); }
    };
  });
}

function bindZonesLive(){
  const list = document.getElementById("zonesList");
  if(!list) return;
  if(unsubZones) unsubZones();
  const qy = query(collection(db,"deliveryZones"), orderBy("name","asc"));
  unsubZones = onSnapshot(qy, (snap)=>{
    const arr = [];
    snap.forEach(d=> arr.push({ id:d.id, ...d.data() }));
    CURRENT_ZONES = arr;
    renderZones();
  }, (err)=>{
    console.warn("zones snapshot error", err);
    list.innerHTML = `<div class="empty">שגיאה בטעינת אזורים. בדוק הרשאות Firestore.</div>`;
  });
}

async function saveZone(){
  const z = zoneForm();
  if(!z.name){ toast("חסר שם","הכנס שם אזור/שכונה"); return; }
  try{
    if(editingZoneId){
      await setDoc(doc(db,"deliveryZones", editingZoneId), {
        ...z,
        updatedAt: serverTimestamp(),
      }, { merge:true });
      toast("נשמר ✅","אזור עודכן");
    }else{
      await addDoc(collection(db,"deliveryZones"), {
        ...z,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast("נשמר ✅","אזור חדש נוסף");
      clearZoneForm();
    }
  }catch(e){ console.error(e); toast("שגיאה","לא הצלחתי לשמור אזור"); }
}

function bindTabs(){
  const tabs = $$(".tab");
  const panes = $$(".pane");

  tabs.forEach(t=>{
    t.onclick = ()=>{
      tabs.forEach(x=>x.classList.remove("on"));
      t.classList.add("on");
      const key = t.dataset.tab;
      panes.forEach(p=> p.hidden = (p.dataset.pane !== key));
    };
  });
}

function bindLock(){
  const pin = document.getElementById("pinInput");
  const btn = document.getElementById("pinBtn");
  const hint = document.getElementById("pinHint");
  const logout = document.getElementById("btnLogout");

  function tryLogin(){
    const v = (pin.value||"").trim();
    if(v === ADMIN_PIN){
      localStorage.setItem(LS_KEY, "1");
      lockUI(false);
      hint.textContent = "נכנסת ✅";
      initAfterLogin();
    }else{
      hint.textContent = "PIN לא נכון";
    }
  }

  if(btn) btn.onclick = tryLogin;
  if(pin) pin.addEventListener("keydown", (e)=>{ if(e.key==="Enter") tryLogin(); });
  if(logout) logout.onclick = doLogout;
}

async function initAfterLogin(){
  try{
    setLoading(true);
    await loadMenuOnce();
    await loadCategoriesOnce();
    await loadRestaurantSettings();
    bindBannersLive();
    bindCustomersLive();
    bindZonesLive();
    bindToppingMediaLive();
    await ensureSeedOptions();
    await ensureSeedPricingRules();
    bindOptionsManager();
    bindPricingRules();
    await refreshOptionsUI();
    await loadPricingRules();
    // update preview when select changes
    const sel = document.getElementById("prodSelect");
    const pv = document.getElementById("prodPreview");
    if(sel && pv){
      sel.onchange = ()=>{
        const it = MENU.find(x=>x.id===sel.value);
        pv.src = it?.imageUrl || "";
        pv.style.opacity = it?.imageUrl ? "1" : "0";
      };
    }

    // category preview on change
    const csel = document.getElementById("catSelect");
    const cpv = document.getElementById("catPreview");
    if(csel && cpv){
      csel.onchange = async ()=>{
        const id = csel.value;
        if(!id){ cpv.src=""; cpv.style.opacity="0"; return; }
        try{
          const snap = await getDoc(doc(db,"categories", id));
          const d = snap.exists() ? snap.data() : {};
          cpv.src = d.imageUrl || "";
          cpv.style.opacity = d.imageUrl ? "1" : "0";
          document.getElementById("catNameHe").value = d.nameHe || "";
          document.getElementById("catNameAr").value = d.nameAr || "";
        }catch(e){
          console.warn(e);
        }
      };
    }

    // visuals base images + scale
    await loadVisualsDoc();
    await refreshBasePreview();

    // i18n
    await loadCoverageI18n();
    await loadPastaSaucesI18n();
    await loadRavioliSaucesI18n();
  }finally{
    setLoading(false);
  }
}

function bindActions(){
  const addBan = document.getElementById("btnUploadBanner");
  if(addBan) addBan.onclick = handleAddBanner;

  const upProd = document.getElementById("btnUploadProductImg");
  if(upProd) upProd.onclick = handleUploadProductImage;

  const upCat = document.getElementById("btnUploadCategoryImg");
  if(upCat) upCat.onclick = handleUploadCategoryImage;

  // base images + scale
  const btnBase = document.getElementById("btnUploadBase");
  const btnScale = document.getElementById("btnSaveScale");
  const baseType = document.getElementById("baseType");
  const baseSize = document.getElementById("baseSize");
  const baseScale = document.getElementById("baseScale");
  const baseScaleVal = document.getElementById("baseScaleVal");
  if(btnBase) btnBase.onclick = handleUploadBaseImage;
  if(btnScale) btnScale.onclick = handleSaveBaseScale;
  if(baseType) baseType.onchange = async ()=>{ await loadVisualsDoc(); await refreshBasePreview(); };
  if(baseSize) baseSize.onchange = async ()=>{ await loadVisualsDoc(); await refreshBasePreview(); };
  if(baseScale && baseScaleVal) baseScale.oninput = ()=>{ baseScaleVal.textContent = Number(baseScale.value).toFixed(2); };

  // customers
  const btnSaveC = document.getElementById("btnSaveCustomer");
  const btnBlock = document.getElementById("btnToggleBlock");
  const btnDelC = document.getElementById("btnDeleteCustomer");
  if(btnSaveC) btnSaveC.onclick = saveCustomer;
  if(btnBlock) btnBlock.onclick = toggleBlockCustomer;
  if(btnDelC) btnDelC.onclick = deleteCustomer;
  const cSearch = document.getElementById("custSearch");
  if(cSearch) cSearch.oninput = ()=> renderCustomersList(cSearch.value||"");
  const cPhone = document.getElementById("cPhone");
  if(cPhone) cPhone.addEventListener("change", ()=>{
    const id = normPhoneId(cPhone.value);
    if(id.length===10){
      const c = CURRENT_CUSTOMERS.find(x=>x.id===id);
      if(c) fillCustomerForm(c);
      else { editingCustomerId = null; }
    }
  });

  // hours
  const btnHours = document.getElementById("btnSaveHours");
  if(btnHours) btnHours.onclick = saveRestaurantHours;

  // zones
  const btnZone = document.getElementById("btnSaveZone");
  const btnClearZone = document.getElementById("btnClearZone");
  if(btnZone) btnZone.onclick = saveZone;
  if(btnClearZone) btnClearZone.onclick = clearZoneForm;

  // i18n coverage
  const btnLoadCov = document.getElementById("btnLoadCoverageI18n");
  const btnSaveCov = document.getElementById("btnSaveCoverageI18n");
  if(btnLoadCov) btnLoadCov.onclick = loadCoverageI18n;
  if(btnSaveCov) btnSaveCov.onclick = saveCoverageI18n;

  // i18n sauces (shared pasta + ravioli)
  const btnLoadSauces = document.getElementById("btnLoadSaucesI18n");
  const btnSaveSauces = document.getElementById("btnSaveSaucesI18n");
  if(btnLoadSauces) btnLoadSauces.onclick = loadSaucesI18n;
  if(btnSaveSauces) btnSaveSauces.onclick = saveSaucesI18n;

  const btnUpSauceImg = document.getElementById("btnUploadSauceImg");
  if(btnUpSauceImg) btnUpSauceImg.onclick = uploadSauceImage;
}

// ------------------ I18N (Coverage) ------------------
async function loadCoverageI18n(){
  const ta = document.getElementById("i18nCoverageJson");
  const st = document.getElementById("i18nCoverageStatus");
  if(st) st.textContent = "טוען...";
  try{
    const snap = await getDoc(doc(db, "i18n", "coverage"));
    const data = snap.exists() ? (snap.data()||{}) : null;
    const defaultTpl = {
      ALL:{ he:"על הכל", ar:"على الكل", en:"Whole" },
      HALF_RIGHT:{ he:"חצי ימין", ar:"نصف يمين", en:"Right half" },
      HALF_LEFT:{ he:"חצי שמאל", ar:"نصف يسار", en:"Left half" },
      Q1:{ he:"רבע 1", ar:"ربع 1", en:"Quarter 1" },
      Q2:{ he:"רבע 2", ar:"ربع 2", en:"Quarter 2" },
      Q3:{ he:"רבע 3", ar:"ربع 3", en:"Quarter 3" },
      Q4:{ he:"רבע 4", ar:"ربع 4", en:"Quarter 4" },
    };
    const out = data && Object.keys(data).length ? data : defaultTpl;
    if(ta) ta.value = JSON.stringify(out, null, 2);
    if(st) st.textContent = "נטען";
  }catch(e){
    console.error(e);
    if(st) st.textContent = "שגיאה בטעינה";
  }
}

async function saveCoverageI18n(){
  const ta = document.getElementById("i18nCoverageJson");
  const st = document.getElementById("i18nCoverageStatus");
  if(!ta) return;
  if(st) st.textContent = "שומר...";
  try{
    const obj = JSON.parse(ta.value || "{}");
    await setDoc(doc(db, "i18n", "coverage"), obj, { merge:false });
    if(st) st.textContent = "נשמר ✅";
  }catch(e){
    console.error(e);
    if(st) st.textContent = "JSON לא תקין או שגיאה בשמירה";
  }
}


// Backward-compat: older code paths expect these helpers
async function loadPastaSaucesI18n(){
  return loadSaucesI18n();
}
async function loadRavioliSaucesI18n(){
  return loadSaucesI18n();
}

// ------------------ I18N Sauces (shared pasta + ravioli) ------------------
async function loadSaucesI18n(){
  const ta = document.getElementById("i18nSaucesJson");
  const st = document.getElementById("i18nSaucesStatus");
  if(st) st.textContent = "טוען...";
  try{
    const snap = await getDoc(doc(db, "i18n", "sauces"));
    const data = snap.exists() ? (snap.data()||{}) : null;
    const defaultTpl = {
      cream:{ he:"אלפרדו", ar:"شمنت", en:"Cream", imgPath:"sauces/cream.png" },
      rose:{ he:"רוזה", ar:"روزه", en:"Rose", imgPath:"sauces/rose.png" },
      tomato:{ he:"עגבניה", ar:"بندوره", en:"Tomato", imgPath:"sauces/tomato.png" },
    };
    const out = data && Object.keys(data).length ? data : defaultTpl;
    if(ta) ta.value = JSON.stringify(out, null, 2);
    if(st) st.textContent = snap.exists() ? "נטען" : "נוצר תבנית (חדש)";
    populateSauceImgSelect();
  }catch(e){
    if(st) st.textContent = "שגיאה: " + (e?.message||e);
  }
}

async function saveSaucesI18n(){
  const ta = document.getElementById("i18nSaucesJson");
  const st = document.getElementById("i18nSaucesStatus");
  if(st) st.textContent = "שומר...";
  try{
    const obj = JSON.parse((ta?.value||"{}").trim()||"{}");
    await setDoc(doc(db, "i18n", "sauces"), obj, { merge:false });
    if(st) st.textContent = "נשמר ✅";
    populateSauceImgSelect();
  }catch(e){
    if(st) st.textContent = "שגיאה: " + (e?.message||e);
  }
}

function populateSauceImgSelect(){
  const sel = document.getElementById("sauceImgId");
  const ta = document.getElementById("i18nSaucesJson");
  if(!sel || !ta) return;
  try{
    const obj = JSON.parse((ta.value||"{}").trim()||"{}");
    const ids = Object.keys(obj||{}).sort();
    sel.innerHTML = ids.map(id=> `<option value="${id}">${id}</option>`).join("");
  }catch(_){}
}

async function uploadSauceImage(){
  const sel = document.getElementById("sauceImgId");
  const fileEl = document.getElementById("sauceImgFile");
  const st = document.getElementById("i18nSaucesStatus");
  const ta = document.getElementById("i18nSaucesJson");
  const sauceId = sel?.value;
  const file = fileEl?.files?.[0];
  if(!sauceId){ toast("שגיאה","בחר רוטב"); return; }
  if(!file){ toast("שגיאה","בחר תמונה"); return; }

  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]+/g,"");
  const path = `sauces/${sauceId}.${ext}`;
  setLoading(true);
  try{
    const r = sRef(storage, path);
    const up = uploadBytesResumable(r, file);
    await new Promise((res, rej)=> up.on("state_changed", ()=>{}, rej, res));
    const url = await getDownloadURL(r);

    // update textarea + firestore doc
    let obj = {};
    try{ obj = JSON.parse((ta?.value||"{}").trim()||"{}"); }catch(_){}
    obj[sauceId] = obj[sauceId] || { he:"", ar:"", en:"" };
    obj[sauceId].imgPath = path;
    obj[sauceId].img = url; // convenient direct URL for client
    if(ta) ta.value = JSON.stringify(obj, null, 2);

    await setDoc(doc(db, "i18n", "sauces"), obj, { merge:false });
    if(st) st.textContent = "תמונה עודכנה ✅";
    if(fileEl) fileEl.value = "";
    toast("הועלה ✅", sauceId);
  }catch(e){
    console.error(e);
    toast("שגיאה", String(e?.message||e));
  }finally{
    setLoading(false);
  }
}

// ------------------ Topping pieces media ------------------

let TOPPING_MEDIA = new Map(); // id -> {pieces:[]}
let unsubToppingMedia = null;

function populateToppingSelect(){
  const sel = document.getElementById("topTid");
  if(!sel) return;

  // Use Firestore options (same IDs used everywhere) instead of an undefined TOPPINGS array
  const arr = (Array.isArray(OPTIONS_CACHE) ? OPTIONS_CACHE : [])
    .filter(o => o && (o.isActive !== false))
    .sort((a,b)=> (Number(a.sort ?? 999) - Number(b.sort ?? 999)));

  sel.innerHTML = arr.map(o=>{
    const ar = labelOf(o, "ar");
    const he = labelOf(o, "he");
    const kind = o.kind || "regular";
    return `<option value="${o.id}">${ar} / ${he} • ${kind} (${o.id})</option>`;
  }).join("");

  // keep selection stable if possible
  if(!sel.value && arr.length) sel.value = arr[0].id;
}

function renderToppingMedia(){
  const sel = document.getElementById("topTid");
  const list = document.getElementById("topList");
  const hint = document.getElementById("topHint");
  if(!sel || !list) return;
  const tid = sel.value;
  const data = TOPPING_MEDIA.get(tid) || {};
  const pieces = Array.isArray(data.pieces) ? data.pieces : [];
  if(hint){
    hint.textContent = pieces.length
      ? `יש ${pieces.length} תמונות לתוספת הזו.`
      : "אין עדיין תמונות לתוספת הזו. העלה 3-6 תמונות כדי שזה יראה אמיתי.";
  }
  list.innerHTML = pieces.map((url, i)=>`
    <div class="adminItem">
      <div class="adminThumb"><img src="${url}" alt=""></div>
      <div class="adminMeta">
        <div class="adminMeta__t">Piece ${i+1}</div>
        <div class="adminMeta__s">${tid}</div>
      </div>
      <div class="adminActions">
        <button class="smallBtn smallBtn--danger" data-top-del="${tid}|${i}">מחק</button>
      </div>
    </div>
  `).join("");
  list.querySelectorAll("[data-top-del]").forEach(btn=>{
    btn.onclick = async ()=>{
      const [t, idxStr] = btn.dataset.topDel.split("|");
      const idx = Number(idxStr);
      const cur = TOPPING_MEDIA.get(t) || {};
      const arr = (cur.pieces||[]).slice();
      arr.splice(idx,1);
      await setDoc(doc(db,"toppingsMedia", t), { pieces: arr, updatedAt: serverTimestamp() }, { merge: true });
      toast("נמחק ✅","תמונה הוסרה");
    };
  });
}

function bindToppingMediaLive(){
  populateToppingSelect();
  const sel = document.getElementById("topTid");
  const btn = document.getElementById("topUploadBtn");
  const btnClear = document.getElementById("topClearBtn");
  const filesEl = document.getElementById("topFiles");
  const appendEl = document.getElementById("topAppend");

  if(sel) sel.onchange = renderToppingMedia;

  if(btn){
    btn.onclick = async ()=>{
      const tid = sel?.value;
      const files = filesEl?.files ? Array.from(filesEl.files) : [];
      if(!tid){ toast("שגיאה","בחר תוספת"); return; }
      if(!files.length){ toast("שגיאה","בחר תמונות להעלות"); return; }

      const append = !!(appendEl && appendEl.checked);
      const cur = TOPPING_MEDIA.get(tid) || {};
      const existing = append ? (cur.pieces || []) : [];

      setLoading(true);
      try{
        const urls = [];
        for(const f of files){
          const safeName = `${Date.now()}_${Math.random().toString(16).slice(2)}_${f.name}`.replace(/[^\w.\-]+/g,"_");
          const path = `toppings_pieces/${tid}/${safeName}`;
          const r = sRef(storage, path);
          const up = uploadBytesResumable(r, f);
          await new Promise((res, rej)=>{
            up.on("state_changed", ()=>{}, rej, res);
          });
          const url = await getDownloadURL(r);
          urls.push(url);
        }
        const merged = existing.concat(urls);
        await setDoc(doc(db,"toppingsMedia", tid), { pieces: merged, updatedAt: serverTimestamp() }, { merge: true });
        if(filesEl) filesEl.value = "";
        toast("הועלה ✅", `${urls.length} תמונות נוספו`);
      }catch(e){
        console.error(e);
        toast("שגיאה", String(e?.message || e));
      }finally{
        setLoading(false);
      }
    };
  }

  if(btnClear){
    btnClear.onclick = async ()=>{
      const tid = sel?.value;
      if(!tid) return;
      await setDoc(doc(db,"toppingsMedia", tid), { pieces: [], updatedAt: serverTimestamp() }, { merge: true });
      toast("נוקה ✅","הוסר הכל");
    };
  }

  if(unsubToppingMedia) unsubToppingMedia();
  unsubToppingMedia = onSnapshot(collection(db,"toppingsMedia"), (snap)=>{
    const m = new Map();
    snap.forEach(d=> m.set(d.id, d.data()||{}));
    TOPPING_MEDIA = m;
    renderToppingMedia();
  });
}




// ------------------ Options Manager (names + kind) ------------------
let OPTIONS_CACHE = [];
async function loadOptions(){
  const q = query(collection(db, OPT_COL), orderBy("sort","asc"));
  const snap = await getDocs(q);
  const arr = [];
  snap.forEach(d=>{
    const v = d.data()||{};
    arr.push({ id:d.id, ...v });
  });
  OPTIONS_CACHE = arr;
  return arr;
}

function renderOptionsTable(){
  const tb = document.querySelector("#optTable tbody");
  if(!tb) return;
  tb.innerHTML = "";
  for(const o of OPTIONS_CACHE){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input class="input" data-k="id" value="${o.id}" disabled /></td>
      <td>
        <select class="input" data-k="kind">
          <option value="regular" ${o.kind==="regular"?"selected":""}>רגילה</option>
          <option value="special"  ${o.kind==="special"?"selected":""}>מיוחדת</option>
          <option value="edges"    ${o.kind==="edges"?"selected":""}>מסביב</option>
          <option value="other"    ${o.kind==="other"?"selected":""}>אחר</option>
        </select>
      </td>
      <td><input class="input" data-k="he" value="${(o.name?.he||"").replaceAll('"','&quot;')}" /></td>
      <td><input class="input" data-k="ar" value="${(o.name?.ar||"").replaceAll('"','&quot;')}" /></td>
      <td><input class="input" data-k="en" value="${(o.name?.en||"").replaceAll('"','&quot;')}" /></td>
      <td><input class="input" data-k="sort" type="number" value="${Number.isFinite(o.sort)?o.sort:999}" /></td>
      <td style="text-align:center;">
        <input type="checkbox" data-k="isActive" ${o.isActive!==false?"checked":""} />
      </td>
      <td>
        <div class="imgCell" style="display:flex; gap:10px; align-items:center;">
          <div class="adminThumb" style="width:46px; height:46px; border-radius:12px; overflow:hidden; background:rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:center;">
            ${ (o.iconUrl || o.img || o.icon) ? `<img src="${o.iconUrl || o.img || o.icon}" style="width:100%; height:100%; object-fit:cover;" />` : `<span class="muted" style="font-size:11px;">אין</span>` }
          </div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <input type="file" accept="image/*" style="display:none" data-k="iconFile" />
            <button class="btn btn--ghost" data-act="img">העלה</button>
            <button class="btn btn--ghost" data-act="imgClear">נקה</button>
          </div>
        </div>
      </td>
      <td>
        <div class="actRow">
          <button class="btn" data-act="save">שמור</button>
          <button class="btn btn--ghost" data-act="del">מחק</button>
        </div>
      </td>
    `;
    tr.querySelector('[data-act="save"]').onclick = async ()=>{
      try{
        const kind = tr.querySelector('[data-k="kind"]').value;
        const he = tr.querySelector('[data-k="he"]').value.trim();
        const ar = tr.querySelector('[data-k="ar"]').value.trim();
        const en = tr.querySelector('[data-k="en"]').value.trim();
        const sort = Number(tr.querySelector('[data-k="sort"]').value||999);
        const isActive = tr.querySelector('[data-k="isActive"]').checked;
        await setDoc(doc(db, OPT_COL, o.id), {
          kind, sort, isActive,
          name: { he, ar, en },
          updatedAt: serverTimestamp(),
        }, { merge:true });
        toast("נשמר ✅", o.id);
        await refreshOptionsUI();
      }catch(e){
        console.error(e);
        toast("שגיאה","שמירה נכשלה");
      }
    };
    tr.querySelector('[data-act="del"]').onclick = async ()=>{
      if(!confirm("למחוק את "+o.id+" ?")) return;
      try{
        await deleteDoc(doc(db, OPT_COL, o.id));
        toast("נמחק ✅", o.id);
        await refreshOptionsUI();
      }catch(e){
        console.error(e);
        toast("שגיאה","מחיקה נכשלה");
      }
    };

    // ---- icon/image upload (replaces SVG icons) ----
    const btnImg = tr.querySelector('[data-act="img"]');
    const btnImgClear = tr.querySelector('[data-act="imgClear"]');
    const fileEl = tr.querySelector('[data-k="iconFile"]');

    async function doUploadIcon(file){
      const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]+/g,'');
      const path = `toppings_icons/${o.id}.${ext}`;
      setLoading(true);
      try{
        const r = sRef(storage, path);
        const up = uploadBytesResumable(r, file);
        await new Promise((res, rej)=> up.on('state_changed', ()=>{}, rej, res));
        const url = await getDownloadURL(r);
        await setDoc(doc(db, OPT_COL, o.id), {
          iconUrl: url,
          iconPath: path,
          updatedAt: serverTimestamp(),
        }, { merge:true });
        toast('הועלה ✅', o.id);
        await refreshOptionsUI();
      }catch(e){
        console.error(e);
        toast('שגיאה', String(e?.message || e));
      }finally{
        setLoading(false);
      }
    }

    if(btnImg && fileEl){
      btnImg.onclick = ()=> fileEl.click();
      fileEl.onchange = async ()=>{
        const f = fileEl.files?.[0];
        if(!f) return;
        await doUploadIcon(f);
        fileEl.value = '';
      };
    }

    if(btnImgClear){
      btnImgClear.onclick = async ()=>{
        if(!confirm('לנקות תמונה עבור '+o.id+' ?')) return;
        await setDoc(doc(db, OPT_COL, o.id), { iconUrl: null, iconPath: null, updatedAt: serverTimestamp() }, { merge:true });
        toast('נוקה ✅', o.id);
        await refreshOptionsUI();
      };
    }

    tb.appendChild(tr);
  }
}

async function refreshOptionsUI(){
  document.getElementById("optStatus").textContent = "טוען...";
  await loadOptions();
  renderOptionsTable();

  // also fill topping-pieces select
  const sel = document.getElementById("topTid");
  if(sel){
    const prev = sel.value;
    sel.innerHTML = OPTIONS_CACHE
      .filter(o=>["regular","special","edges"].includes(o.kind))
      .map(o=> `<option value="${o.id}">${o.id} • ${labelOf(o,"ar")}</option>`)
      .join("");
    if(prev && OPTIONS_CACHE.find(x=>x.id===prev)) sel.value = prev;
  }

  document.getElementById("optStatus").textContent = `נטענו ${OPTIONS_CACHE.length}`;
}

function bindOptionsManager(){
  const addBtn = document.getElementById("optAddBtn");
  const relBtn = document.getElementById("optReloadBtn");
  if(addBtn){
    addBtn.onclick = async ()=>{
      const id = prompt("ID באנגלית בלבד (לדוגמה: corn / cheese_crust):");
      if(!id) return;
      const clean = id.trim().toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"");
      if(!clean) return;
      try{
        await setDoc(doc(db, OPT_COL, clean), {
          kind:"regular",
          sort: 999,
          isActive:true,
          name:{ he:"", ar:"", en:"" },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge:true });
        toast("נוצר ✅", clean);
        await refreshOptionsUI();
      }catch(e){
        console.error(e);
        toast("שגיאה","יצירה נכשלה");
      }
    };
  }
  if(relBtn) relBtn.onclick = refreshOptionsUI;
}

// ------------------ Pricing Rules (by size) ------------------
async function loadPricingRules(){
  const ref = doc(db, ...PR_DOC_PATH.split("/"));
  const snap = await getDoc(ref);
  const d = snap.exists() ? (snap.data()||{}) : {};
  const get = (size,key,def=0)=> Number(d?.[size]?.[key] ?? def);

  $("#pr_L_regular").value = get("L","regular",7);
  $("#pr_L_special").value = get("L","special",10);
  $("#pr_L_shrimp").value = get("L","shrimp",10);
  $("#pr_L_cheese_crust").value = get("L","cheese_crust",25);

  $("#pr_M_regular").value = get("M","regular",5);
  $("#pr_M_special").value = get("M","special",10);
  $("#pr_M_shrimp").value = get("M","shrimp",10);
  $("#pr_M_cheese_crust").value = get("M","cheese_crust",20);

  $("#pr_P_regular").value = get("P","regular",0);
  $("#pr_P_special").value = get("P","special",0);
  $("#pr_P_shrimp").value = get("P","shrimp",0);
  $("#pr_P_cheese_crust").value = get("P","cheese_crust",10);

  $("#prStatus").textContent = "נטען ✅";
}

async function savePricingRules(){
  const num = (id)=> Number((document.getElementById(id).value||"0"));
  const payload = {
    L:{ regular:num("pr_L_regular"), special:num("pr_L_special"), shrimp:num("pr_L_shrimp"), cheese_crust:num("pr_L_cheese_crust") },
    M:{ regular:num("pr_M_regular"), special:num("pr_M_special"), shrimp:num("pr_M_shrimp"), cheese_crust:num("pr_M_cheese_crust") },
    P:{ regular:num("pr_P_regular"), special:num("pr_P_special"), shrimp:num("pr_P_shrimp"), cheese_crust:num("pr_P_cheese_crust") },
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, ...PR_DOC_PATH.split("/")), payload, { merge:true });
  $("#prStatus").textContent = "נשמר ✅";
  toast("מחירים נשמרו ✅");
}

function bindPricingRules(){
  const s = document.getElementById("prSaveBtn");
  const l = document.getElementById("prLoadBtn");
  if(s) s.onclick = ()=> savePricingRules().catch(e=>{ console.error(e); toast("שגיאה","שמירת מחירים נכשלה"); });
  if(l) l.onclick = ()=> loadPricingRules().catch(e=>{ console.error(e); toast("שגיאה","טעינת מחירים נכשלה"); });
}

// ------------------ Boot ------------------
bindTabs();
bindLock();
bindActions();

if(isAuthed()){
  lockUI(false);
  initAfterLogin();
}else{
  lockUI(true);
}
