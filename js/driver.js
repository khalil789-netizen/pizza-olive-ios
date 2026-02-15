
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
  if (!isStandalone) return;

  const allowSelectors = [
    'body.driver-layout',
    '.driver-page',
    '.driver-orders-list',
    '.driver-summary'
  ];
  allowSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.setAttribute('data-scroll', '1'));
  });

  const shouldAllowScroll = (target) => {
    if (!target) return false;
    const tag = target.tagName ? target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    return !!target.closest('[data-scroll="1"]');
  };

  document.addEventListener('touchmove', (e) => {
    if (!shouldAllowScroll(e.target)) e.preventDefault();
  }, { passive: false });

  document.addEventListener('wheel', (e) => {
    if (!shouldAllowScroll(e.target)) e.preventDefault();
  }, { passive: false });
})();
// ---------------------------------------------------------------
// -----------------------------------
// driver.js – Pizza Olive drivers link (claim orders by PIN)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

// DOM elements
const driverLoginSection = document.getElementById("driverLoginSection");
const driverClaimSection = document.getElementById("driverClaimSection");
const driverPinInput = document.getElementById("driverPinInput");
const driverLoginBtn = document.getElementById("driverLoginBtn");
const driverLoginError = document.getElementById("driverLoginError");
const driverNameLabel = document.getElementById("driverNameLabel");

const orderIdInput = document.getElementById("orderIdInput");
const claimOrderBtn = document.getElementById("claimOrderBtn");
const claimStatus = document.getElementById("claimStatus");

const driverSummaryText = document.getElementById("driverSummaryText");
const driverOrdersList = document.getElementById("driverOrdersList");

// modal להצגת פרטי הזמנה
const driverOrderModal = document.getElementById("driverOrderModal");
const driverOrderModalTitle = document.getElementById("driverOrderModalTitle");
const driverOrderModalBody = document.getElementById("driverOrderModalBody");

let currentDriver = null;
let locationWatchId = null;
let locationPollTimer = null;
let heartbeatTimer = null;
let wakeLockSentinel = null;

// --- Driver session (PIN remembered for 24h) ---
const DRIVER_SESSION_KEY = "olive_driver_session_v1";
const DRIVER_SESSION_TTL_MS = 24 * 60 * 60 * 1000;


// --- Background / stability helpers (web limitations) ---
// Web browsers may throttle/stop geolocation when the tab is in background or the screen is locked.
// Best-effort: watchPosition + periodic getCurrentPosition fallback, restart on focus/visibility,
// and request a screen Wake Lock when supported.
async function ensureWakeLock() {
  try {
    if (!('wakeLock' in navigator)) return;
    if (wakeLockSentinel) return;
    wakeLockSentinel = await navigator.wakeLock.request('screen');
    wakeLockSentinel.addEventListener('release', () => { wakeLockSentinel = null; });
  } catch (e) {
    wakeLockSentinel = null;
  }
}
async function releaseWakeLock() {
  try { if (wakeLockSentinel) await wakeLockSentinel.release(); } catch (e) {}
  wakeLockSentinel = null;
}
function restartLocationTrackingIfNeeded() {
  if (!currentDriver) return;
  startDriverLocationTracking(true);
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    ensureWakeLock();
    restartLocationTrackingIfNeeded();
  }
});
window.addEventListener('focus', () => {
  ensureWakeLock();
  restartLocationTrackingIfNeeded();
});


function saveDriverSession(driver) {
  try {
    if (!driver || !driver.id) return;
    const payload = {
      driverId: driver.id,
      expiresAt: Date.now() + DRIVER_SESSION_TTL_MS
    };
    localStorage.setItem(DRIVER_SESSION_KEY, JSON.stringify(payload));
  } catch (e) {
    // ignore (private mode / storage blocked)
  }
}

function clearDriverSession() {
  try { localStorage.removeItem(DRIVER_SESSION_KEY); } catch (e) {}
}

function readDriverSession() {
  try {
    const raw = localStorage.getItem(DRIVER_SESSION_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.driverId || !obj.expiresAt) return null;
    if (Date.now() > Number(obj.expiresAt)) { clearDriverSession(); return null; }
    return obj;
  } catch (e) {
    return null;
  }
}
// ----------------------------------------------


// התחלת מעקב מיקום לשליח המחובר
async function startDriverLocationTracking(forceRestart = false) {
  if (!currentDriver) return;
  if (!navigator.geolocation) {
    console.warn("דפדפן לא תומך במיקום (geolocation).");
    return;
  }
  try {
    // ננקה מעקב קודם אם יש
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
      locationWatchId = null;
    }
    if (locationPollTimer) {
      clearInterval(locationPollTimer);
      locationPollTimer = null;
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }

    // Best-effort keep screen awake (supported on some browsers)
    ensureWakeLock();

const driverDocRef = doc(db, "drivers", currentDriver.id);

const pushLocation = async (coords) => {
  const { latitude, longitude } = coords || {};
  if (typeof latitude !== "number" || typeof longitude !== "number") return;
  try {
    await updateDoc(driverDocRef, {
      lastLocation: { lat: latitude, lng: longitude },
      lastSeen: serverTimestamp()
    });
  } catch (e) {
    console.error("שגיאה בעדכון מיקום השליח ב-Firestore:", e);
  }
};

    locationWatchId = navigator.geolocation.watchPosition(
      async (pos) => {
        await pushLocation(pos && pos.coords ? pos.coords : null);
      },
      (err) => {
        console.warn("שגיאת מיקום (geolocation):", err && err.message ? err.message : err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 20000
      }
    );

// Fallback polling: some browsers throttle/stop watchPosition in background.
// This keeps updating while the page is still alive (even if backgrounded).
locationPollTimer = setInterval(() => {
  try {
    navigator.geolocation.getCurrentPosition(
      (pos) => { if (pos && pos.coords) pushLocation(pos.coords); },
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 12000 }
    );
  } catch (e) {}
}, 20000);

// Heartbeat: update lastSeen even if GPS doesn't provide a fix (best-effort)
heartbeatTimer = setInterval(() => {
  updateDoc(driverDocRef, { lastSeen: serverTimestamp() }).catch(() => {});
}, 30000);

  } catch (e) {
    console.error("שגיאה בהפעלת מעקב מיקום לשליח:", e);
  }
}

function showLogin() {
  driverLoginSection.classList.remove("hidden");
  driverClaimSection.classList.add("hidden");
  driverLoginError.textContent = "";
  claimStatus.textContent = "";
  if (driverSummaryText) driverSummaryText.textContent = "";
  if (driverOrdersList) driverOrdersList.innerHTML = "";
}

function showClaim() {
  driverLoginSection.classList.add("hidden");
  driverClaimSection.classList.remove("hidden");
  driverLoginError.textContent = "";
  claimStatus.textContent = "";
}

function formatOrderTime(order) {
  const ts = order.createdAt || order.driverAssignedAt || null;
  if (!ts) return "";
  let d = null;
  try {
    if (typeof ts.toDate === "function") {
      d = ts.toDate();
    } else if (ts instanceof Date) {
      d = ts;
    } else if (typeof ts === "number") {
      d = new Date(ts);
    } else if (ts.seconds) {
      d = new Date(ts.seconds * 1000);
    }
  } catch (e) {
    console.error("formatOrderTime error", e);
  }
  if (!d) return "";
  try {
    return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    console.error("formatOrderTime toLocale error", e);
    return "";
  }
}

function openDriverOrderModal(order) {
  if (!driverOrderModal || !driverOrderModalBody || !driverOrderModalTitle) return;

  const code = order.orderCode || (order.id ? String(order.id).slice(-4) : "");
  const name = order.customerName || "";
  const timeStr = formatOrderTime(order);

  const headerParts = [];
  if (code) headerParts.push(`#${code}`);
  if (name) headerParts.push(name);
  if (timeStr) headerParts.push(timeStr);
  driverOrderModalTitle.textContent = headerParts.join(" — ");

  const items = Array.isArray(order.items) ? order.items : [];
  driverOrderModalBody.innerHTML = "";

  if (!items.length) {
    const p = document.createElement("p");
    p.className = "driver-order-modal-empty";
    p.textContent = "אין פריטים להצגה להזמנה הזו.";
    driverOrderModalBody.appendChild(p);
  } else {
    const ul = document.createElement("ul");
    ul.className = "driver-order-items-list";
    items.forEach((it) => {
      const li = document.createElement("li");
      const qty = it.qty || 1;
      const title = it.nameAr || it.name || it.title || "";
      li.textContent = `${qty} × ${title}`;
      ul.appendChild(li);
    });
    driverOrderModalBody.appendChild(ul);

    // דמי משלוח להזמנה (אופציונלי – לא חובה)
    const deliveryFee = Number(order.deliveryFee || 0) || 0;
    if (deliveryFee > 0) {
      const feeP = document.createElement("p");
      feeP.className = "driver-order-delivery-fee";
      feeP.textContent = `דמי משלוח: ${deliveryFee} ₪`;
      driverOrderModalBody.appendChild(feeP);
    }
  }

  driverOrderModal.classList.remove("hidden");
}

if (driverOrderModal) {
  driverOrderModal.addEventListener("click", () => {
    driverOrderModal.classList.add("hidden");
  });
}
function renderDriverOrders(orders) {
  if (!driverOrdersList || !driverSummaryText) return;

  driverOrdersList.innerHTML = "";
  if (!orders.length) {
    driverSummaryText.textContent = "אין הזמנות משויכות אליך.";
    return;
  }

  let totalPaid = 0;
  let totalUnpaid = 0;

  orders.forEach((order) => {
    const isPaid = order.paymentStatus === "paid" || !!order.isPaid;
    // ב-Firestore השדה נקרא totalAmount
    const amount = Number(
      order.totalToPay != null
        ? order.totalToPay
        : order.totalAmount != null
        ? order.totalAmount
        : order.total || 0
    );

    if (isPaid) totalPaid += amount;
    else totalUnpaid += amount;

    const row = document.createElement("div");
    row.className = "driver-order-row";

    // שורה ראשונה – מספר הזמנה + שם + שעה
    const line1 = document.createElement("div");
    line1.className = "driver-order-main";
    const code = order.orderCode || (order.id ? String(order.id).slice(-4) : "");
    const name = order.customerName || "";
    const timeStr = formatOrderTime(order);
    const mainParts = [];
    if (code) mainParts.push(`#${code}`);
    if (name) mainParts.push(name);
    if (timeStr) mainParts.push(timeStr);
    line1.textContent = mainParts.join(" — ");

    // שורה שנייה – כתובת + הערות
    const line2 = document.createElement("div");
    line2.className = "driver-order-details";
    const addrParts = [];
    const addrObj = order.address || {};
    if (addrObj.city) addrParts.push(addrObj.city);
    if (addrObj.street) addrParts.push(addrObj.street);
    if (addrObj.houseNumber) addrParts.push(addrObj.houseNumber);
    if (addrObj.floor) addrParts.push(`קומה ${addrObj.floor}`);
    if (addrObj.apartment) addrParts.push(`דירה ${addrObj.apartment}`);
    const addr = addrParts.join(" ");
    const notes = order.driverNotes || order.deliveryNotes || order.notes || "";
    line2.textContent = [addr, notes].filter(Boolean).join(" | ");

    // שורה שלישית – טלפון + סטטוס + סכום
    const line3 = document.createElement("div");
    line3.className = "driver-order-meta";

    const phoneSpan = document.createElement("span");
    phoneSpan.className = "driver-order-phone";
    phoneSpan.textContent = order.phone || "";
    line3.appendChild(phoneSpan);

    if (order.phone) {
      const callBtn = document.createElement("a");
      callBtn.href = `tel:${order.phone}`;
      callBtn.textContent = "התקשר";
      callBtn.className = "btn btn-secondary btn-xs driver-call-btn";
      line3.appendChild(callBtn);
    }

    if (addr) {
      const wazeBtn = document.createElement("a");
      const wazeQuery = encodeURIComponent(addr);
      wazeBtn.href = `https://waze.com/ul?q=${wazeQuery}&navigate=yes`;
      wazeBtn.textContent = "Waze";
      wazeBtn.target = "_blank";
      wazeBtn.rel = "noopener";
      wazeBtn.className = "btn btn-secondary btn-xs driver-waze-btn";
      line3.appendChild(wazeBtn);
    }

    const statusSpan = document.createElement("span");
    statusSpan.className = "driver-order-status";
    statusSpan.textContent = isPaid ? "اشراي" : "مزومان";
    line3.appendChild(statusSpan);

    const amountSpan = document.createElement("span");
    amountSpan.className = "driver-order-amount";
    amountSpan.textContent = `${amount} ₪`;
    line3.appendChild(amountSpan);

    row.appendChild(line1);
    row.appendChild(line2);
    row.appendChild(line3);

    row.addEventListener("click", (ev) => {
      // שלא יפתח מודל כשמקליקים על כפתורי חיוג / Waze
      if (ev.target.closest("a")) return;
      openDriverOrderModal(order);
    });

    driverOrdersList.appendChild(row);
  });

  driverSummaryText.textContent = `סה״כ اشراي: ${totalPaid} ₪ | סה״כ مزومان: ${totalUnpaid} ₪`;
}

async function loadDriverOrders() {
  if (!currentDriver) return;
  if (driverSummaryText) driverSummaryText.textContent = "טוען הזמנות...";

  try {
    const qRef = query(
      collection(db, "orders"),
      where("driverId", "==", currentDriver.id),
      where("status", "==", "open")
    );
    const snap = await getDocs(qRef);
    const orders = [];
    snap.forEach((docSnap) => {
      orders.push({ id: docSnap.id, ...docSnap.data() });
    });

    // סדר לפי זמן שיוך לשליח – ההזמנה ששויכה לאחרונה תהיה ראשונה
    orders.sort((a, b) => {
      const ta =
        a.driverAssignedAt && typeof a.driverAssignedAt.toMillis === "function"
          ? a.driverAssignedAt.toMillis()
          : 0;
      const tb =
        b.driverAssignedAt && typeof b.driverAssignedAt.toMillis === "function"
          ? b.driverAssignedAt.toMillis()
          : 0;
      return tb - ta;
    });

    renderDriverOrders(orders);
  } catch (err) {
    console.error(err);
    if (driverSummaryText) driverSummaryText.textContent = "שגיאה בטעינת ההזמנות.";
  }
}

// Firebase init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function tryRestoreDriverSession() {
  const sess = readDriverSession();
  if (!sess) return false;

  try {
    const dRef = doc(db, "drivers", String(sess.driverId));
    const dSnap = await getDoc(dRef);
    if (!dSnap.exists()) {
      clearDriverSession();
      return false;
    }

    const d = { id: dSnap.id, ...dSnap.data() };
    if (d.active === false) {
      clearDriverSession();
      return false;
    }

    currentDriver = d;
    driverNameLabel.textContent = currentDriver.name || "";
    showClaim();
    loadDriverOrders();
    startDriverLocationTracking();
    return true;
  } catch (e) {
    console.error("Restore driver session failed:", e);
    // if firestore fails, keep session but fall back to login
    return false;
  }
}


// Login
driverLoginBtn.addEventListener("click", async () => {
  const pin = (driverPinInput.value || "").trim();
  if (!pin) {
    driverLoginError.textContent = "תקליד PIN.";
    return;
  }

  driverLoginError.textContent = "בודק...";
  try {
    const qRef = query(collection(db, "drivers"), where("pin", "==", pin));
    const snap = await getDocs(qRef);
    if (snap.empty) {
      driverLoginError.textContent = "PIN לא נכון או שליח לא קיים.";
      return;
    }

    const docs = [];
    snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));
    // take first active driver
    const active = docs.find((d) => d.active !== false) || docs[0];
    if (active.active === false) {
      driverLoginError.textContent = "השליח לא פעיל במערכת.";
      return;
    }

    currentDriver = active;
    driverNameLabel.textContent = currentDriver.name || "";
    driverPinInput.value = "";
    saveDriverSession(currentDriver);
    showClaim();
    loadDriverOrders();
    startDriverLocationTracking();
  } catch (err) {
    console.error(err);
    driverLoginError.textContent = "שגיאה בחיבור ל-Firebase.";
  }
});

// Claim order
claimOrderBtn.addEventListener("click", async () => {
  const code = (orderIdInput.value || "").trim();
  if (!currentDriver) {
    claimStatus.textContent = "קודם תיכנס עם PIN.";
    return;
  }
  if (!code) {
    claimStatus.textContent = "תקליד מספר הזמנה.";
    return;
  }

  claimStatus.textContent = "טוען הזמנה...";

  try {
    const qRef = query(
      collection(db, "orders"),
      where("orderCode", "==", code)
    );
    const snap = await getDocs(qRef);

    if (snap.empty) {
      claimStatus.textContent = "לא נמצאה הזמנה עם המספר הזה.";
      return;
    }

    let targetDoc = null;
    snap.forEach((d) => {
      if (!targetDoc) targetDoc = d;
    });

    const ref = doc(db, "orders", targetDoc.id);

    await updateDoc(ref, {
      driverId: currentDriver.id,
      driverName: currentDriver.name || null,
      driverPin: currentDriver.pin || null,
      driverAssignedAt: serverTimestamp()
    });

    claimStatus.textContent = "ההזמנה שויכה על שמך.";
    orderIdInput.value = "";
    loadDriverOrders();
  } catch (err) {
    console.error(err);
    claimStatus.textContent = "שגיאה בשמירת הנתונים.";
  }
});

// Start: try restore session (PIN remembered for 24h)
(async () => {
  const restored = await tryRestoreDriverSession();
  if (!restored) showLogin();
})();
