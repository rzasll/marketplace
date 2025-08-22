```markdown
# Bolen & Es Teler — Multi-page Static Store (Client-side)

Overview
- Multi-page static site mimicking premium small-shop experience.
- Pages: index.html, products.html, product.html, cart.html, checkout.html.
- Client-side product data: products.json.
- Cart stored in localStorage; checkout sends order via WhatsApp (wa.me).

How to run
1. Simpan semua file di satu folder (index.html, products.html, product.html, cart.html, checkout.html, products.json, styles.css, common.js, README.md).
2. Buka index.html di browser (Chrome/Firefox/Edge). Karena fetch digunakan untuk products.json, jika file dibuka langsung dari file:// masalah CORS mungkin terjadi di beberapa browser. Solusi:
   - Jalankan server lokal singkat, contohnya:
     - Python 3: `python -m http.server 8000` lalu buka `http://localhost:8000/`
     - atau `npx serve .`
3. Edit data produk:
   - Buka `products.json`, tambahkan/ubah produk (id harus unik).
4. Ubah nomor WhatsApp:
   - Buka `common.js`, edit SHOP.wa (format: country code tanpa +/0, contoh: 6288299435445).

Fitur implemented
- Multi-page structure.
- Produk list with search & sort.
- Product detail page with variant & quantity.
- Add-to-cart, cart page to edit quantities, remove items.
- Checkout form constructs a readable WhatsApp message with full order summary.
- "Beli" buttons open direct short WhatsApp message: "kak mau beli <item> ya".
- Responsive layout and lightweight animations.
- All UI customizable via CSS.

Planned improvements (I can implement next)
- User accounts / login & order history.
- Payment gateway integration (Midtrans/etc).
- Image gallery and real product images upload support.
- Server-side order persistence (Google Sheets / Firebase).
- SEO improvements and meta tags per product.

If Anda mau, saya bisa:
- Implementasikan gambar produk upload & gallery.
- Hubungkan checkout ke Google Sheets untuk simpan pesanan otomatis.
- Tambah sistem stok & notifikasi.
Pilih satu fitur dan saya tambahkan langsung.
```
```