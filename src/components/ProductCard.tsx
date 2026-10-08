'use client';

import React from 'react';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  cartQuantity: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onOpenDetail?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
  onOpenDetail,
}) => {
  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <div className="product-card">
      {/* Product Image Box */}
      <div 
        className="card-image-box"
        onClick={() => onOpenDetail && onOpenDetail(product)}
      >
        <img
          src={product.image}
          alt={product.name}
          className="product-img"
          loading="lazy"
        />
        {product.badge && (
          <span className="card-badge">{product.badge}</span>
        )}
        {!product.isAvailable && (
          <div className="card-sold-out-overlay">
            <span>Habis Terjual</span>
          </div>
        )}
      </div>

      {/* Content Box */}
      <div className="card-content-box">
        <div className="card-meta-row">
          <span className="category-tag">{product.category}</span>
          <div className="rating-pill">
            <span className="star-icon">★</span>
            <span className="rating-val">{product.rating}</span>
            <span className="sales-val">({product.salesCount}+)</span>
          </div>
        </div>

        <h3 
          className="product-name"
          onClick={() => onOpenDetail && onOpenDetail(product)}
        >
          {product.name}
        </h3>

        <p className="product-desc">{product.description}</p>

        {/* Price & Action Row */}
        <div className="card-bottom-row">
          <div className="price-container">
            <span className="price-tag">{formatRupiah(product.price)}</span>
            {product.originalPrice && (
              <span className="price-original">
                {formatRupiah(product.originalPrice)}
              </span>
            )}
          </div>

          <div className="action-container">
            {!product.isAvailable ? (
              <button className="btn-unavailable" disabled>
                Habis
              </button>
            ) : cartQuantity === 0 ? (
              <button
                className="btn-add-cart"
                onClick={() => onAddToCart(product)}
                aria-label={`Tambah ${product.name} ke keranjang`}
              >
                + Tambah
              </button>
            ) : (
              <div className="quantity-stepper">
                <button
                  className="step-btn minus"
                  onClick={() => onUpdateQuantity(product.id, cartQuantity - 1)}
                  aria-label="Kurangi kuantitas"
                >
                  -
                </button>
                <span className="step-qty">{cartQuantity}</span>
                <button
                  className="step-btn plus"
                  onClick={() => onUpdateQuantity(product.id, cartQuantity + 1)}
                  aria-label="Tambah kuantitas"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .product-card {
          background: #ffffff;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        .product-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
          border-color: #e2e8f0;
        }

        .card-image-box {
          position: relative;
          width: 100%;
          padding-top: 68%; /* 16:11 Aspect ratio */
          overflow: hidden;
          background: #f1f5f9;
          cursor: pointer;
        }

        .product-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .product-card:hover .product-img {
          transform: scale(1.05);
        }

        .card-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(194, 65, 12, 0.92);
          backdrop-filter: blur(4px);
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-full);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .card-sold-out-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .card-content-box {
          padding: 14px 16px 16px 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .card-meta-row {
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

        .rating-pill {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #475569;
        }

        .star-icon {
          color: #f59e0b;
        }

        .sales-val {
          color: #94a3b8;
          font-weight: normal;
        }

        .product-name {
          font-size: 0.98rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 5px;
          line-height: 1.35;
          cursor: pointer;
        }

        .product-name:hover {
          color: var(--primary);
        }

        .product-desc {
          font-size: 0.78rem;
          color: #64748b;
          line-height: 1.45;
          margin-bottom: 14px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
        }

        .card-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px dashed var(--border-color);
        }

        .price-container {
          display: flex;
          flex-direction: column;
        }

        .price-tag {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--primary);
        }

        .price-original {
          font-size: 0.72rem;
          color: #94a3b8;
          text-decoration: line-through;
        }

        .action-container {
          display: flex;
          align-items: center;
        }

        .btn-add-cart {
          background: var(--accent-green);
          color: white;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.25);
        }

        .btn-add-cart:hover {
          background: var(--accent-green-hover);
          transform: translateY(-1px);
        }

        .btn-unavailable {
          background: #f1f5f9;
          color: #94a3b8;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 7px 14px;
          border-radius: var(--radius-full);
          cursor: not-allowed;
        }

        .quantity-stepper {
          display: flex;
          align-items: center;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: var(--radius-full);
          padding: 2px 4px;
        }

        .step-btn {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #ffffff;
          color: var(--accent-green);
          font-size: 0.95rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .step-btn:hover {
          background: var(--accent-green);
          color: white;
        }

        .step-qty {
          padding: 0 10px;
          font-size: 0.84rem;
          font-weight: 800;
          color: #065f46;
          min-width: 24px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};
