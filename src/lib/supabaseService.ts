import { supabase } from './supabase';
import { MerchantAccount, StoreInfo, Product, Order } from '@/types';

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
          description: p.description || '',
          image: p.image || '',
          rating: Number(p.rating) || 5.0,
          salesCount: p.sales_count || 0,
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
      description: product.description,
      image: product.image,
      rating: product.rating,
      sales_count: product.salesCount,
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
      order_type: order.customer.orderType,
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
