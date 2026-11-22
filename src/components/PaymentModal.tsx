'use client';

import React, { useState } from 'react';
import { PaymentMethod } from '@/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToCheckout: () => void;
  totalAmount?: number;
  amount?: number;
  store?: {
    name: string;
    qrisImageUrl?: string;
    bankAccounts?: { bank: string; account: string; holder: string }[];
  };
  selectedPayment: PaymentMethod;
  onSelectPayment: (method: PaymentMethod) => void;
  onConfirmOrder: (proof?: { payerName?: string; paidAt?: string }) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onBackToCheckout,
  totalAmount,
  amount,
  store,
  selectedPayment,
  onSelectPayment,
  onConfirmOrder,
}) => {
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [paidConfirmed, setPaidConfirmed] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [paidTime, setPaidTime] = useState('');

  if (!isOpen) return null;

  const displayAmount = amount ?? totalAmount ?? 0;
  const needsPaymentProof =
    selectedPayment === 'qris' || selectedPayment === 'bank_transfer';
  // Order baru dibuat hanya sesudah verifikasi: metode dipilih, dan untuk
  // QRIS/transfer pembeli wajib centang "Saya sudah membayar Rp X".
  const canConfirm =
    !!selectedPayment && (!needsPaymentProof || paidConfirmed);

  const handleSelectPayment = (method: PaymentMethod) => {
    onSelectPayment(method);
    setPaidConfirmed(false);
    setSenderName('');
    setPaidTime('');
  };

  const handleConfirmOrder = () => {
    // Tunai: tidak ada bukti bayar, kirim tanpa argumen.
    // QRIS/transfer: teruskan nama pengirim + jam bayar (bila diisi).
    if (needsPaymentProof) {
      onConfirmOrder({ payerName: senderName || undefined, paidAt: paidTime || undefined });
    } else {
      onConfirmOrder();
    }
  };

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
            <span className="banner-amount">{formatRupiah(displayAmount)}</span>
          </div>

          {/* Payment Method Selector */}
          <div className="payment-methods-list">
            {/* Method 1: QRIS */}
            <div
              className={`payment-option-card ${selectedPayment === 'qris' ? 'active' : ''}`}
              onClick={() => handleSelectPayment('qris')}
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

              {/* Tampilkan QRIS ASLI toko bila ada; bila tidak ada, jangan tampilkan QRIS sama sekali */}
              {selectedPayment === 'qris' && (
                <div className="qris-interactive-box">
                  {store?.qrisImageUrl ? (
                    <>
                      <div className="qris-card-inner">
                        <div className="qris-top-banner">
                          <span className="qris-logo-text">QRIS</span>
                          <span className="gpn-logo-text">GPN</span>
                        </div>
                        <img
                          src={store.qrisImageUrl}
                          alt={`Kode QRIS ${store.name}`}
                          className="qris-real-img"
                        />
                        <span className="qris-merchant-label">{store.name}</span>
                      </div>
                      <p className="qris-scan-instruction">
                        Scan kode QR di atas menggunakan aplikasi pembayaran Anda, lalu centang konfirmasi pembayaran di bawah.
                      </p>
                    </>
                  ) : (
                    <p className="qris-empty-note">Toko belum memasang QRIS.</p>
                  )}
                </div>
              )}
            </div>

            {/* Method 2: Transfer Bank */}
            <div
              className={`payment-option-card ${selectedPayment === 'bank_transfer' ? 'active' : ''}`}
              onClick={() => handleSelectPayment('bank_transfer')}
            >
              <div className="option-header-row">
                <div className="radio-label-box">
                  <div className={`radio-dot ${selectedPayment === 'bank_transfer' ? 'checked' : ''}`} />
                  <span className="method-name">🏦 Transfer Rekening Bank Manual</span>
                </div>
              </div>
              <p className="method-desc">
                Transfer ke rekening resmi toko dan kirimkan struk konfirmasi.
              </p>

              {/* Daftar rekening ASLI toko bila ada; bila kosong, jangan karang nomor apa pun */}
              {selectedPayment === 'bank_transfer' && (
                <div className="bank-account-list">
                  {store?.bankAccounts && store.bankAccounts.length > 0 ? (
                    store.bankAccounts.map((acc) => {
                      const accKey = `${acc.bank}-${acc.account}`;
                      return (
                        <div className="bank-card" key={accKey}>
                          <div className="bank-logo-title">
                            <span className="bank-badge">{acc.bank}</span>
                            <span className="bank-holder">a.n {acc.holder}</span>
                          </div>
                          <div className="bank-number-row">
                            <span className="bank-acc-num">{acc.account}</span>
                            <button
                              type="button"
                              className="btn-copy-acc"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(acc.account.replace(/[\s-]/g, ''), accKey);
                              }}
                            >
                              {copiedBank === accKey ? '✓ Tersalin' : 'Salin'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="bank-empty-note">
                      Toko belum mengisi rekening — bayar tunai atau konfirmasi via WA.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Method 3: Tunai */}
            <div
              className={`payment-option-card ${selectedPayment === 'cash' ? 'active' : ''}`}
              onClick={() => handleSelectPayment('cash')}
            >
              <div className="option-header-row">
                <div className="radio-label-box">
                  <div className={`radio-dot ${selectedPayment === 'cash' ? 'checked' : ''}`} />
                  <span className="method-name">💵 Tunai / Kasir</span>
                </div>
                <span className="badge badge-gold">Bayar di Tempat</span>
              </div>
              <p className="method-desc">
                Bayar tunai di meja makan, kasir toko, atau saat kurir mengantarkan pesanan Anda.
              </p>
              {selectedPayment === 'cash' && (
                <p className="cash-note">Bayar tunai saat pesanan diterima.</p>
              )}
            </div>
          </div>

          {/* Verifikasi pembayaran SEBELUM order dibuat */}
          <div className="payment-verify-box">
            {!selectedPayment && (
              <span className="verify-hint">Pilih metode pembayaran di atas dulu.</span>
            )}
            {needsPaymentProof && (
              <>
                <label className="verify-check-row">
                  <input
                    type="checkbox"
                    checked={paidConfirmed}
                    onChange={(e) => setPaidConfirmed(e.target.checked)}
                  />
                  <span>Saya sudah membayar {formatRupiah(displayAmount)}</span>
                </label>
                <div className="verify-proof-row">
                  <input
                    type="text"
                    placeholder="Nama pengirim (opsional)"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="verify-proof-input"
                  />
                  <input
                    type="text"
                    placeholder="Jam bayar, cth: 10:15 (opsional)"
                    value={paidTime}
                    onChange={(e) => setPaidTime(e.target.value)}
                    className="verify-proof-input"
                  />
                </div>
              </>
            )}
            {selectedPayment === 'cash' && (
              <span className="verify-hint">
                Bayar tunai saat pesanan diterima — tidak perlu bukti bayar.
              </span>
            )}
          </div>

          {/* Confirm Button */}
          <div className="payment-confirm-box">
            <button
              type="button"
              className="btn-confirm-final"
              onClick={handleConfirmOrder}
              disabled={!canConfirm}
            >
              <span>Konfirmasi Pembayaran &amp; Buat Pesanan</span>
              <span>✅</span>
            </button>
            <span className="secure-badge">
              🔒 Transaksi Langsung Aman & Terhubung ke WhatsApp Toko
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

        .qris-real-img {
          width: 170px;
          height: 170px;
          object-fit: contain;
          padding: 6px;
        }

        .qris-empty-note,
        .bank-empty-note {
          font-size: 0.82rem;
          font-weight: 600;
          color: #92400e;
          text-align: center;
          padding: 10px 12px;
          background: #fffbeb;
          border: 1px dashed #fcd34d;
          border-radius: var(--radius-sm);
        }

        .cash-note {
          font-size: 0.8rem;
          font-weight: 700;
          color: #065f46;
          margin-left: 28px;
          margin-top: 8px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: var(--radius-sm);
          padding: 8px 10px;
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
          background: #334155;
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

        .payment-verify-box {
          background: #f8fafc;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .verify-check-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.88rem;
          font-weight: 700;
          color: #0f172a;
          cursor: pointer;
        }

        .verify-check-row input {
          width: 18px;
          height: 18px;
          accent-color: var(--accent-green);
        }

        .verify-proof-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .verify-proof-input {
          flex: 1;
          min-width: 140px;
          border: 1px solid #cbd5e1;
          border-radius: var(--radius-sm);
          padding: 8px 10px;
          font-size: 0.78rem;
          color: #334155;
          outline: none;
          background: #ffffff;
        }

        .verify-proof-input:focus {
          border-color: var(--primary);
        }

        .verify-hint {
          font-size: 0.8rem;
          color: #64748b;
          text-align: center;
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

        .btn-confirm-final:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          box-shadow: none;
        }

        .btn-confirm-final:disabled:hover {
          background: var(--accent-green);
        }

        .secure-badge {
          font-size: 0.72rem;
          color: #64748b;
        }
      `}</style>
    </div>
  );
};
