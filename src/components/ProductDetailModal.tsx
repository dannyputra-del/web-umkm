'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '@/types';

// stock ditambah pekerja lain ke tipe Product (kontrak data);
// intersection ini membuat file ini tetap lolos tsc sebelum/sesudah tipe itu ada.
type ProductWithStock = Product & { stock?: number };

interface ProductDetailModalProps {
  product: ProductWithStock | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, notes?: string) => void;
  /** Status toko: false = toko tutup, tombol tambah nonaktif. Default true. */
  isOpen?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  isOpen = true,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Reset jumlah & catatan setiap kali produk yang dibuka berganti.
  useEffect(() => {
    setQuantity(1);
    setNotes('');
  }, [product?.id]);

  // Tutup dengan tombol Escape.
  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const isSoldOut = !product.isAvailable || product.stock === 0;
  const canAdd = !isSoldOut && isOpen;
  const maxQty = product.stock != null && product.stock > 0 ? product.stock : undefined;

  const stockLabel = isSoldOut
    ? 'Habis Terjual'
    : product.stock != null
      ? `Sisa ${product.stock}`
      : 'Tersedia';

  const decreaseQty = () => setQuantity((q) => Math.max(1, q - 1));
  const increaseQty = () =>
    setQuantity((q) => (maxQty != null ? Math.min(maxQty, q + 1) : q + 1));

  const handleAdd = () => {
    if (!canAdd) return;
    onAddToCart(product, quantity, notes.trim() ? notes.trim() : undefined);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Tutup">
          ✕
        </button>

        <div className="modal-image-box">
          <img src={product.image} alt={product.name} className="modal-img" />
          {product.badge && <span className="modal-badge">{product.badge}</span>}
        </div>

        <div className="modal-body">
          <div className="modal-meta-row">
            <span className="category-tag">{product.category}</span>
            <span className={`stock-label ${isSoldOut ? 'sold-out' : ''}`}>
              {stockLabel}
            </span>
          </div>

          <h2 className="modal-name">{product.name}</h2>

          <div className="modal-rating-row">
            {product.rating === 0 ? (
              <span className="no-review">Belum ada ulasan</span>
            ) : (
              <>
                <span className="star-icon">★</span>
                <span className="rating-val">{product.rating}</span>
                <span className="sales-val">Terjual {product.salesCount}+</span>
              </>
            )}
          </div>

          <div className="modal-price-row">
            <span className="price-tag">{formatRupiah(product.price)}</span>
            {product.originalPrice && (
              <span className="price-original">
                {formatRupiah(product.originalPrice)}
              </span>
            )}
          </div>

          <p className="modal-desc">{product.description}</p>

          <label className="field-label" htmlFor="detail-qty">
            Jumlah
          </label>
          <div className="quantity-stepper">
            <button
              className="step-btn minus"
              onClick={decreaseQty}
              disabled={quantity <= 1}
              aria-label="Kurangi jumlah"
            >
              -
            </button>
            <span className="step-qty" id="detail-qty">
              {quantity}
            </span>
            <button
              className="step-btn plus"
              onClick={increaseQty}
              disabled={maxQty != null && quantity >= maxQty}
              aria-label="Tambah jumlah"
            >
              +
            </button>
          </div>

          <label className="field-label" htmlFor="detail-notes">
            Catatan (opsional)
          </label>
          <textarea
            id="detail-notes"
            className="notes-input"
            placeholder="Contoh: tidak pakai bawang, sambal dipisah"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />

          <button
            className="btn-add-cart"
            onClick={handleAdd}
            disabled={!canAdd}
          >
            {isSoldOut
              ? 'Habis Terjual'
              : !isOpen
                ? 'Toko Tutup'
                : 'Tambah ke Keranjang'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 100;
        }

        .modal-content {
          position: relative;
          background: #ffffff;
          width: 100%;
          max-width: 480px;
          max-height: 92vh;
          overflow-y: auto;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.25);
        }

        @media (min-width: 640px) {
          .modal-backdrop {
            align-items: center;
            padding: 24px;
          }
          .modal-content {
            border-radius: 20px;
          }
        }

        .modal-close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 2;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.92);
          color: #334155;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .modal-image-box {
          position: relative;
          width: 100%;
          padding-top: 62%;
          overflow: hidden;
          background: #f1f5f9;
        }

        .modal-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .modal-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(194, 65, 12, 0.92);
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-full);
        }

        .modal-body {
          padding: 18px 20px 22px 20px;
          display: flex;
          flex-direction: column;
        }

        .modal-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .category-tag {
          font-size: 0.7rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .stock-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #047857;
          background: #ecfdf5;
          padding: 3px 10px;
          border-radius: var(--radius-full);
        }

        .stock-label.sold-out {
          color: #b91c1c;
          background: #fef2f2;
        }

        .modal-name {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.3;
          margin-bottom: 6px;
        }

        .modal-rating-row {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 10px;
        }

        .star-icon {
          color: #f59e0b;
        }

        .sales-val {
          color: #94a3b8;
          font-weight: normal;
        }

        .no-review {
          color: #94a3b8;
          font-weight: normal;
        }

        .modal-price-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 12px;
        }

        .price-tag {
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--primary);
        }

        .price-original {
          font-size: 0.85rem;
          color: #94a3b8;
          text-decoration: line-through;
        }

        .modal-desc {
          font-size: 0.88rem;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 16px;
          white-space: pre-line;
        }

        .field-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
        }

        .quantity-stepper {
          display: flex;
          align-items: center;
          align-self: flex-start;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: var(--radius-full);
          padding: 2px 4px;
          margin-bottom: 14px;
        }

        .step-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #ffffff;
          color: var(--accent-green);
          font-size: 1rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .step-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .step-qty {
          padding: 0 14px;
          font-size: 0.95rem;
          font-weight: 800;
          color: #065f46;
          min-width: 28px;
          text-align: center;
        }

        .notes-input {
          width: 100%;
          border: 1.5px solid var(--border-strong);
          border-radius: 12px;
          padding: 10px 12px;
          font-family: inherit;
          font-size: 0.85rem;
          color: var(--text-main);
          resize: vertical;
          outline: none;
          margin-bottom: 16px;
        }

        .notes-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(194, 65, 12, 0.12);
        }

        .btn-add-cart {
          width: 100%;
          background: var(--accent-green);
          color: white;
          font-size: 0.95rem;
          font-weight: 700;
          padding: 13px 16px;
          border-radius: var(--radius-full);
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.25);
        }

        .btn-add-cart:hover:not(:disabled) {
          background: var(--accent-green-hover);
        }

        .btn-add-cart:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          box-shadow: none;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
