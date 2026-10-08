'use client';

import React, { useState } from 'react';
import { PaymentMethod } from '@/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToCheckout: () => void;
  totalAmount: number;
  selectedPayment: PaymentMethod;
  onSelectPayment: (method: PaymentMethod) => void;
  onConfirmOrder: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onBackToCheckout,
  totalAmount,
  selectedPayment,
  onSelectPayment,
  onConfirmOrder,
}) => {
  if (!isOpen) return null;

  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const handleCopy = (text: string, bank: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedBank(bank);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <button
              className="back-arrow-btn"
              onClick={onBackToCheckout}
              title="Kembali ke Formulir Checkout"
            >
              ←
            </button>
            <span>Metode Pembayaran</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {/* Bill Total Banner */}
          <div className="payment-total-banner">
            <span className="banner-sublabel">Total Tagihan Yang Harus Dibayar:</span>
            <span className="banner-amount">{formatRupiah(totalAmount)}</span>
          </div>

          {/* Payment Method Selector */}
          <div className="payment-methods-list">
            {/* Method 1: QRIS */}
            <div
              className={`payment-option-card ${selectedPayment === 'qris' ? 'active' : ''}`}
              onClick={() => onSelectPayment('qris')}
            >
              <div className="option-header-row">
                <div className="radio-label-box">
                  <div className={`radio-dot ${selectedPayment === 'qris' ? 'checked' : ''}`} />
                  <span className="method-name">⚡ QRIS (Semua Pembayaran Digital)</span>
                </div>
                <span className="badge badge-green">Instan & Otomatis</span>
              </div>
              <p className="method-desc">
                Bisa bayar dari BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, DANA & LinkAja.
              </p>

              {/* Expandable QRIS preview if active */}
              {selectedPayment === 'qris' && (
                <div className="qris-interactive-box">
                  <div className="qris-card-inner">
                    <div className="qris-top-banner">
                      <span className="qris-logo-text">QRIS</span>
                      <span className="gpn-logo-text">GPN</span>
                    </div>
                    {/* Visual QR Code Generator with SVG */}
                    <div className="qr-image-container">
                      <svg
                        viewBox="0 0 100 100"
                        className="mock-qr-svg"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Outer QR Corner 1 */}
                        <rect x="5" y="5" width="26" height="26" fill="#0f172a" rx="4" />
                        <rect x="9" y="9" width="18" height="18" fill="#ffffff" rx="2" />
                        <rect x="13" y="13" width="10" height="10" fill="#c2410c" rx="2" />

                        {/* Outer QR Corner 2 */}
                        <rect x="69" y="5" width="26" height="26" fill="#0f172a" rx="4" />
                        <rect x="73" y="9" width="18" height="18" fill="#ffffff" rx="2" />
                        <rect x="77" y="13" width="10" height="10" fill="#c2410c" rx="2" />

                        {/* Outer QR Corner 3 */}
                        <rect x="5" y="69" width="26" height="26" fill="#0f172a" rx="4" />
                        <rect x="9" y="73" width="18" height="18" fill="#ffffff" rx="2" />
                        <rect x="13" y="77" width="10" height="10" fill="#c2410c" rx="2" />

                        {/* Random Patterns */}
                        <rect x="36" y="8" width="6" height="6" fill="#0f172a" />
                        <rect x="46" y="8" width="8" height="6" fill="#0f172a" />
                        <rect x="58" y="12" width="6" height="6" fill="#0f172a" />
                        <rect x="36" y="22" width="10" height="6" fill="#0f172a" />
                        <rect x="52" y="24" width="8" height="8" fill="#0f172a" />
                        <rect x="8" y="38" width="12" height="6" fill="#0f172a" />
                        <rect x="25" y="36" width="6" height="8" fill="#0f172a" />
                        <rect x="38" y="38" width="24" height="24" fill="#0f172a" rx="3" />
                        <rect x="44" y="44" width="12" height="12" fill="#ffffff" rx="2" />
                        <circle cx="50" cy="50" r="3" fill="#c2410c" />
                        <rect x="70" y="38" width="10" height="6" fill="#0f172a" />
                        <rect x="86" y="42" width="8" height="10" fill="#0f172a" />
                        <rect x="38" y="68" width="8" height="8" fill="#0f172a" />
                        <rect x="50" y="72" width="12" height="6" fill="#0f172a" />
                        <rect x="70" y="70" width="8" height="14" fill="#0f172a" />
                        <rect x="82" y="72" width="12" height="8" fill="#0f172a" />
                        <rect x="74" y="88" width="16" height="6" fill="#0f172a" />
                      </svg>
                    </div>
                    <span className="qris-merchant-label">
                      NMID: ID10293847592 • RESTO PADANG JAYA MAKMUR
                    </span>
                  </div>
                  <p className="qris-scan-instruction">
                    Tangkapan layar (screenshot) kode QR di atas atau scan langsung menggunakan kamera aplikasi perbankan Anda.
                  </p>
                </div>
              )}
            </div>

            {/* Method 2: Transfer Bank */}
            <div
              className={`payment-option-card ${selectedPayment === 'bank_transfer' ? 'active' : ''}`}
              onClick={() => onSelectPayment('bank_transfer')}
            >
              <div className="option-header-row">
                <div className="radio-label-box">
                  <div className={`radio-dot ${selectedPayment === 'bank_transfer' ? 'checked' : ''}`} />
                  <span className="method-name">🏦 Transfer Rekening Bank Manual</span>
                </div>
              </div>
              <p className="method-desc">
                Transfer ke rekening resmi restoran dan kirimkan struk konfirmasi.
              </p>

              {selectedPayment === 'bank_transfer' && (
                <div className="bank-account-list">
                  <div className="bank-card">
                    <div className="bank-logo-title">
                      <span className="bank-badge bca">BCA</span>
                      <span className="bank-holder">a.n Jaya Makmur Resto</span>
                    </div>
                    <div className="bank-number-row">
                      <span className="bank-acc-num">8281-9288-1920</span>
                      <button
                        type="button"
                        className="btn-copy-acc"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy('828192881920', 'BCA');
                        }}
                      >
                        {copiedBank === 'BCA' ? '✓ Tersalin' : 'Salin'}
                      </button>
                    </div>
                  </div>

                  <div className="bank-card">
                    <div className="bank-logo-title">
                      <span className="bank-badge mandiri">MANDIRI</span>
                      <span className="bank-holder">a.n Jaya Makmur Resto</span>
                    </div>
                    <div className="bank-number-row">
                      <span className="bank-acc-num">1370-0198-2839-1</span>
                      <button
                        type="button"
                        className="btn-copy-acc"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy('1370019828391', 'Mandiri');
                        }}
                      >
                        {copiedBank === 'Mandiri' ? '✓ Tersalin' : 'Salin'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Method 3: Tunai */}
            <div
              className={`payment-option-card ${selectedPayment === 'cash' ? 'active' : ''}`}
              onClick={() => onSelectPayment('cash')}
            >
              <div className="option-header-row">
                <div className="radio-label-box">
                  <div className={`radio-dot ${selectedPayment === 'cash' ? 'checked' : ''}`} />
                  <span className="method-name">💵 Tunai / Kasir</span>
                </div>
                <span className="badge badge-gold">Bayar di Tempat</span>
              </div>
              <p className="method-desc">
                Bayar tunai di meja makan, kasir restoran, atau saat kurir mengantarkan pesanan Anda.
              </p>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="payment-confirm-box">
            <button
              type="button"
              className="btn-confirm-final"
              onClick={onConfirmOrder}
            >
              <span>Konfirmasi & Selesaikan Pesanan</span>
              <span>✅</span>
            </button>
            <span className="secure-badge">
              🔒 Transaksi Langsung Aman & Terhubung ke WhatsApp Resto
            </span>
          </div>
        </div>
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

        .payment-total-banner {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: white;
          padding: 16px 20px;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.15);
        }

        .banner-sublabel {
          font-size: 0.78rem;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .banner-amount {
          font-size: 1.6rem;
          font-weight: 800;
          color: #38bdf8;
          letter-spacing: -0.01em;
        }

        .payment-methods-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .payment-option-card {
          border: 1.5px solid var(--border-strong);
          border-radius: var(--radius-lg);
          padding: 14px 16px;
          cursor: pointer;
          background: #ffffff;
          transition: all 0.2s ease;
        }

        .payment-option-card:hover {
          border-color: #cbd5e1;
        }

        .payment-option-card.active {
          border-color: var(--primary);
          background: #fffdfb;
          box-shadow: 0 0 0 2px rgba(194, 65, 12, 0.15);
        }

        .option-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .radio-label-box {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .radio-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .radio-dot.checked {
          border-color: var(--primary);
        }

        .radio-dot.checked::after {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
        }

        .method-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0f172a;
        }

        .method-desc {
          font-size: 0.78rem;
          color: #64748b;
          margin-left: 28px;
          margin-top: 2px;
        }

        .qris-interactive-box {
          margin-top: 14px;
          margin-left: 28px;
          background: #f8fafc;
          border-radius: var(--radius-md);
          padding: 14px;
          border: 1px dashed #cbd5e1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .qris-card-inner {
          background: #ffffff;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 260px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .qris-top-banner {
          display: flex;
          justify-content: space-between;
          width: 100%;
          font-weight: 900;
          font-size: 0.8rem;
          padding-bottom: 6px;
          margin-bottom: 6px;
          border-bottom: 1px solid #f1f5f9;
        }

        .qris-logo-text {
          color: #dc2626;
        }

        .gpn-logo-text {
          color: #2563eb;
        }

        .qr-image-container {
          width: 170px;
          height: 170px;
          padding: 6px;
        }

        .mock-qr-svg {
          width: 100%;
          height: 100%;
        }

        .qris-merchant-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: #475569;
          margin-top: 8px;
          text-align: center;
        }

        .qris-scan-instruction {
          font-size: 0.72rem;
          color: #64748b;
          text-align: center;
          margin-top: 10px;
          max-width: 320px;
        }

        .bank-account-list {
          margin-top: 14px;
          margin-left: 28px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .bank-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-sm);
          padding: 10px 12px;
        }

        .bank-logo-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .bank-badge {
          font-size: 0.7rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          color: white;
        }

        .bank-badge.bca {
          background: #0060af;
        }

        .bank-badge.mandiri {
          background: #003087;
        }

        .bank-holder {
          font-size: 0.75rem;
          color: #64748b;
        }

        .bank-number-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .bank-acc-num {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 0.04em;
        }

        .btn-copy-acc {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.72rem;
          font-weight: 700;
        }

        .btn-copy-acc:hover {
          background: #f1f5f9;
        }

        .payment-confirm-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .btn-confirm-final {
          width: 100%;
          background: var(--accent-green);
          color: white;
          padding: 14px;
          border-radius: var(--radius-full);
          font-size: 0.98rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 18px rgba(5, 150, 105, 0.4);
        }

        .btn-confirm-final:hover {
          background: var(--accent-green-hover);
        }

        .secure-badge {
          font-size: 0.72rem;
          color: #64748b;
        }
      `}</style>
    </div>
  );
};
