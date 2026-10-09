'use client';

import React, { useState } from 'react';
import { MerchantAccount, StoreInfo, Product } from '@/types';

interface AuthViewProps {
  merchants: MerchantAccount[];
  onRegister: (merchant: MerchantAccount, newStore: StoreInfo, sampleProducts: Product[]) => void;
  onLogin: (storeSlug: string) => void;
  onBackToCustomer: () => void;
  onGoToSuperAdmin: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  merchants,
  onRegister,
  onLogin,
  onBackToCustomer,
  onGoToSuperAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('signup');

  // Sign Up Form State
  const [signupForm, setSignupForm] = useState({
    ownerName: '',
    phone: '',
    email: '',
    storeName: '',
    storeSlug: '',
    category: 'Kuliner & Makanan Basah',
    password: '',
  });

  const [signupError, setSignupError] = useState('');
  const [slugModified, setSlugModified] = useState(false);

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const storeCategories = [
    'Kuliner & Makanan Basah',
    'Kedai Kopi & Minuman Kekinian',
    'Roti, Kue & Patisserie',
    'Fashion, Busana & Aksesoris',
    'Kerajinan Tangan & Suvenir',
    'Sembako & Kebutuhan Rumah Tangga',
    'Kecantikan & Herbal',
  ];

  // Helper function to convert store name to URL slug
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!slugModified) {
      setSignupForm({
        ...signupForm,
        storeName: val,
        storeSlug: generateSlug(val),
      });
    } else {
      setSignupForm({
        ...signupForm,
        storeName: val,
      });
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugModified(true);
    const cleaned = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    setSignupForm({
      ...signupForm,
      storeSlug: cleaned,
    });
  };

  const isSlugTaken = merchants.some(
    (m) => m.storeSlug.toLowerCase() === signupForm.storeSlug.trim().toLowerCase()
  );

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!signupForm.ownerName.trim()) {
      setSignupError('Nama pemilik usaha wajib diisi!');
      return;
    }
    if (!signupForm.phone.trim() || signupForm.phone.length < 8) {
      setSignupError('Nomor WhatsApp aktif wajib diisi!');
      return;
    }
    if (!signupForm.storeName.trim()) {
      setSignupError('Nama toko UMKM wajib diisi!');
      return;
    }
    if (!signupForm.storeSlug.trim()) {
      setSignupError('Alamat URL / slug web toko wajib diisi!');
      return;
    }
    if (isSlugTaken) {
      setSignupError(`Alamat URL "${signupForm.storeSlug}" sudah digunakan oleh toko lain. Silakan pilih slug lain.`);
      return;
    }

    const cleanPhone = signupForm.phone.replace(/\D/g, '');
    const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    // Create Merchant Account
    const newMerchant: MerchantAccount = {
      id: 'merch-' + Date.now(),
      ownerName: signupForm.ownerName.trim(),
      phone: signupForm.phone.trim(),
      email: signupForm.email.trim() || undefined,
      password: signupForm.password.trim() || '123456',
      storeSlug: signupForm.storeSlug.trim(),
      storeName: signupForm.storeName.trim(),
      category: signupForm.category,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
    };

    // Create Initial Store Info
    const newStore: StoreInfo = {
      name: signupForm.storeName.trim(),
      tagline: `Produk Pilihan Terbaik dari ${signupForm.storeName.trim()}`,
      description: `Selamat datang di etalase resmi ${signupForm.storeName.trim()}. Pesan langsung tanpa ribet!`,
      category: signupForm.category,
      address: 'Alamat toko belum diatur (ubah di Dashboard)',
      phone: signupForm.phone.trim(),
      whatsapp: waPhone,
      isOpen: true,
      openingHours: '08:00 - 21:00 WIB',
      logo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
      backgroundColor: '#f8fafc',
      slug: signupForm.storeSlug.trim(),
      ownerName: signupForm.ownerName.trim(),
    };

    // Create Initial Sample Product
    const sampleProduct: Product = {
      id: 'prod-' + Date.now(),
      name: 'Menu Unggulan ' + signupForm.storeName.trim(),
      category: 'Lauk Utama',
      price: 25000,
      description: 'Menu andalan kami yang dibuat dengan bahan berkualitas dan higienis.',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      badge: 'Spesial ✨',
      rating: 5.0,
      salesCount: 1,
      isAvailable: true,
    };

    onRegister(newMerchant, newStore, [sampleProduct]);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const target = merchants.find(
      (m) =>
        m.phone.includes(loginIdentifier.trim()) ||
        (m.email && m.email.toLowerCase() === loginIdentifier.trim().toLowerCase()) ||
        m.storeSlug.toLowerCase() === loginIdentifier.trim().toLowerCase()
    );

    if (target) {
      onLogin(target.storeSlug);
    } else {
      setLoginError('Akun toko tidak ditemukan! Masukkan nomor WhatsApp, email, atau slug toko yang terdaftar.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-brand-strip">
          <div className="brand-logo-circle">
            <span>🏪</span>
          </div>
          <h2 className="brand-title">Platform Website UMKM</h2>
          <p className="brand-subtitle">
            Buat web pemesanan online instan & bio-profil toko Anda dalam 1 menit
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            🚀 Daftar & Buat Toko Baru
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            🔑 Masuk ke Toko Saya
          </button>
        </div>

        {/* TAB 1: SIGN UP FORM */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="auth-form">
            <div className="signup-badge-callout">
              <span>✨</span>
              <span>
                Gratis pendaftaran! Setelah daftar, Anda langsung mendapatkan link toko sendiri.
              </span>
            </div>

            {signupError && <div className="auth-error-banner">{signupError}</div>}

            <div className="form-group">
              <label className="form-label">Nama Lengkap Pemilik Toko *</label>
              <input
                type="text"
                placeholder="Cth: Budi Santoso"
                value={signupForm.ownerName}
                onChange={(e) => setSignupForm({ ...signupForm, ownerName: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Nomor WhatsApp Aktif *</label>
                <input
                  type="tel"
                  placeholder="Cth: 08123456789"
                  value={signupForm.phone}
                  onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                  className="form-input"
                  required
                />
                <span className="field-hint">Untuk menerima pesanan dari pembeli</span>
              </div>

              <div className="form-group">
                <label className="form-label">Email (Opsional)</label>
                <input
                  type="email"
                  placeholder="Cth: budi@gmail.com"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nama Toko / Usaha Anda *</label>
              <input
                type="text"
                placeholder="Cth: Kedai Kopi Senja, Martabak Bangka 88"
                value={signupForm.storeName}
                onChange={handleStoreNameChange}
                className="form-input"
                required
              />
            </div>

            {/* Custom URL / Slug Input */}
            <div className="form-group slug-form-group">
              <label className="form-label">
                Alamat Link / URL Web Toko Anda (Slug) *
              </label>
              <div className="slug-input-wrapper">
                <span className="slug-prefix">web-umkm/?store=</span>
                <input
                  type="text"
                  placeholder="nama-toko-kamu"
                  value={signupForm.storeSlug}
                  onChange={handleSlugChange}
                  className="slug-input"
                  required
                />
              </div>

              {signupForm.storeSlug && (
                <div className="slug-feedback-strip">
                  {isSlugTaken ? (
                    <span className="slug-status taken">
                      ❌ Alamat ini sudah dipakai toko lain, ganti dengan yang lain.
                    </span>
                  ) : (
                    <span className="slug-status available">
                      ✓ Alamat tersedia: <strong>web-umkm/?store={signupForm.storeSlug}</strong>
                    </span>
                  )}
                </div>
              )}
              <span className="field-hint">
                Link ini yang akan Anda bagikan ke bio Instagram, TikTok, dan status WhatsApp.
              </span>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Kategori Usaha</label>
                <select
                  value={signupForm.category}
                  onChange={(e) => setSignupForm({ ...signupForm, category: e.target.value })}
                  className="form-select"
                >
                  {storeCategories.map((c, i) => (
                    <option key={i} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Kata Sandi / PIN Toko *</label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-auth-submit btn-signup">
              <span>🚀 Buat Toko & Masuk Dashboard</span>
            </button>
          </form>
        )}

        {/* TAB 2: LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            {loginError && <div className="auth-error-banner">{loginError}</div>}

            <div className="form-group">
              <label className="form-label">Nomor WhatsApp / Email / Slug Toko *</label>
              <input
                type="text"
                placeholder="Cth: 081298765432 atau padang-jaya"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Kata Sandi / PIN *</label>
              <input
                type="password"
                placeholder="Masukkan kata sandi toko"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <button type="submit" className="btn-auth-submit btn-login">
              <span>🔑 Masuk ke Dashboard Toko</span>
            </button>

            {/* Quick Demo Login Shortcut */}
            <div className="demo-accounts-box">
              <span className="demo-title">⚡ Akses Cepat Akun Demo (Uji Coba UI):</span>
              <div className="demo-buttons-grid">
                {merchants.slice(0, 3).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="btn-demo-pill"
                    onClick={() => onLogin(m.storeSlug)}
                  >
                    <span>🏪 {m.storeName}</span>
                    <span className="demo-slug">({m.storeSlug})</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* Footer Navigation Strip */}
        <div className="auth-footer-bar">
          <button type="button" className="btn-footer-link" onClick={onBackToCustomer}>
            ← Kembali ke Web Pembeli
          </button>
          <button type="button" className="btn-footer-link superadmin-link" onClick={onGoToSuperAdmin}>
            👑 Masuk Dashboard Super Admin →
          </button>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 85vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 16px;
          background: #f8fafc;
        }

        .auth-card {
          width: 100%;
          max-width: 540px;
          background: #ffffff;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-color);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        .auth-brand-strip {
          background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
          padding: 28px 24px 20px;
          text-align: center;
          border-bottom: 1px solid #fed7aa;
        }

        .brand-logo-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: white;
          margin: 0 auto 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2);
        }

        .brand-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .brand-subtitle {
          font-size: 0.82rem;
          color: #64748b;
          max-width: 380px;
          margin: 0 auto;
        }

        .auth-tabs {
          display: flex;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .auth-tab-btn {
          flex: 1;
          padding: 14px 12px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #64748b;
          background: none;
          border: none;
          border-bottom: 2.5px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .auth-tab-btn:hover {
          color: #0f172a;
        }

        .auth-tab-btn.active {
          color: var(--primary);
          background: #ffffff;
          border-bottom-color: var(--primary);
        }

        .auth-form {
          padding: 24px;
        }

        .signup-badge-callout {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          font-size: 0.78rem;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .auth-error-banner {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 480px) {
          .form-row-2 {
            grid-template-columns: 1fr;
          }
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
          padding: 10px 14px;
          border-radius: var(--radius-md);
          border: 1.5px solid #cbd5e1;
          font-size: 0.85rem;
          font-family: inherit;
          background: white;
          color: #0f172a;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .form-input:focus,
        .form-select:focus {
          border-color: var(--primary);
        }

        .field-hint {
          display: block;
          font-size: 0.7rem;
          color: #94a3b8;
          margin-top: 3px;
        }

        /* Slug input styles */
        .slug-form-group {
          background: #f8fafc;
          padding: 14px;
          border-radius: var(--radius-md);
          border: 1.5px solid #e2e8f0;
        }

        .slug-input-wrapper {
          display: flex;
          align-items: center;
          background: white;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          overflow: hidden;
        }

        .slug-prefix {
          padding: 10px 12px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 0.78rem;
          font-family: monospace;
          font-weight: 600;
          border-right: 1px solid #cbd5e1;
          white-space: nowrap;
        }

        .slug-input {
          flex: 1;
          border: none;
          padding: 10px 12px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #0f172a;
          outline: none;
        }

        .slug-feedback-strip {
          margin-top: 6px;
        }

        .slug-status {
          font-size: 0.75rem;
          font-weight: 600;
        }

        .slug-status.available {
          color: #059669;
        }

        .slug-status.taken {
          color: #dc2626;
        }

        .btn-auth-submit {
          width: 100%;
          padding: 13px;
          border-radius: var(--radius-full);
          border: none;
          font-size: 0.92rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 8px;
        }

        .btn-signup {
          background: var(--accent-green);
          color: white;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);
        }

        .btn-signup:hover {
          background: #047857;
          transform: translateY(-1px);
        }

        .btn-login {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 14px rgba(194, 65, 12, 0.3);
        }

        .btn-login:hover {
          background: #9a3412;
          transform: translateY(-1px);
        }

        /* Demo Accounts Box */
        .demo-accounts-box {
          margin-top: 24px;
          padding: 14px;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: var(--radius-md);
        }

        .demo-title {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          margin-bottom: 8px;
        }

        .demo-buttons-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .btn-demo-pill {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          border: 1px solid #cbd5e1;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-demo-pill:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: #fff7ed;
        }

        .demo-slug {
          color: #94a3b8;
          font-family: monospace;
          font-size: 0.72rem;
        }

        /* Footer */
        .auth-footer-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          background: #f1f5f9;
          border-top: 1px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 10px;
        }

        .btn-footer-link {
          background: none;
          border: none;
          font-size: 0.78rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
        }

        .btn-footer-link:hover {
          color: #0f172a;
        }

        .superadmin-link {
          color: #7c3aed;
          font-weight: 700;
        }

        .superadmin-link:hover {
          color: #6d28d9;
        }
      `}</style>
    </div>
  );
};
