'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Product, CartItem, CustomerDetails, PaymentMethod, Order, StoreInfo, MerchantAccount } from '@/types';
import { INITIAL_STORE_INFO, INITIAL_MERCHANTS, STORE_PRESETS } from '@/data/mockData';
import { Header } from '@/components/Header';
import { CategoryFilter, SortOption, PriceRangeOption, AvailabilityOption } from '@/components/CategoryFilter';
import { ProductCard } from '@/components/ProductCard';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { CartFloatingBar } from '@/components/CartFloatingBar';
import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { PaymentModal } from '@/components/PaymentModal';
import { OrderSuccessModal } from '@/components/OrderSuccessModal';
import { AdminDashboard } from '@/components/AdminDashboard';
import type { AdminDashboardGuard } from '@/components/AdminDashboard';
import { Toast } from '@/components/Toast';
import type { ToastData } from '@/components/Toast';
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog';
import { AuthView } from '@/components/AuthView';
import { SuperAdminDashboard } from '@/components/SuperAdminDashboard';
import {
  getMerchantsFromSupabase,
  getAllStoresWithProductsFromSupabase,
  getOrdersFromSupabase,
  updateOrderStatusInSupabase,
  upsertMerchantToSupabase,
  upsertStoreToSupabase,
  updateMerchantStatusInSupabase,
  upsertProductToSupabase,
  createOrderInSupabase,
} from '@/lib/supabaseService';

export default function HomePage() {
  // Global States
  const [activeTab, setActiveTab] = useState<'customer' | 'admin' | 'auth' | 'superadmin'>('customer');

  // ---- Popup simpan + peringatan belum disimpan (revisi Mode 2) ----
  type ModeTab = 'customer' | 'admin' | 'auth' | 'superadmin';
  const [toast, setToast] = useState<ToastData | null>(null);
  const showToast = useCallback((kind: 'success' | 'error', message: string) => {
    setToast({ id: Date.now(), kind, message });
  }, []);
  // Guard dari AdminDashboard: cek dirty, simpan, atau buang perubahan.
  const adminGuardRef = useRef<AdminDashboardGuard | null>(null);
  const [adminDirty, setAdminDirty] = useState(false);
  // Mode tujuan yang ditahan sambil menunggu jawaban dialog.
  const [pendingTab, setPendingTab] = useState<ModeTab | null>(null);
  const [savingBeforeNav, setSavingBeforeNav] = useState(false);

  // Semua pindah mode lewat sini. Bila sedang di Dashboard Toko dan ada
  // perubahan belum disimpan, tahan dulu dan tampilkan dialog; bila tidak
  // ada dirty, pindah langsung tanpa dialog.
  const requestTabChange = useCallback(
    (tab: ModeTab) => {
      if (tab === activeTab) return;
      if (activeTab === 'admin' && adminGuardRef.current?.hasUnsavedChanges()) {
        setPendingTab(tab);
        return;
      }
      setActiveTab(tab);
    },
    [activeTab]
  );

  // Dialog "Perubahan belum disimpan": Keluar = buang perubahan, lanjut pindah.
  const handleDialogKeluar = () => {
    const target = pendingTab;
    setPendingTab(null);
    if (!target) return;
    adminGuardRef.current?.discardUnsavedChanges();
    setAdminDirty(false);
    setActiveTab(target);
  };

  // Dialog "Perubahan belum disimpan": Simpan = simpan dulu lewat jalur
  // simpan dashboard yang sama; bila berhasil baru pindah, bila gagal tetap
  // di dashboard (popup error sudah tampil dari fungsi simpan).
  const handleDialogSimpan = async () => {
    if (!pendingTab) return;
    setSavingBeforeNav(true);
    const ok = await adminGuardRef.current?.saveUnsavedChanges();
    setSavingBeforeNav(false);
    if (ok) {
      const target = pendingTab;
      setPendingTab(null);
      setActiveTab(target);
    } else {
      setPendingTab(null);
    }
  };

  // Tutup / reload tab browser saat ada perubahan belum disimpan di dashboard.
  useEffect(() => {
    if (activeTab !== 'admin' || !adminDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [activeTab, adminDirty]);
  // State awal: mock BUKAN sumber utama. merchants/allStores/products mulai kosong
  // dan diisi dari Supabase lewat useEffect di bawah. storeInfo tetap memakai
  // INITIAL_STORE_INFO hanya sebagai placeholder tampilan loading, karena Header
  // dan AdminDashboard mewajibkan prop store bertipe StoreInfo (non-null); nilai ini
  // langsung diganti data Supabase begitu cloud berhasil dimuat, bukan sumber data.
  const [merchants, setMerchants] = useState<MerchantAccount[]>([]);
  const [allStores, setAllStores] = useState<Record<string, { store: StoreInfo; products: Product[] }>>({});
  const [activeStoreSlug, setActiveStoreSlug] = useState<string>('padang-jaya');

  const [storeInfo, setStoreInfo] = useState<StoreInfo>(INITIAL_STORE_INFO);
  const [products, setProducts] = useState<Product[]>([]);
  // Layar tunggu: true sampai Supabase selesai dimuat atau fallback darurat
  // diputuskan. Selama true, tampilkan layar "sedang memuat" saja, bukan
  // placeholder mock (INITIAL_STORE_INFO) — supaya nama/menu contoh tidak
  // sempat berkedip di layar.
  const [isLoading, setIsLoading] = useState(true);
  // Seed ord-init-1 dihapus (E7): orders awal kosong, diisi dari Supabase /
  // localStorage lewat loadOrders di useEffect di bawah.
  const [orders, setOrders] = useState<Order[]>([]);

  // Filtering & Search
  const [activeCategory, setActiveCategory] = useState<string>('Semua Menu');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('best_selling');
  const [priceRange, setPriceRange] = useState<PriceRangeOption>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityOption>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // Slug ?store= yang diminta URL (null bila tidak ada param). Dipakai untuk
  // layar "Toko tidak ditemukan" bila slug tidak ada di allStores.
  const [requestedStoreSlug, setRequestedStoreSlug] = useState<string | null>(null);

  // Urutan baca data (Supabase dulu, localStorage darurat, mock fallback terakhir):
  // LANGKAH 1: fetch Supabase dulu. Bila cloud ada isi, pakai itu sebagai sumber benar
  //   dan simpan ke localStorage sebagai cache.
  // LANGKAH 2: hanya bila Supabase gagal/kosong, baca localStorage sebagai cache darurat.
  // LANGKAH 3: bila Supabase DAN localStorage sama-sama kosong, pakai mock
  //   INITIAL_*/STORE_PRESETS sebagai FALLBACK DARURAT (bukan sumber utama) supaya
  //   halaman tidak kosong total.
  // ?store= dibaca dari URL dan toko target dipilih dari data Supabase, bukan dari mock.
  useEffect(() => {
    // Check query param ?store=
    const params = new URLSearchParams(window.location.search);
    const storeSlugParam = params.get('store');
    setRequestedStoreSlug(storeSlugParam);
    const targetSlug = storeSlugParam || 'padang-jaya';

    // FALLBACK DARURAT: dipakai hanya bila Supabase DAN localStorage sama-sama kosong/gagal.
    // Mock di sini BUKAN sumber utama, hanya supaya halaman tidak kosong total.
    const applyEmergencyMockFallback = () => {
      setMerchants(INITIAL_MERCHANTS);
      setAllStores(STORE_PRESETS);
      if (STORE_PRESETS[targetSlug]) {
        setActiveStoreSlug(targetSlug);
        setStoreInfo(STORE_PRESETS[targetSlug].store);
        setProducts(STORE_PRESETS[targetSlug].products);
      }
    };

    // LANGKAH 2: baca localStorage sebagai cache darurat. Kembalikan true bila ada isi.
    const loadFromLocalStorage = (): boolean => {
      try {
        const savedMerchants = localStorage.getItem('umkm_merchants');
        const savedAllStores = localStorage.getItem('umkm_all_stores');
        if (!savedMerchants && !savedAllStores) return false;

        if (savedMerchants) {
          setMerchants(JSON.parse(savedMerchants));
        }
        if (savedAllStores) {
          const parsed = JSON.parse(savedAllStores);
          setAllStores(parsed);
          if (parsed[targetSlug]) {
            setActiveStoreSlug(targetSlug);
            setStoreInfo(parsed[targetSlug].store);
            setProducts(parsed[targetSlug].products);
          }
        }
        return true;
      } catch (e) {
        console.warn('LocalStorage error:', e);
        return false;
      }
    };

    // LANGKAH 1b: hidrasi orders — Supabase diutamakan, localStorage
    // umkm_orders melengkapi id yang belum ada di cloud; seed ord-init-1
    // selalu disaring keluar.
    const loadOrders = async () => {
      let localOrders: Order[] = [];
      try {
        const raw = localStorage.getItem('umkm_orders');
        if (raw) localOrders = JSON.parse(raw) as Order[];
      } catch (e) {
        console.warn('LocalStorage orders error:', e);
      }
      localOrders = localOrders.filter((o) => o.id !== 'ord-init-1');
      let cloudOrders: Order[] | null = null;
      try {
        cloudOrders = await getOrdersFromSupabase(targetSlug);
      } catch (e) {
        console.warn('Load orders from Supabase failed:', e);
      }
      const merged = cloudOrders
        ? [
            ...cloudOrders,
            ...localOrders.filter((lo) => !cloudOrders!.some((co) => co.id === lo.id)),
          ]
        : localOrders;
      setOrders(merged.filter((o) => o.id !== 'ord-init-1'));
    };

    // LANGKAH 1: fetch Supabase dulu sebagai sumber benar.
    async function loadFromSupabase() {
      // Orders dimuat dulu (independen dari toko) supaya dashboard tidak kosong.
      await loadOrders();
      try {        const [cloudMerchants, cloudStores] = await Promise.all([
          getMerchantsFromSupabase(),
          getAllStoresWithProductsFromSupabase(),
        ]);

        const hasMerchants = !!cloudMerchants && cloudMerchants.length > 0;
        const hasStores = !!cloudStores && Object.keys(cloudStores).length > 0;

        if (hasMerchants || hasStores) {
          if (hasMerchants && cloudMerchants) {
            setMerchants(cloudMerchants);
            try {
              localStorage.setItem('umkm_merchants', JSON.stringify(cloudMerchants));
            } catch (e) {
              console.warn(e);
            }
          }

          if (hasStores && cloudStores) {
            setAllStores(cloudStores);
            try {
              localStorage.setItem('umkm_all_stores', JSON.stringify(cloudStores));
            } catch (e) {
              console.warn(e);
            }

            if (cloudStores[targetSlug]) {
              setActiveStoreSlug(targetSlug);
              setStoreInfo(cloudStores[targetSlug].store);
              setProducts(cloudStores[targetSlug].products);
            }
          }
          return;
        }

        // Supabase kosong -> cache darurat localStorage, lalu fallback darurat mock.
        if (!loadFromLocalStorage()) {
          applyEmergencyMockFallback();
        }
      } catch (err) {
        console.warn('Sync from Supabase failed, using local cache:', err);
        if (!loadFromLocalStorage()) {
          applyEmergencyMockFallback();
        }
      } finally {
        // Semua jalur sudah diputuskan (Supabase / localStorage / mock):
        // layar tunggu boleh ditutup.
        setIsLoading(false);
      }
    }

    loadFromSupabase();
  }, []);

  // Async (E-integrasi poin 8): dashboard menunggu hasilnya dan menampilkan
  // error bila false. true hanya bila upsert toko DAN (bila owner berubah)
  // upsert merchant sama-sama berhasil.
  // URUTAN PENTING (revisi Mode 2): Supabase DULU, state lokal + localStorage
  // HANYA bila cloud berhasil. Jadi popup sukses tidak pernah muncul padahal
  // Supabase gagal, dan draf dashboard tetap dianggap belum tersimpan.
  const handleUpdateStore = async (newStore: StoreInfo): Promise<boolean> => {
    // Sync to Supabase Cloud dulu
    const okStore = await upsertStoreToSupabase(newStore).catch((e) => {
      console.warn(e);
      return false;
    });

    let okMerchant = true;
    let updatedMerchant: MerchantAccount | null = null;
    const merchant = merchants.find((m) => m.storeSlug === activeStoreSlug);
    if (merchant && newStore.ownerName && merchant.ownerName !== newStore.ownerName) {
      updatedMerchant = { ...merchant, ownerName: newStore.ownerName };
      okMerchant = await upsertMerchantToSupabase(updatedMerchant).catch((e) => {
        console.warn(e);
        return false;
      });
    }

    if (!okStore || !okMerchant) return false;

    setStoreInfo(newStore);
    setAllStores((prev) => {
      const updated = {
        ...prev,
        [activeStoreSlug]: {
          store: newStore,
          products: prev[activeStoreSlug]?.products || products,
        },
      };
      try {
        localStorage.setItem('umkm_all_stores', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      return updated;
    });

    if (updatedMerchant) {
      setMerchants((prev) => {
        const updated = prev.map((m) =>
          m.storeSlug === activeStoreSlug ? updatedMerchant! : m
        );
        try {
          localStorage.setItem('umkm_merchants', JSON.stringify(updated));
        } catch (e) {
          console.warn(e);
        }
        return updated;
      });
    }

    return true;
  };

  const handleRegisterMerchant = (
    newMerchant: MerchantAccount,
    newStore: StoreInfo,
    sampleProducts: Product[]
  ) => {
    const slug = newMerchant.storeSlug;
    setMerchants((prev) => {
      const updated = [newMerchant, ...prev];
      try {
        localStorage.setItem('umkm_merchants', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    setAllStores((prev) => {
      const updated = {
        ...prev,
        [slug]: {
          store: newStore,
          products: sampleProducts,
        },
      };
      try {
        localStorage.setItem('umkm_all_stores', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    setActiveStoreSlug(slug);
    setRequestedStoreSlug(slug);
    setStoreInfo(newStore);
    setProducts(sampleProducts);
    setCartItems([]);
    setActiveTab('admin'); // Directly go to seller dashboard!

    // Sync to Supabase Cloud
    upsertMerchantToSupabase(newMerchant).catch((e) => console.warn(e));
    upsertStoreToSupabase(newStore).catch((e) => console.warn(e));
    sampleProducts.forEach((p) => {
      upsertProductToSupabase(p, slug).catch((e) => console.warn(e));
    });
  };

  const handleLoginMerchant = (storeSlug: string) => {
    const storeData = allStores[storeSlug];
    if (storeData) {
      setActiveStoreSlug(storeSlug);
      setRequestedStoreSlug(storeSlug);
      setStoreInfo(storeData.store);
      setProducts(storeData.products);
      setCartItems([]);
      setActiveTab('admin');
    }
  };

  const handleSelectStoreFromSuperAdmin = (
    slug: string,
    targetView: 'customer' | 'admin'
  ) => {
    const storeData = allStores[slug];
    if (storeData) {
      setActiveStoreSlug(slug);
      setRequestedStoreSlug(slug);
      setStoreInfo(storeData.store);
      setProducts(storeData.products);
      setCartItems([]);
      setActiveTab(targetView);
    }
  };

  const handleDeleteMerchant = (slug: string) => {
    setMerchants((prev) => {
      const updated = prev.filter((m) => m.storeSlug !== slug);
      try {
        localStorage.setItem('umkm_merchants', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    setAllStores((prev) => {
      const copy = { ...prev };
      delete copy[slug];
      try {
        localStorage.setItem('umkm_all_stores', JSON.stringify(copy));
      } catch (e) {
        console.warn(e);
      }
      return copy;
    });
  };

  const handleUpdateMerchantStatus = (
    slug: string,
    newStatus: 'active' | 'pending' | 'suspended',
    reason?: string
  ) => {
    setMerchants((prev) => {
      const updated = prev.map((m) =>
        m.storeSlug === slug
          ? {
              ...m,
              status: newStatus,
              statusReason: reason || (newStatus === 'active' ? undefined : m.statusReason),
            }
          : m
      );
      try {
        localStorage.setItem('umkm_merchants', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
      return updated;
    });

    // Sync to Supabase Cloud
    updateMerchantStatusInSupabase(slug, newStatus, reason).catch((e) => console.warn(e));
  };

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Modals Flow State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Customer Checkout Form State
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    phone: '',
    orderType: 'dine_in',
    tableNumber: '',
    address: '',
    notes: '',
  });

  // Default kosong (bukan 'qris') supaya gerbang pilih metode di PaymentModal terasa.
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | ''>('');

  // Kategori diturunkan dari produk toko aktif (C2) — bukan CATEGORIES hardcode.
  const derivedCategories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ['Semua Menu', ...unique];
  }, [products]);

  // Slug ?store= tidak dikenal: tampilkan pesan, jangan jatuh
  // diam-diam ke toko default.
  const storeNotFound =
    !isLoading && requestedStoreSlug !== null && !allStores[requestedStoreSlug];

  // document.title ikut toko aktif (C2).
  useEffect(() => {
    document.title = `${storeInfo.name} | Menu & Pesan Online UMKM`;
  }, [storeInfo.name]);

  // Filtered Products Calculation
  const filteredProducts = useMemo(() => {
    const filtered = products.filter((prod) => {
      const matchCategory =
        activeCategory === 'Semua Menu' || prod.category === activeCategory;
      const matchSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPrice =
        priceRange === 'all'
          ? true
          : priceRange === 'under_10k'
            ? prod.price < 10000
            : priceRange === '10k_25k'
              ? prod.price >= 10000 && prod.price <= 25000
              : priceRange === '25k_50k'
                ? prod.price > 25000 && prod.price <= 50000
                : prod.price > 50000;
      const isAvailableNow = prod.isAvailable && prod.stock !== 0;
      const matchAvailability =
        availabilityFilter === 'all'
          ? true
          : availabilityFilter === 'available'
            ? isAvailableNow
            : !isAvailableNow;
      return matchCategory && matchSearch && matchPrice && matchAvailability;
    });
    const sorted = [...filtered];
    switch (sortBy) {
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating_desc':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'name_asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'id-ID'));
        break;
      case 'best_selling':
      default:
        sorted.sort((a, b) => b.salesCount - a.salesCount);
        break;
    }
    return sorted;
  }, [products, activeCategory, searchQuery, sortBy, priceRange, availabilityFilter]);

  // Cart Handlers
  const handleAddToCart = (product: Product, quantity = 1, notes?: string) => {
    // Gerbang toko tutup (E1): tolak tambah ke keranjang bila toko tutup.
    if (!storeInfo.isOpen) {
      alert('Toko sedang tutup');
      return;
    }
    const qty = Math.max(1, quantity);
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + qty, notes: notes ?? item.notes }
            : item
        );
      }
      return [...prev, { product, quantity: qty, notes }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const handleUpdateNotes = (productId: string, notes: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, notes } : item
      )
    );
  };

  // Checkout Flow Handlers
  const handleProceedToCheckout = () => {
    // Gerbang toko tutup (E1): cek isOpen sebelum checkout dibuka.
    if (!storeInfo.isOpen) {
      alert('Toko sedang tutup');
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleBackToCart = () => {
    setIsCheckoutOpen(false);
    setIsCartOpen(true);
  };

  const handleProceedToPayment = () => {
    setIsCheckoutOpen(false);
    setIsPaymentOpen(true);
  };

  const handleBackToCheckout = () => {
    setIsPaymentOpen(false);
    setIsCheckoutOpen(true);
  };

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );
  // Ongkir hanya bila pesan antar; biaya layanan dari toko (default 2000).
  const deliveryFee = customerDetails.orderType === 'delivery' ? (storeInfo.deliveryFee ?? 10000) : 0;
  const serviceFee = storeInfo.serviceFee ?? 2000;
  const totalBill = subtotal + serviceFee + deliveryFee;

  // Bukti bayar opsional dari PaymentModal (E7): {payerName, paidAt}.
  // PaymentModal meneruskan bukti itu lewat onConfirmOrder(proof).
  const handleConfirmOrder = async (proof?: { payerName?: string; paidAt?: string }) => {
    if (!selectedPaymentMethod) {
      alert('Pilih metode pembayaran dulu.');
      return;
    }
    if (cartItems.length === 0) return;

    const paymentProofNote =
      proof && (proof.payerName || proof.paidAt)
        ? `Bukti bayar: ${proof.payerName ? `pengirim ${proof.payerName}` : ''}${proof.payerName && proof.paidAt ? ', ' : ''}${proof.paidAt ? `jam ${proof.paidAt}` : ''}`
        : '';
    const orderCustomer: CustomerDetails = {
      ...customerDetails,
      notes: [customerDetails.notes, paymentProofNote].filter(Boolean).join(' | ') || undefined,
    };

    const newOrderNumber = `#JM-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber: newOrderNumber,
      createdAt: new Date().toISOString(),
      items: [...cartItems],
      customer: orderCustomer,
      paymentMethod: selectedPaymentMethod,
      subtotal,
      deliveryFee,
      serviceFee,
      total: subtotal + deliveryFee + serviceFee,
      status: 'pending',
    };

    // Simpan dulu ke Supabase; bila gagal, JANGAN kosongkan keranjang /
    // tampilkan sukses — beri error dan biarkan pembeli coba lagi.
    const saved = await createOrderInSupabase(newOrder, activeStoreSlug).catch((e) => {
      console.warn(e);
      return false;
    });
    if (!saved) {
      alert('Pesanan gagal tersimpan. Periksa koneksi lalu coba lagi — keranjang Anda masih utuh.');
      return;
    }

    // Kurangi stok produk yang dipesan (min 0; habis bila stok jadi 0).
    const orderedQty = new Map<string, number>();
    cartItems.forEach((item) =>
      orderedQty.set(item.product.id, (orderedQty.get(item.product.id) || 0) + item.quantity)
    );
    const updatedProducts = products.map((p) => {
      const qty = orderedQty.get(p.id);
      if (qty == null || p.stock == null) return p;
      const newStock = Math.max(0, p.stock - qty);
      return { ...p, stock: newStock, isAvailable: newStock > 0 };
    });
    const changedProducts = updatedProducts.filter(
      (p, i) => p.stock !== products[i].stock || p.isAvailable !== products[i].isAvailable
    );
    setProducts(updatedProducts);
    changedProducts.forEach((p) => {
      upsertProductToSupabase(p, activeStoreSlug).catch((e) => console.warn(e));
    });

    // Save to orders feed (visible in Admin Dashboard) + persist lokal.
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      try {
        localStorage.setItem('umkm_orders', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save orders error:', e);
      }
      return updated;
    });
    setCompletedOrder(newOrder);

    // Close payment modal and clear cart
    setIsPaymentOpen(false);
    setIsSuccessOpen(true);
    setCartItems([]);
  };

  // Admin Handlers — tambah / ubah produk: Supabase DULU, state lokal HANYA
  // bila cloud berhasil, supaya popup sukses tidak muncul padahal gagal.
  const handleAddProduct = async (newProd: Product): Promise<boolean> => {
    const ok = await upsertProductToSupabase(newProd, activeStoreSlug).catch((e) => {
      console.warn(e);
      return false;
    });
    if (!ok) return false;
    setProducts((prev) => [newProd, ...prev]);
    return true;
  };

  const handleUpdateProduct = async (updatedProd: Product): Promise<boolean> => {
    const ok = await upsertProductToSupabase(updatedProd, activeStoreSlug).catch((e) => {
      console.warn(e);
      return false;
    });
    if (!ok) return false;
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProd.id ? updatedProd : p))
    );
    return true;
  };

  const handleDeleteProduct = (id: string) => {
    // HANYA hapus dari state lokal: dashboard sudah menghapus di Supabase
    // dulu sebelum memanggil ini — jangan panggil deleteProductFromSupabase
    // lagi di sini (hapus ganda).
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleAvailability = (id: string) => {
    setProducts((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, isAvailable: !p.isAvailable } : p
      );
      const target = updated.find((p) => p.id === id);
      if (target) {
        upsertProductToSupabase(target, activeStoreSlug).catch((e) => console.warn(e));
      }
      return updated;
    });
  };

  // Sync products changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('umkm_products', JSON.stringify(products));
    } catch (e) {
      console.warn('LocalStorage save products error:', e);
    }
  }, [products]);

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === orderId ? { ...o, status } : o));
      try {
        localStorage.setItem('umkm_orders', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save orders error:', e);
      }
      return updated;
    });
    // Idempotent: dashboard juga memanggil updateOrderStatusInSupabase
    // sebelum onUpdateOrderStatus — pemanggilan ganda tidak masalah.
    updateOrderStatusInSupabase(orderId, status).catch((e) => console.warn(e));
  };

  const currentMerchant = merchants.find((m) => m.storeSlug === activeStoreSlug);
  const isStoreInactive = currentMerchant ? currentMerchant.status !== 'active' : false;
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // LAYAR TUNGGU: tampil selama data awal belum diputuskan. Nama toko tidak
  // ditampilkan di sini karena storeInfo saat ini masih placeholder mock
  // (INITIAL_STORE_INFO) dan nama asli belum diketahui.
  if (isLoading) {
    return (
      <div className="app-container" style={{ backgroundColor: '#f8fafc' }}>
        <div className="loading-screen">
          <span className="loading-screen-icon">⏳</span>
          <h1 className="loading-screen-title">Sedang memuat...</h1>
          <p className="loading-screen-text">Menyiapkan etalase toko untuk Anda.</p>
        </div>

        <style jsx>{`
          .loading-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 80vh;
            padding: 40px 20px;
            text-align: center;
          }

          .loading-screen-icon {
            font-size: 2.5rem;
            margin-bottom: 16px;
            animation: loading-spin 1.5s infinite linear;
          }

          @keyframes loading-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .loading-screen-title {
            font-size: 1.25rem;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 8px 0;
          }

          .loading-screen-text {
            font-size: 0.9rem;
            color: #64748b;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className="app-container"
      style={{
        backgroundColor: storeInfo.backgroundColor || '#f8fafc',
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* Main Header / Store Profile & Mode Switcher */}
      <Header
        store={storeInfo}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        activeTab={activeTab}
        setActiveTab={requestTabChange}
      />

      {/* CUSTOMER VIEW */}
      {activeTab === 'customer' ? (
        <main
          className="customer-main"
          style={{
            backgroundColor: storeInfo.backgroundColor || '#f8fafc',
            transition: 'background-color 0.3s ease',
          }}
        >
          {storeNotFound ? (
            /* SLUG TIDAK DIKENAL (C2): jangan jatuh diam-diam ke toko default */
            <div className="no-products-box">
              <span className="empty-search-icon">🏪</span>
              <h3>Toko tidak ditemukan</h3>
              <p>
                Toko &ldquo;{requestedStoreSlug}&rdquo; tidak ada. Silakan periksa kembali alamat linknya.
              </p>
            </div>
          ) : isStoreInactive ? (
            /* TAMPILAN PERSUASIF & MENJAGA CITRA BRAND SAAT TOKO SEDANG REHAT / NONAKTIF */
            <div className="store-maintenance-container">
              <div className="store-maintenance-card">
                <div className="maintenance-status-pill">
                  <span className="sparkle-icon">✨</span>
                  <span>Pemberitahuan Pelanggan</span>
                </div>

                <div className="maintenance-store-header">
                  <img
                    src={storeInfo.logo}
                    alt={storeInfo.name}
                    className="maintenance-store-avatar"
                  />
                  <div className="maintenance-header-text">
                    <h1 className="maintenance-store-title">{storeInfo.name}</h1>
                    <p className="maintenance-store-tagline">{storeInfo.tagline}</p>
                  </div>
                </div>

                <div className="maintenance-reassurance-box">
                  <div className="reassurance-icon-row">
                    <span className="reassurance-icon">☕</span>
                    <span className="reassurance-tag">Layanan Sedang Rehat Sementara</span>
                  </div>
                  <h2 className="reassurance-headline">
                    Kami Sedang Menyiapkan Kualitas Menu & Pelayanan Terbaik untuk Anda
                  </h2>
                  <p className="reassurance-paragraph">
                    Halo pelanggan setia <strong>{storeInfo.name}</strong>! Untuk memastikan setiap hidangan dan pelayanan selalu berada dalam standar mutu dan kesegaran terbaik, etalase online kami saat ini sedang dalam proses pembaruan berkala.
                  </p>
                  <p className="reassurance-subparagraph">
                    Kami mohon maaf atas rehat sejenak ini. Kami akan segera kembali menyapa Anda dengan pengalaman pesan online yang jauh lebih lezat, cepat, dan istimewa!
                  </p>
                </div>

                {/* Direct Action Hub for Customers (WhatsApp & Google Maps) */}
                <div className="maintenance-contacts-card">
                  <h3 className="contacts-title">Tetap Terhubung dengan Kami:</h3>

                  <div className="maintenance-button-grid">
                    {/* 1. Hubungi via WhatsApp */}
                    <a
                      href={`https://wa.me/${(storeInfo.whatsapp || storeInfo.phone || '08123456789').replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Halo ${storeInfo.name}, saya pelanggan setia Anda. Saya ingin menanyakan info menu dan pemesanan ya.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-maintenance-contact btn-maintenance-wa"
                    >
                      <span className="contact-icon">💬</span>
                      <div className="contact-info">
                        <strong>Chat Pemilik Toko via WhatsApp</strong>
                        <span>Hubungi langsung di {storeInfo.phone}</span>
                      </div>
                    </a>

                    {/* 2. Cek Rute Google Maps / Outlet Fisik */}
                    {storeInfo.googleMapsUrl ? (
                      <a
                        href={storeInfo.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-maintenance-contact btn-maintenance-maps"
                      >
                        <span className="contact-icon">📍</span>
                        <div className="contact-info">
                          <strong>Kunjungi Outlet Offline Kami</strong>
                          <span>Petunjuk arah Google Maps ({storeInfo.address})</span>
                        </div>
                      </a>
                    ) : storeInfo.address ? (
                      <div className="btn-maintenance-contact btn-maintenance-addr">
                        <span className="contact-icon">🏠</span>
                        <div className="contact-info">
                          <strong>Alamat Outlet Kami</strong>
                          <span>{storeInfo.address} • Jam: {storeInfo.openingHours}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Discrete Owner Login Link */}
                <div className="maintenance-discrete-footer">
                  <span>Pemilik Toko {storeInfo.name}? </span>
                  <button
                    type="button"
                    className="discrete-link"
                    onClick={() => handleLoginMerchant(activeStoreSlug)}
                  >
                    Masuk ke Dashboard Toko
                  </button>
                  <span> • </span>
                  <button
                    type="button"
                    className="discrete-link"
                    onClick={() => requestTabChange('superadmin')}
                  >
                    Super Admin
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ETALASE BELANJA NORMAL (TOKO AKTIF) */
            <>
              {/* Sticky Category & Search Bar */}
              <CategoryFilter
                categories={derivedCategories}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                availabilityFilter={availabilityFilter}
                onAvailabilityChange={setAvailabilityFilter}
                searchPlaceholder={`Cari di ${storeInfo.name}...`}
              />

              {/* Promotional Banner Strip */}
              <div className="promo-callout-strip">
                <span className="sparkle-icon">✨</span>
                <span className="promo-text">
                  <strong>Pesan Langsung Tanpa Antri!</strong> Masukkan menu pilihan ke keranjang, konfirmasi meja/alamat, dan pesanan langsung dimasak.
                </span>
              </div>

              {/* Section Title */}
              <div className="section-title-strip">
                <h2 className="section-heading">
                  {activeCategory === 'Semua Menu' ? 'Daftar Menu Pilihan' : activeCategory}
                </h2>
                <span className="product-count-badge">
                  {filteredProducts.length} menu tersedia
                </span>
              </div>

              {/* Product Cards Grid */}
              {filteredProducts.length === 0 ? (
                <div className="no-products-box">
                  <span className="empty-search-icon">🔍</span>
                  <h3>Menu tidak ditemukan</h3>
                  <p>Coba gunakan kata kunci pencarian lain atau pilih kategori Semua Menu.</p>
                  <button
                    className="btn-reset-filter"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('Semua Menu');
                    }}
                  >
                    Reset Pencarian
                  </button>
                </div>
              ) : (
                <div className="products-grid">
                  {filteredProducts.map((prod) => {
                    const cartItem = cartItems.find((i) => i.product.id === prod.id);
                    const currentQty = cartItem ? cartItem.quantity : 0;
                    return (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        cartQuantity={currentQty}
                        onAddToCart={handleAddToCart}
                        onUpdateQuantity={handleUpdateQuantity}
                        onOpenDetail={setSelectedProduct}
                      />
                    );
                  })}
                </div>
              )}

              {/* Bottom Space for Floating Cart */}
              <div className="bottom-pad" />

              {/* Sticky Floating Bottom Cart Bar */}
              <CartFloatingBar
                items={cartItems}
                onOpenCart={() => setIsCartOpen(true)}
                onClearCart={() => setCartItems([])}
                serviceFee={serviceFee}
                deliveryFee={storeInfo.deliveryFee ?? 10000}
                orderType={customerDetails.orderType}
              />

              {/* Detail produk (D1, D2) */}
              <ProductDetailModal
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
                onAddToCart={handleAddToCart}
                isOpen={storeInfo.isOpen}
              />

              {/* Interactive Modals */}
              <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onUpdateNotes={handleUpdateNotes}
                onProceedToCheckout={handleProceedToCheckout}
                serviceFee={serviceFee}
                deliveryFee={storeInfo.deliveryFee ?? 10000}
                orderType={customerDetails.orderType}
              />

              <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                onBackToCart={handleBackToCart}
                items={cartItems}
                customer={customerDetails}
                onUpdateCustomer={setCustomerDetails}
                onProceedToPayment={handleProceedToPayment}
                store={storeInfo}
                deliveryFee={storeInfo.deliveryFee ?? 10000}
                serviceFee={serviceFee}
                storeIsOpen={storeInfo.isOpen}
              />

              <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                onBackToCheckout={handleBackToCheckout}
                totalAmount={totalBill}
                amount={totalBill}
                store={{
                  name: storeInfo.name,
                  qrisImageUrl: storeInfo.qrisImageUrl,
                  bankAccounts: storeInfo.bankAccounts,
                }}
                selectedPayment={selectedPaymentMethod as PaymentMethod}
                onSelectPayment={setSelectedPaymentMethod}
                onConfirmOrder={handleConfirmOrder}
              />

              <OrderSuccessModal
                isOpen={isSuccessOpen}
                onClose={() => setIsSuccessOpen(false)}
                order={completedOrder}
                store={storeInfo}
              />
            </>
          )}
        </main>
      ) : activeTab === 'admin' ? (
        /* BACKEND DASHBOARD (OWNER / ADMIN) */
        <AdminDashboard
          store={storeInfo}
          onUpdateStore={handleUpdateStore}
          products={products}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onToggleAvailability={handleToggleAvailability}
          orders={orders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onSwitchToCustomerView={() => requestTabChange('customer')}
          notify={showToast}
          guardRef={adminGuardRef}
          onDirtyChange={setAdminDirty}
        />
      ) : activeTab === 'auth' ? (
        /* MERCHANT AUTH (LOGIN & SIGN UP) */
        <AuthView
          merchants={merchants}
          onRegister={handleRegisterMerchant}
          onLogin={handleLoginMerchant}
          onBackToCustomer={() => requestTabChange('customer')}
          onGoToSuperAdmin={() => requestTabChange('superadmin')}
        />
      ) : (
        /* SUPER ADMIN DASHBOARD (PLATFORM OWNER) */
        <SuperAdminDashboard
          merchants={merchants}
          allStores={allStores}
          onSelectStore={handleSelectStoreFromSuperAdmin}
          onAddMerchant={handleRegisterMerchant}
          onDeleteMerchant={handleDeleteMerchant}
          onUpdateMerchantStatus={handleUpdateMerchantStatus}
          onBackToCustomer={() => requestTabChange('customer')}
          onGoToAuth={() => requestTabChange('auth')}
        />
      )}

      {/* Popup kecil sukses / gagal simpan (revisi Mode 2) */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Dialog "Perubahan belum disimpan" saat pindah mode */}
      <UnsavedChangesDialog
        open={pendingTab !== null}
        saving={savingBeforeNav}
        onKeluar={handleDialogKeluar}
        onSimpan={handleDialogSimpan}
      />

      {/* Footer Branding */}
      <footer
        className="app-footer"
        style={{ backgroundColor: storeInfo.backgroundColor || '#f8fafc' }}
      >
        <p className="footer-store-name">© 2026 {storeInfo.name}</p>
        <p className="footer-tagline">
          Didukung oleh Sistem Order Online Instan UMKM • Cepat, Praktis, & Tanpa Antri
        </p>
      </footer>

      <style jsx>{`
        .customer-main {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .store-picker-strip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px 0 20px;
          flex-wrap: wrap;
        }

        .store-picker-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #64748b;
        }

        .store-picker-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .store-picker-chip {
          padding: 6px 14px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
        }

        .store-picker-chip.active {
          background: var(--primary);
          color: #ffffff;
          border-color: transparent;
        }

        .promo-callout-strip {
          background: #fff7ed;
          border-bottom: 1px solid #ffedd5;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8rem;
          color: #9a3412;
        }

        .sparkle-icon {
          font-size: 1.1rem;
        }

        .promo-text strong {
          color: #c2410c;
        }

        .section-title-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px 10px 20px;
        }

        .section-heading {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .product-count-badge {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          background: #f1f5f9;
          padding: 3px 10px;
          border-radius: 999px;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          padding: 10px 16px 20px 16px;
        }

        @media (min-width: 768px) {
          .products-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 18px;
            padding: 12px 20px 24px 20px;
          }
        }

        @media (min-width: 1024px) {
          .products-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .no-products-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 50px 20px;
          text-align: center;
        }

        .empty-search-icon {
          font-size: 2.8rem;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .no-products-box h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .no-products-box p {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 16px;
          max-width: 300px;
        }

        .btn-reset-filter {
          background: var(--primary);
          color: white;
          padding: 8px 18px;
          border-radius: var(--radius-full);
          font-size: 0.82rem;
          font-weight: 700;
        }

        .bottom-pad {
          height: 90px;
        }

        /* Maintenance & Reassurance Screen (Brand Safe) */
        .store-maintenance-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px 80px 16px;
          min-height: 70vh;
        }

        .store-maintenance-card {
          background: #ffffff;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-color);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          max-width: 620px;
          width: 100%;
          padding: 32px 28px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .maintenance-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fff7ed;
          border: 1px solid #ffedd5;
          color: #c2410c;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .maintenance-store-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .maintenance-store-avatar {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          object-fit: cover;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
          border: 2px solid white;
        }

        .maintenance-header-text {
          text-align: center;
        }

        .maintenance-store-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
          letter-spacing: -0.01em;
        }

        .maintenance-store-tagline {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
        }

        .maintenance-reassurance-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-lg);
          padding: 24px 20px;
          margin-bottom: 24px;
          text-align: center;
          width: 100%;
        }

        .reassurance-icon-row {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .reassurance-icon {
          font-size: 1rem;
        }

        .reassurance-headline {
          font-size: 1.15rem;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 10px 0;
          line-height: 1.35;
        }

        .reassurance-paragraph {
          font-size: 0.86rem;
          color: #475569;
          line-height: 1.55;
          margin: 0 0 10px 0;
        }

        .reassurance-paragraph strong {
          color: #0f172a;
        }

        .reassurance-subparagraph {
          font-size: 0.8rem;
          color: #64748b;
          line-height: 1.45;
          margin: 0;
        }

        .maintenance-contacts-card {
          width: 100%;
          margin-bottom: 24px;
          text-align: left;
        }

        .contacts-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 12px;
          text-align: center;
        }

        .maintenance-button-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }

        .btn-maintenance-contact {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: var(--radius-md);
          text-decoration: none;
          transition: all 0.2s ease;
          width: 100%;
          box-sizing: border-box;
        }

        .btn-maintenance-wa {
          background: #16a34a;
          color: white;
          box-shadow: 0 4px 14px rgba(22, 163, 74, 0.25);
        }

        .btn-maintenance-wa:hover {
          background: #15803d;
          transform: translateY(-1px);
        }

        .btn-maintenance-maps {
          background: #eff6ff;
          border: 1.5px solid #bfdbfe;
          color: #1d4ed8;
        }

        .btn-maintenance-maps:hover {
          background: #dbeafe;
          transform: translateY(-1px);
        }

        .btn-maintenance-addr {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          color: #475569;
        }

        .contact-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: left;
        }

        .contact-info strong {
          font-size: 0.9rem;
          font-weight: 700;
        }

        .contact-info span {
          font-size: 0.74rem;
          opacity: 0.88;
        }

        .maintenance-other-stores {
          width: 100%;
          border-top: 1px solid #f1f5f9;
          padding-top: 20px;
          margin-bottom: 16px;
        }

        .other-stores-heading {
          display: block;
          font-size: 0.78rem;
          color: #64748b;
          margin-bottom: 10px;
        }

        .other-stores-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .other-store-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .other-store-chip:hover {
          background: #e2e8f0;
          color: #0f172a;
          transform: translateY(-1px);
        }

        .maintenance-discrete-footer {
          margin-top: 12px;
          font-size: 0.73rem;
          color: #94a3b8;
        }

        .discrete-link {
          background: none;
          border: none;
          color: #64748b;
          font-size: 0.73rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }

        .discrete-link:hover {
          color: #0f172a;
        }

        .app-footer {
          margin-top: auto;
          background: #f8fafc;
          border-top: 1px solid var(--border-color);
          padding: 24px 20px;
          text-align: center;
        }

        .footer-store-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .footer-tagline {
          font-size: 0.74rem;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
