-- ==============================================================================
-- SKEMA DATABASE SUPABASE UNTUK PLATFORM E-COMMERCE UMKM
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> Klik "Run"
-- ==============================================================================

-- 1. TABEL MITRA UMKM (MERCHANTS)
CREATE TABLE IF NOT EXISTS public.merchants (
  id TEXT PRIMARY KEY,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  store_slug TEXT UNIQUE NOT NULL,
  store_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Kuliner & Makanan Basah',
  created_at DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  status_reason TEXT,
  subscription_plan TEXT DEFAULT 'Paket Standar UMKM',
  subscription_expiry TEXT
);

-- 2. TABEL PROFIL TOKO (STORES)
CREATE TABLE IF NOT EXISTS public.stores (
  slug TEXT PRIMARY KEY REFERENCES public.merchants(store_slug) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  category TEXT NOT NULL,
  address TEXT,
  google_maps_url TEXT,
  phone TEXT,
  whatsapp TEXT,
  is_open BOOLEAN DEFAULT true,
  opening_hours TEXT DEFAULT '08:00 - 21:00 WIB',
  logo TEXT,
  banner TEXT,
  background_color TEXT DEFAULT '#ffffff',
  owner_name TEXT
);

-- 3. TABEL PRODUK & MENU TOKO (PRODUCTS)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  store_slug TEXT NOT NULL REFERENCES public.stores(slug) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  image TEXT,
  rating NUMERIC DEFAULT 5.0,
  sales_count INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true
);

-- 4. TABEL PESANAN PELANGGAN (ORDERS)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  store_slug TEXT NOT NULL REFERENCES public.stores(slug) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  created_at TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'dine_in',
  table_number TEXT,
  address TEXT,
  notes TEXT,
  payment_method TEXT NOT NULL DEFAULT 'qris',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  service_fee NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'cooking' CHECK (status IN ('cooking', 'ready', 'done')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- AKTIFKAN ROW LEVEL SECURITY (RLS) DENGAN AKSES BACA & TULIS PUBLIK (UNTUK PROTOTYPE WEB)
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read merchants" ON public.merchants FOR SELECT USING (true);
CREATE POLICY "Allow public insert merchants" ON public.merchants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update merchants" ON public.merchants FOR UPDATE USING (true);
CREATE POLICY "Allow public delete merchants" ON public.merchants FOR DELETE USING (true);

CREATE POLICY "Allow public read stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Allow public insert stores" ON public.stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update stores" ON public.stores FOR UPDATE USING (true);
CREATE POLICY "Allow public delete stores" ON public.stores FOR DELETE USING (true);

CREATE POLICY "Allow public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Allow public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete orders" ON public.orders FOR DELETE USING (true);

-- SEED DATA AWAL TOKO PRESET
INSERT INTO public.merchants (id, owner_name, phone, store_slug, store_name, category, created_at, status, subscription_plan, subscription_expiry)
VALUES
  ('merch-1', 'Bundo Siti', '081234567890', 'padang-jaya', 'Rumah Makan Padang Jaya', 'Kuliner & Makanan Basah', '2026-03-01', 'active', 'Paket Pro UMKM', '31 Des 2026'),
  ('merch-2', 'Bagus Prasetyo', '085712345678', 'kopi-senja', 'Kopi Senja Nusantara', 'Kedai Kopi & Minuman Kekinian', '2026-03-10', 'active', 'Paket Starter', '15 Nov 2026'),
  ('merch-3', 'Ibu Retno', '081398765432', 'batik-nusantara', 'Batik & Tenun Lestari', 'Fashion, Busana & Aksesoris', '2026-03-25', 'active', 'Paket Enterprise', '01 Jan 2027')
ON CONFLICT (store_slug) DO NOTHING;

INSERT INTO public.stores (slug, name, tagline, description, category, address, google_maps_url, phone, whatsapp, is_open, opening_hours, logo, banner, background_color, owner_name)
VALUES
  (
    'padang-jaya',
    'Rumah Makan Padang Jaya',
    'Cita Rasa Minang Asli & Rendang Warisan Nenek Moyang',
    'Menyajikan aneka masakan khas Padang dengan racikan rempah pilihan dan santan murni berkualitas tinggi.',
    'Kuliner & Makanan Basah',
    'Jl. Malioboro No. 45, Danurejan, Kota Yogyakarta',
    'https://maps.google.com/?q=Jl.+Malioboro+No.+45+Yogyakarta',
    '081234567890',
    '6281234567890',
    true,
    '09:00 - 22:00 WIB',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    '#fffbeb',
    'Bundo Siti'
  ),
  (
    'kopi-senja',
    'Kopi Senja Nusantara',
    'Seduhan Biji Kopi Asli Petani Lokal Indonesia',
    'Kedai kopi artisan yang mengutamakan biji kopi arabika & robusta pilihan dari berbagai pelosok nusantara.',
    'Kedai Kopi & Minuman Kekinian',
    'Jl. Kaliurang KM 5.2, Sleman, DI Yogyakarta',
    'https://maps.google.com/?q=Jl.+Kaliurang+KM+5+Sleman',
    '085712345678',
    '6285712345678',
    true,
    '08:00 - 23:00 WIB',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    '#f8fafc',
    'Bagus Prasetyo'
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, store_slug, name, category, price, description, image, rating, sales_count, is_available)
VALUES
  ('prod-1', 'padang-jaya', 'Rendang Daging Sapi Spesial', 'Lauk Utama', 28000, 'Daging sapi empuk dimasak perlahan 8 jam dengan bumbu rempah kelapa sangrai kaya cita rasa.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 4.9, 142, true),
  ('prod-2', 'padang-jaya', 'Ayam Pop Sambal Merah', 'Lauk Utama', 22000, 'Ayam kampung gurih dimasak air kelapa, disajikan dengan sambal tomat khas Bukittinggi.', 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80', 4.8, 98, true),
  ('prod-3', 'padang-jaya', 'Gulai Tunjang Kikil Lembut', 'Lauk Utama', 26000, 'Kikil sapi empuk kenyal dengan kuah gulai kental beraroma kunyit dan kapulaga.', 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80', 4.9, 76, true),
  ('prod-4', 'padang-jaya', 'Es Teh Tarik Rempah', 'Minuman', 8000, 'Teh seduh wangi dipadukan susu kental manis dan buih lembut dingin.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80', 4.7, 210, true),
  ('prod-5', 'kopi-senja', 'Kopi Susu Gula Aren Asli', 'Minuman', 18000, 'Espresso arabika blend dengan susu segar dan sirup gula aren organik premium.', 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80', 4.9, 320, true),
  ('prod-6', 'kopi-senja', 'Croissant Almond Panggang', 'Camilan', 24000, 'Pastry renyah berlapis dengan taburan kacang almond panggang dan isian krim lembut.', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80', 4.8, 115, true)
ON CONFLICT (id) DO NOTHING;
