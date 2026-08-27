# 🔔 Bell Sekolah Otomatis

Aplikasi web modern untuk mengatur dan menjalankan bel sekolah secara otomatis berdasarkan jadwal.

## ✨ Fitur Utama

- ✅ **Dashboard profesional** dengan status sistem, waktu, dan jadwal berikutnya
- ✅ **Upload & kelola MP3** dengan drag & drop, preview, rename, hapus
- ✅ **Jadwal otomatis** berdasarkan hari, jam, dan prioritas
- ✅ **Scheduler engine** dengan anti-duplikasi (berbasis tanggal+jam+ID)
- ✅ **Audio activation** untuk bypass browser autoplay restriction
- ✅ **Monitor mode** dengan jam besar, countdown, fullscreen
- ✅ **Template jadwal** untuk diterapkan ke beberapa hari sekaligus
- ✅ **Kalender sekolah** (hari libur + jadwal khusus)
- ✅ **Riwayat bel** dengan log lengkap
- ✅ **Backup & restore** (config saja atau full termasuk MP3)
- ✅ **Import/Export CSV** untuk jadwal
- ✅ **Dark mode** dan **Light mode**
- ✅ **PWA** - dapat dipasang sebagai aplikasi desktop
- ✅ **Offline-first** - semua data di IndexedDB, tidak butuh internet
- ✅ **Responsive** - bekerja di desktop, tablet, mobile

## 🚀 Cara Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Jalankan dev server
npm run dev

# 3. Buka browser
# http://localhost:5173
```

## 📖 Cara Penggunaan

1. **Aktifkan sistem bel** - Klik tombol "AKTIFKAN SISTEM BEL" saat pertama kali dibuka (diperlukan untuk bypass autoplay browser)
2. **Upload MP3** - Buka menu Audio, upload file MP3 bel sekolah
3. **Buat jadwal** - Buka menu Jadwal Bel, tambahkan jadwal dengan hari, jam, dan audio
4. **Biarkan berjalan** - Aplikasi akan otomatis memainkan bel sesuai jadwal
5. **Monitor** - Buka menu Monitor untuk tampilan jam besar di komputer operator

## 🏗 Teknologi

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Dexie.js (IndexedDB wrapper)
- Zustand (state management)
- Lucide React (icons)
- vite-plugin-pwa (PWA)

## 💾 Penyimpanan

Semua data disimpan lokal di browser menggunakan **IndexedDB**:
- File MP3 (sebagai Blob)
- Jadwal bel
- Kalender & hari libur
- Pengaturan
- Riwayat log

## 🔒 Privasi

- Tidak ada data yang dikirim ke server
- Bekerja 100% offline
- Cocok untuk jaringan sekolah tanpa internet

## 📦 Build untuk Produksi

```bash
npm run build
npm run preview
```

File hasil build ada di folder `dist/`. Dapat di-deploy ke:
- Web server statis (nginx, Apache)
- GitHub Pages
- Netlify / Vercel
- USB/lokal (file://) - dengan catatan PWA memerlukan HTTPS

## ⚠️ Catatan Penting

1. **Browser autoplay restriction** - Browser modern memblokir autoplay audio tanpa interaksi user. Tombol "Aktifkan Sistem Bel" diperlukan sekali per sesi.
2. **Komputer sleep** - Jika komputer tidur/hibernate, scheduler tidak dapat menjamin eksekusi bel. Pastikan komputer tetap aktif.
3. **Tab browser** - Jangan tutup tab browser selama jam sekolah.
4. **Backup rutin** - Export backup secara berkala untuk keamanan data.

## 📂 Struktur Project

```
src/
├── components/     # UI components (Layout, Sidebar, Topbar, ui/*)
├── pages/          # Halaman aplikasi
├── services/       # Business logic (audio, scheduler, backup, dll)
├── stores/         # Zustand stores
├── hooks/          # Custom React hooks
├── database/       # Dexie DB setup
├── types/          # TypeScript types
└── utils/          # Helper functions
```

## 🎯 Acceptance Test

- [x] Buat jadwal 1 menit dari sekarang → bel otomatis berbunyi
- [x] Dua jadwal berbeda → keduanya berjalan sesuai waktu
- [x] Reload aplikasi → database tetap tersimpan
- [x] Matikan internet → scheduler tetap berjalan
- [x] Tambah hari libur → bel tidak berbunyi
- [x] Nonaktifkan jadwal → bel tidak dijalankan
- [x] Upload MP3 → dapat diputar
- [x] Hapus MP3 yang dipakai jadwal → warning, tidak error
- [x] Jadwal duplikat → sistem memberi peringatan
- [x] Berjalan 8+ jam → stabil, tidak memory leak

---

Dibuat dengan ❤️ untuk sekolah Indonesia
