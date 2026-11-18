// Yemek & Servis Puantaj Yönetim Portalı (app.js)

// 1. KULLANICI GİRİŞİ (AUTH)
const AUTH_USER = "hüseyin";
const AUTH_PASS = "hüseyin123";

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");

function checkAuth() {
  const isAuth = sessionStorage.getItem("puantaj_auth") === "true";
  if (isAuth) {
    loginSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");
    if (window.lucide) lucide.createIcons();
    initApp();
  } else {
    loginSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
    if (window.lucide) lucide.createIcons();
  }
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const u = usernameInput.value.trim().toLowerCase();
  const p = passwordInput.value.trim();

  if (u === AUTH_USER.toLowerCase() && p === AUTH_PASS) {
    sessionStorage.setItem("puantaj_auth", "true");
    loginError.classList.add("hidden");
    checkAuth();
  } else {
    loginError.classList.remove("hidden");
  }
});

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("puantaj_auth");
  checkAuth();
});

// SEKME (TAB) GEÇİŞLERİ VE BAŞLANGIÇ SEÇİM EKRANI: YEMEK PUANTAJ <-> SERVİS PUANTAJ
const tabYemekBtn = document.getElementById("tabYemekBtn");
const tabServisBtn = document.getElementById("tabServisBtn");
const chooseYemekCard = document.getElementById("chooseYemekCard");
const chooseServisCard = document.getElementById("chooseServisCard");
const brandHomeBtn = document.getElementById("brandHomeBtn");
const chooserPanel = document.getElementById("chooserPanel");
const yemekPanel = document.getElementById("yemekPanel");
const servisPanel = document.getElementById("servisPanel");

function switchTab(mode) {
  if (mode === "chooser") {
    if (chooserPanel) chooserPanel.classList.remove("hidden");
    yemekPanel.classList.add("hidden");
    servisPanel.classList.add("hidden");
    tabYemekBtn.className = "px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-2 text-slate-600 hover:text-slate-900";
    tabServisBtn.className = "px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-2 text-slate-600 hover:text-slate-900";
  } else if (mode === "servis") {
    if (chooserPanel) chooserPanel.classList.add("hidden");
    yemekPanel.classList.add("hidden");
    servisPanel.classList.remove("hidden");
    tabServisBtn.className = "px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-2 bg-emerald-600 text-white shadow-sm";
    tabYemekBtn.className = "px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-2 text-slate-600 hover:text-slate-900";
  } else {
    if (chooserPanel) chooserPanel.classList.add("hidden");
    servisPanel.classList.add("hidden");
    yemekPanel.classList.remove("hidden");
    tabYemekBtn.className = "px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-2 bg-blue-600 text-white shadow-sm";
    tabServisBtn.className = "px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-2 text-slate-600 hover:text-slate-900";
  }
  if (window.lucide) lucide.createIcons();
}

if (tabYemekBtn && tabServisBtn) {
  tabYemekBtn.addEventListener("click", () => switchTab("yemek"));
  tabServisBtn.addEventListener("click", () => switchTab("servis"));
}
if (chooseYemekCard) {
  chooseYemekCard.addEventListener("click", () => switchTab("yemek"));
}
if (chooseServisCard) {
  chooseServisCard.addEventListener("click", () => switchTab("servis"));
}
if (brandHomeBtn) {
  brandHomeBtn.addEventListener("click", () => switchTab("chooser"));
}

// YIL SEÇİCİ (2026 / 2027) - Her yıl bağımsız yeni bir Excel dosyasında devam eder
let activeYear = parseInt(localStorage.getItem("puantaj_active_year") || "2026", 10);
if (activeYear !== 2026 && activeYear !== 2027) activeYear = 2026;

const year2026Btn = document.getElementById("year2026Btn");
const year2027Btn = document.getElementById("year2027Btn");

function updateYearUI() {
  document.querySelectorAll(".active-year-label").forEach((el) => {
    el.textContent = String(activeYear);
  });
  const chooserBadge = document.getElementById("chooserYearBadgeText");
  if (chooserBadge) {
    chooserBadge.textContent = `${activeYear} Puantaj Yönetim Sistemi`;
  }
  const activeClass = "year-selector-btn px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition bg-indigo-600 text-white shadow-sm";
  const inactiveClass = "year-selector-btn px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition text-slate-600 hover:text-slate-900";
  if (year2026Btn) year2026Btn.className = activeYear === 2026 ? activeClass : inactiveClass;
  if (year2027Btn) year2027Btn.className = activeYear === 2027 ? activeClass : inactiveClass;
}

async function switchYear(newYear) {
  if (newYear === activeYear) return;
  activeYear = newYear;
  localStorage.setItem("puantaj_active_year", String(activeYear));
  updateYearUI();
  const processStatus = document.getElementById("processStatus");
  const servisProcessStatus = document.getElementById("servisProcessStatus");
  if (processStatus) processStatus.classList.add("hidden");
  if (servisProcessStatus) servisProcessStatus.classList.add("hidden");
  await initApp();
}

if (year2026Btn) year2026Btn.addEventListener("click", () => switchYear(2026));
if (year2027Btn) year2027Btn.addEventListener("click", () => switchYear(2027));

// 2. INDEXEDDB YÖNETİMİ
const DB_NAME = "PuantajPortalDB_v8";
const STORE_NAME = "workbooks";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getStoredBufferByKey(key) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function saveBufferByKey(key, buffer) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(buffer, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("IndexedDB save error:", e);
  }
}

async function getStoredWorkbookBuffer(year = activeYear) {
  const key = year === 2026 ? "current_son_excel" : `current_son_excel_${year}`;
  return getStoredBufferByKey(key);
}

async function saveWorkbookBuffer(buffer, year = activeYear) {
  const key = year === 2026 ? "current_son_excel" : `current_son_excel_${year}`;
  return saveBufferByKey(key, buffer);
}

async function getStoredServisBuffer(year = activeYear) {
  const key = year === 2026 ? "current_servis_excel" : `current_servis_excel_${year}`;
  return getStoredBufferByKey(key);
}

async function saveServisBuffer(buffer, year = activeYear) {
  const key = year === 2026 ? "current_servis_excel" : `current_servis_excel_${year}`;
  return saveBufferByKey(key, buffer);
}

function base64ToUint8Array(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// 3. TARİH AYRIŞTIRICI (D.M.YYYY, YYYY-MM-DD, Excel Serial, Date Objesi, Türkçe Metin)
function parseDateSmart(val) {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === "object") {
    if (val.result !== undefined) return parseDateSmart(val.result);
    if (Array.isArray(val.richText)) {
      return parseDateSmart(val.richText.map(t => t.text || "").join(""));
    }
    if (val.text !== undefined) return parseDateSmart(val.text);
  }
  if (typeof val === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const millis = val * 86400000;
    const d = new Date(excelEpoch.getTime() + millis);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === "string") {
    const s = val.trim();
    const dotParts = s.split(".");
    if (dotParts.length === 3) {
      const d = parseInt(dotParts[0], 10);
      const m = parseInt(dotParts[1], 10) - 1;
      let y = parseInt(dotParts[2], 10);
      if (y > 0 && y < 100) y += 2000;
      if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y > 2000) {
        return new Date(y, m, d);
      }
    }
    const dashParts = s.split("-");
    if (dashParts.length === 3) {
      const p0 = parseInt(dashParts[0], 10);
      const p1 = parseInt(dashParts[1], 10);
      const p2 = parseInt(dashParts[2], 10);
      if (p0 > 2000 && !isNaN(p1) && !isNaN(p2)) {
        return new Date(p0, p1 - 1, p2);
      } else if (p2 > 2000 && !isNaN(p0) && !isNaN(p1)) {
        return new Date(p2, p1 - 1, p0);
      }
    }
    const slashParts = s.split("/");
    if (slashParts.length === 3) {
      const p0 = parseInt(slashParts[0], 10);
      const p1 = parseInt(slashParts[1], 10);
      let p2 = parseInt(slashParts[2], 10);
      if (p2 > 0 && p2 < 100) p2 += 2000;
      if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2) && p2 > 2000) {
        const m = p0 > 12 ? p1 - 1 : (p1 > 12 ? p0 - 1 : p1 - 1);
        const d = p0 > 12 ? p0 : (p1 > 12 ? p1 : p0);
        return new Date(p2, m, d);
      }
    }
    // Türkçe ay isimli tarih desteği (örn: "1 Kasım 2026", "01 Kasım")
    const sn = normStr(s);
    const trMonths = ["ocak", "subat", "mart", "nisan", "mayis", "haziran", "temmuz", "agustos", "eylul", "ekim", "kasim", "aralik"];
    for (let mIdx = 0; mIdx < trMonths.length; mIdx++) {
      if (sn.includes(trMonths[mIdx])) {
        const nums = sn.match(/\d+/g);
        if (nums && nums.length >= 1) {
          const day = parseInt(nums[0], 10);
          const year = nums.length >= 2 && parseInt(nums[1], 10) > 2000 ? parseInt(nums[1], 10) : activeYear;
          if (day >= 1 && day <= 31) {
            return new Date(year, mIdx, day);
          }
        }
      }
    }
  }
  return null;
}

// 4. ORTAK EXCEL YARDIMCILARI VE FORMÜL HESAPLAYICI
let currentWorkbook = null;
let servisWorkbook = null;

const MONTH_NAMES = [
  "ocak", "şubat", "mart", "nisan", "mayıs", "haziran",
  "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık"
];

const YEMEK_MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const SERVIS_MONTH_NAMES = [
  "ocak", "şubat", "mart", "nisan", "mayıs", "haziran",
  "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık"
];

const SERVIS_MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const SERVIS_ROUTE_ROWS = [
  3, 4, 5, 6,
  8, 9, 10, 11, 12,
  14, 15,
  17, 18, 19, 20, 21, 22,
  23, 24, 25, 26,
  29, 30
];

function colLettersToIndex(letters) {
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return col;
}

function indexToColLetters(col) {
  let temp, letter = "";
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = (col - temp - 1) / 26;
  }
  return letter;
}

function parseCellCoord(coord) {
  const m = /^([A-Z]+)(\d+)$/i.exec(coord.trim());
  if (!m) return null;
  return { col: colLettersToIndex(m[1].toUpperCase()), row: parseInt(m[2], 10) };
}

function recalculateWorkbookFormulas(wb) {
  if (!wb) return;
  wb.calcProperties = wb.calcProperties || {};
  wb.calcProperties.fullCalcOnLoad = true;

  wb.worksheets.forEach((ws) => {
    const vals = {};
    const formulas = {};

    ws.eachRow({ includeEmpty: false }, (row, rNum) => {
      row.eachCell({ includeEmpty: false }, (cell, cNum) => {
        const coord = `${indexToColLetters(cNum)}${rNum}`;
        const v = cell.value;
        if (v && typeof v === "object" && typeof v.formula === "string") {
          const fStr = v.formula.replace(/^=/, "").trim();
          formulas[coord] = { cell, formula: fStr };
          vals[coord] = typeof v.result === "number" ? v.result : 0;
        } else if (typeof v === "string" && v.startsWith("=")) {
          const fStr = v.replace(/^=/, "").trim();
          formulas[coord] = { cell, formula: fStr };
          vals[coord] = 0;
        } else if (typeof v === "number") {
          vals[coord] = v;
        }
      });
    });

    const getVal = (c) => vals[c.trim().toUpperCase()] || 0;

    const evalExpr = (expr) => {
      const s = expr.trim();
      const mSum = /^SUM\(([A-Z]+\d+):([A-Z]+\d+)\)$/i.exec(s);
      if (mSum) {
        const p1 = parseCellCoord(mSum[1]);
        const p2 = parseCellCoord(mSum[2]);
        if (!p1 || !p2) return 0;
        let sum = 0;
        for (let r = Math.min(p1.row, p2.row); r <= Math.max(p1.row, p2.row); r++) {
          for (let c = Math.min(p1.col, p2.col); c <= Math.max(p1.col, p2.col); c++) {
            sum += getVal(`${indexToColLetters(c)}${r}`);
          }
        }
        return Math.round(sum * 100) / 100;
      }
      if (s.includes("*")) {
        const parts = s.split("*");
        let prod = 1;
        for (const p of parts) prod *= getVal(p);
        return Math.round(prod * 100) / 100;
      }
      if (s.includes("-") && !s.includes("+")) {
        const parts = s.split("-");
        return Math.round((getVal(parts[0]) - getVal(parts[1])) * 100) / 100;
      }
      const parts = s.split("+");
      let sum = 0;
      for (const p of parts) sum += getVal(p);
      return Math.round(sum * 100) / 100;
    };

    for (let pass = 0; pass < 6; pass++) {
      for (const [coord, info] of Object.entries(formulas)) {
        vals[coord] = evalExpr(info.formula);
      }
    }

    for (const [coord, info] of Object.entries(formulas)) {
      info.cell.value = { formula: info.formula, result: vals[coord] };
    }
  });
}

function normStr(str) {
  if (!str) return "";
  if (typeof str === "object" && str.richText) {
    str = str.richText.map(t => t.text || "").join("");
  } else if (typeof str === "object" && str.result !== undefined) {
    str = String(str.result);
  }
  return str.toString()
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .replace(/Ş/g, "s")
    .replace(/ş/g, "s")
    .replace(/Ğ/g, "g")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/ü/g, "u")
    .replace(/Ö/g, "o")
    .replace(/ö/g, "o")
    .replace(/Ç/g, "c")
    .replace(/ç/g, "c")
    .toLowerCase()
    .replace(/\u0307/g, "")
    .trim();
}

function getCellNumericVal(cell) {
  if (!cell || cell.value === null || cell.value === undefined) return 0;
  const v = cell.value;
  if (typeof v === "number") return v;
  if (typeof v === "object" && typeof v.result === "number") return v.result;
  const parsed = Number(v);
  return isNaN(parsed) ? 0 : parsed;
}

function findWorksheetByMonthNum(wb, monthNum, monthList = MONTH_NAMES) {
  const targetKey = monthList[monthNum];
  const targetNorm = normStr(targetKey);
  return wb.worksheets.find(ws => normStr(ws.name) === targetNorm);
}

function ensureYemekMonthSheet(wb, monthIdx, year = 2026) {
  let ws = findWorksheetByMonthNum(wb, monthIdx, MONTH_NAMES);
  if (ws) return ws;

  const mname = MONTH_NAMES[monthIdx];
  const numDays = YEMEK_MONTH_DAYS[monthIdx] || 30;
  ws = wb.addWorksheet(mname);

  const prices = {
    kahvalti: 230,
    yemek: 275,
    yogurt: 20.75,
    ayran: 20.75,
    cacik: 20.75,
    acma: 51.97,
    sandvic: 51.97
  };

  // Varsa önceki aydan güncel birim fiyatları al
  const ekimWs = findWorksheetByMonthNum(wb, 9, MONTH_NAMES);
  if (ekimWs) {
    const pKah = getCellNumericVal(ekimWs.getCell("M3"));
    const pYem = getCellNumericVal(ekimWs.getCell("M4"));
    const pYog = getCellNumericVal(ekimWs.getCell("M5"));
    const pAcm = getCellNumericVal(ekimWs.getCell("M8"));
    if (pKah > 0) prices.kahvalti = pKah;
    if (pYem > 0) prices.yemek = pYem;
    if (pYog > 0) {
      prices.yogurt = pYog;
      prices.ayran = pYog;
      prices.cacik = pYog;
    }
    if (pAcm > 0) {
      prices.acma = pAcm;
      prices.sandvic = pAcm;
    }
  }

  const colWidths = {
    A: 32, B: 14, C: 14, D: 12, E: 12, F: 12, G: 12,
    H: 18, I: 14, J: 4, K: 18, L: 15, M: 14, N: 16, O: 16
  };
  for (const [colL, w] of Object.entries(colWidths)) {
    ws.getColumn(colL).width = w;
  }

  const fontBold = { name: "Cavolini", size: 11, bold: true };
  const fillHeader = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB7DEE8" } };
  const borderThin = {
    top: { style: "thin", color: { argb: "FFA6A6A6" } },
    left: { style: "thin", color: { argb: "FFA6A6A6" } },
    bottom: { style: "thin", color: { argb: "FFA6A6A6" } },
    right: { style: "thin", color: { argb: "FFA6A6A6" } }
  };
  const alignCenter = { horizontal: "center", vertical: "middle" };
  const alignLeft = { horizontal: "left", vertical: "middle" };
  const numFmtCurrency = "#,##0.00";
  const numFmtDate = "[$-F800]dddd\\,\\ mmmm\\ dd\\,\\ yyyy";

  const headers = [
    ["A", "tarih"], ["B", "öğlen yemeği"], ["C", "gece yemeği"],
    ["D", "kahvaltı"], ["E", "yoğurt"], ["F", "ayran"], ["G", "cacık"],
    ["H", "açma-poğaça"], ["I", "sandviç"],
    ["K", "açıklama"], ["L", "toplam adet"], ["M", "birim fiyat"], ["N", "toplam fiyat"]
  ];
  for (const [colL, htext] of headers) {
    const cell = ws.getCell(`${colL}2`);
    cell.value = htext;
    cell.font = fontBold;
    cell.fill = fillHeader;
    cell.alignment = alignCenter;
    cell.border = borderThin;
  }

  const weeks = [
    [3, 9, 10, 1],
    [11, 17, 18, 8],
    [19, 25, 26, 15],
    [27, 33, 34, 22]
  ];
  if (numDays > 28) {
    weeks.push([35, 35 + (numDays - 29), 36 + (numDays - 29), 29]);
  }

  const allDataCols = ["B", "C", "D", "E", "F", "G", "H", "I"];
  for (const [startR, endR, totR, startD] of weeks) {
    let curDay = startD;
    for (let r = startR; r <= endR; r++) {
      const dt = new Date(Date.UTC(year, monthIdx, curDay, 0, 0, 0));
      const cellA = ws.getCell(`A${r}`);
      cellA.value = dt;
      cellA.font = fontBold;
      cellA.alignment = alignLeft;
      cellA.border = borderThin;
      cellA.numFmt = numFmtDate;

      for (const colL of allDataCols) {
        const c = ws.getCell(`${colL}${r}`);
        c.value = null;
        c.font = fontBold;
        c.alignment = alignCenter;
        c.border = borderThin;
      }
      curDay++;
    }

    const cellTot = ws.getCell(`A${totR}`);
    cellTot.value = "toplam";
    cellTot.font = fontBold;
    cellTot.alignment = alignLeft;
    cellTot.border = borderThin;

    for (const colL of allDataCols) {
      const c = ws.getCell(`${colL}${totR}`);
      c.value = { formula: `SUM(${colL}${startR}:${colL}${endR})`, result: 0 };
      c.font = fontBold;
      c.alignment = alignCenter;
      c.border = borderThin;
    }
  }

  const pricingItems = [
    ["kahvaltı", "D", prices.kahvalti],
    ["yemek ", ["B", "C"], prices.yemek],
    ["yoğurt  ", "E", prices.yogurt],
    ["ayran", "F", prices.ayran],
    ["cacık", "G", prices.cacik],
    ["açma-poğaça", "H", prices.acma],
    ["sandviç", "I", prices.sandvic]
  ];

  const pDefs = [
    [3, 10, 10],
    [11, 18, 18],
    [19, 26, 26],
    [27, 34, 34]
  ];
  if (numDays > 28) {
    pDefs.push([35, 36 + (numDays - 29), 42]);
  }

  const sumCells = [];
  for (const [pStart, wTotR, sumR] of pDefs) {
    pricingItems.forEach(([itemName, colRef, uPrice], idx) => {
      const curR = pStart + idx;
      const cDesc = ws.getCell(`K${curR}`);
      cDesc.value = itemName;
      cDesc.font = fontBold;
      cDesc.alignment = alignCenter;
      cDesc.border = borderThin;

      const cQty = ws.getCell(`L${curR}`);
      const qForm = Array.isArray(colRef) ? `${colRef[0]}${wTotR}+${colRef[1]}${wTotR}` : `${colRef}${wTotR}`;
      cQty.value = { formula: qForm, result: 0 };
      cQty.font = fontBold;
      cQty.alignment = alignCenter;
      cQty.border = borderThin;

      const cPrice = ws.getCell(`M${curR}`);
      cPrice.value = uPrice;
      cPrice.font = fontBold;
      cPrice.alignment = alignCenter;
      cPrice.border = borderThin;
      cPrice.numFmt = numFmtCurrency;

      const cTot = ws.getCell(`N${curR}`);
      cTot.value = { formula: `L${curR}*M${curR}`, result: 0 };
      cTot.font = fontBold;
      cTot.alignment = alignCenter;
      cTot.border = borderThin;
      cTot.numFmt = numFmtCurrency;
    });

    const cWsum = ws.getCell(`N${sumR}`);
    cWsum.value = { formula: `SUM(N${pStart}:N${pStart + pricingItems.length - 1})`, result: 0 };
    cWsum.font = fontBold;
    cWsum.alignment = alignCenter;
    cWsum.border = borderThin;
    cWsum.numFmt = numFmtCurrency;
    sumCells.push(`N${sumR}`);
  }

  const cGtot = ws.getCell("O9");
  cGtot.value = { formula: sumCells.join(" + "), result: 0 };
  cGtot.font = { name: "Cavolini", size: 12, bold: true, color: { argb: "FF0000FF" } };
  cGtot.alignment = alignCenter;
  cGtot.border = borderThin;
  cGtot.numFmt = numFmtCurrency;

  const refStart = 45;
  ws.getCell(`K${refStart}`).value = "açıklama";
  ws.getCell(`K${refStart}`).font = fontBold;
  ws.getCell(`K${refStart}`).fill = fillHeader;
  ws.getCell(`K${refStart}`).border = borderThin;

  ws.getCell(`L${refStart}`).value = "adet fiyatı";
  ws.getCell(`L${refStart}`).font = fontBold;
  ws.getCell(`L${refStart}`).fill = fillHeader;
  ws.getCell(`L${refStart}`).border = borderThin;

  const refItems = [
    ["yemek (öğlen/gece)", prices.yemek],
    ["yemek (kahvaltı tabağı)", prices.kahvalti],
    ["yoğurt-ayran-cacık", prices.yogurt],
    ["açma-poğaça", prices.acma],
    ["sandviç", prices.sandvic]
  ];
  refItems.forEach(([rName, rPrice], i) => {
    const rRow = refStart + i + 1;
    ws.getCell(`K${rRow}`).value = rName;
    ws.getCell(`K${rRow}`).font = fontBold;
    ws.getCell(`K${rRow}`).border = borderThin;

    ws.getCell(`L${rRow}`).value = rPrice;
    ws.getCell(`L${rRow}`).font = fontBold;
    ws.getCell(`L${rRow}`).border = borderThin;
    ws.getCell(`L${rRow}`).numFmt = numFmtCurrency;
  });

  return ws;
}

// 2027 (veya yeni bir yıl) için sıfırdan temiz Yemek Puantaj çalışma kitabı oluşturur
async function createFreshYemekWorkbookForYear(year) {
  const wb = new ExcelJS.Workbook();
  for (let mIdx = 0; mIdx < MONTH_NAMES.length; mIdx++) {
    ensureYemekMonthSheet(wb, mIdx, year);
  }
  recalculateWorkbookFormulas(wb);
  return await wb.xlsx.writeBuffer();
}

// 2027 (veya yeni bir yıl) için mevcut servis şablonunun stil/yapısını koruyarak temiz Servis çalışma kitabı oluşturur
async function createFreshServisWorkbookForYear(year) {
  const wb = new ExcelJS.Workbook();
  const tplBuf = base64ToUint8Array(DEFAULT_SERVIS_EXCEL_B64).buffer;
  await wb.xlsx.load(tplBuf);

  const fillWeekend = { type: "pattern", pattern: "solid", fgColor: { argb: "FFBFBFBF" } };
  const fillWeekday = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };

  SERVIS_MONTH_NAMES.forEach((mname, idx) => {
    const ws = findWorksheetByMonthNum(wb, idx, SERVIS_MONTH_NAMES);
    if (!ws) return;
    ws.getCell("B1").value = `${mname.toUpperCase()} ${year}`;
    const maxDay = SERVIS_MONTH_DAYS[idx];

    for (let d = 1; d <= 31; d++) {
      const col = 1 + d;
      if (d <= maxDay) {
        const dt = new Date(year, idx, d);
        const dow = dt.getDay();
        const isHolidayOrWeekend = (dow === 0 || dow === 6) || (idx === 0 && d === 1);
        const cHeader = ws.getRow(2).getCell(col);
        cHeader.value = d;
        cHeader.fill = isHolidayOrWeekend ? fillWeekend : fillWeekday;
        cHeader.font = { ...(cHeader.font || {}), bold: true, color: { argb: isHolidayOrWeekend ? "FFFF0000" : "FF000000" } };

        for (const r of SERVIS_ROUTE_ROWS) {
          const cell = ws.getRow(r).getCell(col);
          cell.value = null;
          cell.fill = isHolidayOrWeekend ? fillWeekend : fillWeekday;
          cell.font = { ...(cell.font || {}), bold: true, color: { argb: isHolidayOrWeekend ? "FFFF0000" : "FF000000" } };
        }
      } else {
        for (const r of SERVIS_ROUTE_ROWS) {
          ws.getRow(r).getCell(col).value = null;
        }
      }
    }
  });

  recalculateWorkbookFormulas(wb);
  return await wb.xlsx.writeBuffer();
}

// UYGULAMA BAŞLATMA (YEMEK + SERVİS)
async function initApp() {
  updateYearUI();
  await initYemekApp();
  await initServisApp();
}

async function initYemekApp() {
  try {
    let buf = await getStoredWorkbookBuffer(activeYear);
    if (!buf) {
      if (activeYear === 2026) {
        if (typeof DEFAULT_SON_EXCEL_B64 !== "undefined" && DEFAULT_SON_EXCEL_B64) {
          buf = base64ToUint8Array(DEFAULT_SON_EXCEL_B64).buffer;
          await saveWorkbookBuffer(buf, 2026);
        }
      } else {
        buf = await createFreshYemekWorkbookForYear(activeYear);
        await saveWorkbookBuffer(buf, activeYear);
      }
    }

    if (!buf) {
      throw new Error("Varsayılan yemek şablon verisi bulunamadı.");
    }

    currentWorkbook = new ExcelJS.Workbook();
    try {
      await currentWorkbook.xlsx.load(buf);
    } catch (e) {
      console.warn("Kayıtlı yemek çalışma kitabı okunamadı, şablona dönülüyor:", e);
      buf = activeYear === 2026
        ? base64ToUint8Array(DEFAULT_SON_EXCEL_B64).buffer
        : await createFreshYemekWorkbookForYear(activeYear);
      await saveWorkbookBuffer(buf, activeYear);
      currentWorkbook = new ExcelJS.Workbook();
      await currentWorkbook.xlsx.load(buf);
    }
    if (currentWorkbook.worksheets.length === 0) {
      throw new Error("Şablonda hiç sayfa bulunamadı.");
    }

    // Eksik yeni aylar (örn. Kasım, Aralık) varsa mevcut verileri bozmadan otomatik ekle
    let addedMissingMonths = false;
    for (let mIdx = 0; mIdx < MONTH_NAMES.length; mIdx++) {
      if (!findWorksheetByMonthNum(currentWorkbook, mIdx, MONTH_NAMES)) {
        ensureYemekMonthSheet(currentWorkbook, mIdx, activeYear);
        addedMissingMonths = true;
      }
    }
    if (addedMissingMonths) {
      recalculateWorkbookFormulas(currentWorkbook);
      const updatedBuf = await currentWorkbook.xlsx.writeBuffer();
      await saveWorkbookBuffer(updatedBuf, activeYear);
    }

    refreshMonthDashboard();
  } catch (err) {
    console.error("Yemek Excel yükleme hatası:", err);
    Swal.fire({
      icon: "error",
      title: "Yükleme Hatası",
      text: "Yemek puantaj tablosu yüklenirken bir problem oluştu: " + err.message
    });
  }
}

async function initServisApp() {
  try {
    let buf = await getStoredServisBuffer(activeYear);
    if (!buf) {
      if (activeYear === 2026) {
        if (typeof DEFAULT_SERVIS_EXCEL_B64 !== "undefined" && DEFAULT_SERVIS_EXCEL_B64) {
          buf = base64ToUint8Array(DEFAULT_SERVIS_EXCEL_B64).buffer;
          await saveServisBuffer(buf, 2026);
        }
      } else {
        buf = await createFreshServisWorkbookForYear(activeYear);
        await saveServisBuffer(buf, activeYear);
      }
    }

    if (!buf) {
      console.warn("Varsayılan servis şablon verisi bulunamadı.");
      return;
    }

    servisWorkbook = new ExcelJS.Workbook();
    try {
      await servisWorkbook.xlsx.load(buf);
    } catch (e) {
      console.warn("Kayıtlı servis çalışma kitabı okunamadı, şablona dönülüyor:", e);
      buf = activeYear === 2026
        ? base64ToUint8Array(DEFAULT_SERVIS_EXCEL_B64).buffer
        : await createFreshServisWorkbookForYear(activeYear);
      await saveServisBuffer(buf, activeYear);
      servisWorkbook = new ExcelJS.Workbook();
      await servisWorkbook.xlsx.load(buf);
    }
    refreshServisDashboard();
  } catch (err) {
    console.error("Servis Excel yükleme hatası:", err);
  }
}

// ============================================================================
// BÖLÜM A: YEMEK PUANTAJ YÖNETİMİ
// ============================================================================

function refreshMonthDashboard() {
  if (!currentWorkbook) return;

  const monthsGrid = document.getElementById("monthsGrid");
  monthsGrid.innerHTML = "";

  let totalCompleted = 0;
  let totalMissing = 0;

  MONTH_NAMES.forEach((mname, idx) => {
    const ws = findWorksheetByMonthNum(currentWorkbook, idx);

    let totalDays = 0;
    let filledDays = 0;
    let missingDaysList = [];

    if (ws) {
      ws.eachRow((row) => {
        const c1Val = row.getCell(1).value;
        const dt = parseDateSmart(c1Val);
        if (dt) {
          totalDays++;
          const c2Val = row.getCell(2).value;
          if (c2Val !== null && c2Val !== undefined && c2Val !== "") {
            filledDays++;
          } else {
            missingDaysList.push(dt.getDate());
          }
        }
      });
    }

    const isComplete = totalDays > 0 && filledDays === totalDays;
    if (isComplete) totalCompleted++;
    else totalMissing++;

    let statusText = "Eksiksiz Tam";
    let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    let iconName = "check-circle-2";

    if (!isComplete) {
      badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
      iconName = "alert-circle";
      if (missingDaysList.length > 0) {
        statusText = `${missingDaysList[0]}–${missingDaysList[missingDaysList.length - 1]} ${mname.toUpperCase()} Eksik`;
      } else {
        statusText = `${filledDays}/${totalDays} Gün`;
      }
    }

    const card = document.createElement("div");
    card.className = "p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between gap-2";
    card.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg ${isComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} flex items-center justify-center shrink-0">
          <i data-lucide="${iconName}" class="w-5 h-5"></i>
        </div>
        <div>
          <h4 class="font-bold text-sm text-slate-800 capitalize">${mname} ${activeYear}</h4>
          <p class="text-xs text-slate-500">${filledDays} / ${totalDays} gün dolu</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeClass}">
          ${statusText}
        </span>
        ${filledDays > 0 ? `
          <button type="button" data-clear-month="${idx}" title="${mname.toUpperCase()} ayı verilerini sil"
            class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        ` : ''}
      </div>
    `;
    const clearBtn = card.querySelector("[data-clear-month]");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => clearMonthData(idx));
    }
    monthsGrid.appendChild(card);
  });

  const overallBadge = document.getElementById("overallBadge");
  if (totalMissing === 0) {
    overallBadge.className = "text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200";
    overallBadge.textContent = "Tüm Aylar Tamamlandı (%100)";
  } else {
    overallBadge.className = "text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200";
    overallBadge.textContent = `${totalMissing} Ayda Eksik Gün Var`;
  }

  if (window.lucide) lucide.createIcons();
}

async function clearMonthData(monthIdx) {
  if (!currentWorkbook) return;
  const mname = MONTH_NAMES[monthIdx];
  const ws = findWorksheetByMonthNum(currentWorkbook, monthIdx);
  if (!ws) return;

  const result = await Swal.fire({
    title: `${mname.toUpperCase()} ${activeYear} Silinsin mi?`,
    text: `${mname.toUpperCase()} ${activeYear} ayına ait yüklenmiş tüm günlük yemek verileri temizlenecektir.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Evet, Sil",
    cancelButtonText: "Vazgeç"
  });

  if (!result.isConfirmed) return;

  const hasExtraCols = ws.getCell('H2').value && normStr(ws.getCell('H2').value).includes('acma');
  const maxCol = hasExtraCols ? 9 : 7;

  ws.eachRow((row) => {
    const dt = parseDateSmart(row.getCell(1).value);
    if (dt) {
      for (let c = 2; c <= maxCol; c++) {
        row.getCell(c).value = null;
      }
    }
  });

  recalculateWorkbookFormulas(currentWorkbook);
  const updatedBuffer = await currentWorkbook.xlsx.writeBuffer();
  await saveWorkbookBuffer(updatedBuffer, activeYear);
  refreshMonthDashboard();

  Swal.fire({
    icon: "success",
    title: "Temizlendi",
    text: `${mname.toUpperCase()} ${activeYear} verileri başarıyla silindi.`,
    timer: 1500,
    showConfirmButton: false
  });
}

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const processStatus = document.getElementById("processStatus");

dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drop-zone-active");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drop-zone-active");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drop-zone-active");
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFileUpload(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener("change", (e) => {
  if (e.target.files && e.target.files.length > 0) {
    handleFileUpload(e.target.files[0]);
  }
});

async function handleFileUpload(file) {
  processStatus.classList.remove("hidden");
  processStatus.className = "p-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-xs flex items-center gap-2";
  processStatus.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> <span>"${file.name}" taranıyor ve tarihler eşleştiriliyor...</span>`;
  if (window.lucide) lucide.createIcons();

  try {
    const fileBuffer = await file.arrayBuffer();
    const uploadedWb = new ExcelJS.Workbook();
    await uploadedWb.xlsx.load(fileBuffer);

    const sourceWs = uploadedWb.worksheets.find(s => normStr(s.name).includes("ds smith")) || uploadedWb.worksheets[0];
    if (!sourceWs) {
      throw new Error("Excel dosyasında geçerli bir yemek tablosu bulunamadı.");
    }

    let updatedDaysCount = 0;
    const affectedMonths = new Set();

    let colTarih = 1, colOglen = 2, colGece = 3, colKumanya = 4, colYogurt = 5, colAyran = 6, colCacik = 7, colAcma = 8, colSandvic = 9;

    sourceWs.eachRow((row, rNum) => {
      if (rNum <= 6) {
        row.eachCell((cell, cNum) => {
          const txt = normStr(cell.value);
          if (txt === "tarih" || txt.includes("tarih")) colTarih = cNum;
          else if (txt.includes("oglen") && txt.includes("yemek")) colOglen = cNum;
          else if (txt.includes("gece") && txt.includes("yemek")) colGece = cNum;
          else if (txt.includes("kumanya") || txt.includes("kahvalti")) colKumanya = cNum;
          else if (txt.includes("yogurt")) colYogurt = cNum;
          else if (txt.includes("ayran")) colAyran = cNum;
          else if (txt.includes("cacik")) colCacik = cNum;
          else if (txt.includes("acma") || txt.includes("pogaca")) colAcma = cNum;
          else if (txt.includes("sandvic")) colSandvic = cNum;
        });
      }
    });

    // Yüklenecek dosyadaki tarihlerin yılını tespit et (örn: 2027 tarihli dosya yüklendiyse otomatik 2027 yılına geç)
    let detectedFileYear = null;
    sourceWs.eachRow((row) => {
      if (detectedFileYear) return;
      let d = parseDateSmart(row.getCell(colTarih).value);
      if (!d && colTarih !== 1) d = parseDateSmart(row.getCell(1).value);
      if (d) {
        const y = d.getFullYear();
        if (y === 2026 || y === 2027) detectedFileYear = y;
      }
    });

    if (detectedFileYear && detectedFileYear !== activeYear) {
      await switchYear(detectedFileYear);
    }

    sourceWs.eachRow((row) => {
      let targetDate = parseDateSmart(row.getCell(colTarih).value);
      if (!targetDate && colTarih !== 1) {
        targetDate = parseDateSmart(row.getCell(1).value);
      }

      if (targetDate) {
        const monthNum = targetDate.getMonth();
        const dayNum = targetDate.getDate();

        if (monthNum >= 0 && monthNum < MONTH_NAMES.length) {
          const monthKey = MONTH_NAMES[monthNum];
          const destWs = ensureYemekMonthSheet(currentWorkbook, monthNum, activeYear);

          if (destWs) {
            let destRow = null;
            destWs.eachRow((dRow) => {
              const dDate = parseDateSmart(dRow.getCell(1).value);
              if (dDate && dDate.getDate() === dayNum && dDate.getMonth() === monthNum) {
                destRow = dRow;
              }
            });

            if (destRow) {
              const valOglen = row.getCell(colOglen).value;
              const valGece = row.getCell(colGece).value;
              const valKumanya = row.getCell(colKumanya).value;
              const valYogurt = row.getCell(colYogurt).value;
              const valAyran = row.getCell(colAyran).value;
              const valCacik = row.getCell(colCacik).value;
              const valAcma = row.getCell(colAcma).value;
              const valSandvic = row.getCell(colSandvic).value;

              const isNotEmpty = (v) => v !== null && v !== undefined && v !== "";
              if (isNotEmpty(valOglen)) {
                const parseNum = (v) => {
                  const n = getCellNumericVal({ value: v });
                  return isNaN(n) ? 0 : n;
                };

                destRow.getCell(2).value = parseNum(valOglen);
                destRow.getCell(3).value = parseNum(valGece);
                destRow.getCell(4).value = parseNum(valKumanya);
                destRow.getCell(5).value = parseNum(valYogurt);
                destRow.getCell(6).value = parseNum(valAyran);
                destRow.getCell(7).value = parseNum(valCacik);

                if (destWs.getCell('H2').value && normStr(destWs.getCell('H2').value).includes('acma')) {
                  destRow.getCell(8).value = parseNum(valAcma);
                  destRow.getCell(9).value = parseNum(valSandvic);
                }

                updatedDaysCount++;
                affectedMonths.add(monthKey.toUpperCase());
              }
            }
          }
        }
      }
    });

    if (updatedDaysCount > 0) {
      recalculateWorkbookFormulas(currentWorkbook);
      const updatedBuffer = await currentWorkbook.xlsx.writeBuffer();
      await saveWorkbookBuffer(updatedBuffer, activeYear);

      refreshMonthDashboard();

      processStatus.className = "p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2";
      processStatus.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-600"></i> <span>Başarıyla ${updatedDaysCount} gün güncellendi (${Array.from(affectedMonths).join(", ")} ${activeYear}).</span>`;
      if (window.lucide) lucide.createIcons();

      Swal.fire({
        icon: "success",
        title: `Yemek Puantajı Güncellendi (${activeYear})!`,
        html: `<strong>${file.name}</strong> dosyasından <strong>${updatedDaysCount} günlük veri</strong> başarıyla <strong>${activeYear}</strong> yılı <code>son.xlsx</code> dosyasına aktarıldı.`,
        confirmButtonText: "Tamam"
      });
    } else {
      processStatus.className = "p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs flex items-center gap-2";
      processStatus.innerHTML = `<i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600"></i> <span>Yüklenen dosyada eklenecek yeni tarih verisi bulunamadı. Lütfen dosyadaki tarih formatını kontrol edin.</span>`;
      if (window.lucide) lucide.createIcons();
    }
  } catch (err) {
    console.error("Yükleme hatası:", err);
    processStatus.className = "p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2";
    processStatus.innerHTML = `<i data-lucide="x-circle" class="w-4 h-4 text-rose-600"></i> <span>Hata: ${err.message}</span>`;
    if (window.lucide) lucide.createIcons();
  }
}

const downloadBtn = document.getElementById("downloadBtn");
downloadBtn.addEventListener("click", async () => {
  if (!currentWorkbook || currentWorkbook.worksheets.length === 0) {
    Swal.fire({ icon: "error", title: "Hata", text: "Puantaj tablosu yüklenemedi; indirilecek geçerli veri yok. Sayfayı Ctrl+F5 ile yenileyin." });
    return;
  }

  try {
    recalculateWorkbookFormulas(currentWorkbook);
    const buffer = await currentWorkbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "son.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Swal.fire({
      icon: "success",
      title: "İndirme Başlatıldı",
      text: "En güncel yemek son.xlsx dosyası bilgisayarınıza indirildi.",
      timer: 2000,
      showConfirmButton: false
    });
  } catch (err) {
    Swal.fire({ icon: "error", title: "İndirme Hatası", text: err.message });
  }
});

const resetBtn = document.getElementById("resetBtn");
resetBtn.addEventListener("click", async () => {
    const result = await Swal.fire({
      title: `${activeYear} Yemek Puantajını Sıfırlamak İstiyor musunuz?`,
      text: `${activeYear} yılına ait sonradan yüklenen yemek verileri temizlenip başlangıç şablonuna geri dönülecektir.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Evet, Sıfırla",
      cancelButtonText: "Vazgeç"
    });

    if (result.isConfirmed) {
      const buf = activeYear === 2026
        ? base64ToUint8Array(DEFAULT_SON_EXCEL_B64).buffer
        : await createFreshYemekWorkbookForYear(activeYear);
      await saveWorkbookBuffer(buf, activeYear);
      await initYemekApp();
      Swal.fire({
        icon: "success",
        title: "Sıfırlandı",
        text: `${activeYear} yemek puantajı ilk haline geri getirildi.`,
        timer: 1500,
        showConfirmButton: false
      });
    }
});

// ============================================================================
// BÖLÜM B: SERVİS PUANTAJ YÖNETİMİ (OCAK – ARALIK 2026)
// ============================================================================

function mapServisRouteToTemplateRow(routeName, rowNumberHint = 0) {
  const n = normStr(routeName);
  if (!n) {
    if (rowNumberHint === 22) return 22;
    return null;
  }

  // Özmal Vardiya satırları (Satır 29-30)
  if (n.includes("okmeydani") && n.includes("vardiya") && !n.includes("06") && !n.includes("sabah")) {
    return 29;
  }
  if (n.includes("inonu") && n.includes("vardiya") && !n.includes("06") && !n.includes("sabah")) {
    return 30;
  }

  // Sabah 06:00 Çıkış satırları (Satır 17-19)
  if (n.includes("06:00") || n.includes("06.00") || n.includes("sabah")) {
    if (n.includes("ikitelli")) return 17;
    if (n.includes("inonu")) return 18;
    if (n.includes("okmeydani")) return 19;
  }

  // Uzama & Ek Seferler (Satır 20-22)
  if (n.includes("uzama") || n.includes("toki")) return 20;
  if (n.includes("bos")) return 22;
  if (n.includes("hafta ici ek") || n === "silivri ek") return 21;

  // Mesai satırları (Satır 23-26)
  if (n.includes("mesai") || n.includes("16:00") || n.includes("bagcilar")) {
    if (n.includes("halkali") || n.includes("kavakli")) return 23;
    if (n.includes("bagcilar") || n.includes("16:00") || n.includes("haramidere")) return 24;
    if (n.includes("silivri")) return 25;
    if (n.includes("esenyurt")) return 26;
  }

  // Vardiya satırları (Satır 14-15)
  if (n.includes("vardiya")) {
    if (n.includes("silivri")) return 14;
    if (n.includes("ikitelli")) return 15;
  }

  // Memur satırları (Satır 3-6)
  if (n.includes("gazi") || n === "okmeydani") return 3;
  if (n.includes("bogazkoy") || n.includes("akbati")) return 4;
  if (n.includes("gurpinar")) return 5;
  if (n.includes("silivri") && n.includes("memur")) return 6;

  // Üretim satırları (Satır 8-12)
  if (n.includes("haramidere")) return 8;
  if (n.includes("esenyurt")) return 9;
  if (n.includes("bahcesehir")) return 10;
  if (n.includes("halkali") || n.includes("atakent")) return 11;
  if (n.includes("silivri") && n.includes("uretim")) return 12;

  // Format A ("kavakli" ve "silivri" hem Memur hem Üretim'de geçtiği için satır numarasına göre ayırt et)
  if (n === "kavakli") {
    return rowNumberHint >= 8 ? 11 : 5;
  }
  if (n === "silivri") {
    return rowNumberHint >= 8 ? 12 : 6;
  }

  return null;
}

function detectMonthFromText(text) {
  const t = normStr(text);
  if (!t) return -1;
  for (let i = 0; i < SERVIS_MONTH_NAMES.length; i++) {
    const mNorm = normStr(SERVIS_MONTH_NAMES[i]);
    if (t.includes(mNorm)) return i;
  }
  return -1;
}

function refreshServisDashboard() {
  if (!servisWorkbook) return;

  const grid = document.getElementById("servisMonthsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  let completedCount = 0;
  let partialOrEmptyCount = 0;

  SERVIS_MONTH_NAMES.forEach((mname, idx) => {
    const ws = findWorksheetByMonthNum(servisWorkbook, idx, SERVIS_MONTH_NAMES);
    const maxDay = SERVIS_MONTH_DAYS[idx];

    let activeDaysCount = 0;
    let firstActiveDay = null;
    let lastActiveDay = null;

    if (ws) {
      for (let d = 1; d <= maxDay; d++) {
        const col = 1 + d;
        let dayHasTrips = false;
        for (const r of SERVIS_ROUTE_ROWS) {
          const val = getCellNumericVal(ws.getRow(r).getCell(col));
          if (val > 0) {
            dayHasTrips = true;
            break;
          }
        }
        if (dayHasTrips) {
          activeDaysCount++;
          if (firstActiveDay === null) firstActiveDay = d;
          lastActiveDay = d;
        }
      }
    }

    const sozlesmeliTotal = ws ? getCellNumericVal(ws.getCell("AG27")) : 0;
    const genelTotal = ws ? getCellNumericVal(ws.getCell("AG31")) : 0;

    let statusText = "Veri Bekleniyor";
    let badgeClass = "bg-slate-100 text-slate-600 border-slate-200";
    let iconBoxClass = "bg-slate-100 text-slate-500";
    let iconName = "clock";

    if (activeDaysCount > 0) {
      const trailingGap = maxDay - (lastActiveDay || 0);
      const isMayisHoliday = idx === 4 && (lastActiveDay || 0) >= 23;
      const isPartialEnd = !isMayisHoliday && trailingGap >= 10;
      const isPartialStart = (firstActiveDay || 1) > 6;

      if (isPartialEnd) {
        statusText = `${lastActiveDay + 1}–${maxDay} ${mname.toUpperCase()} Eksik`;
        badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
        iconBoxClass = "bg-amber-50 text-amber-600";
        iconName = "alert-circle";
        partialOrEmptyCount++;
      } else if (isPartialStart) {
        statusText = `1–${firstActiveDay - 1} ${mname.toUpperCase()} Eksik`;
        badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
        iconBoxClass = "bg-amber-50 text-amber-600";
        iconName = "alert-circle";
        partialOrEmptyCount++;
      } else {
        statusText = "Eksiksiz Tam";
        badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        iconBoxClass = "bg-emerald-50 text-emerald-600";
        iconName = "check-circle-2";
        completedCount++;
      }
    } else {
      partialOrEmptyCount++;
    }

    const card = document.createElement("div");
    card.className = "p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between gap-2";
    card.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg ${iconBoxClass} flex items-center justify-center shrink-0">
          <i data-lucide="${iconName}" class="w-5 h-5"></i>
        </div>
        <div>
          <h4 class="font-bold text-sm text-slate-800 capitalize">${mname} ${activeYear}</h4>
          <p class="text-xs text-slate-500">
            ${activeDaysCount > 0
              ? `Toplam: <strong>${genelTotal}</strong> sefer <span class="text-slate-400">(Söz: ${sozlesmeliTotal})</span>`
              : `Henüz sefer verisi girilmedi`}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeClass}">
          ${statusText}
        </span>
        ${activeDaysCount > 0 ? `
          <button type="button" data-clear-servis-month="${idx}" title="${mname.toUpperCase()} ayı servis verilerini sil"
            class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        ` : ''}
      </div>
    `;

    const clearBtn = card.querySelector("[data-clear-servis-month]");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => clearServisMonthData(idx));
    }
    grid.appendChild(card);
  });

  const servisOverallBadge = document.getElementById("servisOverallBadge");
  if (servisOverallBadge) {
    if (partialOrEmptyCount === 0) {
      servisOverallBadge.className = "text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200";
      servisOverallBadge.textContent = "12 Ay Tamamlandı (%100)";
    } else {
      servisOverallBadge.className = "text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200";
      servisOverallBadge.textContent = `${completedCount}/12 Ay Tam (${partialOrEmptyCount} Eksik/Bekleyen)`;
    }
  }

  if (window.lucide) lucide.createIcons();
}

async function clearServisMonthData(monthIdx) {
  if (!servisWorkbook) return;
  const mname = SERVIS_MONTH_NAMES[monthIdx];
  const ws = findWorksheetByMonthNum(servisWorkbook, monthIdx, SERVIS_MONTH_NAMES);
  if (!ws) return;

  const result = await Swal.fire({
    title: `${mname.toUpperCase()} ${activeYear} Servis Verisi Silinsin mi?`,
    text: `${mname.toUpperCase()} ${activeYear} ayına ait tüm günlük servis sefer sayıları sıfırlanacaktır.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Evet, Sil",
    cancelButtonText: "Vazgeç"
  });

  if (!result.isConfirmed) return;

  for (const r of SERVIS_ROUTE_ROWS) {
    const row = ws.getRow(r);
    for (let c = 2; c <= 32; c++) {
      row.getCell(c).value = null;
    }
  }

  recalculateWorkbookFormulas(servisWorkbook);
  const updatedBuffer = await servisWorkbook.xlsx.writeBuffer();
  await saveServisBuffer(updatedBuffer, activeYear);
  refreshServisDashboard();

  Swal.fire({
    icon: "success",
    title: "Temizlendi",
    text: `${mname.toUpperCase()} ${activeYear} servis puantaj verileri silindi.`,
    timer: 1500,
    showConfirmButton: false
  });
}

// SERVİS EXCEL DOSYASI YÜKLEME VE BİRLEŞTİRME
const servisDropZone = document.getElementById("servisDropZone");
const servisFileInput = document.getElementById("servisFileInput");
const servisProcessStatus = document.getElementById("servisProcessStatus");

if (servisDropZone && servisFileInput) {
  servisDropZone.addEventListener("click", () => servisFileInput.click());

  servisDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    servisDropZone.classList.add("drop-zone-active");
  });

  servisDropZone.addEventListener("dragleave", () => {
    servisDropZone.classList.remove("drop-zone-active");
  });

  servisDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    servisDropZone.classList.remove("drop-zone-active");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleServisFileUpload(e.dataTransfer.files[0]);
    }
  });

  servisFileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleServisFileUpload(e.target.files[0]);
    }
  });
}

async function handleServisFileUpload(file) {
  if (!servisWorkbook) return;

  servisProcessStatus.classList.remove("hidden");
  servisProcessStatus.className = "p-4 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800 text-xs flex items-center gap-2";
  servisProcessStatus.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> <span>"${file.name}" servis güzergahları ve günleri taranıyor...</span>`;
  if (window.lucide) lucide.createIcons();

  try {
    const fileBuffer = await file.arrayBuffer();
    const uploadedWb = new ExcelJS.Workbook();
    await uploadedWb.xlsx.load(fileBuffer);

    if (uploadedWb.worksheets.length === 0) {
      throw new Error("Yüklenen Excel dosyasında sayfa bulunamadı.");
    }

    // Servis dosyasında 2026 veya 2027 yılı geçiyorsa otomatik o yıla geç
    let detectedServisYear = null;
    if (file.name.includes("2027")) detectedServisYear = 2027;
    else if (file.name.includes("2026")) detectedServisYear = 2026;
    if (!detectedServisYear) {
      uploadedWb.worksheets.forEach((ws) => {
        if (ws.name.includes("2027")) detectedServisYear = 2027;
        else if (ws.name.includes("2026")) detectedServisYear = 2026;
        for (let r = 1; r <= 3 && !detectedServisYear; r++) {
          for (let c = 1; c <= 10 && !detectedServisYear; c++) {
            const cellTxt = String(ws.getRow(r).getCell(c).value || "");
            if (cellTxt.includes("2027")) detectedServisYear = 2027;
            else if (cellTxt.includes("2026")) detectedServisYear = 2026;
          }
        }
      });
    }
    if (detectedServisYear && detectedServisYear !== activeYear) {
      await switchYear(detectedServisYear);
    }

    // Dosya adından ay tespiti (yedek olarak)
    const fileMonthIdx = detectMonthFromText(file.name);

    let globalFallbackMonthIdx = fileMonthIdx;

    // Hiçbir sayfada veya dosya adında ay adı yoksa kullanıcıya sor
    let anySheetHasMonth = fileMonthIdx !== -1;
    if (!anySheetHasMonth) {
      uploadedWb.worksheets.forEach((ws) => {
        if (detectMonthFromText(ws.name) !== -1) anySheetHasMonth = true;
        for (let r = 1; r <= 3; r++) {
          for (let c = 1; c <= 10; c++) {
            if (detectMonthFromText(ws.getRow(r).getCell(c).value) !== -1) {
              anySheetHasMonth = true;
            }
          }
        }
      });
    }

    if (!anySheetHasMonth) {
      const inputOptions = {};
      SERVIS_MONTH_NAMES.forEach((m, i) => {
        inputOptions[i] = `${m.toUpperCase()} ${activeYear}`;
      });
      const { value: selectedMonth } = await Swal.fire({
        title: `Hangi Ayın Servis Puantajı (${activeYear})?`,
        text: `"${file.name}" dosyasında ay adı tespit edilemedi. Lütfen eklenecek ayı seçin:`,
        input: "select",
        inputOptions,
        inputPlaceholder: "Ay seçiniz",
        showCancelButton: true,
        confirmButtonText: "Tamam",
        cancelButtonText: "İptal"
      });
      if (selectedMonth === undefined || selectedMonth === "") {
        servisProcessStatus.classList.add("hidden");
        return;
      }
      globalFallbackMonthIdx = parseInt(selectedMonth, 10);
    }

    let totalCellsUpdated = 0;
    const updatedMonthsSet = new Set();

    uploadedWb.worksheets.forEach((sourceWs) => {
      const wsNameNorm = normStr(sourceWs.name);
      if (wsNameNorm.includes("sayfa2") || wsNameNorm.includes("sayfa3")) return;

      // Bu sayfanın hangi aya ait olduğunu tespit et
      let sheetMonthIdx = detectMonthFromText(sourceWs.name);
      if (sheetMonthIdx === -1) {
        for (let r = 1; r <= 3 && sheetMonthIdx === -1; r++) {
          for (let c = 1; c <= 10 && sheetMonthIdx === -1; c++) {
            sheetMonthIdx = detectMonthFromText(sourceWs.getRow(r).getCell(c).value);
          }
        }
      }
      if (sheetMonthIdx === -1) {
        sheetMonthIdx = globalFallbackMonthIdx;
      }
      if (sheetMonthIdx < 0 || sheetMonthIdx >= 12) return;

      const destWs = findWorksheetByMonthNum(servisWorkbook, sheetMonthIdx, SERVIS_MONTH_NAMES);
      if (!destWs) return;

      const maxDay = SERVIS_MONTH_DAYS[sheetMonthIdx];

      // Gün başlık satırını bul (1..31 sayılarını içeren satır, genelde Satır 2)
      let dayHeaderRow = 2;
      let dayColMap = {}; // dayNum (1..31) -> sourceColIndex
      for (let r = 1; r <= 5; r++) {
        const candidateMap = {};
        let foundCount = 0;
        const row = sourceWs.getRow(r);
        for (let c = 2; c <= 40; c++) {
          const v = row.getCell(c).value;
          const n = typeof v === "number" ? v : parseInt(String(v || "").trim(), 10);
          if (!isNaN(n) && n >= 1 && n <= 31 && !candidateMap[n]) {
            candidateMap[n] = c;
            foundCount++;
          }
        }
        if (foundCount >= 10) {
          dayHeaderRow = r;
          dayColMap = candidateMap;
          break;
        }
      }

      if (Object.keys(dayColMap).length === 0) return;

      // Güzergah isimlerinin Sütun A (1) mı yoksa Sütun B (2) mi olduğunu tespit et
      // DS Smith formatında (Nisan-Eylül) Sütun A sıra no (1,2,3..), Sütun B "Güzergah", günler Sütun C (3)'den başlar
      const day1Col = dayColMap[1] || 2;
      const routeCol = day1Col >= 3 ? 2 : 1;

      sourceWs.eachRow({ includeEmpty: false }, (row, rNum) => {
        if (rNum <= dayHeaderRow) return;
        const routeVal = row.getCell(routeCol).value;
        const routeNorm = normStr(routeVal);
        if (routeNorm === "toplam" || routeNorm === "guzergah" || routeNorm === "gunler") return;

        const targetRowNum = mapServisRouteToTemplateRow(routeVal, rNum);
        if (!targetRowNum) return;

        const destRow = destWs.getRow(targetRowNum);
        let rowUpdated = false;

        for (let d = 1; d <= maxDay; d++) {
          const srcCol = dayColMap[d];
          if (!srcCol) continue;
          const rawVal = row.getCell(srcCol).value;
          if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
            const numVal = getCellNumericVal(row.getCell(srcCol));
            if (!isNaN(numVal) && numVal > 0) {
              destRow.getCell(1 + d).value = numVal;
              totalCellsUpdated++;
              rowUpdated = true;
            }
          }
        }

        if (rowUpdated) {
          updatedMonthsSet.add(SERVIS_MONTH_NAMES[sheetMonthIdx].toUpperCase());
        }
      });
    });

    if (totalCellsUpdated > 0) {
      recalculateWorkbookFormulas(servisWorkbook);
      const updatedBuffer = await servisWorkbook.xlsx.writeBuffer();
      await saveServisBuffer(updatedBuffer, activeYear);
      refreshServisDashboard();

      const monthsStr = Array.from(updatedMonthsSet).join(", ");
      servisProcessStatus.className = "p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2";
      servisProcessStatus.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-600"></i> <span>Başarıyla ${totalCellsUpdated} güzergah-gün verisi işlendi (${monthsStr} ${activeYear}).</span>`;
      if (window.lucide) lucide.createIcons();

      Swal.fire({
        icon: "success",
        title: `Servis Puantajı Güncellendi (${activeYear})!`,
        html: `<strong>${file.name}</strong> dosyasından <strong>${monthsStr} ${activeYear}</strong> dönemine ait <strong>${totalCellsUpdated} hücre</strong> servis <code>son.xlsx</code> tablosuna aktarıldı.`,
        confirmButtonText: "Tamam"
      });
    } else {
      servisProcessStatus.className = "p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs flex items-center gap-2";
      servisProcessStatus.innerHTML = `<i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600"></i> <span>Yüklenen dosyada eşleşen servis güzergah veya gün verisi bulunamadı.</span>`;
      if (window.lucide) lucide.createIcons();
    }
  } catch (err) {
    console.error("Servis yükleme hatası:", err);
    servisProcessStatus.className = "p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2";
    servisProcessStatus.innerHTML = `<i data-lucide="x-circle" class="w-4 h-4 text-rose-600"></i> <span>Hata: ${err.message}</span>`;
    if (window.lucide) lucide.createIcons();
  }
}

// SERVİS GÜNCEL son.xlsx İNDİRME
const servisDownloadBtn = document.getElementById("servisDownloadBtn");
if (servisDownloadBtn) {
  servisDownloadBtn.addEventListener("click", async () => {
    if (!servisWorkbook || servisWorkbook.worksheets.length === 0) {
      Swal.fire({ icon: "error", title: "Hata", text: "Servis puantaj tablosu yüklenemedi. Sayfayı Ctrl+F5 ile yenileyin." });
      return;
    }

    try {
      recalculateWorkbookFormulas(servisWorkbook);
      const buffer = await servisWorkbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "son.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "İndirme Başlatıldı",
        text: "En güncel Servis Puantaj (son.xlsx) dosyası bilgisayarınıza indirildi.",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({ icon: "error", title: "İndirme Hatası", text: err.message });
    }
  });
}

// SERVİS FABRİKA AYARLARINA SIFIRLA
const servisResetBtn = document.getElementById("servisResetBtn");
if (servisResetBtn) {
  servisResetBtn.addEventListener("click", async () => {
    const result = await Swal.fire({
      title: `${activeYear} Servis Puantajını Sıfırlamak İstiyor musunuz?`,
      text: `${activeYear} yılına ait sonradan yüklenen servis verileri temizlenip başlangıç şablonuna geri dönülecektir.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Evet, Sıfırla",
      cancelButtonText: "Vazgeç"
    });

    if (result.isConfirmed) {
      const buf = activeYear === 2026
        ? base64ToUint8Array(DEFAULT_SERVIS_EXCEL_B64).buffer
        : await createFreshServisWorkbookForYear(activeYear);
      await saveServisBuffer(buf, activeYear);
      await initServisApp();
      Swal.fire({
        icon: "success",
        title: "Sıfırlandı",
        text: `${activeYear} servis puantajı ilk haline geri getirildi.`,
        timer: 1500,
        showConfirmButton: false
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", checkAuth);
