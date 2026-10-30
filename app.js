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
    lucide.createIcons();
    initApp();
  } else {
    loginSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
    lucide.createIcons();
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
const DB_NAME = "PuantajPortalDB";
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
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get("current_son_excel");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveWorkbookBuffer(buffer) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(buffer, "current_son_excel");
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

function base64ToUint8Array(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// 3. EXCEL ÇALIŞMA ALANI & ARAYÜZ YÖNETİMİ
let currentWorkbook = null;

const MONTH_NAMES = [
  "ocak", "şubat", "mart", "nisan", "mayıs",
  "haziran", "temmuz", "ağustos", "eylül", "ekim"
];

async function initApp() {
  try {
    let buf = await getStoredWorkbookBuffer();
    if (!buf) {
      if (typeof DEFAULT_SON_EXCEL_B64 !== "undefined" && DEFAULT_SON_EXCEL_B64) {
        buf = base64ToUint8Array(DEFAULT_SON_EXCEL_B64).buffer;
        await saveWorkbookBuffer(buf);
      }
    }

    currentWorkbook = new ExcelJS.Workbook();
    await currentWorkbook.xlsx.load(buf);
    refreshMonthDashboard();
  } catch (err) {
    console.error("Excel yükleme hatası:", err);
    Swal.fire({
      icon: "error",
      title: "Hata",
      text: "Excel şablonu yüklenirken bir problem oluştu: " + err.message
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
    // Sheet adını bul (Türkçe karakter duyarlı)
    const ws = currentWorkbook.worksheets.find(s => 
      s.name.toLowerCase().replace(/i/g, "ı").replace(/ş/g, "s") === 
      mname.toLowerCase().replace(/i/g, "ı").replace(/ş/g, "s") ||
      s.name.toLowerCase() === mname.toLowerCase()
    );

    let totalDays = 0;
    let filledDays = 0;
    let missingRange = [];

    if (ws) {
      ws.eachRow((row, rowNumber) => {
        const c1 = row.getCell(1).value;
        if (c1 && (c1 instanceof Date || (typeof c1 === "string" && c1.match(/\d{4}-\d{2}-\d{2}/)))) {
          totalDays++;
          const c2 = row.getCell(2).value; // Öğlen yemeği hücresi
          if (c2 !== null && c2 !== undefined && c2 !== "") {
            filledDays++;
          } else {
            const dt = c1 instanceof Date ? c1 : new Date(c1);
            missingRange.push(dt.getDate());
          }
        }
      });
    }

    const isComplete = totalDays > 0 && filledDays === totalDays;
    if (isComplete) totalCompleted++;
    else totalMissing++;

    // Eksik gün formatı
    let statusText = "Eksiksiz Tam";
    let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    let iconName = "check-circle-2";

    if (!isComplete) {
      badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
      iconName = "alert-circle";
      if (missingRange.length > 0) {
        statusText = `${missingRange[0]}–${missingRange[missingRange.length - 1]} ${mname.toUpperCase()} Eksik`;
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

  lucide.createIcons();
}

// 4. DOSYA YÜKLEME VE son.xlsx İLE OTOMATİK BİRLEŞTİRME
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
  if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
    Swal.fire({
      icon: "warning",
      title: "Geçersiz Dosya Formatı",
      text: "Lütfen sadece .xlsx veya .xls formatında bir Excel dosyası yükleyin."
    });
    return;
  }

  processStatus.classList.remove("hidden");
  processStatus.className = "p-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-xs flex items-center gap-2";
  processStatus.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> <span>"${file.name}" işleniyor ve tarihler eşleştiriliyor...</span>`;
  lucide.createIcons();

  try {
    const fileBuffer = await file.arrayBuffer();
    const uploadedWb = new ExcelJS.Workbook();
    await uploadedWb.xlsx.load(fileBuffer);

    // Gelen dosyadaki DS SMITH veya ilk sayfayı seç
    const sourceWs = uploadedWb.worksheets.find(s => s.name.toUpperCase().includes("DS SMITH")) || uploadedWb.worksheets[0];
    if (!sourceWs) {
      throw new Error("Excel dosyasında geçerli bir yemek tablosu bulunamadı.");
    }

    let updatedDaysCount = 0;
    const affectedMonths = new Set();

    // Satır satır gez ve tarihleri bul
    sourceWs.eachRow((row, rowNumber) => {
      const dateCell = row.getCell(1).value;
      let targetDate = null;

      if (dateCell instanceof Date) {
        targetDate = dateCell;
      } else if (typeof dateCell === "string") {
        const parsed = new Date(dateCell);
        if (!isNaN(parsed.getTime())) targetDate = parsed;
      }

      if (targetDate) {
        const monthNum = targetDate.getMonth(); // 0 = Ocak, ..., 5 = Haziran, etc.
        const dayNum = targetDate.getDate();
        const yearNum = targetDate.getFullYear();

        if (monthNum >= 0 && monthNum < MONTH_NAMES.length) {
          const monthKey = MONTH_NAMES[monthNum];
          const destWs = currentWorkbook.worksheets.find(s => 
            s.name.toLowerCase().replace(/i/g, "ı").replace(/ş/g, "s") === 
            monthKey.toLowerCase().replace(/i/g, "ı").replace(/ş/g, "s") ||
            s.name.toLowerCase() === monthKey.toLowerCase()
          );

          if (destWs) {
            // İlgili aydaki eşleşen satırı bul
            let destRow = null;
            destWs.eachRow((dRow) => {
              const dDateVal = dRow.getCell(1).value;
              if (dDateVal) {
                const dDate = dDateVal instanceof Date ? dDateVal : new Date(dDateVal);
                if (dDate.getDate() === dayNum && dDate.getMonth() === monthNum) {
                  destRow = dRow;
                }
              }
            });

            if (destRow) {
              // Değerleri oku
              const valOglen = row.getCell(2).value;
              const valGece = row.getCell(3).value;
              const valKumanya = row.getCell(4).value;
              const valYogurt = row.getCell(5).value;
              const valAyran = row.getCell(6).value;
              const valCacik = row.getCell(7).value;
              const valAcma = row.getCell(8).value;
              const valSandvic = row.getCell(9).value;

              // Değerler boş değilse aktar
              if (valOglen !== null && valOglen !== undefined) {
                destRow.getCell(2).value = valOglen;
                destRow.getCell(3).value = (valGece !== null && valGece !== undefined) ? valGece : 0;
                destRow.getCell(4).value = (valKumanya !== null && valKumanya !== undefined) ? valKumanya : 0;
                destRow.getCell(5).value = (valYogurt !== null && valYogurt !== undefined) ? valYogurt : 0;
                destRow.getCell(6).value = (valAyran !== null && valAyran !== undefined) ? valAyran : 0;
                destRow.getCell(7).value = (valCacik !== null && valCacik !== undefined) ? valCacik : 0;

                // Eğer hedef sayfada Açma-Poğaça ve Sandviç sütunları varsa aktar
                if (destWs.getCell('H2').value && destWs.getCell('H2').value.toString().toLowerCase().includes('açma')) {
                  destRow.getCell(8).value = (valAcma !== null && valAcma !== undefined) ? valAcma : 0;
                  destRow.getCell(9).value = (valSandvic !== null && valSandvic !== undefined) ? valSandvic : 0;
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
      // IndexedDB'ye kaydet
      const updatedBuffer = await currentWorkbook.xlsx.writeBuffer();
      await saveWorkbookBuffer(updatedBuffer);

      refreshMonthDashboard();

      processStatus.className = "p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2";
      processStatus.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-600"></i> <span>Başarıyla ${updatedDaysCount} gün güncellendi (${Array.from(affectedMonths).join(", ")}).</span>`;
      lucide.createIcons();

      Swal.fire({
        icon: "success",
        title: "Puantaj Güncellendi!",
        html: `<strong>${file.name}</strong> dosyasından <strong>${updatedDaysCount} günlük veri</strong> başarıyla <code>son.xlsx</code> dosyasına eklendi ve tüm toplamlar yeniden hesaplandı.`,
        confirmButtonText: "Tamam"
      });
    } else {
      processStatus.className = "p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs flex items-center gap-2";
      processStatus.innerHTML = `<i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600"></i> <span>Yüklenen dosyada eklenecek yeni tarih verisi bulunamadı.</span>`;
      lucide.createIcons();
    }
  } catch (err) {
    console.error("Yükleme hatası:", err);
    processStatus.className = "p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2";
    processStatus.innerHTML = `<i data-lucide="x-circle" class="w-4 h-4 text-rose-600"></i> <span>Hata: ${err.message}</span>`;
    lucide.createIcons();
  }
}

// 5. GÜNCEL son.xlsx İNDİRME
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

// 6. FABRİKA AYARLARINA SIFIRLA
const resetBtn = document.getElementById("resetBtn");
resetBtn.addEventListener("click", async () => {
  const result = await Swal.fire({
    title: "Sıfırlamak istediğinize emin misiniz?",
    text: "Tüm sonradan yüklenen veriler silinip orijinal son.xlsx şablonuna geri dönülecektir.",
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

// Sayfa yüklendiğinde oturumu kontrol et
document.addEventListener("DOMContentLoaded", checkAuth);
