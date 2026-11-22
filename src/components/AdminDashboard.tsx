'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product, StoreInfo, Order } from '@/types';
import { ImageDropzone } from './ImageDropzone';
import { buatNamaFileUnik } from '@/lib/storageService';
import { deleteProductFromSupabase, updateOrderStatusInSupabase } from '@/lib/supabaseService';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';

// Guard yang didaftarkan dashboard ke halaman (page.tsx) supaya pindah mode
// bisa dicek dulu: ada perubahan belum disimpan atau tidak, dan kalau ada,
// halaman bisa minta dashboard menyimpan / membuang perubahan itu.
export interface AdminDashboardGuard {
  hasUnsavedChanges: () => boolean;
  saveUnsavedChanges: () => Promise<boolean>;
  discardUnsavedChanges: () => void;
}

export type ToastKind = 'success' | 'error';

// Isian kosong form tambah produk — dipakai untuk isi awal, reset, dan
// penanda dirty (form dianggap berubah bila isinya beda dari ini).
const EMPTY_PRODUCT_FORM = {
  name: '',
  category: 'Lauk Utama',
  price: '',
  originalPrice: '',
  description: '',
  image: '',
  badge: '',
  isAvailable: true,
  stock: '10',
};

const productToEditForm = (prod: Product) => ({
  name: prod.name,
  category: prod.category,
  price: prod.price.toString(),
  originalPrice: prod.originalPrice ? prod.originalPrice.toString() : '',
  description: prod.description || '',
  image: prod.image || '',
  badge: prod.badge || '',
  isAvailable: prod.isAvailable,
  stock: (prod.stock ?? 10).toString(),
});

interface AdminDashboardProps {
  store: StoreInfo;
  onUpdateStore: (store: StoreInfo) => void | boolean | Promise<boolean>;
  products: Product[];
  onAddProduct: (newProduct: Product) => void | boolean | Promise<boolean>;
  onUpdateProduct?: (product: Product) => void | boolean | Promise<boolean>;
  onDeleteProduct: (id: string) => void;
  onToggleAvailability: (id: string) => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onSwitchToCustomerView: () => void;
  // Popup kecil sukses/gagal — ditampilkan halaman supaya tetap terlihat
  // walau pemilik pindah mode sesudah simpan.
  notify: (kind: ToastKind, message: string) => void;
  guardRef?: { current: AdminDashboardGuard | null };
  onDirtyChange?: (dirty: boolean) => void;
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
  notify,
  guardRef,
  onDirtyChange,
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
    stock: '10',
  });
  const [editFormError, setEditFormError] = useState('');

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setEditFormData(productToEditForm(prod));
    setEditFormError('');
    setIsEditModalOpen(true);
  };

  // Simpan edit produk: TUNGGU Supabase dulu (lewat onUpdateProduct).
  // Popup sukses hanya bila simpan benar-benar berhasil; bila gagal, modal
  // tetap terbuka dan muncul popup error. Dipakai juga oleh dialog
  // "Perubahan belum disimpan" supaya jalurnya satu.
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const saveEditProduct = async (): Promise<boolean> => {
    setEditFormError('');
    if (!editFormData.name.trim() || !editFormData.price.trim()) {
      setEditFormError('Nama menu dan harga wajib diisi!');
      return false;
    }

    const priceNum = parseInt(editFormData.price, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      setEditFormError('Harga harus berupa angka valid!');
      return false;
    }

    let originalPriceNum: number | undefined;
    if (editFormData.originalPrice.trim()) {
      originalPriceNum = parseFloat(editFormData.originalPrice);
      if (isNaN(originalPriceNum)) {
        setEditFormError('Harga coret harus berupa angka valid!');
        return false;
      }
      if (originalPriceNum <= priceNum) {
        setEditFormError('Harga coret harus lebih besar dari harga jual!');
        return false;
      }
    }

    const stockNum = parseInt(editFormData.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setEditFormError('Stok harus berupa angka 0 atau lebih!');
      return false;
    }

    if (!editingProductId) return false;

    const original = products.find((p) => p.id === editingProductId);
    const updatedProd: Product = {
      id: editingProductId,
      name: editFormData.name.trim(),
      category: editFormData.category,
      price: priceNum,
      originalPrice: originalPriceNum,
      description: editFormData.description.trim() || 'Menu lezat pilihan dari ' + store.name,
      image: editFormData.image.trim() || (original?.image || '/images/placeholder.jpg'),
      badge: editFormData.badge.trim() || undefined,
      rating: original?.rating ?? 0,
      salesCount: original?.salesCount ?? 0,
      isAvailable: editFormData.isAvailable,
      stock: stockNum,
    };

    if (!onUpdateProduct) return false;
    setIsSavingProduct(true);
    let hasil: unknown;
    try {
      hasil = await onUpdateProduct(updatedProd);
    } catch {
      hasil = false;
    }
    setIsSavingProduct(false);
    if (hasil !== true) {
      notify('error', 'Gagal menyimpan perubahan menu ke Supabase. Perubahan belum tersimpan, coba lagi.');
      return false;
    }
    setIsEditModalOpen(false);
    setEditingProductId(null);
    notify('success', 'Perubahan telah disimpan');
    return true;
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveEditProduct();
  };

  // Store Personalization Draft State
  const [storeDraft, setStoreDraft] = useState<StoreInfo>(store);
  const [isSavingStore, setIsSavingStore] = useState(false);

  // Draf ikut data toko terbaru: bila data Supabase datang belakangan dan
  // prop store berubah apa pun isinya, isi ulang draf supaya tidak basi.
  useEffect(() => {
    setStoreDraft(store);
  }, [store]);

  const storeCategories = [
    'Kuliner & Makanan Basah',
    'Kedai Kopi & Minuman Kekinian',
    'Roti, Kue & Patisserie',
    'Fashion, Busana & Aksesoris',
    'Kerajinan Tangan & Suvenir',
    'Sembako & Kebutuhan Rumah Tangga',
    'Kecantikan & Herbal',
  ];

  const validateStoreDraft = (draft: StoreInfo): string => {
    const phoneRe = /^(\+62|62|0)8[0-9]{7,12}$/;
    const bersihkan = (v: string) => v.replace(/[\s-]/g, '');
    if (draft.whatsapp.trim() && !phoneRe.test(bersihkan(draft.whatsapp))) {
      return 'Nomor WhatsApp tidak valid. Pakai format Indonesia, contoh 081234567890 atau 6281234567890.';
    }
    if (draft.phone.trim() && !phoneRe.test(bersihkan(draft.phone))) {
      return 'Nomor telepon tidak valid. Pakai format Indonesia, contoh 081234567890.';
    }
    if (draft.googleMapsUrl && draft.googleMapsUrl.trim() && !draft.googleMapsUrl.trim().startsWith('http')) {
      return 'Link Google Maps harus diawali http:// atau https://.';
    }
    if (!draft.openingHours.trim() || !draft.openingHours.includes('-')) {
      return 'Jam buka wajib diisi dengan format "HH:MM - HH:MM WIB", contoh 08:00 - 21:00 WIB.';
    }
    return '';
  };

  // Simpan profil toko: TUNGGU Supabase dulu (lewat onUpdateStore).
  // Popup sukses ("Perubahan telah disimpan") hanya bila simpan benar-benar
  // berhasil; bila gagal, muncul popup error dan draf tetap dianggap belum
  // tersimpan. Dipakai juga oleh dialog "Perubahan belum disimpan" supaya
  // jalurnya satu dengan tombol Simpan biasa.
  const saveStoreDraft = async (): Promise<boolean> => {
    const err = validateStoreDraft(storeDraft);
    if (err) {
      notify('error', err);
      return false;
    }
    setIsSavingStore(true);
    let hasil: unknown;
    try {
      hasil = await onUpdateStore(storeDraft);
    } catch {
      hasil = false;
    }
    setIsSavingStore(false);
    if (hasil !== true) {
      notify('error', 'Gagal menyimpan ke Supabase. Perubahan belum tersimpan di cloud. Coba lagi.');
      return false;
    }
    notify('success', 'Perubahan telah disimpan');
    return true;
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveStoreDraft();
  };

  // Rekening bank toko (bankAccounts): tambah / ubah / hapus baris
  const updateBankAccount = (idx: number, field: 'bank' | 'account' | 'holder', value: string) => {
    const list = [...(storeDraft.bankAccounts ?? [])];
    list[idx] = { ...list[idx], [field]: value };
    setStoreDraft({ ...storeDraft, bankAccounts: list });
  };

  const addBankAccount = () => {
    setStoreDraft({
      ...storeDraft,
      bankAccounts: [...(storeDraft.bankAccounts ?? []), { bank: '', account: '', holder: '' }],
    });
  };

  const removeBankAccount = (idx: number) => {
    setStoreDraft({
      ...storeDraft,
      bankAccounts: (storeDraft.bankAccounts ?? []).filter((_, i) => i !== idx),
    });
  };

  // Hapus produk: TUNGGU Supabase dulu. Bila gagal, produk TETAP di daftar.
  const [deleteError, setDeleteError] = useState('');
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus kartu menu "${name}"?`)) return;
    setDeleteError('');
    const ok = await deleteProductFromSupabase(id);
    if (!ok) {
      setDeleteError(`Gagal menghapus "${name}" dari Supabase. Produk tetap ada di daftar, coba lagi.`);
      return;
    }
    onDeleteProduct(id);
  };

  // Pesanan: saring seed contoh keluar dari daftar & metrik, lalu hitung
  // metrik "Hari Ini" hanya dari order hari ini (tanggal lokal) yang tidak
  // dibatalkan / ditolak.
  const visibleOrders = orders.filter((o) => o.id !== 'ord-init-1');

  const isToday = (createdAt: string): boolean => {
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return true; // format jam saja (mis. "12:45 WIB") dianggap hari ini
    return d.toDateString() === new Date().toDateString();
  };

  const isOrderAktif = (o: Order) => o.status !== 'cancelled' && o.status !== 'rejected';
  const todayOrders = visibleOrders.filter((o) => isToday(o.createdAt));
  const todayRevenue = todayOrders
    .filter(isOrderAktif)
    .reduce((sum, o) => sum + o.total, 0);

  // Ubah status pesanan: Supabase dulu, baru state lokal + localStorage.
  // Bila Supabase gagal, status lama dipertahankan dan tampilkan error.
  const [orderError, setOrderError] = useState('');
  const handleChangeOrderStatus = async (orderId: string, status: Order['status']) => {
    setOrderError('');
    const ok = await updateOrderStatusInSupabase(orderId, status);
    if (!ok) {
      setOrderError('Gagal mengubah status pesanan di Supabase. Status dikembalikan seperti semula, coba lagi.');
      return;
    }
    onUpdateOrderStatus(orderId, status);
    try {
      const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
      localStorage.setItem('umkm_orders', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save orders error:', e);
    }
  };

  // Form State for Adding New Product Card
  const [formData, setFormData] = useState({ ...EMPTY_PRODUCT_FORM });

  const [formError, setFormError] = useState('');

  // Kategori yang sudah dipakai produk toko ini (untuk datalist, bukan hardcode)
  const productCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  // Simpan menu baru: TUNGGU Supabase dulu (lewat onAddProduct). Popup
  // sukses hanya bila simpan benar-benar berhasil; bila gagal, modal tetap
  // terbuka dan muncul popup error. Dipakai juga oleh dialog "Perubahan
  // belum disimpan" supaya jalurnya satu.
  const saveAddProduct = async (): Promise<boolean> => {
    if (!formData.name.trim() || !formData.price.trim()) {
      setFormError('Nama menu dan harga wajib diisi!');
      return false;
    }

    const priceNum = parseInt(formData.price, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Harga harus berupa angka valid!');
      return false;
    }

    let originalPriceNum: number | undefined;
    if (formData.originalPrice.trim()) {
      originalPriceNum = parseFloat(formData.originalPrice);
      if (isNaN(originalPriceNum)) {
        setFormError('Harga coret harus berupa angka valid!');
        return false;
      }
      if (originalPriceNum <= priceNum) {
        setFormError('Harga coret harus lebih besar dari harga jual!');
        return false;
      }
    }

    const stockNum = parseInt(formData.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setFormError('Stok harus berupa angka 0 atau lebih!');
      return false;
    }

    const newProd: Product = {
      id: 'prod-' + Date.now(),
      name: formData.name.trim(),
      category: formData.category,
      price: priceNum,
      originalPrice: originalPriceNum,
      description: formData.description.trim() || 'Menu lezat pilihan dari ' + store.name,
      image: formData.image.trim() || '/images/placeholder.jpg',
      badge: formData.badge.trim() || undefined,
      rating: 0,
      salesCount: 0,
      isAvailable: formData.isAvailable,
      stock: stockNum,
    };

    setIsSavingProduct(true);
    let hasil: unknown;
    try {
      hasil = await onAddProduct(newProd);
    } catch {
      hasil = false;
    }
    setIsSavingProduct(false);
    if (hasil !== true) {
      notify('error', 'Gagal menyimpan menu baru ke Supabase. Menu belum tersimpan, coba lagi.');
      return false;
    }
    setFormData({ ...EMPTY_PRODUCT_FORM });
    setFormError('');
    setIsAddModalOpen(false);
    notify('success', 'Perubahan telah disimpan');
    return true;
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAddProduct();
  };

  // ---- Perubahan belum disimpan (dirty) ----
  // Dirty = draf beda dengan data terakhir yang tersimpan / dimuat.
  // - Profil toko: storeDraft vs store (prop store hanya berubah bila simpan
  //   ke Supabase berhasil, jadi gagal simpan tetap dirty).
  // - Tambah produk: modal tambah terbuka dan isiannya beda dari kosong.
  // - Edit produk: modal edit terbuka dan isiannya beda dari produk aslinya.
  // Pindah tab di dalam dashboard (Produk / Pesanan / Pengaturan) TIDAK
  // membuang form — state draf dan modal tetap hidup di komponen ini —
  // jadi pindah tab internal tidak perlu dialog. Yang dijaga: pindah mode
  // di header / tombol "Lihat Web Pembeli" (lewat guardRef ke page.tsx),
  // tutup tab browser (beforeunload di page.tsx), dan tutup modal produk
  // (dialog lokal di bawah).
  const storeDirty = useMemo(
    () => JSON.stringify(storeDraft) !== JSON.stringify(store),
    [storeDraft, store]
  );
  const addDirty =
    isAddModalOpen && JSON.stringify(formData) !== JSON.stringify(EMPTY_PRODUCT_FORM);
  const editDirty = useMemo(() => {
    if (!isEditModalOpen || !editingProductId) return false;
    const original = products.find((p) => p.id === editingProductId);
    if (!original) return false;
    return (
      editFormData.name !== original.name ||
      editFormData.category !== original.category ||
      editFormData.price !== original.price.toString() ||
      editFormData.originalPrice !== (original.originalPrice ? original.originalPrice.toString() : '') ||
      editFormData.description !== (original.description || '') ||
      editFormData.image !== (original.image || '') ||
      editFormData.badge !== (original.badge || '') ||
      editFormData.isAvailable !== original.isAvailable ||
      editFormData.stock !== (original.stock ?? 10).toString()
    );
  }, [isEditModalOpen, editingProductId, editFormData, products]);
  const isDirty = storeDirty || addDirty || editDirty;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Simpan semua yang dirty, urut: profil toko, edit produk, tambah produk.
  // Berhenti di kegagalan pertama supaya tidak ada yang tersimpan setengah.
  const saveUnsavedChanges = async (): Promise<boolean> => {
    if (storeDirty) {
      const ok = await saveStoreDraft();
      if (!ok) return false;
    }
    if (editDirty) {
      const ok = await saveEditProduct();
      if (!ok) return false;
    }
    if (addDirty) {
      const ok = await saveAddProduct();
      if (!ok) return false;
    }
    return true;
  };

  // Buang semua perubahan yang belum disimpan, kembali ke data tersimpan.
  const discardUnsavedChanges = () => {
    setStoreDraft(store);
    setFormData({ ...EMPTY_PRODUCT_FORM });
    setFormError('');
    setIsAddModalOpen(false);
    setEditFormError('');
    setIsEditModalOpen(false);
    setEditingProductId(null);
  };

  // Daftarkan guard ke halaman; diperbarui tiap ada yang berubah supaya
  // halaman selalu memanggil fungsi dengan isi state terbaru.
  useEffect(() => {
    if (!guardRef) return;
    guardRef.current = {
      hasUnsavedChanges: () => isDirty,
      saveUnsavedChanges,
      discardUnsavedChanges,
    };
    return () => {
      guardRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardRef, isDirty, storeDraft, formData, editFormData, isAddModalOpen, isEditModalOpen, editingProductId, store, products]);

  // Tutup modal produk: bila isiannya dirty, tanya dulu lewat dialog lokal.
  const [pendingModalClose, setPendingModalClose] = useState<'add' | 'edit' | null>(null);
  const [savingBeforeModalClose, setSavingBeforeModalClose] = useState(false);

  const requestCloseAddModal = () => {
    if (addDirty) {
      setPendingModalClose('add');
    } else {
      setIsAddModalOpen(false);
    }
  };

  const requestCloseEditModal = () => {
    if (editDirty) {
      setPendingModalClose('edit');
    } else {
      setIsEditModalOpen(false);
    }
  };

  const handleModalCloseKeluar = () => {
    const which = pendingModalClose;
    setPendingModalClose(null);
    if (which === 'add') {
      setFormData({ ...EMPTY_PRODUCT_FORM });
      setFormError('');
      setIsAddModalOpen(false);
    } else if (which === 'edit') {
      setEditFormError('');
      setIsEditModalOpen(false);
      setEditingProductId(null);
    }
  };

  const handleModalCloseSimpan = async () => {
    setSavingBeforeModalClose(true);
    const ok = pendingModalClose === 'add' ? await saveAddProduct() : await saveEditProduct();
    setSavingBeforeModalClose(false);
    // Bila simpan berhasil, modal sudah ditutup oleh fungsi simpan.
    // Bila gagal, dialog tetap terbuka supaya pemilik bisa coba lagi
    // atau pilih Keluar; popup error sudah tampil.
    if (ok) setPendingModalClose(null);
  };

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

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
            <span className="metric-num">{todayOrders.length} Pesanan</span>
            <span className="metric-label">Pesanan Masuk Hari Ini</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">💰</span>
          <div className="metric-content">
            <span className="metric-num">{formatRupiah(todayRevenue)}</span>
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
          🔔 Pesanan Masuk ({visibleOrders.length})
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

          {deleteError && <div className="form-alert-error">{deleteError}</div>}

          {products.length === 0 ? (
            <div className="empty-orders-box">
              <span>🍽️</span>
              <h4>Belum ada menu. Tambah menu pertama Anda.</h4>
              <p>Klik tombol di bawah untuk menambah kartu produk pertama ke etalase toko.</p>
              <button className="btn-add-product" onClick={() => setIsAddModalOpen(true)} style={{ marginTop: '12px' }}>
                <span>+ Tambah Menu Pertama</span>
              </button>
            </div>
          ) : (
          <div className="product-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Foto & Menu</th>
                  <th>Kategori</th>
                  <th>Harga Jual</th>
                  <th>Harga Coret</th>
                  <th>Rating / Terjual</th>
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
                      {prod.originalPrice ? (
                        <span className="table-original-price">{formatRupiah(prod.originalPrice)}</span>
                      ) : (
                        <span className="table-empty-cell">-</span>
                      )}
                    </td>
                    <td>
                      {prod.rating > 0 ? (
                        <span className="table-rating">⭐ {prod.rating.toFixed(1)} • {prod.salesCount} terjual</span>
                      ) : (
                        <span className="table-empty-cell">Belum ada ulasan</span>
                      )}
                    </td>
                    <td>
                      <button
                        className={`status-toggle-btn ${prod.isAvailable ? 'available' : 'unavailable'}`}
                        onClick={() => onToggleAvailability(prod.id)}
                      >
                        {prod.isAvailable ? '🟢 Tersedia' : '🔴 Habis'}
                      </button>
                      <div className="table-stock">Stok: {prod.stock ?? 10}</div>
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
                          onClick={() => handleDeleteProduct(prod.id, prod.name)}
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
          )}
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

          {orderError && <div className="form-alert-error">{orderError}</div>}

          {visibleOrders.length === 0 ? (
            <div className="empty-orders-box">
              <span>📭</span>
              <h4>Belum Ada Pesanan Masuk</h4>
              <p>Pesanan baru yang dibuat oleh pembeli akan langsung muncul di sini.</p>
            </div>
          ) : (
            <div className="orders-cards-grid">
              {visibleOrders.map((ord) => (
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
                        : ord.status === 'cancelled'
                        ? '❌ Dibatalkan'
                        : ord.status === 'rejected'
                        ? '⛔ Ditolak'
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
                    {ord.customer.notes && (
                      <div className="customer-notes">📝 Catatan pembeli: {ord.customer.notes}</div>
                    )}
                  </div>

                  <div className="order-menu-list">
                    {ord.items.map((it) => (
                      <div key={it.product.id} className="menu-list-row">
                        <span>
                          {it.quantity}x {it.product.name}
                          {it.notes ? <span className="item-notes"> ({it.notes})</span> : null}
                        </span>
                        <span>{formatRupiah(it.product.price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-breakdown">
                    <div className="breakdown-row">
                      <span>Metode bayar:</span>
                      <strong>
                        {ord.paymentMethod === 'qris'
                          ? 'QRIS'
                          : ord.paymentMethod === 'bank_transfer'
                          ? 'Transfer Bank'
                          : 'Tunai'}
                      </strong>
                    </div>
                    <div className="breakdown-row">
                      <span>Subtotal:</span>
                      <span>{formatRupiah(ord.subtotal)}</span>
                    </div>
                    <div className="breakdown-row">
                      <span>Ongkir:</span>
                      <span>{formatRupiah(ord.deliveryFee)}</span>
                    </div>
                    <div className="breakdown-row">
                      <span>Biaya layanan:</span>
                      <span>{formatRupiah(ord.serviceFee)}</span>
                    </div>
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
                          onClick={() => handleChangeOrderStatus(ord.id, 'cooking')}
                        >
                          Mulai Masak 👨‍🍳
                        </button>
                      )}
                      {ord.status === 'cooking' && (
                        <button
                          className="btn-status-flow ready"
                          onClick={() => handleChangeOrderStatus(ord.id, 'ready')}
                        >
                          Makanan Siap 🍽️
                        </button>
                      )}
                      {ord.status === 'ready' && (
                        <button
                          className="btn-status-flow complete"
                          onClick={() => handleChangeOrderStatus(ord.id, 'completed')}
                        >
                          Selesaikan Pesanan ✅
                        </button>
                      )}
                      {(ord.status === 'pending' || ord.status === 'cooking' || ord.status === 'ready') && (
                        <>
                          <button
                            className="btn-status-flow cancel"
                            onClick={() => {
                              if (confirm(`Batalkan pesanan ${ord.orderNumber}?`)) {
                                handleChangeOrderStatus(ord.id, 'cancelled');
                              }
                            }}
                          >
                            Batalkan ❌
                          </button>
                          <button
                            className="btn-status-flow reject"
                            onClick={() => {
                              if (confirm(`Tolak pesanan ${ord.orderNumber}?`)) {
                                handleChangeOrderStatus(ord.id, 'rejected');
                              }
                            }}
                          >
                            Tolak ⛔
                          </button>
                        </>
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
                    storageFolder={store.slug}
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
                    storageFolder={store.slug}
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

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Nama Owner / Pemilik Toko</label>
                    <input
                      type="text"
                      placeholder="Cth: Budi Santoso"
                      value={storeDraft.ownerName || ''}
                      onChange={(e) => setStoreDraft({ ...storeDraft, ownerName: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Slug Toko (alamat web, tidak bisa diubah)</label>
                    <input
                      type="text"
                      value={storeDraft.slug}
                      readOnly
                      className="form-input"
                      title="Slug ditentukan saat toko dibuat dan tidak bisa diubah"
                    />
                    <span className="input-hint">Alamat web toko Anda: ?store={storeDraft.slug}</span>
                  </div>
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

              {/* Card 3b: Ongkir, Biaya Layanan & Pembayaran */}
              <div className="settings-section-card">
                <div className="section-card-header">
                  <span className="card-badge-icon">💳</span>
                  <div>
                    <h4>Ongkir, Biaya Layanan & Pembayaran</h4>
                    <p>Atur biaya pengiriman, biaya layanan, QRIS, dan rekening bank toko.</p>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Ongkir / Biaya Antar (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Cth: 10000"
                      value={storeDraft.deliveryFee ?? 10000}
                      onChange={(e) =>
                        setStoreDraft({
                          ...storeDraft,
                          deliveryFee: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Biaya Layanan (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Cth: 2000"
                      value={storeDraft.serviceFee ?? 2000}
                      onChange={(e) =>
                        setStoreDraft({
                          ...storeDraft,
                          serviceFee: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Gambar QRIS Toko (URL / path gambar, boleh kosong)</label>
                  <input
                    type="text"
                    placeholder="Cth: /images/qris-toko.jpg atau https://..."
                    value={storeDraft.qrisImageUrl || ''}
                    onChange={(e) => setStoreDraft({ ...storeDraft, qrisImageUrl: e.target.value })}
                    className="form-input"
                  />
                  <span className="input-hint">
                    Unggah gambar QRIS asli toko Anda dan isi alamat gambarnya di sini. Pembeli akan melihat QRIS ini saat checkout.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Rekening Bank Toko</label>
                  {(storeDraft.bankAccounts ?? []).map((acc, idx) => (
                    <div key={idx} className="bank-account-row">
                      <input
                        type="text"
                        placeholder="Bank (cth: BCA)"
                        value={acc.bank}
                        onChange={(e) => updateBankAccount(idx, 'bank', e.target.value)}
                        className="form-input"
                      />
                      <input
                        type="text"
                        placeholder="Nomor rekening"
                        value={acc.account}
                        onChange={(e) => updateBankAccount(idx, 'account', e.target.value)}
                        className="form-input"
                      />
                      <input
                        type="text"
                        placeholder="Nama pemilik rekening"
                        value={acc.holder}
                        onChange={(e) => updateBankAccount(idx, 'holder', e.target.value)}
                        className="form-input"
                      />
                      <button
                        type="button"
                        className="btn-action-del"
                        onClick={() => removeBankAccount(idx)}
                        title="Hapus rekening ini"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn-add-bank" onClick={addBankAccount}>
                    + Tambah Rekening
                  </button>
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
                <button type="submit" className="btn-save-personalization" disabled={isSavingStore}>
                  {isSavingStore ? '⏳ Menyimpan…' : '💾 Simpan Perubahan Toko'}
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
                    {storeDraft.ownerName && (
                      <p className="mock-owner">👤 Owner: {storeDraft.ownerName}</p>
                    )}
                    {storeDraft.phone && (
                      <p className="mock-phone">📞 {storeDraft.phone}</p>
                    )}
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
        <div className="modal-overlay" onClick={requestCloseAddModal}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span>➕</span>
                <span>Tambah Kartu Menu Baru</span>
              </h3>
              <button
                className="modal-close-btn"
                onClick={requestCloseAddModal}
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
                <input
                  type="text"
                  list="product-category-list"
                  placeholder="Cth: Lauk Utama, Batik, Kue Kering — ketik bebas atau pilih yang sudah ada"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-input"
                />
                <datalist id="product-category-list">
                  {productCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
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

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Stok (jumlah tersedia)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Cth: 10"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status Ketersediaan</label>
                  <div className="status-toggle-card" style={{ marginTop: '4px' }}>
                    <div className="status-toggle-info">
                      <span className="toggle-title">
                        {formData.isAvailable ? '🟢 Menu Tersedia' : '🔴 Menu Sedang Habis'}
                      </span>
                      <span className="toggle-desc">
                        {formData.isAvailable
                          ? 'Pelanggan dapat memesan menu ini di etalase web.'
                          : 'Pelanggan tidak dapat memesan menu ini saat ini.'}
                      </span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={formData.isAvailable}
                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
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
                  storageFolder={store.slug}
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
                  onClick={requestCloseAddModal}
                >
                  Batal
                </button>
                <button type="submit" className="btn-save-new" disabled={isSavingProduct}>
                  {isSavingProduct ? '⏳ Menyimpan…' : 'Simpan & Tambah ke Etalase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT PRODUCT CARD */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={requestCloseEditModal}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span>✏️</span>
                <span>Edit Kartu Menu & Foto Produk</span>
              </h3>
              <button
                className="modal-close-btn"
                onClick={requestCloseEditModal}
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
                <input
                  type="text"
                  list="product-category-list"
                  placeholder="Cth: Lauk Utama, Batik, Kue Kering — ketik bebas atau pilih yang sudah ada"
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="form-input"
                />
                <datalist id="product-category-list">
                  {productCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
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
                <label className="form-label">Stok (jumlah tersedia)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="Cth: 10"
                  value={editFormData.stock}
                  onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })}
                  className="form-input"
                />
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
                  storageFolder={store.slug}
                  storageFileName={
                    editingProductId ? buatNamaFileUnik('produk', editingProductId) : undefined
                  }
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
                  onClick={requestCloseEditModal}
                >
                  Batal
                </button>
                <button type="submit" className="btn-save-new" disabled={isSavingProduct}>
                  {isSavingProduct ? '⏳ Menyimpan…' : 'Simpan Perubahan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog "Perubahan belum disimpan" untuk tutup modal produk */}
      <UnsavedChangesDialog
        open={pendingModalClose !== null}
        saving={savingBeforeModalClose}
        onKeluar={handleModalCloseKeluar}
        onSimpan={handleModalCloseSimpan}
      />

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

        .order-status-badge.cancelled {
          background: #fef2f2;
          color: #b91c1c;
        }

        .order-status-badge.rejected {
          background: #f1f5f9;
          color: #475569;
        }

        .status-change-buttons {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .btn-status-flow.cancel {
          background: #dc2626;
        }

        .btn-status-flow.reject {
          background: #64748b;
        }

        .order-breakdown {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 0.78rem;
          margin-bottom: 10px;
          border-bottom: 1px dashed #e2e8f0;
          padding-bottom: 8px;
        }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          color: #475569;
        }

        .customer-notes {
          color: #92400e;
          margin-top: 4px;
        }

        .item-notes {
          color: #94a3b8;
          font-style: italic;
        }

        .table-original-price {
          color: #94a3b8;
          text-decoration: line-through;
          font-weight: 600;
        }

        .table-rating {
          font-size: 0.78rem;
          font-weight: 600;
          color: #475569;
          white-space: nowrap;
        }

        .table-empty-cell {
          font-size: 0.78rem;
          color: #94a3b8;
        }

        .table-stock {
          font-size: 0.72rem;
          color: #64748b;
          margin-top: 4px;
          font-weight: 600;
        }

        .bank-account-row {
          display: grid;
          grid-template-columns: 1fr 1.2fr 1.2fr auto;
          gap: 8px;
          align-items: center;
          margin-bottom: 8px;
        }

        .btn-add-bank {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 4px;
        }

        .mock-owner,
        .mock-phone {
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 4px;
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
