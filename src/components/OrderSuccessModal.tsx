'use client';

import React from 'react';
import { Order, StoreInfo } from '@/types';
import { buildWhatsAppOrderUrl } from '@/lib/whatsappMessage';

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  store: StoreInfo;
  // Dipanggil saat tombol WA manual diklik (jalur cadangan popup diblokir);
  // page.tsx lalu mengosongkan keranjang + menutup modal supaya checkout
  // ulang tidak membuat nomor pesanan baru dari keranjang yang sama.
  onWhatsAppSent?: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  isOpen,
  onClose,
  order,
  store,
  onWhatsAppSent,
}) => {
  if (!isOpen || !order) return null;

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // Waktu order lengkap (tanggal + jam, format Indonesia) dari ISO;
  // bila bukan ISO valid, tampilkan apa adanya.
  const formatOrderTime = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Pesan WA dibangun helper bersama (dipakai juga page.tsx saat buka WA
  // langsung). Isi: hanya total harga makanan, tanpa Metode Bayar dan
  // tanpa subtotal / biaya layanan / ongkir terpisah.
  const whatsappUrl = buildWhatsAppOrderUrl(order, store);

  return (
    <div className="modal-overlay">
      <div className="modal-sheet success-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Animated Success Badge */}
        <div className="success-header-decor">
          <div className="success-icon-bubble">
            <span>🎉</span>
          </div>
          <h2 className="success-title">Terima Kasih Sudah Memesan!</h2>
          <p className="success-subtitle">
            Pesanan Anda tercatat. Silakan kirim konfirmasi via WhatsApp agar kasir <strong>{store.name}</strong> memprosesnya.
          </p>
        </div>

        <div className="modal-body success-body">
          {/* Order Ticket Card */}
          <div className="order-ticket-card">
            <div className="ticket-top">
              <span className="ticket-number-label">Nomor Pesanan</span>
              <span className="ticket-number-val">{order.orderNumber}</span>
            </div>

            <div className="ticket-divider" />

            <div className="ticket-details">
              <div className="detail-row">
                <span className="detail-lbl">Waktu Pesanan:</span>
                <span className="detail-val">{formatOrderTime(order.createdAt)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-lbl">Pemesan:</span>
                <span className="detail-val">{order.customer.name} ({order.customer.phone})</span>
              </div>
              <div className="detail-row">
                <span className="detail-lbl">Pembayaran:</span>
                <span className="detail-val">
                  {order.paymentMethod === 'whatsapp'
                    ? 'WhatsApp'
                    : order.paymentMethod === 'qris'
                    ? 'QRIS Otomatis'
                    : order.paymentMethod === 'bank_transfer'
                    ? 'Transfer Bank'
                    : 'Tunai di Kasir'}
                </span>
              </div>
              {order.customer.notes && (
                <div className="detail-row">
                  <span className="detail-lbl">Catatan Pembeli:</span>
                  <span className="detail-val">{order.customer.notes}</span>
                </div>
              )}
            </div>

            {/* Item list */}
            <div className="ticket-items-list">
              <span className="items-header-label">Menu Yang Dipesan:</span>
              {order.items.map((it) => (
                <div key={it.product.id} className="ticket-item-row">
                  <span className="item-qty-name">
                    <strong>{it.quantity}x</strong> {it.product.name}
                    {it.notes && (
                      <span className="item-note-line">Catatan: {it.notes}</span>
                    )}
                  </span>
                  <span className="item-sub-price">
                    {formatRupiah(it.product.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="ticket-divider" />

            <div className="ticket-total-row">
              <span className="total-lbl">Total Harga Makanan:</span>
              <span className="total-val">{formatRupiah(order.total)}</span>
            </div>
            <span className="ticket-wa-note">
              💬 Pembayaran dan pengiriman dibicarakan di chat WhatsApp.
            </span>
          </div>

          {/* Quick Notice */}
          <div className="kitchen-status-pill">
            <span className="kitchen-pulse">💬</span>
            <span>Status: <strong>Menunggu konfirmasi via WhatsApp</strong></span>
          </div>

          {/* Actions */}
          <div className="success-action-group">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-send-whatsapp"
              onClick={() => onWhatsAppSent?.()}
            >
              <span>📲 Kirim Bukti & Pesanan ke WhatsApp Toko</span>
            </a>

            <button className="btn-order-again" onClick={onClose}>
              🍽️ Pesan Menu Lain Lagi
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .success-sheet {
          max-width: 480px;
          text-align: center;
        }

        .success-header-decor {
          background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
          padding: 28px 20px 20px 20px;
          border-bottom: 1px dashed #fed7aa;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .success-icon-bubble {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          margin-bottom: 12px;
          box-shadow: 0 8px 20px rgba(34, 197, 94, 0.35);
          animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        .success-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .success-subtitle {
          font-size: 0.82rem;
          color: #64748b;
          max-width: 340px;
        }

        .success-body {
          padding: 20px;
        }

        .order-ticket-card {
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 16px;
          text-align: left;
          box-shadow: var(--shadow-sm);
          margin-bottom: 16px;
        }

        .ticket-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ticket-number-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .ticket-number-val {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--primary);
          background: #fff7ed;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .ticket-divider {
          height: 1px;
          background: repeating-linear-gradient(90deg, #cbd5e1, #cbd5e1 4px, transparent 4px, transparent 8px);
          margin: 12px 0;
        }

        .ticket-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
        }

        .detail-lbl {
          color: #94a3b8;
        }

        .detail-val {
          color: #1e293b;
          font-weight: 600;
          text-align: right;
          max-width: 65%;
        }

        .ticket-items-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .items-header-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .ticket-item-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #334155;
        }

        .item-qty-name strong {
          color: var(--primary);
          margin-right: 4px;
        }

        .item-sub-price {
          font-weight: 700;
        }

        .item-note-line {
          display: block;
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 400;
          margin-top: 2px;
        }

        .ticket-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ticket-wa-note {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 8px;
          line-height: 1.4;
        }

        .total-lbl {
          font-size: 0.88rem;
          font-weight: 700;
          color: #1e293b;
        }

        .total-val {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--accent-green);
        }

        .kitchen-status-pill {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
          padding: 8px 14px;
          border-radius: var(--radius-full);
          font-size: 0.78rem;
          margin-bottom: 18px;
        }

        .kitchen-pulse {
          font-size: 1rem;
        }

        .success-action-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .btn-send-whatsapp {
          background: #22c55e;
          color: white;
          padding: 14px;
          border-radius: var(--radius-full);
          font-size: 0.9rem;
          font-weight: 700;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(34, 197, 94, 0.35);
          transition: background 0.2s ease;
        }

        .btn-send-whatsapp:hover {
          background: #16a34a;
        }

        .btn-order-again {
          background: #f1f5f9;
          color: #475569;
          padding: 11px;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .btn-order-again:hover {
          background: #e2e8f0;
          color: #1e293b;
        }
      `}</style>
    </div>
  );
};
