import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Restoran Padang Jaya Makmur | Menu & Pesan Online UMKM',
  description:
    'Website pemesanan online instan menu khas Restoran Padang Jaya Makmur. Pilih menu favorit, masukkan keranjang, lalu pesan via WhatsApp dan konfirmasi langsung di chat.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
