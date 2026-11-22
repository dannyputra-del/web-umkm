-- ==============================================================================
-- REVISI MODE 1-2 — POIN 10: SKEMA + TIPE + LAYANAN (MIGRASI)
-- Proyek: web-umkm-danny | Supabase project: DB-web-umkm (hwdgnwngxqttbadvyrox)
-- Tanggal: 22 Nov 2026
-- Sifat: IDEMPOTEN — aman dijalankan ulang (IF NOT EXISTS / DO $$ ... $$).
-- Isi:
--   1. products.stock INTEGER DEFAULT 10
--   2. stores.delivery_fee NUMERIC DEFAULT 10000
--   3. stores.service_fee NUMERIC DEFAULT 2000
--   4. stores.qris_image_url TEXT
--   5. stores.bank_accounts JSONB DEFAULT '[]'::jsonb
--   6. products.rating default diubah dari 5.0 menjadi 0
--   7. orders.status: constraint lama ('cooking','ready','done') diganti
--      menjadi ('pending','cooking','ready','completed','cancelled','rejected')
--      agar sesuai tipe Order di src/types/index.ts
--   8. Stok awal 10 untuk semua produk yang sudah ada (15 produk)
-- CATATAN: delivery_fee 10000 dan service_fee 2000 adalah DEFAULT AWAL yang
-- bisa diubah pemilik toko di dashboard; bank_accounts dan qris_image_url
-- dibiarkan kosong untuk 3 toko yang ada (padang-jaya, kopi-senja,
-- batik-nusantara).
-- ==============================================================================

-- 1. Kolom baru products.stock
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 10;

-- 2. Kolom baru stores.delivery_fee
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC NOT NULL DEFAULT 10000;

-- 3. Kolom baru stores.service_fee
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS service_fee NUMERIC NOT NULL DEFAULT 2000;

-- 4. Kolom baru stores.qris_image_url
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS qris_image_url TEXT;

-- 5. Kolom baru stores.bank_accounts
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS bank_accounts JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 6. Default rating produk: 5.0 -> 0 (produk baru tanpa rating tampil 0, bukan 5.0)
ALTER TABLE public.products
  ALTER COLUMN rating SET DEFAULT 0;

-- 7. Constraint orders.status: ganti agar mengizinkan cancelled / rejected
--    (constraint lama: CHECK (status IN ('cooking','ready','done')))
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_status_check'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
  END IF;
END $$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'cooking', 'ready', 'completed', 'cancelled', 'rejected'));

-- 8. Stok awal 10 untuk produk yang sudah ada (hanya yang stock-nya NULL;
--    kolom baru terisi DEFAULT 10 otomatis, baris ini pengaman bila migrasi
--    dijalankan ulang / kolom sudah ada sebelumnya tanpa nilai).
UPDATE public.products SET stock = 10 WHERE stock IS NULL;

-- 9. Default status pesanan baru: 'pending' (integrasi revisi Mode 1-2, poin 9).
--    Order baru dari page.tsx sudah mengirim status 'pending' eksplisit;
--    default ini pengaman bila ada insert tanpa status.
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending';
