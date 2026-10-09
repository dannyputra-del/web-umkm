# 📋 DOKUMEN HANDOVER & ROADMAP PENGEMBANGAN: WEB UMKM E-COMMERCE PLATFORM

> **Tanggal Arsip:** 09 Oktober 2026  
> **Status Sistem:** Live & Beroperasi  
> **Hosting Live:** [Cloudflare Pages (https://web-umkm-1o1.pages.dev)](https://web-umkm-1o1.pages.dev)  
> **Database:** [Supabase PostgreSQL (hwdgnwngxqttbadvyrox)](https://hwdgnwngxqttbadvyrox.supabase.co)  
> **Repository:** [GitHub (dannyputra-del/web-umkm)](https://github.com/dannyputra-del/web-umkm)  

---

## 📌 1. STATUS PENCAPAIAN PROYEK SAAT INI (SUDAH SELESAI)

### A. Frontend & Pengalaman Pengguna (Customer Experience)
1. **Etalase Menu & Katalog Produk Interaktif**:
   - Pencarian menu instan, filter kategori (Makanan, Kopi, Camilan, dll).
   - Tampilan bersih, responsif HP, dengan tema warna dinamis yang menyesuaikan identitas toko masing-masing.
2. **Alur Checkout Ramah UMKM**:
   - Opsi pengambilan fleksibel: **Ambil Sendiri di Toko** (Self-Pickup) atau **Pesan Antar**.
   - Input alamat jemput dan titik **Google Maps** interaktif.
   - Pilihan metode bayar: **QRIS**, **Transfer Bank**, atau **Tunai di Tempat**.
   - Notifikasi & ringkasan pesanan otomatis terhubung ke WhatsApp penjual.
3. **Perlindungan Reputasi Brand Toko (Brand-Safe Deactivation)**:
   - Jika toko dinonaktifkan (karena masa langganan habis atau rehat), pembeli yang membuka URL **tidak akan melihat banner negatif/sanksi**.
   - Ditampilkan pesan persuasif: *"Layanan Sedang Rehat Sementara untuk Peningkatan Kualitas"* dilengkapi tombol kontak langsung WhatsApp pemilik toko dan rute Google Maps fisik.

### B. Dashboard Pengelolaan (Mitra & Super Admin)
1. **Dashboard Pemilik Toko (Merchant)**:
   - Kelola informasi toko (nama, tagline, jam operasional, warna latar, Google Maps URL).
   - Tambah, edit, hapus, dan atur ketersediaan menu makanan/minuman secara instan.
   - Pantau pesanan masuk secara langsung.
2. **Dashboard Super Admin Platform (Pemilik Platform)**:
   - Kelola seluruh mitra UMKM yang mendaftar.
   - Tombol tindakan status cepat: **Konfirmasi Pendaftaran Baru**, **Nonaktifkan Toko**, dan **Aktifkan Kembali**.
   - Ringkasan paket langganan dan catatan internal admin.

### C. Infrastruktur & Database Cloud
1. **Database Supabase Live**:
   - Skema tabel `merchants`, `stores`, `products`, dan `orders` aktif di cloud dengan Row Level Security (RLS).
   - Data tersinkronisasi otomatis antar perangkat (pendaftaran toko baru dan pesanan dari HP manapun langsung masuk ke server).
   - Fallback offline aman via `localStorage`.
2. **Hosting Cloudflare Pages**:
   - Terhubung via Cloudflare MCP & API Token.
   - Kecepatan akses ultra-cepat dengan CDN edge global.

---

## 🚀 2. ROADMAP / RESUME UPDATE BERIKUTNYA (SETELAH REVIEW)

Berikut daftar fitur yang disepakati untuk dikembangkan pada tahap selanjutnya:

### 🎯 Update 1: Halaman Marketing & Penjualan Platform (Landing Page Sales)
* **Tujuan:** Menjadi pintu masuk utama saat pengunjung mengakses domain utama (tanpa parameter `?store=...`).
* **Komponen:**
  1. **Navbar Platform**: Logo brand platform, menu fitur, cara kerja, paket harga, contoh demo toko, tombol Login & Daftar.
  2. **Hero Section Persuasif**: Copywriting penjualan *"Bikin Web Toko Online Sendiri Cuma 2 Menit. Langsung Terima Order via WhatsApp Tanpa Potongan Komisi!"*.
  3. **Value Proposition Grid**: 0% komisi, order rapi ke WhatsApp, integrasi Google Maps, kelola 100% dari HP.
  4. **Showcase Demo Toko Interaktif**: Pengunjung bisa langsung mencoba etalase Rumah Makan Padang Jaya, Kopi Senja, dll.
  5. **Tabel Paket Harga / Langganan**: Paket Starter Gratis, Paket Pro UMKM, Paket Enterprise.
  6. **FAQ & Footer Standar Profesional**: Syarat ketentuan, kebijakan privasi, dan kontak WhatsApp CS.

### 🔐 Update 2: Sistem Autentikasi Nyata (Real Auth & PIN 6 Digit)
* **Tujuan:** Mengganti "Toolbar Demo" menjadi alur login/keamanan nyata.
* **Mekanisme PIN & Pemulihan:**
  1. **Sembunyikan Toolbar Demo:** Pembeli umum hanya melihat etalase toko tanpa tombol dashboard admin.
  2. **Login & Daftar via PIN 6 Digit:** Menggunakan No. WhatsApp + PIN 6 Digit (seperti m-Banking/e-wallet).
  3. **Lupa PIN Tingkat 1 (Mandiri):** Pedagang menjawab Pertanyaan Keamanan Rahasia yang dipilih saat daftar (misal: *"Tahun lahir"*). Jika benar, langsung buat PIN baru.
  4. **Lupa PIN Tingkat 2 (Eskalasi ke WA Admin):** Pedagang klik *"Hubungi Admin via WA"*. Admin memverifikasi bahwa pengirim adalah nomor terdaftar, lalu men-generate PIN acak baru dari Dashboard Super Admin.
  5. **Data Email:** Email disimpan hanya sebagai database kontak (tanpa kirim email otomatis, Rp 0 biaya).

### 🌐 Update 3: Pemasangan Custom Domain di Cloudflare
* **Tujuan:** Menghubungkan domain resmi pribadi (misal: `www.namabrand.com`) ke Cloudflare Pages.
* **Fitur Lanjutan:** Persiapan arsitektur multi-subdomain dinamis (misal: `padangjaya.namabrand.com`).

---

## 💡 PANDUAN MELANJUTKAN DENGAN AGENT AI DI MASA DEPAN
Jika Anda memulai percakapan baru atau berganti agent, Anda cukup:
1. Upload file **`PROJECT_HANDOVER_AND_ROADMAP.md`** ini ke chat.
2. Berikan perintah singkat:  
   *"Halo, tolong baca file handover ini. Kita sudah menyelesaikan Tahap 1, sekarang tolong lanjutkan ke Update [1/2/3] sesuai roadmap."*  
   Agent AI akan langsung memahami 100% konteks proyek tanpa perlu Anda jelaskan dari awal!
