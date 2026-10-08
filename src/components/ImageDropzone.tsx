'use client';

import React, { useState, useRef } from 'react';
import { compressImage, CompressionResult } from '@/utils/imageCompressor';

interface ImageDropzoneProps {
  value: string;
  onChange: (dataUrl: string) => void;
  aspectRatio?: 'banner' | 'avatar' | 'product';
  label?: string;
  subLabel?: string;
  maxDimensions?: { width: number; height: number };
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  value,
  onChange,
  aspectRatio = 'product',
  label = 'Unggah Foto',
  subLabel = 'Tarik & lepas file foto ke sini, atau klik untuk memilih file',
  maxDimensions,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<CompressionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultDimensions = {
    banner: { width: 1200, height: 500 },
    avatar: { width: 400, height: 400 },
    product: { width: 600, height: 600 },
  };

  const targetDim = maxDimensions || defaultDimensions[aspectRatio];

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Format file harus berupa gambar (JPG, PNG, WebP, dsb.)');
      return;
    }

    setErrorMsg('');
    setIsProcessing(true);

    try {
      const result = await compressImage(file, {
        maxWidth: targetDim.width,
        maxHeight: targetDim.height,
        quality: 0.85,
      });

      setCompressionInfo(result);
      onChange(result.dataUrl);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal memproses gambar. Silakan coba file lain.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setCompressionInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`dropzone-container ${aspectRatio}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {value ? (
        /* Preview Area When Image is Present */
        <div className="preview-container">
          <div className={`preview-wrapper ${aspectRatio}`}>
            <img src={value} alt="Preview Foto" className="preview-image" />
            <div className="preview-overlay">
              <button
                type="button"
                className="btn-change-img"
                onClick={() => fileInputRef.current?.click()}
              >
                🔄 Ganti Foto
              </button>
              <button
                type="button"
                className="btn-remove-img"
                onClick={handleRemove}
              >
                🗑️ Hapus
              </button>
            </div>
          </div>

          {compressionInfo && (
            <div className="compression-badge">
              <span className="badge-spark">⚡</span>
              <span>
                Kompresi Otomatis: <strong>{compressionInfo.originalSizeFormatted}</strong> ➔{' '}
                <strong className="text-highlight">{compressionInfo.compressedSizeFormatted}</strong> (Hemat{' '}
                {compressionInfo.savingsPercent}%, Resolusi {compressionInfo.width}×{compressionInfo.height})
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Empty Dropzone Area */
        <div
          className={`dropzone-box ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          {isProcessing ? (
            <div className="loading-state">
              <span className="spinner-icon">⏳</span>
              <span className="loading-text">Sedang mengompres & mengoptimalkan gambar...</span>
            </div>
          ) : (
            <div className="empty-content">
              <div className="upload-icon-circle">
                <span>📁</span>
              </div>
              <p className="main-label">{label}</p>
              <p className="sub-label">{subLabel}</p>
              <span className="btn-select-file">Pilih Foto dari Galeri / Komputer</span>
              <span className="format-hint">
                Maksimal resolusi otomatis disesuaikan • Konversi ke WebP ringan
              </span>
            </div>
          )}
        </div>
      )}

      {errorMsg && <div className="error-hint">⚠️ {errorMsg}</div>}

      <style jsx>{`
        .dropzone-container {
          width: 100%;
          margin-bottom: 12px;
        }

        .dropzone-box {
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          background: #f8fafc;
          padding: 24px 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .dropzone-box:hover {
          border-color: #ea580c;
          background: #fff7ed;
        }

        .dropzone-box.dragging {
          border-color: #ea580c;
          background: #ffedd5;
          transform: scale(1.01);
        }

        .upload-icon-circle {
          width: 48px;
          height: 48px;
          background: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          margin-bottom: 10px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        }

        .main-label {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .sub-label {
          font-size: 0.78rem;
          color: #64748b;
          margin-bottom: 12px;
        }

        .btn-select-file {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f172a;
          padding: 6px 16px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          display: inline-block;
          margin-bottom: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .format-hint {
          font-size: 0.7rem;
          color: #94a3b8;
          display: block;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 20px;
        }

        .spinner-icon {
          font-size: 2rem;
          animation: spin 1.5s infinite linear;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          font-size: 0.85rem;
          font-weight: 600;
          color: #ea580c;
        }

        /* Preview Area */
        .preview-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .preview-wrapper {
          position: relative;
          overflow: hidden;
          background: #0f172a;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }

        .preview-wrapper.banner {
          height: 150px;
          width: 100%;
        }

        .preview-wrapper.avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: 3px solid #ea580c;
        }

        .preview-wrapper.product {
          width: 100%;
          height: 180px;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .preview-wrapper:hover .preview-overlay {
          opacity: 1;
        }

        .btn-change-img {
          background: #ffffff;
          color: #0f172a;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-remove-img {
          background: #ef4444;
          color: white;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }

        .compression-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
        }

        .badge-spark {
          font-size: 1rem;
        }

        .text-highlight {
          color: #059669;
        }

        .error-hint {
          color: #dc2626;
          font-size: 0.78rem;
          margin-top: 6px;
        }
      `}</style>
    </div>
  );
};
