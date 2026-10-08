'use client';

import React, { useState } from 'react';
import { Product, StoreInfo, Order } from '@/types';
import { CATEGORIES } from '@/data/mockData';

interface AdminDashboardProps {
  store: StoreInfo;
  onUpdateStore: (store: StoreInfo) => void;
  products: Product[];
  onAddProduct: (newProduct: Product) => void;
  onDeleteProduct: (id: string) => void;
  onToggleAvailability: (id: string) => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onSwitchToCustomerView: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  store,
  onUpdateStore,
  products,
  onAddProduct,
  onDeleteProduct,
  onToggleAvailability,
  orders,
  onUpdateOrderStatus,
  onSwitchToCustomerView,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'products' | 'orders' | 'settings'>('products');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State for Adding New Product Card
  const [formData, setFormData] = useState({
    name: '',
    category: 'Lauk Utama',
    price: '',
    originalPrice: '',
    description: '',
    image: '',
    badge: '',
  });

  const [formError, setFormError] = useState('');

  // Preset sample images for quick add
  const sampleImages = [
    { label: 'Rendang/Daging', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' },
    { label: 'Ayam Goreng', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80' },
    { label: 'Kari / Gulai', url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80' },
    { label: 'Nasi Kotak', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
    { label: 'Minuman Segar', url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80' },
  ];

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price.trim()) {
      setFormError('Nama menu dan harga wajib diisi!');
      return;
    }

    const priceNum = parseInt(formData.price, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Harga harus berupa angka valid!');
      return;
    }

    const newProd: Product = {
      id: 'prod-' + Date.now(),
      name: formData.name.trim(),
      category: formData.category,
      price: priceNum,
      originalPrice: formData.originalPrice ? parseInt(formData.originalPrice, 10) : undefined,
      description: formData.description.trim() || 'Menu lezat pilihan dari ' + store.name,
      image: formData.image.trim() || sampleImages[0].url,
      badge: formData.badge.trim() || undefined,
      rating: 5.0,
      salesCount: 1,
      isAvailable: true,
    };

    onAddProduct(newProd);
    setFormData({
      name: '',
      category: 'Lauk Utama',
      price: '',
      originalPrice: '',
      description: '',
      image: '',
      badge: '',
    });
    setFormError('');
    setIsAddModalOpen(false);
  };

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // Summary Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="admin-container">
      {/* Top Banner Dashboard */}
      <div className="admin-header-strip">
        <div className="admin-header-title">
          <span className="admin-icon">⚙️</span>
          <div>
            <h2>Dashboard Pemilik Toko (Backend UMKM)</h2>
            <p>Kelola etalase menu jualan, update kartu produk, dan pantau pesanan pembeli.</p>
          </div>
        </div>
        <button className="btn-preview-customer" onClick={onSwitchToCustomerView}>
          <span>👁️ Lihat Web Pembeli</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-icon">🍽️</span>
          <div className="metric-content">
            <span className="metric-num">{products.length} Menu</span>
            <span className="metric-label">Total Kartu Produk Aktif</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">📦</span>
          <div className="metric-content">
            <span className="metric-num">{orders.length} Pesanan</span>
            <span className="metric-label">Pesanan Masuk Hari Ini</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">💰</span>
          <div className="metric-content">
            <span className="metric-num">{formatRupiah(totalRevenue)}</span>
            <span className="metric-label">Estimasi Omzet Hari Ini</span>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="admin-tabs-bar">
        <button
          className={`admin-tab-btn ${activeAdminTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('products')}
        >
          📋 Kelola Kartu Produk ({products.length})
        </button>
        <button
          className={`admin-tab-btn ${activeAdminTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('orders')}
        >
          🔔 Pesanan Masuk ({orders.length})
        </button>
        <button
          className={`admin-tab-btn ${activeAdminTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('settings')}
        >
          🏪 Pengaturan Info Toko
        </button>
      </div>

      {/* TAB 1: PRODUCT MANAGEMENT */}
      {activeAdminTab === 'products' && (
        <div className="tab-pane">
          <div className="pane-action-bar">
            <div>
              <h3>Daftar Etalase Kartu Produk</h3>
              <p>Tambah kartu baru atau update status stok makanan langsung dari sini.</p>
            </div>
            <button className="btn-add-product" onClick={() => setIsAddModalOpen(true)}>
              <span>+ Tambah Menu / Card Baru</span>
            </button>
          </div>

          <div className="product-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Foto & Menu</th>
                  <th>Kategori</th>
                  <th>Harga Jual</th>
                  <th>Status Stok</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <div className="table-product-cell">
                        <img src={prod.image} alt={prod.name} className="table-thumb" />
                        <div>
                          <strong className="table-product-name">{prod.name}</strong>
                          {prod.badge && <span className="table-badge">{prod.badge}</span>}
                          <p className="table-desc">{prod.description}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="cat-tag">{prod.category}</span>
                    </td>
                    <td>
                      <strong className="table-price">{formatRupiah(prod.price)}</strong>
                    </td>
                    <td>
                      <button
                        className={`status-toggle-btn ${prod.isAvailable ? 'available' : 'unavailable'}`}
                        onClick={() => onToggleAvailability(prod.id)}
                      >
                        {prod.isAvailable ? '🟢 Tersedia' : '🔴 Habis'}
                      </button>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-action-del"
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus kartu menu "${prod.name}"?`)) {
                              onDeleteProduct(prod.id);
                            }
                          }}
                          title="Hapus Kartu Produk"
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE ORDERS FEED */}
      {activeAdminTab === 'orders' && (
        <div className="tab-pane">
          <div className="pane-action-bar">
            <div>
              <h3>Daftar Pesanan Masuk (Realtime Feed)</h3>
              <p>Pantau rincian pesanan pembeli, no. meja/alamat, dan status dapur.</p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="empty-orders-box">
              <span>📭</span>
              <h4>Belum Ada Pesanan Masuk</h4>
              <p>Pesanan baru yang dibuat oleh pembeli akan langsung muncul di sini.</p>
            </div>
          ) : (
            <div className="orders-cards-grid">
              {orders.map((ord) => (
                <div key={ord.id} className="order-live-card">
                  <div className="order-card-header">
                    <div>
                      <span className="order-no-tag">{ord.orderNumber}</span>
                      <span className="order-time-tag">{ord.createdAt}</span>
                    </div>
                    <span className={`order-status-badge ${ord.status}`}>
                      {ord.status === 'pending'
                        ? '⏳ Menunggu'
                        : ord.status === 'cooking'
                        ? '👨‍🍳 Dimasak'
                        : ord.status === 'ready'
                        ? '🍽️ Siap Saji'
                        : '✅ Selesai'}
                    </span>
                  </div>

                  <div className="customer-info-strip">
                    <strong>{ord.customer.name}</strong> • {ord.customer.phone}
                    <div className="customer-destination">
                      {ord.customer.orderType === 'dine_in'
                        ? `🍽️ Makan di Tempat (Meja: ${ord.customer.tableNumber})`
                        : ord.customer.orderType === 'takeaway'
                        ? '🛍️ Ambil Sendiri (Takeaway)'
                        : `🛵 Antar ke: ${ord.customer.address}`}
                    </div>
                  </div>

                  <div className="order-menu-list">
                    {ord.items.map((it) => (
                      <div key={it.product.id} className="menu-list-row">
                        <span>{it.quantity}x {it.product.name}</span>
                        <span>{formatRupiah(it.product.price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer-strip">
                    <div className="total-box">
                      <span>Total:</span>
                      <strong>{formatRupiah(ord.total)}</strong>
                    </div>

                    <div className="status-change-buttons">
                      {ord.status === 'pending' && (
                        <button
                          className="btn-status-flow cooking"
                          onClick={() => onUpdateOrderStatus(ord.id, 'cooking')}
                        >
                          Mulai Masak 👨‍🍳
                        </button>
                      )}
                      {ord.status === 'cooking' && (
                        <button
                          className="btn-status-flow ready"
                          onClick={() => onUpdateOrderStatus(ord.id, 'ready')}
                        >
                          Makanan Siap 🍽️
                        </button>
                      )}
                      {ord.status === 'ready' && (
                        <button
                          className="btn-status-flow complete"
                          onClick={() => onUpdateOrderStatus(ord.id, 'completed')}
                        >
                          Selesaikan Pesanan ✅
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STORE SETTINGS */}
      {activeAdminTab === 'settings' && (
        <div className="tab-pane">
          <div className="pane-action-bar">
            <div>
              <h3>Pengaturan Informasi Toko</h3>
              <p>Sesuaikan profil toko online, jam buka, dan kontak WhatsApp penerima pesan.</p>
            </div>
          </div>

          <div className="settings-form-card">
            <div className="form-group">
              <label className="form-label">Nama Toko UMKM</label>
              <input
                type="text"
                value={store.name}
                onChange={(e) => onUpdateStore({ ...store, name: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slogan / Tagline</label>
              <input
                type="text"
                value={store.tagline}
                onChange={(e) => onUpdateStore({ ...store, tagline: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nomor WhatsApp Penerima Order (Format internasional cth: 62812...)</label>
              <input
                type="text"
                value={store.whatsapp}
                onChange={(e) => onUpdateStore({ ...store, whatsapp: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Alamat Lengkap Toko</label>
              <input
                type="text"
                value={store.address}
                onChange={(e) => onUpdateStore({ ...store, address: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Jam Operasional</label>
              <input
                type="text"
                value={store.openingHours}
                onChange={(e) => onUpdateStore({ ...store, openingHours: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="toggle-open-row">
              <label className="toggle-label">
                <span>Status Buka Toko:</span>
                <input
                  type="checkbox"
                  checked={store.isOpen}
                  onChange={(e) => onUpdateStore({ ...store, isOpen: e.target.checked })}
                />
                <span className="toggle-text">
                  {store.isOpen ? '🟢 Toko Buka (Menerima Pesanan)' : '🔴 Toko Tutup'}
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD NEW PRODUCT CARD */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span>➕</span>
                <span>Tambah Kartu Menu Baru</span>
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="modal-body">
              {formError && <div className="form-alert-error">{formError}</div>}

              <div className="form-group">
                <label className="form-label">Nama Menu / Produk *</label>
                <input
                  type="text"
                  placeholder="Cth: Ayam Gulai Pedas Gurih"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kategori Produk</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-select"
                >
                  {CATEGORIES.filter((c) => c !== 'Semua Menu').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    placeholder="Cth: 25000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Harga Coret / Asli (Opsional)</label>
                  <input
                    type="number"
                    placeholder="Cth: 30000"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi Menu</label>
                <textarea
                  placeholder="Jelaskan kelezatan atau porsi menu ini..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL Foto Produk</label>
                <input
                  type="url"
                  placeholder="https://... atau pilih foto cepat di bawah"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="form-input"
                />

                <div className="quick-image-select">
                  <span className="quick-label">Pilih Foto Sampel Cepat:</span>
                  <div className="sample-pills">
                    {sampleImages.map((s, idx) => (
                      <button
                        type="button"
                        key={idx}
                        className="sample-btn"
                        onClick={() => setFormData({ ...formData, image: s.url })}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Badge Label (Opsional)</label>
                <input
                  type="text"
                  placeholder="Cth: Spesial Minggu Ini, Best Seller"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="modal-footer-strip">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-save-new">
                  Simpan & Tambah ke Etalase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-container {
          padding: 24px 20px;
          background: #f8fafc;
          min-height: 80vh;
        }

        .admin-header-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          padding: 20px 24px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .admin-header-title {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .admin-icon {
          font-size: 2rem;
          background: #fff7ed;
          padding: 10px;
          border-radius: 12px;
        }

        .admin-header-title h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
        }

        .admin-header-title p {
          font-size: 0.8rem;
          color: #64748b;
        }

        .btn-preview-customer {
          background: var(--primary);
          color: white;
          padding: 10px 18px;
          border-radius: var(--radius-full);
          font-size: 0.82rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }

        .metric-card {
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: var(--shadow-sm);
        }

        .metric-icon {
          font-size: 2rem;
        }

        .metric-content {
          display: flex;
          flex-direction: column;
        }

        .metric-num {
          font-size: 1.3rem;
          font-weight: 800;
          color: #0f172a;
        }

        .metric-label {
          font-size: 0.75rem;
          color: #64748b;
        }

        .admin-tabs-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
          overflow-x: auto;
        }

        .admin-tab-btn {
          padding: 10px 18px;
          border-radius: var(--radius-md) var(--radius-md) 0 0;
          font-size: 0.85rem;
          font-weight: 700;
          background: transparent;
          color: #64748b;
          white-space: nowrap;
        }

        .admin-tab-btn.active {
          background: #ffffff;
          color: var(--primary);
          border-bottom: 3px solid var(--primary);
          box-shadow: 0 4px 6px -4px rgba(0,0,0,0.05);
        }

        .tab-pane {
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 20px;
          box-shadow: var(--shadow-sm);
        }

        .pane-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .pane-action-bar h3 {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
        }

        .pane-action-bar p {
          font-size: 0.8rem;
          color: #64748b;
        }

        .btn-add-product {
          background: var(--accent-green);
          color: white;
          padding: 10px 20px;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
        }

        .product-table-wrapper {
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .admin-table th {
          text-align: left;
          padding: 12px 14px;
          background: #f8fafc;
          color: #475569;
          font-weight: 700;
          border-bottom: 1.5px solid #e2e8f0;
        }

        .admin-table td {
          padding: 14px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .table-product-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .table-thumb {
          width: 52px;
          height: 52px;
          border-radius: 8px;
          object-fit: cover;
        }

        .table-product-name {
          color: #0f172a;
          display: block;
        }

        .table-badge {
          background: #fff7ed;
          color: var(--primary);
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 4px;
          font-weight: 700;
        }

        .table-desc {
          font-size: 0.72rem;
          color: #94a3b8;
          max-width: 260px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .cat-tag {
          background: #f1f5f9;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #475569;
        }

        .table-price {
          color: var(--primary);
          font-weight: 800;
        }

        .status-toggle-btn {
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .status-toggle-btn.available {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .status-toggle-btn.unavailable {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .btn-action-del {
          background: #fef2f2;
          color: #ef4444;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .orders-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        .order-live-card {
          border: 1.5px solid var(--border-strong);
          border-radius: var(--radius-md);
          padding: 14px;
          background: #ffffff;
        }

        .order-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .order-no-tag {
          font-weight: 800;
          color: #0f172a;
          margin-right: 8px;
        }

        .order-time-tag {
          font-size: 0.72rem;
          color: #94a3b8;
        }

        .order-status-badge {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 999px;
        }

        .order-status-badge.pending {
          background: #fef3c7;
          color: #b45309;
        }

        .order-status-badge.cooking {
          background: #ffedd5;
          color: #c2410c;
        }

        .order-status-badge.ready {
          background: #e0e7ff;
          color: #4338ca;
        }

        .order-status-badge.completed {
          background: #ecfdf5;
          color: #047857;
        }

        .customer-info-strip {
          background: #f8fafc;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 0.78rem;
          margin-bottom: 10px;
        }

        .customer-destination {
          color: #64748b;
          margin-top: 2px;
        }

        .order-menu-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.78rem;
          margin-bottom: 12px;
          border-bottom: 1px dashed #e2e8f0;
          padding-bottom: 8px;
        }

        .menu-list-row {
          display: flex;
          justify-content: space-between;
        }

        .order-footer-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .total-box {
          font-size: 0.85rem;
        }

        .total-box strong {
          color: var(--primary);
          margin-left: 4px;
        }

        .btn-status-flow {
          padding: 6px 12px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
        }

        .btn-status-flow.cooking {
          background: #ea580c;
        }

        .btn-status-flow.ready {
          background: #4f46e5;
        }

        .btn-status-flow.complete {
          background: #059669;
        }

        .empty-orders-box {
          text-align: center;
          padding: 40px;
          color: #94a3b8;
        }

        .empty-orders-box span {
          font-size: 3rem;
        }

        .settings-form-card {
          max-width: 520px;
        }

        .toggle-open-row {
          margin-top: 16px;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .quick-image-select {
          margin-top: 8px;
        }

        .quick-label {
          font-size: 0.72rem;
          color: #64748b;
          display: block;
          margin-bottom: 4px;
        }

        .sample-pills {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .sample-btn {
          background: #f1f5f9;
          color: #334155;
          font-size: 0.72rem;
          padding: 3px 8px;
          border-radius: 4px;
        }

        .sample-btn:hover {
          background: #e2e8f0;
        }

        .form-alert-error {
          background: #fef2f2;
          color: #dc2626;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          margin-bottom: 12px;
        }

        .modal-footer-strip {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .btn-cancel {
          background: #f1f5f9;
          padding: 10px 18px;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .btn-save-new {
          background: var(--accent-green);
          color: white;
          padding: 10px 22px;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};
