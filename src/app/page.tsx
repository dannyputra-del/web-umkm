'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem, CustomerDetails, PaymentMethod, Order, StoreInfo, MerchantAccount } from '@/types';
import { INITIAL_STORE_INFO, INITIAL_PRODUCTS, CATEGORIES, INITIAL_MERCHANTS, STORE_PRESETS } from '@/data/mockData';
import { Header } from '@/components/Header';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ProductCard } from '@/components/ProductCard';
import { CartFloatingBar } from '@/components/CartFloatingBar';
import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { PaymentModal } from '@/components/PaymentModal';
import { OrderSuccessModal } from '@/components/OrderSuccessModal';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AuthView } from '@/components/AuthView';
import { SuperAdminDashboard } from '@/components/SuperAdminDashboard';

export default function HomePage() {
  // Global States
  const [activeTab, setActiveTab] = useState<'customer' | 'admin' | 'auth' | 'superadmin'>('customer');
  const [merchants, setMerchants] = useState<MerchantAccount[]>(INITIAL_MERCHANTS);
  const [allStores, setAllStores] = useState<Record<string, { store: StoreInfo; products: Product[] }>>(STORE_PRESETS);
  const [activeStoreSlug, setActiveStoreSlug] = useState<string>('padang-jaya');

  const [storeInfo, setStoreInfo] = useState<StoreInfo>(INITIAL_STORE_INFO);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ord-init-1',
      orderNumber: '#JM-9401',
      createdAt: '12:45 WIB',
      items: [
        { product: INITIAL_PRODUCTS[0], quantity: 2, notes: 'Bumbu rendang kental' },
        { product: INITIAL_PRODUCTS[8], quantity: 2 },
      ],
      customer: {
        name: 'Pak Rahmat',
        phone: '081233445566',
        orderType: 'dine_in',
        tableNumber: 'Meja 04',
      },
      paymentMethod: 'qris',
      subtotal: 64000,
      deliveryFee: 0,
      serviceFee: 2000,
      total: 66000,
      status: 'cooking',
    },
  ]);

  // Filtering & Search
  const [activeCategory, setActiveCategory] = useState<string>('Semua Menu');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Hydrate from localStorage on client and read ?store= query param
  useEffect(() => {
    try {
      // Check query param ?store=
      const params = new URLSearchParams(window.location.search);
      const storeSlugParam = params.get('store');

      const savedMerchants = localStorage.getItem('umkm_merchants');
      let currentMerchants = INITIAL_MERCHANTS;
      if (savedMerchants) {
        currentMerchants = JSON.parse(savedMerchants);
        setMerchants(currentMerchants);
      }

      const savedAllStores = localStorage.getItem('umkm_all_stores');
      let currentAllStores = STORE_PRESETS;
      if (savedAllStores) {
        currentAllStores = JSON.parse(savedAllStores);
        setAllStores(currentAllStores);
      }

      const targetSlug = storeSlugParam || 'padang-jaya';
      if (currentAllStores[targetSlug]) {
        setActiveStoreSlug(targetSlug);
        setStoreInfo(currentAllStores[targetSlug].store);
        setProducts(currentAllStores[targetSlug].products);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, []);

  const handleUpdateStore = (newStore: StoreInfo) => {
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
    setStoreInfo(newStore);
    setProducts(sampleProducts);
    setCartItems([]);
    setActiveTab('admin'); // Directly go to seller dashboard!
  };

  const handleLoginMerchant = (storeSlug: string) => {
    const storeData = allStores[storeSlug] || STORE_PRESETS[storeSlug];
    if (storeData) {
      setActiveStoreSlug(storeSlug);
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
    const storeData = allStores[slug] || STORE_PRESETS[slug];
    if (storeData) {
      setActiveStoreSlug(slug);
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
    tableNumber: 'Meja 01',
    address: '',
    notes: '',
  });

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('qris');

  // Filtered Products Calculation
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCategory =
        activeCategory === 'Semua Menu' || prod.category === activeCategory;
      const matchSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, activeCategory, searchQuery]);

  // Cart Handlers
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
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

  const totalBill = useMemo(() => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const deliveryFee = 0; // Ongkir Rp 0 (Ambil Sendiri / Ongkir dicek penjual via WA)
    const serviceFee = 2000;
    return subtotal + deliveryFee + serviceFee;
  }, [cartItems]);

  const handleConfirmOrder = () => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const deliveryFee = 0;
    const serviceFee = 2000;

    const newOrderNumber = `#JM-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber: newOrderNumber,
      createdAt: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB',
      items: [...cartItems],
      customer: { ...customerDetails },
      paymentMethod: selectedPaymentMethod,
      subtotal,
      deliveryFee,
      serviceFee,
      total: subtotal + deliveryFee + serviceFee,
      status: 'pending',
    };

    // Save to orders feed (visible in Admin Dashboard)
    setOrders((prev) => [newOrder, ...prev]);
    setCompletedOrder(newOrder);

    // Close payment modal and clear cart
    setIsPaymentOpen(false);
    setIsSuccessOpen(true);
    setCartItems([]);
  };

  // Admin Handlers
  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProd.id ? updatedProd : p))
    );
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleAvailability = (id: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, isAvailable: !p.isAvailable } : p
      )
    );
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
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const currentMerchant = merchants.find((m) => m.storeSlug === activeStoreSlug);
  const isStoreInactive = currentMerchant ? currentMerchant.status !== 'active' : false;
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className="app-container"
      style={{
        backgroundColor: storeInfo.backgroundColor || '#ffffff',
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* Main Header / Store Profile & Mode Switcher */}
      <Header
        store={storeInfo}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* CUSTOMER VIEW */}
      {activeTab === 'customer' ? (
        <main
          className="customer-main"
          style={{
            backgroundColor: storeInfo.backgroundColor || '#ffffff',
            transition: 'background-color 0.3s ease',
          }}
        >
          {isStoreInactive ? (
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

                {/* Jelajahi Mitra UMKM Lainnya */}
                <div className="maintenance-other-stores">
                  <span className="other-stores-heading">
                    🛍️ Ingin memesan kuliner atau produk sekarang? Kunjungi mitra UMKM lainnya:
                  </span>
                  <div className="other-stores-chips">
                    {merchants
                      .filter((m) => m.storeSlug !== activeStoreSlug && m.status === 'active')
                      .map((otherM) => (
                        <button
                          key={otherM.storeSlug}
                          type="button"
                          className="other-store-chip"
                          onClick={() => handleSelectStoreFromSuperAdmin(otherM.storeSlug, 'customer')}
                        >
                          <span>🏪</span>
                          <span>{otherM.storeName}</span>
                        </button>
                      ))}
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
                    onClick={() => setActiveTab('superadmin')}
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
                categories={CATEGORIES}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
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
              />

              {/* Interactive Modals */}
              <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onUpdateNotes={handleUpdateNotes}
                onProceedToCheckout={handleProceedToCheckout}
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
              />

              <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                onBackToCheckout={handleBackToCheckout}
                totalAmount={totalBill}
                selectedPayment={selectedPaymentMethod}
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
          onSwitchToCustomerView={() => setActiveTab('customer')}
        />
      ) : activeTab === 'auth' ? (
        /* MERCHANT AUTH (LOGIN & SIGN UP) */
        <AuthView
          merchants={merchants}
          onRegister={handleRegisterMerchant}
          onLogin={handleLoginMerchant}
          onBackToCustomer={() => setActiveTab('customer')}
          onGoToSuperAdmin={() => setActiveTab('superadmin')}
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
          onBackToCustomer={() => setActiveTab('customer')}
          onGoToAuth={() => setActiveTab('auth')}
        />
      )}

      {/* Footer Branding */}
      <footer className="app-footer">
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
          background: #ffffff;
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
