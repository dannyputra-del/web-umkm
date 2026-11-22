'use client';

import React, { useState } from 'react';
import { CartItem, CustomerDetails, StoreInfo } from '@/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToCart: () => void;
  items: CartItem[];
  customer: CustomerDetails;
  onUpdateCustomer: (customer: CustomerDetails) => void;
  onOrderViaWhatsApp: () => void;
  // store tetap diterima dari page.tsx (kompatibilitas pemanggil),
  // tapi tidak lagi dipakai di form — tidak ada lagi kartu pickup / Maps.
  store: StoreInfo;
  storeIsOpen?: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onBackToCart,
  items,
  customer,
  onUpdateCustomer,
  onOrderViaWhatsApp,
  storeIsOpen = true,
}) => {
  if (!isOpen) return null;

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Total hanya harga makanan (subtotal saja) — tanpa biaya layanan
  // dan tanpa ongkir; keduanya dibicarakan langsung di chat WA.
  const total = subtotal;

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const handleValidateAndProceed = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!customer.name.trim()) {
      errors.name = 'Nama lengkap wajib diisi';
    }
    // Validasi telepon Indonesia: buang spasi/strip, harus diawali 08 / 62 / +62 lalu angka 8.
    const cleanedPhone = customer.phone.replace(/[\s-]/g, '');
    if (!/^(\+62|62|0)8[0-9]{7,12}$/.test(cleanedPhone)) {
      errors.phone =
        'Nomor WhatsApp tidak valid. Nomor harus diawali 08, 62, atau +62 dan diikuti angka 8 (contoh: 08123456789)';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    onOrderViaWhatsApp();
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
            <span>Data Pemesan</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleValidateAndProceed} className="modal-body">
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
              <span>Total Harga Makanan ({items.reduce((s, i) => s + i.quantity, 0)} menu)</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            <div className="breakdown-total-row">
              <span>Total Tagihan:</span>
              <span className="total-highlight">{formatRupiah(total)}</span>
            </div>
            <span className="breakdown-note">
              💬 Pembayaran dan pengiriman dibicarakan langsung di chat WhatsApp.
            </span>
          </div>

          {/* Submit Button */}
          <div className="submit-section">
            <button
              type="submit"
              className="btn-proceed-payment"
              disabled={!storeIsOpen}
            >
              <span>
                {storeIsOpen ? 'Pesan via WhatsApp' : 'Toko sedang tutup'}
              </span>
              {storeIsOpen && <span>💬 →</span>}
            </button>
            {!storeIsOpen && (
              <span className="error-msg" style={{ textAlign: 'center', marginTop: 8 }}>
                Toko sedang tutup — checkout tidak bisa dilanjutkan sekarang.
              </span>
            )}
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

        /* Nilai rupiah jangan terbelah baris di layar sempit (320px). */
        .breakdown-row span:last-child,
        .breakdown-total-row span:last-child {
          white-space: nowrap;
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

        .breakdown-note {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 8px;
          line-height: 1.4;
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

        .btn-proceed-payment:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          box-shadow: none;
        }

        .btn-proceed-payment:disabled:hover {
          background: var(--accent-green);
        }
      `}</style>
    </div>
  );
};
