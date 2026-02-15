import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const runBtn = document.getElementById("runBtn");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");

function log(line, cls = "") {
  const div = document.createElement("div");
  if (cls) div.className = cls;
  div.textContent = line;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

const defaultMenu = [
  // --- Pizzas ---
  { nameAr: "بيتزا كبير", category: "pizza", size: "كبير", basePrice: 73, sortOrder: 10 },
  { nameAr: "بيتزا وسط", category: "pizza", size: "وسط", basePrice: 60, sortOrder: 20 },
  { nameAr: "بيتزا صغير", category: "pizza", size: "صغير", basePrice: 35, sortOrder: 30 },

  // --- Sfiha ---
  { nameAr: "סفيحة صغير", category: "sfiha", size: "صغير", basePrice: 50, sortOrder: 40 },
  { nameAr: "סفيحة وسط", category: "sfiha", size: "وسط", basePrice: 90, sortOrder: 50 },
  { nameAr: "סفيحة גדול", category: "sfiha", size: "كبير", basePrice: 120, sortOrder: 60 },

  // --- Pastries / מאפים ---
  { nameAr: "מלוخ פיצה", category: "pastry", size: null, basePrice: 35, sortOrder: 70 },
  { nameAr: "מלוخ מגוגל", category: "pastry", size: null, basePrice: 30, sortOrder: 80 },
  { nameAr: "זיווה גבינה", category: "pastry", size: null, basePrice: 35, sortOrder: 90 },
  { nameAr: "סמבוסק גבינה", category: "pastry", size: null, basePrice: 35, sortOrder: 100 },
  { nameAr: "מאפה אוליב", category: "pastry", size: null, basePrice: 40, sortOrder: 110 },
  { nameAr: "ספינת בשר", category: "pastry", size: null, basePrice: 55, sortOrder: 120 },
  { nameAr: "ספינת אוליב", category: "pastry", size: null, basePrice: 45, sortOrder: 130 },
  { nameAr: "גחנון", category: "pastry", size: null, basePrice: 25, sortOrder: 140 },
  { nameAr: "מגוגל זעתר", category: "pastry", size: null, basePrice: 25, sortOrder: 150 },
  { nameAr: "מנאושה קטן", category: "pastry", size: "صغير", basePrice: 25, sortOrder: 160 },
  { nameAr: "مנאושה وسط", category: "pastry", size: "وسط", basePrice: 40, sortOrder: 170 },
  { nameAr: "מנאושה גדול", category: "pastry", size: "كبير", basePrice: 50, sortOrder: 180 },

  // --- Salads ---
  { nameAr: "سلطة خضار", category: "salad", size: null, basePrice: 40, sortOrder: 190 },
  { nameAr: "سلطة טונה", category: "salad", size: null, basePrice: 45, sortOrder: 200 },
  { nameAr: "سلطة יוונית", category: "salad", size: null, basePrice: 45, sortOrder: 210 },
  { nameAr: "سلطة شرمس", category: "salad", size: null, basePrice: 60, sortOrder: 220 },

  // --- Desserts ---
  { nameAr: "קינוח אוליב", category: "dessert", size: null, basePrice: 35, sortOrder: 230 },
  { nameAr: "بڤاريا", category: "dessert", size: null, basePrice: 15, sortOrder: 240 },
  { nameAr: "פנקוטה", category: "dessert", size: null, basePrice: 15, sortOrder: 250 },
  { nameAr: "מלאבי", category: "dessert", size: null, basePrice: 15, sortOrder: 260 },
  { nameAr: "עוגת גבינה", category: "dessert", size: null, basePrice: 15, sortOrder: 270 },
  { nameAr: "קדאיף", category: "dessert", size: null, basePrice: 15, sortOrder: 280 },
  { nameAr: "מוס שוקולד", category: "dessert", size: null, basePrice: 15, sortOrder: 290 },

  // --- Drinks (פחיות) ---
  { nameAr: "קולה (بخית)", category: "drink", size: "בخית", basePrice: 10, sortOrder: 300 },
  { nameAr: "קולה זירו (בخית)", category: "drink", size: "בخית", basePrice: 10, sortOrder: 310 },
  { nameAr: "ספרייט (בخית)", category: "drink", size: "בخית", basePrice: 10, sortOrder: 320 },
  { nameAr: "פאנטה תפוז (בخית)", category: "drink", size: "בخית", basePrice: 10, sortOrder: 330 },

  // --- Drinks (1.5 L) ---
  { nameAr: "קולה 1.5", category: "drink", size: "1.5L", basePrice: 15, sortOrder: 340 },
  { nameAr: "קולה זירו 1.5", category: "drink", size: "1.5L", basePrice: 15, sortOrder: 350 },
  { nameAr: "ספרייט 1.5", category: "drink", size: "1.5L", basePrice: 15, sortOrder: 360 },
  { nameAr: "תות בננה 1.5", category: "drink", size: "1.5L", basePrice: 15, sortOrder: 370 },

  // --- Water ---
  { nameAr: "מים קטנים", category: "drink", size: "0.5L", basePrice: 8, sortOrder: 380 },
  { nameAr: "מים גדולים", category: "drink", size: "1.5L", basePrice: 10, sortOrder: 390 },

  // --- Pasta & Ravioli ---
  {
    nameAr: "מكرونة بنه",
    category: "pasta",
    size: null,
    basePrice: 40,
    sortOrder: 400
  },
  {
    nameAr: "سباغيتي",
    category: "pasta",
    size: null,
    basePrice: 40,
    sortOrder: 410
  },
  {
    nameAr: "رافيولي جبنة",
    category: "pasta",
    size: null,
    basePrice: 40,
    sortOrder: 420
  },
  {
    nameAr: "رافيولي سبانخ",
    category: "pasta",
    size: null,
    basePrice: 40,
    sortOrder: 430
  },
  {
    nameAr: "رافيولي بطاطا",
    category: "pasta",
    size: null,
    basePrice: 40,
    sortOrder: 440
  },
  {
    nameAr: "نيوكي",
    category: "pasta",
    size: null,
    basePrice: 40,
    sortOrder: 450
  },
];

async function seedMenu() {
  runBtn.disabled = true;
  statusEl.textContent = "בודק אם יש כבר תפריט...";
  log("בודק collection 'menu'...");

  const colRef = collection(db, "menu");
  const qCheck = query(colRef, limit(1));
  const snap = await getDocs(qCheck);

  if (!snap.empty) {
    statusEl.textContent = "כבר קיימים פריטים ב-menu. אין צורך לטעון שוב.";
    log("כבר קיימים פריטים ב-menu. אם אתה רוצה לטעון מחדש, תמחק קודם את ה-collection.", "ok");
    runBtn.disabled = false;
    return;
  }

  statusEl.textContent = "טוען תפריט ל-Firebase...";
  log("מתחיל להוסיף " + defaultMenu.length + " פריטים ל-'menu'...");

  let count = 0;
  for (const item of defaultMenu) {
    await addDoc(colRef, {
      ...item,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    count++;
    log("✓ הוסף פריט: " + item.nameAr, "ok");
  }

  statusEl.textContent = "סיום! נטענו " + count + " פריטים ל-menu.";
  log("סיום טעינת תפריט. עכשיו אפשר לסגור את הדף ולהשתמש בקופה.", "ok");
  runBtn.disabled = false;
}

runBtn.addEventListener("click", () => {
  seedMenu().catch((err) => {
    console.error(err);
    log("שגיאה: " + err.message, "err");
    statusEl.textContent = "אירעה שגיאה – ראה למטה.";
    runBtn.disabled = false;
  });
});
