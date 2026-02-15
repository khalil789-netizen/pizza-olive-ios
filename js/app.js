

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
import { DEFAULT_PRINT_SERVER_URL, DEFAULT_PRINT_TOKEN } from "./print-config.js";

// Olive Print Server defaults (USB printing via local server)
const PRINT_SERVER_URL = window.PRINT_SERVER_URL || localStorage.getItem("olivePrintServerUrl") || DEFAULT_PRINT_SERVER_URL;
const PRINT_SERVER_TOKEN = window.PRINT_SERVER_TOKEN || localStorage.getItem("olivePrintToken") || DEFAULT_PRINT_TOKEN;



// ===============================
// USB Print Preview Modal (80mm)
// ===============================
function oliveCreatePrintPreviewModal(imgSrc) {
  // Remove any existing modal
  const existing = document.getElementById("olivePrintPreviewOverlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "olivePrintPreviewOverlay";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,0.55)";
  overlay.style.zIndex = "999999";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.padding = "12px";
  overlay.style.direction = "rtl";

  const card = document.createElement("div");
  card.style.background = "#fff";
  card.style.borderRadius = "14px";
  card.style.width = "min(520px, 96vw)";
  card.style.maxHeight = "92vh";
  card.style.overflow = "hidden";
  card.style.boxShadow = "0 12px 40px rgba(0,0,0,0.25)";
  card.style.display = "flex";
  card.style.flexDirection = "column";

  const header = document.createElement("div");
  header.style.padding = "12px 14px";
  header.style.borderBottom = "1px solid rgba(0,0,0,0.08)";
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  const title = document.createElement("div");
  title.textContent = "תצוגה לפני הדפסה (80mm)";
  title.style.fontWeight = "700";
  title.style.fontSize = "16px";
  const closeX = document.createElement("button");
  closeX.type = "button";
  closeX.textContent = "✕";
  closeX.style.border = "none";
  closeX.style.background = "transparent";
  closeX.style.fontSize = "18px";
  closeX.style.cursor = "pointer";
  closeX.style.padding = "6px 10px";
  header.appendChild(title);
  header.appendChild(closeX);

  const body = document.createElement("div");
  body.style.padding = "12px";
  body.style.overflow = "auto";
  body.style.background = "#f6f7f9";

  const imgWrap = document.createElement("div");
  imgWrap.style.display = "flex";
  imgWrap.style.justifyContent = "center";

  const img = document.createElement("img");
  img.alt = "Receipt preview";
  img.src = imgSrc;
  img.style.width = "min(420px, 90vw)"; // show large, but keep inside screen
  img.style.maxWidth = "100%";
  img.style.height = "auto";
  img.style.background = "#fff";
  img.style.borderRadius = "10px";
  img.style.boxShadow = "0 10px 25px rgba(0,0,0,0.12)";
  img.style.imageRendering = "auto";
  imgWrap.appendChild(img);

  const note = document.createElement("div");
  note.textContent = "אם משהו קטן/מטושטש כאן — גם בהדפסה זה יצא ככה. נתקן לפי זה לפני שמבזבזים נייר.";
  note.style.fontSize = "12px";
  note.style.opacity = "0.8";
  note.style.marginTop = "10px";
  note.style.textAlign = "center";

  body.appendChild(imgWrap);
  body.appendChild(note);

  const footer = document.createElement("div");
  footer.style.padding = "12px 14px";
  footer.style.borderTop = "1px solid rgba(0,0,0,0.08)";
  footer.style.display = "flex";
  footer.style.gap = "10px";
  footer.style.justifyContent = "space-between";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "ביטול";
  cancelBtn.style.flex = "1";
  cancelBtn.style.padding = "10px 12px";
  cancelBtn.style.borderRadius = "10px";
  cancelBtn.style.border = "1px solid rgba(0,0,0,0.18)";
  cancelBtn.style.background = "#fff";
  cancelBtn.style.cursor = "pointer";
  cancelBtn.style.fontWeight = "700";

  const printBtn = document.createElement("button");
  printBtn.type = "button";
  printBtn.textContent = "הדפס";
  printBtn.style.flex = "1";
  printBtn.style.padding = "10px 12px";
  printBtn.style.borderRadius = "10px";
  printBtn.style.border = "none";
  printBtn.style.background = "#16a34a";
  printBtn.style.color = "#fff";
  printBtn.style.cursor = "pointer";
  printBtn.style.fontWeight = "800";

  footer.appendChild(cancelBtn);
  footer.appendChild(printBtn);

  card.appendChild(header);
  card.appendChild(body);
  card.appendChild(footer);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const cleanup = () => {
    try { overlay.remove(); } catch(e) {}
  };

  return { overlay, closeX, cancelBtn, printBtn, cleanup };
}

function oliveCreateHtmlPrintPreviewModal(htmlDoc, titleText = "תצוגה לפני הדפסה (80mm)") {
  // Reuse the same modal skeleton but render HTML instead of an image.
  const existing = document.getElementById("olivePrintPreviewModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "olivePrintPreviewModal";
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.background = "rgba(0,0,0,0.55)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "999999";

  const card = document.createElement("div");
  card.style.width = "min(920px, 92vw)";
  card.style.maxHeight = "88vh";
  card.style.background = "#fff";
  card.style.borderRadius = "14px";
  card.style.boxShadow = "0 10px 40px rgba(0,0,0,0.25)";
  card.style.overflow = "hidden";
  card.style.display = "flex";
  card.style.flexDirection = "column";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.padding = "12px 14px";
  header.style.borderBottom = "1px solid #eaeaea";

  const title = document.createElement("div");
  title.textContent = titleText;
  title.style.fontWeight = "700";
  title.style.opacity = "0.75";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.style.border = "none";
  closeBtn.style.background = "transparent";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.fontSize = "18px";
  closeBtn.style.padding = "6px 10px";
  closeBtn.onclick = () => modal.remove();

  header.appendChild(closeBtn);
  header.appendChild(title);

  const body = document.createElement("div");
  body.style.padding = "14px";
  body.style.overflow = "auto";
  body.style.flex = "1";

  // Preview frame: fixed 80mm-like column centered
  const frameWrap = document.createElement("div");
  frameWrap.style.display = "flex";
  frameWrap.style.justifyContent = "center";

  const iframe = document.createElement("iframe");
  iframe.style.width = "330px"; // close to 80mm on-screen
  iframe.style.border = "1px solid #eee";
  iframe.style.borderRadius = "10px";
  iframe.style.background = "#fff";
  iframe.style.height = "72vh";
  iframe.setAttribute("sandbox", "allow-same-origin allow-scripts");
  iframe.srcdoc = htmlDoc;

  frameWrap.appendChild(iframe);
  body.appendChild(frameWrap);

  const footer = document.createElement("div");
  footer.style.display = "flex";
  footer.style.gap = "10px";
  footer.style.padding = "14px";
  footer.style.borderTop = "1px solid #eaeaea";

  const btnPrint = document.createElement("button");
  btnPrint.id = "olivePrintConfirmBtn";
  btnPrint.textContent = "הדפס";
  btnPrint.style.flex = "1";
  btnPrint.style.background = "#16a34a";
  btnPrint.style.color = "#fff";
  btnPrint.style.border = "none";
  btnPrint.style.borderRadius = "10px";
  btnPrint.style.padding = "12px 14px";
  btnPrint.style.fontWeight = "700";
  btnPrint.style.cursor = "pointer";

  const btnCancel = document.createElement("button");
  btnCancel.id = "olivePrintCancelBtn";
  btnCancel.textContent = "ביטול";
  btnCancel.style.flex = "1";
  btnCancel.style.background = "#fff";
  btnCancel.style.color = "#111";
  btnCancel.style.border = "1px solid #ddd";
  btnCancel.style.borderRadius = "10px";
  btnCancel.style.padding = "12px 14px";
  btnCancel.style.fontWeight = "700";
  btnCancel.style.cursor = "pointer";
  btnCancel.onclick = () => modal.remove();

  footer.appendChild(btnPrint);
  footer.appendChild(btnCancel);

  card.appendChild(header);
  card.appendChild(body);
  card.appendChild(footer);
  modal.appendChild(card);
  document.body.appendChild(modal);

  return { modal, iframe };
}


function oliveShowPrintPreview(imgSrc) {
  return new Promise((resolve) => {
    const ui = oliveCreatePrintPreviewModal(imgSrc);

    const close = (val) => {
      ui.cleanup();
      resolve(val);
    };

    ui.cancelBtn.addEventListener("click", () => close(false));
    ui.closeX.addEventListener("click", () => close(false));

    // click outside card closes
    ui.overlay.addEventListener("click", (e) => {
      if (e.target === ui.overlay) close(false);
    });

    ui.printBtn.addEventListener("click", () => close(true));

    // ESC to close (desktop)
    const onKey = (e) => {
      if (e.key === "Escape") close(false);
    };
    document.addEventListener("keydown", onKey, { once: true });
  });
}
// ===============================

// --- iPad/iOS: יציבות גובה המסך (מונע קפיצות של שורת הכתובת) ---
(function setAppHeightInit(){
  const setAppHeight = () => {
    document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px');
  };
  window.addEventListener('resize', setAppHeight, { passive: true });
  window.addEventListener('orientationchange', setAppHeight, { passive: true });
  setAppHeight();
})();
// ---------------------------

// --- iPad Add to Home Screen: מניעת rubber-band שגורם לרקע "לזוז" ---
(function lockStandaloneScroll(){
  const isStandalone = (window.navigator.standalone === true) ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);

  // גם אם לא standalone, אפשר להשאיר — אבל נפעיל בעיקר ב-A2HS.
  if (!isStandalone) return;

  // מסמן אלמנטים פנימיים שמותר להם לגלול
  const allowSelectors = [
    '.menu-items',
    '.orders-open',
    '.order-items',
    '.order-details-items-wrapper',
    '.admin-tab-panel',
    '.toppings-panel',
    '.order-edit-items'
  ];
  allowSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.setAttribute('data-scroll', '1'));
  });

  // מונע גלילה על ה-body (רקע) אבל מאפשר גלילה בתוך אזורים מורשים
  const shouldAllowScroll = (target) => {
    if (!target) return false;
    // מאפשר אינפוטים/טקסט כדי לא לשבור כתיבה
    const tag = target.tagName ? target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    return !!target.closest('[data-scroll="1"]');
  };

  document.addEventListener('touchmove', (e) => {
    if (!shouldAllowScroll(e.target)) {
      e.preventDefault();
    }
  }, { passive: false });

  // גם על wheel (אייפד עם עכבר/טראקפד)
  document.addEventListener('wheel', (e) => {
    if (!shouldAllowScroll(e.target)) {
      e.preventDefault();
    }
  }, { passive: false });
})();
// ---------------------------------------------------------------
// -----------------------------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// escapeHtml: var so redeclaration will not crash if app.js is injected twice
var escapeHtml = (globalThis && globalThis.escapeHtml) ? globalThis.escapeHtml : function(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\'/g, "&#039;");
};
try{ if(globalThis) globalThis.escapeHtml = escapeHtml; }catch(e){}

function normalizePrintFreeDrinkText(value) {
  const s = (value || "").toString().trim();
  if (!s) return "";
  // Handle legacy stored values like:
  // "مشروب 1.5 مجاني: كولا" / "مشروب - مجاني: سبرايت" / "مشروب مجاني: ..."
  return s
    .replace(/^\s*مشروب\s*(?:[-–—]\s*)?(?:1\.?5\s*)?(?:مجاني\s*)?[:：\-–—]?\s*/i, "")
    .replace(/^\s*مجاني\s*[:：\-–—]?\s*/i, "")
    .trim();
}



// --- Settings ---
const SUPER_ADMIN_PIN = "0546847651"; // מנהל ראשי (בעלים)

// שמות קטגוריות בערבית לתצוגה
const CATEGORY_LABELS_AR = {
  pizza: "بيتسا",
  sfiha: "سفيحه",
  pastry: "معجنات",
  pasta: "بستا رافيولي",
  BTATA: "بطاطا",
  salad: "سلطه",
  dessert: "حلويات",
  drink: "مشروبات",
  other: "متنوع"
};
const CATEGORY_ORDER = [
  "pizza",
  "sfiha",
  "pastry",
  "pasta",
  "BTATA",
  "salad",
  "dessert",
  "drink",
  "other"
];

// סדר תצוגת קטגוריות לפי שם בערבית
const CATEGORY_DISPLAY_ORDER = [
  "بيتسا",
  "سفيحه",
  "معجنات",
  "بستا رافيولي",
  "بطاطا",
  "سلطه",
  "حلويات",
  "مشروبات",
  "متنوع"
];

const REGULAR_TOPPINGS = [
  { id: "green_olives", label: "زتون اخضر", kind: "regular" },
  { id: "black_olives", label: "زتون اسمر", kind: "regular" },
  { id: "corn", label: "تيرس", kind: "regular" },
  { id: "mushrooms", label: "بتريوت", kind: "regular" },
  { id: "tuna", label: "طونه", kind: "regular" },
  { id: "bulgarit", label: "بلجريت", kind: "regular" },
  { id: "tomato", label: "بندورة", kind: "regular" },
  { id: "hot_pepper", label: "فلفل حار", kind: "regular" },
  { id: "onion", label: "بصل", kind: "regular" },
  { id: "bell_pepper", label: "جمبا", kind: "regular" },
  { id: "sesame", label: "سمسم", kind: "free" },
  { id: "cheese_little", label: "شوي جبنه", kind: "free" },
  { id: "cheese_more", label: "كتر جبنه", kind: "free" },
];


const SPECIAL_TOPPINGS = [
  { id: "egg", label: "بيضة", kind: "special" },
  { id: "egg_no_yolk", label: "بيضه بلا صفار", kind: "special" },
  { id: "egg_no_white", label: "بيضه بلا بياض", kind: "special" },
  { id: "pepperoni", label: "ببروني", kind: "special" },
  { id: "anchovy", label: "انشوبي", kind: "special" },
  { id: "pineapple", label: "أناناس", kind: "special" },
  { id: "extra_cheese", label: "جبنة إضافية", kind: "special" }
];

// שרימפס נחשב תוספת מיוחדת מבחינת מבנה, אבל עם מחיר אחר
const SHRIMP_TOPPING = { id: "shrimp", label: "شرمبس", kind: "shrimp" };

// תוספת طراف جبنه (כמו שרימפס במחיר)
const TARAF_CHEESE_TOPPING = { id: "taraf_cheese", label: "طراف جبنه", kind: "shrimp" };

// אקסטרה ביצה (למלווח الملفوف / זيفا / سمبوسك)
const EXTRA_EGG_TOPPING = { id: "extra_egg", label: "زياده بيضه", kind: "extraEgg" };

// אפשרויות הסרה למלווח الملفوف (ברירת מחדל: طحينه + رسك + بيضه عجنب)
const MALAWACH_ROLLED_REMOVE_OPTIONS = [
  { id: "no_tahina", label: "بلا طحينه", kind: "remove" },
  { id: "no_rusk", label: "بلا رسك", kind: "remove" },
  { id: "no_egg", label: "بلا بيضه", kind: "remove" }
];


// מלווח مفتوح كلو عجنب (במלווח الملفوف במקום سمسم)
const MALAWACH_OPEN_SIDE_TOPPING = { id: "malawach_open_side", label: "ملوح مفتوح كلو عجنب", kind: "freeOption" };

// תוספות "روطف" חינם רק לראفيولي – בתחילת התוספות הרגילות
const RAVIOLI_ROTOF_FREE_TOPPINGS = [
  { id: "rotov_light", label: "شوي روطف", kind: "free" },
  { id: "rotov_more", label: "كتير روطف", kind: "free" },
];



// prices for pizza toppings by size
const REGULAR_TOPPING_PRICES = {
  large: 7,      // תוספת רגילה על כל הפיצה – גדולה
  family: 5,     // תוספת רגילה על כל הפיצה – משפחתית
  personal: 0    // רגילות בחינם בפיצה אישית
};

const SPECIAL_TOPPING_PRICE = {
  large: 10,   // بيتزا كبير / גדול
  family: 10,  // بيتزا وسط / בינוני
  personal: 3
}

;

const SHRIMP_TOPPING_PRICE = {
  large: 25,
  family: 20,
  personal: 10
};

// רשימת משקאות 1.5L חינם לפיצה גדולה
const FREE_DRINK_OPTIONS = [
  "كولا",
  "كولا زيرو",
  "عنب",
  "توت بنانا",
  "سبرايت",
  "سبرايت دايت",
  "فنتا",
  "نستي",
  "ماء"
];

function isItemEligibleForFreeDrink(item) {
  if (!item) return false;
  const category = item.category;
  const size = (item.size || "").trim();
  const name = (item.nameAr || "").toString();
  // free drink: large pizza or large sfiha ("كبير")
  if (category !== "pizza" && category !== "sfiha") return false;
  return size === "كبير" || name.includes("كبير");
}

function isPizzaLikeItem(item) {
  if (!item) return false;
  if (item.category === "pizza" || item.category === "sfiha") return true;
  const name = (item.nameAr || "").toString();
  const lowered = name.toLowerCase();
  // מאפשר גם לפיצה אישית, מלווח פיצה, זיבה/זيفا וسمبوسك להשתמש בלוגיקת התוספות
  return (
    lowered.includes("פיצה") ||
    lowered.includes("بيتزا") ||
    lowered.includes("بيتسا") ||
    lowered.includes("מלווח פיצה") ||
lowered.includes("ספינת בשר") ||
lowered.includes("ספינת אוליב") ||
lowered.includes("מאפה אוליב") ||
lowered.includes("מגוגל זעתר") ||
    lowered.includes("ملوح بيتسا") ||
    lowered.includes("ملوخ بيتسا") ||
    lowered.includes("الملوح الملفوف") ||
    lowered.includes("ملوح ملفوف") ||
    lowered.includes("ملوخ ملفوف") ||
    lowered.includes("מלווח ملفוף") ||
    lowered.includes("מלווח מגולגל") ||
    lowered.includes("זيفا") ||
    lowered.includes("זיווה") ||
    lowered.includes("זיבה") ||
    lowered.includes("زيفا") ||
    lowered.includes("זיבא") ||
    lowered.includes("سمبوسك") ||
    lowered.includes("סמבוסك") ||
    lowered.includes("סמבוסק")
  );
}


function isSixSliceMediumPizza(item) {
  if (!item) return false;
  // אצלנו "وسط" = בינוני (6 חתיכות) לפיצה ולספיحة
  const size = (item.size || "").toString().trim();
  const name = (item.nameAr || "").toString();
  return (item.category === "pizza" || item.category === "sfiha") && (size === "وسط" || name.includes("وسط"));
}

function applyPizzaZoneModeForItem(item) {
  if (!pizzaCircleEl) return;
  const isSix = isSixSliceMediumPizza(item);
  pizzaCircleEl.classList.toggle("mode-six", !!isSix);
}

function isZivaOrSambusak(item) {
  if (!item) return false;
  const nameAr = (item.nameAr || "").toString().toLowerCase();
  const nameHe = (item.nameHe || "").toString().toLowerCase();
  const needles = [
    "زيفا",
    "זيفا",
    "זיווה",
    "זיבה",
    "זיבא",
    "سمبوسك",
    "סמבוסك",
    "סמבוסק"
  ];
  return needles.some((n) => nameAr.includes(n) || nameHe.includes(n));
}


function isMalawachRolled(item) {
  if (!item) return false;
  const nameAr = (item.nameAr || "").toString().toLowerCase();
  const nameHe = (item.nameHe || "").toString().toLowerCase();
  const needles = [
    "الملوح الملفوف",
    "ملوح ملفوف",
    "ملوخ ملفوف",
    "מלווח ملفוף",
    "מלווח מגולגל",
    "מלווח رول",
    "מלווח גלגול"
  ];
  return needles.some((n) => nameAr.includes(n) || nameHe.includes(n));
}

function isFreeRegularToppingsItem(item) {
  // במלווח الملفوف + זيفا/سمبوسك תוספות רגילות בחינם
  return isZivaOrSambusak(item) || isMalawachRolled(item);
}

function isFreeSpecialToppingForItem(item, topping) {
  if (!item || !topping) return false;

  // כלל קיים: תוספות מיוחדות חינם בפיצה אישית / מלווח פיצה (לפי פונקציה קיימת)
  if (isFreeSpecialToppingsItem(item)) return true;

  // במלווח الملفوف + זيفا/سمبوسك — וריאציות ביצה בחינם
  const isEggVariant =
    topping.id === "egg" ||
    topping.id === "egg_no_yolk" ||
    topping.id === "egg_no_white";

  if (isEggVariant && (isZivaOrSambusak(item) || isMalawachRolled(item))) {
    return true;
  }

  return false;
}


function isBatataItem(item) {
  if (!item) return false;
  // בדיקה לפי קטגוריה (גם וריאציות בטעות כתיב)
  if (
    item.category === "BTATA" ||
    item.category === "btata" ||
    item.category === "Batata" ||
    item.category === "batata"
  ) {
    return true;
  }
  // בדיקה לפי שם בערבית/עברית
  const nameAr = (item.nameAr || "").toString();
  const nameHe = (item.nameHe || "").toString();
  if (
    nameAr.includes("بطاطا") ||
    nameAr.includes("بططا") ||
    nameHe.includes("בטטה") ||
    nameHe.includes("תפוח אדמה")
  ) {
    return true;
  }
  return false;
}


// Should we print an extra small kitchen ticket?
function orderNeedsKitchenTicket(docData) {
  const items = (docData && Array.isArray(docData.items)) ? docData.items : [];
  return items.some((it) => {
    if (!it) return false;

    const cat = (it.category || "").toString().trim().toLowerCase();
    if (cat === "btata" || cat === "salad" || cat === "pasta") return true;

    // Backward compatibility / safety: detect by Arabic text in the item name as well
    const nameAr = (it.nameAr || "").toString();
    return (
      nameAr.includes("بطاطا") ||
      nameAr.includes("سلطه") ||
      nameAr.includes("سلطة") ||
      nameAr.includes("بستا") ||
      nameAr.includes("رافيولي")
    );
  });
}

// --- Kitchen ticket helpers (BTATA / Pasta&Ravioli / Salads) ---
function sanitizePrintText(v) {
  if (v == null) return "";
  let s = String(v);

  // Decode common HTML entities and normalize whitespace
  s = s.replace(/&nbsp;/gi, " ");
  s = s.replace(/&amp;/gi, "&");
  s = s.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");

  // Normalize breaks to newlines
  s = s.replace(/<br\s*\/?>/gi, "\n");

  // Remove any HTML tags
  s = s.replace(/<\/?[^>]+>/g, " ");

  // Remove common leftovers when '<' and '>' were stripped earlier
  s = s.replace(/\bspan\s+class\s*=\s*["'][^"']*["']/gi, " ");
  s = s.replace(/\bclass\s*=\s*["'][^"']*["']/gi, " ");
  s = s.replace(/\border-chip\b/gi, " ");
  s = s.replace(/\border-chip-[a-z-]+\b/gi, " ");
  s = s.replace(/\bchip\s+order-chip\b/gi, " ");
  s = s.replace(/[<>]/g, " ");

  // Cleanup whitespace
  s = s.replace(/\r/g, "");
  s = s.replace(/[ \t]+/g, " ");
  s = s.replace(/\n[ \t]+/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}


function extractLabels(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => {
      if (x == null) return "";
      if (typeof x === "string") return x;
      if (typeof x === "number") return String(x);
      if (typeof x === "object") {
        return (x.label || x.nameAr || x.nameHe || x.name || "").toString();
      }
      return String(x);
    })
    .map((s) => sanitizePrintText((s || "").toString()))
    .map((s) => (s || "").toString().trim())
    .filter(Boolean);
}


function getKitchenItems(docData) {
  const items = docData && Array.isArray(docData.items) ? docData.items : [];
  return items.filter((it) => {
    if (!it) return false;

    const cat = (it.category || "").toString().trim().toLowerCase();
    if (cat === "btata" || cat === "salad" || cat === "pasta") return true;

    const nameAr = (it.nameAr || "").toString();
    return (
      nameAr.includes("بطاطا") ||
      nameAr.includes("بططا") ||
      nameAr.includes("سلطه") ||
      nameAr.includes("سلطة") ||
      nameAr.includes("بستا") ||
      nameAr.includes("رافيولي")
    );
  });
}


function getI18nLabel(mapObj, id, lang){
  if(!mapObj || !id) return null;
  const rec = mapObj[id] || mapObj[String(id)] || null;
  if(!rec) return null;
  const v = rec[lang] || rec[String(lang)] || rec.ar || rec.he || rec.en || null;
  return v ? String(v) : null;
}

function resolveSauceLabelForItem(it, lang){
  const sauceId = it && (it.pastaSauceId || it.ravioliSauceId || it.sauceId || it.pastaSauceID || it.pasta_sauce_id);
  if(!sauceId) return it && it.pastaSauce ? String(it.pastaSauce) : null;
  const cat = (it.category || "").toString().trim().toLowerCase();
  const nameAr = (it.nameAr || "").toString();
  const isRavioli = cat === "ravioli" || nameAr.includes("رافيولي");
  const mapObj = isRavioli ? RAVIOLI_SAUCES_I18N : PASTA_SAUCES_I18N;
  const lbl = getI18nLabel(mapObj, String(sauceId), lang);
  return lbl || (it && it.pastaSauce ? String(it.pastaSauce) : String(sauceId));
}

function buildKitchenItemDetailsLines(it) {
  const cat = (it.category || "").toString().trim().toLowerCase();
  const nameAr = (it.nameAr || "").toString();

  const isPasta = cat === "pasta" || nameAr.includes("بستا") || nameAr.includes("رافيولي");
  const isSalad = cat === "salad" || nameAr.includes("سلطه") || nameAr.includes("سلطة");
  const isBtata = cat === "btata" || nameAr.includes("بطاطا") || nameAr.includes("بططا");

  const lines = [];

  if (isPasta) {
    {
      const sauceLbl = resolveSauceLabelForItem(it, 'ar');
      if (sauceLbl) lines.push(`صوص: ${sanitizePrintText(sauceLbl)}`);
    }
    const free = extractLabels(it.pastaFreeToppings);
    if (free.length) lines.push(`إضافات عادية: ${free.join("، ")}`);
    const paidArr = Array.isArray(it.pastaPaidToppings) ? it.pastaPaidToppings : [];
    const paidNoCream = paidArr.filter((t) => {
      if (!t) return false;
      if (typeof t === "string") return !t.includes("مكرام");
      if (typeof t === "object") return !(
        t.id === "pasta_extra_cream" || (t.label && String(t.label).includes("مكرام"))
      );
      return true;
    });
    const paid = extractLabels(paidNoCream);
    if (paid.length) lines.push(`إضافات مدفوعة: ${paid.join("، ")}`);
  } else if (isSalad) {
    const removed = extractLabels(it.saladRemoved);
    if (removed.length) lines.push(`بلا: ${removed.join("، ")}`);
    const paid = extractLabels(it.saladPaidToppings);
    if (paid.length) lines.push(`إضافات مدفوعة: ${paid.join("، ")}`);
  } else if (isBtata) {
    const removed = extractLabels(it.batataRemoved);
    if (removed.length) lines.push(`بلا: ${removed.join("، ")}`);
    const paid = extractLabels(it.batataPaidToppings);
    if (paid.length) lines.push(`إضافات خاصة: ${paid.join("، ")}`);
  }

  // Fallback to existing notes (strip any HTML / chips artifacts)
  if (!lines.length && typeof it.notes === "string" && it.notes.trim()) {
    const s = sanitizePrintText(it.notes);
    if (s) {
      s.split(/\n+/)
        .map((x) => x.trim())
        .filter(Boolean)
        .forEach((x) => lines.push(x));
    }
  }



  if (it.extraNote && typeof it.extraNote === "string" && it.extraNote.trim()) {
    lines.push(`ملاحظة: ${sanitizePrintText(it.extraNote)}`);
  }

  // Avoid duplicate printing for pasta/salad/btata: these items already have structured sauce/toppings lines.
  if (it.extrasText && typeof it.extrasText === "string" && it.extrasText.trim()) {
    if (!(isPasta || isSalad || isBtata)) {
      const t = sanitizePrintText(it.extrasText);
      if (!lines.some((l) => l.includes(t))) lines.push(t);
    }
  }

  return lines;
}



function buildKitchenTicketHtml(orderId, docData) {
  const code = (docData && (docData.orderCode || docData.code))
    ? (docData.orderCode || docData.code)
    : (orderId || "");
  const type = (docData && (docData.serviceType || docData.customerType))
    ? (docData.serviceType || docData.customerType)
    : "";

  const items = getKitchenItems(docData);

  const itemsHtml = items
    .map((it, idx) => {
      const qty = it && it.qty != null ? Number(it.qty) : 1;
      const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;

      const rawName = (it && (it.nameAr || it.nameHe || it.name)) ? (it.nameAr || it.nameHe || it.name) : "";
      let displayName = String(rawName || "");
      const catName = (it && it.category != null) ? String(it.category) : "";
      const cat2 = catName.toString().trim().toLowerCase();
      const nameAr2 = (it && it.nameAr != null) ? String(it.nameAr) : "";
      const isPasta2 = cat2 === "pasta" || nameAr2.includes("بستا") || nameAr2.includes("رافيولي");
      if (isPasta2) {
        const paidArrPrint = Array.isArray(it.pastaPaidToppings) ? it.pastaPaidToppings : [];
        let hasCream = paidArrPrint.some((t) => {
          if (!t) return false;
          if (typeof t === "string") return t.includes("مكرام");
          if (typeof t === "object") return (t.id === "pasta_extra_cream" || (t.label && String(t.label).includes("مكرام")));
          return false;
        });
        if (!hasCream) {
          const n = typeof it.notes === "string" ? it.notes : "";
          if (n.includes("مكرام") && !n.includes("لو مكرام")) hasCream = true;
        }
        displayName = displayName.replace(/\s*\((مكرام|لو مكرام)\)\s*$/, "").trim();
        displayName = `${displayName} (${hasCream ? "مكرام" : "لو مكرام"})`;
      }
      const lines = buildKitchenItemDetailsLines(it);

      const detailsHtml = lines.length
        ? `<div class="k-details">${lines
            .map((l) => `<div class="k-det-line">${escapeHtml(l)}</div>`)
            .join("")}</div>`
        : ``;

      return `
        <div class="k-item">
          <div class="k-item-head">
            <span class="k-qty">${safeQty > 1 ? escapeHtml(String(safeQty)) + "x" : ""}</span>
            <span class="k-name">${escapeHtml(String(displayName))}</span>
          </div>
          ${detailsHtml}
        </div>
      `;
    })
    .join(`<div class="k-item-sep"></div>`);

  
  const printedAtText = (() => {
    const t = formatTimestamp((docData && (docData.createdAt || docData.timestamp)) || Date.now());
    return t || new Date().toLocaleString('he-IL');
  })();


  const printedTimeText = (() => {
    // Extract HH:MM from formatted timestamp, and fallback to raw timestamp when needed
    if (printedAtText && typeof printedAtText === "string") {
      const m = printedAtText.match(/(\d{1,2}:\d{2})/);
      if (m) return m[1];
    }
    const raw = (docData && (docData.createdAt || docData.timestamp)) || Date.now();
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    }
    return "";
  })();
  const printedTimeHtml = printedTimeText ? `<div class="k-time-under">${escapeHtml(printedTimeText)}</div>` : "";
return `
  <html dir="rtl" lang="he">
  <head>
    <meta charset="UTF-8" />
    <title>Kitchen Ticket</title>
    <style>
      @page { size: 80mm auto; margin: 0; }
      html, body{
        width: 72mm;
        margin: 0;
        padding: 0;
        font-family: Arial, "Noto Sans Arabic", "Noto Sans Hebrew", sans-serif;
        color:#000;
              font-size: 16px;
        font-weight: 800;
}
      .wrap{ padding: 6mm 2mm; }
      .k-title{ text-align:center; font-weight:900; font-size: 22px; }
      .k-sub{ text-align:center; font-weight:800; font-size: 15px; margin-top: 2px; }
      .k-line{ border-top: 2px solid #000; margin: 6px 0; }
      .k-code{ text-align:center; font-weight:900; font-size: 48px; letter-spacing: 1px; }
            .k-time-under{ text-align:center; font-size: 16px; font-weight:900; margin-top:-4px; }
.k-time{ text-align:center; font-size: 13px; margin-top: 4px;  font-weight:800; }

      .k-items{ margin-top: 8px; }
      .k-item{ padding: 4px 0; }
      .k-item-head{ font-size: 20px; font-weight: 900; line-height: 1.2; display:flex; gap: 6px; align-items: baseline; }
      .k-qty{ min-width: 18mm; display:inline-block; }
      .k-name{ flex: 1; word-break: break-word; }
      .k-item-sep{ border-top: 1px dashed #000; margin: 4px 0; }

      .k-details{ margin-top: 2px; padding-right: 2mm; }
      .k-det-line{ font-size: 16px; font-weight: 800; line-height: 1.25; margin: 1px 0; word-break: break-word; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="k-title">מטבח / مطبخ</div>
      ${type ? `<div class="k-sub">${escapeHtml(type)}</div>` : ``}
      <div class="k-line"></div>
      <div class="k-code">${escapeHtml(code)}</div>
            ${printedTimeHtml}
<div class="k-line"></div>

      ${itemsHtml ? `<div class="k-items">${itemsHtml}</div>` : ``}

      <div class="k-line"></div>
      <div class="k-time">${escapeHtml(printedAtText)}</div>
    </div>
  </body>
  </html>
  `;
}

function isFullOnlyToppingsItem(item) {
  if (!item) return false;
  const name = (item.nameAr || "").toString();
  const lowered = name.toLowerCase();
  // פריטים כמו זיבה/זيفا וسمבוסك – תוספות רק על כל המוצר בלי חצאים ורבעים
  return (
    isMalawachRolled(item) ||
    lowered.includes("זيفا") ||
    lowered.includes("זיווה") ||
    lowered.includes("זיבה") ||
    lowered.includes("زيفا") ||
    lowered.includes("זיבא") ||
    lowered.includes("سمبوسك") ||
    lowered.includes("סמבוסك") ||
    lowered.includes("סמבוסק")
  );
}

function isFreeSpecialToppingsItem(item) {
  if (!item) return false;
  const name = (item.nameAr || "").toString().toLowerCase();

  // תוספות מיוחדות חינם רק בפיצה אישית / מלווח פיצה
  return (
    name.includes("بيتسا صغير") ||  // بيتسا קטן
    name.includes("بيتزا صغير") ||
    name.includes("פיצה אישית") ||
    name.includes("פיצה קטנה") ||
    name.includes("מלווח פיצה") ||
    name.includes("מלאוח פיצה") ||
    name.includes("ملوح بيتسا") ||
    name.includes("ملوخ بيتسا")
  );
}



function getPizzaSizeKeyForItem(item) {
  // נשתמש במחיר הבסיס כדי לנחש את הגודל
  const base = item.basePrice != null ? item.basePrice : item.price || 0;
  if (base >= 70) return "large";   // ענקית 73
  if (base >= 50) return "family";  // משפחתית 60
  return "personal";                // אישית 35
}

// Coverage normalization
// Incoming customer orders may carry coverageId (ALL/HALF_LEFT/HALF_RIGHT/Q1..Q4)
// plus (optionally) legacy coverage keys (all/half_left/q_right_top...).
function normalizeCoverageKey(t){
  const raw = (t && (t.coverage ?? t.cover ?? t.area ?? t.zone)) ?? t;
  if(!raw) return "all";
  const s = String(raw);

  // coverageId -> legacy
  if(s === "ALL") return "all";
  if(s === "HALF_LEFT") return "half_left";
  if(s === "HALF_RIGHT") return "half_right";
  if(s === "Q1") return "q_right_top";
  if(s === "Q2") return "q_right_bottom";
  if(s === "Q3") return "q_left_top";
  if(s === "Q4") return "q_left_bottom";
if(s === "T1") return "third-1";
  if(s === "T2") return "third-2";
  if(s === "T3") return "third-3";

  // convert hyphen variants to underscore variants used across the app
  if(s === "half-left") return "half_left";
  if(s === "half-right") return "half_right";
  if(s === "quarter-right-top" || s === "quarter_right_top") return "q_right_top";
  if(s === "quarter-right-bottom" || s === "quarter_right_bottom") return "q_right_bottom";
  if(s === "quarter-left-top" || s === "quarter_left_top") return "q_left_top";
  if(s === "quarter-left-bottom" || s === "quarter_left_bottom") return "q_left_bottom";

  if(s === "third_1") return "third-1";
  if(s === "third_2") return "third-2";
  if(s === "third_3") return "third-3";

  return s;
}

function getCoverageFactor(coverage) {
  // factor מתוך מחיר "على الكل" לפי האזור שנבחר
  const c = normalizeCoverageKey(coverage);
  if (!c || c === "full" || c === "all") return 1;

  if (c === "half-left" || c === "half-right" || c === "half_left" || c === "half_right") return 0.5;

  // שלישים (בינוני – 6 חתיכות)
  if (c === "third-1" || c === "third-2" || c === "third-3") return 1 / 3;

  // רבעים – גם החדשים (ימין/שמאל, עליון/תחתון) וגם הישנים
  if (
    c === "quarter-right-top" ||
    c === "quarter-right-bottom" ||
    c === "quarter-left-top" ||
    c === "quarter-left-bottom" ||
    c === "quarter-left" ||
    c === "quarter-right" ||
    c === "q_right_top" ||
    c === "q_right_bottom" ||
    c === "q_left_top" ||
    c === "q_left_bottom"
  ) {
    return 0.25;
  }

  return 1;
}

// חישוב מחיר לתוספות לפי לוגיקה פשוטה:
// מחיר תוספת מלאה × חלק הפיצה (¼ / ½ / מלאה)
// לדוגמה: תוספת 8 ש"ח על רבע → 2 ש"ח.
// בסفيخة עגבניה ופלפל חריף בחינם בכל כיסוי.
function recalcPizzaPriceWithToppings(item) {
  if (!isPizzaLikeItem(item)) {
    return;
  }
  const sizeKey = getPizzaSizeKeyForItem(item);
  const toppings = Array.isArray(item.toppings) ? item.toppings : [];
  const isSfiha = item.category === "sfiha";

  let extraTotal = 0;

  for (const t of toppings) {
    const kind = t.kind || inferKindById(t.id);
    // בסفيخة עגבניה + פלפל חריף בחינם
    if (
      isSfiha &&
      kind === "regular" &&
      (t.id === "tomato" || t.id === "hot_pepper")
    ) {
      continue;
    }

    let baseFull = 0;
    if (kind === "regular") {
      baseFull = isFreeRegularToppingsItem(item)
        ? 0
        : (priceFromRules(sizeKey, t.id, kind) ?? (REGULAR_TOPPING_PRICES[sizeKey] || 0));
    } else if (kind === "special") {
      baseFull = isFreeSpecialToppingForItem(item, t)
        ? 0
        : (priceFromRules(sizeKey, t.id, kind) ?? (SPECIAL_TOPPING_PRICE[sizeKey] || 0));
    } else if (t.kind === "extraEgg") {
      // אקסטרה ביצה תמיד 5₪
      baseFull = 5;
    } else if (t.kind === "shrimp") {
      // שרימפס תמיד בתשלום
      baseFull = (priceFromRules(sizeKey, t.id, kind) ?? (SHRIMP_TOPPING_PRICE[sizeKey] || 0));
    } else {
      // kind free/remove וכו'
      baseFull = 0;
    }

    // פריטים כמו זיבה/סמבוסק – תוספות תמיד על כל המוצר
    const factor = isFullOnlyToppingsItem(item)
      ? 1
      : getCoverageFactor(t.coverageId || t.coverage);

    extraTotal += baseFull * factor;
  }

  const basePrice = item.basePrice != null ? item.basePrice : item.price || 0;
  item.price = basePrice + extraTotal;

  // נבנה טקסט לתצוגה ולהדפסה
  item.notes = buildToppingsNotes(item);
}

function buildToppingsNotes(item) {
  const toppings = Array.isArray(item.toppings) ? item.toppings : [];
  if (!toppings.length) return null;

  const removed = [];

  const full = [];
  const halfRight = [];
  const halfLeft = [];
  const third1 = [];
  const third2 = [];
  const third3 = [];
  const qRightTop = [];
  const qLeftTop = [];
  const qRightBottom = [];
  const qLeftBottom = [];

  for (const t of toppings) {
    if (t.kind === "remove") {
      removed.push(t.label);
      continue;
    }
    const cov = normalizeCoverageKey(t.coverageId || t.coverage);
    switch (cov) {
      case "full":
      case "all":
        full.push(t.label);
        break;
      case "half-right":
      case "half_right":
        halfRight.push(t.label);
        break;
      case "half-left":
      case "half_left":
        halfLeft.push(t.label);
        break;
      case "third-1":
        third1.push(t.label);
        break;
      case "third-2":
        third2.push(t.label);
        break;
      case "third-3":
        third3.push(t.label);
        break;
      case "quarter-right-top":
      case "q_right_top":
        qRightTop.push(t.label);
        break;
      case "quarter-left-top":
      case "q_left_top":
        qLeftTop.push(t.label);
        break;
      case "quarter-right-bottom":
      case "q_right_bottom":
        qRightBottom.push(t.label);
        break;
      case "quarter-left-bottom":
      case "q_left_bottom":
        qLeftBottom.push(t.label);
        break;
      case "quarter-left":
        qLeftTop.push(t.label);
        break;
      case "quarter-right":
        qRightTop.push(t.label);
        break;
      default:
        full.push(t.label);
    }
  }

  const makePills = (arr) => {
    if (!arr.length) return "";
    const pills = arr
      .map((label) => `<span class="zone-topping-label">${escapeHtml(label)}</span>`)
      .join("");
    return `<span class="zone-pills">${pills}</span>`;
  };

  const line = (title, arr) =>
    `<div class="zone-summary-line"><span class="zone-title">${title}:</span>${makePills(arr)}</div>`;

  const lines = [];

  if (removed.length) lines.push(line("بلا", removed));
  const L_ALL = covLabel("ALL","ar") || "على الكل";
  const L_HR = covLabel("HALF_RIGHT","ar") || "نصف يمين";
  const L_HL = covLabel("HALF_LEFT","ar") || "نصف شمال";
  const L_Q1 = covLabel("Q1","ar") || "ربع 1";
  const L_Q2 = covLabel("Q2","ar") || "ربع 2";
  const L_Q3 = covLabel("Q3","ar") || "ربع 3";
  const L_Q4 = covLabel("Q4","ar") || "ربع 4";

  if (full.length) lines.push(line(L_ALL, full));
  if (halfRight.length) lines.push(line(L_HR, halfRight));
  if (halfLeft.length) lines.push(line(L_HL, halfLeft));
  if (third1.length) lines.push(line("ثلث 1", third1));
  if (third2.length) lines.push(line("ثلث 2", third2));
  if (third3.length) lines.push(line("ثلث 3", third3));
  if (qRightTop.length) lines.push(line(L_Q1, qRightTop));
  if (qLeftTop.length) lines.push(line(L_Q3, qLeftTop));
  if (qRightBottom.length) lines.push(line(L_Q2, qRightBottom));
  if (qLeftBottom.length) lines.push(line(L_Q4, qLeftBottom));

  return lines.length ? lines.join("") : null;
}



function addToppingToItem(index, toppingDef, coverage) {
  if (index == null || index < 0 || index >= currentOrderItems.length) return;
  const item = currentOrderItems[index];
  if (!isPizzaLikeItem(item)) return;

  if (!Array.isArray(item.toppings)) {
    item.toppings = [];
  }

  // toggle לוגיקה:
  // אם לוחצים שוב על אותה תוספת באותו כיסוי → מוחקים את כל ההופעות של אותה תוספת מכל המפה (אופציה B)
  // אם לוחצים על כיסוי אחר של אותה תוספת → מוסיפים כיסוי חדש (אפשר לפזר אותה על כמה אזורים).

  const sameCoverageIndex = item.toppings.findIndex(
    (t) => t.id === toppingDef.id && t.coverage === coverage
  );

  if (sameCoverageIndex >= 0) {
    // לחיצה שנייה על אותו מקום → מסירים את כל התוספת מכל האזורים
    item.toppings = item.toppings.filter((t) => t.id !== toppingDef.id);
  } else {
    // מוסיפים כיסוי חדש (גם אם יש לה כבר כיסויים אחרים)
    item.toppings.push({
      id: toppingDef.id,
      label: toppingDef.label,
      kind: toppingDef.kind,
      coverage,
    });
  }

  recalcPizzaPriceWithToppings(item);
  renderCurrentOrder();
}


function renderToppingsPanel() {
  toppingsPanelEl.innerHTML = "";
  if (selectedOrderIndex == null || !currentOrderItems[selectedOrderIndex]) {
    const p = document.createElement("p");
    p.className = "empty-text";
    p.textContent = "إختر بيتزا من القائمة لإضافة إضافات.";
    toppingsPanelEl.appendChild(p);
    return;
  }

  const item = currentOrderItems[selectedOrderIndex];

  if (item && item.category === "pasta") {
    renderPastaToppingsPanel(item);
    return;
  }

  if (item && isBatataItem(item)) {
    renderBatataToppingsPanel(item);
    return;
  }

  if (item && item.category === "salad") {
    renderSaladToppingsPanel(item);
    return;
  }

  if (!isPizzaLikeItem(item)) {
    const p = document.createElement("p");
    p.className = "empty-text";
    p.textContent = "الإضافات التلقائية متاحة حالياً لمنتجات البيتزا فقط.";
    toppingsPanelEl.appendChild(p);
    return;
  }

  renderPizzaToppingsPanel(item);
}




function updateCurrentZoneToppingsSummary(item) {
  if (!currentZoneToppingsEl) return;
  if (!item) {
    currentZoneToppingsEl.innerHTML = "بدون إضافات";
    return;
  }

  // נשתמש תמיד ב-notes אם קיים (כמו בהזמנה), אחרת נבנה מחדש
  let text = item.notes && typeof item.notes === "string" ? item.notes : buildToppingsNotes(item);
  if (!text) {
    currentZoneToppingsEl.innerHTML = "بدون إضافات";
    return;
  }
  const isHtml = typeof text === "string" && /<[^>]+>/.test(text);
  currentZoneToppingsEl.innerHTML = isHtml ? text : text.replace(/\n/g, "<br>");
}

function renderPizzaToppingsPanel(item) {
  if (!toppingsPanelEl) return;
  toppingsPanelEl.innerHTML = "";
  if (!item) return;

  const title = document.createElement("h3");
  title.textContent = "إضافات للبيتزا المحددة";
  toppingsPanelEl.appendChild(title);

  const nameLine = document.createElement("div");
  nameLine.className = "toppings-current-item";
  nameLine.textContent = item.nameAr || "";
  toppingsPanelEl.appendChild(nameLine);

  const hint = document.createElement("div");
  hint.className = "toppings-hint";
  hint.textContent = "إختر المنطقة من البيتزا على اليسار, ثم إضغط على الإضافة لتشغيلها أو إلغائها في تلك المنطقة.";
  toppingsPanelEl.appendChild(hint);

  function createToppingsGroup(titleText, toppingsArray, opts = {}) {
    const group = document.createElement("div");
    group.className = "toppings-group";
    if (opts.groupClass) group.classList.add(opts.groupClass);
    const h4 = document.createElement("h4");
    h4.textContent = titleText;
    group.appendChild(h4);

    toppingsArray.forEach((top) => {
      const norm = normalizeOptionDef(top, "ar") || top;
      const chip = document.createElement("button");
      chip.className = "topping-chip";
      if (opts.chipClass) chip.classList.add(opts.chipClass);
      chip.textContent = (norm.label || top.label || labelArById(norm.id || top.id));

      const isActive =
        Array.isArray(item.toppings) &&
        item.toppings.some((t) => t.id === (norm.id||top.id) && t.coverage === activeToppingCoverage);

      if (isActive) {
        chip.classList.add("topping-chip-active");
      }

      chip.addEventListener("click", () => {
        addToppingToItem(selectedOrderIndex, norm, activeToppingCoverage);
        renderToppingsPanel();
      });

      group.appendChild(chip);
    });

    toppingsPanelEl.appendChild(group);
  }

  // קבוצות תוספות לפי מוצר
  let regularList = getOptionDefsByKinds(["regular","free"], { lang: "ar" });
  if (!regularList.length) regularList = REGULAR_TOPPINGS;
  if (isMalawachRolled(item)) {
    // במלווח الملفوف: מסירים سمسم ומוסיפים במקומו خيار "ملوح مفتوح كلو عجنب"
    regularList = REGULAR_TOPPINGS.filter((t) => t.id !== "sesame").concat([MALAWACH_OPEN_SIDE_TOPPING]);
  }

  let specialList = getOptionDefsByKinds(["special"], { lang: "ar" });
  if (!specialList.length) specialList = SPECIAL_TOPPINGS;
  if (isZivaOrSambusak(item) || isMalawachRolled(item)) {
    // בזيفا/سمبوسك/مלוح ملفوف מציגים רק ביצים + אקסטרה ביצה
    specialList = SPECIAL_TOPPINGS.filter((t) =>
      ["egg", "egg_no_yolk", "egg_no_white"].includes(t.id)
    ).concat([EXTRA_EGG_TOPPING]);
  }

  // התאמות ייחודיות למלווח الملفوف
  if (isMalawachRolled(item)) {
    // "بيضة" במלווח الملفوف מוצג כ־"بيضه عجنب"
    specialList = specialList.map((t) => (t.id === "egg" ? { ...t, label: "بيضه عجنب" } : t));

    // אפשרויות הסרה (באדום) מוצגות בראש
    createToppingsGroup("إزالة", MALAWACH_ROLLED_REMOVE_OPTIONS, {
      groupClass: "toppings-group-remove",
      chipClass: "topping-chip-remove",
    });
  }

  createToppingsGroup("إضافات عادية", regularList);
  createToppingsGroup("إضافات خاصة", specialList);



  

  const shrimpDef = normalizeOptionDef({ id: "shrimp", kind: "shrimp" }, "ar") || SHRIMP_TOPPING;
  const tarafDef = normalizeOptionDef({ id: "taraf_cheese", kind: "shrimp" }, "ar") || TARAF_CHEESE_TOPPING;
const shrimpGroup = document.createElement("div");
  shrimpGroup.className = "toppings-group";
  const shTitle = document.createElement("h4");
  shTitle.textContent = "תוספת שרימפס";
  shrimpGroup.appendChild(shTitle);

  const shrimpChip = document.createElement("button");
  shrimpChip.className = "topping-chip";
  shrimpChip.textContent = shrimpDef.label;

  const hasShrimp =
    Array.isArray(item.toppings) &&
    item.toppings.some(
      (t) => t.id === shrimpDef.id && t.coverage === activeToppingCoverage
    );

  if (hasShrimp) {
    shrimpChip.classList.add("topping-chip-active");
  }

  shrimpChip.addEventListener("click", () => {
    addToppingToItem(selectedOrderIndex, shrimpDef, activeToppingCoverage);
    renderToppingsPanel();
  });

  shrimpGroup.appendChild(shrimpChip);

  // طراف جبنه (באותו מחיר כמו שרימפס)
  const tarafChip = document.createElement("button");
  tarafChip.className = "topping-chip";
  tarafChip.textContent = tarafDef.label;

  const hasTaraf =
    Array.isArray(item.toppings) &&
    item.toppings.some(
      (t) => t.id === tarafDef.id && t.coverage === activeToppingCoverage
    );

  if (hasTaraf) {
    tarafChip.classList.add("topping-chip-active");
  }

  tarafChip.addEventListener("click", () => {
    addToppingToItem(selectedOrderIndex, tarafDef, activeToppingCoverage);
    renderToppingsPanel();
  });

  shrimpGroup.appendChild(tarafChip);

  toppingsPanelEl.appendChild(shrimpGroup);

  updateCurrentZoneToppingsSummary(item);
}



function openToppingsModal(index) {
  selectedOrderIndex = index;
  const item = currentOrderItems[index];

  const isSimpleFlatToppings = isZivaOrSambusak(item) || isMalawachRolled(item);
  const isSectionPizza = isPizzaLikeItem(item) && !isSimpleFlatToppings;

  // עבור בינוני (6 חתיכות): על الكل / نصف يمين / نصف شمال / ثلث 1-3
  if (isSectionPizza) {
    applyPizzaZoneModeForItem(item);
  } else {
    if (pizzaCircleEl) pizzaCircleEl.classList.remove("mode-six");
  }

  // שליטה בתצוגת עיגול האזורים / לייאאוט
  if (pizzaZoneWrapperEl) {
    if (isSectionPizza) {
      pizzaZoneWrapperEl.classList.remove("hidden-pizza-zone");
      if (toppingsLayoutEl) {
        toppingsLayoutEl.classList.remove("no-pizza-layout");
      }
    } else {
      pizzaZoneWrapperEl.classList.add("hidden-pizza-zone");
      if (toppingsLayoutEl) {
        toppingsLayoutEl.classList.add("no-pizza-layout");
      }
    }
  }

  // מצב עיצוב מודרני לפריטים בלי רבעים (זيفا / סמבוסיק)
  if (toppingsModalContentEl) {
    if (isSimpleFlatToppings) {
      toppingsModalContentEl.classList.add("simple-toppings-mode");
    } else {
      toppingsModalContentEl.classList.remove("simple-toppings-mode");
    }
  }

  // ברירת מחדל – על הכל
  activeToppingCoverage = "full";
  if (isSectionPizza) {
    if (pizzaZoneButtons && pizzaZoneButtons.forEach) {
      pizzaZoneButtons.forEach((btn) => {
        btn.classList.toggle("active-zone", btn.dataset.coverage === "full");
      });
    }
    if (currentZoneLabelEl) {
      currentZoneLabelEl.textContent = covLabel("full","ar") || "على الكل";
    }
    // רק לפיצה עם רבעים צריך סיכום אזורים
    zoneSummaryEnabled = true;
    if (currentZoneToppingsEl) {
      currentZoneToppingsEl.innerHTML = "";
    }
  } else {
    // לפסטות / סלטים / זيفا / סמבוסיק / פריטים אחרים לא צריך סיכום אזורים
    zoneSummaryEnabled = false;
  }

  if (toppingsModal) {
    toppingsModal.classList.remove("hidden");
  }
  renderToppingsPanel();
}
function closeToppingsModal() {
  if (toppingsModal) {
    toppingsModal.classList.add("hidden");
  }
  selectedOrderIndex = null;
  if (toppingsPanelEl) {
    toppingsPanelEl.innerHTML = "";
  }
  renderCurrentOrder();
}

function openFreeDrinkModal(index) {
  if (index == null || index < 0 || index >= currentOrderItems.length) return;
  const item = currentOrderItems[index];
  if (!item || !item.hasFreeDrink) return;

  freeDrinkSelectedIndex = index;

  if (freeDrinkItemNameEl) {
    freeDrinkItemNameEl.textContent = item.nameAr || "";
  }

  if (freeDrinkOptionsEl) {
    freeDrinkOptionsEl.innerHTML = "";
    FREE_DRINK_OPTIONS.forEach((drinkName) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "drink-chip";
      chip.textContent = drinkName;
      if (item.freeDrink === drinkName) {
        chip.classList.add("drink-chip-selected");
      }
      chip.addEventListener("click", () => {
        if (item.freeDrink === drinkName) {
          item.freeDrink = null;
        } else {
          item.freeDrink = drinkName;
        }
        renderCurrentOrder();
        openFreeDrinkModal(index);
      });
      freeDrinkOptionsEl.appendChild(chip);
    });
  }

  if (freeDrinkModal) {
    freeDrinkModal.classList.remove("hidden");
  }
}

function closeFreeDrinkModal() {
  if (freeDrinkModal) {
    freeDrinkModal.classList.add("hidden");
  }
  freeDrinkSelectedIndex = null;
}


// --- State ---
let currentOrderItems = [];
let selectedOrderIndex = null; // index of item for toppings
let activeToppingCoverage = "full"; // current pizza zone
let currentServiceType = null; // 'delivery' | 'takeaway' | 'dinein'
let currentPaymentStatus = null;
let currentOpenOrders = [];
let currentClosedOrders = [];
let openOrdersSearchTerm = "";
let closedOrdersSearchTerm = "";
let lastClonedOrderId = null;
 // 'paid' | 'unpaid'
let currentPrintMode = "usb"; // 'a4' | 'pos' | 'usb'
let currentDeliveryFee = 0;
let adminLoggedIn = false;
let editingMenuItemId = null;
let editingOpenOrderMeta = null;
let openEditServiceType = null;
let driversMap = null;
let driverMarkers = {};
let driverColorMap = {};
const DRIVER_COLORS = ["#00e676", "#ff1744", "#2979ff", "#ff9100", "#e040fb", "#00bcd4"];

function updateDeliveryFeeDisplay() {
  if (!deliveryFeeBtn || !deliveryFeeLabel) return;
  if (!currentDeliveryFee || currentDeliveryFee <= 0) {
    deliveryFeeLabel.textContent = "";
    deliveryFeeLabel.classList.add("hidden");
    deliveryFeeBtn.textContent = "דמי משלוח";
  } else {
    const feeStr = `${currentDeliveryFee} ₪`;
    deliveryFeeLabel.textContent = feeStr;
    deliveryFeeLabel.classList.remove("hidden");
    deliveryFeeBtn.textContent = `דמי משלוח (${feeStr})`;
  }
}


function getColorForDriver(driverId) {
  if (!driverId) return DRIVER_COLORS[0];
  if (driverColorMap[driverId]) return driverColorMap[driverId];
  const existingIds = Object.keys(driverColorMap);
  const color = DRIVER_COLORS[existingIds.length % DRIVER_COLORS.length];
  driverColorMap[driverId] = color;
  return color;
}

function driverHasOpenOrders(driverId) {
  if (!driverId || !Array.isArray(currentOpenOrders) || !currentOpenOrders.length) return false;
  return currentOpenOrders.some((o) => {
    if (!o) return false;
    if (o.driverId !== driverId) return false;
    if (o.serviceType && o.serviceType !== "delivery") return false;
    if (o.status && o.status !== "open") return false;
    return true;
  });
}

function refreshDriversMapMarkers() {
  if (!driversMap || !driverMarkers) return;
  const activeIds = new Set();
  if (Array.isArray(currentOpenOrders)) {
    currentOpenOrders.forEach((o) => {
      if (!o) return;
      if (!o.driverId) return;
      if (o.serviceType && o.serviceType !== "delivery") return;
      if (o.status && o.status !== "open") return;
      activeIds.add(o.driverId);
    });
  }
  Object.keys(driverMarkers).forEach((driverId) => {
    if (!activeIds.has(driverId)) {
      const marker = driverMarkers[driverId];
      if (marker && driversMap.hasLayer(marker)) {
        driversMap.removeLayer(marker);
      }
      delete driverMarkers[driverId];
    }
  });
}
// Refs ---
const connectionStatusEl = document.getElementById("connectionStatus");
const categoryTabsEl = document.getElementById("categoryTabs");
const menuItemsEl = document.getElementById("menuItems");

const orderItemsEl = document.getElementById("orderItems");
const toppingsPanelEl = document.getElementById("toppingsPanel");
const toppingsModal = document.getElementById("toppingsModal");
const toppingsModalContentEl = document.querySelector("#toppingsModal .modal-toppings");
const pizzaZoneWrapperEl = document.querySelector(".pizza-zone-wrapper");
const pizzaCircleEl = document.querySelector(".pizza-circle");
const toppingsLayoutEl = document.querySelector(".toppings-layout");
const toppingsCloseBtn = document.getElementById("toppingsCloseBtn");
const pizzaZoneButtons = document.querySelectorAll(".pizza-zone-btn");
const currentZoneLabelEl = document.getElementById("currentZoneLabel");
const currentZoneToppingsEl = document.getElementById("currentZoneToppings");
let zoneSummaryEnabled = false;
const freeDrinkModal = document.getElementById("freeDrinkModal");
const freeDrinkItemNameEl = document.getElementById("freeDrinkItemName");
const freeDrinkOptionsEl = document.getElementById("freeDrinkOptions");
const freeDrinkCloseBtn = document.getElementById("freeDrinkCloseBtn");
const freeDrinkClearBtn = document.getElementById("freeDrinkClearBtn");
let freeDrinkSelectedIndex = null;
const orderTotalEl = document.getElementById("orderTotal");
const orderTypeLabelEl = document.getElementById("orderTypeLabel");
const deliveryFeeBtn = document.getElementById("deliveryFeeBtn");
const deliveryFeeLabel = document.getElementById("deliveryFeeLabel");

updateDeliveryFeeDisplay();

const clearOrderBtn = document.getElementById("clearOrderBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const finishOrderBtn = document.getElementById("finishOrderBtn");
const updateOrderBtn = document.getElementById("updateOrderBtn");

const openOrdersPanel = document.getElementById("openOrdersPanel");
const closedOrdersPanel = document.getElementById("closedOrdersPanel");
const takeawayPanel = document.getElementById("takeawayPanel");

const openOrdersListEl = document.getElementById("openOrdersList");
const openOrdersSearchInput = document.getElementById("openOrdersSearch");
const closedOrdersListEl = document.getElementById("closedOrdersList");
const closedOrdersSearchInput = document.getElementById("closedOrdersSearch");
const closedOrdersFooterEl = document.getElementById("closedOrdersFooter");

const takeawayOrdersListEl = document.getElementById("takeawayOrdersList");
const takeawayTotalsEl = document.getElementById("takeawayTotals");

const takeawaySummaryBtn = document.getElementById("takeawaySummaryBtn");

// Order details modal
const orderDetailsModal = document.getElementById("orderDetailsModal");
const orderDetailsMetaEl = document.getElementById("orderDetailsMeta");
const orderDetailsItemsBody = document.getElementById("orderDetailsItemsBody");
const orderDetailsTotalsEl = document.getElementById("orderDetailsTotals");
const orderDetailsCloseBtn = document.getElementById("orderDetailsCloseBtn");

// Modal – order meta
const orderMetaModal = document.getElementById("orderMetaModal");
const serviceTypeButtons = document.getElementById("serviceTypeButtons");
const paymentStatusButtons = document.getElementById("paymentStatusButtons");
const printModeA4Btn = document.getElementById("printModeA4");
const printModePosBtn = document.getElementById("printModePos");
const printModeUsbBtn = document.getElementById("printModeUsb");

const openOrderEditMetaModal = document.getElementById("openOrderEditMetaModal");
const openEditNameInput = document.getElementById("openEditName");
const takeawaySummaryModal = document.getElementById("takeawaySummaryModal");
const takeawaySummaryTableBody = document.getElementById("takeawaySummaryTableBody");
const takeawaySummaryEmptyEl = document.getElementById("takeawaySummaryEmpty");
const takeawaySummaryCloseBtn = document.getElementById("takeawaySummaryClose");
const openEditPhoneInput = document.getElementById("openEditPhone");
const openEditCityInput = document.getElementById("openEditCity");
const openEditStreetInput = document.getElementById("openEditStreet");
const openEditHouseInput = document.getElementById("openEditHouse");
const openEditFloorInput = document.getElementById("openEditFloor");
const openEditApartmentInput = document.getElementById("openEditApartment");
const openEditEntranceInput = document.getElementById("openEditEntrance");
const openEditServiceTypeGroup = document.getElementById("openEditServiceTypeGroup");
const openEditCancelBtn = document.getElementById("openEditCancelBtn");
const openEditSaveBtn = document.getElementById("openEditSaveBtn");
const openEditPrintA4Btn = document.getElementById("openEditPrintA4Btn");
// ===== Open Orders: Edit Meta Modal handlers (حدث) =====
function closeOpenOrderEditMetaModal() {
  try {
    if (openOrderEditMetaModal) openOrderEditMetaModal.classList.add("hidden");
  } catch (e) {}
  editingOpenOrderMeta = null;
  openEditServiceType = null;
}

// Backdrop click closes modal
try {
  if (openOrderEditMetaModal) {
    const bd = openOrderEditMetaModal.querySelector(".modal-backdrop");
    if (bd) bd.addEventListener("click", closeOpenOrderEditMetaModal);
  }
} catch (e) {}

if (openEditServiceTypeGroup) {
  openEditServiceTypeGroup.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      openEditServiceType = btn.dataset.type || "delivery";
      openEditServiceTypeGroup.querySelectorAll("button").forEach((b) => {
        b.classList.toggle("active", b.dataset.type === openEditServiceType);
      });
    });
  });
}

if (openEditCancelBtn) {
  openEditCancelBtn.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    closeOpenOrderEditMetaModal();
  });
}

if (openEditPrintA4Btn) {
  openEditPrintA4Btn.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!editingOpenOrderMeta) return;
    try {
      printOrderTicketA4(editingOpenOrderMeta.id, editingOpenOrderMeta);
    } catch (e) {
      console.error("A4 print from open edit failed", e);
      alert("שגיאה בהדפסה (A4).");
    }
  });
}

if (openEditSaveBtn) {
  openEditSaveBtn.addEventListener("click", async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!editingOpenOrderMeta) return;

    const name = (openEditNameInput && openEditNameInput.value) ? openEditNameInput.value.trim() : "";
    const phone = (openEditPhoneInput && openEditPhoneInput.value) ? openEditPhoneInput.value.trim() : "";

    const addr = {
      city: (openEditCityInput && openEditCityInput.value) ? openEditCityInput.value.trim() : "",
      street: (openEditStreetInput && openEditStreetInput.value) ? openEditStreetInput.value.trim() : "",
      houseNumber: (openEditHouseInput && openEditHouseInput.value) ? openEditHouseInput.value.trim() : "",
      floor: (openEditFloorInput && openEditFloorInput.value) ? openEditFloorInput.value.trim() : "",
      apartment: (openEditApartmentInput && openEditApartmentInput.value) ? openEditApartmentInput.value.trim() : "",
      entrance: (openEditEntranceInput && openEditEntranceInput.value) ? openEditEntranceInput.value.trim() : "",
    };

    const serviceType = openEditServiceType || editingOpenOrderMeta.serviceType || "delivery";

    try {
      const ref = doc(db, "orders", editingOpenOrderMeta.id);
      await updateDoc(ref, {
        customerName: name,
        phone: phone,
        address: addr,
        serviceType: serviceType,
        updatedAt: serverTimestamp(),
      });

      // Sync into customers management too (same as creating new order)
      try {
        await saveCustomerFromOrder({ customerName: name, phone: phone, address: addr });
      } catch (e) {
        console.warn("customer sync failed (non-blocking)", e);
      }

      closeOpenOrderEditMetaModal();
    } catch (err) {
      console.error("Error updating open order meta", err);
      alert("שגיאה בשמירה.");
    }
  });
}
// ===== End Open Orders: Edit Meta Modal handlers =====


const customerFieldsDelivery = document.getElementById("customerFieldsDelivery");
const customerFieldsTakeaway = document.getElementById("customerFieldsTakeaway");
const customerFieldsDinein = document.getElementById("customerFieldsDinein");

// inputs delivery
const custNameDelivery = document.getElementById("custNameDelivery");
const custPhoneDelivery = document.getElementById("custPhoneDelivery");
const custPhoneDeliveryError = document.getElementById("custPhoneDeliveryError");
const custStreet = document.getElementById("custStreet");
const custHouseNumber = document.getElementById("custHouseNumber");
const custFloor = document.getElementById("custFloor");
const custApartment = document.getElementById("custApartment");
const custEntrance = document.getElementById("custEntrance");
const custCity = document.getElementById("custCity");

// takeaway
const custNameTakeaway = document.getElementById("custNameTakeaway");
const custPhoneTakeaway = document.getElementById("custPhoneTakeaway");
const custPhoneTakeawayError = document.getElementById("custPhoneTakeawayError");

// dinein
const custTableNumber = document.getElementById("custTableNumber");
const custNameDinein = document.getElementById("custNameDinein");

const paymentNotes = document.getElementById("paymentNotes");

// Auto-fill customer details by phone (delivery / takeaway)
// We fetch the customer automatically once the phone reaches 10 digits (no need to click outside).
function attachCustomerAutofill(phoneEl, nameEl, extraAddressFields) {
  if (!phoneEl) return;
  let t = null;

  const run = () => {
    const digits = sanitizePhoneForId(phoneEl.value || "");
    if (!digits) return;

    // Only trigger once user finishes typing a full phone number (10 digits)
    if (digits.length < 10) {
      phoneEl.dataset.lastLookup = "";
      return;
    }

    // Prevent repeated lookups for the same number
    if (phoneEl.dataset.lastLookup === digits) return;
    phoneEl.dataset.lastLookup = digits;

    tryFillCustomerByPhone(phoneEl, nameEl, extraAddressFields);
  };

  phoneEl.addEventListener("input", () => {
    if (t) clearTimeout(t);
    t = setTimeout(run, 150);
  });

  phoneEl.addEventListener("paste", () => setTimeout(run, 0));
  phoneEl.addEventListener("blur", run);
}

attachCustomerAutofill(custPhoneDelivery, custNameDelivery, {
  street: custStreet,
  houseNumber: custHouseNumber,
  city: custCity,
  floor: custFloor,
  apartment: custApartment,
});

attachCustomerAutofill(custPhoneTakeaway, custNameTakeaway, null);


const cancelMetaBtn = document.getElementById("cancelMetaBtn");
const saveMetaBtn = document.getElementById("saveMetaBtn");

let __olive_isSavingMeta = false;

// Admin
const adminBtn = document.getElementById("adminBtn");
const adminModal = document.getElementById("adminModal");
const adminLoginSection = document.getElementById("adminLoginSection");
const adminMainSection = document.getElementById("adminMainSection");
const adminPinInput = document.getElementById("adminPinInput");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminCloseBtn = document.getElementById("adminCloseBtn");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
// Print Config (protected by SUPER_ADMIN_PIN)
const printConfigBtn = document.getElementById("printConfigBtn");
const printTestBtn = document.getElementById("printTestBtn");
const printConfigModal = document.getElementById("printConfigModal");
const printConfigLoginSection = document.getElementById("printConfigLoginSection");
const printConfigMainSection = document.getElementById("printConfigMainSection");
const printConfigPinInput = document.getElementById("printConfigPinInput");
const printConfigLoginBtn = document.getElementById("printConfigLoginBtn");
const printConfigCloseBtn = document.getElementById("printConfigCloseBtn");
const printConfigCloseBtn2 = document.getElementById("printConfigCloseBtn2");
const printServerUrlInput = document.getElementById("printServerUrlInput");
const printServerSaveBtn = document.getElementById("printServerSaveBtn");
const printServerTestBtn = document.getElementById("printServerTestBtn");
const printConfigStatus = document.getElementById("printConfigStatus");

function normalizePrintServerUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  // iOS Safari sometimes stores the server address without a protocol
  // (e.g. 192.168.1.10:3000). fetch() then throws "Invalid URL".
  // Default to http:// for LAN/localhost usage.
  const withProto = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  // Remove trailing /print and trailing slashes
  return withProto.replace(/\/print\/?$/i, "").replace(/\/+$/, "");
}

async function testPrintServerHealth(urlBase) {
  const base = normalizePrintServerUrl(urlBase || PRINT_SERVER_URL);
  if (!base) throw new Error("כתובת שרת הדפסה ריקה.");
  const res = await fetch(`${base}/health`, {
    method: "GET",
    headers: {
      "ngrok-skip-browser-warning": "1",
    },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Health נכשל (${res.status}): ${text.slice(0, 200)}`);
  }
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return data;
}



const adminMenuTabBtn = document.querySelector('.admin-tab[data-tab="menu"]');
const adminCustomersTabBtn = document.querySelector('.admin-tab[data-tab="customers"]');
const adminMenuTab = document.getElementById("adminMenuTab");
const adminCustomersTab = document.getElementById("adminCustomersTab");

const adminMenuList = document.getElementById("adminMenuList");
const adminCustomersList = document.getElementById("adminCustomersList");
const adminAddMenuItemBtn = document.getElementById("adminAddMenuItemBtn");
const adminAddDriverBtn = document.getElementById("adminAddDriverBtn");
const adminDriversTabBtn = document.querySelector('.admin-tab[data-tab="drivers"]');
const adminDriversTab = document.getElementById("adminDriversTab");
const adminAdminsTabBtn = document.querySelector('.admin-tab[data-tab="admins"]');
const adminAdminsTab = document.getElementById("adminAdminsTab");
const adminAdminsList = document.getElementById("adminAdminsList");
const adminAddAdminBtn = document.getElementById("adminAddAdminBtn");
const adminLogsTabBtn = document.querySelector('.admin-tab[data-tab="logs"]');
const adminLogsTab = document.getElementById("adminLogsTab");
const adminLogsList = document.getElementById("adminLogsList");

const adminDaySummariesTabBtn = document.querySelector('.admin-tab[data-tab="daysummaries"]');

const adminCategoriesTabBtn = document.querySelector('.admin-tab[data-tab="categories"]');
const adminCategoriesTab = document.getElementById("adminCategoriesTab");
const adminCategoriesList = document.getElementById("adminCategoriesList");
const adminAddCategoryBtn = document.getElementById("adminAddCategoryBtn");
const adminRefreshCategoriesBtn = document.getElementById("adminRefreshCategoriesBtn");
const adminDaySummariesTab = document.getElementById("adminDaySummariesTab");
const adminDaySummariesList = document.getElementById("adminDaySummariesList");
const adminRefreshDaySummariesBtn = document.getElementById("adminRefreshDaySummariesBtn");

// עזר לבדיקת PIN מנהל (כולל מנהלים משניים)
async function verifyAdminPin(pin) {
  if (!pin) return false;
  // PIN ראשי של בעלים תמיד מאושר
  if (pin === SUPER_ADMIN_PIN) return true;
  try {
    const adminsRef = collection(db, "admins");
    const qAdmins = query(adminsRef, where("pin", "==", pin));
    const snap = await getDocs(qAdmins);
    let ok = false;
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data) return;
      if (data.active === false) return;
      ok = true;
    });
    return ok;
  } catch (err) {
    console.error("verify admin pin error", err);
    alert("שגיאה בבדיקת קוד מנהל.");
    return false;
  }
}

async function requireAdminPin(message) {
  const pin = window.prompt(message || "PIN מנהל:");
  if (pin === null) return false;
  const ok = await verifyAdminPin(pin.trim());
  if (!ok) {
    alert("קוד מנהל לא נכון.");
  }
  return ok;
}

// החזרת פרטי מנהל (כולל תפקיד) לפי PIN
async function fetchAdminIdentityByPin(pin) {
  if (!pin) return { ok: false };
  const clean = String(pin).trim();
  // בעלים ראשי – משתמש ב-SUPER_ADMIN_PIN
  if (clean === SUPER_ADMIN_PIN) {
    try {
      const adminsRef = collection(db, "admins");
      const qAdmins = query(adminsRef, where("pin", "==", clean), limit(1));
      const snap = await getDocs(qAdmins);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data() || {};
        if (data.active === false) {
          return { ok: false };
        }
        return {
          ok: true,
          adminId: docSnap.id,
          adminPin: clean,
          adminName: data.name || "בעלים",
          adminRole: data.role || "super",
          isSuper: true
        };
      }
    } catch (e) {
      console.error("fetchAdminIdentityByPin super error", e);
    }
    return {
      ok: true,
      adminId: null,
      adminPin: clean,
      adminName: "בעלים",
      adminRole: "super",
      isSuper: true
    };
  }

  try {
    const adminsRef = collection(db, "admins");
    const qAdmins = query(adminsRef, where("pin", "==", clean), limit(1));
    const snap = await getDocs(qAdmins);
    if (snap.empty) return { ok: false };
    const docSnap = snap.docs[0];
    const data = docSnap.data() || {};
    if (data.active === false) return { ok: false };
    return {
      ok: true,
      adminId: docSnap.id,
      adminPin: clean,
      adminName: data.name || "",
      adminRole: data.role || "sub",
      isSuper: data.role === "super"
    };
  } catch (err) {
    console.error("fetchAdminIdentityByPin error", err);
    return { ok: false };
  }
}

// בקשת PIN + זיהוי מנהל לפעולות עם לוג
async function requireAdminIdentity(message) {
  const pin = window.prompt(message || "PIN מנהל:");
  if (pin === null) return null;
  const identity = await fetchAdminIdentityByPin(pin.trim());
  if (!identity.ok) {
    alert("קוד מנהל לא נכון.");
    return null;
  }
  return identity;
}

// כתיבת פעולה של מנהל ל-Firestore
async function logAdminAction(payload) {
  try {
    const base = payload || {};
    await addDoc(collection(db, "adminLogs"), {
      ...base,
      createdAt: serverTimestamp()

    });
  } catch (err) {
    console.error("logAdminAction error", err);
  }
}

// Save day summary record for Admin panel (ניהול -> סיכום יום)
async function saveDaySummaryRecord(payload, identity) {
  const base = payload || {};
  const id = identity || {};
  try {
    await addDoc(collection(db, "daySummaries"), {
      ...base,
      closedAt: serverTimestamp(),
      adminId: id.adminId || null,
      adminName: id.adminName || null,
      adminRole: id.adminRole || (id.isSuper ? "super" : "sub")
    });
    return true;
  } catch (err) {
    console.error("failed to save daySummaries", err);
    return false;
  }
}

// Admin tabs helper
function showAdminTab(tab) {
  if (!adminMenuTabBtn || !adminCustomersTabBtn || !adminDriversTabBtn) return;

  adminMenuTabBtn.classList.toggle("active", tab === "menu");
  adminCustomersTabBtn.classList.toggle("active", tab === "customers");
  adminDriversTabBtn.classList.toggle("active", tab === "drivers");
  if (adminAdminsTabBtn) adminAdminsTabBtn.classList.toggle("active", tab === "admins");
  if (adminLogsTabBtn) adminLogsTabBtn.classList.toggle("active", tab === "logs");
  if (adminDaySummariesTabBtn) adminDaySummariesTabBtn.classList.toggle("active", tab === "daysummaries");
  if (adminCategoriesTabBtn) adminCategoriesTabBtn.classList.toggle("active", tab === "categories");

  if (adminMenuTab) adminMenuTab.classList.toggle("hidden", tab !== "menu");
  if (adminCustomersTab) adminCustomersTab.classList.toggle("hidden", tab !== "customers");
  if (adminDriversTab) adminDriversTab.classList.toggle("hidden", tab !== "drivers");
  if (adminAdminsTab) adminAdminsTab.classList.toggle("hidden", tab !== "admins");
  if (adminLogsTab) adminLogsTab.classList.toggle("hidden", tab !== "logs");
  if (adminDaySummariesTab) adminDaySummariesTab.classList.toggle("hidden", tab !== "daysummaries");
  if (adminCategoriesTab) adminCategoriesTab.classList.toggle("hidden", tab !== "categories");

  if (tab === "menu") {
    loadAdminMenu();
  } else if (tab === "customers") {
    loadAdminCustomers();
  } else if (tab === "drivers") {
    loadAdminDrivers();
  } else if (tab === "admins") {
    loadAdminManagers();
  } else if (tab === "logs") {
    loadAdminLogs();
  } else if (tab === "daysummaries") {
    loadAdminDaySummaries();
  } else if (tab === "categories") {
    loadAdminCategories();
  }
}


// Menu item edit modal
const menuItemEditModal = document.getElementById("menuItemEditModal");
const editMenuItemNameAr = document.getElementById("editMenuItemNameAr");
const editMenuItemCategory = document.getElementById("editMenuItemCategory");
const editMenuItemSize = document.getElementById("editMenuItemSize");
const editMenuItemPrice = document.getElementById("editMenuItemPrice");
const editMenuItemSortOrder = document.getElementById("editMenuItemSortOrder");
const editMenuItemActive = document.getElementById("editMenuItemActive");
const menuItemEditCancelBtn = document.getElementById("menuItemEditCancelBtn");
const menuItemEditSaveBtn = document.getElementById("menuItemEditSaveBtn");

// --- Menu from Firestore ---
let menuDocs = [];
// --- Categories config from Firestore (ordering/labels) ---
let categoriesConfigMap = new Map(); // key -> {label, sortOrder, active}
let categoriesUnsub = null;

function setupCategoriesListener() {
  try {
    if (categoriesUnsub) categoriesUnsub();
  } catch {}
  const colRef = collection(db, "categories");
  categoriesUnsub = onSnapshot(colRef, (snap) => {
    const m = new Map();
    snap.forEach((d) => {
      const data = d.data() || {};
      m.set(d.id, { id: d.id, ...data });
    });
    categoriesConfigMap = m;
    // re-render menu categories if menu already loaded
    if (menuDocs && menuDocs.length) {
      try { renderMenuFromDocs(); } catch (e) { console.warn('renderMenuFromDocs after categories update failed', e); }
    }
  }, (err) => {
    console.warn('categories onSnapshot error', err);
  });
}


function sanitizePhoneForId(value) {
  return value.replace(/\D/g, "");
}

// Load menu items (active only) and build categories
function setupMenuListener() {
  const colRef = collection(db, "menu");
  const qMenu = query(colRef, where("active", "==", true));
  onSnapshot(
  qMenu,
  (snapshot) => {
    menuDocs = [];
    snapshot.forEach((docSnap) => {
      menuDocs.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderMenuFromDocs();
  },
  (err) => {
    console.error("menu onSnapshot error", err);
    if (menuItemsEl) {
      menuItemsEl.innerHTML = "";
      const p = document.createElement("p");
      p.className = "empty-text";
      p.textContent = "שגיאה בטעינת התפריט: " + (err && err.message ? err.message : "");
      menuItemsEl.appendChild(p);
    }
  }
);

}

function renderMenuFromDocs() {
  categoryTabsEl.innerHTML = "";
  menuItemsEl.innerHTML = "";

  if (!menuDocs.length) {
    const p = document.createElement("p");
    p.className = "empty-text";
    p.textContent = "אין פריטים בתפריט. כנס לניהול והוסף פריטים.";
    menuItemsEl.appendChild(p);
    return;
  }

  // Build unique categories + מינימום סדר תצוגה לכל קטגוריה
  const catMap = new Map();
  menuDocs.forEach((m) => {
    if (!m || !m.category) return;
    const existing = catMap.get(m.category);
    const sortOrder = typeof m.sortOrder === "number" ? m.sortOrder : Number(m.sortOrder || 0) || 0;
    if (!existing) {
      catMap.set(m.category, {
        id: m.category,
        label: CATEGORY_LABELS_AR[m.category] || m.category, // תצוגה בערבית
        sortOrder,
      });
    } else if (sortOrder < existing.sortOrder) {
      existing.sortOrder = sortOrder;
    }
  });

  let cats = Array.from(catMap.values());

  // Apply categories config (ordering/labels) if exists
  try {
    cats = cats.map((c) => {
      const cfg = categoriesConfigMap && categoriesConfigMap.get ? categoriesConfigMap.get(c.id) : null;
      if (!cfg) return c;
      const active = cfg.active;
      // if explicitly disabled, mark inactive
      if (active === false) return { ...c, __disabled: true, sortOrder: typeof cfg.sortOrder === "number" ? cfg.sortOrder : Number(cfg.sortOrder || c.sortOrder || 0) || 0, label: cfg.label || c.label };
      return {
        ...c,
        sortOrder: typeof cfg.sortOrder === "number" ? cfg.sortOrder : Number(cfg.sortOrder || c.sortOrder || 0) || 0,
        label: cfg.label || c.label,
      };
    }).filter(c => !c.__disabled);
  } catch (e) {
    console.warn("apply categoriesConfigMap failed", e);
  }



  // Sort categories – קודם לפי sortOrder שהוגדר בניהול, ואז נפילה אחורה לפי שם/ברירת מחדל
  cats.sort((a, b) => {
    const sa = typeof a.sortOrder === "number" ? a.sortOrder : Number(a.sortOrder || 0) || 0;
    const sb = typeof b.sortOrder === "number" ? b.sortOrder : Number(b.sortOrder || 0) || 0;
    if (sa !== sb) return sa - sb;

    // נפילה אחורה לפי סדר תוויות (אם קיים) ואז לפי מזהה פנימי
    const ia = CATEGORY_DISPLAY_ORDER.indexOf(a.label);
    const ib = CATEGORY_DISPLAY_ORDER.indexOf(b.label);
    const da = ia === -1 ? 999 : ia;
    const db = ib === -1 ? 999 : ib;
    if (da !== db) return da - db;

    const ja = CATEGORY_ORDER.indexOf(a.id);
    const jb = CATEGORY_ORDER.indexOf(b.id);
    const xa = ja === -1 ? 999 : ja;
    const xb = jb === -1 ? 999 : jb;
    return xa - xb;
  });

  // Render category tabs
  cats.forEach((cat, index) => {
    const btn = document.createElement("button");
    btn.className = "category-tab" + (index === 0 ? " active" : "");
    btn.textContent = cat.label;
    btn.dataset.categoryId = cat.id;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".category-tab").forEach((el) => el.classList.remove("active"));
      btn.classList.add("active");
      renderMenuItemsByCategory(cat.id);
    });
    categoryTabsEl.appendChild(btn);
  });

  // Render first category
  if (cats.length) {
    renderMenuItemsByCategory(cats[0].id);
  }
}


function updatePastaPriceAndNotes(item) {
  const basePrice = item.basePrice != null ? item.basePrice : item.price || 0;
  const paid = Array.isArray(item.pastaPaidToppings)
    ? item.pastaPaidToppings.reduce((sum, t) => sum + (t.price || 0), 0)
    : 0;

  item.price = basePrice + paid;

  const parts = [];

  {
    const sauceLbl = resolveSauceLabelForItem(item, 'ar');
    if (sauceLbl) {
    const sauceChip = `<span class="order-chip order-chip-sauce">${escapeHtml(String(sauceLbl))}</span>`;
    parts.push(`صوص: ${sauceChip}`);
    }
  }

  const freeArr = Array.isArray(item.pastaFreeToppings)
    ? item.pastaFreeToppings.map((t) => t.label)
    : [];
  if (freeArr.length) {
    const freeChips = freeArr
      .map((label) => `<span class="order-chip order-chip-free">${label}</span>`)
      .join(" ");
    parts.push(`إضافات عادية: ${freeChips}`);
  }

  const paidArr = Array.isArray(item.pastaPaidToppings)
    ? item.pastaPaidToppings
    : [];
  if (paidArr.length) {
    const paidChips = paidArr
      .map((t) => `<span class="order-chip order-chip-paid">${(t.label||labelArById(t.id))} (+${t.price})</span>`)
      .join(" ");
    parts.push(`إضافات مدفوعة: ${paidChips}`);
  }

  item.notes = parts.length ? parts.join("<br>") : null;
  renderCurrentOrder();
}


function renderPastaToppingsPanel(item) {
  const title = document.createElement("h3");
  title.textContent = "إضافات للمكرونة المحددة";
  toppingsPanelEl.appendChild(title);

  const nameLine = document.createElement("div");
  nameLine.className = "toppings-current-item";
  nameLine.textContent = item.nameAr || "";
  toppingsPanelEl.appendChild(nameLine);

  // Sauce selection (required)
  const sauceGroup = document.createElement("div");
  // Stack two visual rows: 1) required sauce (most prominent) 2) extra sauce options (less prominent)
  sauceGroup.className = "toppings-group toppings-group-stack";

  const requiredBox = document.createElement("div");
  requiredBox.className = "toppings-box toppings-box-primary";
  const sauceTitle = document.createElement("h4");
  sauceTitle.textContent = "إختر صوص (إجباري)";
  requiredBox.appendChild(sauceTitle);
  const requiredChips = document.createElement("div");
  requiredChips.className = "toppings-chips";
  requiredBox.appendChild(requiredChips);
  sauceGroup.appendChild(requiredBox);

  const sauces = [
    { id: "pasta_sauce_cream", label: "شمنت" },
    { id: "pasta_sauce_rose", label: "روزه" },
    { id: "pasta_sauce_tomato", label: "بندوره" }
  ];

  const isRavioli = ((item.category||"").toString().trim().toLowerCase()==="ravioli") || ((item.nameAr||"").toString().includes("رافيولي"));

  const inferSauceIdFromLabel = (lbl) => {
    if(!lbl) return null;
    const s = String(lbl).trim();
    for(const o of sauces){
      const l1 = getI18nLabel(isRavioli ? RAVIOLI_SAUCES_I18N : PASTA_SAUCES_I18N, o.id, 'ar') || o.label;
      if(String(l1).trim() === s) return o.id;
    }
    return null;
  };

  const currentSauceId = (isRavioli ? (item.ravioliSauceId || item.sauceId) : (item.pastaSauceId || item.sauceId)) || inferSauceIdFromLabel(item.pastaSauce) || null;

  sauces.forEach((s) => {
    const chip = document.createElement("button");
    chip.className = "topping-chip";
    chip.textContent = getI18nLabel(isRavioli ? RAVIOLI_SAUCES_I18N : PASTA_SAUCES_I18N, s.id, 'ar') || s.label;
    if (currentSauceId === s.id) {
      chip.classList.add("topping-chip-active");
    }
    chip.addEventListener("click", () => {
      const target = currentOrderItems[selectedOrderIndex];
      if (!target) return;
      if(isRavioli){ target.ravioliSauceId = s.id; } else { target.pastaSauceId = s.id; }
      // keep legacy field empty to avoid printing old labels
      target.pastaSauce = null;
      updatePastaPriceAndNotes(target);
      renderToppingsPanel();
    });
    requiredChips.appendChild(chip);
  });

  // Extra options shown under "صوص" (free + paid) – less prominent than the required sauces
  const extrasBox = document.createElement("div");
  extrasBox.className = "toppings-box toppings-box-secondary";
  const extraSauceTitle = document.createElement("h4");
  extraSauceTitle.textContent = "صوص / إضافات (حسب الطلب)";
  extraSauceTitle.className = "toppings-subtitle";
  extrasBox.appendChild(extraSauceTitle);
  const extrasChips = document.createElement("div");
  extrasChips.className = "toppings-chips";
  extrasBox.appendChild(extrasChips);
  sauceGroup.appendChild(extrasBox);

  const freeSauceArr = Array.isArray(item.pastaFreeToppings)
    ? item.pastaFreeToppings
    : [];
  const paidSauceArr = Array.isArray(item.pastaPaidToppings)
    ? item.pastaPaidToppings
    : [];

  const hasFreeSauce = (id) => freeSauceArr.some((t) => t.id === id);
  const hasPaidSauce = (id) => paidSauceArr.some((t) => t.id === id);

  // Paid: move "مكرام +5" here (instead of "إضافات مع سعر")
  const creamTop = { id: "pasta_extra_cream", label: "مكرام", price: 5 };

  // Free sauce-related options (shown under صوص / إضافات)
  // Note: "شوي روطف" / "كتير روطف" were requested and must be visible.
  // Keeping them at the start so they're easy to find.
  const sauceFreeOptions = [
    { id: "rotov_light", label: "شوي روطف" },
    { id: "rotov_more", label: "كتير روطف" },
    { id: "cheese_little", label: "شوي جبنه" },
    { id: "cheese_more", label: "كتر جبنه" },
  ];

  // Paid chip (مكرام +5)
  (function () {
    const chip = document.createElement("button");
    // No special highlight, only slightly larger as requested
    chip.className = "topping-chip topping-chip-large";
    // Hide the "+5/+10/+20" text on the button UI (price is still applied in totals)
    chip.textContent = creamTop.label;
    if (hasPaidSauce(creamTop.id)) chip.classList.add("topping-chip-active");
    chip.addEventListener("click", () => {
      const target = currentOrderItems[selectedOrderIndex];
      if (!target) return;
      let arr = Array.isArray(target.pastaPaidToppings) ? target.pastaPaidToppings : [];
      if (arr.some((t) => t.id === creamTop.id)) {
        arr = arr.filter((t) => t.id !== creamTop.id);
      } else {
        arr = arr.concat([{ id: creamTop.id, label: creamTop.label, price: creamTop.price }]);
      }
      target.pastaPaidToppings = arr;
      updatePastaPriceAndNotes(target);
      renderToppingsPanel();
    });
    extrasChips.appendChild(chip);
  })();

  // Free chips (rotof / cheese)
  sauceFreeOptions.forEach((opt) => {
    const chip = document.createElement("button");
    chip.className = "topping-chip";
    chip.textContent = opt.label;
    if (hasFreeSauce(opt.id)) chip.classList.add("topping-chip-active");
    chip.addEventListener("click", () => {
      const target = currentOrderItems[selectedOrderIndex];
      if (!target) return;
      let arr = Array.isArray(target.pastaFreeToppings) ? target.pastaFreeToppings : [];
      if (arr.some((t) => t.id === opt.id)) {
        arr = arr.filter((t) => t.id !== opt.id);
      } else {
        arr = arr.concat([{ id: opt.id, label: opt.label }]);
      }
      target.pastaFreeToppings = arr;
      updatePastaPriceAndNotes(target);
      renderToppingsPanel();
    });
    extrasChips.appendChild(chip);
  });

  toppingsPanelEl.appendChild(sauceGroup);

  // Free regular toppings – each topping is a chip (toggle on/off)
  const regularGroup = document.createElement("div");
  regularGroup.className = "toppings-group";
  const regTitle = document.createElement("h4");
  regTitle.textContent = "إضافات عادية (مجانا)";
  regularGroup.appendChild(regTitle);

  const freeArr = Array.isArray(item.pastaFreeToppings)
    ? item.pastaFreeToppings
    : [];

  const hasFree = (id) => freeArr.some((t) => t.id === id);

  const baseRegularForPasta = REGULAR_TOPPINGS.filter((t) => !["cheese_little", "cheese_more"].includes(t.id));
  const pastaRegularList = baseRegularForPasta;


  pastaRegularList.forEach((top) => {
    const chip = document.createElement("button");
    chip.className = "topping-chip";
    chip.textContent = (norm.label || top.label || labelArById(norm.id || top.id));

    if (hasFree(top.id)) {
      chip.classList.add("topping-chip-active");
    }

    chip.addEventListener("click", () => {
      const target = currentOrderItems[selectedOrderIndex];
      if (!target) return;
      let arr = Array.isArray(target.pastaFreeToppings)
        ? target.pastaFreeToppings
        : [];
      if (arr.some((t) => t.id === top.id)) {
        arr = arr.filter((t) => t.id !== top.id);
      } else {
        arr = arr.concat([{ id: top.id, label: top.label }]);
      }
      target.pastaFreeToppings = arr;
      updatePastaPriceAndNotes(target);
      renderToppingsPanel();
    });

    regularGroup.appendChild(chip);
  });

  toppingsPanelEl.appendChild(regularGroup);

  // Paid toppings – chips with price label, toggle add/remove
  const paidGroup = document.createElement("div");
  paidGroup.className = "toppings-group toppings-group-paid";
  const paidTitle = document.createElement("h4");
  paidTitle.textContent = "إضافات مع سعر";
  paidGroup.appendChild(paidTitle);

  const PAID_TOPPINGS = [
    { id: "pasta_extra_shrimp", label: "شرمس", price: 10 },
    { id: "pasta_extra_meat", label: "لحمه", price: 10 },
    { id: "pasta_extra_shrimp_kful", label: "شرمس كفول", price: 20 }
  ];

  const paidArr = Array.isArray(item.pastaPaidToppings)
    ? item.pastaPaidToppings
    : [];
  const hasPaid = (id) => paidArr.some((t) => t.id === id);

  PAID_TOPPINGS.forEach((top) => {
    const chip = document.createElement("button");
    chip.className = "topping-chip";
    chip.textContent = `${top.label}`; // price hidden in UI

    if (hasPaid(top.id)) {
      chip.classList.add("topping-chip-active");
    }

    chip.addEventListener("click", () => {
      const target = currentOrderItems[selectedOrderIndex];
      if (!target) return;
      let arr = Array.isArray(target.pastaPaidToppings)
        ? target.pastaPaidToppings
        : [];
      if (arr.some((t) => t.id === top.id)) {
        arr = arr.filter((t) => t.id !== top.id);
      } else {
        arr = arr.concat([{ id: top.id, label: top.label, price: top.price }]);
      }
      target.pastaPaidToppings = arr;
      updatePastaPriceAndNotes(target);
      renderToppingsPanel();
    });

    paidGroup.appendChild(chip);
  });

  toppingsPanelEl.appendChild(paidGroup);
}


function updateSaladPriceAndNotes(item) {
  const basePrice = item.basePrice != null ? item.basePrice : item.price || 0;
  const paid = Array.isArray(item.saladPaidToppings)
    ? item.saladPaidToppings.reduce((sum, t) => sum + (t.price || 0), 0)
    : 0;

  item.price = basePrice + paid;

  const parts = [];

  // removed defaults
  const removedArr = Array.isArray(item.saladRemoved)
    ? item.saladRemoved
    : [];
  if (removedArr.length) {
    parts.push("بلا: " + removedArr.join("، "));
  }

  // free additions
  const freeArr = Array.isArray(item.saladFreeToppings)
    ? item.saladFreeToppings.map((t) => t.label)
    : [];
  if (freeArr.length) {
    parts.push("مع: " + freeArr.join("، "));
  }

  // paid additions
  const paidArr = Array.isArray(item.saladPaidToppings)
    ? item.saladPaidToppings.map((t) => t.label + " (+" + t.price + ")")
    : [];
  if (paidArr.length) {
    parts.push("إضافات مدفوعة: " + paidArr.join("، "));
  }

  item.notes = parts.length ? parts.join("\n") : null;
  renderCurrentOrder();
}

function renderSaladToppingsPanel(item) {
  const title = document.createElement("h3");
  title.textContent = "إضافات للسلطة المحددة";
  toppingsPanelEl.appendChild(title);

  const nameLine = document.createElement("div");
  nameLine.className = "toppings-current-item";
  nameLine.textContent = item.nameAr || "";
  toppingsPanelEl.appendChild(nameLine);


  // Base defaults info (خسة، بندورة، خيار، تيرس، زتون أخضر)
  const baseInfo = document.createElement("p");
  baseInfo.className = "toppings-hint";
  baseInfo.textContent = "السلطة تأتي افتراضيًا مع: خسة، بندورة، خيار، تيرس، زتون أخضر.";
  toppingsPanelEl.appendChild(baseInfo);

  // Removal group
  const removeGroup = document.createElement("div");
  removeGroup.className = "toppings-group toppings-group-remove";
  const removeTitle = document.createElement("h4");
  removeTitle.textContent = "إزالة مكوّنات";
  removeGroup.appendChild(removeTitle);

  const REMOVABLE = [
    { id: "lettuce", label: "خسة" },
    { id: "tomato", label: "بندورة" },
    { id: "cucumber", label: "خيار" },
    { id: "corn", label: "تيرس" },
    { id: "green_olives", label: "زتون أخضر" }
  ];

  const removedArr = Array.isArray(item.saladRemoved)
    ? item.saladRemoved
    : [];

  const isRemoved = (label) => removedArr.includes(label);

    REMOVABLE.forEach((ing) => {
    const row = document.createElement("div");
    row.className = "topping-row topping-chip topping-chip-remove";

    const lbl = document.createElement("span");
    lbl.className = "topping-label";
    lbl.textContent = ing.label;
    row.appendChild(lbl);

    row.addEventListener("click", () => {
      const target = currentOrderItems[selectedOrderIndex];
      if (!target) return;
      let arr = Array.isArray(target.saladRemoved)
        ? target.saladRemoved
        : [];
      if (arr.includes(ing.label)) {
        arr = arr.filter((l) => l !== ing.label);
      } else {
        arr = arr.concat([ing.label]);
      }
      target.saladRemoved = arr;
      updateSaladPriceAndNotes(target);
      renderToppingsPanel();
    });

    if (isRemoved(ing.label)) {
      row.classList.add("active");
    }

    removeGroup.appendChild(row);
  });

  toppingsPanelEl.appendChild(removeGroup);


  // Free additions
  const freeGroup = document.createElement("div");
  freeGroup.className = "toppings-group toppings-group-free";
  const freeTitle = document.createElement("h4");
  freeTitle.textContent = "إضافات مجانية";
  freeGroup.appendChild(freeTitle);

  const FREE_TOPPINGS = [
    { id: "mushroom", label: "فطر" },
    { id: "jamba", label: "جمبا" },
    { id: "pepper", label: "فلفل" },
    { id: "black_olives", label: "زتون أسمر" },
    { id: "onion", label: "بصل" }
  ];

  const freeArr = Array.isArray(item.saladFreeToppings)
    ? item.saladFreeToppings
    : [];
  const hasFree = (id) => freeArr.some((t) => t.id === id);

    FREE_TOPPINGS.forEach((top) => {
    const row = document.createElement("div");
    row.className = "topping-row topping-chip";

    const lbl = document.createElement("span");
    lbl.className = "topping-label";
    lbl.textContent = top.label;
    row.appendChild(lbl);

    row.addEventListener("click", () => {
      const target = currentOrderItems[selectedOrderIndex];
      if (!target) return;
      let arr = Array.isArray(target.saladFreeToppings)
        ? target.saladFreeToppings
        : [];
      if (arr.some((t) => t.id === top.id)) {
        arr = arr.filter((t) => t.id !== top.id);
      } else {
        arr = arr.concat([{ id: top.id, label: top.label }]);
      }
      target.saladFreeToppings = arr;
      updateSaladPriceAndNotes(target);
      renderToppingsPanel();
    });

    if (hasFree(top.id)) {
      row.classList.add("active");
    }

    freeGroup.appendChild(row);
  });

  toppingsPanelEl.appendChild(freeGroup);


  // Paid additions
  const paidGroup = document.createElement("div");
  paidGroup.className = "toppings-group toppings-group-paid";
  const paidTitle = document.createElement("h4");
  paidTitle.textContent = "إضافات مع سعر";
  paidGroup.appendChild(paidTitle);

  const PAID_TOPPINGS = [
    { id: "salad_egg", label: "بيضة", price: 5 }
  ];

  const paidArr = Array.isArray(item.saladPaidToppings)
    ? item.saladPaidToppings
    : [];
  const hasPaid = (id) => paidArr.some((t) => t.id === id);

    PAID_TOPPINGS.forEach((top) => {
    const row = document.createElement("div");
    row.className = "topping-row topping-chip";

    const lbl = document.createElement("span");
    lbl.className = "topping-label";
    lbl.textContent = top.label + " +" + top.price;
    row.appendChild(lbl);

    row.addEventListener("click", () => {
      const target = currentOrderItems[selectedOrderIndex];
      if (!target) return;
      let arr = Array.isArray(target.saladPaidToppings)
        ? target.saladPaidToppings
        : [];
      if (arr.some((t) => t.id === top.id)) {
        arr = arr.filter((t) => t.id !== top.id);
      } else {
        arr = arr.concat([{ id: top.id, label: top.label, price: top.price }]);
      }
      target.saladPaidToppings = arr;
      updateSaladPriceAndNotes(target);
      renderToppingsPanel();
    });

    if (hasPaid(top.id)) {
      row.classList.add("active");
    }

    paidGroup.appendChild(row);
  });

  toppingsPanelEl.appendChild(paidGroup);

}


function updateBatataPriceAndNotes(item) {
  const basePrice = item.basePrice != null ? item.basePrice : item.price || 0;
  const paid = Array.isArray(item.batataPaidToppings)
    ? item.batataPaidToppings.reduce((sum, t) => sum + (t.price || 0), 0)
    : 0;

  item.price = basePrice + paid;

  const parts = [];

  const removedArr = Array.isArray(item.batataRemoved)
    ? item.batataRemoved
    : [];
  if (removedArr.length) {
    parts.push("بلا: " + removedArr.join("، "));
  }

  const freeArr = Array.isArray(item.batataFreeToppings)
    ? item.batataFreeToppings.map((t) => t.label)
    : [];
  if (freeArr.length) {
    parts.push("مع: " + freeArr.join("، "));
  }

  const paidArr = Array.isArray(item.batataPaidToppings)
    ? item.batataPaidToppings.map((t) => t.label + " (+" + t.price + ")")
    : [];
  if (paidArr.length) {
    parts.push("إضافات خاصة: " + paidArr.join("، "));
  }

  item.notes = parts.length ? parts.join("\n") : null;
  renderCurrentOrder();
}

function renderBatataToppingsPanel(item) {
  const title = document.createElement("h3");
  title.textContent = "إضافات للبطاطا المحددة";
  toppingsPanelEl.appendChild(title);

  const nameLine = document.createElement("div");
  nameLine.className = "toppings-current-item";
  nameLine.textContent = item.nameAr || "";
  toppingsPanelEl.appendChild(nameLine);

  const baseInfo = document.createElement("p");
  baseInfo.className = "toppings-hint";
  baseInfo.textContent = "البطاطا تأتي مع: جبنه جوا، جبنه من فوق، شمنت.";
  toppingsPanelEl.appendChild(baseInfo);

  // removable defaults
  const removeGroup = document.createElement("div");
  removeGroup.className = "toppings-group toppings-group-remove";
  const removeTitle = document.createElement("h4");
  removeTitle.textContent = "إزالة مكوّنات";
  removeGroup.appendChild(removeTitle);

  const REMOVABLE = [
    { id: "cream", label: "شمنت" },
    { id: "cheese_inside", label: "جبنه جوا" },
    { id: "cheese_top", label: "جبنه من فوق" }
  ];

  const removedArr = Array.isArray(item.batataRemoved)
    ? item.batataRemoved
    : [];

  const isRemoved = (label) => removedArr.includes(label);

  REMOVABLE.forEach((ing) => {
    const row = document.createElement("div");
    row.className = "topping-row topping-chip topping-chip-remove";

    const lbl = document.createElement("span");
    lbl.className = "topping-label";
    lbl.textContent = ing.label;
    row.appendChild(lbl);

    row.addEventListener("click", () => {
      const target = currentOrderItems[selectedOrderIndex];
      if (!target) return;
      let arr = Array.isArray(target.batataRemoved)
        ? target.batataRemoved
        : [];
      if (arr.includes(ing.label)) {
        arr = arr.filter((l) => l !== ing.label);
      } else {
        arr = arr.concat([ing.label]);
      }
      target.batataRemoved = arr;
      updateBatataPriceAndNotes(target);
      renderToppingsPanel();
    });

    if (isRemoved(ing.label)) {
      row.classList.add("active");
    }

    removeGroup.appendChild(row);
  });

  toppingsPanelEl.appendChild(removeGroup);

  // free additions (regular pizza toppings + خمأه)
  const freeGroup = document.createElement("div");
  freeGroup.className = "toppings-group toppings-group-free";
  const freeTitle = document.createElement("h4");
  freeTitle.textContent = "إضافات عادية";
  freeGroup.appendChild(freeTitle);

  const FREE_TOPPINGS = REGULAR_TOPPINGS.concat([
    { id: "khameh", label: "خمأه", kind: "regular" }
  ]);

  const freeArr = Array.isArray(item.batataFreeToppings)
    ? item.batataFreeToppings
    : [];
  const hasFree = (id) => freeArr.some((t) => t.id === id);

  FREE_TOPPINGS.forEach((top) => {
    const row = document.createElement("div");
    row.className = "topping-row topping-chip";

    const lbl = document.createElement("span");
    lbl.className = "topping-label";
    lbl.textContent = top.label;
    row.appendChild(lbl);

    row.addEventListener("click", () => {
      const target = currentOrderItems[selectedOrderIndex];
      if (!target) return;
      let arr = Array.isArray(target.batataFreeToppings)
        ? target.batataFreeToppings
        : [];
      if (arr.some((t) => t.id === top.id)) {
        arr = arr.filter((t) => t.id !== top.id);
      } else {
        arr = arr.concat([{ id: top.id, label: top.label }]);
      }
      target.batataFreeToppings = arr;
      updateBatataPriceAndNotes(target);
      renderToppingsPanel();
    });

    if (hasFree(top.id)) {
      row.classList.add("active");
    }

    freeGroup.appendChild(row);
  });

  toppingsPanelEl.appendChild(freeGroup);

  // paid special additions (shrimp / meat)
  const paidGroup = document.createElement("div");
  paidGroup.className = "toppings-group toppings-group-paid";
  const paidTitle = document.createElement("h4");
  paidTitle.textContent = "תוספות מיוחדות (10 ₪)";
  paidGroup.appendChild(paidTitle);

  const PAID_TOPPINGS = [
    { id: "batata_shrimp", label: "شرمس", price: 10 },
    { id: "batata_meat", label: "لحمه", price: 10 }
  ];

  const paidArr = Array.isArray(item.batataPaidToppings)
    ? item.batataPaidToppings
    : [];
  const hasPaid = (id) => paidArr.some((t) => t.id === id);

  PAID_TOPPINGS.forEach((top) => {
    const row = document.createElement("div");
    row.className = "topping-row topping-chip";

    const lbl = document.createElement("span");
    lbl.className = "topping-label";
    lbl.textContent = `${top.label}`;
    row.appendChild(lbl);

    row.addEventListener("click", () => {
      const target = currentOrderItems[selectedOrderIndex];
      if (!target) return;
      let arr = Array.isArray(target.batataPaidToppings)
        ? target.batataPaidToppings
        : [];
      if (arr.some((t) => t.id === top.id)) {
        arr = arr.filter((t) => t.id !== top.id);
      } else {
        arr = arr.concat([{ id: top.id, label: top.label, price: top.price }]);
      }
      target.batataPaidToppings = arr;
      updateBatataPriceAndNotes(target);
      renderToppingsPanel();
    });

    if (hasPaid(top.id)) {
      row.classList.add("active");
    }

    paidGroup.appendChild(row);
  });

  toppingsPanelEl.appendChild(paidGroup);
}


function getMenuItemBasePrice(item) {
  // תמיכה גם בתפריטים ישנים שבהם השדה נקרא "price" ולא basePrice
  if (item.basePrice != null) return item.basePrice;
  if (item.price != null) return item.price;
  return 0;
}

function renderMenuItemsByCategory(categoryId) {
  menuItemsEl.innerHTML = "";
  const items = menuDocs
    .filter((i) => i.category === categoryId)
    .sort((a, b) => {
      const sa = typeof a.sortOrder === "number" ? a.sortOrder : Number(a.sortOrder || 0) || 0;
      const sb = typeof b.sortOrder === "number" ? b.sortOrder : Number(b.sortOrder || 0) || 0;
      if (sa !== sb) return sa - sb;
      const na = (a.nameAr || a.nameHe || a.name || "").toString();
      const nb = (b.nameAr || b.nameHe || b.name || "").toString();
      return na.localeCompare(nb, "he", { numeric: true, sensitivity: "base" });
    });
  if (!items.length) {
    const p = document.createElement("p");
    p.className = "empty-text";
    p.textContent = "אין פריטים בקטגוריה הזאת.";
    menuItemsEl.appendChild(p);
    return;
  }
  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "menu-item";
    div.addEventListener("click", () => {
      // אינטראקציה ויזואלית בלחיצה על פריט בתפריט
      div.classList.add("menu-item-clicked");
      setTimeout(() => {
        div.classList.remove("menu-item-clicked");
      }, 180);
      addItemToOrder(item);
    });

    const title = document.createElement("div");
    title.className = "menu-item-title";
    title.textContent = item.nameAr || "";

    const price = document.createElement("div");
    price.className = "menu-item-price";
    price.textContent = `${getMenuItemBasePrice(item)} ₪`;

    div.appendChild(title);
    div.appendChild(price);
    menuItemsEl.appendChild(div);
  });
}

// Add item to order
function addItemToOrder(menuItem) {
  const basePrice = getMenuItemBasePrice(menuItem);

  currentOrderItems.push({
    id: menuItem.id,
    nameAr: menuItem.nameAr,
    category: menuItem.category || null,
    size: menuItem.size || null,
    qty: 1,
    basePrice: basePrice,
    price: basePrice,
    toppings: [],
    extrasText: null,
    notes: null,
    extraNote: null,
    hasFreeDrink: isItemEligibleForFreeDrink(menuItem),
    freeDrink: null,
  });

  // הפריט החדש הוא תמיד האחרון במערך
  selectedOrderIndex = currentOrderItems.length - 1;
  const newItem = currentOrderItems[selectedOrderIndex];

  // אם זו פיצה – לחשב מחיר לפי התוספות (גם אם כרגע אין תוספות)
  if (isPizzaLikeItem(newItem)) {
    recalcPizzaPriceWithToppings(newItem);
  }

  // מרנדרים את ההזמנה למסך
  renderCurrentOrder();

  // אחרי שהשורה נוספה למסך – אם לפריט יש "תוספות" (פיצה, פסטה, סלט, בטטה)
  // נפתח אוטומטית את חלון התוספות
  if (
    isPizzaLikeItem(newItem) ||
    newItem.category === "pasta" ||
    newItem.category === "salad" ||
    isBatataItem(newItem)
  ) {
    openToppingsModal(selectedOrderIndex);
  }
}

function chooseFreeDrinkForItem(index) {
  if (index == null || index < 0 || index >= currentOrderItems.length) return;
  const item = currentOrderItems[index];
  if (!item || !item.hasFreeDrink) return;

  const optionsText = FREE_DRINK_OPTIONS
    .map((d, i) => `${i + 1}. ${d}`)
    .join("\n");

  const current = item.freeDrink ? ` (حالي: ${item.freeDrink})` : "";

  const input = window.prompt(
    "إختر مشروب 1.5 لتر مجاني لهذه البيتزا:" +
      "\n" +
      optionsText +
      "\n\nأكتب رقم المشروب أو إضغط Cancel للتخطي." +
      current,
    ""
  );

  if (input === null || input === "") {
    // המשתמש לחץ ביטול / השאיר ריק – מותר לדלג
    return;
  }

  const num = parseInt(input, 10);
  if (!isNaN(num) && num >= 1 && num <= FREE_DRINK_OPTIONS.length) {
    item.freeDrink = FREE_DRINK_OPTIONS[num - 1];
    renderCurrentOrder();
  } else {
    alert("رقم غير صحيح للمشروب.");
  }
}


function renderCurrentOrder() {
  orderItemsEl.innerHTML = "";
  if (!currentOrderItems.length) {
    const p = document.createElement("p");
    p.className = "empty-text";
    p.textContent = "ما فيش طلب لسا. إضغط על منتج من התפריט.";
    orderItemsEl.appendChild(p);
    orderTotalEl.textContent = "0 ₪";
    if (toppingsPanelEl) {
      toppingsPanelEl.innerHTML = "";
    }
    return;
  }
  let total = 0;
  currentOrderItems.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "order-item";
    if (idx === selectedOrderIndex) {
      row.classList.add("order-item-selected");
    }

    row.addEventListener("click", () => {
      selectedOrderIndex = idx;
      renderCurrentOrder();
    });

    const header = document.createElement("div");
    header.className = "order-item-header";

    const main = document.createElement("div");
    main.className = "order-item-main";

    // שם פריט עם לוגיקה מיוחדת לפסטה / رافيولي: תמיד (مكرام) או (لو مكرام)
    let displayName = item.nameAr || item.name || "";
    // מנקה סיומת קיימת כדי שלא יהיה כפול
    displayName = displayName.replace(/\s*\((?:لو\s*مكرام|مكرام)\)\s*$/, "");

    if (item.category === "pasta") {
      const paidArr = Array.isArray(item.pastaPaidToppings)
        ? item.pastaPaidToppings
        : [];
      const hasCream = paidArr.some(
        (t) => t && (t.id === "pasta_extra_cream" || (t.label && t.label.includes("مكرام")))
      );
      displayName = `${displayName} (${hasCream ? "مكرام" : "لو مكرام"})`;
    }
    main.textContent = displayName;

    const price = document.createElement("div");
    price.className = "order-item-price";

    const qty = item.qty != null && item.qty > 0 ? item.qty : 1;
    const unitPrice = Number(item.price || 0);
    const lineTotal = unitPrice * qty;

    const priceMain = document.createElement("div");
    // Hide 0 prices (but keep ability to edit price)
    priceMain.textContent = lineTotal > 0 ? `${lineTotal} ₪` : "";
    price.appendChild(priceMain);

    if (qty > 1) {
      const priceMulti = document.createElement("div");
      priceMulti.className = "order-item-multi";
      const unit = Number(item.price || 0);
      priceMulti.textContent = unit > 0 ? `${unit} × ${qty}` : "";
      price.appendChild(priceMulti);
    }

    header.appendChild(main);
    header.appendChild(price);

    const meta = document.createElement("div");
    meta.className = "order-item-meta";

    let hasMetaContent = false;

    if (item.notes) {
      const notesDiv = document.createElement("div");
      notesDiv.className = "order-item-notes";
      // notes כבר מכיל HTML (למשל תוספות עם <span>), לכן נשתמש ב-innerHTML
      notesDiv.innerHTML = item.notes;
      meta.appendChild(notesDiv);
      hasMetaContent = true;
    }

    if (item.hasFreeDrink) {
      const drinkLine = document.createElement("div");
      drinkLine.className = "order-item-free-drink-line";
      drinkLine.textContent =
        "شتيا: " + (item.freeDrink || "لم يتم الإختيار بعد.");
      meta.appendChild(drinkLine);
      hasMetaContent = true;
    }

    if (item.extraNote) {
      const noteDiv = document.createElement("div");
      noteDiv.className = "order-item-extra-note";
      noteDiv.textContent = `ملاحظة: ${item.extraNote}`;
      meta.appendChild(noteDiv);
      hasMetaContent = true;
    }

    // אם אין פרטים – לא מציגים שום טקסט, משאירים את השורה נקייה

    const actions = document.createElement("div");
    actions.className = "order-item-actions";
    if (isPizzaLikeItem(item) || item.category === "pasta" || item.category === "salad" || isBatataItem(item)) {
      const btnToppings = document.createElement("button");
      btnToppings.className = "btn btn-secondary btn-small btn-toppings";
      btnToppings.textContent = "إضافات";
      btnToppings.addEventListener("click", (ev) => {
        ev.stopPropagation();
        openToppingsModal(idx);
      });
      actions.appendChild(btnToppings);
    }

    if (item.hasFreeDrink) {
      const btnDrink = document.createElement("button");
      btnDrink.className = "btn btn-secondary btn-small";
      btnDrink.textContent = "مشروب مجاني";
      btnDrink.addEventListener("click", (ev) => {
        ev.stopPropagation();
        openFreeDrinkModal(idx);
      });
      actions.appendChild(btnDrink);
    }

    const btnDetails = document.createElement("button");
    btnDetails.className = "btn btn-secondary btn-small";
    btnDetails.textContent = "تفاصيل";
    btnDetails.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const existing = item.extraNote || "";
      const txt = window.prompt("اكتب تفاصيل إضافية لهذا الصنف (اختياري):", existing);
      if (txt !== null) {
        item.extraNote = txt.trim() || null;
        renderCurrentOrder();
      }
    });

    const btnPrice = document.createElement("button");
    btnPrice.className = "btn btn-secondary btn-small";
    btnPrice.textContent = "سعر";
    btnPrice.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const current = item.price != null ? item.price : 0;
      const input = window.prompt("תכתוב מחיר ליחידה (₪):", current);
      if (input !== null) {
        const value = parseFloat(input);
        if (!isNaN(value) && value >= 0) {
          item.price = value;
          renderCurrentOrder();
        }
      }
    });

    const btnRemove = document.createElement("button");
    btnRemove.className = "btn btn-danger btn-small";
    btnRemove.textContent = "حذف";
    btnRemove.addEventListener("click", (ev) => {
      ev.stopPropagation();
      currentOrderItems.splice(idx, 1);
      if (selectedOrderIndex === idx) {
        selectedOrderIndex = null;
      } else if (selectedOrderIndex > idx) {
        selectedOrderIndex -= 1;
      }
      renderCurrentOrder();
    });

    // כפתור כמות ("عدد") – מאפשר לערוך את הכמות של הפריט
    const qtyBtn = document.createElement("button");
    qtyBtn.className = "btn btn-secondary btn-small order-item-qty-label";
    qtyBtn.textContent = `+${item.qty || 1}-`;
    qtyBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const currentQty = item.qty != null ? item.qty : 1;
      const input = window.prompt("اكتب الكمية لهذا الصنف:", currentQty);
      if (input === null) return;
      const value = parseInt(input, 10);
      if (!isNaN(value) && value > 0) {
        item.qty = value;
        renderCurrentOrder();
      }
    });

    actions.appendChild(qtyBtn);
    actions.appendChild(btnDetails);
    actions.appendChild(btnPrice);
    actions.appendChild(btnRemove);

    row.appendChild(header);
    row.appendChild(meta);
    row.appendChild(actions);

    orderItemsEl.appendChild(row);

    total += lineTotal;
  });

  const promoResult = calculateOrderTotalWithPromotions(currentOrderItems);
  const totalToShow = promoResult && typeof promoResult.total === "number" ? promoResult.total : total;
  orderTotalEl.textContent = `${totalToShow} ₪`;

  if (toppingsModal && !toppingsModal.classList.contains("hidden") && selectedOrderIndex != null) {
    renderToppingsPanel();
  } else if (toppingsPanelEl) {
    toppingsPanelEl.innerHTML = "";
  }
}
function loadOrderIntoCurrent(order) {
  if (!order) return;

  if (Array.isArray(order.items)) {
    currentOrderItems = order.items.map((it) => ({
      id: it.id,
      nameAr: it.nameAr || it.name || it.title || "",
      category: it.category || null,
      size: it.size || null,
      qty: it.qty || 1,
      basePrice: it.basePrice != null ? it.basePrice : it.price,
      price: it.price,
      toppings: Array.isArray(it.toppings) ? it.toppings : [],
      // Pasta/Ravioli persisted fields
      pastaSauceId: it.pastaSauceId || it.ravioliSauceId || it.sauceId || null,
      ravioliSauceId: it.ravioliSauceId || null,
      pastaSauce: it.pastaSauce || null,
      pastaFreeToppings: Array.isArray(it.pastaFreeToppings) ? it.pastaFreeToppings : [],
      pastaPaidToppings: Array.isArray(it.pastaPaidToppings) ? it.pastaPaidToppings : [],
      // Salad/Batata fields
      saladRemoved: Array.isArray(it.saladRemoved) ? it.saladRemoved : [],
      saladFreeToppings: Array.isArray(it.saladFreeToppings) ? it.saladFreeToppings : [],
      saladPaidToppings: Array.isArray(it.saladPaidToppings) ? it.saladPaidToppings : [],
      batataRemoved: Array.isArray(it.batataRemoved) ? it.batataRemoved : [],
      batataPaidToppings: Array.isArray(it.batataPaidToppings) ? it.batataPaidToppings : [],
      extrasText: it.extrasText || it.notes || null,
      notes: it.notes || null,
      extraNote: it.extraNote || null,
      hasFreeDrink: !!it.hasFreeDrink,
      freeDrink: it.freeDrink || null,
    }));
  } else {
    currentOrderItems = [];
  }

  if (order.serviceType) {
    setServiceType(order.serviceType);
  }
  if (order.paymentStatus) {
    setPaymentStatus(order.paymentStatus);
  }

  currentDeliveryFee = Number(order.deliveryFee || 0) || 0;
  updateDeliveryFeeDisplay();

  renderCurrentOrder();
  if (finishOrderBtn) {
    finishOrderBtn.classList.add("hidden");
  }
  if (updateOrderBtn) {
    updateOrderBtn.classList.remove("hidden");
  }
}

function clearCurrentOrder() {
  // איפוס מלא של ההזמנה הנוכחית + סוג שירות/תשלום
  currentOrderItems = [];
  currentServiceType = null;
  currentPaymentStatus = null;
  currentDeliveryFee = 0;
  updateDeliveryFeeDisplay();

  if (orderTypeLabelEl) {
    orderTypeLabelEl.textContent = "نوع: לسا مش محدד";
  }

  // הסרת סימון ירוק מכפתורי סוג השירות
  if (serviceTypeButtons) {
    serviceTypeButtons.querySelectorAll("button").forEach((btn) => {
      btn.classList.remove("active");
    });
  }

  // הסרת סימון ירוק מכפתורי מצב התשלום
  if (paymentStatusButtons) {
    paymentStatusButtons.querySelectorAll("button").forEach((btn) => {
      btn.classList.remove("active");
    });
  }

  // החבאת שדות הלקוח עד שייבחר סוג שירות חדש
  if (customerFieldsDelivery) customerFieldsDelivery.style.display = "none";
  if (customerFieldsTakeaway) customerFieldsTakeaway.style.display = "none";
  if (customerFieldsDinein) customerFieldsDinein.style.display = "none";

  renderCurrentOrder();
  if (finishOrderBtn) {
    finishOrderBtn.classList.remove("hidden");
  }
  if (updateOrderBtn) {
    updateOrderBtn.classList.add("hidden");
  }
  if (cancelEditBtn) {
    cancelEditBtn.classList.add("hidden");
  }
  preEditSnapshot = null;
}

// modal helpers
function resetOrderMetaFormForNewOrder() {
  // מאפס רק את פרטי הלקוח וסוג המשלוח/תשלום במודל – בלי לגעת בפריטי ההזמנה עצמם
  currentServiceType = null;
  currentPaymentStatus = null;

  if (orderTypeLabelEl) {
    orderTypeLabelEl.textContent = "نوع: לسا مش محدד";
  }

  if (serviceTypeButtons) {
    serviceTypeButtons.querySelectorAll("button").forEach((btn) => {
      btn.classList.remove("active");
    });
  }

  if (paymentStatusButtons) {
    paymentStatusButtons.querySelectorAll("button").forEach((btn) => {
      btn.classList.remove("active");
    });
  }

  if (customerFieldsDelivery) customerFieldsDelivery.style.display = "none";
  if (customerFieldsTakeaway) customerFieldsTakeaway.style.display = "none";
  if (customerFieldsDinein) customerFieldsDinein.style.display = "none";

  // איפוס שדות משלוח
  if (custNameDelivery) custNameDelivery.value = "";
  if (custPhoneDelivery) {
    custPhoneDelivery.value = "";
    if (custPhoneDeliveryError) custPhoneDeliveryError.textContent = "";
  }
  if (custStreet) custStreet.value = "";
  if (custHouseNumber) custHouseNumber.value = "";
  if (custFloor) custFloor.value = "";
  if (custApartment) custApartment.value = "";
  if (custEntrance) custEntrance.value = "";
  if (custCity) custCity.value = "";

  // איפוס שדות טייקאווי
  if (custNameTakeaway) custNameTakeaway.value = "";
  if (custPhoneTakeaway) {
    custPhoneTakeaway.value = "";
    if (custPhoneTakeawayError) custPhoneTakeawayError.textContent = "";
  }

  // איפוס שדות ישיבה
  if (custTableNumber) custTableNumber.value = "";
  if (custNameDinein) custNameDinein.value = "";

  if (paymentNotes) paymentNotes.value = "";

  // ברירת מחדל – כל הזמנה חדשה תודפס ב-80mm
  setPrintMode("usb");
}

function openMetaModal() {
  if (!currentOrderItems.length) {
    alert("מה فيש طلب. תוסיף פריטים קודם.");
    return;
  }

  // הזמנה חדשה (לא עריכה מתוך 'طلبات مفتوحة') – נפתח מודל נקי לגמרי
  if (!editingOrderId) {
    resetOrderMetaFormForNewOrder();
  }

  orderMetaModal.classList.remove("hidden");
}

function closeMetaModal() {
  orderMetaModal.classList.add("hidden");
}

function setServiceType(type) {
  currentServiceType = type;
  if (type === "delivery") orderTypeLabelEl.textContent = "نوع: توصيل";
  else if (type === "takeaway") orderTypeLabelEl.textContent = "نوع: خنوت";
  else if (type === "dinein") orderTypeLabelEl.textContent = "نوع: يقعد";
  else orderTypeLabelEl.textContent = "نوع: لسا مش محدد";

  serviceTypeButtons.querySelectorAll("button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.type === type);
  });

  customerFieldsDelivery.style.display = type === "delivery" ? "block" : "none";
  customerFieldsTakeaway.style.display = type === "takeaway" ? "block" : "none";
  customerFieldsDinein.style.display = type === "dinein" ? "block" : "none";
}

function setPaymentStatus(status) {
  currentPaymentStatus = status;
  paymentStatusButtons.querySelectorAll("button").forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.status === status)
  );
}

function setPrintMode(mode) {
  currentPrintMode = mode;
  printModeA4Btn.classList.toggle("active", mode === "a4");
  printModePosBtn.classList.toggle("active", mode === "pos");
  if (printModeUsbBtn) printModeUsbBtn.classList.toggle("active", mode === "usb");
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 && digits.startsWith("05");
}


// Modal + finish order listeners

// Pizza zone buttons listeners
if (pizzaZoneButtons && pizzaZoneButtons.forEach) {
  const selectZone = (btn, ev) => {
    try {
      if (ev) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    } catch (e) {}

    const cov = btn.dataset.coverage || "full";
    activeToppingCoverage = cov;
    pizzaZoneButtons.forEach((b2) => {
      b2.classList.toggle("active-zone", b2 === btn);
    });
    if (currentZoneLabelEl) {
      currentZoneLabelEl.textContent = covLabel(cov, "ar") || btn.textContent.trim();
    }
    zoneSummaryEnabled = true;
    if (selectedOrderIndex != null) {
      renderToppingsPanel();
    }
  };

  // iPhone/iPad: prefer pointer/touch events to avoid "wrong" taps caused by fast scroll/zoom quirks.
  pizzaZoneButtons.forEach((btn) => {
    btn.addEventListener("pointerdown", (ev) => selectZone(btn, ev), { passive: false });
    btn.addEventListener("touchstart", (ev) => selectZone(btn, ev), { passive: false });
    btn.addEventListener("click", (ev) => selectZone(btn, ev));
  });
}


if (toppingsCloseBtn) {
  toppingsCloseBtn.addEventListener("click", () => {
    closeToppingsModal();
  });
}

if (toppingsModal) {
  toppingsModal.addEventListener("click", (ev) => {
    if (ev.target.classList && ev.target.classList.contains("modal-backdrop")) {
      closeToppingsModal();
    }
  });
}

if (freeDrinkCloseBtn) {
  freeDrinkCloseBtn.addEventListener("click", () => {
    closeFreeDrinkModal();
  });
}

if (freeDrinkClearBtn) {
  freeDrinkClearBtn.addEventListener("click", () => {
    if (
      freeDrinkSelectedIndex != null &&
      currentOrderItems[freeDrinkSelectedIndex]
    ) {
      currentOrderItems[freeDrinkSelectedIndex].freeDrink = null;
      renderCurrentOrder();
    }
    closeFreeDrinkModal();
  });
}

if (freeDrinkModal) {
  freeDrinkModal.addEventListener("click", (ev) => {
    if (ev.target.classList && ev.target.classList.contains("modal-backdrop")) {
      closeFreeDrinkModal();
    }
  });
}


if (deliveryFeeBtn) {
  deliveryFeeBtn.addEventListener("click", () => {
    const currentVal = currentDeliveryFee > 0 ? String(currentDeliveryFee) : "";
    const input = window.prompt(
      "הכנס דמי משלוח (₪). השאר ריק או 0 בלי דמי משלוח.",
      currentVal
    );
    if (input === null) return;
    const trimmed = input.trim();
    if (!trimmed) {
      currentDeliveryFee = 0;
      updateDeliveryFeeDisplay();
      return;
    }
    const normalized = trimmed.replace(",", ".");
    const fee = Number(normalized);
    if (isNaN(fee) || fee < 0) {
      alert("סכום לא תקין.");
      return;
    }
    currentDeliveryFee = Math.round(fee * 100) / 100;
    updateDeliveryFeeDisplay();
  });
}

if (finishOrderBtn) {
  finishOrderBtn.addEventListener("click", () => {
    openMetaModal();
  });
}

if (clearOrderBtn) {
  clearOrderBtn.addEventListener("click", () => {
    if (!currentOrderItems.length && !editingOrderId) {
      return;
    }
    const ok = window.confirm("למחוק את כל הפריטים מההזמנה הנוכחית?");
    if (!ok) return;
    // נצא ממצב עריכה אם היינו בתוך הזמנה מ'طلبات مفتوحة'
    editingOrderId = null;
    clearCurrentOrder();
  });
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    if (!editingOrderId) return;
    // exit edit mode without deleting anything (restore previous draft if we have one)
    editingOrderId = null;
    if (preEditSnapshot) {
      restoreDraftSnapshot(preEditSnapshot);
    } else {
      clearCurrentOrder();
    }
    if (finishOrderBtn) finishOrderBtn.classList.remove("hidden");
    if (updateOrderBtn) updateOrderBtn.classList.add("hidden");
    cancelEditBtn.classList.add("hidden");
    preEditSnapshot = null;
  });
}


if (cancelMetaBtn) {
  cancelMetaBtn.addEventListener("click", () => {
    orderMetaModal.classList.add("hidden");
  });
}

if (saveMetaBtn) {
  saveMetaBtn.addEventListener("click", async () => {
    // Prevent double-click creating duplicate orders
    if (__olive_isSavingMeta) return;
    __olive_isSavingMeta = true;

    const prevText = saveMetaBtn.textContent;
    saveMetaBtn.disabled = true;
    saveMetaBtn.classList.add("disabled");
    saveMetaBtn.textContent = "...جاري الحفظ";

    try {
      const ok = await saveOrderToFirestore();
      if (ok) {
        orderMetaModal.classList.add("hidden");
        clearCurrentOrder();
      }
    } catch (e) {
      console.error("saveMetaBtn error:", e);
      alert("حصل خطأ بالحفظ");
    } finally {
      __olive_isSavingMeta = false;
      saveMetaBtn.disabled = false;
      saveMetaBtn.classList.remove("disabled");
      saveMetaBtn.textContent = prevText || "حفظ و طباعة";
    }
  });
}

if (orderDetailsCloseBtn) {
  orderDetailsCloseBtn.addEventListener("click", () => {
    closeOrderDetailsModal();
  });
}

if (orderDetailsModal) {
  const backdrop = orderDetailsModal.querySelector(".modal-backdrop");
  if (backdrop) {
    backdrop.addEventListener("click", () => {
      closeOrderDetailsModal();
    });
  }
}


async function updateCurrentOrderInFirestore() {
  if (!editingOrderId) {
    alert("אין הזמנה לעריכה מתוך 'طلبات مفتوحة'. לחץ על כפתור 'تفاصيل' קודם.");
    return;
  }

  const orderId = editingOrderId;

  // Persist all print-relevant fields (especially pasta/ravioli sauce + paid toppings)
  const items = currentOrderItems.map((it) => ({
    id: it.id || null,
    nameAr: it.nameAr || it.name || it.title || "",
    category: it.category || null,
    size: it.size || null,
    qty: it.qty,
    basePrice: it.basePrice != null ? it.basePrice : it.price,
    price: it.price,
    toppings: Array.isArray(it.toppings) ? it.toppings : [],
    // Pasta/Ravioli fields (used by print preview + receipt)
    pastaSauceId: it.pastaSauceId || null,
    ravioliSauceId: it.ravioliSauceId || null,
    // legacy (kept for backward compatibility)
    pastaSauce: it.pastaSauce || null,
    pastaFreeToppings: Array.isArray(it.pastaFreeToppings) ? it.pastaFreeToppings : [],
    pastaPaidToppings: Array.isArray(it.pastaPaidToppings) ? it.pastaPaidToppings : [],
    extrasText: it.extrasText || null,
    notes: it.notes || null,
    extraNote: it.extraNote || null,
    hasFreeDrink: !!it.hasFreeDrink,
    freeDrink: it.freeDrink || null,
  }));

  const promoResult = calculateOrderTotalWithPromotions(items);
  const itemsTotal = promoResult.total;
  const deliveryFee = Number(currentDeliveryFee || 0) || 0;
  const total = itemsTotal; // delivery fee is shown separately (not summed)

  try {
    connectionStatusEl.textContent = "מעדכן הזמנה...";
    const ref = doc(db, "orders", editingOrderId);
    await updateDoc(ref, {
      items,
      deliveryFee,
      totalAmount: total,
      updatedAt: serverTimestamp(),
    });
    connectionStatusEl.textContent = "עודכן — מדפיס...";

    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (currentPrintMode === "a4") {
          printOrderTicketA4(orderId, data);
        } else if (currentPrintMode === "usb") {
          printOrderTicketUsb(orderId, data);
        } else if (currentPrintMode === "pos") {
          printOrderTicketPos(orderId, data);
        }
      } else {
        console.warn("updated order doc missing for print", orderId);
      }
    } catch (e) {
      console.error("print after update failed", e);
      alert("שגיאה בהדפסה.");
    }

    connectionStatusEl.textContent = "מחובר ל-Firebase";
    editingOrderId = null;
    clearCurrentOrder();
  } catch (err) {
    console.error("failed to update current order", err);
    alert("בעיה בעדכון ההזמנה.");
  }
}


// כפתור 'עדכן הזמנה' – שומר את ההזמנה הנוכחית למסמך הקיים בלי לסגור אותו
if (updateOrderBtn) {
  updateOrderBtn.addEventListener("click", () => {
    updateCurrentOrderInFirestore();
  });
}


// Toggle buttons inside modal
if (serviceTypeButtons) {
  serviceTypeButtons.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-type]");
    if (!btn) return;
    const type = btn.dataset.type;
    setServiceType(type);
  });
}

if (paymentStatusButtons) {
  paymentStatusButtons.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-status]");
    if (!btn) return;
    const status = btn.dataset.status;
    setPaymentStatus(status);
  });
}

if (printModeA4Btn && printModePosBtn) {
  printModeA4Btn.addEventListener("click", () => setPrintMode("a4"));
  printModePosBtn.addEventListener("click", () => setPrintMode("pos"));
  if (printModeUsbBtn) printModeUsbBtn.addEventListener("click", () => setPrintMode("usb"));
}

// Customers helpers
async function tryFillCustomerByPhone(phoneInput, nameInput, extraAddressFields) {
  const raw = phoneInput.value || "";
  const digits = sanitizePhoneForId(raw);
  if (!digits || digits.length < 9) return;

  try {
    const docRef = doc(db, "customers", digits);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.name && nameInput) nameInput.value = data.name;
      if (data.defaultAddress && extraAddressFields) {
        if (extraAddressFields.street) extraAddressFields.street.value = data.defaultAddress.street || "";
        if (extraAddressFields.houseNumber) extraAddressFields.houseNumber.value = data.defaultAddress.houseNumber || "";
        if (extraAddressFields.city) extraAddressFields.city.value = data.defaultAddress.city || "";
        if (extraAddressFields.floor) extraAddressFields.floor.value = data.defaultAddress.floor || "";
        if (extraAddressFields.apartment) extraAddressFields.apartment.value = data.defaultAddress.apartment || "";
      }
    }
  } catch (err) {
    console.error("Error loading customer", err);
  }
}

async function saveCustomerFromOrder(docData) {
  if (!docData.phone) return;
  const digits = sanitizePhoneForId(docData.phone);
  if (!digits) return;
  try {
    const custRef = doc(db, "customers", digits);
    const payload = {
      phone: digits,
      name: docData.customerName || null,
      defaultAddress: docData.address || null,
      updatedAt: serverTimestamp(),
    };
    // Print preferences (do not use custom headers to avoid CORS preflight issues)
    payload.printOptions = { paper: "80", quality: "HIGH" };

    await setDoc(custRef, payload, { merge: true });
  } catch (err) {
    console.error("Error saving customer", err);
  }
}

// Printing helpers (A4 + POS)
function buildCommonPrintData(orderId, docData) {
  let typeText =
    docData.serviceType === "delivery"
      ? "توصيل"
      : docData.serviceType === "takeaway"
      ? "خنوت"
      : docData.serviceType === "dinein"
      ? "يقعد"
      : "";

  let addressLine = "";
  if (docData.customerType === "delivery" && docData.address) {
    const parts = [];
    if (docData.address.street) parts.push(docData.address.street);
    if (docData.address.houseNumber) parts.push(docData.address.houseNumber);
    if (docData.address.city) parts.push(docData.address.city);
    if (docData.address.floor) parts.push("ط" + docData.address.floor);
    if (docData.address.apartment) parts.push("ش" + docData.address.apartment);
    if (docData.address.entrance) parts.push("مدخل " + docData.address.entrance);
    addressLine = parts.join(" ");
  } else if (docData.customerType === "takeaway") {
    addressLine = "خنوت";
  } else if (docData.customerType === "dinein") {
    addressLine = docData.tableNumber ? "طاولة " + docData.tableNumber : "يقعد";
  }

  const paidText = docData.paymentStatus === "paid" ? "اشراي" : "مزومان";

  return { typeText, addressLine, paidText };
}

function printOrderTicketA4(orderId, docData) {
  const { typeText, addressLine, paidText } = buildCommonPrintData(orderId, docData);

  const itemsArr = (docData && Array.isArray(docData.items)) ? docData.items : [];
  const itemCount = itemsArr.length;

  // Auto-scale fonts on A4 when there are many items
  let densityClass = "a4-normal";
  if (itemCount >= 11 && itemCount <= 14) densityClass = "a4-dense";
  else if (itemCount >= 15) densityClass = "a4-xdense";

  let itemsHtml = "";
  itemsArr.forEach((item, idx) => {
    const toppingsLine = item.notes ? `<div class="print-notes">${item.notes}</div>` : "";
    const rawFreeDrinkValue = (item.freeDrink || "").toString().trim();
    const freeDrinkValue = normalizePrintFreeDrinkText(rawFreeDrinkValue);
    const freeDrinkLine =
      item.hasFreeDrink &&
      freeDrinkValue &&
      !/(بدون\s*اختيار|لم\s*يتم|لم\s*تتم|اختيار\s*بعد)/i.test(freeDrinkValue)
        ? `<div class="print-notes free-drink-name">شتيا: ${escapeHtml(freeDrinkValue)}</div>`
        : "";

    const extraLine = item.extraNote
      ? `<div class="print-notes">ملاحظة: ${escapeHtml(item.extraNote)}</div>`
      : "";
    const notesLine = toppingsLine + freeDrinkLine + extraLine;

    itemsHtml += `
      <tr class="item-row">
        <td class="col-idx">${idx + 1}</td>
        <td class="col-name">
          <div class="item-name">${item.nameAr || ""}</div>
          ${notesLine}
        </td>
        <td class="col-qty">${item.qty || 1}</td>
        <td class="col-price">${Number(item.price || 0) > 0 ? "₪" + Number(item.price || 0) : ""}</td>
      </tr>
    `;
  });

  const deliveryFeeHtml =
    docData.deliveryFee && Number(docData.deliveryFee) > 0
      ? `<div class="print-delivery">דמי משלוח: ₪${docData.deliveryFee}</div>`
      : "";

  // Total for print should match UI "المجموع" (and NOT include delivery fee)
  const totalForPrint = (() => {
    // Compute the same total as UI "المجموع" (includes promotions, excludes delivery fee)
    const promo = calculateOrderTotalWithPromotions(itemsArr);
    const computedItemsTotal = Number(promo && promo.total) || 0;

    const fee = Number(docData && docData.deliveryFee) || 0;

    const storedTotal =
      (docData && docData.totalAmount !== undefined && docData.totalAmount !== null && docData.totalAmount !== "")
        ? Number(docData.totalAmount)
        : (docData && docData.total !== undefined && docData.total !== null && docData.total !== "")
          ? Number(docData.total)
          : NaN;

    if (!isNaN(storedTotal) && storedTotal >= 0) {
      // If storedTotal looks like it includes delivery fee, subtract it.
      if (fee > 0 && Math.abs(storedTotal - (computedItemsTotal + fee)) < 0.02) return storedTotal - fee;
      return storedTotal;
    }
    return computedItemsTotal;
  })();
  const totalDisplay = (Number(totalForPrint) || 0).toFixed(1).replace(/\.0$/, "");

  // Promo notice on A4 too (when pizza deal applies)
  const promoNoticeHtmlA4 = (() => {
    const promo = calculateOrderTotalWithPromotions(itemsArr);
    const discount = Number(promo && promo.discount) || 0;
    const promotions = (promo && Array.isArray(promo.promotions)) ? promo.promotions : [];
    if (!discount || discount <= 0 || !promotions.length) return "";

    const before = (Number(promo.total) || 0) + discount;
    const fmt = (n) => (Number(n) || 0).toFixed(1).replace(/\.0$/, "");
    const promoLineText = (p) => {
      const t = (p && p.type) ? String(p.type) : "";
      if (t === "2_mid") return "מבצע: 2 משפחתיות = ₪100";
      if (t === "2_large") return "מבצע: 2 ענקיות = ₪135";
      if (t === "3_large") return "מבצע: 3 ענקיות = ₪185";
      return "מבצע";
    };

    const lines = promotions
      .map((p) => `<div class="a4-promo-line">${escapeHtml(promoLineText(p))}</div>`)
      .join("");

    return `
      <div class="a4-promo">
        <div class="a4-promo-title">🎁 מבצע</div>
        ${lines}
        <div class="a4-promo-saved">חסכת: ₪${fmt(discount)}</div>
        <div class="a4-promo-before">לפני מבצע: ₪${fmt(before)}</div>
      </div>
    `;
  })();

  const isCreditForPrint = docData.paymentStatus === "paid";
  const serviceKey = (docData.serviceType || docData.customerType || "").toString();
  const isKnownServiceForCredit = ["delivery", "takeaway", "dinein"].includes(serviceKey);
  const creditLabel = (isCreditForPrint && isKnownServiceForCredit) ? ' <span class="total-credit">אשראי</span>' : "";

  const printedAtText = formatTimestamp(docData.createdAt || docData.timestamp || Date.now());
  const printedAtHtml = printedAtText ? `<div class="printed-at">תאריך ושעה: ${escapeHtml(printedAtText)}</div>` : "";

  const printedTimeTextA4 = (() => {
    if (printedAtText && typeof printedAtText === "string") {
      const m = printedAtText.match(/(\d{1,2}:\d{2})/);
      if (m) return m[1];
    }
    const raw = docData.createdAt || docData.timestamp || Date.now();
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    return "";
  })();
  const printedTimeHtmlA4 = printedTimeTextA4 ? `<div class="center" style="font-size:18px;font-weight:800;margin-top:-8px;">שעה: ${escapeHtml(printedTimeTextA4)}</div>` : "";
const html = `
  <html dir="rtl" lang="ar" class="${densityClass}">
  <head>
    <meta charset="UTF-8" />
    <title>תذקרת הזמנה - A4</title>

    <style>
      /* -------- A4 base sizes (bigger by default) -------- */
      :root{
        --a4-base: 18px;
        --a4-small: 15px;
        --a4-h2: 32px;
        --a4-code: 26px;
        --a4-total: 30px;
        --a4-table-head: 18px;
        --a4-chip: 16px;
        --a4-pad: 14px;
      }
      html.a4-dense{
        --a4-base: 16px;
        --a4-small: 13px;
        --a4-h2: 28px;
        --a4-code: 22px;
        --a4-total: 26px;
        --a4-table-head: 16px;
        --a4-chip: 14px;
        --a4-pad: 12px;
      }
      html.a4-xdense{
        --a4-base: 14px;
        --a4-small: 12px;
        --a4-h2: 24px;
        --a4-code: 20px;
        --a4-total: 22px;
        --a4-table-head: 14px;
        --a4-chip: 12.5px;
        --a4-pad: 10px;
      }

      @page { size: A4; margin: 10mm; }
      body{
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        padding: var(--a4-pad);
        font-size: var(--a4-base);
        color: #000;
      }
      h2{
        margin: 0 0 10px;
        font-size: var(--a4-h2);
        font-weight: 900;
        letter-spacing: 0.2px;
      }

      .meta{
        font-size: var(--a4-base);
        margin-bottom: 10px;
        line-height: 1.35;
      }
      .meta .order-code{
        font-weight: 900;
        font-size: var(--a4-code);
      }
      hr{ border: none; border-top: 1.6px dashed #000; margin: 10px 0; }

      table{
        width: 100%;
        border-collapse: collapse;
        font-size: var(--a4-base);
      }
      thead th{
        font-size: var(--a4-table-head);
        font-weight: 900;
        padding: 6px 0;
        border-bottom: 2px solid #000;
      }
      tbody td{
        padding: 6px 0;
        vertical-align: top;
        border-bottom: 1px solid rgba(0,0,0,0.15);
      }
      .col-idx{ width: 28px; text-align: right; font-weight: 800; }
      .col-name{ text-align: right; }
      .col-qty{ width: 60px; text-align: center; font-weight: 800; }
      .col-price{ width: 90px; text-align: left; font-weight: 900; }

      .item-name{
        font-weight: 900;
        font-size: calc(var(--a4-base) + 2px);
        margin-bottom: 4px;
      }
      .print-notes{
        font-size: var(--a4-small);
        line-height: 1.45;
        margin-top: 2px;
        white-space: pre-line;
      }

      /* Pills like "الطلب الحالي" (for sauces/toppings notes HTML) */
      .zone-summary-line{ margin: 3px 0; font-size: var(--a4-small); line-height:1.45; }
      .zone-title{ font-weight: 900; margin-left: 6px; }
      .zone-pills{ display: inline-flex; flex-wrap: wrap; gap: 6px; align-items: center; }
      .zone-topping-label, .order-chip{
        display: inline-block;
        border: 1.6px solid #000;
        border-radius: 999px;
        padding: 2px 10px;
        font-weight: 900;
        line-height: 1.2;
        white-space: nowrap;
        font-size: var(--a4-chip);
      }
      .order-chip{ margin-left: 6px; }

      .a4-promo{
        border: 2px dashed #000;
        padding: 10px 12px;
        margin: 10px 0 6px;
        text-align: center;
      }
      .a4-promo-title{ font-weight: 900; font-size: calc(var(--a4-base) + 2px); }
      .a4-promo-line{ font-weight: 900; font-size: var(--a4-base); margin-top: 4px; }
      .a4-promo-saved{ font-weight: 900; font-size: calc(var(--a4-base) + 4px); margin-top: 8px; }
      .a4-promo-before{ font-weight: 700; font-size: var(--a4-base); margin-top: 2px; }

      .print-total{
        font-size: var(--a4-total);
        font-weight: 900;
        margin-top: 10px;
      }
      .print-delivery{
        font-size: calc(var(--a4-base) + 2px);
        font-weight: 800;
        margin-top: 6px;
      }
      .print-time{ font-size: 12px; text-align:center; margin-top: 12px; }
    </style>
  </head>
  <body>
    <div class="center" style="margin-top:6px;">
      <img alt="Olive" style="width:90px;max-width:100%;height:auto;display:block;margin:0 auto;image-rendering:-webkit-optimize-contrast;" src="data:image/png;base64,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">
    </div>
    <div class="center" style="font-size:32px;font-weight:900; margin: 6px 0 10px;">#${escapeHtml(String(docData.orderCode || orderId.slice(-4)))}${(docData.serviceType === "takeaway" || docData.serviceType === "dinein") ? " " + escapeHtml(typeText) : ""}</div>
    ${printedTimeHtmlA4}

    <div class="meta">      <div>نوع: ${typeText}</div>
      <div>اسم الزبون: ${docData.customerName || ""}</div>
      ${docData.phone ? `<div>תلفون: ${docData.phone}</div>` : ""}
      ${addressLine ? `<div>عنوان: ${addressLine}</div>` : ""}
      ${docData.paymentNotes ? `<div>ملاحظات دفع: ${docData.paymentNotes}</div>` : ""}
      <div>حالة الدفع: ${paidText}</div>
    </div>

    <hr />

    <table>
      <thead>
        <tr>
          <th style="text-align:right;">#</th>
          <th style="text-align:right;">الصنف</th>
          <th style="text-align:center;">كمية</th>
          <th style="text-align:left;">السعر</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <hr />

    ${promoNoticeHtmlA4}

    <div class="print-total">ס''כ: ₪${totalDisplay}</div>
    ${deliveryFeeHtml}

    <div class="sep"></div>
    <div class="print-time">${new Date().toLocaleString()}</div>
  </body>
  </html>
  `;

  const w = window.open("", "_blank", "width=760,height=980");
  if (!w) {
    alert("הדפדפן חסם חלון הדפסה. תאפשר Popups.");
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();

  // Also print kitchen ticket (items + toppings/sauces) if order includes: بطاطا / بستا رافيولي / سلطات
  if (orderNeedsKitchenTicket(docData)) {
    try {
      const kitchenHtml = buildKitchenTicketHtml(orderId, docData);
      setTimeout(() => olivePrintHtmlInHiddenIframe(kitchenHtml), 350);
    } catch (e) {
      console.warn("Kitchen ticket print failed:", e);
    }
  }
}
function stripHtmlTags(html) {
  if (!html) return "";
  return String(html).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function olivePrintHtmlInHiddenIframe(html) {
  // Print HTML without opening a new popup window (helps when popups are blocked).
  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    const doPrint = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.warn("Hidden iframe print failed:", e);
      } finally {
        setTimeout(() => {
          try { iframe.remove(); } catch {}
        }, 1500);
      }
    };

    // Some browsers won't trigger onload after doc.write, so we do both.
    iframe.onload = doPrint;
    setTimeout(doPrint, 300);
  } catch (e) {
    console.warn("Failed to create hidden iframe for printing:", e);
  }
}


function buildToppingsTextLines(item) {
  const toppings = Array.isArray(item && item.toppings) ? item.toppings : [];
  if (!toppings.length) return [];

  const full = [];
  const halfRight = [];
  const halfLeft = [];
  const qRightTop = [];
  const qLeftTop = [];
  const qRightBottom = [];
  const qLeftBottom = [];

  for (const t of toppings) {
    const label = (t && ((t.label||labelArById(t.id)) || t.name || t.title)) ? String((t.label||labelArById(t.id)) || t.name || t.title) : "";
    if (!label) continue;
    switch (t.coverage) {
      case "full":
      case "all":
        full.push(label);
        break;
      case "half_right":
        halfRight.push(label);
        break;
      case "half_left":
        halfLeft.push(label);
        break;
      case "q_right_top":
      case "quarter_right_top":
        qRightTop.push(label);
        break;
      case "q_right_bottom":
      case "quarter_right_bottom":
        qRightBottom.push(label);
        break;
      case "q_left_top":
      case "quarter_left_top":
        qLeftTop.push(label);
        break;
      case "q_left_bottom":
      case "quarter_left_bottom":
        qLeftBottom.push(label);
        break;
      default:
        full.push(label);
    }
  }

  const lines = [];
  const push = (title, arr) => {
    if (!arr.length) return;
    lines.push(`${title}: ${arr.join(", ")}`);
  };

  push(covLabel("ALL","ar") || "على الكل", full);
  push(covLabel("HALF_RIGHT","ar") || "نصف يمين", halfRight);
  push(covLabel("HALF_LEFT","ar") || "نصف شمال", halfLeft);
  push(covLabel("Q1","ar") || "ربع 1", qRightTop);
  push(covLabel("Q2","ar") || "ربع 2", qRightBottom);
  push(covLabel("Q3","ar") || "ربع 3", qLeftTop);
  push(covLabel("Q4","ar") || "ربع 4", qLeftBottom);

  return lines;
}

function calcTotalForPrint(docData) {
  const itemsArr = (docData && Array.isArray(docData.items)) ? docData.items : [];
  const itemsSum = itemsArr.reduce((s, it) => {
    const pr = Number(it && it.price) || 0;
    const q = Number(it && it.qty) || 1;
    return s + pr * q;
  }, 0);

  const fee = Number(docData && docData.deliveryFee) || 0;

  const storedTotal =
    (docData && docData.totalAmount !== undefined && docData.totalAmount !== null && docData.totalAmount !== "")
      ? Number(docData.totalAmount)
      : (docData && docData.total !== undefined && docData.total !== null && docData.total !== "")
        ? Number(docData.total)
        : NaN;

  if (!isNaN(storedTotal) && storedTotal >= 0) {
    if (fee > 0 && Math.abs(storedTotal - (itemsSum + fee)) < 0.02) return storedTotal - fee;
    return storedTotal;
  }
  return itemsSum;
}

async function printOrderTicketUsb(orderId, orderData) {
  // USB printing via local Olive Print Server (80mm) - NO print preview.
  // We send 80mm HTML directly to the server, which prints silently.
  try {
    const receiptHtml = buildPosReceiptHtml(orderId, orderData);

    await oliveUsbPrintHtmlDirect(receiptHtml, {
      orderCode: orderData?.orderCode || orderData?.code || "",
      serviceType: orderData?.serviceType || "",
      paymentStatus: orderData?.paymentStatus || "",
      ticketType: "pos"
    });

    // Extra kitchen ticket (items + toppings/sauces) for: بطاطا / بستا رافيولي / سلطات
    if (orderNeedsKitchenTicket(orderData)) {
      const kitchenHtml = buildKitchenTicketHtml(orderId, orderData);
      try {
        await oliveUsbPrintHtmlDirect(kitchenHtml, {
          orderCode: orderData?.orderCode || orderData?.code || "",
          serviceType: orderData?.serviceType || "",
          paymentStatus: orderData?.paymentStatus || "",
          ticketType: "kitchen"
        });
      } catch (ke) {
        console.warn("Kitchen ticket print error:", ke);
        alert(`فشل طباعة بون المطبخ.
${ke?.message || ke}`);
      }
    }
  } catch (e) {
    alert(`USB print failed.
${e?.message || e}`);
  }
}



async function oliveUsbPrintHtmlDirect(html, meta = {}) {
  // Sends raw 80mm HTML to the local Olive Print Server (USB).
  const storedUrl = localStorage.getItem("olivePrintServerUrl") || localStorage.getItem("OLIVE_PRINT_SERVER_URL") || "";
  const storedToken = localStorage.getItem("olivePrintToken") || localStorage.getItem("OLIVE_PRINT_TOKEN") || "";
  const baseUrl = normalizePrintServerUrl(storedUrl || PRINT_SERVER_URL || DEFAULT_PRINT_SERVER_URL);
  const token = (storedToken || PRINT_SERVER_TOKEN || "").trim();

  if (!baseUrl) {
    throw new Error("אין כתובת שרת הדפסה (USB). פתח הגדרות הדפסה ושמור כתובת.");
  }
  if (!token) {
    throw new Error("אין TOKEN לשרת הדפסה (USB). פתח הגדרות הדפסה ושמור Token.");
  }

  const resp = await fetch(`${baseUrl}/print`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-OLIVE-TOKEN": token,
      "ngrok-skip-browser-warning": "1"
    },
    body: JSON.stringify({
      html,
      ...meta
    })
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.ok) {
    const msg = (data && (data.error || data.message)) ? (data.error || data.message) : "USB print failed.";
    throw new Error(msg);
  }
  return data;
}

function buildDayCloseZReportHtml({ byDriver, byServiceType, overallTotal, overallCashTotal, overallCardTotal, closeDateStr, cumulativeZ }) {
  const now = new Date();
  const dt = closeDateStr ? String(closeDateStr) : now.toLocaleString("he-IL");
  const time = (dt.match(/(\d{1,2}:\d{2})/) || [])[1] || "";
  // try to extract date portion (dd.mm.yyyy) or fallback
  const date = (dt.replace(time, "").replace(/[,]/g, "").trim()) || dt;

  const line = "<div class='line'></div>";

  const fmt = (n) => {
    const x = Number(n || 0) || 0;
    return x.toFixed(0);
  };

  // Drivers (exclude no_driver)
  let driversHtml = "";
  try {
    const rows = [];
    if (byDriver && typeof byDriver.forEach === "function") {
      byDriver.forEach((bucket, key) => {
        if (!bucket) return;
        if (key === "no_driver") return;
        rows.push(bucket);
      });
    }
    if (rows.length) {
      driversHtml += "<div class='secTitle'>שליחים</div>";
      rows.forEach((b) => {
        const name = b.name || "שליח";
        const cnt = Number(b.count || 0) || 0;
        const cash = fmt(b.cash);
        const card = fmt(b.card);
        const total = fmt(b.total);
        driversHtml += `
          <div class="row">
            <div class="l">${escapeHtml(name)}</div>
            <div class="r">${cnt} | מז ${cash} | אש ${card} | סה״כ ${total}</div>
          </div>
        `;
      });
    }
  } catch (e) {
    driversHtml = "";
  }

  const svcRow = (label, bucket) => {
    const b = bucket || { total: 0, count: 0, cash: 0, card: 0 };
    const cnt = Number(b.count || 0) || 0;
    const cash = fmt(b.cash);
    const card = fmt(b.card);
    const total = fmt(b.total);
    return `
      <div class="row">
        <div class="l">${escapeHtml(label)}</div>
        <div class="r">${cnt} | מז ${cash} | אש ${card} | סה״כ ${total}</div>
      </div>
    `;
  };

  const deliveryBucket = (byServiceType && byServiceType.delivery) ? byServiceType.delivery : { total: 0, count: 0, cash: 0, card: 0 };
  const takeawayBucket = (byServiceType && byServiceType.takeaway) ? byServiceType.takeaway : { total: 0, count: 0, cash: 0, card: 0 };
  const dineinBucket = (byServiceType && byServiceType.dinein) ? byServiceType.dinein : { total: 0, count: 0, cash: 0, card: 0 };
  const otherBucket = (byServiceType && byServiceType.other) ? byServiceType.other : { total: 0, count: 0, cash: 0, card: 0 };

  const html = `
  <html dir="rtl">
  <head>
    <meta charset="utf-8"/>
    <title>דוח Z - סיכום יום</title>
    <style>
      @page { size: 80mm auto; margin: 0; }
      html, body { margin:0; padding:0; }
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; direction: rtl; }
      .wrap { padding: 8px 8px 10px; }
      .center { text-align:center; }
      .big { font-size: 22px; font-weight: 900; letter-spacing: 0.5px; }
      .mid { font-size: 14px; font-weight: 700; }
      .small { font-size: 12px; }
      .muted { opacity: 0.85; }
      .line { border-top: 1px dashed #000; margin: 8px 0; }
      .secTitle { font-size: 13px; font-weight: 800; margin: 6px 0 4px; }
      .row { display:flex; justify-content:space-between; gap: 6px; font-size: 12px; line-height: 1.25; margin: 2px 0; }
      .l { flex: 1 1 auto; text-align:right; font-weight: 700; }
      .r { flex: 1 1 auto; text-align:left; font-family: ui-monospace, Menlo, Consolas, "Courier New", monospace; }
      .totRow { display:flex; justify-content:space-between; font-size: 12px; margin: 2px 0; }
      .totRow b { font-weight: 900; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="center big">Z</div>
      <div class="center mid">סיכום יום - Pizza Olive</div>
      <div class="center small muted">${escapeHtml(date)} ${escapeHtml(time)}</div>
      ${line}

      <div class="secTitle">סה״כ כללי</div>
      <div class="totRow"><span>סה״כ</span><b>${fmt(overallTotal)} ₪</b></div>
      <div class="totRow"><span>מזומן</span><b>${fmt(overallCashTotal)} ₪</b></div>
      <div class="totRow"><span>אשראי</span><b>${fmt(overallCardTotal)} ₪</b></div>

      ${line}
      <div class="secTitle">פירוט לפי סוג</div>
      ${svcRow("delivery / توصيل", deliveryBucket)}
      ${svcRow("خنوت", takeawayBucket)}
      ${svcRow("يقعد", dineinBucket)}
      ${svcRow("אחר", otherBucket)}

      ${driversHtml ? (line + driversHtml) : ""}

      ${ (cumulativeZ !== null && cumulativeZ !== undefined && isFinite(Number(cumulativeZ))) ? (line + `
      <div class="secTitle">Z מצטבר</div>
      <div class="totRow"><span>Z מצטבר</span><b>${fmt(cumulativeZ)} ₪</b></div>
      `) : "" }

      ${line}
      <div class="center small muted">--- نهاية التقرير ---</div>
    </div>
  </body>
  </html>
  `;
  return html;
}




// Normalize legacy notes that may contain a table (e.g., salads half/half) into simple lines for POS print.
// This prevents printing an extra header row مثل "الصنف / كمية / ₪" inside item notes.
function normalizeNotesHtmlForPrint(rawHtml) {
  if (!rawHtml || typeof rawHtml !== "string") return rawHtml;
  // Some legacy notes may include TABLE markup in different casing.
  if (!/\<table\b/i.test(rawHtml)) return rawHtml;

  try {
    const tmp = document.createElement("div");
    tmp.innerHTML = rawHtml;

    const rows = Array.from(tmp.querySelectorAll("tr"));
    const lines = [];

    rows.forEach((tr) => {
      // Support both <td> and <th> cells (some tables include headers).
      const cells = Array.from(tr.querySelectorAll("td,th"));
      if (!cells.length) return;

      const parts = cells
        .map((td) => (td.textContent || "").trim())
        .filter(Boolean);

      if (!parts.length) return;

      const joined = parts.join(" ").replace(/\s+/g, " ").trim();
      if (!joined) return;

      // Skip header-like labels if they slipped in (e.g. "الصنف  كمية  ₪")
      if (
        joined === "الصنف" ||
        joined === "كمية" ||
        joined === "₪" ||
        (joined.includes("الصنف") && joined.includes("كمية") && joined.includes("₪"))
      ) return;

      lines.push(joined);
    });

    if (!lines.length) return "";

    return lines
      .map((line) => `<div class="pt-zone"><span class="pt-tops">${escapeHtml(line)}</span></div>`)
      .join("");
  } catch (e) {
    return rawHtml;
  }
}

// For potato/salad notes, split into clearer lines: "بلا" / "مع" / "اضافات مدفوعه" etc.
function formatNotesLinesForSaladsAndPotato(item, html) {
  if (!html) return html;
  const name = String((item && item.nameAr) || "");
  const cat = String((item && item.category) || "").toLowerCase();
  const isSaladOrPotato =
    cat === "salad" ||
    cat === "potato" ||
    cat === "btata" ||
    /\bسلطة\b/.test(name) ||
    /\bبطاطا\b/.test(name) ||
    /\bبططا\b/.test(name);

  if (!isSaladOrPotato) return html;

  // If it's already structured pills/layout, keep it.
  if (/<div\s+class=\"pt-zone\"/i.test(html)) {
    // But if it's a single zone with multiple phrases, try to split.
    // Extract plain text quickly and rebuild lines.
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const text = (tmp.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return html;
    return rebuildNotesAsLines(text, html);
  }

  const plain = String(html)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .trim();
  if (!plain) return html;
  return rebuildNotesAsLines(plain, html);

  function rebuildNotesAsLines(text, fallbackHtml) {
    // Split by commas or newlines first
    const rough = text
      .split(/\n|،|\|/)
      .map((s) => s.trim())
      .filter(Boolean);

    // Then further split if a segment contains multiple known labels
    const labels = [
      "بلا:",
      "مع:",
      "اضافات مدفوعه:",
      "اضافات عادية:",
      "صوص:",
    ];

    const out = [];
    rough.forEach((seg) => {
      let s = seg;
      // Ensure each known label starts a new line
      labels.forEach((lb) => {
        s = s.replace(new RegExp("\\s*" + escapeReg(lb), "g"), "\n" + lb);
      });
      s.split(/\n/)
        .map((x) => x.trim())
        .filter(Boolean)
        .forEach((x) => out.push(x));
    });

    if (!out.length) return fallbackHtml || text;

    return out
      .map((line) => `<div class="pt-zone"><span class="pt-tops">${escapeHtml(line)}</span></div>`)
      .join("");
  }

  function escapeReg(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

function buildPosReceiptHtml(orderId, docData) {

  const { typeText, addressLine, paidText } = buildCommonPrintData(orderId, docData);

  // Phone can be stored under different keys depending on older/newer versions
  const phoneForPrint = (() => {
    const d = docData || {};
    const v =
      d.phone ||
      d.phoneNumber ||
      d.mobile ||
      d.tel ||
      d.customerPhone ||
      d.customer_phone ||
      d.customerMobile ||
      d.customerTel ||
      (d.customer && (d.customer.phone || d.customer.mobile || d.customer.tel || d.customerPhone)) ||
      (d.contact && (d.contact.phone || d.contact.mobile || d.contact.tel || d.contactPhone)) ||
      (d.address && (d.address.phone || d.address.mobile || d.address.tel)) ||
      (d.delivery && (d.delivery.phone || d.delivery.mobile)) ||
      "";
    return (v || "").toString().trim();
  })();

  // Build toppings summary for POS print (bold toppings, NOT bold zone titles)
  const buildToppingsPrintHtml = (item) => {
    // Use the exact same structure as "الطلب الحالي" (zone title + topping pills)
    let text =
      item.notes && typeof item.notes === "string"
        ? item.notes
        : buildToppingsNotes(item);

    // Normalize legacy HTML tables in notes (prevents repeating headers like "الصنف / كمية / ₪")
    // Run regardless of source (item.notes OR generated notes) so potato/salad won't leak table headers.
    text = normalizeNotesHtmlForPrint(text);

    // For salads/potato, make notes more readable: each label on its own line.
    text = formatNotesLinesForSaladsAndPotato(item, text);


    if (!text) return "";
    return `<div class="pt-layout">${text}</div>`;
  };

  let rowsHtml = "";
  (docData.items || []).forEach((item, idx, arr) => {
    // Item name (with pasta cream indicator)
    let displayNamePrint = item.nameAr || "";
    // Remove any existing suffix to avoid duplicates
    displayNamePrint = displayNamePrint.replace(/\s*\((?:لو\s*مكرام|مكرام)\)\s*$/, "");
    if (item.category === "pasta") {
      const paidArrPrint = Array.isArray(item.pastaPaidToppings)
        ? item.pastaPaidToppings
        : [];
      let hasCream = paidArrPrint.some(
        (t) => t && (t.id === "pasta_extra_cream" || (t.label && t.label.includes("مكرام")))
      );
      // Backward compatibility: older saved orders may not include pastaPaidToppings,
      // but the notes string usually contains "مكرام (+5)".
      if (!hasCream) {
        const n = typeof item.notes === "string" ? item.notes : "";
        if (n.includes("مكرام") && !n.includes("لو مكرام")) hasCream = true;
      }
      displayNamePrint = `${displayNamePrint} (${hasCream ? "مكرام" : "لو مكرام"})`;
    }
const qty = Number(item.qty || 1);
    const qtyCell = qty > 1 ? qty : "";
    const price = Number(item.price || 0);
    const linePrice = price * qty;

    // Notes / toppings area
    const toppingsHtml = buildToppingsPrintHtml(item);

    const rawFreeDrinkValue = (item.freeDrink || "").toString().trim();
    const freeDrinkValue = normalizePrintFreeDrinkText(rawFreeDrinkValue);
    const shouldPrintFreeDrink =
      item.hasFreeDrink &&
      freeDrinkValue &&
      !/(بدون\s*اختيار|لم\s*يتم|لم\s*تتم|اختيار\s*بعد)/i.test(freeDrinkValue);

    const freeDrinkHtml = shouldPrintFreeDrink
      ? `<div class="pt-zone"><span class="pt-zone-title">شتيا:</span> <span class="pt-tops free-drink-name">${escapeHtml(
          freeDrinkValue
        )}</span></div>`
      : "";
const extraNoteHtml = item.extraNote
      ? `<div class="pt-zone"><span class="pt-zone-title">ملاحظة:</span> <span class="pt-tops">${escapeHtml(
          item.extraNote
        )}</span></div>`
      : "";

    const hasNotes = Boolean(toppingsHtml || freeDrinkHtml || extraNoteHtml);

    rowsHtml += `
      <tr class="item-row">
        <td class="col-item"><span class="item-name">${escapeHtml(displayNamePrint)}</span></td>
        <td class="col-qty">${qtyCell ? `<span class="qty-num">${qtyCell}</span>` : ""}</td>
        <td class="col-price">${(qty > 1 ? linePrice : price) > 0 ? "₪" + (qty > 1 ? linePrice : price) : ""}</td>
      </tr>
      ${
        hasNotes
          ? `<tr class="notes-row"><td colspan="3">${toppingsHtml}${freeDrinkHtml}${extraNoteHtml}</td></tr>`
          : ""
      }
      ${idx < arr.length - 1 ? `<tr class="item-sep"><td colspan="3"><div class="sep-line"></div></td></tr>` : ""}
    `;
  });

  const deliveryFeeHtml =
    docData.deliveryFee && Number(docData.deliveryFee) > 0
      ? `<div class="meta-line"><span class="meta-title">דמי משלוח:</span> ₪${docData.deliveryFee}</div>`
      : "";

  // === Promo badge (when pizza deal applies) ===
  const promoNoticeHtml = (() => {
    const itemsArr = (docData && Array.isArray(docData.items)) ? docData.items : [];
    const promo = calculateOrderTotalWithPromotions(itemsArr);
    const discount = Number(promo && promo.discount) || 0;
    const promotions = (promo && Array.isArray(promo.promotions)) ? promo.promotions : [];
    if (!discount || discount <= 0 || !promotions.length) return "";

    const before = (Number(promo.total) || 0) + discount;
    const fmt = (n) => (Number(n) || 0).toFixed(1).replace(/\.0$/, "");

    const promoLineText = (p) => {
      const t = (p && p.type) ? String(p.type) : "";
      if (t === "2_mid") return "מבצע: 2 משפחתיות = ₪100";
      if (t === "2_large") return "מבצע: 2 ענקיות = ₪135";
      if (t === "3_large") return "מבצע: 3 ענקיות = ₪185";
      return "מבצע";
    };

    const lines = promotions
      .map((p) => `<div class="promo-line">${escapeHtml(promoLineText(p))}</div>`)
      .join("");

    return `
      <div class="promo-box">
        <div class="promo-title">🎁 מבצע</div>
        ${lines}
        <div class="promo-saved">חסכת: ₪${fmt(discount)}</div>
        <div class="promo-before">לפני מבצע: ₪${fmt(before)}</div>
      </div>
    `;
  })();

  // Total for print should match UI "المجموع" (use stored totalAmount if available, otherwise compute)
  const totalForPrint = (() => {
    // We want the printed total to match UI "المجموع" (includes promotions) and NOT include delivery fee.
    const itemsArr = (docData && Array.isArray(docData.items)) ? docData.items : [];
    const promo = calculateOrderTotalWithPromotions(itemsArr);
    const computedItemsTotal = Number(promo && promo.total) || 0;

    const fee = Number(docData && docData.deliveryFee) || 0;

    // Prefer stored totals when they look correct, otherwise fall back to computed (fixes older saved orders).
    const storedTotal =
      (docData && docData.totalAmount !== undefined && docData.totalAmount !== null && docData.totalAmount !== "")
        ? Number(docData.totalAmount)
        : (docData && docData.total !== undefined && docData.total !== null && docData.total !== "")
          ? Number(docData.total)
          : NaN;

    if (!isNaN(storedTotal) && storedTotal >= 0) {
      // If storedTotal looks like it includes delivery fee, subtract it.
      if (fee > 0 && Math.abs(storedTotal - (computedItemsTotal + fee)) < 0.02) return storedTotal - fee;

      // IMPORTANT: If a cashier edited the total in "الطلبات المفتوحه", we must respect the stored total
      // even if it doesn't match the item sum.
      return storedTotal;
    }

    return computedItemsTotal;
  })();
  const totalDisplay = (Number(totalForPrint) || 0).toFixed(1).replace(/\.0$/, "");

  const isCreditForPrint = docData.paymentStatus === "paid";
  const serviceKey = (docData.serviceType || docData.customerType || "").toString();
  const isKnownServiceForCredit = ["delivery", "takeaway", "dinein"].includes(serviceKey);
  const creditLabel = (isCreditForPrint && isKnownServiceForCredit) ? ' <span class="total-credit">אשראי</span>' : "";

  const printedAtText = formatTimestamp(docData.createdAt || docData.timestamp || Date.now());
  const printedAtHtml = printedAtText ? `<div class="printed-at">תאריך ושעה: ${escapeHtml(printedAtText)}</div>` : "";

  const printedTimeText = (() => {
    // Extract only HH:MM from printedAtText (works with he-IL like "27.1.2026, 16:32:10")
    if (printedAtText && typeof printedAtText === "string") {
      const m = printedAtText.match(/(\d{1,2}:\d{2})/);
      if (m) return m[1];
    }

    // Fallback: build from createdAt/timestamp (supports Firestore Timestamp objects)
    const raw = docData.createdAt || docData.timestamp || Date.now();

    let d = null;
    try {
      if (raw instanceof Date) {
        d = raw;
      } else if (typeof raw === "number" || typeof raw === "string") {
        d = new Date(raw);
      } else if (raw && typeof raw.toMillis === "function") {
        d = new Date(raw.toMillis());
      } else if (raw && typeof raw.toDate === "function") {
        d = raw.toDate();
      } else if (raw && typeof raw.seconds === "number") {
        d = new Date(raw.seconds * 1000);
      } else {
        d = new Date(Date.now());
      }
    } catch (e) {
      d = new Date(Date.now());
    }

    if (d && !isNaN(d.getTime())) {
      return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    }
    return "";
  })();
  const printedTimeHtml = printedTimeText ? `<div class="center order-time-under">${escapeHtml(printedTimeText)}</div>` : "";
const html = `
  <html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8" />
    <title>تذكرة - 80mm</title>
    <style>
      @page { size: 80mm auto; margin: 0; }
      html, body{
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        width: 72mm;
        margin: 0;
        padding: 0 2mm 3mm;
        direction: rtl;
        text-align: right;
        color: #000;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        text-rendering: geometricPrecision;
      }
      *, *::before, *::after{ box-sizing:border-box; }
      body{
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        padding: 6px 6px 10px;
        width: 72mm;
        direction: rtl;
        text-align: right;
        color: #000;
      }
      .center{ text-align:center; }
      .brand{ font-weight:800; font-size:20px; margin: 4px 0 6px; }
      .logo-wrap{ margin-top: 2px; }
      .logo{ width: 24mm; max-width:100%; height:auto; display:block; margin:0 auto; image-rendering: -webkit-optimize-contrast; }
      .order-number-big{ font-size: 26px; font-weight: 900; letter-spacing: .5px; margin: 2px 0 6px; }
            .order-time-under{ font-size: 14px; font-weight: 800; margin: -2px 0 6px; }
.meta{ font-size: 14px; line-height: 1.35; }
      .meta-line{ margin: 1px 0; }
      .meta-title{ font-weight:700; }

      .order-code{ font-size: 18px; font-weight: 900; }
      .total-credit{ font-weight: 900; font-size: 16px; margin: 0 8px; }

      
      
      .printed-at{ margin-top: 10px; font-size: 10px; text-align: center; }
.sep{ border-top: 1px dashed #000; margin: 6px 0; }
      .item-sep td{ padding: 6px 0 2px; }
      .sep-line{ border-top: 2px dashed #000; height:0; }

      table{ width:100%; border-collapse:collapse; font-size: 16px; table-layout: fixed; }
      th{ font-weight:800; padding: 4px 0; border-bottom: 1px solid #000; }
      td{ padding: 4px 0; vertical-align: top; }
      .col-item{ width: 60%; }
      .col-qty{ width: 12%; text-align:center; }
      .qty-num{ font-weight:900; font-size:22px; display:inline-block; }
      .col-price{ width: 28%; text-align:left; white-space: nowrap; }
      .item-name{ font-weight:900; font-size:18px; overflow-wrap:anywhere; word-break: break-word; }

      /* Pills / chips in POS print */
      .zone-summary-line{ margin: 3px 0; }
      .zone-title{ font-weight:800; margin-left:6px; }
      .zone-pills{ display:inline-flex; flex-wrap:wrap; gap:6px; align-items:center; }
      .zone-topping-label, .order-chip{
        display:inline-block;
        border: 1px solid #000;
        border-radius: 999px;
        padding: 2px 9px;
        font-weight: 800;
        line-height: 1.2;
        white-space: nowrap;
      }
      .order-chip{ margin-left: 6px; }
      .notes-row td{ padding-top: 2px; padding-bottom: 6px; }
      .pt-zone{ font-size: 13px; line-height: 1.45; margin: 3px 0; }
      .pt-zone-title{ font-weight: 400; }
      .free-drink-name{font-weight:900;font-size:16px;}
 /* DO NOT emphasize zone title */
      .pt-tops{ font-weight: 900; word-spacing: 2px; color:#000; } /* emphasize toppings */

      /* Match "الطلب الحالي" toppings layout */
      .zone-summary-line{ font-size: 13px; line-height: 1.45; margin: 3px 0; display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
      .zone-title{ font-weight: 400; }
      .zone-pills{ display:flex; flex-wrap:wrap; gap:4px; }
      .zone-topping-label{ display:inline-block; padding: 2px 6px; border: 1px solid #000; border-radius: 999px; font-weight: 900; }
      .pt-layout{ margin-top: 2px; }
      .pt-full{ margin: 4px 0 6px; }
      .pt-full .pt-zone-title{ display:block; text-align:center; }
      .pt-full-tops{ text-align:center; margin-top: 1px; }
      .pt-pair{ width:100%; border-collapse:collapse; margin: 2px 0 4px; }
      .pt-pair td{ padding: 1px 0; vertical-align: top;  line-height:1.15; }

      .pt-h{ font-weight: 400; width: 48%; }
      .pt-v{ width: 48%; white-space: normal; word-break: break-word; }
      .pt-sep{ width: 4%; text-align:center; color:#000; font-weight: 400;  white-space:nowrap; line-height:1; }

      .total{ font-size: 20px; font-weight: 900; margin-top: 8px; }
      .promo-box{ border: 2px dashed #000; padding: 6px 8px; margin: 8px 0 4px; text-align: center; }
      .promo-title{ font-weight: 900; font-size: 14px; margin-bottom: 2px; }
      .promo-line{ font-weight: 800; font-size: 13px; margin: 1px 0; }
      .promo-saved{ font-weight: 900; font-size: 14px; margin-top: 4px; }
      .promo-before{ font-weight: 700; font-size: 12px; opacity: 0.95; }
      .small{ font-size: 12px; }
      .print-time{ font-size: 11px; text-align:center; margin-top: 8px; }
    </style>
  </head>
  <body>
    <div class="center logo-wrap">
      <img class="logo" alt="Olive" src="data:image/png;base64,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">
    </div>
    <div class="center order-number-big">#${escapeHtml(String(docData.orderCode || orderId.slice(-4)))}${(docData.serviceType === "takeaway" || docData.serviceType === "dinein") ? " " + escapeHtml(typeText) : ""}</div>
      ${printedTimeHtml}

    <div class="meta">      <div class="meta-line"><span class="meta-title">نوع:</span> ${escapeHtml(typeText)}</div>
      <div class="meta-line"><span class="meta-title">اسم:</span> ${escapeHtml(String(docData.customerName || ""))}</div>
      ${phoneForPrint ? `<div class="meta-line"><span class="meta-title">تلفون:</span> ${escapeHtml(phoneForPrint)}</div>` : ""}
      ${addressLine ? `<div class="meta-line"><span class="meta-title">عنوان:</span> ${escapeHtml(addressLine)}</div>` : ""}
      ${docData.paymentNotes ? `<div class="meta-line"><span class="meta-title">ملاحظات:</span> ${escapeHtml(String(docData.paymentNotes))}</div>` : ""}
      <div class="meta-line"><span class="meta-title">دفع:</span> ${escapeHtml(paidText)}</div>
    </div>

    <div class="sep"></div>

    <!--
      IMPORTANT:
      We intentionally avoid using <thead> because many print engines
      repeat the header row عند أي "page break" حتى على طابعة حرارية,
      وهذا كان يسبب ظهور "الصنف / كمية / ₪" مرة ثانية فوق ملاحظات آخر صنف.
      لذلك نطبع سطر العناوين كأول <tr> داخل <tbody> فقط.
    -->
    <table>
      <tbody>
        <tr class="tbl-head">
          <td class="col-item" style="font-weight:800;border-bottom:1px solid #000;">الصنف</td>
          <td class="col-qty" style="font-weight:800;border-bottom:1px solid #000;">كمية</td>
          <td class="col-price" style="font-weight:800;border-bottom:1px solid #000;">₪</td>
        </tr>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="sep"></div>

    ${promoNoticeHtml}

    <div class="total">ס"כ: ₪${totalDisplay}${creditLabel}</div>

    ${deliveryFeeHtml}
  </body>
  </html>
  `
  return html;
}


function printOrderTicketPos(orderId, docData) {
  const html = buildPosReceiptHtml(orderId, docData);

  const w = window.open("", "_blank", "width=420,height=800");
  if (!w) {
    alert("הדפדפן חסם חלון הדפסה. תאפשר Popups.");
    return;
  }

  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();

  // Extra kitchen ticket (items + toppings/sauces) for: بطاطا / بستا رافيولي / سلطات
  if (orderNeedsKitchenTicket(docData)) {
    try {
      const kitchenHtml = buildKitchenTicketHtml(orderId, docData);
      // Print via hidden iframe so we can print *both* tickets without overwriting the main receipt.
      // In most browsers, this will run after the first print dialog is closed.
      setTimeout(() => olivePrintHtmlInHiddenIframe(kitchenHtml), 350);
    } catch (e) {
      console.warn("Kitchen ticket print failed:", e);
    }
  }
}



// טווחי מספרי הזמנה לפי סוג שירות:
// שְּלִיחַ (delivery): 1000–1999
// ישיבה (dinein):     2000–2999
// טייקאווי (takeaway):3000–3999
const ORDER_CODE_RANGES = {
  delivery: { min: 1000, max: 1999 },
  dinein:   { min: 2000, max: 2999 },
  takeaway: { min: 3000, max: 3999 },
};

async function generateOrderCode(orderType) {
  const range = ORDER_CODE_RANGES[orderType];

  // אם מסיבה כלשהי לא התקבל סוג שירות – ניפול לטווח כללי 1000–9999
  const min = range ? range.min : 1000;
  const max = range ? range.max : 9999;

  function buildBaseCode() {
    const rand = Math.floor(Math.random() * (max - min + 1)) + min;
    return rand.toString();
  }

  while (true) {
    const code = buildBaseCode();
    try {
      const qRef = query(
        collection(db, "orders"),
        where("orderCode", "==", code),
        limit(1)
      );
      const snap = await getDocs(qRef);
      if (snap.empty) {
        return code;
      }
      // אם כבר קיים קוד כזה – נמשיך לנסות אחד חדש בלופ
    } catch (err) {
      console.error("Error checking orderCode uniqueness", err);
      // במקרה של שגיאה בבדיקה נחזיר את הקוד הנוכחי כדי לא לתקוע את העבודה
      return code;
    }
  }
}

// Firestore – save order
async function saveOrderToFirestore() {
  if (!currentServiceType) {
    alert("إختار نوع الطلب (توصيل / خنوت / يقعد).");
    return false;
  }
  if (!currentPaymentStatus) {
    alert("إختار حالة الدفع (اشراي / مزومان).");
    return false;
  }

// חובה לבחור רוטב לפסטה
for (const it of currentOrderItems) {
  if (it && it.category === "pasta" && !(it.pastaSauceId || it.ravioliSauceId || it.sauceId || it.pastaSauce)) {
    alert("لفاستה لازم تختار صوص (شمنت / روزه / بندوره) لكل מנה.");
    return false;
  }
}

  const items = currentOrderItems.map((it) => ({
    id: it.id,
    nameAr: it.nameAr,
    category: it.category || null,
    size: it.size || null,
    qty: it.qty,
    basePrice: it.basePrice != null ? it.basePrice : it.price,
    price: it.price,
    toppings: Array.isArray(it.toppings) ? it.toppings : [],
    // Pasta/Ravioli specific (used for display + print)
    pastaSauceId: it.pastaSauceId || null,
    ravioliSauceId: it.ravioliSauceId || null,
    // legacy (kept for backward compatibility)
    pastaSauce: it.pastaSauce || null,
    pastaFreeToppings: Array.isArray(it.pastaFreeToppings) ? it.pastaFreeToppings : [],
    pastaPaidToppings: Array.isArray(it.pastaPaidToppings) ? it.pastaPaidToppings : [],
    extrasText: it.extrasText || null,
    notes: it.notes || null,
    extraNote: it.extraNote || null,
    hasFreeDrink: !!it.hasFreeDrink,
    freeDrink: it.freeDrink || null,
  }));
  // IMPORTANT: The printed receipt must match the on-screen total, including promotions
  const promoResult = calculateOrderTotalWithPromotions(items);
  const itemsTotal = promoResult.total;
  const deliveryFee = Number(currentDeliveryFee || 0) || 0;
  const total = itemsTotal; // delivery fee is shown separately (not summed)

  const newOrderCode = await generateOrderCode(currentServiceType);

  const baseData = {
    orderCode: newOrderCode,
    serviceType: currentServiceType,
    paymentStatus: currentPaymentStatus,
    isPaid: currentPaymentStatus === "paid",
    paymentNotes: paymentNotes.value || null,
    items,
    totalAmount: total,
    deliveryFee,
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };


  let docData = { ...baseData };

  if (currentServiceType === "delivery") {
    const phoneVal = (custPhoneDelivery.value || "").trim();
    // טלפון אופציונלי – אם כתבו משהו, נוודא שהוא תקין, אם ריק נמשיך בלי שגיאה
    if (phoneVal && !isValidPhone(phoneVal)) {
      custPhoneDeliveryError.textContent = "رقم تلفون مش صحيح (צריך 10 ספרות ומתחיל ב-05).";
      return false;
    } else {
      custPhoneDeliveryError.textContent = "";
    }
    docData.customerType = "delivery";
    docData.customerName = custNameDelivery.value || null;
    docData.phone = phoneVal || null;
    docData.address = {
      street: custStreet.value || null,
      houseNumber: custHouseNumber.value || null,
      city: custCity.value || null,
      floor: custFloor.value || null,
      apartment: custApartment.value || null,
      entrance: custEntrance ? (custEntrance.value || null) : null,
    };

  } else if (currentServiceType === "takeaway") {
    const phoneVal = (custPhoneTakeaway.value || "").trim();
    // טלפון אופציונלי – אם כתבו משהו, נוודא שהוא תקין, אם ריק נמשיך בלי שגיאה
    if (phoneVal && !isValidPhone(phoneVal)) {
      custPhoneTakeawayError.textContent = "رقم تلفون مش صحيح (צריך 10 ספרות ומתחיל ב-05).";
      return false;
    } else {
      custPhoneTakeawayError.textContent = "";
    }
    docData.customerType = "takeaway";
    docData.customerName = custNameTakeaway.value || null;
    docData.phone = phoneVal || null;
  } else if (currentServiceType === "dinein") {
    docData.customerType = "dinein";
    docData.tableNumber = custTableNumber.value || null;
    docData.customerName = custNameDinein.value || null;
  }

  try {
    connectionStatusEl.textContent = "שומר הזמנה...";
    const colRef = collection(db, "orders");
    const docRef = await addDoc(colRef, docData);
    console.log("Order saved with id", docRef.id);
    connectionStatusEl.textContent = "מחובר ל-Firebase";

    // Save customer profile (for delivery / takeaway)
    if (docData.customerType === "delivery" || docData.customerType === "takeaway") {
      await saveCustomerFromOrder(docData);
    }

    // On iPad/Safari sometimes the modal input value is not reflected in the in-memory object at print time.
    // To guarantee we print exactly what was saved (incl. phone), we re-read the saved document.
    let printedDocData = docData;
    try {
      const freshSnap = await getDoc(docRef);
      if (freshSnap.exists()) printedDocData = freshSnap.data();
    } catch (e) {
      console.warn("Could not re-read saved order for printing, fallback to docData", e);
    }
    // Printing
    if (currentPrintMode === "a4") {
      printOrderTicketA4(docRef.id, printedDocData);
    } else if (currentPrintMode === "usb") {
      await printOrderTicketUsb(docRef.id, printedDocData);
    } else {
      printOrderTicketPos(docRef.id, printedDocData);
    }

    return true;
  } catch (err) {
    console.error(err);
    alert("בעיה בשמירת ההזמנה. תבדוק את ה-Firebase config או את ה-Rules.");
    connectionStatusEl.textContent = "שגיאה בחיבור";
    return false;
  }
}

// Open orders listener
function setupOpenOrdersListener() {
  const colRef = collection(db, "orders");
  const qOrders = query(colRef, where("status", "==", "open"), orderBy("createdAt", "desc"));
  onSnapshot(
    qOrders,
    (snapshot) => {
      const orders = [];
      snapshot.forEach((docSnap) => orders.push({ id: docSnap.id, ...docSnap.data() }));
      currentOpenOrders = orders;
      applyOpenOrdersFilter();
      renderTakeawayPanel();
  renderTakeawayCashPill();
      renderDriversSummary(currentOpenOrders);
      refreshDriversMapMarkers();
      connectionStatusEl.textContent = "מחובר ל-Firebase";
    },
    (err) => {
      console.error("onSnapshot error", err);
      connectionStatusEl.textContent = "בעיה בחיבור ל-Firebase";
    }
  );
}






function setupClosedOrdersListener() {
  const colRef = collection(db, "orders");
  const qOrders = query(colRef, where("status", "==", "closed"), orderBy("closedAt", "desc"));
  onSnapshot(
    qOrders,
    (snapshot) => {
      const orders = [];
      snapshot.forEach((docSnap) => orders.push({ id: docSnap.id, ...docSnap.data() }));
      currentClosedOrders = orders;
      applyClosedOrdersFilter();
    },
    (err) => {
      console.error("onSnapshot closed orders error", err);
    }
  );
}

function applyClosedOrdersFilter() {
  const term = (closedOrdersSearchTerm || "").trim();
  let toRender = currentClosedOrders;
  if (term) {
    const lowerTerm = term.toLowerCase();
    toRender = currentClosedOrders.filter((order) => {
      const code = order.orderCode || (order.id ? order.id.slice(-4) : "");
      const fullId = String(order.id || "");
      const codeStr = String(code || "");
      const phoneStr = String(order.phone || "");
      const addrObj = order.address || {};
      const addrParts = [];
      if (addrObj.street) addrParts.push(addrObj.street);
      if (addrObj.houseNumber) addrParts.push(addrObj.houseNumber);
      if (addrObj.city) addrParts.push(addrObj.city);
      if (addrObj.floor) addrParts.push(`קומה ${addrObj.floor}`);
      if (addrObj.apartment) addrParts.push(`דירה ${addrObj.apartment}`);
      const addrText = addrParts.join(" ");
      const fullStr = [
        fullId,
        codeStr,
        phoneStr,
        addrText
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .join(" || ");
      return fullStr.includes(lowerTerm);
    });
  }
  renderClosedOrders(toRender);
}


function renderClosedOrders(orders) {
  if (!closedOrdersListEl) return;
  closedOrdersListEl.innerHTML = "";
  const list = Array.isArray(orders) ? orders : [];
  if (!list.length) {
    const p = document.createElement("p");
    p.className = "empty-text";
    p.textContent = "לא קיימות הזמנות סגורות.";
    closedOrdersListEl.appendChild(p);
    renderClosedOrdersFooterSummary();
    return;
  }

  list.forEach((order) => {
    const row = document.createElement("div");
    row.className = "open-order-row closed-order-row";
    row.dataset.orderId = order.id;

    let createdDate = null;
    if (order.createdAt && typeof order.createdAt.toDate === "function") {
      createdDate = order.createdAt.toDate();
    } else if (order.createdAt && order.createdAt.seconds) {
      createdDate = new Date(order.createdAt.seconds * 1000);
    }

    const main = document.createElement("div");
    main.className = "open-order-main";

    const left = document.createElement("div");
    const right = document.createElement("div");
    right.className = "open-order-right";

    const code = order.orderCode || (order.id ? order.id.slice(-4) : "");
    const driverLabel = order.driverName ? ` — שליח: ${order.driverName}` : "";
    left.textContent = `#${code} — ${order.customerName || ""}${driverLabel}`;

    const priceEl = document.createElement("div");
    priceEl.className = "open-order-price";
    priceEl.textContent = `${order.totalAmount || 0} ₪`;

    right.appendChild(priceEl);
    main.appendChild(left);
    main.appendChild(right);

    const sub = document.createElement("div");
    sub.className = "open-order-sub";

    let typeText =
      order.serviceType === "delivery"
        ? "توصيل"
        : order.serviceType === "takeaway"
        ? "خنوت"
        : order.serviceType === "dinein"
        ? "يقعد"
        : "";

    const payText = order.paymentStatus === "paid" ? "اشراي" : "مزومان";

    let extraParts = [];
    if (order.serviceType === "delivery") {
      const addrObj = order.address || {};
      const addrParts = [];
      if (addrObj.street) addrParts.push(addrObj.street);
      if (addrObj.houseNumber) addrParts.push(addrObj.houseNumber);
      if (addrObj.city) addrParts.push(addrObj.city);
      if (addrObj.floor) addrParts.push(`קומה ${addrObj.floor}`);
      if (addrObj.apartment) addrParts.push(`דירה ${addrObj.apartment}`);
      const addrText = addrParts.join(" ");
      if (addrText) extraParts.push(addrText);
      if (order.phone) extraParts.push(order.phone);
    }

    if (order.driverName) {
      extraParts.push(`שליח: ${order.driverName}`);
    }

    const extraText = extraParts.length ? " — " + extraParts.join(" | ") : "";

    let timeText = "";
    if (createdDate) {
      const hh = String(createdDate.getHours()).padStart(2, "0");
      const mm = String(createdDate.getMinutes()).padStart(2, "0");
      timeText = `${hh}:${mm}`;
    }

    const metaSpan = document.createElement("span");
    metaSpan.textContent = `${timeText ? timeText + " — " : ""}${typeText} — ${payText}${extraText}`;

    sub.appendChild(metaSpan);

    row.appendChild(main);
    row.appendChild(sub);

    closedOrdersListEl.appendChild(row);
  });

  // עדכון מלבן הסיכום בתחתית טאב "طلبات مسكره"
  renderClosedOrdersFooterSummary();
}


function renderClosedOrdersFooterSummary() {
  if (!closedOrdersFooterEl) return;

  closedOrdersFooterEl.innerHTML = "";

  const list = Array.isArray(currentClosedOrders) ? currentClosedOrders : [];
  if (!list.length) {
    // אין הזמנות סגורות – אין צורך להציג מלבן סיכום
    return;
  }

  let overallTotal = 0;
  let overallCash = 0;
  let overallCard = 0;

  const byServiceType = {
    delivery: { key: "delivery", label: "شليخ", total: 0, count: 0, cash: 0, card: 0 },
    takeaway: { key: "takeaway", label: "خنوت", total: 0, count: 0, cash: 0, card: 0 },
    dinein: { key: "dinein", label: "يقعد", total: 0, count: 0, cash: 0, card: 0 },
  };

  list.forEach((order) => {
    const amount = Number(order.totalAmount || 0) || 0;
    overallTotal += amount;

    const isCard = order.paymentStatus === "paid";
    if (isCard) {
      overallCard += amount;
    } else {
      overallCash += amount;
    }

    const svcKey = order.serviceType || "";
    const bucket = byServiceType[svcKey];
    if (bucket) {
      bucket.total += amount;
      bucket.count += 1;
      if (isCard) {
        bucket.card += amount;
      } else {
        bucket.cash += amount;
      }
    }
  });

  const card = document.createElement("div");
  card.className = "day-close-card";

  const cashText = `${overallCash.toFixed(0)} ₪ مزومان`;
  const cardText = `${overallCard.toFixed(0)} ₪ اشراي`;
  const totalText = `${overallTotal.toFixed(0)} ₪ סה\"כ`;

  const serviceLines = Object.values(byServiceType)
    .map((bucket) => {
      if (!bucket.count) return "";
      const parts = [];
      parts.push(`${bucket.label}: ${bucket.total.toFixed(0)} ₪`);
      if (bucket.cash) parts.push(`مزومان ${bucket.cash.toFixed(0)} ₪`);
      if (bucket.card) parts.push(`اشراי ${bucket.card.toFixed(0)} ₪`);
      return parts.join(" | ");
    })
    .filter(Boolean);

  const servicesHtml = serviceLines.length
    ? `<div class="day-close-note">${serviceLines.join("<br>")}</div>`
    : "";

  card.innerHTML = `
    <div class="day-close-main">
      <div class="day-close-title">סיכום طلبات مسكره</div>
      <div class="day-close-amount">مزومان ${overallCash.toFixed(0)} ₪</div>
      <div class="day-close-note">${cashText} | ${cardText}</div>
      ${servicesHtml}
    </div>
    <div class="day-close-actions">
      <button id="closeDayBtn" class="btn btn-danger btn-small">איפוס יום + הדפסה</button>
    </div>
  `;

  closedOrdersFooterEl.appendChild(card);

  const closeBtn = card.querySelector("#closeDayBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      closeDayAndPrint();
    });
  }
}
function closeOrderDetailsModal() {
  if (!orderDetailsModal) return;
  orderDetailsModal.classList.add("hidden");
}

function formatOrderServiceType(serviceType) {
  if (serviceType === "delivery") return "شليخ";
  if (serviceType === "takeaway") return "خنوت";
  if (serviceType === "dinein") return "يقعد";
  return "";
}

function formatOrderPaymentStatus(status) {
  return status === "paid" ? "اشراي" : "مزومان";
}

function openOrderDetailsModal(order) {
  if (!orderDetailsModal || !orderDetailsMetaEl || !orderDetailsItemsBody || !orderDetailsTotalsEl) return;

  const code = order.orderCode || (order.id ? order.id.slice(-4) : "");

  let createdDate = null;
  if (order.createdAt && typeof order.createdAt.toDate === "function") {
    createdDate = order.createdAt.toDate();
  } else if (order.createdAt && order.createdAt.seconds) {
    createdDate = new Date(order.createdAt.seconds * 1000);
  }

  let timeStr = "";
  if (createdDate) {
    const hh = String(createdDate.getHours()).padStart(2, "0");
    const mm = String(createdDate.getMinutes()).padStart(2, "0");
    timeStr = `${hh}:${mm}`;
  }

  const typeText = formatOrderServiceType(order.serviceType);
  const payText = formatOrderPaymentStatus(order.paymentStatus);

  const parts = [];
  parts.push(`מס׳ הזמנה: #${escapeHtml(code)}`);
  if (timeStr) parts.push(`שעה: ${escapeHtml(timeStr)}`);
  if (order.customerName) parts.push(`לקוח: ${escapeHtml(order.customerName)}`);
  if (order.phone) parts.push(`טלפון: ${escapeHtml(order.phone)}`);

  if (order.serviceType === "delivery" && order.address) {
    const a = order.address;
    const addrParts = [];
    if (a.street) addrParts.push(a.street);
    if (a.houseNumber) addrParts.push(a.houseNumber);
    if (a.city) addrParts.push(a.city);
    if (a.floor) addrParts.push(`קומה ${a.floor}`);
    if (a.apartment) addrParts.push(`דירה ${a.apartment}`);
    if (addrParts.length) {
      parts.push(`כתובת: ${escapeHtml(addrParts.join(" "))}`);
    }
  }

  parts.push(`סוג: ${typeText || ""} — ${payText}`);

  if (order.driverName) {
    parts.push(`שליח: ${escapeHtml(order.driverName)}`);
  }

  orderDetailsMetaEl.innerHTML = parts.map((p) => `<div>${p}</div>`).join("");

  // Items
  orderDetailsItemsBody.innerHTML = "";
  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.textContent = "אין פריטים בהזמנה.";
    tr.appendChild(td);
    orderDetailsItemsBody.appendChild(tr);
  } else {
    items.forEach((it, idx) => {
      const tr = document.createElement("tr");
      const colIdx = document.createElement("td");
      colIdx.textContent = String(idx + 1);

      const colName = document.createElement("td");
      const nameParts = [];
      if (it.nameAr) nameParts.push(it.nameAr);
      if (it.size) nameParts.push(`(${it.size})`);
      colName.textContent = nameParts.join(" ");

      const colQty = document.createElement("td");
      colQty.textContent = String(it.qty || 1);

      const colTotal = document.createElement("td");
      const price = Number(it.price || 0);
      const qty = Number(it.qty || 1);
      colTotal.textContent = `${(price * qty).toFixed(1)} ₪`;

      tr.appendChild(colIdx);
      tr.appendChild(colName);
      tr.appendChild(colQty);
      tr.appendChild(colTotal);

      orderDetailsItemsBody.appendChild(tr);

      if (it.notes || it.extrasText || it.extraNote) {
        const notesTr = document.createElement("tr");
        const notesTd = document.createElement("td");
        notesTd.colSpan = 4;

        // אצלנו בהרבה הזמנות התוספות נשמרות כ-HTML בתוך notes (ולפעמים בתוך extrasText).
        // לכן נבנה קודם את ה-HTML של התוספות, ואחר כך נוסיף טקסט רגיל (extraNote) אם יש.
        const extrasHtml = it.extrasText || it.notes || "";
        const extraNoteText = it.extraNote || "";

        const segments = [];

        if (extrasHtml) {
          // כאן אנחנו מניחים שהתוכן כבר כולל <span class="zone-topping-label"> וכו', ולכן לא בורחים HTML
          segments.push(extrasHtml);
        }

        if (extraNoteText) {
          segments.push(escapeHtml(extraNoteText));
        }

        notesTd.innerHTML = segments.join(" | ");
        notesTd.className = "order-details-notes-cell";
        notesTr.appendChild(notesTd);
        orderDetailsItemsBody.appendChild(notesTr);
      }
    });
  }

  const total = Number(order.totalAmount || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const itemsTotal = total - deliveryFee;

  orderDetailsTotalsEl.innerHTML = `
    <span>סך פריטים: <strong>${isNaN(itemsTotal) ? 0 : itemsTotal} ₪</strong></span>
    <span>דמי משלוח: <strong>${isNaN(deliveryFee) ? 0 : deliveryFee} ₪</strong> | סה"כ: <strong>${isNaN(total) ? 0 : total} ₪</strong></span>
  `;

  orderDetailsModal.classList.remove("hidden");
}


function applyOpenOrdersFilter() {
  const term = (openOrdersSearchTerm || "").trim();
  let toRender = currentOpenOrders;
  if (term) {
    const lowerTerm = term.toLowerCase();

    // חיפוש לפי סכום: נחלץ מספרים בלבד (תומך גם ב"₪"/רווחים/פסיקים)
    // דוגמה: "120", "120₪", "120.5", "120,5"
    const numericTermStr = lowerTerm.replace(/,/g, ".").replace(/[^0-9.]/g, "");

    toRender = currentOpenOrders.filter((order) => {
      const code = order.orderCode || (order.id ? order.id.slice(-4) : "");
      const fullId = String(order.id || "");
      const codeStr = String(code || "");
      const phoneStr = String(order.phone || "");

      const totalNum = Number(order.totalAmount || 0);
      const totalStrRaw = isNaN(totalNum) ? "" : String(totalNum);
      const totalStr0 = isNaN(totalNum) ? "" : String(Math.round(totalNum));
      const totalStr1 = isNaN(totalNum) ? "" : totalNum.toFixed(1);
      const totalStr2 = isNaN(totalNum) ? "" : totalNum.toFixed(2);
      const totalWithCurrency = totalStr1 ? `${totalStr1} ₪` : "";

      const addrObj = order.address || {};
      const addrParts = [];
      if (addrObj.street) addrParts.push(addrObj.street);
      if (addrObj.houseNumber) addrParts.push(addrObj.houseNumber);
      if (addrObj.city) addrParts.push(addrObj.city);
      if (addrObj.floor) addrParts.push(`קומה ${addrObj.floor}`);
      if (addrObj.apartment) addrParts.push(`דירה ${addrObj.apartment}`);
      const addrText = addrParts.join(" ");
      const fullStr = [
        fullId,
        codeStr,
        phoneStr,
        addrText,
        // מאפשר חיפוש לפי סה"כ (גם עם/בלי ₪ ובפורמטים שונים)
        totalStrRaw,
        totalStr0,
        totalStr1,
        totalStr2,
        totalWithCurrency
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .join(" || ");

      // אם המשתמש הקליד רק מספרים (או מספר עם נקודה) – נעשה בדיקה גם מול ניקוי מספרים
      // כדי ש"120" יתפוס גם "120.0" וכו'
      if (numericTermStr) {
        const numericFull = fullStr.replace(/[^0-9.]/g, "");
        if (numericFull.includes(numericTermStr)) return true;
      }

      return fullStr.includes(lowerTerm);
    });
  }
  renderOpenOrders(toRender);
}


function renderOpenOrders(orders) {
  openOrdersListEl.innerHTML = "";

  // חישוב סה"כ מזומן בהזמנות פתוחות (מוצג בסוף)
  // מזומן = הזמנה שלא מסומנת כ-paid (אשראי)
  const isCashOrder = (o) => {
    const ps = (o?.paymentStatus || o?.paymentMethod || o?.payment || "").toString().toLowerCase();
    // אם יש paymentStatus === 'paid' -> אשראי. אחרת -> מזומן
    if ((o?.paymentStatus || "").toString().toLowerCase() === "paid") return false;
    if (["card", "credit", "ashrai", "اشراي"].includes(ps)) return false;
    if (["cash", "mezuman", "מזומן", "مزومان"].includes(ps)) return true;
    // ברירת מחדל: לא-paid = מזומן
    return true;
  };

  const cashTotal = (orders || []).reduce((sum, o) => {
    if (!isCashOrder(o)) return sum;
    const v = Number(o?.totalAmount ?? o?.total ?? 0);
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);

  if (!orders.length) {
    const p = document.createElement("p");
    p.className = "empty-text";
    p.textContent = "לא קיימות הזמנות פתוחות.";
    openOrdersListEl.appendChild(p);
    // עדיין מציגים סה"כ מזומן = 0 כדי שתמיד יהיה עקבי
    const summary = document.createElement("div");
    summary.className = "open-orders-cash-summary";
    summary.innerHTML = `
      <div class="open-orders-cash-summary__label">סה״כ מזומן (مزومان)</div>
      <div class="open-orders-cash-summary__value">₪${cashTotal.toFixed(0)}</div>
    `;
    openOrdersListEl.appendChild(summary);
    return;
  }
  orders.forEach((order) => {
    const row = document.createElement("div");
    row.className = "open-order-row";
    row.dataset.orderId = order.id;

    // אם זו ההזמנה שהועתקה עכשיו – צובעים את כל המלבן בכתום
    if (lastClonedOrderId && order.id === lastClonedOrderId) {
      row.classList.add("open-order-cloned");
    }

    let createdDate = null;
    if (order.createdAt && typeof order.createdAt.toDate === "function") {
      createdDate = order.createdAt.toDate();
    } else if (order.createdAt && order.createdAt.seconds) {
      createdDate = new Date(order.createdAt.seconds * 1000);
    }

    if (order.serviceType === "delivery" && !order.driverName && createdDate) {
      const diffMs = Date.now() - createdDate.getTime();
      const diffMinutes = diffMs / 60000;
      if (diffMinutes >= 30) {
        row.classList.add("open-order-overdue");
      }
    }

    const main = document.createElement("div");
    main.className = "open-order-main";

    const left = document.createElement("div");
    const right = document.createElement("div");
    right.className = "open-order-right";

    const code = order.orderCode || (order.id ? order.id.slice(-4) : "");
    const driverLabel = order.driverName ? ` — שליח: ${order.driverName}` : "";

    const codeBtn = document.createElement("button");
    codeBtn.type = "button";
    codeBtn.className = "order-code-btn";
    codeBtn.textContent = `#${code}`;
    codeBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      openOrderDetailsModal(order);
    });
    left.appendChild(codeBtn);

    const priceEl = document.createElement("div");
    priceEl.className = "open-order-price";
    priceEl.textContent = `${order.totalAmount || 0} ₪`;

    const actionsEl = document.createElement("div");
    actionsEl.className = "open-order-actions";

    right.appendChild(priceEl);
    right.appendChild(actionsEl);

    main.appendChild(left);
    main.appendChild(right);

    const sub = document.createElement("div");
    sub.className = "open-order-sub";

    const typeText =
      order.serviceType === "delivery"
        ? "توصيل"
        : order.serviceType === "takeaway"
        ? "خنوت"
        : order.serviceType === "dinein"
        ? "يقعد"
        : "";

    const payText = order.paymentStatus === "paid" ? "اشراي" : "مزومان";

    let extraParts = [];
    if (order.serviceType === "delivery") {
      const addrObj = order.address || {};
      const addrParts = [];
      if (addrObj.street) addrParts.push(addrObj.street);
      if (addrObj.houseNumber) addrParts.push(addrObj.houseNumber);
      if (addrObj.city) addrParts.push(addrObj.city);
      if (addrObj.floor) addrParts.push(`קומה ${addrObj.floor}`);
      if (addrObj.apartment) addrParts.push(`דירה ${addrObj.apartment}`);
      const addrText = addrParts.join(" ");
      if (addrText) extraParts.push(addrText);
      if (order.phone) extraParts.push(order.phone);
    }

    if (order.driverName) {
      extraParts.push(`שליח: ${order.driverName}`);
    }

    const extraText = extraParts.length ? " — " + extraParts.join(" | ") : "";

    let timeText = "";
    if (createdDate) {
      const hh = String(createdDate.getHours()).padStart(2, "0");
      const mm = String(createdDate.getMinutes()).padStart(2, "0");
      timeText = `${hh}:${mm}`;
    }

    const metaSpan = document.createElement("span");
    metaSpan.textContent = `${timeText ? timeText + " — " : ""}${typeText} — ${payText}${extraText}`;

    const detailsBtn = document.createElement("button");
    detailsBtn.type = "button";
    detailsBtn.className = "btn btn-xs btn-order-details";
    detailsBtn.textContent = "تفاصيل";
    detailsBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      // Backup the current draft once, so we can "cancel" accidental details clicks
      if (!editingOrderId && !preEditSnapshot) {
        try { preEditSnapshot = captureDraftSnapshot(); } catch (e) { preEditSnapshot = null; }
      }
      editingOrderId = order.id;
      loadOrderIntoCurrent(order);
      if (cancelEditBtn) cancelEditBtn.classList.remove("hidden");
    });

    const cloneBtn = document.createElement("button");
    cloneBtn.type = "button";
    cloneBtn.className = "btn btn-xs btn-secondary";
    cloneBtn.textContent = "نسخ";
    cloneBtn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      try {
        if (!order) return;
        connectionStatusEl.textContent = "מעתיק הזמנה...";
        const newCode = await generateOrderCode(order.serviceType || null);

        const docData = { ...order };

        delete docData.id;
        delete docData.createdAt;
        delete docData.updatedAt;
        delete docData.closedAt;

        // לא מעתיקים שיוך לשליח להזמנה החדשה
        delete docData.driverId;
        delete docData.driverName;
        delete docData.driverPhone;

        docData.orderCode = newCode;
        docData.status = "open";
        docData.createdAt = serverTimestamp();
        docData.updatedAt = serverTimestamp();

        const colRef = collection(db, "orders");
        const docRef = await addDoc(colRef, docData);

        // סימון ההזמנה המועתקת האחרונה כדי לצבוע אותה בכתום ברשימת ההזמנות הפתוחות
        lastClonedOrderId = docRef.id;

        connectionStatusEl.textContent = "מחובר ל-Firebase";
      } catch (err) {
        console.error("failed to duplicate order", err);
        alert("בעיה בהעתקת ההזמנה.");
        connectionStatusEl.textContent = "שגיאה בחיבור ל-Firebase";
      }
    });

    const printBtn = document.createElement("button");
    printBtn.type = "button";
    printBtn.className = "btn btn-xs btn-secondary";
    printBtn.textContent = "اطبع";
    printBtn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      try {
        const docRef = doc(db, "orders", order.id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          alert("לא נמצאו נתוני הזמנה להדפסה.");
          return;
        }
        const data = snap.data();
        if (currentPrintMode === "a4") {
          printOrderTicketA4(order.id, data);
        } else if (currentPrintMode === "usb") {
          printOrderTicketUsb(order.id, data);
        } else {
          printOrderTicketPos(order.id, data);
        }
      } catch (err) {
        console.error(err);
        alert("שגיאה בעת הדפסה.");
      }
    });

    const togglePayBtn = document.createElement("button");
    togglePayBtn.type = "button";
    togglePayBtn.className = "btn btn-xs btn-secondary";
    togglePayBtn.textContent = "نوع الدفع";
    togglePayBtn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      const identity = await requireAdminIdentity("PIN מנהל לשינוי סוג התשלום:");
      if (!identity) return;
      try {
        const previousStatus = order.paymentStatus === "paid" ? "paid" : "unpaid";
        const newStatus = previousStatus === "paid" ? "unpaid" : "paid";
        const docRef = doc(db, "orders", order.id);
        await updateDoc(docRef, {
          paymentStatus: newStatus,
          isPaid: newStatus === "paid"
        });
        const total = Number(order.totalAmount || 0);
        const code = order.orderCode || (order.id ? order.id.slice(-4) : "");
        await logAdminAction({
          type: "PAYMENT_TOGGLE",
          orderId: order.id,
          orderCode: code,
          fromStatus: previousStatus,
          toStatus: newStatus,
          orderTotal: isNaN(total) ? null : total,
          serviceType: order.serviceType || null,
          driverId: order.driverId || null,
          driverName: order.driverName || null,
          adminId: identity.adminId || null,
          adminPin: identity.adminPin || null,
          adminName: identity.adminName || null,
          adminRole: identity.adminRole || (identity.isSuper ? "super" : "sub")
        });
      } catch (err) {
        console.error(err);
        alert("שגיאה בעדכון סוג התשלום.");
      }
    });

    const priceBtn = document.createElement("button");
    priceBtn.type = "button";
    priceBtn.className = "btn btn-xs btn-secondary";
    priceBtn.textContent = "السعر";
    priceBtn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      const identity = await requireAdminIdentity("PIN מנהל לשינוי מחיר ההזמנה:");
      if (!identity) return;
      const currentTotal = Number(order.totalAmount || 0);
      const code = order.orderCode || (order.id ? order.id.slice(-4) : "");
      const input = window.prompt(
        `המחיר הנוכחי להזמנה #${code} הוא ${isNaN(currentTotal) ? 0 : currentTotal} ₪. הכנס מחיר חדש:`,
        !isNaN(currentTotal) && currentTotal > 0 ? String(currentTotal) : ""
      );
      if (input === null) return;
      const newTotal = Number(input);
      if (isNaN(newTotal) || newTotal < 0) {
        alert("סכום לא תקין.");
        return;
      }
      try {
        const docRef = doc(db, "orders", order.id);
        await updateDoc(docRef, {
          totalAmount: newTotal,
          updatedAt: serverTimestamp()
        });
        order.totalAmount = newTotal;
        priceEl.textContent = `${newTotal} ₪`;
        const idx = currentOpenOrders.findIndex((o) => o.id === order.id);
        if (idx !== -1) {
          currentOpenOrders[idx].totalAmount = newTotal;
        }
        const prevTotal = isNaN(currentTotal) ? null : currentTotal;
        const loggedNew = isNaN(newTotal) ? null : newTotal;
        const diffTotal =
          prevTotal != null && loggedNew != null ? loggedNew - prevTotal : null;
        await logAdminAction({
          type: "PRICE_CHANGE",
          orderId: order.id,
          orderCode: code,
          fromTotal: prevTotal,
          toTotal: loggedNew,
          oldTotal: prevTotal,
          newTotal: loggedNew,
          diffTotal,
          serviceType: order.serviceType || null,
          driverId: order.driverId || null,
          driverName: order.driverName || null,
          adminId: identity.adminId || null,
          adminPin: identity.adminPin || null,
          adminName: identity.adminName || null,
          adminRole: identity.adminRole || (identity.isSuper ? "super" : "sub")
        });
      } catch (err) {
        console.error("failed to update order total", err);
        alert("שגיאה בעדכון הסכום.");
      }
    });

    sub.appendChild(metaSpan);

    const editMetaBtn = document.createElement("button");
    editMetaBtn.type = "button";
    editMetaBtn.className = "btn btn-xs btn-secondary";
    editMetaBtn.textContent = "حدث";
    editMetaBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (!openOrderEditMetaModal) return;
      editingOpenOrderMeta = order;
      const addr = order.address || {};
      if (openEditNameInput) openEditNameInput.value = order.customerName || "";
      if (openEditPhoneInput) openEditPhoneInput.value = order.phone || "";
      if (openEditCityInput) openEditCityInput.value = addr.city || "";
      if (openEditStreetInput) openEditStreetInput.value = addr.street || "";
      if (openEditHouseInput) openEditHouseInput.value = addr.houseNumber || "";
      if (openEditFloorInput) openEditFloorInput.value = addr.floor || "";
      if (openEditApartmentInput) openEditApartmentInput.value = addr.apartment || "";
      if (openEditEntranceInput) openEditEntranceInput.value = addr.entrance || "";

      openEditServiceType = order.serviceType || "delivery";
      if (openEditServiceTypeGroup) {
        openEditServiceTypeGroup.querySelectorAll("button").forEach((btn) => {
          btn.classList.toggle("active", btn.dataset.type === openEditServiceType);
        });
      }

      openOrderEditMetaModal.classList.remove("hidden");
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-xs btn-danger";
    deleteBtn.textContent = "حذف";
    deleteBtn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      const identity = await requireAdminIdentity("PIN מנהל למחיקת הזמנה:");
      if (!identity) return;
      const sure = confirm("למחוק את ההזמנה הזאת?");
      if (!sure) return;
      try {
        const total = Number(order.totalAmount || 0);
        const code = order.orderCode || (order.id ? order.id.slice(-4) : "");
        const docRef = doc(db, "orders", order.id);
        await deleteDoc(docRef);
        await logAdminAction({
          type: "ORDER_DELETE",
          orderId: order.id,
          orderCode: code,
          orderTotal: isNaN(total) ? null : total,
          serviceType: order.serviceType || null,
          driverId: order.driverId || null,
          driverName: order.driverName || null,
          adminId: identity.adminId || null,
          adminPin: identity.adminPin || null,
          adminName: identity.adminName || null,
          adminRole: identity.adminRole || (identity.isSuper ? "super" : "sub")
        });
      } catch (err) {
        console.error(err);
        alert("שגיאה במחיקת ההזמנה.");
      }
    });

    actionsEl.appendChild(togglePayBtn);
    actionsEl.appendChild(printBtn);
    actionsEl.appendChild(priceBtn);
    actionsEl.appendChild(detailsBtn);
    actionsEl.appendChild(cloneBtn);
    actionsEl.appendChild(editMetaBtn);
    actionsEl.appendChild(deleteBtn);

    row.appendChild(main);
    row.appendChild(sub);

    // No automatic edit on row click – only via تفاصيل button
    openOrdersListEl.appendChild(row);
  });

  // כרטיס סיכום מזומן בסוף הרשימה
  const summary = document.createElement("div");
  summary.className = "open-orders-cash-summary";
  summary.innerHTML = `
    <div class="open-orders-cash-summary__label">סה״כ מזומן (مزومان)</div>
    <div class="open-orders-cash-summary__value">₪${cashTotal.toFixed(0)}</div>
  `;
  openOrdersListEl.appendChild(summary);
}

function getTakeawayOrdersList() {
  const all = currentOpenOrders || [];
  return all.filter((order) => {
    if (!order) return false;
    if (order.driverId) return false;
    return order.serviceType === "takeaway" || order.serviceType === "dinein";
  });
}

async function closeAllTakeawayOrders(orders) {
  const list = Array.isArray(orders) ? orders : getTakeawayOrdersList();
  if (!list.length) {
    alert("אין הזמנות خنوت / يقعد פתוחות.");
    return;
  }
  if (!window.confirm(`לסגור ${list.length} הזמנות خنوت / يقعد?`)) {
    return;
  }
  try {
    for (const order of list) {
      const ref = doc(db, "orders", order.id);
      await updateDoc(ref, {
        status: "closed",
        closedAt: serverTimestamp(),
      });
      const closedCopy = Object.assign({}, order, {
        status: "closed",
        closedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      });
      if (!Array.isArray(currentClosedOrders)) {
        currentClosedOrders = [];
      }
      currentClosedOrders.unshift(closedCopy);
    }
    const idsToClose = new Set(list.map((o) => o.id));
    currentOpenOrders = (currentOpenOrders || []).filter(
      (o) => !idsToClose.has(o.id)
    );
    applyOpenOrdersFilter();
    applyClosedOrdersFilter();
    renderTakeawayPanel();
  renderTakeawayCashPill();
  } catch (err) {
    console.error("failed to close takeaway orders in bulk", err);
    alert("בעיה בסגירת הזמנות خنوت / يقعد.");
  }
}

function renderTakeawayPanel() {
  if (!takeawayOrdersListEl || !takeawayTotalsEl) return;

  const orders = getTakeawayOrdersList();
  const summary = calculateHallAndTakeawaySummary(orders);
  const dinein = summary.dinein || { cash: 0, card: 0 };
  const takeaway = summary.takeaway || { cash: 0, card: 0 };

  const totalCash = dinein.cash + takeaway.cash;
  const totalCard = dinein.card + takeaway.card;

  if (summary.hasAny) {
    takeawayTotalsEl.innerHTML =
      `<div class="takeaway-summary-card">
         <div class="takeaway-summary-row">
           <span class="takeaway-summary-label">يقعد</span>
           <span class="takeaway-summary-values">مزومان: ${dinein.cash.toFixed(0)} ₪ | اشراي: ${dinein.card.toFixed(0)} ₪</span>
         </div>
         <div class="takeaway-summary-row">
           <span class="takeaway-summary-label">خنوت</span>
           <span class="takeaway-summary-values">مزومان: ${takeaway.cash.toFixed(0)} ₪ | اشراي: ${takeaway.card.toFixed(0)} ₪</span>
         </div>
         <div class="takeaway-summary-row takeaway-summary-row--total">
           <span class="takeaway-summary-label">סה"כ</span>
           <span class="takeaway-summary-values">مزومان: ${totalCash.toFixed(0)} ₪ | اشراי: ${totalCard.toFixed(0)} ₪</span>
         </div>
         <div class="takeaway-summary-actions">
           <button id="takeawayCloseAllBtn" class="btn btn-xs btn-danger">סגירה לכל ההזמנות</button>
         </div>
       </div>`;
  } else {
    takeawayTotalsEl.innerHTML =
      '<span class="empty-text">אין כרגע הזמנות خنوت / يقعد פתוחות ללא שליח.</span>';
  }

  // כפתור סגירה לכל ההזמנות
  const closeAllBtn = document.getElementById("takeawayCloseAllBtn");
  if (closeAllBtn) {
    closeAllBtn.addEventListener("click", async () => {
      const pin = prompt("הכנס PIN מנהל לסגירת כל ההזמנות");
      if (!pin) return;
      try {
        const ok = await verifyAdminPin(String(pin).trim());
        if (!ok) {
          alert("PIN לא תקין");
          return;
        }
      } catch (err) {
        console.error("verifyAdminPin failed", err);
        alert("אירעה שגיאה באימות ה-PIN");
        return;
      }
      closeAllTakeawayOrders(orders);
    });
  }

  takeawayOrdersListEl.innerHTML = "";
  if (!orders.length) {
    const p = document.createElement("p");
    p.className = "empty-text";
    p.textContent = "אין הזמנות خنوت / يقعد פתוחות.";
    takeawayOrdersListEl.appendChild(p);
    return;
  }

  orders.forEach((order) => {
    const row = document.createElement("div");
    row.className = "open-order-row";
    row.dataset.orderId = order.id;

    // אם זו ההזמנה שהועתקה עכשיו – צובעים את כל המלבן בכתום
    if (lastClonedOrderId && order.id === lastClonedOrderId) {
      row.classList.add("open-order-cloned");
    }

    let createdDate = null;
    if (order.createdAt && typeof order.createdAt.toDate === "function") {
      createdDate = order.createdAt.toDate();
    } else if (order.createdAt && order.createdAt.seconds) {
      createdDate = new Date(order.createdAt.seconds * 1000);
    }

    const main = document.createElement("div");
    main.className = "open-order-main";

    const left = document.createElement("div");
    const right = document.createElement("div");
    right.className = "open-order-right";

    const code = order.orderCode || (order.id ? order.id.slice(-4) : "");
    left.textContent = `#${code} — ${order.customerName || ""}`;

    const priceEl = document.createElement("div");
    priceEl.className = "open-order-price";
    priceEl.textContent = `${order.totalAmount || 0} ₪`;

    main.appendChild(left);
    main.appendChild(priceEl);

    const sub = document.createElement("div");
    sub.className = "open-order-sub";

    const typeText =
      order.serviceType === "delivery"
        ? "توصيل"
        : order.serviceType === "takeaway"
        ? "خنوت"
        : order.serviceType === "dinein"
        ? "يقعد"
        : "";

    const payText = order.paymentStatus === "paid" ? "اشراي" : "مزومان";

    const extraParts = [];
    if (createdDate) {
      const hh = String(createdDate.getHours()).padStart(2, "0");
      const mm = String(createdDate.getMinutes()).padStart(2, "0");
      extraParts.push(`${hh}:${mm}`);
    }

    const metaSpan = document.createElement("span");
    metaSpan.textContent = `${typeText} — ${payText}${
      extraParts.length ? " — " + extraParts.join(" | ") : ""
    }`;

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "btn btn-xs btn-secondary";
    closeBtn.textContent = "סגור הזמנה";
    closeBtn.addEventListener("click", async (ev) => {
      ev.stopPropagation();

      const pin = prompt("הכנס PIN מנהל לסגירת הזמנה");
      if (!pin) return;
      try {
        const ok = await verifyAdminPin(String(pin).trim());
        if (!ok) {
          alert("PIN לא תקין");
          return;
        }
      } catch (err) {
        console.error("verifyAdminPin failed", err);
        alert("אירעה שגיאה באימות ה-PIN");
        return;
      }
      try {
        const ref = doc(db, "orders", order.id);
        await updateDoc(ref, {
          status: "closed",
          closedAt: serverTimestamp(),
        });
        // עדכון מקומי
        try {
          currentOpenOrders = (currentOpenOrders || []).filter(
            (o) => o.id !== order.id
          );
          applyOpenOrdersFilter();
          const closedCopy = Object.assign({}, order, {
            status: "closed",
            closedAt: {
              seconds: Math.floor(Date.now() / 1000),
              nanoseconds: 0,
            },
          });
          if (!Array.isArray(currentClosedOrders)) {
            currentClosedOrders = [];
          }
          currentClosedOrders.unshift(closedCopy);
          applyClosedOrdersFilter();
          renderTakeawayPanel();
  renderTakeawayCashPill();
        } catch (uiErr) {
          console.error(
            "failed to update local UI after closing takeaway order",
            uiErr
          );
        }
      } catch (err) {
        console.error("failed to close takeaway order", err);
        alert("בעיה בסגירת ההזמנה.");
      }
    });

    sub.appendChild(metaSpan);
    sub.appendChild(closeBtn);

    row.appendChild(main);
    row.appendChild(sub);

    takeawayOrdersListEl.appendChild(row);
  });
}


// ===== Drivers summary & order
if (openOrdersSearchInput) {
  openOrdersSearchInput.addEventListener("input", (ev) => {
    openOrdersSearchTerm = ev.target.value || "";
    applyOpenOrdersFilter();
  });
}
if (closedOrdersSearchInput) {
  closedOrdersSearchInput.addEventListener("input", (ev) => {
    closedOrdersSearchTerm = ev.target.value || "";
    applyClosedOrdersFilter();
  });
}

function calculateHallAndTakeawaySummary(ordersInput) {
  const orders = Array.isArray(ordersInput) ? ordersInput : currentOpenOrders || [];
  const result = {
    dinein: { cash: 0, card: 0, cashCount: 0, cardCount: 0 },
    takeaway: { cash: 0, card: 0, cashCount: 0, cardCount: 0 },
    hasAny: false,
  };

  for (const order of orders) {
    if (!order) continue;
    if (order.driverId) continue; // רק הזמנות בלי שליח
    if (order.serviceType !== "dinein" && order.serviceType !== "takeaway") continue;

    const amount = Number(order.totalAmount || 0) || 0;
    if (!amount) continue;

    const bucket = order.serviceType === "dinein" ? result.dinein : result.takeaway;
    const isCard = order.paymentStatus === "paid"; // اشراي
    if (isCard) {
      bucket.card += amount;
      bucket.cardCount += 1;
    } else {
      bucket.cash += amount;
      bucket.cashCount += 1;
    }
    result.hasAny = true;
  }

  return result;
}

function openTakeawaySummaryModalWithData() {
  if (!takeawaySummaryModal || !takeawaySummaryTableBody) return;

  const summary = calculateHallAndTakeawaySummary();
  const rows = [
    { key: "dinein", label: "يقعد" },
    { key: "takeaway", label: "خنوت" },
  ];

  takeawaySummaryTableBody.innerHTML = "";

  let totalCash = 0;
  let totalCard = 0;

  rows.forEach(({ key, label }) => {
    const data = summary[key];
    totalCash += data.cash;
    totalCard += data.card;

    const tr = document.createElement("tr");
    const tdType = document.createElement("td");
    tdType.textContent = label;
    const tdCash = document.createElement("td");
    tdCash.textContent = data.cash.toFixed(0);
    const tdCard = document.createElement("td");
    tdCard.textContent = data.card.toFixed(0);

    tr.appendChild(tdType);
    tr.appendChild(tdCash);
    tr.appendChild(tdCard);
    takeawaySummaryTableBody.appendChild(tr);
  });

  const trTotal = document.createElement("tr");
  const tdLabelTotal = document.createElement("td");
  tdLabelTotal.textContent = 'סה"כ';
  const tdCashTotal = document.createElement("td");
  tdCashTotal.textContent = totalCash.toFixed(0);
  const tdCardTotal = document.createElement("td");
  tdCardTotal.textContent = totalCard.toFixed(0);
  trTotal.appendChild(tdLabelTotal);
  trTotal.appendChild(tdCashTotal);
  trTotal.appendChild(tdCardTotal);
  takeawaySummaryTableBody.appendChild(trTotal);

  if (takeawaySummaryEmptyEl) {
    takeawaySummaryEmptyEl.textContent = summary.hasAny
      ? ""
      : "אין כרגע הזמנות خنوت / يقعد פתוחות ללא שליח.";
  }

  takeawaySummaryModal.classList.remove("hidden");
}

const ordersTabBtn = document.getElementById("ordersTabBtn");
const closedOrdersTabBtn = document.getElementById("closedOrdersTabBtn");
const driversTabBtn = document.getElementById("driversTabBtn");
const mapTabBtn = document.getElementById("mapTabBtn");
const driversSummaryPanel = document.getElementById("driversSummaryPanel");
const driversSummaryContent = document.getElementById("driversSummaryContent");
const driversMapContainer = document.getElementById("driversMap");
const mapModal = document.getElementById("mapModal");
const mapModalCloseBtn = document.getElementById("mapModalCloseBtn");
const mapModalBackdrop = document.getElementById("mapModalBackdrop");
const orderEditModal = document.getElementById("orderEditModal");
const orderEditTitle = document.getElementById("orderEditTitle");
const orderEditItems = document.getElementById("orderEditItems");
const orderEditTotalInput = document.getElementById("orderEditTotalInput");
const orderEditAddItemBtn = document.getElementById("orderEditAddItemBtn");
const orderEditCancelBtn = document.getElementById("orderEditCancelBtn");
const orderEditSaveBtn = document.getElementById("orderEditSaveBtn");

let editingOrderId = null;
let preEditSnapshot = null; // backup draft before loading an open order

function captureDraftSnapshot() {
  return {
    items: JSON.parse(JSON.stringify(currentOrderItems || [])),
    serviceType: currentServiceType || null,
    paymentStatus: currentPaymentStatus || null,
    deliveryFee: currentDeliveryFee || 0,
    fields: {
      custNameDelivery: (typeof custNameDelivery !== "undefined" && custNameDelivery) ? custNameDelivery.value : "",
      custPhoneDelivery: (typeof custPhoneDelivery !== "undefined" && custPhoneDelivery) ? custPhoneDelivery.value : "",
      custStreet: (typeof custStreet !== "undefined" && custStreet) ? custStreet.value : "",
      custHouseNumber: (typeof custHouseNumber !== "undefined" && custHouseNumber) ? custHouseNumber.value : "",
      custFloor: (typeof custFloor !== "undefined" && custFloor) ? custFloor.value : "",
      custApartment: (typeof custApartment !== "undefined" && custApartment) ? custApartment.value : "",
      custEntrance: (typeof custEntrance !== "undefined" && custEntrance) ? custEntrance.value : "",
      custCity: (typeof custCity !== "undefined" && custCity) ? custCity.value : "",
      custNameTakeaway: (typeof custNameTakeaway !== "undefined" && custNameTakeaway) ? custNameTakeaway.value : "",
      custPhoneTakeaway: (typeof custPhoneTakeaway !== "undefined" && custPhoneTakeaway) ? custPhoneTakeaway.value : "",
      custTableNumber: (typeof custTableNumber !== "undefined" && custTableNumber) ? custTableNumber.value : "",
      custNameDinein: (typeof custNameDinein !== "undefined" && custNameDinein) ? custNameDinein.value : "",
      paymentNotes: (typeof paymentNotes !== "undefined" && paymentNotes) ? paymentNotes.value : "",
    },
  };
}

function restoreDraftSnapshot(snap) {
  if (!snap) return;
  currentOrderItems = Array.isArray(snap.items) ? snap.items : [];
  currentServiceType = snap.serviceType || null;
  currentPaymentStatus = snap.paymentStatus || null;
  currentDeliveryFee = Number(snap.deliveryFee || 0) || 0;
  updateDeliveryFeeDisplay();
  if (snap.fields) {
    if (typeof custNameDelivery !== "undefined" && custNameDelivery && "custNameDelivery" in snap.fields) custNameDelivery.value = snap.fields["custNameDelivery"] || "";
    if (typeof custPhoneDelivery !== "undefined" && custPhoneDelivery && "custPhoneDelivery" in snap.fields) custPhoneDelivery.value = snap.fields["custPhoneDelivery"] || "";
    if (typeof custStreet !== "undefined" && custStreet && "custStreet" in snap.fields) custStreet.value = snap.fields["custStreet"] || "";
    if (typeof custHouseNumber !== "undefined" && custHouseNumber && "custHouseNumber" in snap.fields) custHouseNumber.value = snap.fields["custHouseNumber"] || "";
    if (typeof custFloor !== "undefined" && custFloor && "custFloor" in snap.fields) custFloor.value = snap.fields["custFloor"] || "";
    if (typeof custApartment !== "undefined" && custApartment && "custApartment" in snap.fields) custApartment.value = snap.fields["custApartment"] || "";
    if (typeof custEntrance !== "undefined" && custEntrance && "custEntrance" in snap.fields) custEntrance.value = snap.fields["custEntrance"] || "";
    if (typeof custCity !== "undefined" && custCity && "custCity" in snap.fields) custCity.value = snap.fields["custCity"] || "";
    if (typeof custNameTakeaway !== "undefined" && custNameTakeaway && "custNameTakeaway" in snap.fields) custNameTakeaway.value = snap.fields["custNameTakeaway"] || "";
    if (typeof custPhoneTakeaway !== "undefined" && custPhoneTakeaway && "custPhoneTakeaway" in snap.fields) custPhoneTakeaway.value = snap.fields["custPhoneTakeaway"] || "";
    if (typeof custTableNumber !== "undefined" && custTableNumber && "custTableNumber" in snap.fields) custTableNumber.value = snap.fields["custTableNumber"] || "";
    if (typeof custNameDinein !== "undefined" && custNameDinein && "custNameDinein" in snap.fields) custNameDinein.value = snap.fields["custNameDinein"] || "";
    if (typeof paymentNotes !== "undefined" && paymentNotes && "paymentNotes" in snap.fields) paymentNotes.value = snap.fields["paymentNotes"] || "";

  }
  if (currentServiceType) setServiceType(currentServiceType);
  if (currentPaymentStatus) setPaymentStatus(currentPaymentStatus);
  renderCurrentOrder();
}

function switchToOrdersTab() {
  if (ordersTabBtn) ordersTabBtn.classList.add("active");
  if (closedOrdersTabBtn) closedOrdersTabBtn.classList.remove("active");
  if (driversTabBtn) driversTabBtn.classList.remove("active");
  if (mapTabBtn) mapTabBtn.classList.remove("active");
  if (takeawaySummaryBtn) takeawaySummaryBtn.classList.remove("active");

  if (openOrdersPanel) openOrdersPanel.classList.remove("hidden");
  if (closedOrdersPanel) closedOrdersPanel.classList.add("hidden");
  if (takeawayPanel) takeawayPanel.classList.add("hidden");
  if (driversSummaryPanel) driversSummaryPanel.classList.add("hidden");
  if (driversSummaryPanel) driversSummaryPanel.classList.remove("map-mode");
  if (driversSummaryContent) driversSummaryContent.classList.remove("hidden");
  if (driversMapContainer) driversMapContainer.classList.add("hidden");
}

function switchToClosedOrdersTab() {
  if (closedOrdersTabBtn) closedOrdersTabBtn.classList.add("active");
  if (ordersTabBtn) ordersTabBtn.classList.remove("active");
  if (driversTabBtn) driversTabBtn.classList.remove("active");
  if (mapTabBtn) mapTabBtn.classList.remove("active");
  if (takeawaySummaryBtn) takeawaySummaryBtn.classList.remove("active");

  if (openOrdersPanel) openOrdersPanel.classList.add("hidden");
  if (closedOrdersPanel) closedOrdersPanel.classList.remove("hidden");
  if (takeawayPanel) takeawayPanel.classList.add("hidden");
  if (driversSummaryPanel) driversSummaryPanel.classList.add("hidden");
  if (driversSummaryPanel) driversSummaryPanel.classList.remove("map-mode");
  if (driversSummaryContent) driversSummaryContent.classList.remove("hidden");
  if (driversMapContainer) driversMapContainer.classList.add("hidden");
}

function switchToDriversTab() {
  if (driversTabBtn) driversTabBtn.classList.add("active");
  if (ordersTabBtn) ordersTabBtn.classList.remove("active");
  if (closedOrdersTabBtn) closedOrdersTabBtn.classList.remove("active");
  if (mapTabBtn) mapTabBtn.classList.remove("active");
  if (takeawaySummaryBtn) takeawaySummaryBtn.classList.remove("active");

  if (openOrdersPanel) openOrdersPanel.classList.add("hidden");
  if (closedOrdersPanel) closedOrdersPanel.classList.add("hidden");
  if (takeawayPanel) takeawayPanel.classList.add("hidden");
  if (driversSummaryPanel) driversSummaryPanel.classList.remove("hidden");
  if (driversSummaryPanel) driversSummaryPanel.classList.remove("map-mode");
  if (driversSummaryContent) driversSummaryContent.classList.remove("hidden");
  if (driversMapContainer) driversMapContainer.classList.add("hidden");
}

function openMapModal() {
  if (!mapModal) return;
  mapModal.classList.remove("hidden");
  initDriversMap();
  if (driversMap) {
    setTimeout(() => {
      try { driversMap.invalidateSize(); } catch (e) {}
    }, 120);
  }
}

function closeMapModal() {
  if (!mapModal) return;
  mapModal.classList.add("hidden");
  if (mapTabBtn) mapTabBtn.classList.remove("active");
}

function switchToMapTab() {
  // מפה בחלון קופץ (לא משנה את הטאבים)
  if (mapTabBtn) mapTabBtn.classList.add("active");
  openMapModal();
}

function switchToTakeawayTab() {
  if (takeawaySummaryBtn) takeawaySummaryBtn.classList.add("active");
  if (ordersTabBtn) ordersTabBtn.classList.remove("active");
  if (closedOrdersTabBtn) closedOrdersTabBtn.classList.remove("active");
  if (driversTabBtn) driversTabBtn.classList.remove("active");
  if (mapTabBtn) mapTabBtn.classList.remove("active");

  if (openOrdersPanel) openOrdersPanel.classList.add("hidden");
  if (closedOrdersPanel) closedOrdersPanel.classList.add("hidden");
  if (takeawayPanel) takeawayPanel.classList.remove("hidden");
  if (driversSummaryPanel) driversSummaryPanel.classList.add("hidden");
  if (driversSummaryPanel) driversSummaryPanel.classList.remove("map-mode");
  if (driversSummaryContent) driversSummaryContent.classList.remove("hidden");
  if (driversMapContainer) driversMapContainer.classList.add("hidden");

  renderTakeawayPanel();
  renderTakeawayCashPill();
}


if (ordersTabBtn) {
  ordersTabBtn.addEventListener("click", switchToOrdersTab);
}
if (closedOrdersTabBtn) {
  closedOrdersTabBtn.addEventListener("click", switchToClosedOrdersTab);
}
if (driversTabBtn) {
  driversTabBtn.addEventListener("click", switchToDriversTab);
}
if (mapTabBtn) {
  mapTabBtn.addEventListener("click", switchToMapTab);
}
if (takeawaySummaryBtn) {
  takeawaySummaryBtn.addEventListener("click", switchToTakeawayTab);
}

// Map modal close handlers
if (mapModalCloseBtn) {
  mapModalCloseBtn.addEventListener("click", closeMapModal);
}
if (mapModalBackdrop) {
  mapModalBackdrop.addEventListener("click", closeMapModal);
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && mapModal && !mapModal.classList.contains("hidden")) {
    closeMapModal();
  }
});

function renderDriversSummary(orders) {
  if (!driversSummaryContent) return;

  driversSummaryContent.innerHTML = "";

  const allOrders = Array.isArray(orders) ? orders : [];

  if (!allOrders.length) {
    const p = document.createElement("p");
    p.className = "empty-text";
    p.textContent = "אין הזמנות פתוחות.";
    driversSummaryContent.appendChild(p);

    // חשוב: גם אם אין הזמנות פתוחות, עדיין רוצים לאפשר "סיום יום" לפי ההזמנות הסגורות
    // ולכן לא מנקים את הפוטר של "طلبات مسكره" — אלא מרנדרים אותו מחדש לפי currentClosedOrders.
    renderClosedOrdersFooterSummary();
    return;
  }

  const byDriver = new Map();

  allOrders.forEach((order) => {
    if (!order || !order.driverId || !order.driverName) return;
    const key = order.driverId;
    if (!byDriver.has(key)) {
      byDriver.set(key, {
        driverId: order.driverId,
        driverName: order.driverName,
        orders: [],
        totalAll: 0,
        totalCash: 0,
        cashCount: 0,
      });
    }
    const bucket = byDriver.get(key);
    bucket.orders.push(order);
    const amount = Number(order.totalAmount || 0) || 0;
    bucket.totalAll += amount;
    if (order.paymentStatus !== "paid") {
      bucket.totalCash += amount;
      bucket.cashCount += 1;
    }
  });

  if (!byDriver.size) {
    const p = document.createElement("p");
    p.className = "empty-text";
    p.textContent = "אין הזמנות משויכות לשליחים.";
    driversSummaryContent.appendChild(p);
    return;
  }

  let overallCashTotal = 0;

  byDriver.forEach((bucket) => {
    overallCashTotal += bucket.totalCash;

    const row = document.createElement("div");
    row.className = "driver-summary-row";

    const header = document.createElement("div");
    header.className = "driver-summary-header";

    const nameEl = document.createElement("div");
    nameEl.className = "driver-summary-name";
    nameEl.textContent = bucket.driverName;

    const totalsEl = document.createElement("div");
    totalsEl.className = "driver-summary-total";
    const cashText = bucket.totalCash
      ? `${bucket.totalCash.toFixed(0)} ₪ مزومان`
      : "0 ₪ مزومان";
    const allText =
      bucket.totalAll !== bucket.totalCash
        ? ` (סה"כ כולל اشراي: ${bucket.totalAll.toFixed(0)} ₪)`
        : "";
    totalsEl.textContent = cashText + allText;

    const headerRight = document.createElement("div");
    headerRight.className = "driver-summary-header-right";
    headerRight.appendChild(totalsEl);

    const closeAllBtn = document.createElement("button");
    closeAllBtn.className = "driver-summary-close-all-btn";
    closeAllBtn.textContent = "סגור הכל";
    closeAllBtn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      if (!bucket.orders.length) return;

      const pin = prompt("הכנס PIN מנהל לסגירת כל ההזמנות של השליח");
      if (!pin) return;
      try {
        const ok = await verifyAdminPin(String(pin).trim());
        if (!ok) {
          alert("PIN לא תקין");
          return;
        }
      } catch (err) {
        console.error("verifyAdminPin failed", err);
        alert("אירעה שגיאה באימות ה-PIN");
        return;
      }

      if (!confirm(`לסגור את כל ${bucket.orders.length} ההזמנות של השליח הזה?`)) {
        return;
      }

      const ordersToClose = bucket.orders.slice();
      try {
        // נסגור בפיירבייס
        await Promise.all(
          ordersToClose.map((order) => {
            const ref = doc(db, "orders", order.id);
            return updateDoc(ref, {
              status: "closed",
              closedAt: serverTimestamp(),
            });
          })
        );

        // עדכון מקומי מידי ב-UI
        try {
          const ids = new Set(ordersToClose.map((o) => o.id));
          currentOpenOrders = (currentOpenOrders || []).filter(
            (o) => !ids.has(o.id)
          );

          if (!Array.isArray(currentClosedOrders)) {
            currentClosedOrders = [];
          }
          const nowSeconds = Math.floor(Date.now() / 1000);
          ordersToClose.forEach((order) => {
            const closedCopy = Object.assign({}, order, {
              status: "closed",
              closedAt: { seconds: nowSeconds, nanoseconds: 0 },
            });
            currentClosedOrders.unshift(closedCopy);
          });

          applyOpenOrdersFilter();
          applyClosedOrdersFilter();
          renderTakeawayPanel();
  renderTakeawayCashPill();
          renderDriversSummary(currentOpenOrders);
        } catch (uiErr) {
          console.error(
            "failed to update local UI after closing all driver orders",
            uiErr
          );
        }
      } catch (err) {
        console.error("failed to close all orders for driver", err);
        alert("בעיה בסגירת כל ההזמנות לשליח.");
      }
    });

    headerRight.appendChild(closeAllBtn);

    header.appendChild(nameEl);
    header.appendChild(headerRight);

    const meta = document.createElement("div");
    meta.className = "driver-summary-meta";
    meta.textContent = `${bucket.orders.length} הזמנות פתוחות (מתוכן ${bucket.cashCount} مزومان)`;

    const ordersContainer = document.createElement("div");
    ordersContainer.className = "driver-summary-orders";

    bucket.orders.forEach((order) => {
      const oRow = document.createElement("div");
      oRow.className = "driver-summary-order-row";

      const left = document.createElement("div");
      left.className = "driver-summary-order-left";
      const code = order.orderCode || (order.id ? order.id.slice(-4) : "");
      const amount = Number(order.totalAmount || 0) || 0;
      const isCash = order.paymentStatus !== "paid";
      const typeLabel = isCash ? "مزومان" : "اشراي";
      left.textContent = `#${code} — ${amount} ₪ (${typeLabel})`;

      const btn = document.createElement("button");
      btn.className = "driver-summary-remove-btn";
      btn.textContent = "סגור הזמנה";
      btn.addEventListener("click", async (ev) => {
        ev.stopPropagation();

        const pin = prompt("הכנס PIN מנהל לסגירת הזמנה");
        if (!pin) return;
        try {
          const ok = await verifyAdminPin(String(pin).trim());
          if (!ok) {
            alert("PIN לא תקין");
            return;
          }
        } catch (err) {
          console.error("verifyAdminPin failed", err);
          alert("אירעה שגיאה באימות ה-PIN");
          return;
        }

        try {
          const ref = doc(db, "orders", order.id);
          await updateDoc(ref, {
            status: "closed",
            closedAt: serverTimestamp(),
          });
          // עדכון מקומי מידי ב-UI בלי לחכות ל-onSnapshot
          try {
            currentOpenOrders = (currentOpenOrders || []).filter(
              (o) => o.id !== order.id
            );
            applyOpenOrdersFilter();
            // להוסיף להזמנות סגורות מקומית, כדי שיופיעו בטאב "طلبات مسكره"
            const closedCopy = Object.assign({}, order, {
              status: "closed",
              closedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
            });
            if (!Array.isArray(currentClosedOrders)) {
              currentClosedOrders = [];
            }
            currentClosedOrders.unshift(closedCopy);
            applyClosedOrdersFilter();
            renderTakeawayPanel();
  renderTakeawayCashPill();
            renderDriversSummary(currentOpenOrders);
          } catch (uiErr) {
            console.error(
              "failed to update local UI after closing driver order",
              uiErr
            );
          }
        } catch (err) {
          console.error("failed to close order from driver summary", err);
          alert("בעיה בסגירת ההזמנה.");
        }
      });

      oRow.appendChild(left);
      oRow.appendChild(btn);
      ordersContainer.appendChild(oRow);
    });

    row.appendChild(header);
    row.appendChild(meta);
    row.appendChild(ordersContainer);

    driversSummaryContent.appendChild(row);
  });

  const footer = document.createElement("div");
  footer.className = "drivers-summary-footer";
  footer.innerHTML = `<span>סה״כ לכל השליחים (مزومان בלבד, הזמנות פתוחות): ${overallCashTotal.toFixed(0)} ₪</span>`;
  driversSummaryContent.appendChild(footer);

  // כפתור סגירת יום בטאב "طلبات مسكره" מנוהל לפי הזמנות סגורות (ראה renderClosedOrdersFooterSummary).

}


async function getAndIncrementCumulativeZ(delta) {
  const ref = doc(db, "counters", "z");
  const snap = await getDoc(ref);
  const current = snap.exists() ? (Number(snap.data()?.cumulativeZ || 0) || 0) : 0;
  const next = current + (Number(delta || 0) || 0);
  await setDoc(ref, { cumulativeZ: next, updatedAt: serverTimestamp() }, { merge: true });
  return { previous: current, next };
}

function buildCloseDateStr(d) {
  const dt = (d instanceof Date ? d : new Date());
  return dt.toLocaleString("he-IL");
}

async function closeDayAndPrint() {
  if (!currentClosedOrders.length) {
    alert("אין הזמנות מסוכרות לאיפוס יום.");
    return;
  }

  // נאפס את כל ההזמנות הסגורות (איפוס יום) –
  // ההזמנות יימחקו מהמערכת אחרי יצירת הסיכום.
  const ordersToClose = currentClosedOrders.slice();

  const identity = await requireAdminIdentity("PIN מנהל לסגירת יום וסיכום עבור שליחים / TAKE AWAY / ישיבה:");
  if (!identity) return;

  if (!confirm("לסגור את כל ההזמנות הפתוחות כ-'סגור' ולהדפיס סיכום?")) {
    return;
  }

  
  // בונים סיכום לפני הסגירה (על בסיס כל ההזמנות הפתוחות)
  const byDriver = new Map();
  const byServiceType = {
    delivery: { total: 0, count: 0, cash: 0, card: 0, cashCount: 0, cardCount: 0 },
    takeaway: { total: 0, count: 0, cash: 0, card: 0, cashCount: 0, cardCount: 0 },
    dinein: { total: 0, count: 0, cash: 0, card: 0, cashCount: 0, cardCount: 0 },
    other: { total: 0, count: 0, cash: 0, card: 0, cashCount: 0, cardCount: 0 }
  };
  let overallTotal = 0;
  let overallCashTotal = 0;
  let overallCardTotal = 0;

  ordersToClose.forEach((order) => {
    if (!order) return;
    const amount = Number(order.totalAmount || 0) || 0;
    const isCash = order.paymentStatus !== "paid";

    overallTotal += amount;
    if (isCash) {
      overallCashTotal += amount;
    } else {
      overallCardTotal += amount;
    }

    // לפי שליח
    const key = order.driverId || "no_driver";
    const name = order.driverName || "ללא שליח";
    if (!byDriver.has(key)) {
      byDriver.set(key, {
        name,
        total: 0,
        count: 0,
        cash: 0,
        card: 0,
        cashCount: 0,
        cardCount: 0
      });
    }
    const bucket = byDriver.get(key);
    bucket.total += amount;
    bucket.count += 1;
    if (isCash) {
      bucket.cash += amount;
      bucket.cashCount += 1;
    } else {
      bucket.card += amount;
      bucket.cardCount += 1;
    }

    // לפי סוג שירות (משלוח / חנות / ישיבה)
    const st = order.serviceType || "other";
    const svcKey = byServiceType[st] ? st : "other";
    const svcBucket = byServiceType[svcKey];
    svcBucket.total += amount;
    svcBucket.count += 1;
    if (isCash) {
      svcBucket.cash += amount;
      svcBucket.cashCount += 1;
    } else {
      svcBucket.card += amount;
      svcBucket.cardCount += 1;
    }
  });

  const closeDateStr = buildCloseDateStr(new Date());
  let cumulative = { previous: 0, next: 0 };
  try {
    cumulative = await getAndIncrementCumulativeZ(overallTotal);
  } catch (e) {
    console.error("cumulative Z update failed", e);
  }

// סוגרים את ההזמנות (איפוס יום – מחיקת הזמנות סגורות)
  try {
    for (const order of ordersToClose) {
      const ref = doc(db, "orders", order.id);
      await deleteDoc(ref);
      const amount = Number(order.totalAmount || 0);
      const code = order.orderCode || (order.id ? order.id.slice(-4) : "");
      await logAdminAction({
        type: "DAY_CLOSE_ORDER",
        orderId: order.id,
        orderCode: code,
        orderTotal: isNaN(amount) ? null : amount,
        serviceType: order.serviceType || null,
        driverId: order.driverId || null,
        driverName: order.driverName || null,
        adminId: identity.adminId || null,
        adminPin: identity.adminPin || null,
        adminName: identity.adminName || null,
        adminRole: identity.adminRole || (identity.isSuper ? "super" : "sub")
      });
    }

    // לוג סיכום אחד ליום
    const summaryDrivers = [];
    byDriver.forEach((bucket, key) => {
      summaryDrivers.push({
        driverId: key === "no_driver" ? null : key,
        driverName: bucket.name,
        total: bucket.total,
        count: bucket.count,
        cash: bucket.cash,
        card: bucket.card,
        cashCount: bucket.cashCount,
        cardCount: bucket.cardCount
      });
    });

    
    // Save summary for Admin panel (ניהול -> סיכום יום)
    const savedSummary = await saveDaySummaryRecord({
      closeDateStr,
      overallTotal,
      overallCashTotal,
      overallCardTotal,
      byServiceType,
      byDriver: summaryDrivers,
      cumulativeZ: Number(cumulative?.next || 0) || 0
    }, identity);

    if (!savedSummary) {
      alert("אזהרה: לא הצלחתי לשמור את סיכום היום בניהול (בדוק הרשאות Firestore). הסגירה בוצעה בכל מקרה.");
    }

await logAdminAction({
      type: "DAY_CLOSE_SUMMARY",
      overallTotal,
      byServiceType,
      byDriver: summaryDrivers,
      adminId: identity.adminId || null,
      adminPin: identity.adminPin || null,
      adminName: identity.adminName || null,
      adminRole: identity.adminRole || (identity.isSuper ? "super" : "sub")
    });
  } catch (err) {
    console.error("failed to close day", err);
    alert("בעיה בסגירת היום, חלק מההזמנות אולי לא נסגרו.");
    return;
  }

  
  // חלון להדפסה – סיכום מודרני לשליחים וחנות
  // USB 80mm (Z report) instead of A4
  try {
    const zHtml = buildDayCloseZReportHtml({
      byDriver,
      byServiceType,
      overallTotal,
      overallCashTotal,
      overallCardTotal,
      closeDateStr,
      cumulativeZ: null
    });

    await oliveUsbPrintHtmlDirect(zHtml, {
      reportType: "Z",
      totalAmount: overallTotal || 0,
      cashTotal: overallCashTotal || 0,
      cardTotal: overallCardTotal || 0
    });
  } catch (e) {
    console.error("Day close USB print failed:", e);
    alert("שגיאה בהדפסת דוח Z (USB): " + (e?.message || e));
  }

// ננקה את המסכים המקומיים כדי שהשליחים יראו שאין יותר הזמנות פתוחות
  try {
    const closedIds = new Set(ordersToClose.map((o) => o.id));
    currentOpenOrders = (currentOpenOrders || []).filter((o) => !closedIds.has(o.id));
  } catch (e) {
    // נתעלם משגיאה מקומית – ה-Snapshot יעדכן בכל מקרה
  }
  applyOpenOrdersFilter();
  renderTakeawayPanel();
  renderTakeawayCashPill();
  renderDriversSummary(currentOpenOrders);
  refreshDriversMapMarkers();
  alert("היום נסגר בהצלחה. כל המשלוחים וההזמנות הפתוחות נסגרו.");
}

// ---- Order edit modal ----
function openOrderEditModal(orderId) {
  const order = currentOpenOrders.find((o) => o.id === orderId);
  if (!order || !orderEditModal) return;
  editingOrderId = orderId;

  // also load order into current order panel for easier edits
  loadOrderIntoCurrent(order);

  const code = order.orderCode || (order.id ? order.id.slice(-4) : "");
  orderEditTitle.textContent = `הזמנה #${code} — ${order.customerName || ""}`;

  orderEditItems.innerHTML = "";
  const items = Array.isArray(order.items) ? order.items : [];
  items.forEach((it, idx) => {
    addOrderEditRow(it, idx);
  });

  if (!items.length) {
    addOrderEditRow({ name: "", qty: 1, price: 0 }, 0);
  }

  orderEditTotalInput.value = order.totalAmount != null ? order.totalAmount : "";

  orderEditModal.classList.remove("hidden");
}

function addOrderEditRow(item, idx) {
  const row = document.createElement("div");
  row.className = "order-edit-row";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = item.name || item.title || item.nameAr || "";
  nameInput.placeholder = "שם פריט";

  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.step = "1";
  qtyInput.value = item.qty != null ? item.qty : 1;

  const priceInput = document.createElement("input");
  priceInput.type = "number";
  priceInput.step = "0.5";
  priceInput.value = item.price != null ? item.price : 0;

  const removeBtn = document.createElement("button");
  removeBtn.className = "order-edit-remove-btn";
  removeBtn.textContent = "X";
  removeBtn.addEventListener("click", () => {
    row.remove();
  });

  row.appendChild(nameInput);
  row.appendChild(qtyInput);
  row.appendChild(priceInput);
  row.appendChild(removeBtn);

  orderEditItems.appendChild(row);
}

if (orderEditAddItemBtn) {
  orderEditAddItemBtn.addEventListener("click", () => {
    addOrderEditRow({ name: "", qty: 1, price: 0 }, 0);
  });
}

if (orderEditCancelBtn) {
  orderEditCancelBtn.addEventListener("click", () => {
    orderEditModal.classList.add("hidden");
    editingOrderId = null;
  });
}

if (orderEditSaveBtn) {
  orderEditSaveBtn.addEventListener("click", async () => {
    if (!editingOrderId) return;
    const rows = Array.from(orderEditItems.querySelectorAll(".order-edit-row"));
    const newItems = [];
    let autoTotal = 0;
    rows.forEach((row) => {
      const inputs = row.querySelectorAll("input");
      const name = inputs[0].value.trim();
      const qty = Number(inputs[1].value || 0);
      const price = Number(inputs[2].value || 0);
      if (!name || qty <= 0) return;
      newItems.push({
        name,
        qty,
        price,
      });
      autoTotal += qty * price;
    });

    let total = autoTotal;
    const manual = Number(orderEditTotalInput.value);
    if (!isNaN(manual) && manual > 0) {
      total = manual;
    }

    try {
      const ref = doc(db, "orders", editingOrderId);
      await updateDoc(ref, {
        items: newItems,
        totalAmount: total,
        updatedAt: serverTimestamp(),
      });
      orderEditModal.classList.add("hidden");
      editingOrderId = null;
    } catch (err) {
      console.error("failed to save edited order", err);
      alert("בעיה בשמירת השינויים להזמנה.");
    }
  });
}

// --- Admin: Menu & Customers ---
// open admin modal
adminBtn.addEventListener("click", () => {
  adminModal.classList.remove("hidden");
  if (!adminLoggedIn) {
    adminLoginSection.classList.remove("hidden");
    adminMainSection.classList.add("hidden");
    adminPinInput.value = "";
    adminPinInput.focus();
  } else {
    adminLoginSection.classList.add("hidden");
    adminMainSection.classList.remove("hidden");
  }
});


// ----- Print Config UI -----
function openPrintConfigModal() {
  if (!printConfigModal) return;
  printConfigStatus.textContent = "";
  printConfigPinInput.value = "";
  printServerUrlInput.value = normalizePrintServerUrl(PRINT_SERVER_URL);
  printConfigMainSection.classList.add("hidden");
  printConfigLoginSection.classList.remove("hidden");
  printConfigModal.classList.remove("hidden");
  setTimeout(() => printConfigPinInput?.focus(), 0);
}

function closePrintConfigModal() {
  if (!printConfigModal) return;
  printConfigModal.classList.add("hidden");
}

printConfigBtn?.addEventListener("click", () => {
  openPrintConfigModal();
});

printConfigCloseBtn?.addEventListener("click", closePrintConfigModal);
printConfigCloseBtn2?.addEventListener("click", closePrintConfigModal);
printConfigModal?.querySelector(".modal-backdrop")?.addEventListener("click", closePrintConfigModal);

printConfigLoginBtn?.addEventListener("click", () => {
  const pin = String(printConfigPinInput.value || "").trim();
  if (pin !== SUPER_ADMIN_PIN) {
    alert("קוד מנהל לא נכון.");
    return;
  }
  printConfigLoginSection.classList.add("hidden");
  printConfigMainSection.classList.remove("hidden");
  printServerUrlInput.value = normalizePrintServerUrl(PRINT_SERVER_URL);
  setTimeout(() => printServerUrlInput?.focus(), 0);
});

printServerSaveBtn?.addEventListener("click", () => {
  const nextUrl = normalizePrintServerUrl(printServerUrlInput.value);
  if (!nextUrl) {
    alert("כתובת שרת הדפסה ריקה.");
    return;
  }
  localStorage.setItem("olivePrintServerUrl", nextUrl);
  PRINT_SERVER_URL = nextUrl;
  printConfigStatus.textContent = `נשמר ✅ ${nextUrl}`;
  alert("נשמר. מעכשיו ההדפסה תישלח לכתובת החדשה.");
});

printServerTestBtn?.addEventListener("click", async () => {
  try {
    printConfigStatus.textContent = "בודק...";
    const data = await testPrintServerHealth(printServerUrlInput.value);
    printConfigStatus.textContent = `בדיקה OK ✅ (${data?.ok ? "ok:true" : "ok"})`;
    alert("השרת נגיש ✅");
  } catch (e) {
    printConfigStatus.textContent = `בדיקה נכשלה: ${e?.message || e}`;
    alert(`בדיקה נכשלה: ${e?.message || e}`);
  }
});

// Quick test button next to ניהול (requires SUPER_ADMIN_PIN)
printTestBtn?.addEventListener("click", async () => {
  const pin = prompt("הכנס PIN אדמין ראשי לבדיקה:");
  if (String(pin || "").trim() !== SUPER_ADMIN_PIN) {
    alert("קוד מנהל לא נכון.");
    return;
  }
  try {
    const data = await testPrintServerHealth(PRINT_SERVER_URL);
    alert(`בדיקה OK ✅\n${normalizePrintServerUrl(PRINT_SERVER_URL)}\n${data?.ok ? "ok:true" : "ok"}`);
  } catch (e) {
    alert(`בדיקה נכשלה: ${e?.message || e}`);
  }
});


adminCloseBtn.addEventListener("click", () => {
  adminModal.classList.add("hidden");
});

adminLoginBtn.addEventListener("click", async () => {
  const pin = adminPinInput.value.trim();
  const clean = String(pin || "").trim();

  // לאזור ניהול – רק בעלים ראשי עם SUPER_ADMIN_PIN יכול להיכנס
  if (clean !== SUPER_ADMIN_PIN) {
    alert("קוד מנהל לא נכון.");
    return;
  }

  adminLoggedIn = true;
  adminLoginSection.classList.add("hidden");
  adminMainSection.classList.remove("hidden");
  loadAdminMenu();
  loadAdminCustomers();
});

adminLogoutBtn.addEventListener("click", () => {
  adminLoggedIn = false;
  adminMainSection.classList.add("hidden");
  adminLoginSection.classList.remove("hidden");
  adminPinInput.value = "";
});

// tabs
if (adminMenuTabBtn) adminMenuTabBtn.addEventListener("click", () => showAdminTab("menu"));
if (adminCustomersTabBtn) adminCustomersTabBtn.addEventListener("click", () => showAdminTab("customers"));
if (adminDriversTabBtn) adminDriversTabBtn.addEventListener("click", () => showAdminTab("drivers"));
if (adminAdminsTabBtn) adminAdminsTabBtn.addEventListener("click", () => showAdminTab("admins"));
if (adminLogsTabBtn) adminLogsTabBtn.addEventListener("click", () => showAdminTab("logs"));
if (adminDaySummariesTabBtn) adminDaySummariesTabBtn.addEventListener("click", () => showAdminTab("daysummaries"));
if (adminCategoriesTabBtn) adminCategoriesTabBtn.addEventListener("click", () => showAdminTab("categories"));

// Load menu for admin
function loadAdminMenu() {
  adminMenuList.innerHTML = "<p class='empty-text'>טוען תפריט...</p>";
  const colRef = collection(db, "menu");
  const qMenuAll = query(colRef, orderBy("category"), orderBy("sortOrder"));
  onSnapshot(
    qMenuAll,
    (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));
      renderAdminMenuList(items);
    },
    (err) => {
      console.error("admin menu error", err);
      adminMenuList.innerHTML = "<p class='empty-text'>שגיאה בטעינת תפריט.</p>";
    }
  );
}

function renderAdminMenuList(items) {
  adminMenuList.innerHTML = "";
  if (!items.length) {
    const p = document.createElement("p");
    p.className = "empty-text";
    p.textContent = "אין עדיין פריטים בתפריט.";
    adminMenuList.appendChild(p);
    return;
  }

  const header = document.createElement("div");
  header.className = "admin-list-row admin-list-row-header";
  header.innerHTML = `
    <span>שם</span>
    <span>קטגוריה</span>
    <span>מחיר (₪)</span>
    <span>פעולות</span>
  `;
  adminMenuList.appendChild(header);

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "admin-list-row";
    row.innerHTML = `
      <span>${item.nameAr || ""}</span>
      <span>${item.category || ""}</span>
      <span>${item.basePrice || 0}</span>
    `;
    const actions = document.createElement("div");
    actions.className = "admin-list-row-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-secondary btn-small";
    editBtn.textContent = "ערוך";
    editBtn.addEventListener("click", () => openMenuItemEdit(item));

    // כפתור הסתרה / הצגה (טוגל) עם צבע אדום כשמוסתר
    const toggleBtn = document.createElement("button");
    const applyToggleStyle = () => {
      const hidden = item.active === false;
      toggleBtn.textContent = hidden ? "מוסתר" : "הסתר";
      toggleBtn.className = "btn btn-small " + (hidden ? "btn-danger" : "btn-secondary");
    };
    applyToggleStyle();

    toggleBtn.addEventListener("click", async () => {
      const currentlyHidden = item.active === false;
      const newActive = currentlyHidden ? true : false;
      const msg = newActive
        ? "להחזיר את הפריט לתפריט?"
        : "להסתיר את הפריט מהתפריט?";
      if (!confirm(msg)) return;
      try {
        const ref = doc(db, "menu", item.id);
        await updateDoc(ref, { active: newActive });
        item.active = newActive;
        applyToggleStyle();
      } catch (err) {
        console.error("toggle menu item visibility error", err);
        alert("שגיאה בעדכון מצב פריט.");
      }
    });

    // כפתור מחיקה מוחלטת של הפריט
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-small btn-danger";
    deleteBtn.textContent = "מחק";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("למחוק את הפריט מהתפריט לצמיתות?")) return;
      try {
        const ref = doc(db, "menu", item.id);
        await deleteDoc(ref);
      } catch (err) {
        console.error("delete menu item error", err);
        alert("שגיאה במחיקת פריט.");
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(toggleBtn);
    actions.appendChild(deleteBtn);
    row.appendChild(actions);

    adminMenuList.appendChild(row);
  });
}

adminAddMenuItemBtn.addEventListener("click", () => {
  editingMenuItemId = null;
  editMenuItemNameAr.value = "";
  editMenuItemCategory.value = "";
  editMenuItemSize.value = "";
  editMenuItemPrice.value = "0";
  editMenuItemSortOrder.value = "0";
  editMenuItemActive.checked = true;
  menuItemEditModal.classList.remove("hidden");
});

function openMenuItemEdit(item) {
  editingMenuItemId = item.id;
  editMenuItemNameAr.value = item.nameAr || "";
  editMenuItemCategory.value = item.category || "";
  editMenuItemSize.value = item.size || "";
  editMenuItemPrice.value = item.basePrice != null ? item.basePrice : 0;
  editMenuItemSortOrder.value = item.sortOrder != null ? item.sortOrder : 0;
  editMenuItemActive.checked = item.active !== false;
  menuItemEditModal.classList.remove("hidden");
}

menuItemEditCancelBtn.addEventListener("click", () => {
  menuItemEditModal.classList.add("hidden");
});

menuItemEditSaveBtn.addEventListener("click", async () => {
  const nameAr = editMenuItemNameAr.value.trim();
  const category = editMenuItemCategory.value.trim() || "other";
  const size = editMenuItemSize.value.trim() || null;
  const basePrice = Number(editMenuItemPrice.value || 0);
  const sortOrder = Number(editMenuItemSortOrder.value || 0);
  const active = editMenuItemActive.checked;

  if (!nameAr) {
    alert("חסר שם בערבית.");
    return;
  }

  const payload = {
    nameAr,
    category,
    size,
    basePrice,
    sortOrder,
    active,
    updatedAt: serverTimestamp(),
  };

  try {
    if (editingMenuItemId) {
      const ref = doc(db, "menu", editingMenuItemId);
      await updateDoc(ref, payload);
    } else {
      const colRef = collection(db, "menu");
      await addDoc(colRef, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
    menuItemEditModal.classList.add("hidden");
  } catch (err) {
    console.error("save menu item error", err);
    alert("שגיאה בשמירת פריט התפריט.");
  }
});


// --- Drivers (admin) ---
function loadAdminDrivers() {
  adminDriversList.innerHTML = "<p class='empty-text'>טוען שליחים...</p>";
  const colRef = collection(db, "drivers");
  const qDrivers = query(colRef, orderBy("name"));
  onSnapshot(
    qDrivers,
    (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));
      renderAdminDriversList(items);
    },
    (err) => {
      console.error("admin drivers error", err);
      adminDriversList.innerHTML = "<p class='empty-text'>שגיאה בטעינת שליחים.</p>";
    }
  );
}

function renderAdminDriversList(items) {
  adminDriversList.innerHTML = "";
  if (!items.length) {
    const p = document.createElement("p");
    p.className = "empty-text";
    p.textContent = "אין שליחים במערכת.";
    adminDriversList.appendChild(p);
    return;
  }

  const header = document.createElement("div");
  header.className = "admin-list-row admin-list-row-header";
  header.innerHTML = `
    <span>שם</span>
    <span>PIN</span>
    <span>פעיל</span>
    <span>פעולות</span>
  `;
  adminDriversList.appendChild(header);

  items.forEach((d) => {
    const row = document.createElement("div");
    row.className = "admin-list-row";
    const nameSpan = document.createElement("span");
    nameSpan.textContent = d.name || "";
    const pinSpan = document.createElement("span");
    pinSpan.textContent = d.pin || "";
    const activeSpan = document.createElement("span");
    activeSpan.textContent = d.active === false ? "לא" : "כן";

    const actions = document.createElement("div");
    actions.className = "admin-list-row-actions";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-secondary btn-small";
    deleteBtn.textContent = "מחק";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("למחוק את השליח?")) return;
      try {
        const ref = doc(db, "drivers", d.id);
        await deleteDoc(ref);
      } catch (err) {
        console.error("delete driver error", err);
        alert("שגיאה במחיקת שליח, בדוק חיבור / הרשאות.");
      }
    });

    const editPinBtn = document.createElement("button");
    editPinBtn.className = "btn btn-secondary btn-small";
    editPinBtn.textContent = "שנה PIN";
    editPinBtn.addEventListener("click", async () => {
      const newPin = window.prompt("PIN חדש (4 ספרות):", d.pin || "");
      if (!newPin || newPin === d.pin) return;
      try {
        const ref = doc(db, "drivers", d.id);
        await updateDoc(ref, { pin: newPin });
      } catch (err) {
        console.error("edit driver pin error", err);
      }
    });

    actions.appendChild(editPinBtn);
    actions.appendChild(deleteBtn);

    row.appendChild(nameSpan);
    row.appendChild(pinSpan);
    row.appendChild(activeSpan);
    row.appendChild(actions);

    adminDriversList.appendChild(row);
  });
}

// --- Admin activity logs (adminLogs collection) ---
let adminLogsUnsub = null;
let adminDaySummariesUnsub = null;

function formatTimestamp(ts) {
  if (!ts) return '';
  try {
    let d;
    if (ts.toDate) {
      d = ts.toDate();
    } else if (ts instanceof Date) {
      d = ts;
    } else if (typeof ts === 'number') {
      d = new Date(ts);
    } else if (typeof ts === 'string') {
      // Accept ISO strings or numeric strings (milliseconds)
      const s = ts.trim();
      const asNum = Number(s);
      if (!Number.isNaN(asNum) && asNum > 0) {
        d = new Date(asNum);
      } else {
        const parsed = new Date(s);
        if (!Number.isNaN(parsed.getTime())) d = parsed;
        else return '';
      }
    } else if (ts.seconds) {
      d = new Date(ts.seconds * 1000);
    } else {
      return '';
    }
    const dateStr = d.toLocaleDateString('he-IL');
    const timeStr = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    return dateStr + ' ' + timeStr;
  } catch (e) {
    console.error('formatTimestamp error', e);
    return '';
  }
}

function describeAdminLogAction(log) {
  const t = log.type || '';
  const orderCode = log.orderCode || '';
  const serviceType = log.serviceType || '';
  const driverName = log.driverName || '';
  const total = typeof log.orderTotal === 'number' ? log.orderTotal : null;
  const diff = typeof log.diffTotal === 'number' ? log.diffTotal : null;

  if (t === 'ORDER_DELETE') {
    return `מחיקת הזמנה #${orderCode}${total != null ? ` (סכום ${total} ₪)` : ''}`;
  }
  if (t === 'PAYMENT_TOGGLE') {
    const from = log.fromStatus === 'paid' ? 'اشراي' : 'مزومان';
    const to = log.toStatus === 'paid' ? 'اشراי' : 'مزومان';
    return `שינוי סוג תשלום להזמנה #${orderCode} מ-${from} ל-${to}`;
  }
  if (t === 'DAY_CLOSE_ORDER') {
    const typeLabel = serviceType === 'delivery' ? 'שְׁלִיח' : serviceType === 'takeaway' ? 'TAKE AWAY' : serviceType === 'dinein' ? 'ישיבה' : '';
    const driverLabel = driverName ? ` (שליח: ${driverName})` : '';
    return `סגירת יום – הזמנה #${orderCode}${typeLabel ? ` (${typeLabel})` : ''}${driverLabel}${total != null ? ` – ${total} ₪` : ''}`;
  }
  if (t === 'DAY_CLOSE_SUMMARY') {
    return 'סגירת יום – סיכום לכל ההזמנות';
  }
  if (t === 'PRICE_CHANGE') {
    const oldT = typeof log.oldTotal === 'number'
      ? log.oldTotal
      : typeof log.fromTotal === 'number'
      ? log.fromTotal
      : null;
    const newT = typeof log.newTotal === 'number'
      ? log.newTotal
      : typeof log.toTotal === 'number'
      ? log.toTotal
      : null;
    if (orderCode) {
      if (oldT != null && newT != null) {
        return `שינוי מחיר להזמנה #${orderCode} מ-${oldT} ₪ ל-${newT} ₪`;
      }
      return `שינוי מחיר להזמנה #${orderCode}`;
    }
    return 'שינוי מחיר הזמנה';
  }
  return log.description || t || 'פעולה';
}


// --- Day close summaries (daySummaries collection) ---
function tsToDate(ts) {
  if (!ts) return null;
  try {
    if (typeof ts.toDate === "function") return ts.toDate();
    if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000);
  } catch (e) {}
  try { return new Date(ts); } catch { return null; }
}

function formatDateTime(ts) {
  const d = tsToDate(ts);
  if (!d) return "";
  // he-IL date + time
  return d.toLocaleString("he-IL");
}

async function adminPrintDaySummary(item) {
  if (!item) return;
  const byDriverArr = Array.isArray(item.byDriver) ? item.byDriver : [];
  const byDriver = new Map();
  byDriverArr.forEach((d) => {
    const key = d && d.driverId ? d.driverId : "no_driver";
    byDriver.set(key, {
      name: d.driverName || "ללא שליח",
      total: Number(d.total || 0) || 0,
      count: Number(d.count || 0) || 0,
      cash: Number(d.cash || 0) || 0,
      card: Number(d.card || 0) || 0,
      cashCount: Number(d.cashCount || 0) || 0,
      cardCount: Number(d.cardCount || 0) || 0
    });
  });

  const zHtml = buildDayCloseZReportHtml({
    byDriver,
    byServiceType: item.byServiceType || {},
    overallTotal: Number(item.overallTotal || 0) || 0,
    overallCashTotal: Number(item.overallCashTotal || 0) || 0,
    overallCardTotal: Number(item.overallCardTotal || 0) || 0,
    closeDateStr: item.closeDateStr || formatDateTime(item.closedAt),
    cumulativeZ: Number(item.cumulativeZ || 0) || 0
  });

  await oliveUsbPrintHtmlDirect(zHtml, {
    reportType: "Z",
    totalAmount: Number(item.overallTotal || 0) || 0,
    cashTotal: Number(item.overallCashTotal || 0) || 0,
    cardTotal: Number(item.overallCardTotal || 0) || 0
  });
}

// A4 print (browser print) for day summary from Admin
function adminPrintDaySummaryA4(item) {
  if (!item) return;

  const dt = item.closeDateStr || formatDateTime(item.closedAt) || '';
  const total = Number(item.overallTotal || 0) || 0;
  const cash = Number(item.overallCashTotal || 0) || 0;
  const card = Number(item.overallCardTotal || 0) || 0;
  const cum = Number(item.cumulativeZ || 0) || 0;

  const byServiceType = item.byServiceType || {};
  const byDriverArr = Array.isArray(item.byDriver) ? item.byDriver : [];

  const driversRows = byDriverArr
    .map((d) => {
      const name = escapeHtml(d?.driverName || 'ללא שליח');
      const t = (Number(d?.total || 0) || 0).toFixed(0);
      const c = (Number(d?.count || 0) || 0).toFixed(0);
      const ca = (Number(d?.cash || 0) || 0).toFixed(0);
      const cr = (Number(d?.card || 0) || 0).toFixed(0);
      return `<tr><td>${name}</td><td style="text-align:center;">${c}</td><td style="text-align:right;">${t} ₪</td><td style="text-align:right;">${ca} ₪</td><td style="text-align:right;">${cr} ₪</td></tr>`;
    })
    .join('');

  const serviceRows = Object.entries(byServiceType)
    .map(([k, v]) => {
      const label = k === 'delivery' ? 'שליח' : k === 'takeaway' ? 'TAKE AWAY' : k === 'dinein' ? 'ישיבה' : k;
      const count = Number(v?.count || 0) || 0;
      const t = (Number(v?.total || 0) || 0).toFixed(0);
      return `<tr><td>${escapeHtml(label)}</td><td style="text-align:center;">${count}</td><td style="text-align:right;">${t} ₪</td></tr>`;
    })
    .join('');

  const html = `
  <!doctype html>
  <html lang="he" dir="rtl">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>סיכום יום - A4</title>
      <style>
        @page { size: A4; margin: 10mm; }
        body { font-family: Arial, sans-serif; color:#000; }
        h1 { margin: 0 0 6px; font-size: 26px; text-align:center; }
        .sub { text-align:center; margin-bottom: 14px; font-size: 14px; }
        .box { border: 2px solid #000; padding: 10px; border-radius: 10px; margin-bottom: 12px; }
        .row { display:flex; gap: 12px; justify-content: space-between; flex-wrap:wrap; }
        .kpi { flex: 1 1 180px; font-size: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #000; padding: 6px 8px; font-size: 14px; }
        th { background: #f2f2f2; }
        .right { text-align:right; }
        .center { text-align:center; }
        .footer { margin-top: 14px; font-size: 18px; font-weight: 800; text-align:center; }
      </style>
    </head>
    <body>
      <h1>סיכום יום (Z)</h1>
      <div class="sub">תאריך סגירה: <b>${escapeHtml(dt)}</b></div>

      <div class="box">
        <div class="row">
          <div class="kpi"><b>סה"כ:</b> ${total.toFixed(0)} ₪</div>
          <div class="kpi"><b>מזומן:</b> ${cash.toFixed(0)} ₪</div>
          <div class="kpi"><b>אשראי:</b> ${card.toFixed(0)} ₪</div>
        </div>
      </div>

      <div class="box">
        <div class="right" style="font-weight:800; font-size:16px;">פילוח לפי סוג הזמנה</div>
        <table>
          <thead><tr><th>סוג</th><th class="center">כמות</th><th class="right">סה"כ</th></tr></thead>
          <tbody>${serviceRows || '<tr><td colspan="3" class="center">אין נתונים</td></tr>'}</tbody>
        </table>
      </div>

      <div class="box">
        <div class="right" style="font-weight:800; font-size:16px;">פילוח לפי שליח</div>
        <table>
          <thead><tr><th>שליח</th><th class="center">כמות</th><th class="right">סה"כ</th><th class="right">מזומן</th><th class="right">אשראי</th></tr></thead>
          <tbody>${driversRows || '<tr><td colspan="5" class="center">אין נתונים</td></tr>'}</tbody>
        </table>
      </div>

      <div class="footer">Z מצטבר: ${cum.toFixed(0)} ₪</div>

      <script>
        window.focus();
        setTimeout(() => window.print(), 150);
      </script>
    </body>
  </html>`;

  const w = window.open('', '_blank');
  if (!w) {
    alert('חסום חלון קופץ. אפשר חלונות קופצים כדי להדפיס A4.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function renderAdminDaySummariesList(items) {
  if (!adminDaySummariesList) return;
  adminDaySummariesList.innerHTML = "";
  if (!items.length) {
    adminDaySummariesList.innerHTML = "<p class='empty-text'>אין עדיין סיכומי ימים.</p>";
    return;
  }

  items.forEach((it) => {
    const row = document.createElement("div");
    row.className = "admin-list-row";
    const dt = it.closeDateStr || formatDateTime(it.closedAt) || "";
    const total = Number(it.overallTotal || 0) || 0;
    const cash = Number(it.overallCashTotal || 0) || 0;
    const card = Number(it.overallCardTotal || 0) || 0;
    const cum = Number(it.cumulativeZ || 0) || 0;

    row.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div><b>סגירה:</b> ${escapeHtml(dt)}</div>
        <div><b>סה״כ:</b> ${total.toFixed(0)} ₪ | <b>מזומן:</b> ${cash.toFixed(0)} ₪ | <b>אשראי:</b> ${card.toFixed(0)} ₪</div>
        <div><b>Z מצטבר:</b> ${cum.toFixed(0)} ₪</div>
      </div>
      <div style="display:flex; gap:8px; align-items:center; justify-content:flex-end;">
        <button class="btn btn-secondary btn-small" data-action="print">🖨️ הדפס USB80MM</button>
        <button class="btn btn-secondary btn-small" data-action="print-a4">🖨️ הדפס A4</button>
      </div>
    `;

    const btn = row.querySelector('button[data-action="print"]');
    if (btn) {
      btn.addEventListener("click", async () => {
        try {
          await adminPrintDaySummary(it);
        } catch (e) {
          console.error("print day summary failed", e);
          alert("שגיאה בהדפסה: " + (e?.message || e));
        }
      });
    }

    const btnA4 = row.querySelector('button[data-action="print-a4"]');
    if (btnA4) {
      btnA4.addEventListener('click', () => {
        try {
          adminPrintDaySummaryA4(it);
        } catch (e) {
          console.error('print day summary A4 failed', e);
          alert('שגיאה בהדפסה (A4): ' + (e?.message || e));
        }
      });
    }

    adminDaySummariesList.appendChild(row);
  });
}

function loadAdminDaySummaries(forceRefresh) {
  if (!adminDaySummariesList) return;
  adminDaySummariesList.innerHTML = "<p class='empty-text'>טוען סיכומי ימים...</p>";
  const colRef = collection(db, "daySummaries");
  const qRef = query(colRef, orderBy("closedAt", "desc"), limit(60));

  if (adminDaySummariesUnsub && forceRefresh) {
    adminDaySummariesUnsub();
    adminDaySummariesUnsub = null;
  }
  if (adminDaySummariesUnsub) return; // already listening

  adminDaySummariesUnsub = onSnapshot(
    qRef,
    (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));
      renderAdminDaySummariesList(items);
    },
    (err) => {
      console.error("day summaries error", err);
      adminDaySummariesList.innerHTML = "<p class='empty-text'>שגיאה בטעינת סיכומי ימים.</p>";
    }
  );
}

// Load categories for admin (ordering/labels)
async function loadAdminCategories(forceRefresh = false) {
  if (!adminCategoriesList) return;
  adminCategoriesList.innerHTML = "<p class='empty-text'>טוען קטגוריות...</p>";

  try {
    // Collect category keys from menu
    const keys = new Set();
    (menuDocs || []).forEach((m) => {
      if (m && m.category) keys.add(m.category);
    });

    // Also include categories already stored in Firestore
    try {
      const snap = await getDocs(collection(db, "categories"));
      snap.forEach((d) => keys.add(d.id));
      // refresh local map
      const mm = new Map();
      snap.forEach((d) => mm.set(d.id, { id: d.id, ...(d.data() || {}) }));
      categoriesConfigMap = mm;
    } catch (e) {
      // ignore (permissions etc.)
      console.warn("load categories docs failed", e);
    }

    const list = Array.from(keys.values()).sort((a, b) => a.localeCompare(b));
    if (!list.length) {
      adminCategoriesList.innerHTML = "<p class='empty-text'>אין קטגוריות עדיין. הוסף פריטים בתפריט קודם.</p>";
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "admin-categories-wrap";

    list.forEach((key) => {
      const cfg = categoriesConfigMap.get(key) || {};
      const row = document.createElement("div");
      row.className = "admin-cat-row";

      const left = document.createElement("div");
      left.className = "admin-cat-left";
      const keyEl = document.createElement("div");
      keyEl.className = "admin-cat-key";
      keyEl.textContent = key;
      left.appendChild(keyEl);

      const labelHe = document.createElement("input");
      labelHe.type = "text";
      labelHe.placeholder = "שם בעברית";
      labelHe.value = (cfg.labelHe || cfg.he || (cfg.label || "")) || "";
      labelHe.className = "input admin-cat-input";

      const labelAr = document.createElement("input");
      labelAr.type = "text";
      labelAr.placeholder = "اسم بالعربية";
      labelAr.value = (cfg.labelAr || cfg.ar || (CATEGORY_LABELS_AR[key] || cfg.label || "")) || "";
      labelAr.className = "input admin-cat-input";

      const labelEn = document.createElement("input");
      labelEn.type = "text";
      labelEn.placeholder = "Name (English)";
      labelEn.value = (cfg.labelEn || cfg.en || "") || "";
      labelEn.className = "input admin-cat-input";

      const imgUrl = document.createElement("input");
      imgUrl.type = "text";
      imgUrl.placeholder = "Image URL (optional)";
      imgUrl.value = (cfg.imageUrl || "") || "";
      imgUrl.className = "input admin-cat-input";

      const sortInput = document.createElement("input");
      sortInput.type = "number";
      sortInput.placeholder = "סדר תצוגה";
      sortInput.value = (cfg.sortOrder ?? "");
      sortInput.className = "input admin-cat-sort";

      const activeWrap = document.createElement("label");
      activeWrap.className = "admin-cat-active";
      const activeCb = document.createElement("input");
      activeCb.type = "checkbox";
      activeCb.checked = cfg.active !== false;
      const activeTxt = document.createElement("span");
      activeTxt.textContent = "פעיל";
      activeWrap.appendChild(activeCb);
      activeWrap.appendChild(activeTxt);

      const saveBtn = document.createElement("button");
      saveBtn.className = "btn btn-primary btn-small";
      saveBtn.textContent = "שמירה";
      saveBtn.addEventListener("click", async () => {
        const newHe = labelHe.value.trim();
        const newAr = labelAr.value.trim();
        const newEn = labelEn.value.trim();
        const newImg = imgUrl.value.trim();
        const newSort = Number(sortInput.value || 0) || 0;
        const newActive = !!activeCb.checked;
        try {
          await setDoc(doc(db, "categories", key), {
            label: newHe || newAr || newEn || key,
            labelHe: newHe,
            labelAr: newAr,
            labelEn: newEn,
            imageUrl: newImg,
            sortOrder: newSort,
            active: newActive,
            updatedAt: serverTimestamp(),
          }, { merge: true });
          // optimistic update
          categoriesConfigMap.set(key, { ...cfg, label: (newHe || newAr || newEn || key), labelHe:newHe, labelAr:newAr, labelEn:newEn, imageUrl:newImg, sortOrder:newSort, active:newActive });
          alert("נשמר ✅");
          // refresh menu order immediately
          try { renderMenuFromDocs(); } catch {}
        } catch (e) {
          console.error("save category failed", e);
          alert("שגיאה בשמירה: " + (e?.message || e));
        }
      });

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger btn-small";
      delBtn.textContent = "מחק";
      delBtn.addEventListener("click", async () => {
        if (!confirm("למחוק קטגוריה?")) return;
        try {
          await deleteDoc(doc(db, "categories", key));
          await loadAdminCategories(true);
        } catch (e) {
          console.error("delete category error", e);
          alert("שגיאה במחיקה");
        }
      });


      row.appendChild(left);
      row.appendChild(sortInput);
      row.appendChild(activeWrap);
      row.appendChild(saveBtn);
      row.appendChild(delBtn);
      wrap.appendChild(row);
    });

    adminCategoriesList.innerHTML = "";
    adminCategoriesList.appendChild(wrap);
  } catch (e) {
    console.error("loadAdminCategories failed", e);
    adminCategoriesList.innerHTML = "<p class='empty-text'>שגיאה בטעינת קטגוריות.</p>";
  }
}


function renderAdminLogsList(items) {
  if (!adminLogsList) return;
  adminLogsList.innerHTML = '';
  if (!items.length) {
    const p = document.createElement('p');
    p.className = 'empty-text';
    p.textContent = 'אין עדיין פעולות מנהלים.';
    adminLogsList.appendChild(p);
    return;
  }

  items.forEach((log) => {
    let diff = typeof log.diffTotal === 'number' ? log.diffTotal : null;
    const row = document.createElement('div');
    row.className = 'admin-log-row';

    const top = document.createElement('div');
    top.className = 'admin-log-main';

    const left = document.createElement('div');
    left.className = 'admin-log-main-left';

    const timeEl = document.createElement('span');
    timeEl.className = 'admin-log-time';
    timeEl.textContent = formatTimestamp(log.createdAt);

    const adminEl = document.createElement('span');
    adminEl.className = 'admin-log-admin';
    const roleLabel = log.adminRole === 'super' ? 'מנהל ראשי' : log.adminRole === 'sub' ? 'מנהל משני' : 'מנהל';
    const nameOrPin = log.adminName || log.adminPin || '';
    adminEl.textContent = nameOrPin ? `${nameOrPin} (${roleLabel})` : roleLabel;

    left.appendChild(timeEl);
    left.appendChild(adminEl);

    const actionEl = document.createElement('span');
    actionEl.className = 'admin-log-action';
    actionEl.textContent = describeAdminLogAction(log);

    top.appendChild(left);
    top.appendChild(actionEl);

    const bottom = document.createElement('div');
    bottom.className = 'admin-log-meta';

    if (log.serviceType) {
      const st = document.createElement('span');
      st.className = 'admin-log-badge';
      const label = log.serviceType === 'delivery' ? 'שְׁלִיח' : log.serviceType === 'takeaway' ? 'TAKE AWAY' : log.serviceType === 'dinein' ? 'ישיבה' : log.serviceType;
      st.textContent = `نوع الطلب: ${label}`;
      bottom.appendChild(st);
    }

    if (log.driverName) {
      const d = document.createElement('span');
      d.className = 'admin-log-badge';
      d.textContent = `שליח: ${log.driverName}`;
      bottom.appendChild(d);
    }

    const oldTVal =
      typeof log.oldTotal === 'number'
        ? log.oldTotal
        : typeof log.fromTotal === 'number'
        ? log.fromTotal
        : null;
    const newTVal =
      typeof log.newTotal === 'number'
        ? log.newTotal
        : typeof log.toTotal === 'number'
        ? log.toTotal
        : null;

    if (oldTVal != null || newTVal != null) {
      const tEl = document.createElement('span');
      tEl.className = 'admin-log-badge';
      tEl.textContent = `סכום: ${oldTVal != null ? oldTVal + '₪ → ' : ''}${newTVal != null ? newTVal + '₪' : ''}`;
      bottom.appendChild(tEl);
    }

    if (diff == null && oldTVal != null && newTVal != null) {
      diff = newTVal - oldTVal;
    }

    if (typeof diff === 'number' && diff !== 0) {
      const dEl = document.createElement('span');
      dEl.className = 'admin-log-badge';
      const sign = diff > 0 ? '-' : '+';
      const val = Math.abs(diff);
      dEl.textContent = `שינוי: ${sign}${val} ₪`;
      bottom.appendChild(dEl);
    }

    if (log.orderCode) {
      const oc = document.createElement('span');
      oc.className = 'admin-log-badge';
      oc.textContent = `הזמנה #${log.orderCode}`;
      bottom.appendChild(oc);
    }

    row.appendChild(top);
    if (bottom.childNodes.length) {
      row.appendChild(bottom);
    }

    adminLogsList.appendChild(row);
  });
}

function loadAdminLogs() {
  if (!adminLogsList) return;
  adminLogsList.innerHTML = "<p class='empty-text'>טוען פעילות...</p>";
  const colRef = collection(db, 'adminLogs');
  const qLogs = query(colRef, orderBy('createdAt', 'desc'), limit(200));
  if (adminLogsUnsub) {
    adminLogsUnsub();
    adminLogsUnsub = null;
  }
  adminLogsUnsub = onSnapshot(
    qLogs,
    (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));
      renderAdminLogsList(items);
    },
    (err) => {
      console.error('admin logs error', err);
      adminLogsList.innerHTML = "<p class='empty-text'>שגיאה בטעינת היסטוריית פעולות.</p>";
    }
  );
}

// --- Managers (admins collection) ---
function loadAdminManagers() {
  if (!adminAdminsList) return;
  adminAdminsList.innerHTML = "<p class='empty-text'>טוען מנהלים...</p>";
  const colRef = collection(db, "admins");
  const qAdmins = query(colRef, orderBy("name"));
  onSnapshot(
    qAdmins,
    (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));
      renderAdminManagersList(items);
    },
    (err) => {
      console.error("admin managers error", err);
      adminAdminsList.innerHTML = "<p class='empty-text'>שגיאה בטעינת מנהלים.</p>";
    }
  );
}

function renderAdminManagersList(items) {
  // hide soft-deleted managers
  items = (items || []).filter((a) => !a || !a.deletedAt);
  adminAdminsList.innerHTML = "";
  if (!items.length) {
    const p = document.createElement("p");
    p.className = "empty-text";
    p.textContent = "אין מנהלים במערכת.";
    adminAdminsList.appendChild(p);
    return;
  }

  const header = document.createElement("div");
  header.className = "admin-list-row admin-list-row-header";
  header.innerHTML = `
    <span>שם</span>
    <span>PIN</span>
    <span>תפקיד</span>
    <span>פעיל</span>
    <span>פעולות</span>
  `;
  adminAdminsList.appendChild(header);

  items.forEach((a) => {
    const row = document.createElement("div");
    row.className = "admin-list-row";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = a.name || "";

    const pinSpan = document.createElement("span");
    pinSpan.textContent = a.pin || "";

    const roleSpan = document.createElement("span");
    roleSpan.textContent = a.role === "super" ? "ראשי" : "משני";

    const activeSpan = document.createElement("span");
    activeSpan.textContent = a.active === false ? "לא" : "כן";

    const actions = document.createElement("div");
    actions.className = "admin-list-row admin-list-row-actions";

    const isSuper = a.role === "super";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "btn btn-secondary btn-small";
    toggleBtn.textContent = a.active === false ? "הפעל" : "השבת";
    toggleBtn.disabled = isSuper; // לא משביתים מנהל ראשי
    toggleBtn.addEventListener("click", async () => {
      if (isSuper) return;
      try {
        const ref = doc(db, "admins", a.id);
        await updateDoc(ref, { active: a.active === false });
      } catch (err) {
        console.error("toggle admin error", err);
      }
    });

    const editPinBtn = document.createElement("button");
    editPinBtn.className = "btn btn-secondary btn-small";
    editPinBtn.textContent = "שנה PIN";
    editPinBtn.addEventListener("click", async () => {
      const newPin = window.prompt("PIN חדש למנהל:", a.pin || "");
      if (!newPin || newPin === a.pin) return;
      try {
        const ref = doc(db, "admins", a.id);
        await updateDoc(ref, { pin: newPin.trim() });
      } catch (err) {
        console.error("edit admin pin error", err);
      }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-secondary btn-small";
    deleteBtn.textContent = "מחק";
    deleteBtn.disabled = isSuper;
    deleteBtn.addEventListener("click", async () => {
      if (isSuper) return;
      if (!confirm("למחוק את המנהל הזה לצמיתות?")) return;
      try {
        const ref = doc(db, "admins", a.id);
        // Try hard delete first (removes from list immediately)
        await deleteDoc(ref);
      } catch (err) {
        console.error("delete admin error", err);
        // Fallback: soft-delete if Firestore rules block deletion
        try {
          const ref = doc(db, "admins", a.id);
          await updateDoc(ref, { active: false, deletedAt: serverTimestamp() });
        } catch (e2) {
          console.error("soft delete admin error", e2);
          alert("שגיאה במחיקת מנהל. בדוק הרשאות / חיבור.");
        }
      }
    });

    actions.appendChild(toggleBtn);
    actions.appendChild(editPinBtn);
    actions.appendChild(deleteBtn);

    row.appendChild(nameSpan);
    row.appendChild(pinSpan);
    row.appendChild(roleSpan);
    row.appendChild(activeSpan);
    row.appendChild(actions);

    adminAdminsList.appendChild(row);
  });
}

adminMenuTabBtn.addEventListener("click", () => showAdminTab("menu"));
adminCustomersTabBtn.addEventListener("click", () => showAdminTab("customers"));
adminDriversTabBtn.addEventListener("click", () => showAdminTab("drivers"));
if (adminAdminsTabBtn) {
  adminAdminsTabBtn.addEventListener("click", () => showAdminTab("admins"));
}
if (adminLogsTabBtn) {
  adminLogsTabBtn.addEventListener("click", () => showAdminTab("logs"));
}

if (adminDaySummariesTabBtn) {
  adminDaySummariesTabBtn.addEventListener("click", () => showAdminTab("daysummaries"));
}

if (adminRefreshDaySummariesBtn) {
  adminRefreshDaySummariesBtn.addEventListener("click", () => loadAdminDaySummaries(true));
}
if (adminAddAdminBtn) {
  adminAddAdminBtn.addEventListener("click", async () => {
    const name = window.prompt("שם המנהל להצגה במערכת:", "");
    if (!name) return;
    const pin = window.prompt("PIN למנהל:", "");
    if (!pin) return;
    try {
      await addDoc(collection(db, "admins"), {
        name,
        pin: pin.trim(),
        role: "sub",
        active: true,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("add admin error", err);
    }
  });
}


if (adminAddCategoryBtn) {
  adminAddCategoryBtn.addEventListener("click", async () => {
    const key = (window.prompt("מפתח קטגוריה (באנגלית, לדוגמה: manaoushe):", "") || "").trim().toLowerCase()
      .replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (!key) return;
    try {
      await setDoc(doc(db, "categories", key), {
        label: key,
        labelHe: "",
        labelAr: "",
        labelEn: "",
        sortOrder: 0,
        active: true,
        imageUrl: "",
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });
      await loadAdminCategories(true);
    } catch (e) {
      console.error("add category error", e);
      alert("שגיאה ביצירת קטגוריה");
    }
  });
}

if (adminRefreshCategoriesBtn) {
  adminRefreshCategoriesBtn.addEventListener("click", () => loadAdminCategories(true));
}


if (adminAddDriverBtn) {
  adminAddDriverBtn.addEventListener("click", async () => {
    const name = window.prompt("שם השליח להצגה באפליקציה:", "");
    if (!name) return;
    const pin = window.prompt("PIN (4 ספרות):", "");
    if (!pin) return;
    try {
      await addDoc(collection(db, "drivers"), {
        name,
        pin,
        active: true,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("add driver error", err);
      alert("שגיאה בהוספת שליח, בדוק חיבור / הרשאות.");
    }
  });
}

// seed demo drivers if collection empty
async function seedDemoDriversIfEmpty() {
  const colRef = collection(db, "drivers");
  const qDemo = query(colRef, limit(1));
  try {
    const snap = await getDocs(qDemo);
    if (!snap.empty) return;
  } catch (err) {
    console.error("check drivers error", err);
    return;
  }
  const demo = [
    { name: "מוחמוד", pin: "1111" },
    { name: "חאלד", pin: "2222" },
    { name: "אמג'ד", pin: "3333" },
    { name: "האני", pin: "4444" },
    { name: "ראמי", pin: "5555" }
  ];
  for (const d of demo) {
    try {
      await addDoc(colRef, {
        name: d.name,
        pin: d.pin,
        active: true,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("seed driver error", err);
    }
  }
}

// seed demo admins if collection empty (first run)
async function seedDemoAdminsIfEmpty() {
  const colRef = collection(db, "admins");
  const qDemo = query(colRef, limit(1));
  try {
    const snap = await getDocs(qDemo);
    if (!snap.empty) return;
  } catch (err) {
    console.error("check admins error", err);
    return;
  }
  const demoAdmins = [
    { name: "خليل (בעלים)", pin: SUPER_ADMIN_PIN, role: "super" },
    { name: "محمود", pin: "1111", role: "sub" },
    { name: "مرزوق", pin: "2222", role: "sub" }
  ];
  for (const a of demoAdmins) {
    try {
      await addDoc(colRef, {
        name: a.name,
        pin: a.pin,
        role: a.role,
        active: true,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("seed admin error", err);
    }
  }
}

// להרצה ראשונית של הדמו (אם צריך)
seedDemoAdminsIfEmpty();
// Load customers for admin
function loadAdminCustomers() {
  adminCustomersList.innerHTML = "<p class='empty-text'>טוען לקוחות...</p>";
  const colRef = collection(db, "customers");
  const qCust = query(colRef, orderBy("updatedAt", "desc"), limit(100));
  onSnapshot(
    qCust,
    (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));
      renderAdminCustomersList(items);
    },
    (err) => {
      console.error("admin customers error", err);
      adminCustomersList.innerHTML = "<p class='empty-text'>שגיאה בטעינת לקוחות.</p>";
    }
  );
}


function renderAdminCustomersList(items) {
  adminCustomersList.innerHTML = "";
  if (!items.length) {
    const p = document.createElement("p");
    p.className = "empty-text";
    p.textContent = "אין לקוחות שמורים.";
    adminCustomersList.appendChild(p);
    return;
  }

  const formatAddr = (addr) => {
    if (!addr) return "";
    const parts = [];
    if (addr.street) parts.push(addr.street);
    if (addr.houseNumber) parts.push(addr.houseNumber);
    if (addr.city) parts.push(addr.city);
    if (addr.floor) parts.push("ط" + addr.floor);
    if (addr.apartment) parts.push("ش" + addr.apartment);
    if (addr.entrance) parts.push("مدخل " + addr.entrance);
    return parts.filter(Boolean).join(" ");
  };

  const header = document.createElement("div");
  header.className = "admin-list-row admin-list-row-header";
  header.innerHTML = `
    <span>שם</span>
    <span>טלפון</span>
    <span>כתובת</span>
    <span></span>
  `;
  adminCustomersList.appendChild(header);

  const beginInlineEdit = (containerEl, currentValue, placeholder, onSave) => {
    const originalHtml = containerEl.innerHTML;
    containerEl.innerHTML = "";

    const input = document.createElement("input");
    input.className = "admin-inline-input";
    input.value = currentValue || "";
    input.placeholder = placeholder || "";
    containerEl.appendChild(input);

    const actions = document.createElement("div");
    actions.className = "admin-inline-actions";

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn btn-primary btn-small";
    saveBtn.textContent = "שמור";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-secondary btn-small";
    cancelBtn.textContent = "בטל";

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
    containerEl.appendChild(actions);

    const cleanup = () => { containerEl.innerHTML = originalHtml; };

    cancelBtn.addEventListener("click", (e) => { e.preventDefault(); cleanup(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); cleanup(); }
      if (e.key === "Enter") { e.preventDefault(); saveBtn.click(); }
    });

    setTimeout(() => input.focus(), 0);

    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      saveBtn.disabled = true;
      cancelBtn.disabled = true;
      try {
        await onSave((input.value || "").trim());
      } catch (err) {
        console.error(err);
        alert("שגיאה בשמירה.");
      } finally {
        cleanup();
      }
    });
  };

  items.forEach((c) => {
    const wrap = document.createElement("div");
    wrap.className = "admin-customer-wrap";

    const row = document.createElement("div");
    row.className = "admin-list-row";

    const nameCell = document.createElement("span");
    const nameBtn = document.createElement("button");
    nameBtn.type = "button";
    nameBtn.className = "admin-inline-btn";
    nameBtn.textContent = c.name || "—";
    nameBtn.title = "לחץ לעריכת שם";
    nameCell.appendChild(nameBtn);

    const phoneCell = document.createElement("span");
    const phoneBtn = document.createElement("button");
    phoneBtn.type = "button";
    phoneBtn.className = "admin-inline-btn";
    phoneBtn.textContent = c.phone || c.id || "—";
    phoneBtn.title = "לחץ לעריכת טלפון";
    phoneCell.appendChild(phoneBtn);

    const addrCell = document.createElement("span");
    const addrBtn = document.createElement("button");
    addrBtn.type = "button";
    addrBtn.className = "admin-inline-btn admin-inline-btn-address";
    addrBtn.textContent = formatAddr(c.defaultAddress) || "—";
    addrBtn.title = "לחץ לעריכת כתובת";
    addrCell.appendChild(addrBtn);

    const actions = document.createElement("div");
    actions.className = "admin-list-row-actions";

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-secondary btn-small";
    delBtn.textContent = "מחק";
    delBtn.addEventListener("click", async () => {
      if (!confirm("למחוק את הלקוח הזה?")) return;
      try {
        await deleteDoc(doc(db, "customers", c.id));
      } catch (err) {
        console.error("delete customer error", err);
        alert("שגיאה במחיקת לקוח.");
      }
    });
    actions.appendChild(delBtn);

    row.appendChild(nameCell);
    row.appendChild(phoneCell);
    row.appendChild(addrCell);
    row.appendChild(actions);

    // Inline address editor (single editor — no prompt chain)
    const editor = document.createElement("div");
    editor.className = "admin-customer-editor hidden";
    const addr = c.defaultAddress || {};
    editor.innerHTML = `
      <div class="admin-customer-editor-grid">
        <label>עיר<input type="text" data-k="city" value="${escapeHtml(addr.city || "")}"></label>
        <label>רחוב<input type="text" data-k="street" value="${escapeHtml(addr.street || "")}"></label>
        <label>בית<input type="text" data-k="houseNumber" value="${escapeHtml(addr.houseNumber || "")}"></label>
        <label>קומה<input type="text" data-k="floor" value="${escapeHtml(addr.floor || "")}"></label>
        <label>דירה<input type="text" data-k="apartment" value="${escapeHtml(addr.apartment || "")}"></label>
        <label>مدخل<input type="text" data-k="entrance" value="${escapeHtml(addr.entrance || "")}"></label>
        <div class="admin-customer-editor-actions">
          <button type="button" class="btn btn-primary btn-small" data-act="save">שמור</button>
          <button type="button" class="btn btn-secondary btn-small" data-act="cancel">בטל</button>
        </div>
      </div>
    `;

    const openEditor = () => {
      editor.classList.remove("hidden");
      const firstInput = editor.querySelector("input");
      if (firstInput) setTimeout(() => firstInput.focus(), 0);
    };
    const closeEditor = () => editor.classList.add("hidden");

    // Field edit: Name
    nameBtn.addEventListener("click", () => {
      beginInlineEdit(nameCell, c.name || "", "שם", async (val) => {
        await setDoc(doc(db, "customers", c.id), {
          name: val || null,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      });
    });

    // Field edit: Phone (migrate doc id if needed)
    phoneBtn.addEventListener("click", () => {
      beginInlineEdit(phoneCell, c.phone || c.id || "", "טלפון", async (val) => {
        const digits = sanitizePhoneForId(val || "");
        if (!digits) { alert("טלפון לא תקין"); return; }

        if (digits === c.id) {
          await setDoc(doc(db, "customers", c.id), {
            phone: digits,
            updatedAt: serverTimestamp(),
          }, { merge: true });
          return;
        }

        // migrate: create new doc and delete old
        const newRef = doc(db, "customers", digits);
        const payload = {
          phone: digits,
          name: c.name || null,
          defaultAddress: c.defaultAddress || null,
          printOptions: c.printOptions || null,
          updatedAt: serverTimestamp(),
          migratedFrom: c.id
        };
        await setDoc(newRef, payload, { merge: true });
        await deleteDoc(doc(db, "customers", c.id));
      });
    });

    // Address edit opens inline form
    addrBtn.addEventListener("click", () => {
      if (editor.classList.contains("hidden")) openEditor();
      else closeEditor();
    });

    editor.addEventListener("click", async (e) => {
      const btn = e.target && e.target.closest ? e.target.closest("button[data-act]") : null;
      if (!btn) return;
      const act = btn.getAttribute("data-act");
      if (act === "cancel") { closeEditor(); return; }
      if (act !== "save") return;

      try {
        const inputs = Array.from(editor.querySelectorAll("input[data-k]"));
        const next = {};
        inputs.forEach((inp) => {
          const k = inp.getAttribute("data-k");
          const v = (inp.value || "").trim();
          next[k] = v || null;
        });

        await setDoc(doc(db, "customers", c.id), {
          defaultAddress: {
            city: next.city,
            street: next.street,
            houseNumber: next.houseNumber,
            floor: next.floor,
            apartment: next.apartment,
            entrance: next.entrance
          },
          updatedAt: serverTimestamp(),
        }, { merge: true });

        closeEditor();
      } catch (err) {
        console.error("save customer address error", err);
        alert("שגיאה בשמירת כתובת.");
      }
    });

    wrap.appendChild(row);
    wrap.appendChild(editor);
    adminCustomersList.appendChild(wrap);
  });
}

function initDriversMap() {
  if (!driversMapContainer) return;
  if (typeof L === "undefined") {
    console.warn("Leaflet (L) not loaded – מפה לא תוצג.");
    return;
  }
  if (driversMap) return;

  // TODO: אפשר לעדכן את הקואורדינטות למיקום המסעדה
  driversMap = L.map("driversMap").setView([32.05, 34.75], 13);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
  }).addTo(driversMap);

  const driversRef = collection(db, "drivers");
  onSnapshot(driversRef, (snap) => {
    const seenIds = new Set();
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      seenIds.add(id);

      if (!data || !data.lastLocation) {
        const existing = driverMarkers[id];
        if (existing && driversMap.hasLayer(existing)) {
          driversMap.removeLayer(existing);
        }
        delete driverMarkers[id];
        return;
      }

      const lat = data.lastLocation.lat;
      const lng = data.lastLocation.lng;
      if (typeof lat !== "number" || typeof lng !== "number") return;

      const color = getColorForDriver(id);

      let marker = driverMarkers[id];
      if (!marker) {
        marker = L.circleMarker([lat, lng], {
          radius: 10,
          color: color,
          fillColor: color,
          fillOpacity: 0.9
        }).addTo(driversMap);
        driverMarkers[id] = marker;
      } else {
        marker.setLatLng([lat, lng]);
      }

      const label = data.name || `שליח ${id}`;
      marker.bindTooltip(label, { permanent: false });
    });

    // הסרה של מרקרים של שליחים שנמחקו מה-DB
    Object.keys(driverMarkers).forEach((id) => {
      if (!seenIds.has(id)) {
        const marker = driverMarkers[id];
        if (marker && driversMap.hasLayer(marker)) {
          driversMap.removeLayer(marker);
        }
        delete driverMarkers[id];
      }
    });

    // סינון לפי הזמנות פתוחות – אחרי סיום יום לא יופיעו שליחים
    refreshDriversMapMarkers();
  });
}

// ===== App bootstrap =====
(function startPizzaOlivePOS() {
  try {
    setupCategoriesListener();
  } catch (e) {
    console.error("setupCategoriesListener failed", e);
  }
  try {
    setupMenuListener();
    // Load dynamic toppings names + pricing rules (Admin)
    loadOptionsAndPricing();
  } catch (e) {
    console.error("setupMenuListener failed", e);
  }
  try {
    setupOpenOrdersListener();
  } catch (e) {
    console.error("setupOpenOrdersListener failed", e);
  }
  try {
    setupClosedOrdersListener();
  } catch (e) {
    console.error("setupClosedOrdersListener failed", e);
  }
})();
// ===== מבצעי כמות לפיצות =====
// חישוב סכום ההזמנה כולל מבצעי 2/3 מגשים גדולים ו-2 מגשים وسط
function calculateOrderTotalWithPromotions(items) {
  if (!Array.isArray(items) || !items.length) {
    return { total: 0, discount: 0, promotions: [] };
  }

  const units = [];
  let baseTotal = 0;

  items.forEach((it) => {
    if (!it) return;
    const qty = it.qty != null && it.qty > 0 ? it.qty : 1;
    const price = it.price != null ? it.price : 0;
    const basePrice = it.basePrice != null ? it.basePrice : price;
    for (let i = 0; i < qty; i++) {
      units.push({
        basePrice,
        category: it.category || null,
        size: (it.size || "").trim(),
        nameAr: it.nameAr || "",
      });
    }
    baseTotal += price * qty; // מחיר מלא כולל תוספות
  });

  let discount = 0;
  const promotions = [];

  // פיצות גדולות (بيتزا كبير) – 2 ב-135, 3 ב-185
  const largeBasePrices = units
    .filter((u) => u.category === "pizza" && u.size === "كبير")
    .map((u) => u.basePrice)
    .filter((p) => p > 0);

  if (largeBasePrices.length) {
    const sorted = [...largeBasePrices].sort((a, b) => b - a); // מהיקר לזול על פי מחיר בסיס בלבד
    let remaining = sorted.slice();

    // 3 מגשים גדולים ב-185
    while (remaining.length >= 3) {
      const group = remaining.splice(0, 3);
      const original = group.reduce((s, v) => s + v, 0);
      const promoPrice = 185;
      if (original > promoPrice) {
        discount += original - promoPrice;
        promotions.push({ type: "3_large", original, promoPrice });
      } else {
        remaining = group.concat(remaining);
        break;
      }
    }

    // 2 מגשים גדולים ב-135 על מה שנשאר
    while (remaining.length >= 2) {
      const group = remaining.splice(0, 2);
      const original = group.reduce((s, v) => s + v, 0);
      const promoPrice = 135;
      if (original > promoPrice) {
        discount += original - promoPrice;
        promotions.push({ type: "2_large", original, promoPrice });
      } else {
        remaining = group.concat(remaining);
        break;
      }
    }
  }

  // פיצות وسط – 2 ב-100 (רק לפי מחיר בסיס, לא כולל תוספות)
  const midBasePrices = units
    .filter((u) => u.category === "pizza" && u.size === "وسط")
    .map((u) => u.basePrice)
    .filter((p) => p > 0);

  if (midBasePrices.length) {
    const sortedMid = [...midBasePrices].sort((a, b) => b - a);
    let remainingMid = sortedMid.slice();

    while (remainingMid.length >= 2) {
      const group = remainingMid.splice(0, 2);
      const original = group.reduce((s, v) => s + v, 0);
      const promoPrice = 100;
      if (original > promoPrice) {
        discount += original - promoPrice;
        promotions.push({ type: "2_mid", original, promoPrice });
      } else {
        remainingMid = group.concat(remainingMid);
        break;
      }
    }
  }

  if (discount < 0) discount = 0;
  const total = Math.max(0, baseTotal - discount);

  return { total, discount, promotions };
}

// === Takeaway cash-only pill for خنوت ===
function renderTakeawayCashPill() {
  if (!takeawayTotalsEl) return;

  const orders = typeof getTakeawayOrdersList === "function" ? getTakeawayOrdersList() : [];
  const summary = typeof calculateHallAndTakeawaySummary === "function"
    ? calculateHallAndTakeawaySummary(orders)
    : { hasAny: false, dinein: { cash: 0, card: 0 }, takeaway: { cash: 0, card: 0 } };

  const dinein = summary.dinein || { cash: 0, card: 0 };
  const takeaway = summary.takeaway || { cash: 0, card: 0 };
  const combinedCash = (dinein.cash || 0) + (takeaway.cash || 0);

  const existing = document.getElementById("takeawayCashPill");
  if (!summary.hasAny || combinedCash <= 0) {
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    return;
  }

  let pill = existing;
  if (!pill) {
    pill = document.createElement("div");
    pill.id = "takeawayCashPill";
    pill.className = "driver-summary-total takeaway-cash-pill";

    const actionsRow = takeawayTotalsEl.querySelector(".takeaway-summary-actions");
    if (actionsRow) {
      actionsRow.appendChild(pill);
    } else {
      takeawayTotalsEl.appendChild(pill);
    }
  }

  pill.textContent = "مزومان " + combinedCash.toFixed(0) + " ₪";
}


// ===== USB Print Server settings helper =====
window.oliveSetUsbPrintServer = function() {
  const currentUrl = (localStorage.getItem("OLIVE_PRINT_SERVER_URL") || "").trim();
  const currentToken = (localStorage.getItem("OLIVE_PRINT_TOKEN") || "").trim();
  const newUrl = prompt("Print Server URL (עדיף https ngrok):", currentUrl);
  if (newUrl !== null) localStorage.setItem("OLIVE_PRINT_SERVER_URL", newUrl.trim());
  const newToken = prompt("Print Token:", currentToken || "OLIVE1234");
  if (newToken !== null) localStorage.setItem("OLIVE_PRINT_TOKEN", newToken.trim());
  alert("נשמר! USB Print Server URL/Token עודכנו.");
}
// ---- Live options + pricing from Firestore (Admin can edit) ----
let OPTIONS_MAP = new Map(); // id -> {kind, name}
let PRICING_RULES = null;    // {L:{...},M:{...},P:{...}}
let COVERAGE_I18N = {};      
let PASTA_SAUCES_I18N = {};  // {id:{he/ar/en}}
let RAVIOLI_SAUCES_I18N = {}; // {id:{he/ar/en}}
;      // {ALL:{ar:..,he..,en..}, ...}

function coverageKeyToId(key){
  const c = normalizeCoverageKey(key);
  if(c === "all" || c === "full") return "ALL";
  if(c === "half_left" || c === "half-left") return "HALF_LEFT";
  if(c === "half_right" || c === "half-right") return "HALF_RIGHT";
  if(c === "third-1" || c === "third_1") return "T1";
  if(c === "third-2" || c === "third_2") return "T2";
  if(c === "third-3" || c === "third_3") return "T3";
  if(c === "q_right_top" || c === "quarter-right-top") return "Q1";
  if(c === "q_right_bottom" || c === "quarter-right-bottom") return "Q2";
  if(c === "q_left_top" || c === "quarter-left-top") return "Q3";
  if(c === "q_left_bottom" || c === "quarter-left-bottom") return "Q4";
  if(c === "Q1" || c === "Q2" || c === "Q3" || c === "Q4" || c === "T1" || c === "T2" || c === "T3" || c === "ALL" || c === "HALF_LEFT" || c === "HALF_RIGHT") return c;
  return null;
}

function covLabel(key, lang="ar"){
  const id = coverageKeyToId(key) || "ALL";
  const o = COVERAGE_I18N?.[id];
  return o?.[lang] || o?.ar || o?.he || o?.en || null;
}


function refreshCoverageButtonLabels(lang="ar"){
  try{
    if(!pizzaZoneButtons || !pizzaZoneButtons.forEach) return;
    pizzaZoneButtons.forEach((btn)=>{
      const key = btn.dataset.coverage || btn.dataset.cov || btn.textContent;
      const lbl = covLabel(key, lang);
      if(lbl) btn.textContent = lbl;
    });
    if(currentZoneLabelEl){
      const lbl = covLabel(activeToppingCoverage||"full", lang);
      if(lbl) currentZoneLabelEl.textContent = lbl;
    }
  }catch(e){}
}

function mapSizeKeyToLMP(sizeKey){
  if(sizeKey === "large") return "L";
  if(sizeKey === "family") return "M";
  if(sizeKey === "personal") return "P";
  return "M";
}

function inferKindById(id){
  const o = OPTIONS_MAP.get(id);
  if(o?.kind) return o.kind;
  // fallback (legacy)
  if(id === "shrimp" || id === "egg") return "special";
  if(id === "cheese_crust") return "edges";
  return "regular";
}

function labelArById(id){
  const o = OPTIONS_MAP.get(id);
  return o?.name?.ar || o?.name?.he || o?.name?.en || id;
}

function optionLabelById(id, lang="ar"){
  const o = OPTIONS_MAP.get(id);
  if(!o) return id;
  const n = o.name || {};
  return (n[lang] || n.ar || n.he || n.en || id).toString();
}

function getOptionDefsByKinds(kinds, opts = {}){
  const want = new Set(Array.isArray(kinds) ? kinds : [kinds]);
  const exclude = new Set(opts.excludeIds || []);
  const out = [];
  try{
    OPTIONS_MAP.forEach((v, id)=>{
      if(!id || exclude.has(id)) return;
      const k = (v && v.kind) ? String(v.kind) : inferKindById(id);
      if(!want.has(k)) return;
      const label = optionLabelById(id, opts.lang || "ar");
      out.push({ id, kind: k, label, sortOrder: (v && typeof v.sortOrder === "number") ? v.sortOrder : 0 });
    });
  }catch(e){}
  // stable sort: sortOrder then label then id
  out.sort((a,b)=>{
    const sa = Number(a.sortOrder||0)||0;
    const sb = Number(b.sortOrder||0)||0;
    if(sa!==sb) return sa-sb;
    const la = String(a.label||"");
    const lb = String(b.label||"");
    if(la!==lb) return la.localeCompare(lb, 'ar');
    return String(a.id).localeCompare(String(b.id));
  });
  return out;
}

function normalizeOptionDef(def, lang="ar"){
  if(!def) return null;
  const id = def.id || def.optionId || def.key;
  if(!id) return null;
  const kind = def.kind || inferKindById(id);
  const label = def.label || optionLabelById(id, lang);
  return { id, kind, label };
}


async function loadOptionsAndPricing(){
  try{
    // options
    const osnap = await getDocs(collection(db, "options"));
    const m = new Map();
    osnap.forEach(d=>{
      const v = d.data()||{};
      if(v.isActive === false) return;
      m.set(d.id, { kind: v.kind||"regular", name: v.name||{}, sortOrder: (typeof v.sortOrder==="number"?v.sortOrder:Number(v.sortOrder||0)||0) });
    });
    OPTIONS_MAP = m;

    // pricingRules
    const pr = await getDoc(doc(db, "pricingRules", "pizza_toppings_by_size"));
    PRICING_RULES = pr.exists() ? (pr.data()||{}) : null;

    // i18n coverage (optional)
    try{
      const cs = await getDoc(doc(db, "i18n", "coverage"));
      COVERAGE_I18N = cs.exists() ? (cs.data()||{}) : {};
    }catch(e){
      COVERAGE_I18N = {};
    }

    // i18n sauces (shared for pasta + ravioli)
    try{
      const ss = await getDoc(doc(db, "i18n", "sauces"));
      const shared = ss.exists() ? (ss.data()||{}) : {};
      // Backwards-compatible variables used throughout the UI
      PASTA_SAUCES_I18N = shared;
      RAVIOLI_SAUCES_I18N = shared;
    }catch(e){
      PASTA_SAUCES_I18N = {};
      RAVIOLI_SAUCES_I18N = {};
    }
    // Refresh zone button labels after i18n loads
    refreshCoverageButtonLabels('ar');
  }catch(e){
    console.warn("loadOptionsAndPricing failed", e);
  }
}

function priceFromRules(sizeKey, optionId, kind){
  const lmp = mapSizeKeyToLMP(sizeKey);
  const d = PRICING_RULES?.[lmp];
  if(!d) return null;
  let key = (kind==="special") ? "special" : "regular";
  if(optionId==="shrimp") key = "shrimp";
  if(optionId==="cheese_crust") key = "cheese_crust";
  const v = d?.[key];
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}// --- Kind normalizer (supports Hebrew/Arabic/custom labels) ---
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


