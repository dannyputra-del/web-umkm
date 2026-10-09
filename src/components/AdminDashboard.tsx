'use client';

import React, { useState } from 'react';
import { Product, StoreInfo, Order } from '@/types';
import { CATEGORIES } from '@/data/mockData';
import { ImageDropzone } from './ImageDropzone';

interface AdminDashboardProps {
  store: StoreInfo;
  onUpdateStore: (store: StoreInfo) => void;
  products: Product[];
  onAddProduct: (newProduct: Product) => void;
  onUpdateProduct?: (product: Product) => void;
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
  onUpdateProduct,
  onDeleteProduct,
  onToggleAvailability,
  orders,
  onUpdateOrderStatus,
  onSwitchToCustomerView,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'products' | 'orders' | 'settings'>('products');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Edit Product State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: 'Lauk Utama',
    price: '',
    originalPrice: '',
    description: '',
    image: '',
    badge: '',
    isAvailable: true,
  });
  const [editFormError, setEditFormError] = useState('');

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setEditFormData({
      name: prod.name,
      category: prod.category,
      price: prod.price.toString(),
      originalPrice: prod.originalPrice ? prod.originalPrice.toString() : '',
      description: prod.description || '',
      image: prod.image || '',
      badge: prod.badge || '',
      isAvailable: prod.isAvailable,
    });
    setEditFormError('');
    setIsEditModalOpen(true);
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name.trim() || !editFormData.price.trim()) {
      setEditFormError('Nama menu dan harga wajib diisi!');
      return;
    }

    const priceNum = parseInt(editFormData.price, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      setEditFormError('Harga harus berupa angka valid!');
      return;
    }

    if (!editingProductId) return;

    const original = products.find((p) => p.id === editingProductId);
    const updatedProd: Product = {
      id: editingProductId,
      name: editFormData.name.trim(),
      category: editFormData.category,
      price: priceNum,
      originalPrice: editFormData.originalPrice ? parseInt(editFormData.originalPrice, 10) : undefined,
      description: editFormData.description.trim() || 'Menu lezat pilihan dari ' + store.name,
      image: editFormData.image.trim() || (original?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'),
      badge: editFormData.badge.trim() || undefined,
      rating: original?.rating ?? 5.0,
      salesCount: original?.salesCount ?? 1,
      isAvailable: editFormData.isAvailable,
    };

    if (onUpdateProduct) {
      onUpdateProduct(updatedProd);
    }
    setIsEditModalOpen(false);
    setEditingProductId(null);
  };

  // Store Personalization Draft State
  const [storeDraft, setStoreDraft] = useState<StoreInfo>(store);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const storeCategories = [
    'Kuliner & Makanan Basah',
    'Kedai Kopi & Minuman Kekinian',
    'Roti, Kue & Patisserie',
    'Fashion, Busana & Aksesoris',
    'Kerajinan Tangan & Suvenir',
    'Sembako & Kebutuhan Rumah Tangga',
    'Kecantikan & Herbal',
  ];

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStore(storeDraft);
    setSaveSuccessMsg('✓ Perubahan profil & tampilan web berhasil disimpan!');
    setTimeout(() => {
      setSaveSuccessMsg('');
    }, 4000);
  };

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
      image: formData.image.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
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
          🎨 Profil & Personalisasi Web
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
                          className="btn-action-edit"
                          onClick={() => handleOpenEditProduct(prod)}
                          title="Edit Menu & Foto"
                        >
                          ✏️ Edit
                        </button>
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

      {/* TAB 3: STORE PERSONALIZATION & SETTINGS */}
      {activeAdminTab === 'settings' && (
        <div className="tab-pane">
          <div className="pane-action-bar">
            <div>
              <h3>🎨 Personalisasi & Profil Website Toko</h3>
              <p>Atur identitas visual, foto profil, banner sampul, jam buka, dan kontak WhatsApp toko Anda.</p>
            </div>
            <button
              type="button"
              className="btn-preview-customer"
              onClick={onSwitchToCustomerView}
            >
              👁️ Lihat Hasil di Tampilan Pembeli
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="save-toast-banner">
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <div className="personalization-grid">
            {/* Form Column */}
            <form onSubmit={handleSaveStore} className="settings-form-column">
              {/* Card 1: Foto Profil & Banner */}
              <div className="settings-section-card">
                <div className="section-card-header">
                  <span className="card-badge-icon">📸</span>
                  <div>
                    <h4>Foto Profil & Banner Sampul</h4>
                    <p>Ubah tampilan visual halaman utama toko Anda.</p>
                  </div>
                </div>

                {/* Foto Profil / Logo */}
                <div className="form-group">
                  <label className="form-label">Foto Profil / Logo Toko</label>
                  <ImageDropzone
                    value={storeDraft.logo}
                    onChange={(dataUrl) => setStoreDraft({ ...storeDraft, logo: dataUrl })}
                    aspectRatio="avatar"
                    label="Unggah Foto Profil / Logo Toko"
                    subLabel="Tarik & lepas foto logo ke sini, atau klik untuk memilih dari HP / komputer"
                  />
                </div>

                {/* Banner Sampul */}
                <div className="form-group" style={{ marginTop: '18px' }}>
                  <label className="form-label">Banner Sampul Toko (Hero Header)</label>
                  <ImageDropzone
                    value={storeDraft.banner}
                    onChange={(dataUrl) => setStoreDraft({ ...storeDraft, banner: dataUrl })}
                    aspectRatio="banner"
                    label="Unggah Foto Banner Sampul Toko"
                    subLabel="Tarik & lepas foto banner ke sini (rasio lebar), otomatis dikompres ke WebP ringan"
                  />
                </div>
              </div>

              {/* Card 2: Informasi & Branding Toko */}
              <div className="settings-section-card">
                <div className="section-card-header">
                  <span className="card-badge-icon">🏷️</span>
                  <div>
                    <h4>Identitas & Branding Toko</h4>
                    <p>Nama, slogan, kategori usaha, dan deskripsi produk.</p>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Toko UMKM *</label>
                  <input
                    type="text"
                    value={storeDraft.name}
                    onChange={(e) => setStoreDraft({ ...storeDraft, name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Slogan / Tagline Menarik</label>
                  <input
                    type="text"
                    placeholder="Cth: Cita Rasa Autentik Nusantara Sejak 2018"
                    value={storeDraft.tagline}
                    onChange={(e) => setStoreDraft({ ...storeDraft, tagline: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Kategori Usaha</label>
                    <select
                      value={storeDraft.category}
                      onChange={(e) => setStoreDraft({ ...storeDraft, category: e.target.value })}
                      className="form-input"
                    >
                      {storeCategories.map((cat, idx) => (
                        <option key={idx} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Jam Operasional</label>
                    <input
                      type="text"
                      placeholder="Cth: 08:00 - 21:00 WIB"
                      value={storeDraft.openingHours}
                      onChange={(e) => setStoreDraft({ ...storeDraft, openingHours: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi / Cerita Singkat Toko</label>
                  <textarea
                    rows={3}
                    placeholder="Ceritakan keunggulan produk dan toko Anda kepada calon pembeli..."
                    value={storeDraft.description}
                    onChange={(e) => setStoreDraft({ ...storeDraft, description: e.target.value })}
                    className="form-input form-textarea"
                  />
                </div>

                {/* Status Buka / Tutup */}
                <div className="status-toggle-card">
                  <div className="status-toggle-info">
                    <span className="toggle-title">Status Penerimaan Pesanan:</span>
                    <span className="toggle-desc">
                      {storeDraft.isOpen
                        ? '🟢 Toko Aktif (Pembeli dapat memesan dan melakukan checkout)'
                        : '🔴 Toko Tutup Sementara (Pembeli hanya dapat melihat katalog)'}
                    </span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={storeDraft.isOpen}
                      onChange={(e) => setStoreDraft({ ...storeDraft, isOpen: e.target.checked })}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>

              {/* Card 3: Kontak & WhatsApp Pesanan */}
              <div className="settings-section-card">
                <div className="section-card-header">
                  <span className="card-badge-icon">💬</span>
                  <div>
                    <h4>Kontak WhatsApp & Alamat</h4>
                    <p>Nomor tujuan konfirmasi pesanan masuk dan alamat operasional.</p>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Nomor WhatsApp Penerima Order (Gunakan kode negara, cth: 628123456789)
                  </label>
                  <div className="wa-input-row">
                    <input
                      type="text"
                      placeholder="628xxxxxxxxxx"
                      value={storeDraft.whatsapp}
                      onChange={(e) => setStoreDraft({ ...storeDraft, whatsapp: e.target.value.replace(/\D/g, '') })}
                      className="form-input"
                    />
                    {storeDraft.whatsapp && (
                      <a
                        href={`https://wa.me/${storeDraft.whatsapp}?text=Halo%20${encodeURIComponent(storeDraft.name)},%20ini%20tes%20pesan`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-test-wa"
                      >
                        🧪 Tes Hubungi WA
                      </a>
                    )}
                  </div>
                  <span className="input-hint">
                    Format: diawali 62 (pengganti 08). Pesanan dari pembeli akan otomatis dikirimkan ke nomor ini.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Nomor Telepon Reguler (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Cth: 08123456789 atau (021) 555-1234"
                    value={storeDraft.phone}
                    onChange={(e) => setStoreDraft({ ...storeDraft, phone: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Alamat Lengkap Toko</label>
                  <textarea
                    rows={2}
                    placeholder="Alamat toko, patokan lokasi, atau area pengiriman..."
                    value={storeDraft.address}
                    onChange={(e) => setStoreDraft({ ...storeDraft, address: e.target.value })}
                    className="form-input form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Link Google Maps Lokasi Toko (Titik Pickup Kurir / Pembeli)</label>
                  <div className="wa-input-row">
                    <input
                      type="url"
                      placeholder="Cth: https://maps.app.goo.gl/... atau https://maps.google.com/..."
                      value={storeDraft.googleMapsUrl || ''}
                      onChange={(e) => setStoreDraft({ ...storeDraft, googleMapsUrl: e.target.value })}
                      className="form-input"
                    />
                    {storeDraft.googleMapsUrl && (
                      <a
                        href={storeDraft.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-test-wa"
                        style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
                      >
                        🗺️ Tes Buka Maps
                      </a>
                    )}
                  </div>
                  <span className="input-hint">
                    Buka Google Maps, cari lokasi toko Anda, klik tombol <strong>Bagikan / Share</strong> lalu salin tautan ke sini. Pembeli akan melihat tombol <strong>📍 Buka di Google Maps</strong> di website.
                  </span>
                </div>
              </div>

              {/* Card 4: Pilihan Tema & Warna Latar Belakang */}
              <div className="settings-section-card">
                <div className="section-card-header">
                  <span className="card-badge-icon">🎨</span>
                  <div>
                    <h4>Tema & Warna Latar Belakang Website</h4>
                    <p>Pilih suasana warna background toko agar etalase tidak monoton putih.</p>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Palet Pilihan Suasana Populer</label>
                  <div className="theme-palette-grid">
                    {[
                      { name: 'Putih Bersih', color: '#ffffff', border: '#e2e8f0' },
                      { name: 'Slate Elegan', color: '#f8fafc', border: '#cbd5e1' },
                      { name: 'Krem Hangat', color: '#fbf8f1', border: '#f3e8d2' },
                      { name: 'Cafe Latte', color: '#f5efe6', border: '#e6dac8' },
                      { name: 'Hijau Sage', color: '#f0fdf4', border: '#bbf7d0' },
                      { name: 'Soft Rose', color: '#fff1f2', border: '#fecdd3' },
                      { name: 'Amber Ceria', color: '#fef3c7', border: '#fde68a' },
                      { name: 'Mewah Charcoal', color: '#0f172a', border: '#334155' },
                    ].map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        className={`palette-preset-btn ${(storeDraft.backgroundColor || '#f8fafc') === preset.color ? 'active' : ''}`}
                        onClick={() => setStoreDraft({ ...storeDraft, backgroundColor: preset.color })}
                      >
                        <span
                          className="palette-swatch"
                          style={{
                            backgroundColor: preset.color,
                            border: `2px solid ${preset.border}`,
                          }}
                        />
                        <span className="palette-label">{preset.name}</span>
                        {(storeDraft.backgroundColor || '#f8fafc') === preset.color && <span className="palette-check">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label">Atau Pilih Warna Kustom Bebas</label>
                  <div className="custom-color-picker-row">
                    <input
                      type="color"
                      value={storeDraft.backgroundColor || '#f8fafc'}
                      onChange={(e) => setStoreDraft({ ...storeDraft, backgroundColor: e.target.value })}
                      className="color-picker-input"
                    />
                    <input
                      type="text"
                      value={storeDraft.backgroundColor || '#f8fafc'}
                      onChange={(e) => setStoreDraft({ ...storeDraft, backgroundColor: e.target.value })}
                      placeholder="#f8fafc"
                      className="form-input color-hex-input"
                    />
                    <button
                      type="button"
                      className="btn-color-reset"
                      onClick={() => setStoreDraft({ ...storeDraft, backgroundColor: '#f8fafc' })}
                      title="Kembalikan ke warna default"
                    >
                      Reset Default
                    </button>
                  </div>
                  <span className="input-hint">
                    Warna latar belakang ini akan langsung terlihat pada pratinjau di samping dan di halaman pembeli setelah disimpan.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="save-action-strip">
                <button
                  type="button"
                  className="btn-reset-draft"
                  onClick={() => setStoreDraft(store)}
                >
                  ↩️ Kembalikan Perubahan
                </button>
                <button type="submit" className="btn-save-personalization">
                  💾 Simpan Perubahan Toko
                </button>
              </div>
            </form>

            {/* Live Preview Column */}
            <div className="preview-column">
              <div className="preview-sticky-wrap">
                <div className="preview-header-bar">
                  <span className="live-dot"></span>
                  <span className="preview-title">Pratinjau Langsung Halaman Web</span>
                </div>

                {/* Mock Header Preview */}
                <div
                  className="mock-header-card"
                  style={{
                    backgroundColor: storeDraft.backgroundColor || '#ffffff',
                    transition: 'background-color 0.3s ease',
                  }}
                >
                  <div className="mock-banner-wrap">
                    <img
                      src={storeDraft.banner}
                      alt="Banner Preview"
                      className="mock-banner-img"
                    />
                    <div className="mock-banner-overlay" />
                  </div>

                  <div
                    className="mock-body-wrap"
                    style={{
                      backgroundColor: storeDraft.backgroundColor || '#ffffff',
                      color: storeDraft.backgroundColor === '#0f172a' ? '#f8fafc' : undefined,
                      transition: 'background-color 0.3s ease',
                    }}
                  >
                    <div className="mock-avatar-wrap">
                      <img
                        src={storeDraft.logo}
                        alt="Logo Preview"
                        className="mock-avatar-img"
                      />
                      <span className="mock-verified-badge">✓</span>
                    </div>

                    <div className="mock-status-row">
                      <span className={`mock-status-pill ${storeDraft.isOpen ? 'open' : 'closed'}`}>
                        {storeDraft.isOpen ? '🟢 Buka Sekarang' : '🔴 Tutup Sementara'}
                      </span>
                      <span className="mock-hours-pill">🕒 {storeDraft.openingHours || '09:00 - 21:00'}</span>
                    </div>

                    <h3 className="mock-store-name">{storeDraft.name || 'Nama Toko Anda'}</h3>
                    <p className="mock-tagline">{storeDraft.tagline || 'Slogan toko Anda akan muncul di sini'}</p>
                    <p className="mock-category">🏷️ {storeDraft.category}</p>
                    <p className="mock-address">📍 {storeDraft.address || 'Alamat toko'}</p>

                    {storeDraft.description && (
                      <p className="mock-description">{storeDraft.description}</p>
                    )}

                    <div className="mock-btn-row">
                      <a
                        href={`https://wa.me/${storeDraft.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mock-wa-btn"
                        onClick={(e) => e.preventDefault()}
                      >
                        💬 Chat WA
                      </a>
                      {storeDraft.googleMapsUrl && (
                        <a
                          href={storeDraft.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mock-maps-btn"
                          onClick={(e) => e.preventDefault()}
                        >
                          📍 Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="preview-note-box">
                  💡 <strong>Info:</strong> Perubahan di atas diperbarui secara langsung saat Anda mengetik atau memilih foto template. Klik <strong>Simpan Perubahan Toko</strong> untuk menerapkan ke website.
                </div>
              </div>
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
                <label className="form-label">Foto Menu Makanan / Produk</label>
                <ImageDropzone
                  value={formData.image}
                  onChange={(dataUrl) => setFormData({ ...formData, image: dataUrl })}
                  aspectRatio="product"
                  label="Unggah Foto Produk"
                  subLabel="Tarik & lepas foto produk ke sini, atau klik untuk memilih file"
                />
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

      {/* MODAL EDIT PRODUCT CARD */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span>✏️</span>
                <span>Edit Kartu Menu & Foto Produk</span>
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="modal-body">
              {editFormError && <div className="form-alert-error">{editFormError}</div>}

              <div className="form-group">
                <label className="form-label">Nama Menu / Produk *</label>
                <input
                  type="text"
                  placeholder="Cth: Ayam Gulai Pedas Gurih"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kategori Produk</label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
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
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Harga Coret / Asli (Opsional)</label>
                  <input
                    type="number"
                    placeholder="Cth: 30000"
                    value={editFormData.originalPrice}
                    onChange={(e) => setEditFormData({ ...editFormData, originalPrice: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi Menu</label>
                <textarea
                  placeholder="Jelaskan kelezatan atau porsi menu ini..."
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Foto Menu Makanan / Produk</label>
                <ImageDropzone
                  value={editFormData.image}
                  onChange={(dataUrl) => setEditFormData({ ...editFormData, image: dataUrl })}
                  aspectRatio="product"
                  label="Ganti Foto Produk"
                  subLabel="Tarik & lepas foto baru ke sini, atau klik untuk memilih file dari HP/komputer"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Badge Label (Opsional)</label>
                <input
                  type="text"
                  placeholder="Cth: Spesial Minggu Ini, Best Seller"
                  value={editFormData.badge}
                  onChange={(e) => setEditFormData({ ...editFormData, badge: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status Ketersediaan</label>
                <div className="status-toggle-card" style={{ marginTop: '4px' }}>
                  <div className="status-toggle-info">
                    <span className="toggle-title">
                      {editFormData.isAvailable ? '🟢 Menu Tersedia' : '🔴 Menu Sedang Habis'}
                    </span>
                    <span className="toggle-desc">
                      {editFormData.isAvailable
                        ? 'Pelanggan dapat memesan menu ini di etalase web.'
                        : 'Pelanggan tidak dapat memesan menu ini saat ini.'}
                    </span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={editFormData.isAvailable}
                      onChange={(e) => setEditFormData({ ...editFormData, isAvailable: e.target.checked })}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>

              <div className="modal-footer-strip">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-save-new">
                  Simpan Perubahan Menu
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

        .table-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-action-edit {
          background: #eff6ff;
          color: #2563eb;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid #bfdbfe;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-action-edit:hover {
          background: #dbeafe;
          border-color: #93c5fd;
          transform: translateY(-1px);
        }

        .btn-action-del {
          background: #fef2f2;
          color: #ef4444;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid #fecaca;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-action-del:hover {
          background: #fee2e2;
          border-color: #fca5a5;
          transform: translateY(-1px);
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

        .save-toast-banner {
          background: #ecfdf5;
          border: 1px solid #6ee7b7;
          color: #065f46;
          padding: 12px 18px;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 0.9rem;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: slideDown 0.3s ease;
        }

        .personalization-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
          align-items: flex-start;
        }

        @media (max-width: 992px) {
          .personalization-grid {
            grid-template-columns: 1fr;
          }
        }

        .settings-section-card {
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 22px;
          margin-bottom: 20px;
          box-shadow: var(--shadow-sm);
        }

        .section-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .card-badge-icon {
          font-size: 1.6rem;
          background: #f8fafc;
          padding: 8px;
          border-radius: 10px;
        }

        .section-card-header h4 {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
        }

        .section-card-header p {
          font-size: 0.78rem;
          color: #64748b;
        }

        .avatar-input-row {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .avatar-mini-preview {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #ea580c;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }

        .input-with-presets {
          flex: 1;
        }

        .banner-mini-preview-wrap {
          width: 100%;
          height: 120px;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 10px;
          border: 1px solid #e2e8f0;
        }

        .banner-mini-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preset-pills-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
        }

        .sample-pill-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.73rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sample-pill-btn:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }

        .sample-pill-btn.active {
          background: #fff7ed;
          border-color: #ea580c;
          color: #ea580c;
          font-weight: 700;
        }

        .form-textarea {
          resize: vertical;
          font-family: inherit;
        }

        .status-toggle-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          padding: 14px 18px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          margin-top: 14px;
        }

        .status-toggle-info {
          display: flex;
          flex-direction: column;
        }

        .toggle-title {
          font-size: 0.85rem;
          font-weight: 800;
          color: #0f172a;
        }

        .toggle-desc {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 2px;
        }

        /* Toggle Switch */
        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 28px;
          flex-shrink: 0;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: 0.3s;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: 0.3s;
        }

        input:checked + .slider {
          background-color: #10b981;
        }

        input:checked + .slider:before {
          transform: translateX(22px);
        }

        .slider.round {
          border-radius: 34px;
        }

        .slider.round:before {
          border-radius: 50%;
        }

        .wa-input-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .btn-test-wa {
          background: #25d366;
          color: white;
          padding: 9px 14px;
          border-radius: var(--radius-md);
          font-size: 0.78rem;
          font-weight: 700;
          white-space: nowrap;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .btn-test-wa:hover {
          background: #1eb754;
        }

        .input-hint {
          font-size: 0.72rem;
          color: #64748b;
          margin-top: 4px;
          display: block;
        }

        .save-action-strip {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          margin-bottom: 40px;
        }

        .btn-reset-draft {
          background: #f1f5f9;
          color: #475569;
          padding: 12px 20px;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-save-personalization {
          background: #ea580c;
          color: white;
          padding: 12px 28px;
          border-radius: var(--radius-full);
          font-size: 0.9rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(234, 88, 12, 0.3);
          transition: transform 0.2s;
        }

        .btn-save-personalization:hover {
          transform: translateY(-2px);
          background: #c2410c;
        }

        /* Mock Preview Column */
        .preview-sticky-wrap {
          position: sticky;
          top: 20px;
        }

        .preview-header-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .live-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: pulseDot 1.5s infinite;
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .preview-title {
          font-size: 0.85rem;
          font-weight: 800;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .mock-header-card {
          background: #ffffff;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-color);
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
        }

        .mock-banner-wrap {
          height: 140px;
          position: relative;
          background: #0f172a;
        }

        .mock-banner-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .mock-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent);
        }

        .mock-body-wrap {
          padding: 0 20px 20px;
          position: relative;
          margin-top: -40px;
          text-align: center;
        }

        .mock-avatar-wrap {
          width: 80px;
          height: 80px;
          margin: 0 auto 10px;
          position: relative;
        }

        .mock-avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 4px solid white;
          object-fit: cover;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .mock-verified-badge {
          position: absolute;
          bottom: 2px;
          right: 2px;
          background: #3b82f6;
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          font-size: 0.7rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        }

        .mock-status-row {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .mock-status-pill {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
        }

        .mock-status-pill.open {
          background: #ecfdf5;
          color: #059669;
        }

        .mock-status-pill.closed {
          background: #fef2f2;
          color: #dc2626;
        }

        .mock-hours-pill {
          background: #f1f5f9;
          color: #475569;
          font-size: 0.72rem;
          padding: 3px 10px;
          border-radius: 999px;
          font-weight: 600;
        }

        .mock-store-name {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .mock-tagline {
          font-size: 0.82rem;
          color: #ea580c;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .mock-category {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .mock-address {
          font-size: 0.78rem;
          color: #64748b;
          margin-bottom: 8px;
        }

        .mock-description {
          font-size: 0.78rem;
          color: #475569;
          background: #f8fafc;
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 12px;
          line-height: 1.4;
          text-align: left;
        }

        .mock-btn-row {
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .mock-wa-btn {
          background: #25d366;
          color: white;
          text-decoration: none;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 8px 14px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .mock-maps-btn {
          background: #3b82f6;
          color: white;
          text-decoration: none;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 8px 14px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .preview-note-box {
          margin-top: 14px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          font-size: 0.78rem;
          line-height: 1.4;
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

        /* Palette Presets & Color Picker */
        .theme-palette-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 10px;
          margin-top: 8px;
        }

        .palette-preset-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          color: #334155;
          transition: all 0.2s ease;
          position: relative;
        }

        .palette-preset-btn:hover {
          border-color: #94a3b8;
          transform: translateY(-1px);
        }

        .palette-preset-btn.active {
          border-color: var(--primary);
          background: #fff7ed;
          color: var(--primary);
          box-shadow: 0 0 0 1px var(--primary);
        }

        .palette-swatch {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .palette-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .palette-check {
          margin-left: auto;
          font-size: 0.75rem;
          font-weight: 800;
        }

        .custom-color-picker-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .color-picker-input {
          width: 44px;
          height: 40px;
          border-radius: 8px;
          border: 1.5px solid #cbd5e1;
          cursor: pointer;
          background: none;
          padding: 2px;
        }

        .color-hex-input {
          max-width: 130px;
          font-family: monospace;
          font-size: 0.85rem;
        }

        .btn-color-reset {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-color-reset:hover {
          background: #e2e8f0;
        }
      `}</style>
    </div>
  );
};
