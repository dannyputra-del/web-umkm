'use client';

import React from 'react';

interface UnsavedChangesDialogProps {
  open: boolean;
  saving: boolean;
  onKeluar: () => void;
  onSimpan: () => void;
}

// Dialog konfirmasi saat pemilik mau pindah padahal ada perubahan yang
// belum disimpan. "Keluar" membuang perubahan dan lanjut pindah,
// "Simpan" menyimpan dulu lewat jalur simpan biasa, baru pindah bila berhasil.
export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  open,
  saving,
  onKeluar,
  onSimpan,
}) => {
  if (!open) return null;

  return (
    <div className="unsaved-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="unsaved-dialog-title">
      <div className="unsaved-dialog-card">
        <h3 id="unsaved-dialog-title" className="unsaved-dialog-title">
          Perubahan belum disimpan
        </h3>
        <p className="unsaved-dialog-text">
          Ada perubahan yang belum Anda simpan. Kalau keluar sekarang, perubahan itu akan hilang.
          Simpan dulu supaya perubahan Anda tidak hilang.
        </p>
        <div className="unsaved-dialog-actions">
          <button
            type="button"
            className="unsaved-dialog-btn-leave"
            onClick={onKeluar}
            disabled={saving}
          >
            Keluar
          </button>
          <button
            type="button"
            className="unsaved-dialog-btn-save"
            onClick={onSimpan}
            disabled={saving}
          >
            {saving ? '⏳ Menyimpan…' : '💾 Simpan'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .unsaved-dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(4px);
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: unsavedFadeIn 0.2s ease;
        }

        .unsaved-dialog-card {
          background: #ffffff;
          width: 100%;
          max-width: 420px;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 16px 48px rgba(15, 23, 42, 0.35);
        }

        .unsaved-dialog-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 10px 0;
        }

        .unsaved-dialog-text {
          font-size: 0.88rem;
          color: #475569;
          line-height: 1.6;
          margin: 0 0 20px 0;
        }

        .unsaved-dialog-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .unsaved-dialog-btn-leave,
        .unsaved-dialog-btn-save {
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
        }

        .unsaved-dialog-btn-leave {
          background: #f8fafc;
          color: #334155;
          border: 1px solid #e2e8f0;
        }

        .unsaved-dialog-btn-leave:hover:not(:disabled) {
          background: #f1f5f9;
        }

        .unsaved-dialog-btn-save {
          background: var(--primary, #c2410c);
          color: #ffffff;
          border: 1px solid transparent;
        }

        .unsaved-dialog-btn-save:hover:not(:disabled) {
          filter: brightness(1.08);
        }

        .unsaved-dialog-btn-leave:disabled,
        .unsaved-dialog-btn-save:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        @keyframes unsavedFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
