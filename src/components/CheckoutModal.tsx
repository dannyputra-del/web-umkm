'use client';

import React, { useState } from 'react';
import { CartItem, CustomerDetails, OrderType, StoreInfo } from '@/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToCart: () => void;
  items: CartItem[];
  customer: CustomerDetails;
  onUpdateCustomer: (customer: CustomerDetails) => void;
  onProceedToPayment: () => void;
  store: StoreInfo;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onBackToCart,
  items,
  customer,
  onUpdateCustomer,
  onProceedToPayment,
  store,
}) => {
  if (!isOpen) return null;

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const deliveryFee = 0;
  const serviceFee = 2000;
  const total = subtotal + deliveryFee + serviceFee;

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const mapsUrl = store.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address ? `${store.name} ${store.address}` : store.name)}`;

  const handleOrderTypeChange = (type: OrderType) => {
    onUpdateCustomer({
      ...customer,
      orderType: type,
    });
  };

  const handleValidateAndProceed = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!customer.name.trim()) {
      errors.name = 'Nama lengkap wajib diisi';
    }
    if (!customer.phone.trim() || customer.phone.length < 8) {
      errors.phone = 'Nomor WhatsApp valid wajib diisi';
    }
    if (customer.orderType === 'dine_in' && !customer.tableNumber?.trim()) {
      errors.tableNumber = 'Nomor meja wajib diisi jika makan di tempat';
    }
    if (customer.orderType === 'delivery' && !customer.address?.trim()) {
      errors.address = 'Alamat pengantaran wajib diisi';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    onProceedToPayment();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <button className="back-arrow-btn" onClick={onBackToCart} title="Kembali ke Keranjang">
              ←
            </button>
            <span>Data Pemesan & Pengantaran</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleValidateAndProceed} className="modal-body">
          {/* Order Type Toggle */}
          <div className="form-group">
            <label className="form-label">Tipe Pemesanan:</label>
            <div className="order-type-grid">
              <button
                type="button"
                className={`order-type-card ${customer.orderType === 'dine_in' ? 'selected' : ''}`}
                onClick={() => handleOrderTypeChange('dine_in')}
              >
                <span className="type-icon">🍽️</span>
                <span className="type-title">Makan di Tempat</span>
                <span className="type-subtitle">Dine-in Resto</span>
              </button>

              <button
                type="button"
                className={`order-type-card ${customer.orderType === 'takeaway' ? 'selected' : ''}`}
                onClick={() => handleOrderTypeChange('takeaway')}
              >
                <span className="type-icon">🛍️</span>
                <span className="type-title">Ambil Sendiri</span>
                <span className="type-subtitle">Pickup / Kurir Sendiri</span>
              </button>

              <button
                type="button"
                className={`order-type-card ${customer.orderType === 'delivery' ? 'selected' : ''}`}
                onClick={() => handleOrderTypeChange('delivery')}
              >
                <span className="type-icon">🛵</span>
                <span className="type-title">Pesan Antar</span>
                <span className="type-subtitle">Kurir ke Alamat</span>
              </button>
            </div>
          </div>

          {/* Conditional Input: Dine-in Table Number */}
          {customer.orderType === 'dine_in' && (
            <div className="form-group highlight-box">
              <label className="form-label">Nomor Meja Anda *</label>
              <input
                type="text"
                placeholder="Cth: Meja 05 atau Meja VIP-2"
                value={customer.tableNumber || ''}
                onChange={(e) =>
                  onUpdateCustomer({ ...customer, tableNumber: e.target.value })
                }
                className="form-input"
              />
              {formErrors.tableNumber && (
                <span className="error-msg">{formErrors.tableNumber}</span>
              )}
            </div>
          )}

          {/* Conditional Info: Ambil Sendiri (Pickup) */}
          {customer.orderType === 'takeaway' && (
            <div className="form-group highlight-box pickup-info-card">
              <div className="pickup-card-top">
                <span className="pickup-badge-icon">📍</span>
                <div>
                  <strong className="pickup-store-title">Titik Pengambilan / Penjemputan Pesanan:</strong>
                  <p className="pickup-store-name">{store.name}</p>
                </div>
              </div>
              <p className="pickup-store-address">{store.address}</p>

              <div className="pickup-action-row">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-open-maps"
                >
                  🗺️ Buka Rute di Google Maps ↗
                </a>
                <button
                  type="button"
                  className="btn-copy-address"
                  onClick={() => {
                    navigator.clipboard?.writeText(store.address);
                    alert('Alamat toko berhasil disalin!');
                  }}
                >
                  📋 Salin Alamat Toko
                </button>
              </div>

              <span className="pickup-hint-note">
                💡 <em>Anda bisa datang langsung ke toko untuk ambil pesanan, atau memesan kurir instan (GoSend / GrabExpress / Maxim) sendiri dengan titik jemput di atas setelah pesanan siap.</em>
              </span>
            </div>
          )}

          {/* Conditional Input: Pesan Antar (Delivery) */}
          {customer.orderType === 'delivery' && (
            <div className="form-group highlight-box">
              <label className="form-label">Alamat Lengkap Pengiriman *</label>
              <textarea
                placeholder="Tuliskan nama jalan, no rumah, patokan..."
                value={customer.address || ''}
                onChange={(e) =>
                  onUpdateCustomer({ ...customer, address: e.target.value })
                }
                className="form-textarea"
              />
              {formErrors.address && (
                <span className="error-msg">{formErrors.address}</span>
              )}
              <span className="delivery-ongkir-note">
                🛵 <strong>Catatan Ongkos Kirim:</strong> Ongkir akan dicek oleh penjual dan diinfokan melalui konfirmasi WhatsApp.
              </span>
            </div>
          )}

          {/* Customer Personal Info */}
          <div className="form-group">
            <label className="form-label">Nama Pemesan *</label>
            <input
              type="text"
              placeholder="Cth: Budi Santoso"
              value={customer.name}
              onChange={(e) =>
                onUpdateCustomer({ ...customer, name: e.target.value })
              }
              className="form-input"
            />
            {formErrors.name && (
              <span className="error-msg">{formErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Nomor WhatsApp Aktif *</label>
            <input
              type="tel"
              placeholder="Cth: 08123456789"
              value={customer.phone}
              onChange={(e) =>
                onUpdateCustomer({ ...customer, phone: e.target.value })
              }
              className="form-input"
            />
            <span className="input-hint">
              Nomor ini akan digunakan untuk konfirmasi status pesanan dan rincian struk.
            </span>
            {formErrors.phone && (
              <span className="error-msg">{formErrors.phone}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Catatan Tambahan untuk Dapur (Opsional)</label>
            <input
              type="text"
              placeholder="Cth: Tolong siapkan sendok garpu lebih..."
              value={customer.notes || ''}
              onChange={(e) =>
                onUpdateCustomer({ ...customer, notes: e.target.value })
              }
              className="form-input"
            />
          </div>

          {/* Order Summary Breakdown */}
          <div className="summary-breakdown-card">
            <h5 className="breakdown-title">Ringkasan Biaya Pesanan</h5>
            <div className="breakdown-row">
              <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} menu)</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            {customer.orderType === 'delivery' && (
              <div className="breakdown-row">
                <span>Ongkos Kirim Kurir</span>
                <span style={{ color: '#ea580c', fontWeight: 700 }}>Dikonfirmasi via WA</span>
              </div>
            )}
            {customer.orderType === 'takeaway' && (
              <div className="breakdown-row">
                <span>Metode Penjemputan</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>Ambil Sendiri / Pickup (Gratis)</span>
              </div>
            )}
            <div className="breakdown-row">
              <span>Biaya Layanan & Pengemasan</span>
              <span>{formatRupiah(serviceFee)}</span>
            </div>
            <div className="breakdown-total-row">
              <span>Total Tagihan:</span>
              <span className="total-highlight">{formatRupiah(total)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="submit-section">
            <button type="submit" className="btn-proceed-payment">
              <span>Lanjut ke Pilihan Pembayaran</span>
              <span>💳 →</span>
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .back-arrow-btn {
          background: #f1f5f9;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          color: #334155;
          margin-right: 6px;
        }

        .order-type-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 4px;
        }

        .order-type-card {
          background: #f8fafc;
          border: 1.5px solid var(--border-strong);
          border-radius: var(--radius-md);
          padding: 10px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: all 0.2s ease;
        }

        .order-type-card.selected {
          background: #fff7ed;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(194, 65, 12, 0.2);
        }

        .type-icon {
          font-size: 1.3rem;
          margin-bottom: 4px;
        }

        .type-title {
          font-size: 0.74rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }

        .type-subtitle {
          font-size: 0.65rem;
          color: #64748b;
          margin-top: 2px;
        }

        .highlight-box {
          background: #f8fafc;
          padding: 14px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-strong);
        }

        .pickup-info-card {
          background: #f0fdf4;
          border: 1.5px solid #bbf7d0;
        }

        .pickup-card-top {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 6px;
        }

        .pickup-badge-icon {
          font-size: 1.3rem;
        }

        .pickup-store-title {
          font-size: 0.8rem;
          color: #166534;
          display: block;
        }

        .pickup-store-name {
          font-size: 0.92rem;
          font-weight: 800;
          color: #0f172a;
        }

        .pickup-store-address {
          font-size: 0.82rem;
          color: #334155;
          margin-left: 32px;
          margin-bottom: 10px;
          line-height: 1.4;
        }

        .pickup-action-row {
          display: flex;
          gap: 8px;
          margin-left: 32px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }

        .btn-open-maps {
          background: #3b82f6;
          color: white;
          text-decoration: none;
          padding: 7px 12px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: background 0.2s ease;
        }

        .btn-open-maps:hover {
          background: #2563eb;
        }

        .btn-copy-address {
          background: #ffffff;
          color: #334155;
          border: 1px solid #cbd5e1;
          padding: 7px 12px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-copy-address:hover {
          background: #f1f5f9;
        }

        .pickup-hint-note {
          display: block;
          font-size: 0.75rem;
          color: #15803d;
          margin-left: 32px;
          line-height: 1.4;
        }

        .delivery-ongkir-note {
          display: block;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #9a3412;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          margin-top: 8px;
          line-height: 1.4;
        }

        .input-hint {
          display: block;
          font-size: 0.72rem;
          color: #94a3b8;
          margin-top: 4px;
        }

        .error-msg {
          display: block;
          color: #ef4444;
          font-size: 0.72rem;
          font-weight: 600;
          margin-top: 4px;
        }

        .summary-breakdown-card {
          background: #f8fafc;
          border-radius: var(--radius-md);
          padding: 14px 16px;
          margin-top: 10px;
          margin-bottom: 16px;
          border: 1px dashed var(--border-strong);
        }

        .breakdown-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #64748b;
          margin-bottom: 6px;
        }

        .breakdown-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          border-top: 1.5px solid var(--border-strong);
          padding-top: 10px;
          margin-top: 8px;
        }

        .total-highlight {
          color: var(--primary);
          font-size: 1.15rem;
        }

        .submit-section {
          padding-top: 8px;
        }

        .btn-proceed-payment {
          width: 100%;
          background: var(--accent-green);
          color: white;
          padding: 14px;
          border-radius: var(--radius-full);
          font-size: 0.95rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 16px rgba(5, 150, 105, 0.35);
        }

        .btn-proceed-payment:hover {
          background: var(--accent-green-hover);
        }
      `}</style>
    </div>
  );
};
