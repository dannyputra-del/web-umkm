/**
 * Layanan Foto Supabase Storage (bucket 'umkm-foto').
 *
 * ASUMSI: bucket bernama 'umkm-foto' sudah dibuat di Supabase (public read)
 * oleh pekerja DB. Kode ini TIDAK membuat bucket; hanya memakai bucket itu.
 *
 * Foto lama TIDAK pernah dipertahankan: sebelum URL baru disimpan, foto lama
 * di bucket dihapus dulu. URL Unsplash/eksternal/dataUrl tidak pernah
 * disentuh — fungsi hapus mengembalikan false tanpa error untuk URL itu.
 */

import { supabase } from './supabase';

/** Nama bucket foto UMKM di Supabase Storage. */
export const STORAGE_BUCKET = 'umkm-foto';

/** Batas ukuran file awal yang diterima (10 MB), disamakan dengan imageCompressor. */
export const MAKS_UKURAN_FILE_BYTE = 10 * 1024 * 1024;

/**
 * Ubah teks bebas jadi slug aman untuk nama file
 * (huruf kecil, tanpa spasi/simbol, maksimal 60 karakter).
 */
export function slugify(teks: string): string {
  const hasil = teks
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return hasil || 'foto';
}

/**
 * Buat nama file unik: slug-id-timestamp-acak.webp
 * Contoh: nasi-goreng-12-1793123456789-x7k2pq.webp
 * Dipakai sebagai nama file di dalam folder bucket.
 */
export function buatNamaFileUnik(
  slug: string,
  id: string | number,
  ekstensi = 'webp'
): string {
  const dasar = slugify(`${slug}-${id}`);
  const capWaktu = Date.now();
  const acak = Math.random().toString(36).slice(2, 8);
  return `${dasar}-${capWaktu}-${acak}.${ekstensi}`;
}

/**
 * Unggah Blob/File hasil kompres ke bucket 'umkm-foto'.
 * Mengembalikan public URL foto. Lempar Error bila upload gagal.
 */
export async function uploadFotoTerkompres(
  file: File | Blob,
  folder: string,
  namaFileUnik: string
): Promise<string> {
  const jalur = `${folder}/${namaFileUnik}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(jalur, file, {
    contentType: 'image/webp',
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(`Gagal mengunggah foto: ${error.message}`);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(jalur);
  return data.publicUrl;
}

/**
 * Ambil path file di dalam bucket dari sebuah URL.
 * Mengembalikan null bila URL bukan milik bucket 'umkm-foto'
 * (misalnya URL Unsplash, URL eksternal lain, atau dataUrl base64).
 */
export function ambilPathDariUrlBucket(url: string): string | null {
  if (!url || url.startsWith('data:')) return null;
  const penanda = `/${STORAGE_BUCKET}/`;
  const posisi = url.indexOf(penanda);
  if (posisi === -1) return null;
  const path = url.slice(posisi + penanda.length).split(/[?#]/)[0];
  if (!path) return null;
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/** True bila URL adalah URL foto di bucket 'umkm-foto'. */
export function adalahUrlBucketUmkmFoto(url: string): boolean {
  return ambilPathDariUrlBucket(url) !== null;
}

/**
 * Hapus foto dari bucket 'umkm-foto' berdasarkan public URL-nya.
 * - URL bucket: hapus file, kembalikan true bila berhasil, false bila gagal.
 * - URL Unsplash/eksternal/dataUrl: kembalikan false tanpa error,
 *   tanpa mencoba menghapus apa pun.
 */
export async function hapusFotoDariStorage(url: string): Promise<boolean> {
  const path = ambilPathDariUrlBucket(url);
  if (!path) return false;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) {
    console.error('Gagal menghapus foto dari Storage:', error.message);
    return false;
  }
  return true;
}
