'use client';

import React, { useEffect } from 'react';

export interface ToastData {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

// Popup kecil di bawah layar: tampil sesudah simpan berhasil / gagal,
// hilang sendiri sesudah 3 detik, bisa juga ditutup manual (tombol ✕).
// Selalu fixed supaya terlihat walau pemilik sedang scroll di bawah form.
export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      className={`save-toast ${toast.kind === 'success' ? 'save-toast-success' : 'save-toast-error'}`}
      role={toast.kind === 'success' ? 'status' : 'alert'}
    >
      <span className="save-toast-icon">{toast.kind === 'success' ? '✓' : '⚠️'}</span>
      <span className="save-toast-msg">{toast.message}</span>
      <button
        type="button"
        className="save-toast-close"
        onClick={onClose}
        aria-label="Tutup pemberitahuan"
      >
        ✕
      </button>

      <style jsx>{`
        .save-toast {
          position: fixed;
          left: 50%;
          bottom: 20px;
          transform: translateX(-50%);
          z-index: 1200;
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: calc(100vw - 32px);
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 0.88rem;
          font-weight: 700;
          box-shadow: 0 8px 30px rgba(15, 23, 42, 0.25);
          animation: toastSlideUp 0.25s ease;
        }

        .save-toast-success {
          background: #065f46;
          color: #ffffff;
        }

        .save-toast-error {
          background: #991b1b;
          color: #ffffff;
        }

        .save-toast-icon {
          font-size: 1rem;
          line-height: 1;
        }

        .save-toast-msg {
          line-height: 1.4;
        }

        .save-toast-close {
          background: transparent;
          border: none;
          color: inherit;
          font-size: 0.85rem;
          font-weight: 800;
          cursor: pointer;
          padding: 2px 6px;
          margin-left: 2px;
          opacity: 0.8;
        }

        .save-toast-close:hover {
          opacity: 1;
        }

        @keyframes toastSlideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 12px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
};
