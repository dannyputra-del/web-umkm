export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  badge?: string;
  rating: number;
  salesCount: number;
  stock?: number;
  isAvailable: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export type PaymentMethod = 'qris' | 'bank_transfer' | 'cash' | 'whatsapp';

export interface CustomerDetails {
  name: string;
  phone: string;
  // orderType OPSIONAL, hanya kompatibilitas model/DB lama — pembeli
  // tidak lagi memilih tipe pesanan di UI dan tipe tidak dikirim ke WA.
  // Kolom DB order_type tetap NOT NULL DEFAULT 'dine_in' (tanpa migrasi);
  // bila tidak dikirim, supabaseService mengisi default itu.
  orderType?: OrderType;
  tableNumber?: string;
  address?: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  // Label toko pemilik pesanan (slug). OPSIONAL supaya pesanan lama yang
  // tersimpan tanpa label tetap bisa dibaca — tapi pesanan tanpa label
  // TIDAK ditampilkan di dashboard toko mana pun (tidak bisa dibuktikan
  // tokonya, dan menampilkannya berisiko bocor ke toko lain). Sumber benar
  // adalah Supabase yang selalu membawa store_slug.
  storeSlug?: string;
  createdAt: string; // HARUS ISO lengkap, mis. new Date().toISOString() — pembuat order di page.tsx wajib kirim ISO.
  items: CartItem[];
  customer: CustomerDetails;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  status: 'pending' | 'cooking' | 'ready' | 'completed' | 'cancelled' | 'rejected';
}

export interface StoreInfo {
  name: string;
  tagline: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  whatsapp: string;
  isOpen: boolean;
  openingHours: string;
  logo: string;
  banner: string;
  backgroundColor?: string;
  googleMapsUrl?: string;
  deliveryFee?: number;
  serviceFee?: number;
  qrisImageUrl?: string;
  bankAccounts?: { bank: string; account: string; holder: string }[];
  slug: string;
  ownerName?: string;
}

export interface MerchantAccount {
  id: string;
  ownerName: string;
  phone: string;
  email?: string;
  password?: string;
  storeSlug: string;
  storeName: string;
  category: string;
  createdAt: string;
  status: 'active' | 'pending' | 'suspended';
  statusReason?: string;
  subscriptionPlan?: string;
  subscriptionExpiry?: string;
}
