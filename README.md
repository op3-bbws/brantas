# SIPANDU — Prototipe PWA Pelaporan Irigasi (PUPR)

**SIPANDU** (Sistem Informasi Pelaporan & Pemantauan Digital Irigasi) adalah prototipe PWA **HTML/CSS/JavaScript vanilla** (tanpa framework, tanpa build) untuk 3 peran lapangan:

| Peran | Pengguna demo | Peta menampilkan | Fitur utama |
|---|---|---|---|
| **PPA** — Operator Pintu Air | Agus Setiawan | 3 **pintu air** tugasnya (BA.12/13/14) | Laporan operasi pintu, foto progres |
| **Pekarya** — Penjaga Saluran | Budi Hartono | 3 **ruas saluran** tugasnya (warna = kondisi) | Laporan babat/perbaikan, foto progres |
| **Staf Pengamat** | Siti Rahmawati, S.T. | **1 D.I.** lengkap (D.I. Srada) + aset di dalamnya | Dashboard kalender kinerja + rekap kerja tim |

> Data geo (D.I. Srada sekitar Kalasan/Tirtomartani, Sleman), tugas, dan riwayat adalah **data demo** — bukan data resmi. Ganti di `js/data.js`.

---

## Fitur

**Kamera lapangan (fullscreen)**
- Rantai foto progres dalam 1 laporan: **0% (awal) → 50% (selfie pekerjaan) → 100% (hasil)**, setiap foto punya waktu + koordinat sendiri (contoh nyata: 08.00 → 10.00 → 11.00).
- Watermark ala **Timemark**: koordinat GPS ±akurasi, ketinggian, alamat, tanggal-jam besar (WIB), **kompas**, chip laporan, brand PUPR — tercetak permanen di foto (canvas).
- **Auto-rotate landscape/portrait**: layout kontrol & watermark mengikuti orientasi ponsel saat memotret (uji di desktop: ubah ukuran jendela). Ada tombol **kunci orientasi** (jika browser mendukung).
- **Countdown selfie** Off/3/5/10 detik (untuk foto 50% selfwork), **switch kamera depan/belakang**, **lampu kilat** (torch, bila didukung), pratinjau konfirmasi *Ulangi / Gunakan Foto*.

**Dashboard Staf Pengamat**
- **Kalender profesional** (Senin-awal, navigasi bulan, tombol "Hari ini"): titik hijau = laporan lengkap, oranye = sebagian, merah = belum lapor, biru = terjadwal.
- **Klik tanggal** → panel *Tugas & History* (timeline) + *Rekap Kerja* (laporan masuk, foto terkumpul, volume realisasi, petugas belum lapor, bar capaian per kategori).

**Laporan & offline**
- IndexedDB: laporan tersimpan lokal, **antrian offline** + auto-sync saat online (simulasi — nanti diarahkan ke Supabase/GAS sesuai blueprint).
- Validasi: wajib foto 0% & 100%; badge jumlah antrian di tab Riwayat; mode offline demo di Profil.

**Navigasi adaptif**
- **Ponsel**: tab bar bawah gaya iOS, **auto-hide saat scroll ke bawah**.
- **Desktop ≥1900px**: **menu sidebar** biru PUPR di kiri.
- Gaya iOS + warna PUPR (biru tua `#0B3B78`/`#124A93`, jeruk `#F7941D`, kuning `#FFC20E`).

**PWA**
- Manifest + Service Worker: bisa **di-install ke Home Screen** dan **dibuka offline** setelah kunjungan pertama.

---

## Cara upload ke GitHub (GitHub Pages)

1. Buat repository baru di GitHub (mis. `sipandu-pwa`), jangan centang "Add a README".
2. Upload **seluruh isi folder ini** (index.html, css/, js/, icons/, manifest.json, sw.js) ke root repo:
   - Via web: *Add file → Upload files*, atau
   - Via git:
     ```bash
     git init
     git add .
     git commit -m "SIPANDU PWA prototype"
     git branch -M main
     git remote add origin https://github.com/USERNAME/sipandu-pwa.git
     git push -u origin main
     ```
3. Aktifkan Pages: **Settings → Pages → Source: Deploy from a branch → Branch: main / (root) → Save**.
4. Buka `https://USERNAME.github.io/sipandu-pwa/` di HP.
   - Chrome/Android: muncul tawaran **Install app / Tambahkan ke layar utama**.
   - iPhone/Safari: tombol **Bagikan → Tambahkan ke Layar Utama**.
5. Berikan izin **kamera & lokasi** saat diminta (HTTPS GitHub Pages memenuhi syarat kamera/GPS/kompas).

> Jika repo diletakkan di subfolder, semua path sudah relatif (`./`, `manifest.json`, `sw.js`) — tidak perlu diubah.

## Menjalankan lokal (untuk pengujian)

```bash
python3 -m http.server 8080
# buka http://localhost:8080  (localhost dianggap secure origin, kamera jalan)
```
Jangan buka via `file://` — kamera, GPS, dan Service Worker tidak aktif.

## Struktur file

```
sipandu-pwa/
├── index.html          # Kerangka aplikasi + layar login + overlay kamera
├── manifest.json       # Manifest PWA (installable, orientation: any)
├── sw.js               # Service Worker (cache app shell + CDN)
├── css/app.css         # Gaya iOS + PUPR, tab-bar auto-hide, sidebar ≥1900px
└── js/
    ├── data.js         # Data demo: pengguna, tugas, riwayat 90 hari, GeoJSON, geocode demo
    ├── db.js           # IndexedDB (queue/reports) + simulasi sinkronisasi
    ├── ui.js           # Ikon SVG, toast, bottom sheet, komponen kalender
    ├── camera.js       # Kamera fullscreen, watermark Timemark, countdown, switch, auto-rotate
    ├── map.js          # Peta Leaflet per-role (D.I. / pintu air / ruas saluran)
    └── app.js          # Router, shell, beranda, laporan, riwayat, dashboard, profil
```

## Catatan prototipe (untuk pengujian lapangan)

- Sinkronisasi ke Supabase/Sheets **disimulasikan** (`js/db.js` → `Sync.pump`). Sesuai blueprint, ganti isi `pump()` dengan POST ke endpoint Supabase/GAS.
- Foto disimpan sebagai JPEG (hasil kanvas + watermark). Untuk produksi, unggah blob ke object storage dan simpan URL-nya.
- Alamat pada watermark memakai geocode balik demo (`DATA.reverseGeo`); ganti dengan Nominatim/Google saat produksi.
- Kompas memakai sensor perangkat bila tersedia; di desktop dipakai nilai demo yang bergerak halus.
- Ikon aplikasi adalah placeholder buatan (gerbang sorog + gelombang air) — silakan ganti `icons/*` dengan resmi PUPR.
