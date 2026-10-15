// URL Web App Google Apps Script
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxHjU1itJjBNQJQPlNUEAaM85Lcf8pFcMlvJd6MZowix2zNNPgC3njbrxyIakTl-7BT/exec";

// Daftar urutan tab
const TAB_ORDER = ["tab-1", "tab-2", "tab-3", "tab-4", "tab-5"];
const TAB_TITLES = ["1. Identitas", "2. Kronologi", "3. Pemeriksaan", "4. Penilaian Risiko", "5. Rekomendasi"];
let currentTabIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  // Set tanggal hari ini pada form TPP
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("tglSidangTpp").value = today;

  // Inisialisasi Tab
  initTabs();

  // Listener input range
  const slider = document.getElementById("potensiUlang");
  if (slider) {
    slider.addEventListener("input", (e) => {
      document.getElementById("range-val-disp").innerText = "Skala: " + e.target.value;
      updateInfographicValues();
    });
  }

  // Listener input otomatis untuk pembaruan gambar BAP
  document.getElementById("waspadaForm").addEventListener("input", updateInfographicValues);

  // Listener Tombol
  document.getElementById("btnNext").addEventListener("click", handleNextTab);
  document.getElementById("btnPrev").addEventListener("click", handlePrevTab);
  document.getElementById("btnSave").addEventListener("click", handleSaveToSpreadsheet);
  document.getElementById("btnDownload").addEventListener("click", handleDownloadImage);
  
  const btnShareWa = document.getElementById("btnShareWa");
  if (btnShareWa) {
    btnShareWa.addEventListener("click", handleShareWhatsApp);
  }

  // Inisialisasi awal
  updateInfographicValues();
  updateActionButtons();

  // Register PWA Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(reg => console.log("Service Worker WASPADA terdaftar:", reg))
      .catch(err => console.error("Gagal mendaftarkan Service Worker:", err));
  }
});

function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      if (validateCurrentTab()) {
        switchTab(index);
      }
    });
  });
}

function switchTab(index) {
  if (index < 0 || index >= TAB_ORDER.length) return;
  
  currentTabIndex = index;
  const targetId = TAB_ORDER[currentTabIndex];

  document.querySelectorAll(".tab-btn").forEach((b, i) => {
    if (i === currentTabIndex) b.classList.add("active");
    else b.classList.remove("active");
  });

  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.getElementById(targetId).classList.add("active");

  updateActionButtons();
}

function validateCurrentTab() {
  const currentTabEl = document.getElementById(TAB_ORDER[currentTabIndex]);
  const requiredInputs = currentTabEl.querySelectorAll("[required]");
  
  for (let input of requiredInputs) {
    if (!input.value.trim()) {
      showToast("⚠️ Mohon lengkapi semua kolom wajib (*)", "error");
      input.focus();
      return false;
    }
  }
  return true;
}

function handleNextTab() {
  if (!validateCurrentTab()) return;
  if (currentTabIndex < TAB_ORDER.length - 1) {
    switchTab(currentTabIndex + 1);
  }
}

function handlePrevTab() {
  if (currentTabIndex > 0) {
    switchTab(currentTabIndex - 1);
  }
}

function updateActionButtons() {
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const btnSave = document.getElementById("btnSave");
  const btnDownload = document.getElementById("btnDownload");
  const btnShareWa = document.getElementById("btnShareWa");

  if (btnPrev) btnPrev.style.display = currentTabIndex > 0 ? "flex" : "none";

  if (currentTabIndex < TAB_ORDER.length - 1) {
    if (btnNext) btnNext.style.display = "flex";
    if (btnSave) btnSave.style.display = "none";
    if (btnDownload) btnDownload.style.display = "none";
    if (btnShareWa) btnShareWa.style.display = "none";
  } else {
    if (btnNext) btnNext.style.display = "none";
    if (btnSave) btnSave.style.display = "flex";
    if (btnDownload) btnDownload.style.display = "flex";
    if (btnShareWa) btnShareWa.style.display = "flex";
  }

  // Update ringkasan header
  document.getElementById("card-step-title").innerText = TAB_TITLES[currentTabIndex];
  document.getElementById("card-status-badge").innerText = `Tahap ${currentTabIndex + 1} / 5`;
}

function formatDateIndonesian(dateString) {
  if (!dateString) return "-";
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: '2-digit' };
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('id-ID', options);
}

function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.innerText = message;
  toast.style.borderColor = type === "error" ? "#ef4444" : type === "success" ? "#22c55e" : "#3b82f6";
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 3500);
}

function updateInfographicValues() {
  const getValue = (id) => document.getElementById(id)?.value || "-";

  // Tanggal Laporan / BAP
  const rawKejadian = getValue("tglWaktuKejadian");
  document.getElementById("out-tanggal").innerText = rawKejadian !== "-" ? formatDateIndonesian(rawKejadian) : "-";

  // Identitas
  document.getElementById("out-namaWbp").innerText = getValue("namaWbp");
  document.getElementById("out-noReg").innerText = getValue("noReg");
  document.getElementById("out-kamarBlok").innerText = getValue("kamarBlok");
  document.getElementById("out-emailPelapor").innerText = getValue("emailPelapor");
  document.getElementById("out-perkaraUtama").innerText = getValue("perkaraUtama");

  // Kronologi
  document.getElementById("out-tglKejadian").innerText = rawKejadian;
  document.getElementById("out-lokasiKejadian").innerText = getValue("lokasiKejadian");
  const kat = getValue("kategoriPelanggaran");
  document.getElementById("out-kategoriPelanggaran").innerText = kat;
  document.getElementById("out-kronologiKejadian").innerText = getValue("kronologiKejadian");

  // BAP
  const pemeriksa = getValue("namaPemeriksa") + (getValue("nipPemeriksa") !== "-" ? ` (NIP: ${getValue("nipPemeriksa")})` : "");
  document.getElementById("out-pemeriksa").innerText = pemeriksa;
  document.getElementById("out-keteranganWbp").innerText = getValue("keteranganWbp");
  document.getElementById("out-barangBukti").innerText = getValue("barangBukti") || "Nihil";

  // Risiko
  const risiko = getValue("tingkatRisiko");
  document.getElementById("out-tingkatRisiko").innerText = risiko;
  document.getElementById("out-tingkatRisiko2").innerText = risiko;
  document.getElementById("out-potensiUlang").innerText = "Skala " + getValue("potensiUlang");
  document.getElementById("out-catatanRisiko").innerText = getValue("catatanRisiko") || "-";

  // Rekomendasi
  document.getElementById("out-sanksiDisiplin").innerText = getValue("sanksiDisiplin");
  document.getElementById("out-durasiHukuman").innerText = getValue("durasiHukuman");
  document.getElementById("out-tglSidangTpp").innerText = formatDateIndonesian(getValue("tglSidangTpp"));

  // Badge Status Header
  document.getElementById("card-kategori-badge").innerText = kat !== "-" ? kat.split(" ")[1] || kat : "-";
  
  const rBadge = document.getElementById("card-risiko-badge");
  if (rBadge) {
    rBadge.innerText = risiko;
    if (risiko === "Tinggi") rBadge.style.color = "#dc2626";
    else if (risiko === "Sedang") rBadge.style.color = "#d97706";
    else rBadge.style.color = "#16a34a";
  }
}

async function handleSaveToSpreadsheet() {
  if (!validateCurrentTab()) return;

  const btn = document.getElementById("btnSave");
  const icon = btn.querySelector(".btn-icon");
  const text = btn.querySelector(".btn-text");

  btn.disabled = true;
  icon.innerHTML = '<span class="spinner"></span>';
  text.innerText = "Menyimpan Data...";

  try {
    const inputs = document.querySelectorAll("input, select, textarea");
    const formData = {};
    inputs.forEach(input => {
      if (input.id) formData[input.id] = input.value || "";
    });

    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    icon.innerText = "✓";
    text.innerText = "Berhasil Disimpan!";
    showToast("✅ Data laporan WASPADA berhasil dikirim ke Google Spreadsheet!", "success");

  } catch (err) {
    showToast("❌ Gagal menyimpan data: " + err.message, "error");
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      icon.innerText = "💾";
      text.innerText = "Kirim & Simpan Data";
    }, 2500);
  }
}

async function handleDownloadImage() {
  const btn = document.getElementById("btnDownload");
  const icon = btn.querySelector(".btn-icon");
  const text = btn.querySelector(".btn-text");

  btn.disabled = true;
  icon.innerHTML = '<span class="spinner"></span>';
  text.innerText = "Memproses...";

  try {
    updateInfographicValues();

    const captureArea = document.getElementById("capture-area");
    const canvas = await html2canvas(captureArea, { 
      scale: 2,
      logging: false,
      useCORS: true
    });
    
    const link = document.createElement("a");
    const namaWbp = document.getElementById("namaWbp").value || "WBP";
    link.download = `BAP_WASPADA_${namaWbp.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    icon.innerText = "✓";
    text.innerText = "BAP Diunduh!";
    showToast("🖼️ Gambar BAP WASPADA berhasil diunduh!", "success");

  } catch (err) {
    showToast("❌ Gagal mengunduh gambar: " + err.message, "error");
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      icon.innerText = "🖼️";
      text.innerText = "Unduh BAP Gambar";
    }, 2500);
  }
}

async function handleShareWhatsApp() {
  const btn = document.getElementById("btnShareWa");
  const icon = btn.querySelector(".btn-icon");
  const text = btn.querySelector(".btn-text");

  btn.disabled = true;
  icon.innerHTML = '<span class="spinner"></span>';
  text.innerText = "Memproses...";

  try {
    updateInfographicValues();

    const nama = document.getElementById("namaWbp").value || "-";
    const noReg = document.getElementById("noReg").value || "-";
    const kamar = document.getElementById("kamarBlok").value || "-";
    const kat = document.getElementById("kategoriPelanggaran").value || "-";
    const risiko = document.getElementById("tingkatRisiko").value || "-";
    const sanksi = document.getElementById("sanksiDisiplin").value || "-";
    const tglTPP = formatDateIndonesian(document.getElementById("tglSidangTpp").value);

    const captionText = `*LAPORAN WASPADA — PELANGGARAN WBP*
🏛️ *Direktorat Jenderal Pemasyarakatan*

👤 *IDENTITAS WBP*
- Nama: ${nama}
- No. Reg: ${noReg}
- Kamar/Blok: ${kamar}

🚨 *DETAIL PELANGGARAN*
- Kategori: ${kat}
- Tingkat Risiko: ${risiko}

⚖️ *REKOMENDASI & SIDANG TPP*
- Sanksi: ${sanksi}
- Tanggal Sidang TPP: ${tglTPP}`;

    const captureArea = document.getElementById("capture-area");
    const canvas = await html2canvas(captureArea, { scale: 2, logging: false, useCORS: true });
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], `Laporan_WASPADA_${nama}.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Laporan Pelanggaran WASPADA',
        text: captionText
      });
      showToast("📲 Berhasil membuka menu berbagi!", "success");
    } else {
      await navigator.clipboard.writeText(captionText);
      const encodedText = encodeURIComponent(captionText);
      window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
      showToast("📋 Teks disalin! Gambar BAP diunduh otomatis untuk Anda lampirkan di WA.", "info");

      const link = document.createElement("a");
      link.download = file.name;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }

  } catch (err) {
    if (err.name !== 'AbortError') {
      showToast("❌ Gagal berbagi ke WhatsApp: " + err.message, "error");
    }
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      icon.innerText = "📲";
      text.innerText = "Share ke WA";
    }, 1500);
  }
}