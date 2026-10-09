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
  isAvailable: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export type PaymentMethod = 'qris' | 'bank_transfer' | 'cash';

export interface CustomerDetails {
  name: string;
  phone: string;
  orderType: OrderType;
  tableNumber?: string;
  address?: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  items: CartItem[];
  customer: CustomerDetails;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  status: 'pending' | 'cooking' | 'ready' | 'completed';
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
