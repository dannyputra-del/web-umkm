/**
 * Utilitas Kompresi Gambar Ekstrim di Sisi Klien (Browser)
 * Mengubah file gambar resolusi tinggi (3-10 MB) menjadi WebP ringan (<100 KB)
 * tanpa mengurangi ketajaman visual di layar.
 *
 * Aturan yang ditegakkan:
 * - Hanya file gambar (image/*) yang diterima.
 * - File awal di atas 10 MB ditolak.
 * - Hasil akhir WAJIB di bawah 100 KB: dicoba kualitas 0.85, lalu 0.7,
 *   lalu 0.55. Kalau sesudah 0.55 masih di atas 100 KB, fungsi melempar
 *   Error — tidak pernah mengembalikan dataUrl besar diam-diam.
 * - Skala proporsional dipertahankan agar foto tidak gepeng.
 */

export interface CompressionResult {
  dataUrl: string;
  /** Blob hasil kompres (siap diunggah ke Storage tanpa konversi ulang). */
  blob: Blob;
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

/** File awal maksimal 10 MB. */
export const MAKS_UKURAN_AWAL_BYTE = 10 * 1024 * 1024;

/** Hasil kompres maksimal 100 KB. */
export const MAKS_UKURAN_HASIL_BYTE = 100 * 1024;

/** Kualitas yang dicoba berurutan sampai hasil di bawah 100 KB. */
const KUALITAS_COBA = [0.85, 0.7, 0.55];

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function canvasKeBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((hasil) => resolve(hasil), mime, quality);
  });
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  // Tolak file bukan gambar.
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar (JPG, PNG, WebP, dsb.).');
  }

  // Tolak file awal di atas 10 MB.
  if (file.size > MAKS_UKURAN_AWAL_BYTE) {
    throw new Error(
      `File terlalu besar (${formatBytes(file.size)}). Maksimal ukuran foto 10 MB, silakan pilih foto yang lebih kecil.`
    );
  }

  const { maxWidth = 1200, maxHeight = 1200, quality = 0.85 } = options;
  // Kualitas awal dari pemanggil dipakai dulu, lalu turun bila perlu.
  const daftarKualitas = [quality, ...KUALITAS_COBA.filter((k) => k < quality)];

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
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

        // Coba kualitas menurun sampai hasil di bawah 100 KB.
        let hasilTerbaik: { blob: Blob; dataUrl: string } | null = null;

        for (const kualitas of daftarKualitas) {
          // Export ke WebP (modern & ringan) dengan fallback JPEG jika browser lama
          let blob = await canvasKeBlob(canvas, 'image/webp', kualitas);
          let mimeDipakai = 'image/webp';
          if (!blob) {
            blob = await canvasKeBlob(canvas, 'image/jpeg', kualitas);
            mimeDipakai = 'image/jpeg';
          }
          if (!blob) continue;

          const dataUrl = canvas.toDataURL(mimeDipakai, kualitas);

          if (!hasilTerbaik || blob.size < hasilTerbaik.blob.size) {
            hasilTerbaik = { blob, dataUrl };
          }

          if (blob.size <= MAKS_UKURAN_HASIL_BYTE) {
            const savingsPercent = Math.max(
              0,
              Math.round(((file.size - blob.size) / file.size) * 100)
            );

            resolve({
              dataUrl,
              blob,
              originalSizeBytes: file.size,
              compressedSizeBytes: blob.size,
              originalSizeFormatted: formatBytes(file.size),
              compressedSizeFormatted: formatBytes(blob.size),
              savingsPercent,
              width,
              height,
            });
            return;
          }
        }

        // Sesudah kualitas terendah (0.55) masih di atas 100 KB: tolak.
        const ukuranTerkecil = hasilTerbaik
          ? formatBytes(hasilTerbaik.blob.size)
          : 'tidak diketahui';
        reject(
          new Error(
            `Foto masih terlalu besar sesudah dikompres (${ukuranTerkecil}, batas 100 KB). Silakan pilih foto dengan resolusi lebih rendah atau ukuran file lebih kecil.`
          )
        );
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
