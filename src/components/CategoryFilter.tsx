'use client';

import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="filter-wrapper">
      {/* Search Input Box */}
      <div className="search-bar-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Cari menu favoritmu (cth: Rendang, Ayam Pop, Es Teh)..."
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
      `}</style>
    </div>
  );
};
