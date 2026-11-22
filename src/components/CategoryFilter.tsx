'use client';

import React from 'react';

export type SortOption =
  | 'best_selling'
  | 'price_asc'
  | 'price_desc'
  | 'rating_desc'
  | 'name_asc';

export type PriceRangeOption =
  | 'all'
  | 'under_10k'
  | '10k_25k'
  | '25k_50k'
  | 'over_50k';

export type AvailabilityOption = 'all' | 'available' | 'sold_out';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  priceRange?: PriceRangeOption;
  onPriceRangeChange?: (range: PriceRangeOption) => void;
  availabilityFilter?: AvailabilityOption;
  onAvailabilityChange?: (filter: AvailabilityOption) => void;
  searchPlaceholder?: string;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy = 'best_selling',
  onSortChange,
  priceRange = 'all',
  onPriceRangeChange,
  availabilityFilter = 'all',
  onAvailabilityChange,
  searchPlaceholder = 'Cari menu...',
}) => {
  return (
    <div className="filter-wrapper">
      {/* Search Input Box */}
      <div className="search-bar-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button
            className="clear-search-btn"
            onClick={() => onSearchChange('')}
          >
            ✕
          </button>
        )}
      </div>

      {/* Sortir & Filter */}
      <div className="controls-row">
        <label className="control-field">
          <span className="control-label">Urutkan</span>
          <select
            className="control-select"
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value as SortOption)}
            aria-label="Urutkan produk"
          >
            <option value="best_selling">Paling Laris</option>
            <option value="price_asc">Harga Termurah</option>
            <option value="price_desc">Harga Termahal</option>
            <option value="rating_desc">Rating Tertinggi</option>
            <option value="name_asc">Nama A-Z</option>
          </select>
        </label>

        <label className="control-field">
          <span className="control-label">Harga</span>
          <select
            className="control-select"
            value={priceRange}
            onChange={(e) => onPriceRangeChange?.(e.target.value as PriceRangeOption)}
            aria-label="Filter harga"
          >
            <option value="all">Semua Harga</option>
            <option value="under_10k">&lt; Rp10.000</option>
            <option value="10k_25k">Rp10.000 - Rp25.000</option>
            <option value="25k_50k">Rp25.000 - Rp50.000</option>
            <option value="over_50k">&gt; Rp50.000</option>
          </select>
        </label>

        <label className="control-field">
          <span className="control-label">Ketersediaan</span>
          <select
            className="control-select"
            value={availabilityFilter}
            onChange={(e) =>
              onAvailabilityChange?.(e.target.value as AvailabilityOption)
            }
            aria-label="Filter ketersediaan"
          >
            <option value="all">Semua</option>
            <option value="available">Tersedia Saja</option>
            <option value="sold_out">Habis Saja</option>
          </select>
        </label>
      </div>

      {/* Horizontal Scrollable Categories */}
      <div className="category-scroll-container">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              className={`cat-pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat)}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .filter-wrapper {
          padding: 16px 20px 8px 20px;
          background: #ffffff;
          position: sticky;
          top: 0;
          z-index: 40;
          border-bottom: 1px solid var(--border-color);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }

        .search-bar-box {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1.5px solid var(--border-strong);
          border-radius: var(--radius-full);
          padding: 6px 14px;
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }

        .search-bar-box:focus-within {
          background: #ffffff;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(194, 65, 12, 0.12);
        }

        .search-icon {
          font-size: 0.95rem;
          margin-right: 8px;
          opacity: 0.6;
        }

        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-family: inherit;
          font-size: 0.88rem;
          color: var(--text-main);
          outline: none;
        }

        .clear-search-btn {
          background: #e2e8f0;
          color: #475569;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          font-size: 0.7rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .category-scroll-container {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 6px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .category-scroll-container::-webkit-scrollbar {
          display: none;
        }

        .cat-pill-btn {
          white-space: nowrap;
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 600;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }

        .cat-pill-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .cat-pill-btn.active {
          background: var(--primary);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(194, 65, 12, 0.3);
        }

        .controls-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .control-field {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1 1 140px;
          min-width: 0;
        }

        .control-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .control-select {
          width: 100%;
          border: 1.5px solid var(--border-strong);
          border-radius: 10px;
          background: #f8fafc;
          padding: 8px 10px;
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-main);
          outline: none;
          cursor: pointer;
        }

        .control-select:focus {
          border-color: var(--primary);
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(194, 65, 12, 0.12);
        }
      `}</style>
    </div>
  );
};
