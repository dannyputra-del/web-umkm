'use client';

import React, { useState, useMemo } from 'react';
import { Product, CartItem, CustomerDetails, PaymentMethod, Order, StoreInfo } from '@/types';
import { INITIAL_STORE_INFO, INITIAL_PRODUCTS, CATEGORIES } from '@/data/mockData';
import { Header } from '@/components/Header';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ProductCard } from '@/components/ProductCard';
import { CartFloatingBar } from '@/components/CartFloatingBar';
import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { PaymentModal } from '@/components/PaymentModal';
import { OrderSuccessModal } from '@/components/OrderSuccessModal';
import { AdminDashboard } from '@/components/AdminDashboard';

export default function HomePage() {
  // Global States
  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>('customer');
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
    const deliveryFee = customerDetails.orderType === 'delivery' ? 10000 : 0;
    const serviceFee = 2000;
    return subtotal + deliveryFee + serviceFee;
  }, [cartItems, customerDetails.orderType]);

  const handleConfirmOrder = () => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const deliveryFee = customerDetails.orderType === 'delivery' ? 10000 : 0;
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

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app-container">
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
        <main className="customer-main">
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
        </main>
      ) : (
        /* BACKEND DASHBOARD (OWNER / ADMIN) */
        <AdminDashboard
          store={storeInfo}
          onUpdateStore={setStoreInfo}
          products={products}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
          onToggleAvailability={handleToggleAvailability}
          orders={orders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onSwitchToCustomerView={() => setActiveTab('customer')}
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
