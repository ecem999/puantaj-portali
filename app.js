// DS Smith - Sardunya Puantaj Yönetim Portalı (app.js)

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

// 2. INDEXEDDB YÖNETİMİ
const DB_NAME = "PuantajPortalDB_v2";
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

async function getStoredWorkbookBuffer() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get("current_son_excel");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function saveWorkbookBuffer(buffer) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(buffer, "current_son_excel");
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("IndexedDB save error:", e);
  }
}

function base64ToUint8Array(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// 3. TARİH AYRIŞTIRICI (D.M.YYYY, YYYY-MM-DD, Excel Serial, Date Objesi)
function parseDateSmart(val) {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === "number") {
    // Excel seri tarihi (1900 tabanlı)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const millis = val * 86400000;
    const d = new Date(excelEpoch.getTime() + millis);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === "string") {
    const s = val.trim();
    // 1.12.2026 veya 01.12.2026 (Türkçe noktalı tarih)
    const dotParts = s.split(".");
    if (dotParts.length === 3) {
      const d = parseInt(dotParts[0], 10);
      const m = parseInt(dotParts[1], 10) - 1;
      const y = parseInt(dotParts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y > 2000) {
        return new Date(y, m, d);
      }
    }
    // 2026-12-01 (ISO)
    const dashParts = s.split("-");
    if (dashParts.length === 3) {
      const y = parseInt(dashParts[0], 10);
      const m = parseInt(dashParts[1], 10) - 1;
      const d = parseInt(dashParts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y > 2000) {
        return new Date(y, m, d);
      }
    }
    // 1/12/2026
    const slashParts = s.split("/");
    if (slashParts.length === 3) {
      const d = parseInt(slashParts[0], 10);
      const m = parseInt(slashParts[1], 10) - 1;
      const y = parseInt(slashParts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y > 2000) {
        return new Date(y, m, d);
      }
    }
    const standard = new Date(s);
    if (!isNaN(standard.getTime())) return standard;
  }
  return null;
}

// 4. EXCEL ÇALIŞMA ALANI & ARAYÜZ YÖNETİMİ
let currentWorkbook = null;

const MONTH_NAMES = [
  "ocak", "şubat", "mart", "nisan", "mayıs", "haziran",
  "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık"
];

function normStr(str) {
  if (!str) return "";
  return str.toString().toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();
}

function findWorksheetByMonthNum(wb, monthNum) {
  const targetKey = MONTH_NAMES[monthNum];
  const targetNorm = normStr(targetKey);
  return wb.worksheets.find(ws => normStr(ws.name) === targetNorm);
}

async function initApp() {
  try {
    let buf = await getStoredWorkbookBuffer();
    if (!buf) {
      if (typeof DEFAULT_SON_EXCEL_B64 !== "undefined" && DEFAULT_SON_EXCEL_B64) {
        buf = base64ToUint8Array(DEFAULT_SON_EXCEL_B64).buffer;
        await saveWorkbookBuffer(buf);
      }
    }

    if (!buf) {
      throw new Error("Varsayılan şablon verisi bulunamadı.");
    }

    currentWorkbook = new ExcelJS.Workbook();
    await currentWorkbook.xlsx.load(buf);
    refreshMonthDashboard();
  } catch (err) {
    console.error("Excel yükleme hatası:", err);
    Swal.fire({
      icon: "error",
      title: "Yükleme Hatası",
      text: "Puantaj tablosu yüklenirken bir problem oluştu: " + err.message
    });
  }
}

// Aylık durumları analiz edip ekrana kartları basar
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
      ws.eachRow((row, rowNumber) => {
        const c1Val = row.getCell(1).value;
        const dt = parseDateSmart(c1Val);
        if (dt) {
          totalDays++;
          const c2Val = row.getCell(2).value; // Öğlen yemeği
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
    card.className = "p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between";
    card.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg ${isComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} flex items-center justify-center">
          <i data-lucide="${iconName}" class="w-5 h-5"></i>
        </div>
        <div>
          <h4 class="font-bold text-sm text-slate-800 capitalize">${mname} 2026</h4>
          <p class="text-xs text-slate-500">${filledDays} / ${totalDays} gün dolu</p>
        </div>
      </div>
      <span class="text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeClass}">
        ${statusText}
      </span>
    `;
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

// 5. DOSYA YÜKLEME VE son.xlsx İLE OTOMATİK BİRLEŞTİRME
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

    // DS SMITH sayfasını veya ilk sayfayı seç
    const sourceWs = uploadedWb.worksheets.find(s => normStr(s.name).includes("ds smith")) || uploadedWb.worksheets[0];
    if (!sourceWs) {
      throw new Error("Excel dosyasında geçerli bir yemek tablosu bulunamadı.");
    }

    let updatedDaysCount = 0;
    const affectedMonths = new Set();

    // Sütun indekslerini tespit et (varsayılan: 2=öğlen, 3=gece, 4=kumanya...)
    let colOglen = 2, colGece = 3, colKumanya = 4, colYogurt = 5, colAyran = 6, colCacik = 7, colAcma = 8, colSandvic = 9;

    // Başlık satırını ara
    sourceWs.eachRow((row, rNum) => {
      if (rNum <= 5) {
        row.eachCell((cell, cNum) => {
          const txt = normStr(cell.value);
          if (txt.includes("oglen") && txt.includes("yemek")) colOglen = cNum;
          else if (txt.includes("gece") && txt.includes("yemek")) colGece = cNum;
          else if (txt.includes("kumanya")) colKumanya = cNum;
          else if (txt.includes("yogurt")) colYogurt = cNum;
          else if (txt.includes("ayran")) colAyran = cNum;
          else if (txt.includes("cacik")) colCacik = cNum;
          else if (txt.includes("acma") || txt.includes("pogaca")) colAcma = cNum;
          else if (txt.includes("sandvic")) colSandvic = cNum;
        });
      }
    });

    // Satır satır gez ve tarihleri bul
    sourceWs.eachRow((row, rowNumber) => {
      const c1Val = row.getCell(1).value;
      const targetDate = parseDateSmart(c1Val);

      if (targetDate) {
        const monthNum = targetDate.getMonth(); // 0 = Ocak, ..., 11 = Aralık
        const dayNum = targetDate.getDate();

        if (monthNum >= 0 && monthNum < MONTH_NAMES.length) {
          const monthKey = MONTH_NAMES[monthNum];
          const destWs = findWorksheetByMonthNum(currentWorkbook, monthNum);

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

              if (valOglen !== null && valOglen !== undefined && valOglen !== "") {
                const parseNum = (v) => {
                  const n = Number(v);
                  return isNaN(n) ? 0 : n;
                };

                destRow.getCell(2).value = parseNum(valOglen);
                destRow.getCell(3).value = parseNum(valGece);
                destRow.getCell(4).value = parseNum(valKumanya);
                destRow.getCell(5).value = parseNum(valYogurt);
                destRow.getCell(6).value = parseNum(valAyran);
                destRow.getCell(7).value = parseNum(valCacik);

                // Eğer hedef sayfada Açma ve Sandviç sütunları varsa
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
      const updatedBuffer = await currentWorkbook.xlsx.writeBuffer();
      await saveWorkbookBuffer(updatedBuffer);

      refreshMonthDashboard();

      processStatus.className = "p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2";
      processStatus.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-600"></i> <span>Başarıyla ${updatedDaysCount} gün güncellendi (${Array.from(affectedMonths).join(", ")}).</span>`;
      if (window.lucide) lucide.createIcons();

      Swal.fire({
        icon: "success",
        title: "Puantaj Güncellendi!",
        html: `<strong>${file.name}</strong> dosyasından <strong>${updatedDaysCount} günlük veri</strong> başarıyla <code>son.xlsx</code> içine aktarıldı.`,
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

// 6. GÜNCEL son.xlsx İNDİRME
const downloadBtn = document.getElementById("downloadBtn");
downloadBtn.addEventListener("click", async () => {
  if (!currentWorkbook) {
    Swal.fire({ icon: "error", title: "Hata", text: "İndirilecek Excel verisi bulunamadı." });
    return;
  }

  try {
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
      text: "En güncel son.xlsx dosyası bilgisayarınıza indirildi.",
      timer: 2000,
      showConfirmButton: false
    });
  } catch (err) {
    Swal.fire({ icon: "error", title: "İndirme Hatası", text: err.message });
  }
});

// 7. FABRİKA AYARLARINA SIFIRLA
const resetBtn = document.getElementById("resetBtn");
resetBtn.addEventListener("click", async () => {
  const result = await Swal.fire({
    title: "Sıfırlamak istediğinize emin misiniz?",
    text: "Tüm sonradan yüklenen veriler temizlenip orijinal son.xlsx şablonuna geri dönülecektir.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Evet, Sıfırla",
    cancelButtonText: "Vazgeç"
  });

  if (result.isConfirmed) {
    if (typeof DEFAULT_SON_EXCEL_B64 !== "undefined" && DEFAULT_SON_EXCEL_B64) {
      const buf = base64ToUint8Array(DEFAULT_SON_EXCEL_B64).buffer;
      await saveWorkbookBuffer(buf);
      await initApp();
      Swal.fire({
        icon: "success",
        title: "Sıfırlandı",
        text: "Puantaj orijinal ilk haline geri getirildi.",
        timer: 1500,
        showConfirmButton: false
      });
    }
  }
});

document.addEventListener("DOMContentLoaded", checkAuth);
