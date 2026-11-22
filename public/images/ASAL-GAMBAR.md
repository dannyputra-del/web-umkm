# Asal Gambar — public/images/

Semua gambar di folder ini diunduh dari Unsplash pada 22 Nov 2026 (pekerja revisi Poin 11).
Semua URL asli berhasil diunduh pada percobaan pertama (HTTP 200, ukuran > 5 KB,
terverifikasi JPEG lewat perintah `file`). Tidak ada URL yang gagal, tidak ada foto
pengganti.

Catatan: foto `padang-banner.jpg` dan `prod-1-rendang.jpg` berasal dari foto Unsplash
yang sama (`photo-1544025162-d76694265947`), hanya ukuran unduhannya berbeda
(w=1200 untuk banner, w=600 untuk produk) — sesuai URL asli di mockData.ts.

## Toko Padang Jaya (slug: padang-jaya)

| File lokal | URL Unsplash asal |
|---|---|
| padang-logo.jpg | https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80 |
| padang-banner.jpg | https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80 |

## Produk Padang (prod-1 s.d. prod-12)

| File lokal | Produk | URL Unsplash asal |
|---|---|---|
| prod-1-rendang.jpg | Rendang Daging Sapi Sumpur | https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80 |
| prod-2-ayam-pop.jpg | Ayam Pop Gurih Asli Minang | https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80 |
| prod-3-gulai-tunjang.jpg | Gulai Tunjang / Kikil Lembut | https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80 |
| prod-4-dendeng-batokok.jpg | Dendeng Batokok Balado Merah | https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80 |
| prod-5-gulai-kepala-ikan.jpg | Gulai Kepala Ikan Kakap Merah | https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80 |
| prod-6-telur-dadar.jpg | Telur Dadar Tebal Padang | https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80 |
| prod-7-nasi-rames-rendang.jpg | Paket Nasi Rames Rendang Komplit | https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80 |
| prod-8-nasi-ayam-bakar.jpg | Paket Nasi Ayam Bakar Padang | https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80 |
| prod-9-es-teh-manis.jpg | Es Teh Manis Segar Jumbo | https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80 |
| prod-10-es-jeruk.jpg | Es Jeruk Peras Murni | https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80 |
| prod-11-jus-alpukat.jpg | Jus Alpukat Kental Cokelat | https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80 |
| prod-12-peyek-udang.jpg | Peyek Udang Renyah Gurih (Porsi) | https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80 |

## Toko Kopi Senja (slug: kopi-senja)

| File lokal | URL Unsplash asal |
|---|---|
| kopi-logo.jpg | https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80 |
| kopi-banner.jpg | https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80 |
| kopi-1-kopi-susu-aren.jpg | https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80 |
| kopi-2-butter-croissant.jpg | https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80 |

## Toko Batik Nusantara (slug: batik-nusantara)

| File lokal | URL Unsplash asal |
|---|---|
| batik-logo.jpg | https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=300&q=80 |
| batik-banner.jpg | https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80 |
| batik-1-kemeja-batik.jpg | https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80 |

**Catatan batik-1:** file `batik-1-kemeja-batik.jpg` sudah lokal dan path-nya sudah
diperbarui di mockData.ts maupun Supabase, tetapi produk ini baru terlihat di web
sesudah merchant `batik-nusantara` berstatus **active** (saat ini masih `pending`,
menunggu verifikasi pendaftaran akun baru).

## Placeholder netral

| File lokal | URL Unsplash asal |
|---|---|
| placeholder.jpg | https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80 |

`placeholder.jpg` adalah foto makanan generik netral (piring makanan) untuk menu
tanpa foto. Foto mangkuk salad `photo-1546069901-ba9599a7e63c` TIDAK lagi dipakai
sebagai placeholder default — foto itu kini hanya menjadi gambar produk
`prod-7-nasi-rames-rendang.jpg` (sesuai asalnya).

**Sisa di luar lingkup Poin 11:** fallback gambar default foto salad yang sama
masih tertulis di file kode lain (`AuthView.tsx`, `SuperAdminDashboard.tsx`,
`AdminDashboard.tsx`) — file-file itu di luar tugas ini dan tidak diubah.
Perlu tugas terpisah bila fallback tersebut juga mau diganti ke
`/images/placeholder.jpg`.
