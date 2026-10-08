'use client';

import React from 'react';
import { CartItem } from '@/types';

interface CartFloatingBarProps {
  items: CartItem[];
  onOpenCart: () => void;
}

export const CartFloatingBar: React.FC<CartFloatingBarProps> = ({
  items,
  onOpenCart,
}) => {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  if (totalQuantity === 0) return null;

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <div className="floating-bar-wrapper">
      <div className="floating-bar-content" onClick={onOpenCart}>
        <div className="cart-summary-left">
          <div className="icon-badge-box">
            <span className="cart-icon">🛒</span>
            <span className="badge-count">{totalQuantity}</span>
          </div>
          <div className="summary-text-box">
            <span className="label-count">{totalQuantity} Item Terpilih</span>
            <span className="label-total">{formatRupiah(totalPrice)}</span>
          </div>
        </div>

        <button className="btn-view-cart">
          <span>Lihat Pesanan</span>
          <span className="arrow-icon">→</span>
        </button>
      </div>

      <style jsx>{`
        .floating-bar-wrapper {
          position: fixed;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 32px);
          max-width: 520px;
          z-index: 100;
          animation: slideUpFloat 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .floating-bar-content {
          background: #0f172a;
          color: white;
          padding: 10px 14px 10px 16px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.35);
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.15);
          transition: transform 0.2s ease;
        }

        .floating-bar-content:hover {
          transform: translateY(-2px);
          background: #020617;
        }

        .cart-summary-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icon-badge-box {
          position: relative;
          background: rgba(255, 255, 255, 0.1);
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cart-icon {
          font-size: 1.15rem;
        }

        .badge-count {
          position: absolute;
          top: -2px;
          right: -2px;
          background: var(--accent-green);
          color: white;
          font-size: 0.68rem;
          font-weight: 800;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #0f172a;
        }

        .summary-text-box {
          display: flex;
          flex-direction: column;
        }

        .label-count {
          font-size: 0.72rem;
          color: #94a3b8;
          font-weight: 500;
        }

        .label-total {
          font-size: 1rem;
          font-weight: 800;
          color: #38bdf8;
        }

        .btn-view-cart {
          background: var(--primary);
          color: white;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          font-size: 0.82rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(194, 65, 12, 0.4);
        }

        .arrow-icon {
          font-size: 0.95rem;
          transition: transform 0.2s ease;
        }

        .btn-view-cart:hover .arrow-icon {
          transform: translateX(3px);
        }

        @keyframes slideUpFloat {
          from {
            transform: translate(-50%, 40px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
