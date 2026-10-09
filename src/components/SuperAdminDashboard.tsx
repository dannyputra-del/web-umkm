'use client';

import React, { useState } from 'react';
import { MerchantAccount, StoreInfo, Product } from '@/types';

interface SuperAdminDashboardProps {
  merchants: MerchantAccount[];
  allStores: Record<string, { store: StoreInfo; products: Product[] }>;
  onSelectStore: (slug: string, targetView: 'customer' | 'admin') => void;
  onAddMerchant: (merchant: MerchantAccount, newStore: StoreInfo, products: Product[]) => void;
  onDeleteMerchant: (slug: string) => void;
  onUpdateMerchantStatus: (slug: string, newStatus: 'active' | 'pending' | 'suspended', reason?: string) => void;
  onBackToCustomer: () => void;
  onGoToAuth: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  merchants,
  allStores,
  onSelectStore,
  onAddMerchant,
  onDeleteMerchant,
  onUpdateMerchantStatus,
  onBackToCustomer,
  onGoToAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Status Management Modal State
  const [statusModalMerchant, setStatusModalMerchant] = useState<MerchantAccount | null>(null);
  const [targetStatus, setTargetStatus] = useState<'active' | 'pending' | 'suspended'>('active');
  const [statusReasonCategory, setStatusReasonCategory] = useState<string>('Masa Langganan Habis / Perlu Perpanjangan');
  const [customReasonText, setCustomReasonText] = useState<string>('');

  const handleOpenStatusModal = (merchant: MerchantAccount) => {
    setStatusModalMerchant(merchant);
    setTargetStatus(merchant.status);
    setStatusReasonCategory(merchant.statusReason || 'Masa Langganan Habis / Perlu Perpanjangan');
    setCustomReasonText(merchant.statusReason || '');
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalMerchant) return;
    const finalReason = statusReasonCategory === 'Lainnya (Kustom)' ? customReasonText.trim() : statusReasonCategory;
    onUpdateMerchantStatus(statusModalMerchant.storeSlug, targetStatus, finalReason);
    setStatusModalMerchant(null);
  };

  const handleQuickStatusChange = (
    merchant: MerchantAccount,
    newStatus: 'active' | 'pending' | 'suspended',
    defaultReason?: string
  ) => {
    onUpdateMerchantStatus(merchant.storeSlug, newStatus, defaultReason);
  };

  // Manual Add Merchant State
  const [manualForm, setManualForm] = useState({
    ownerName: '',
    phone: '',
    storeName: '',
    storeSlug: '',
    category: 'Kuliner & Makanan Basah',
  });
  const [manualError, setManualError] = useState('');

  // Total products across all stores
  const totalProductsCount = Object.values(allStores).reduce(
    (sum, data) => sum + (data.products?.length || 0),
    0
  );

  const categories = [
    'Semua',
    'Kuliner & Makanan Basah',
    'Kedai Kopi & Minuman Kekinian',
    'Fashion, Busana & Aksesoris',
  ];

  const filteredMerchants = merchants.filter((m) => {
    const matchSearch =
      m.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.storeSlug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory =
      categoryFilter === 'Semua' || m.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');

    if (!manualForm.ownerName.trim() || !manualForm.storeName.trim() || !manualForm.storeSlug.trim()) {
      setManualError('Semua kolom bertanda * wajib diisi!');
      return;
    }

    const cleanSlug = manualForm.storeSlug.trim().toLowerCase();
    if (merchants.some((m) => m.storeSlug.toLowerCase() === cleanSlug)) {
      setManualError(`Slug "${cleanSlug}" sudah dipakai oleh toko lain.`);
      return;
    }

    const newMerchant: MerchantAccount = {
      id: 'merch-' + Date.now(),
      ownerName: manualForm.ownerName.trim(),
      phone: manualForm.phone.trim() || '08123456789',
      storeSlug: cleanSlug,
      storeName: manualForm.storeName.trim(),
      category: manualForm.category,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
    };

    const newStore: StoreInfo = {
      name: manualForm.storeName.trim(),
      tagline: `Produk Pilihan Terbaik dari ${manualForm.storeName.trim()}`,
      description: `Selamat datang di etalase resmi ${manualForm.storeName.trim()}`,
      category: manualForm.category,
      address: 'Alamat toko (dapat diubah di Dashboard Toko)',
      phone: manualForm.phone.trim() || '08123456789',
      whatsapp: '62' + manualForm.phone.replace(/\D/g, '').replace(/^0/, ''),
      isOpen: true,
      openingHours: '08:00 - 21:00 WIB',
      logo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
      backgroundColor: '#f8fafc',
      slug: cleanSlug,
      ownerName: manualForm.ownerName.trim(),
    };

    const sampleProd: Product = {
      id: 'prod-' + Date.now(),
      name: 'Produk Contoh ' + manualForm.storeName.trim(),
      category: 'Lauk Utama',
      price: 25000,
      description: 'Deskripsi menu produk unggulan toko.',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      rating: 5.0,
      salesCount: 1,
      isAvailable: true,
    };

    onAddMerchant(newMerchant, newStore, [sampleProd]);
    setIsAddModalOpen(false);
    setManualForm({
      ownerName: '',
      phone: '',
      storeName: '',
      storeSlug: '',
      category: 'Kuliner & Makanan Basah',
    });
  };

  return (
    <div className="superadmin-container">
      {/* Top Banner Header */}
      <div className="superadmin-header-strip">
        <div className="header-info-box">
          <span className="crown-badge">👑</span>
          <div>
            <h2>Dashboard Super Admin (Pemilik Platform)</h2>
            <p>
              Pantau seluruh mitra UMKM yang mendaftar, link etalase web toko, dan kelola akses dashboard.
            </p>
          </div>
        </div>

        <div className="header-nav-buttons">
          <button className="btn-header-link" onClick={onGoToAuth}>
            🔐 Halaman Login / Daftar UMKM
          </button>
          <button className="btn-header-link active-link" onClick={onBackToCustomer}>
            👁️ Lihat Web Pembeli
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-row">
        <div className="metric-box">
          <span className="metric-icon">🏪</span>
          <div className="metric-content">
            <span className="metric-num">{merchants.length} Mitra</span>
            <span className="metric-label">Total UMKM Terdaftar</span>
          </div>
        </div>

        <div className="metric-box">
          <span className="metric-icon">🍽️</span>
          <div className="metric-content">
            <span className="metric-num">{totalProductsCount} Produk</span>
            <span className="metric-label">Total Kartu Menu Aktif</span>
          </div>
        </div>

        <div className="metric-box">
          <span className="metric-icon">🟢</span>
          <div className="metric-content">
            <span className="metric-num">{merchants.filter((m) => m.status === 'active').length} Toko</span>
            <span className="metric-label">Toko Status Aktif</span>
          </div>
        </div>
      </div>

      {/* Search, Filter & Action Bar */}
      <div className="action-bar-strip">
        <div className="search-filter-left">
          <div className="search-input-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Cari nama toko, pemilik, atau slug URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-chips">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-chip-btn ${categoryFilter === cat ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn-add-merchant"
          onClick={() => setIsAddModalOpen(true)}
        >
          <span>➕ Daftarkan Mitra Manual</span>
        </button>
      </div>

      {/* Merchants Table */}
      <div className="table-wrapper-card">
        <table className="superadmin-table">
          <thead>
            <tr>
              <th>Nama Toko UMKM</th>
              <th>Pemilik & WhatsApp</th>
              <th>Alamat URL Web (Slug)</th>
              <th style={{ minWidth: '220px' }}>Status & Tindakan Toko</th>
              <th style={{ minWidth: '180px' }}>Akses & Pengelolaan</th>
            </tr>
          </thead>
          <tbody>
            {filteredMerchants.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-table-cell">
                  <span>🔍</span>
                  <p>Tidak ada mitra UMKM yang cocok dengan pencarian.</p>
                </td>
              </tr>
            ) : (
              filteredMerchants.map((m) => {
                const storeData = allStores[m.storeSlug]?.store;
                const prodCount = allStores[m.storeSlug]?.products?.length || 0;

                return (
                  <tr key={m.id}>
                    {/* Toko Cell */}
                    <td>
                      <div className="store-cell">
                        <img
                          src={storeData?.logo || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80'}
                          alt={m.storeName}
                          className="store-logo-thumb"
                        />
                        <div>
                          <strong className="store-cell-title">{m.storeName}</strong>
                          <span className="store-cell-cat">{m.category}</span>
                          <span className="store-cell-prod-count">📦 {prodCount} menu</span>
                        </div>
                      </div>
                    </td>

                    {/* Owner & WA Cell */}
                    <td>
                      <div className="owner-cell">
                        <strong className="owner-name">{m.ownerName}</strong>
                        <a
                          href={`https://wa.me/${m.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="owner-wa-link"
                        >
                          💬 {m.phone}
                        </a>
                        <span className="owner-date">Terdaftar: {m.createdAt}</span>
                      </div>
                    </td>

                    {/* Slug URL Cell */}
                    <td>
                      <div className="slug-cell">
                        <div className="slug-badge">
                          <span>?store=</span>
                          <strong>{m.storeSlug}</strong>
                        </div>
                        <button
                          type="button"
                          className="btn-copy-link"
                          onClick={() => {
                            const fullUrl = `${window.location.origin}${window.location.pathname}?store=${m.storeSlug}`;
                            navigator.clipboard?.writeText(fullUrl);
                            alert(`Link toko berhasil disalin:\n${fullUrl}`);
                          }}
                          title="Salin Link Toko"
                        >
                          📋 Salin Link Web
                        </button>
                      </div>
                    </td>

                    {/* Status & Quick Action Cell */}
                    <td>
                      <div className="status-cell-wrapper">
                        <div className="status-badge-row">
                          <span className={`status-pill ${m.status}`}>
                            {m.status === 'active' && '🟢 Aktif (Tayang)'}
                            {m.status === 'pending' && '🟡 Menunggu Konfirmasi'}
                            {m.status === 'suspended' && '🔴 Dinonaktifkan'}
                          </span>
                        </div>

                        {/* Subscription & Reason Info */}
                        <div className="sub-plan-row">
                          <span className="sub-plan-badge">
                            💳 {m.subscriptionPlan || 'Paket UMKM'}
                          </span>
                          <span className="sub-expiry-text">
                            {m.subscriptionExpiry ? `s.d. ${m.subscriptionExpiry}` : 'Aktif'}
                          </span>
                        </div>

                        {m.statusReason && (
                          <div className="status-reason-chip" title={m.statusReason}>
                            <span>📌</span>
                            <span className="status-reason-text">{m.statusReason}</span>
                          </div>
                        )}

                        {/* Action buttons for status */}
                        <div className="status-actions-group">
                          {m.status === 'pending' && (
                            <button
                              type="button"
                              className="btn-quick-status btn-status-approve"
                              onClick={() => handleQuickStatusChange(m, 'active')}
                              title="Setujui dan Aktifkan Toko Ini"
                            >
                              ✓ Konfirmasi
                            </button>
                          )}
                          {m.status === 'active' && (
                            <button
                              type="button"
                              className="btn-quick-status btn-status-suspend"
                              onClick={() => handleOpenStatusModal(m)}
                              title="Nonaktifkan Toko Ini (Masa Berlangganan/TOS)"
                            >
                              ⛔ Nonaktifkan
                            </button>
                          )}
                          {m.status === 'suspended' && (
                            <button
                              type="button"
                              className="btn-quick-status btn-status-reactivate"
                              onClick={() => handleQuickStatusChange(m, 'active')}
                              title="Aktifkan Kembali Toko Ini"
                            >
                              🔄 Aktifkan
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-quick-status btn-status-settings"
                            onClick={() => handleOpenStatusModal(m)}
                            title="Buka Pengaturan Status & Langganan Toko"
                          >
                            ⚙️ Kelola
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Navigation & Management Cell */}
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-action btn-view-customer"
                          onClick={() => onSelectStore(m.storeSlug, 'customer')}
                          title="Lihat Tampilan Web Pembeli Toko Ini"
                        >
                          👁️ Etalase
                        </button>

                        <button
                          className="btn-action btn-manage-admin"
                          onClick={() => onSelectStore(m.storeSlug, 'admin')}
                          title="Buka Dashboard Pengelolaan Toko Ini"
                        >
                          🛠️ Dashboard
                        </button>

                        {merchants.length > 1 && (
                          <button
                            className="btn-action btn-del-merchant"
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus mitra "${m.storeName}" dari platform?`)) {
                                onDeleteMerchant(m.storeSlug);
                              }
                            }}
                            title="Hapus Toko Ini"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL MANUAL ADD MERCHANT */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span>➕</span>
                <span>Daftarkan Mitra UMKM Baru (Super Admin)</span>
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="modal-body">
              {manualError && <div className="form-alert-error">{manualError}</div>}

              <div className="form-group">
                <label className="form-label">Nama Lengkap Pemilik Usaha *</label>
                <input
                  type="text"
                  placeholder="Cth: Ibu Suryani"
                  value={manualForm.ownerName}
                  onChange={(e) => setManualForm({ ...manualForm, ownerName: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nomor WhatsApp *</label>
                <input
                  type="tel"
                  placeholder="Cth: 08123456789"
                  value={manualForm.phone}
                  onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nama Toko UMKM *</label>
                <input
                  type="text"
                  placeholder="Cth: Pempek Palembang Asli"
                  value={manualForm.storeName}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoSlug = val
                      .toLowerCase()
                      .replace(/[^\w\s-]/g, '')
                      .trim()
                      .replace(/\s+/g, '-');
                    setManualForm({
                      ...manualForm,
                      storeName: val,
                      storeSlug: autoSlug,
                    });
                  }}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alamat URL Web (Slug Toko) *</label>
                <div className="slug-input-row">
                  <span>?store=</span>
                  <input
                    type="text"
                    placeholder="pempek-palembang"
                    value={manualForm.storeSlug}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        storeSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      })
                    }
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Kategori Usaha</label>
                <select
                  value={manualForm.category}
                  onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                  className="form-select"
                >
                  <option value="Kuliner & Makanan Basah">Kuliner & Makanan Basah</option>
                  <option value="Kedai Kopi & Minuman Kekinian">Kedai Kopi & Minuman Kekinian</option>
                  <option value="Fashion, Busana & Aksesoris">Fashion, Busana & Aksesoris</option>
                </select>
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
                  Daftarkan Toko Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KELOLA STATUS TOKO (SUPER ADMIN) */}
      {statusModalMerchant && (
        <div className="modal-overlay" onClick={() => setStatusModalMerchant(null)}>
          <div className="modal-sheet modal-status-manage" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-desc">
                <h3 className="modal-title">
                  <span>🛡️</span>
                  <span>Kelola Status & Akses Toko</span>
                </h3>
                <p className="modal-subtitle">
                  Atur status tayang etalase web dan kelola hak akses mitra <strong>{statusModalMerchant.storeName}</strong>
                </p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setStatusModalMerchant(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="modal-body">
              {/* Store Summary Card */}
              <div className="store-summary-card">
                <div className="summary-left">
                  <strong className="summary-name">{statusModalMerchant.storeName}</strong>
                  <span className="summary-slug">🔗 ?store={statusModalMerchant.storeSlug}</span>
                  <span className="summary-owner">👤 {statusModalMerchant.ownerName} ({statusModalMerchant.phone})</span>
                </div>
                <div className="summary-right">
                  <span className={`status-pill ${statusModalMerchant.status}`}>
                    {statusModalMerchant.status === 'active' && '🟢 Aktif Saat Ini'}
                    {statusModalMerchant.status === 'pending' && '🟡 Menunggu Konfirmasi'}
                    {statusModalMerchant.status === 'suspended' && '🔴 Sedang Nonaktif'}
                  </span>
                </div>
              </div>

              {/* Status Radio Tiles */}
              <div className="form-group">
                <label className="form-label">Tentukan Status Operasional Toko</label>
                <div className="status-radio-grid">
                  <label className={`status-radio-card ${targetStatus === 'active' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="storeStatus"
                      value="active"
                      checked={targetStatus === 'active'}
                      onChange={() => setTargetStatus('active')}
                    />
                    <div className="radio-card-content">
                      <div className="radio-card-header">
                        <span className="radio-emoji">🟢</span>
                        <strong>Aktif (Live & Tayang)</strong>
                      </div>
                      <p>Toko beroperasi penuh. Pelanggan bebas menjelajah menu dan melakukan checkout pesanan.</p>
                    </div>
                  </label>

                  <label className={`status-radio-card ${targetStatus === 'pending' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="storeStatus"
                      value="pending"
                      checked={targetStatus === 'pending'}
                      onChange={() => setTargetStatus('pending')}
                    />
                    <div className="radio-card-content">
                      <div className="radio-card-header">
                        <span className="radio-emoji">🟡</span>
                        <strong>Menunggu Konfirmasi</strong>
                      </div>
                      <p>Toko masih dalam antrean verifikasi platform sebelum siap diluncurkan ke pembeli.</p>
                    </div>
                  </label>

                  <label className={`status-radio-card ${targetStatus === 'suspended' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="storeStatus"
                      value="suspended"
                      checked={targetStatus === 'suspended'}
                      onChange={() => setTargetStatus('suspended')}
                    />
                    <div className="radio-card-content">
                      <div className="radio-card-header">
                        <span className="radio-emoji">🔴</span>
                        <strong>Nonaktifkan Toko</strong>
                      </div>
                      <p>Masa langganan habis atau sedang rehat. Pelanggan diarahkan ke tampilan santun & persuasif.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Reason Selector */}
              <div className="form-group">
                <label className="form-label">
                  Alasan / Catatan Tindakan Super Admin
                </label>
                <select
                  value={statusReasonCategory}
                  onChange={(e) => setStatusReasonCategory(e.target.value)}
                  className="form-select"
                >
                  <option value="Masa Langganan Habis / Perlu Perpanjangan">
                    💳 Masa Langganan Habis (Perlu Perpanjangan)
                  </option>
                  <option value="Rehat Sementara / Peningkatan Kualitas Menu">
                    ☕ Rehat Sementara / Peningkatan Kualitas Layanan
                  </option>
                  <option value="Pemeriksaan Kebijakan & Penyesuaian TOS">
                    📋 Pemeriksaan Kebijakan & Penyesuaian TOS
                  </option>
                  <option value="Permintaan Khusus dari Pemilik Toko">
                    🤝 Permintaan Khusus dari Pemilik Toko
                  </option>
                  <option value="Lainnya (Kustom)">
                    ✍️ Alasan Lainnya (Kustom)
                  </option>
                </select>

                {statusReasonCategory === 'Lainnya (Kustom)' && (
                  <textarea
                    rows={2}
                    placeholder="Tuliskan catatan khusus admin di sini..."
                    value={customReasonText}
                    onChange={(e) => setCustomReasonText(e.target.value)}
                    className="form-input"
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>

              {/* Brand Protection Notice (Persuasive & Brand Safe) */}
              <div className="brand-protection-notice">
                <span className="shield-icon">🛡️</span>
                <div className="protection-text">
                  <strong>Jaminan Melindungi Citra & Reputasi Brand UMKM:</strong>
                  <p>
                    Ketika toko dinonaktifkan, URL web toko yang diakses pelanggan <em>TIDAK</em> akan menampilkan tulisan negatif atau memalukan. Sistem akan menampilkan pemberitahuan ramah (<em>"Layanan Sedang Rehat Sementara untuk Peningkatan Kualitas"</em>) lengkap dengan tombol kontak WhatsApp langsung ke penjual.
                  </p>
                </div>
              </div>

              <div className="modal-footer-strip">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setStatusModalMerchant(null)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-save-new">
                  Simpan Perubahan Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      <style jsx>{`
        .superadmin-container {
          padding: 24px 20px;
          background: #f8fafc;
          min-height: 85vh;
        }

        .superadmin-header-strip {
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
          gap: 14px;
        }

        .header-info-box {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .crown-badge {
          font-size: 2.2rem;
          background: #fdf4ff;
          width: 54px;
          height: 54px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.15);
        }

        .header-info-box h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .header-info-box p {
          font-size: 0.8rem;
          color: #64748b;
        }

        .header-nav-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn-header-link {
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #cbd5e1;
          padding: 9px 16px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-header-link:hover {
          background: #e2e8f0;
        }

        .btn-header-link.active-link {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        /* Metrics */
        .metrics-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .metric-box {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: var(--shadow-sm);
        }

        .metric-icon {
          font-size: 1.8rem;
          background: #f8fafc;
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-content {
          display: flex;
          flex-direction: column;
        }

        .metric-num {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
        }

        .metric-label {
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 600;
        }

        /* Action bar */
        .action-bar-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .search-filter-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          flex: 1;
        }

        .search-input-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1.5px solid #cbd5e1;
          border-radius: var(--radius-full);
          padding: 8px 16px;
          width: 100%;
          max-width: 340px;
        }

        .search-input {
          border: none;
          outline: none;
          font-size: 0.82rem;
          width: 100%;
          color: #0f172a;
        }

        .filter-chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .filter-chip-btn {
          background: white;
          border: 1px solid #cbd5e1;
          color: #475569;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-chip-btn:hover {
          border-color: #94a3b8;
        }

        .filter-chip-btn.active {
          background: #0f172a;
          color: white;
          border-color: #0f172a;
        }

        .btn-add-merchant {
          background: var(--accent-green);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
          transition: all 0.2s ease;
        }

        .btn-add-merchant:hover {
          background: #047857;
          transform: translateY(-1px);
        }

        /* Table */
        .table-wrapper-card {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
          overflow-x: auto;
        }

        .superadmin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .superadmin-table th {
          text-align: left;
          padding: 14px 16px;
          background: #f8fafc;
          color: #475569;
          font-weight: 700;
          border-bottom: 1.5px solid #e2e8f0;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .superadmin-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .store-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .store-logo-thumb {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid #e2e8f0;
        }

        .store-cell-title {
          display: block;
          color: #0f172a;
          font-size: 0.9rem;
        }

        .store-cell-cat {
          display: block;
          font-size: 0.72rem;
          color: #64748b;
        }

        .store-cell-prod-count {
          display: inline-block;
          font-size: 0.7rem;
          color: var(--primary);
          font-weight: 700;
          background: #fff7ed;
          padding: 2px 6px;
          border-radius: 4px;
          margin-top: 2px;
        }

        .owner-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .owner-name {
          color: #0f172a;
          font-size: 0.85rem;
        }

        .owner-wa-link {
          color: #16a34a;
          font-size: 0.75rem;
          font-weight: 600;
          text-decoration: none;
        }

        .owner-wa-link:hover {
          text-decoration: underline;
        }

        .owner-date {
          font-size: 0.7rem;
          color: #94a3b8;
        }

        .slug-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .slug-badge {
          font-family: monospace;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.78rem;
          color: #334155;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          width: fit-content;
        }

        .btn-copy-link {
          background: none;
          border: none;
          color: #2563eb;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
          padding: 0;
        }

        .btn-copy-link:hover {
          text-decoration: underline;
        }

        .status-cell-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .status-badge-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.73rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .status-pill.active {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .status-pill.pending {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }

        .status-pill.suspended {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .sub-plan-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          flex-wrap: wrap;
        }

        .sub-plan-badge {
          background: #f1f5f9;
          color: #334155;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .sub-expiry-text {
          color: #64748b;
          font-size: 0.7rem;
        }

        .status-reason-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #fff1f2;
          border: 1px solid #ffe4e6;
          color: #be123c;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.7rem;
          max-width: 220px;
        }

        .status-reason-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-actions-group {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 2px;
          flex-wrap: wrap;
        }

        .btn-quick-status {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s ease;
        }

        .btn-status-approve {
          background: #dcfce7;
          color: #15803d;
          border-color: #86efac;
        }

        .btn-status-approve:hover {
          background: #bbf7d0;
        }

        .btn-status-suspend {
          background: #fee2e2;
          color: #b91c1c;
          border-color: #fca5a5;
        }

        .btn-status-suspend:hover {
          background: #fecaca;
        }

        .btn-status-reactivate {
          background: #e0e7ff;
          color: #4338ca;
          border-color: #c7d2fe;
        }

        .btn-status-reactivate:hover {
          background: #c7d2fe;
        }

        .btn-status-settings {
          background: #f8fafc;
          color: #475569;
          border-color: #cbd5e1;
        }

        .btn-status-settings:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .table-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-action {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-view-customer {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .btn-view-customer:hover {
          background: #dbeafe;
        }

        .btn-manage-admin {
          background: #fff7ed;
          color: var(--primary);
          border: 1px solid #fed7aa;
        }

        .btn-manage-admin:hover {
          background: #ffedd5;
        }

        .btn-del-merchant {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fecaca;
        }

        .btn-del-merchant:hover {
          background: #fee2e2;
        }

        /* Modal Status Specific Styles */
        .modal-status-manage {
          max-width: 580px;
        }

        .modal-title-with-desc h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-subtitle {
          margin: 4px 0 0 0;
          font-size: 0.78rem;
          color: #64748b;
        }

        .store-summary-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-md);
          padding: 12px 16px;
          margin-bottom: 16px;
        }

        .summary-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .summary-name {
          color: #0f172a;
          font-size: 0.95rem;
        }

        .summary-slug {
          font-family: monospace;
          font-size: 0.75rem;
          color: #2563eb;
        }

        .summary-owner {
          font-size: 0.72rem;
          color: #64748b;
        }

        .status-radio-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .status-radio-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .status-radio-card:hover {
          border-color: #cbd5e1;
          background: #fafafa;
        }

        .status-radio-card.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .status-radio-card input[type="radio"] {
          margin-top: 3px;
          cursor: pointer;
          accent-color: #2563eb;
        }

        .radio-card-content {
          flex: 1;
        }

        .radio-card-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
        }

        .radio-card-header strong {
          font-size: 0.85rem;
          color: #0f172a;
        }

        .radio-card-content p {
          font-size: 0.74rem;
          color: #64748b;
          margin: 0;
          line-height: 1.35;
        }

        .brand-protection-notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          margin-top: 14px;
        }

        .shield-icon {
          font-size: 1.4rem;
        }

        .protection-text strong {
          display: block;
          font-size: 0.78rem;
          color: #065f46;
          margin-bottom: 2px;
        }

        .protection-text p {
          margin: 0;
          font-size: 0.72rem;
          color: #047857;
          line-height: 1.4;
        }

        .empty-table-cell {
          text-align: center;
          padding: 40px 20px;
          color: #94a3b8;
        }

        .empty-table-cell span {
          font-size: 2rem;
          display: block;
          margin-bottom: 8px;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .modal-sheet {
          background: white;
          width: 100%;
          max-width: 480px;
          border-radius: var(--radius-lg);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-close-btn {
          background: none;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          color: #64748b;
        }

        .modal-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 14px;
        }

        .form-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 9px 12px;
          border-radius: 8px;
          border: 1.5px solid #cbd5e1;
          font-size: 0.85rem;
          font-family: inherit;
          outline: none;
        }

        .slug-input-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: monospace;
          font-size: 0.82rem;
          color: #64748b;
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
          border: none;
          padding: 9px 16px;
          border-radius: var(--radius-full);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-save-new {
          background: var(--accent-green);
          color: white;
          border: none;
          padding: 9px 18px;
          border-radius: var(--radius-full);
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};
