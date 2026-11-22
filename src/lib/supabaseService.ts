import { supabase } from './supabase';
import { MerchantAccount, StoreInfo, Product, Order, CartItem } from '@/types';

// ==========================================
// 1. MERCHANTS SERVICE
// ==========================================

export async function getMerchantsFromSupabase(): Promise<MerchantAccount[] | null> {
  try {
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Supabase getMerchants error:', error);
      return null;
    }

    return data.map((row) => ({
      id: row.id,
      ownerName: row.owner_name,
      phone: row.phone,
      email: row.email || undefined,
      storeSlug: row.store_slug,
      storeName: row.store_name,
      category: row.category,
      createdAt: row.created_at,
      status: row.status,
      statusReason: row.status_reason,
      subscriptionPlan: row.subscription_plan,
      subscriptionExpiry: row.subscription_expiry,
    }));
  } catch (err) {
    console.warn('Network error fetching merchants:', err);
    return null;
  }
}

export async function upsertMerchantToSupabase(merchant: MerchantAccount): Promise<boolean> {
  try {
    const { error } = await supabase.from('merchants').upsert({
      id: merchant.id,
      owner_name: merchant.ownerName,
      phone: merchant.phone,
      // email disimpan; password JANGAN PERNAH disimpan ke Supabase.
      email: merchant.email || null,
      store_slug: merchant.storeSlug,
      store_name: merchant.storeName,
      category: merchant.category,
      created_at: merchant.createdAt,
      status: merchant.status,
      status_reason: merchant.statusReason,
      subscription_plan: merchant.subscriptionPlan,
      subscription_expiry: merchant.subscriptionExpiry,
    });

    if (error) {
      console.warn('Supabase upsertMerchant error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error saving merchant:', err);
    return false;
  }
}

export async function updateMerchantStatusInSupabase(
  storeSlug: string,
  newStatus: 'active' | 'pending' | 'suspended',
  reason?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('merchants')
      .update({
        status: newStatus,
        status_reason: reason || null,
      })
      .eq('store_slug', storeSlug);

    if (error) {
      console.warn('Supabase update status error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error updating merchant status:', err);
    return false;
  }
}

// ==========================================
// 2. STORES & PRODUCTS SERVICE
// ==========================================

export async function getAllStoresWithProductsFromSupabase(): Promise<Record<
  string,
  { store: StoreInfo; products: Product[] }
> | null> {
  try {
    const [storesRes, prodsRes] = await Promise.all([
      supabase.from('stores').select('*'),
      supabase.from('products').select('*'),
    ]);

    if (storesRes.error || !storesRes.data) {
      return null;
    }

    const productsByStore: Record<string, Product[]> = {};
    if (prodsRes.data) {
      prodsRes.data.forEach((p) => {
        if (!productsByStore[p.store_slug]) {
          productsByStore[p.store_slug] = [];
        }
        productsByStore[p.store_slug].push({
          id: p.id,
          name: p.name,
          category: p.category,
          price: Number(p.price),
          // Kolom baru: badge TEXT, "originalPrice" NUMERIC (camelCase, NULL -> undefined).
          badge: p.badge || undefined,
          originalPrice: p['originalPrice'] != null ? Number(p['originalPrice']) : undefined,
          description: p.description || '',
          image: p.image || '',
          rating: Number(p.rating) || 0,
          salesCount: p.sales_count ?? 0,
          stock: Number(p.stock ?? 10),
          isAvailable: p.is_available ?? true,
        });
      });
    }

    const result: Record<string, { store: StoreInfo; products: Product[] }> = {};
    storesRes.data.forEach((s) => {
      result[s.slug] = {
        store: {
          slug: s.slug,
          name: s.name,
          tagline: s.tagline || '',
          description: s.description || '',
          category: s.category,
          address: s.address || '',
          googleMapsUrl: s.google_maps_url || '',
          phone: s.phone || '',
          whatsapp: s.whatsapp || '',
          isOpen: s.is_open ?? true,
          openingHours: s.opening_hours || '08:00 - 21:00 WIB',
          logo: s.logo || '',
          banner: s.banner || '',
          backgroundColor: s.background_color || '#ffffff',
          ownerName: s.owner_name || '',
          // Kolom baru: delivery_fee / service_fee (default awal 10000 / 2000,
          // bisa diubah pemilik di dashboard), qris_image_url, bank_accounts.
          deliveryFee: Number(s.delivery_fee ?? 10000),
          serviceFee: Number(s.service_fee ?? 2000),
          qrisImageUrl: s.qris_image_url || undefined,
          bankAccounts: Array.isArray(s.bank_accounts) ? s.bank_accounts : [],
        },
        products: productsByStore[s.slug] || [],
      };
    });

    return result;
  } catch (err) {
    console.warn('Network error loading stores from Supabase:', err);
    return null;
  }
}

export async function upsertStoreToSupabase(store: StoreInfo): Promise<boolean> {
  try {
    const { error } = await supabase.from('stores').upsert({
      slug: store.slug,
      name: store.name,
      tagline: store.tagline,
      description: store.description,
      category: store.category,
      address: store.address,
      google_maps_url: store.googleMapsUrl,
      phone: store.phone,
      whatsapp: store.whatsapp,
      is_open: store.isOpen,
      opening_hours: store.openingHours,
      logo: store.logo,
      banner: store.banner,
      background_color: store.backgroundColor,
      owner_name: store.ownerName,
      delivery_fee: store.deliveryFee ?? 10000,
      service_fee: store.serviceFee ?? 2000,
      qris_image_url: store.qrisImageUrl ?? null,
      bank_accounts: store.bankAccounts ?? [],
    });

    if (error) {
      console.warn('Supabase upsertStore error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error saving store:', err);
    return false;
  }
}

export async function upsertProductToSupabase(product: Product, storeSlug: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('products').upsert({
      id: product.id,
      store_slug: storeSlug,
      name: product.name,
      category: product.category,
      price: product.price,
      // Kolom baru: badge TEXT, "originalPrice" NUMERIC (camelCase); undefined dikirim sebagai null.
      badge: product.badge ?? null,
      originalPrice: product.originalPrice ?? null,
      description: product.description,
      image: product.image,
      rating: product.rating,
      sales_count: product.salesCount,
      stock: product.stock ?? 10,
      is_available: product.isAvailable,
    });

    if (error) {
      console.warn('Supabase upsertProduct error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error saving product:', err);
    return false;
  }
}

export async function deleteProductFromSupabase(productId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    return !error;
  } catch (err) {
    console.warn('Network error deleting product:', err);
    return false;
  }
}

// ==========================================
// 3. ORDERS SERVICE
// ==========================================

export async function createOrderInSupabase(order: Order, storeSlug: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('orders').insert({
      id: order.id,
      store_slug: storeSlug,
      order_number: order.orderNumber,
      created_at: order.createdAt,
      customer_name: order.customer.name,
      customer_phone: order.customer.phone,
      // order_type: kolom DB NOT NULL DEFAULT 'dine_in' (tanpa migrasi).
      // Pembeli tidak lagi memilih tipe — bila order baru tidak membawa
      // orderType, kirim default 'dine_in' HANYA untuk kompatibilitas DB,
      // bukan tipe yang dipilih pembeli; tidak tampil di UI maupun WA.
      order_type: order.customer.orderType ?? 'dine_in',
      table_number: order.customer.tableNumber || null,
      address: order.customer.address || null,
      notes: order.customer.notes || null,
      payment_method: order.paymentMethod,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee,
      service_fee: order.serviceFee,
      total: order.total,
      status: order.status,
      items: order.items,
    });

    if (error) {
      console.warn('Supabase createOrder error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error creating order:', err);
    return false;
  }
}

export async function getOrdersFromSupabase(storeSlug?: string): Promise<Order[] | null> {
  try {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (storeSlug) {
      query = query.eq('store_slug', storeSlug);
    }
    const { data, error } = await query;

    if (error || !data) {
      console.warn('Supabase getOrders error:', error);
      return null;
    }

    return data.map((row) => ({
      id: row.id,
      orderNumber: row.order_number,
      // created_at disimpan sebagai TEXT berisi ISO lengkap.
      createdAt: row.created_at,
      items: Array.isArray(row.items) ? (row.items as CartItem[]) : [],
      customer: {
        name: row.customer_name,
        phone: row.customer_phone,
        orderType: row.order_type,
        tableNumber: row.table_number || undefined,
        address: row.address || undefined,
        notes: row.notes || undefined,
      },
      paymentMethod: row.payment_method,
      subtotal: Number(row.subtotal ?? 0),
      deliveryFee: Number(row.delivery_fee ?? 0),
      serviceFee: Number(row.service_fee ?? 0),
      total: Number(row.total ?? 0),
      status: row.status,
    }));
  } catch (err) {
    console.warn('Network error fetching orders:', err);
    return null;
  }
}

export async function updateOrderStatusInSupabase(
  orderId: string,
  status: Order['status']
): Promise<boolean> {
  try {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);

    if (error) {
      console.warn('Supabase updateOrderStatus error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error updating order status:', err);
    return false;
  }
}
