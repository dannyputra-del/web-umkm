'use client';

import React from 'react';
import { StoreInfo } from '@/types';

interface HeaderProps {
  store: StoreInfo;
  cartCount: number;
  onOpenCart: () => void;
  activeTab: 'customer' | 'admin' | 'auth' | 'superadmin';
  setActiveTab: (tab: 'customer' | 'admin' | 'auth' | 'superadmin') => void;
}

export const Header: React.FC<HeaderProps> = ({
  store,
  cartCount,
  onOpenCart,
  activeTab,
  setActiveTab,
}) => {
  const mapsUrl = store.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address ? `${store.name} ${store.address}` : store.name)}`;

  return (
    <header className="store-header">
      {/* Admin / Customer View Switcher Bar */}
      <div className="view-switcher-bar">
        <span className="mode-indicator">
          Mode Tampilan:
        </span>
        <div className="tab-pill-group">
          <button
            className={`tab-pill-btn ${activeTab === 'customer' ? 'active' : ''}`}
            onClick={() => setActiveTab('customer')}
          >
            🛍️ Pembeli
          </button>
          <button
            className={`tab-pill-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            ⚙️ Dashboard Toko
          </button>
          <button
            className={`tab-pill-btn ${activeTab === 'auth' ? 'active' : ''}`}
            onClick={() => setActiveTab('auth')}
          >
            🔐 Login / Daftar UMKM
          </button>
          <button
            className={`tab-pill-btn ${activeTab === 'superadmin' ? 'active' : ''}`}
            onClick={() => setActiveTab('superadmin')}
          >
            👑 Super Admin
          </button>
        </div>
      </div>

      {/* Store Banner Hero */}
      <div className="store-banner-wrapper">
        <img
          src={store.banner}
          alt={store.name}
          className="store-banner-img"
        />
        <div className="store-banner-gradient" />
        
        {/* Quick Cart Button on Top Right (Mobile & Desktop) */}
        {activeTab === 'customer' && (
          <button
            className="floating-header-cart-btn"
            onClick={onOpenCart}
            aria-label="Keranjang Belanja"
          >
            <span className="cart-icon">🛒</span>
            {cartCount > 0 && <span className="cart-badge-count">{cartCount}</span>}
          </button>
        )}
      </div>

      {/* Store Identity Card (Linktree Style Centered/Elevated) */}
      <div className="store-profile-box">
        <div className="store-avatar-wrapper">
          <img
            src={store.logo}
            alt={store.name}
            className="store-avatar-img"
          />
          <span className="verified-badge" title="Toko Resmi Terverifikasi">✓</span>
        </div>

        <div className="store-info-text">
          <div className="store-badge-row">
            <span className={`store-status-pill ${store.isOpen ? 'open' : 'closed'}`}>
              <span className="status-dot"></span>
              {store.isOpen ? 'Buka Sekarang' : 'Tutup Sementara'}
            </span>
            <span className="store-hours-pill">🕒 {store.openingHours}</span>
          </div>

          <h1 className="store-name-title">{store.name}</h1>
          <p className="store-tagline-text">{store.tagline}</p>
          <div className="store-address-row">
            <span className="store-address-text">📍 {store.address}</span>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="store-maps-chip"
              title="Buka titik lokasi di Google Maps"
            >
              🗺️ Buka di Google Maps ↗
            </a>
          </div>
        </div>

        {/* Quick Contact & Action Buttons */}
        <div className="store-action-buttons">
          <a
            href={`https://wa.me/${store.whatsapp}?text=Halo%20${encodeURIComponent(store.name)},%20saya%20ingin%20tanya%20menu`}
            target="_blank"
            rel="noopener noreferrer"
            className="action-link-btn whatsapp-btn"
          >
            💬 Chat WA
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="action-link-btn maps-btn"
            title="Buka titik jemput di Google Maps"
          >
            📍 Lokasi Maps
          </a>
          <button
            className="action-link-btn outline-btn"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert('Link menu toko berhasil disalin!');
            }}
          >
            🔗 Bagikan
          </button>
        </div>
      </div>

      <style jsx>{`
        .store-header {
          position: relative;
          background: #ffffff;
          border-bottom: 1px solid var(--border-color);
        }

        .view-switcher-bar {
          background: #1e293b;
          color: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          font-size: 0.8rem;
          flex-wrap: wrap;
          gap: 8px;
        }

        .mode-indicator {
          font-weight: 600;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tab-pill-group {
          display: flex;
          background: #0f172a;
          padding: 3px;
          border-radius: 999px;
          border: 1px solid #334155;
        }

        .tab-pill-btn {
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #94a3b8;
          background: transparent;
        }

        .tab-pill-btn.active {
          background: var(--primary);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(194, 65, 12, 0.4);
        }

        .store-banner-wrapper {
          position: relative;
          height: 180px;
          width: 100%;
          overflow: hidden;
          background: #334155;
        }

        @media (min-width: 640px) {
          .store-banner-wrapper {
            height: 220px;
          }
        }

        .store-banner-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.85;
        }

        .store-banner-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%);
        }

        .floating-header-cart-btn {
          position: absolute;
          top: 14px;
          right: 16px;
          z-index: 20;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-md);
          border: 1px solid rgba(255, 255, 255, 0.6);
        }

        .cart-icon {
          font-size: 1.25rem;
        }

        .cart-badge-count {
          position: absolute;
          top: -3px;
          right: -3px;
          background: var(--accent-green);
          color: white;
          font-size: 0.72rem;
          font-weight: 800;
          min-width: 20px;
          height: 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid white;
        }

        .store-profile-box {
          position: relative;
          margin-top: -55px;
          padding: 0 20px 20px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .store-avatar-wrapper {
          position: relative;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          border: 4px solid #ffffff;
          box-shadow: var(--shadow-md);
          background: #ffffff;
          overflow: visible;
          margin-bottom: 12px;
        }

        .store-avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .verified-badge {
          position: absolute;
          bottom: 2px;
          right: 2px;
          background: #2563eb;
          color: white;
          font-size: 0.7rem;
          font-weight: 900;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        }

        .store-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .store-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.74rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
        }

        .store-status-pill.open {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .store-status-pill.closed {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
          animation: pulse 1.8s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        .store-hours-pill {
          font-size: 0.74rem;
          font-weight: 600;
          color: #64748b;
          background: #f1f5f9;
          padding: 3px 10px;
          border-radius: 999px;
        }

        .store-name-title {
          font-size: 1.45rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }

        .store-tagline-text {
          font-size: 0.88rem;
          font-weight: 500;
          color: #64748b;
          max-width: 480px;
          margin-bottom: 6px;
        }

        .store-address-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

        .store-address-text {
          font-size: 0.78rem;
          color: #94a3b8;
        }

        .store-maps-chip {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .store-maps-chip:hover {
          background: #dbeafe;
          transform: translateY(-1px);
        }

        .store-action-buttons {
          display: flex;
          gap: 10px;
          width: 100%;
          max-width: 440px;
          justify-content: center;
        }

        .action-link-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 12px;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .whatsapp-btn {
          background: #22c55e;
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(34, 197, 94, 0.25);
        }

        .whatsapp-btn:hover {
          background: #16a34a;
        }

        .maps-btn {
          background: #3b82f6;
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(59, 130, 246, 0.25);
        }

        .maps-btn:hover {
          background: #2563eb;
        }

        .outline-btn {
          background: #f8fafc;
          color: #334155;
          border: 1px solid #e2e8f0;
        }

        .outline-btn:hover {
          background: #f1f5f9;
        }
      `}</style>
    </header>
  );
};
