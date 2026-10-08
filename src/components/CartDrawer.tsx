'use client';

import React from 'react';
import { CartItem } from '@/types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onUpdateNotes: (productId: string, notes: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onUpdateNotes,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <span>🛒</span>
            <span>Keranjang Belanja ({totalQuantity})</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {items.length === 0 ? (
            <div className="empty-cart-state">
              <span className="empty-icon">🍽️</span>
              <h4>Keranjang Kamu Masih Kosong</h4>
              <p>Yuk pilih menu masakan khas Padang favoritmu sekarang!</p>
              <button className="btn-browse-menu" onClick={onClose}>
                Lihat Daftar Menu
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {items.map((item) => (
                <div key={item.product.id} className="cart-item-card">
                  <div className="item-top-row">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="item-thumb-img"
                    />
                    <div className="item-info-col">
                      <h4 className="item-title">{item.product.name}</h4>
                      <span className="item-price-unit">
                        {formatRupiah(item.product.price)} / porsi
                      </span>
                    </div>

                    <div className="item-stepper">
                      <button
                        className="btn-stepper-sub"
                        onClick={() =>
                          onUpdateQuantity(item.product.id, item.quantity - 1)
                        }
                      >
                        -
                      </button>
                      <span className="stepper-val">{item.quantity}</span>
                      <button
                        className="btn-stepper-add"
                        onClick={() =>
                          onUpdateQuantity(item.product.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Notes input per item */}
                  <div className="item-notes-box">
                    <input
                      type="text"
                      placeholder="Tambah catatan (cth: kuah banjir, sambal dipisah)..."
                      value={item.notes || ''}
                      onChange={(e) =>
                        onUpdateNotes(item.product.id, e.target.value)
                      }
                      className="item-notes-input"
                    />
                  </div>

                  <div className="item-total-row">
                    <span className="item-sub-label">Subtotal:</span>
                    <span className="item-sub-val">
                      {formatRupiah(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="modal-footer">
            <div className="footer-summary-row">
              <span className="summary-label">Total Sementara</span>
              <span className="summary-amount">{formatRupiah(subtotal)}</span>
            </div>

            <div className="footer-button-col">
              <button
                className="btn-checkout-primary"
                onClick={onProceedToCheckout}
              >
                <span>Lanjut ke Formulir Checkout</span>
                <span>👉</span>
              </button>
              <button className="btn-add-more" onClick={onClose}>
                + Pilih Menu Lain Lagi
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .empty-cart-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 3.5rem;
          margin-bottom: 12px;
        }

        .empty-cart-state h4 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 6px;
        }

        .empty-cart-state p {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 20px;
          max-width: 280px;
        }

        .btn-browse-menu {
          background: var(--primary);
          color: white;
          padding: 10px 22px;
          border-radius: var(--radius-full);
          font-weight: 700;
          font-size: 0.85rem;
        }

        .cart-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cart-item-card {
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }

        .item-top-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .item-thumb-img {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-sm);
          object-fit: cover;
          border: 1px solid #f1f5f9;
        }

        .item-info-col {
          flex: 1;
        }

        .item-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .item-price-unit {
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 500;
        }

        .item-stepper {
          display: flex;
          align-items: center;
          background: #f1f5f9;
          border-radius: var(--radius-full);
          padding: 2px;
        }

        .btn-stepper-sub, .btn-stepper-add {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #ffffff;
          color: #334155;
          font-size: 0.95rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .stepper-val {
          padding: 0 8px;
          font-size: 0.82rem;
          font-weight: 800;
          color: #0f172a;
        }

        .item-notes-box {
          margin-bottom: 8px;
        }

        .item-notes-input {
          width: 100%;
          border: 1px dashed #cbd5e1;
          border-radius: var(--radius-sm);
          padding: 6px 10px;
          font-size: 0.75rem;
          color: #334155;
          outline: none;
          background: #f8fafc;
        }

        .item-notes-input:focus {
          border-color: var(--primary);
          background: #fff;
        }

        .item-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 6px;
          border-top: 1px solid #f8fafc;
        }

        .item-sub-label {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .item-sub-val {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--primary);
        }

        .footer-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .summary-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #475569;
        }

        .summary-amount {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--primary);
        }

        .footer-button-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .btn-checkout-primary {
          background: var(--accent-green);
          color: white;
          padding: 12px 18px;
          border-radius: var(--radius-full);
          font-size: 0.92rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);
        }

        .btn-checkout-primary:hover {
          background: var(--accent-green-hover);
        }

        .btn-add-more {
          background: #f1f5f9;
          color: #475569;
          padding: 9px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .btn-add-more:hover {
          background: #e2e8f0;
          color: #1e293b;
        }
      `}</style>
    </div>
  );
};
