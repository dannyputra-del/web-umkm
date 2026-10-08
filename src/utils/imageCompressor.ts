/**
 * Utilitas Kompresi Gambar Ekstrim di Sisi Klien (Browser)
 * Mengubah file gambar resolusi tinggi (3-10 MB) menjadi WebP ringan (<100 KB)
 * tanpa mengurangi ketajaman visual di layar.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  originalSizeFormatted: string;
  compressedSizeFormatted: string;
  savingsPercent: number;
  width: number;
  height: number;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 s/d 1.0 (default 0.85)
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Hitung skala proporsional agar tidak gepeng atau distorsi
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context tidak tersedia'));
          return;
        }

        // Terapkan image smoothing kualitas tinggi
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Gambar ke canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export ke WebP (modern & ringan) dengan fallback JPEG jika browser lama
        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Hitung perkiraan ukuran byte dari Base64 string
        const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
        const compressedSizeBytes = Math.round((base64Length * 3) / 4);

        const savingsPercent = Math.max(
          0,
          Math.round(((file.size - compressedSizeBytes) / file.size) * 100)
        );

        resolve({
          dataUrl,
          originalSizeBytes: file.size,
          compressedSizeBytes,
          originalSizeFormatted: formatBytes(file.size),
          compressedSizeFormatted: formatBytes(compressedSizeBytes),
          savingsPercent,
          width,
          height,
        });
      };

      img.onerror = () => {
        reject(new Error('Gagal memuat file gambar'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file'));
    };

    reader.readAsDataURL(file);
  });
}
