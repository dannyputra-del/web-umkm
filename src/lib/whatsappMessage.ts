import { Order, StoreInfo } from '@/types';

const formatRupiah = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

// Waktu order lengkap (tanggal + jam, format Indonesia) dari ISO;
// bila bukan ISO valid, tampilkan apa adanya.
const formatOrderTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Pesan WA pesanan: hanya data pembeli + rincian menu + total harga
// makanan (subtotal = total). Tanpa tipe pesanan, tanpa nomor meja,
// tanpa alamat, tanpa link Maps, tanpa baris Metode Bayar, tanpa
// subtotal / biaya layanan / ongkir terpisah — pembayaran dan
// pengiriman dibicarakan langsung di chat WA.
export function buildWhatsAppOrderMessage(order: Order, store: StoreInfo): string {
  const itemLines = order.items
    .map(
      (i) =>
        `• ${i.product.name} (${i.quantity}x @ ${formatRupiah(i.product.price)}) = ${formatRupiah(i.product.price * i.quantity)}${
          i.notes ? ` [Catatan: ${i.notes}]` : ''
        }`
    )
    .join('\n');

  return `Halo ${store.name}, saya mau pesan via Website Menu Online! 🍽️

*NO PESANAN: ${order.orderNumber}*
*Waktu Pesanan:* ${formatOrderTime(order.createdAt)}
------------------------------
*Nama:* ${order.customer.name}
*No. WhatsApp:* ${order.customer.phone}
${order.customer.notes ? `*Catatan Pembeli:* ${order.customer.notes}\n` : ''}
*RINCIAN MENU:*
${itemLines}

------------------------------
*Total Harga Makanan:* ${formatRupiah(order.total)}

Pembayaran dan pengiriman dibicarakan di chat WhatsApp ini ya. Terima kasih!`;
}

// Link wa.me ke nomor WA toko (store.whatsapp, normalisasi ke digit saja).
export function buildWhatsAppOrderUrl(order: Order, store: StoreInfo): string {
  const storeWa = (store.whatsapp || store.phone || '').replace(/\D/g, '');
  return `https://wa.me/${storeWa}?text=${encodeURIComponent(
    buildWhatsAppOrderMessage(order, store)
  )}`;
}
