// ====== KONFIGURASI FIREBASE ======
const firebaseConfig = {
  apiKey: "AIzaSyCdhuasWSJN_pcEJRz2hmizxjhjTsTdAYE",
  authDomain: "sistem-bendahara.firebaseapp.com",
  projectId: "sistem-bendahara",
  storageBucket: "sistem-bendahara.firebasestorage.app",
  messagingSenderId: "1005869608029",
  appId: "1:1005869608029:web:eff283a473243da104b1b4"
};

// ====== KONFIGURASI IMGBB ======
const IMGBB_API_KEY = "6947b43c605be95646f5101da2a2ede4";

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const transaksiRef = db.collection("transaksi");

// ====== STATE ======
let semuaTransaksi = [];

// ====== ELEMEN FORM MANUAL ======
const form = document.getElementById("formTransaksi");
const editId = document.getElementById("editId");
const formTitle = document.getElementById("formTitle");
const tanggal = document.getElementById("tanggal");
const jenis = document.getElementById("jenis");
const kategori = document.getElementById("kategori");
const jumlah = document.getElementById("jumlah");
const keterangan = document.getElementById("keterangan");
const btnSubmit = document.getElementById("btnSubmit");
const btnCancelEdit = document.getElementById("btnCancelEdit");
const tbody = document.getElementById("tbodyTransaksi");

const totalMasukEl = document.getElementById("totalMasuk");
const totalKeluarEl = document.getElementById("totalKeluar");
const saldoKasEl = document.getElementById("saldoKas");

const filterJenis = document.getElementById("filterJenis");
const filterKategori = document.getElementById("filterKategori");
const filterBulan = document.getElementById("filterBulan");
const btnResetFilter = document.getElementById("btnResetFilter");

tanggal.valueAsDate = new Date();

// ====== ELEMEN NOTA ======
const inputFotoNota = document.getElementById("inputFotoNota");
const btnPilihFoto = document.getElementById("btnPilihFoto");
const notaStatus = document.getElementById("notaStatus");
const notaPreviewWrap = document.getElementById("notaPreviewWrap");
const notaPreview = document.getElementById("notaPreview");
const notaTanggal = document.getElementById("notaTanggal");
const notaKategori = document.getElementById("notaKategori");
const notaItemList = document.getElementById("notaItemList");
const btnTambahItemNota = document.getElementById("btnTambahItemNota");
const btnSimpanNota = document.getElementById("btnSimpanNota");
const btnBatalNota = document.getElementById("btnBatalNota");

let notaUrlAktif = "";
notaTanggal.valueAsDate = new Date();

// ====== FORMAT RUPIAH ======
function formatRupiah(angka) {
  return "Rp " + Number(angka).toLocaleString("id-ID");
}

// ====== AMBIL DATA REALTIME ======
transaksiRef.orderBy("tanggal", "desc").onSnapshot((snapshot) => {
  semuaTransaksi = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderTabel();
  hitungSaldo();
}, (error) => {
  tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Gagal memuat data. Cek konfigurasi Firebase kamu.</td></tr>`;
  console.error(error);
});

// ====== HITUNG SALDO ======
function hitungSaldo() {
  let masuk = 0, keluar = 0;
  semuaTransaksi.forEach(t => {
    if (t.jenis === "masuk") masuk += t.jumlah;
    else keluar += t.jumlah;
  });
  totalMasukEl.textContent = formatRupiah(masuk);
  totalKeluarEl.textContent = formatRupiah(keluar);
  saldoKasEl.textContent = formatRupiah(masuk - keluar);
}

// ====== FILTER ======
function ambilDataTerfilter() {
  return semuaTransaksi.filter(t => {
    if (filterJenis.value && t.jenis !== filterJenis.value) return false;
    if (filterKategori.value && t.kategori !== filterKategori.value) return false;
    if (filterBulan.value && !t.tanggal.startsWith(filterBulan.value)) return false;
    return true;
  });
}

[filterJenis, filterKategori, filterBulan].forEach(el =>
  el.addEventListener("change", renderTabel)
);

btnResetFilter.addEventListener("click", () => {
  filterJenis.value = "";
  filterKategori.value = "";
  filterBulan.value = "";
  renderTabel();
});

// ====== RENDER TABEL ======
function renderTabel() {
  const data = ambilDataTerfilter();

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Belum ada transaksi</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(t => `
    <tr>
      <td>${formatTanggalTampil(t.tanggal)}</td>
      <td class="jenis-${t.jenis}">${t.jenis === "masuk" ? "Pemasukan" : "Pengeluaran"}</td>
      <td>${t.kategori}</td>
      <td>${t.keterangan}</td>
      <td>${formatRupiah(t.jumlah)}</td>
      <td>${t.notaUrl ? `<a class="nota-link" href="${t.notaUrl}" target="_blank">Lihat</a>` : "-"}</td>
      <td>
        <button class="aksi-btn btn-edit" onclick="editTransaksi('${t.id}')">Edit</button>
        <button class="aksi-btn btn-delete" onclick="hapusTransaksi('${t.id}')">Hapus</button>
      </td>
    </tr>
  `).join("");
}

function formatTanggalTampil(tglStr) {
  const [y, m, d] = tglStr.split("-");
  return `${d}/${m}/${y}`;
}

// ====== SUBMIT FORM MANUAL (TAMBAH / EDIT) ======
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    tanggal: tanggal.value,
    jenis: jenis.value,
    kategori: kategori.value,
    jumlah: Number(jumlah.value),
    keterangan: keterangan.value.trim()
  };

  btnSubmit.disabled = true;

  try {
    if (editId.value) {
      await transaksiRef.doc(editId.value).update(data);
      batalEdit();
    } else {
      await transaksiRef.add(data);
      form.reset();
      tanggal.valueAsDate = new Date();
    }
  } catch (err) {
    alert("Gagal menyimpan transaksi.");
    console.error(err);
  } finally {
    btnSubmit.disabled = false;
  }
});

// ====== EDIT ======
window.editTransaksi = function (id) {
  const t = semuaTransaksi.find(x => x.id === id);
  if (!t) return;

  editId.value = t.id;
  tanggal.value = t.tanggal;
  jenis.value = t.jenis;
  kategori.value = t.kategori;
  jumlah.value = t.jumlah;
  keterangan.value = t.keterangan;

  formTitle.textContent = "Edit Transaksi";
  btnSubmit.textContent = "Simpan Perubahan";
  btnCancelEdit.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth" });
};

btnCancelEdit.addEventListener("click", batalEdit);

function batalEdit() {
  editId.value = "";
  form.reset();
  tanggal.valueAsDate = new Date();
  formTitle.textContent = "Tambah Transaksi Manual";
  btnSubmit.textContent = "Tambah Transaksi";
  btnCancelEdit.classList.add("hidden");
}

// ====== HAPUS ======
window.hapusTransaksi = async function (id) {
  if (!confirm("Hapus transaksi ini?")) return;
  try {
    await transaksiRef.doc(id).delete();
  } catch (err) {
    alert("Gagal menghapus.");
    console.error(err);
  }
};

// ====== UPLOAD FOTO NOTA (ImgBB) + OCR (Tesseract.js) ======
btnPilihFoto.addEventListener("click", () => inputFotoNota.click());

inputFotoNota.addEventListener("change", async () => {
  const file = inputFotoNota.files[0];
  if (!file) return;

  notaItemList.innerHTML = "";
  notaPreviewWrap.classList.remove("hidden");
  notaPreview.src = URL.createObjectURL(file);

  notaStatus.textContent = "Mengupload & membaca nota...";

  try {
    const [uploadResult, ocrResult] = await Promise.all([
      uploadKeImgBB(file),
      bacaTeksNota(file)
    ]);

    notaUrlAktif = uploadResult;
    notaPreview.src = notaUrlAktif;

    const items = parseTeksNota(ocrResult);

    if (items.length === 0) {
      notaStatus.textContent = "✓ Terupload (nota tidak terbaca otomatis, isi manual)";
      tambahBarisItemNota();
    } else {
      notaStatus.textContent = `✓ Terupload — ${items.length} barang terdeteksi, cek dulu ya`;
      items.forEach(item => tambahBarisItemNota(item.nama, item.harga));
    }
  } catch (err) {
    notaStatus.textContent = "Gagal upload/baca nota";
    console.error(err);
    tambahBarisItemNota();
  }
});

async function uploadKeImgBB(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData
  });
  const data = await res.json();
  if (!data.success) throw new Error("Upload ImgBB gagal");
  return data.data.url;
}

async function bacaTeksNota(file) {
  const { data: { text } } = await Tesseract.recognize(file, "ind+eng");
  return text;
}

function parseTeksNota(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const hasil = [];
  const hargaRegex = /(?:rp\.?\s?)?(\d{1,3}(?:[.,]\d{3})+|\d{4,})\s*$/i;
  const skipKeywords = [
    "total", "subtotal", "tunai", "kembali", "bayar", "pajak", "ppn",
    "diskon", "cash", "change", "no.", "tanggal", "kasir", "struk",
    "terima kasih", "npwp", "telp", "jl.", "alamat"
  ];

  lines.forEach(line => {
    const lower = line.toLowerCase();
    if (skipKeywords.some(k => lower.includes(k))) return;

    const match = line.match(hargaRegex);
    if (match) {
      const hargaStr = match[1].replace(/[.,]/g, "");
      const harga = parseInt(hargaStr, 10);
      const nama = line.slice(0, match.index).replace(/rp\.?$/i, "").trim();

      if (nama && nama.length > 1 && harga >= 100) {
        hasil.push({ nama, harga });
      }
    }
  });

  return hasil;
}

function tambahBarisItemNota(namaAwal = "", hargaAwal = "") {
  const row = document.createElement("div");
  row.className = "nota-item-row";
  row.innerHTML = `
    <input type="text" class="nota-nama-barang" placeholder="Nama barang" value="${namaAwal.replace(/"/g, "&quot;")}">
    <input type="number" class="nota-jumlah-barang" placeholder="Harga (Rp)" min="0" value="${hargaAwal}">
    <button type="button" class="btn-remove-item">✕</button>
  `;
  row.querySelector(".btn-remove-item").addEventListener("click", () => row.remove());
  notaItemList.appendChild(row);
}

btnTambahItemNota.addEventListener("click", () => tambahBarisItemNota());

btnBatalNota.addEventListener("click", () => {
  notaPreviewWrap.classList.add("hidden");
  notaUrlAktif = "";
  inputFotoNota.value = "";
  notaStatus.textContent = "";
  notaItemList.innerHTML = "";
});

btnSimpanNota.addEventListener("click", async () => {
  const baris = notaItemList.querySelectorAll(".nota-item-row");
  const items = [];

  baris.forEach(row => {
    const nama = row.querySelector(".nota-nama-barang").value.trim();
    const harga = Number(row.querySelector(".nota-jumlah-barang").value);
    if (nama && harga > 0) items.push({ nama, harga });
  });

  if (items.length === 0) {
    alert("Isi minimal satu barang dengan nama dan harga.");
    return;
  }

  btnSimpanNota.disabled = true;
  btnSimpanNota.textContent = "Menyimpan...";

  try {
    const batch = db.batch();
    items.forEach(item => {
      const docRef = transaksiRef.doc();
      batch.set(docRef, {
        tanggal: notaTanggal.value,
        jenis: "keluar",
        kategori: notaKategori.value,
        jumlah: item.harga,
        keterangan: item.nama,
        notaUrl: notaUrlAktif
      });
    });
    await batch.commit();

    notaPreviewWrap.classList.add("hidden");
    notaUrlAktif = "";
    inputFotoNota.value = "";
    notaStatus.textContent = "";
    notaItemList.innerHTML = "";
  } catch (err) {
    alert("Gagal menyimpan. Coba lagi.");
    console.error(err);
  } finally {
    btnSimpanNota.disabled = false;
    btnSimpanNota.textContent = "Simpan Semua Barang";
  }
});

// ====== EXPORT EXCEL ======
document.getElementById("btnExportExcel").addEventListener("click", () => {
  const data = ambilDataTerfilter().map(t => ({
    Tanggal: formatTanggalTampil(t.tanggal),
    Jenis: t.jenis === "masuk" ? "Pemasukan" : "Pengeluaran",
    Kategori: t.kategori,
    Keterangan: t.keterangan,
    Jumlah: t.jumlah
  }));

  if (data.length === 0) {
    alert("Tidak ada data untuk diexport.");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Riwayat Kas");
  XLSX.writeFile(wb, `Laporan_Kas_${new Date().toISOString().slice(0, 10)}.xlsx`);
});

// ====== EXPORT PDF ======
document.getElementById("btnExportPdf").addEventListener("click", () => {
  const data = ambilDataTerfilter();

  if (data.length === 0) {
    alert("Tidak ada data untuk diexport.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Laporan Kas Bendahara", 105, 15, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID")}`, 105, 21, { align: "center" });

  const rows = data.map(t => [
    formatTanggalTampil(t.tanggal),
    t.jenis === "masuk" ? "Pemasukan" : "Pengeluaran",
    t.kategori,
    t.keterangan,
    formatRupiah(t.jumlah)
  ]);

  doc.autoTable({
    startY: 28,
    head: [["Tanggal", "Jenis", "Kategori", "Keterangan", "Jumlah"]],
    body: rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 58, 95] }
  });

  let masuk = 0, keluar = 0;
  data.forEach(t => t.jenis === "masuk" ? masuk += t.jumlah : keluar += t.jumlah);

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.text(`Total Pemasukan: ${formatRupiah(masuk)}`, 14, finalY);
  doc.text(`Total Pengeluaran: ${formatRupiah(keluar)}`, 14, finalY + 6);
  doc.setFont(undefined, "bold");
  doc.text(`Saldo Kas: ${formatRupiah(masuk - keluar)}`, 14, finalY + 14);

  doc.save(`Laporan_Kas_${new Date().toISOString().slice(0, 10)}.pdf`);
});
