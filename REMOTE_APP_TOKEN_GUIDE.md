# Update-Data Remote App – Token Sharing dari ESSPortal

Dokumen ini menjelaskan konsep utama bahwa Update-Data beroperasi sebagai remote app (microfrontend) yang di-embed dalam iframe oleh ESSPortal (Host), dan membutuhkan token autentikasi yang dibagikan dari ESSPortal ke Update-Data.

## Konsep Utama
- Update-Data berjalan sebagai SPA (Nuxt 3, ssr: false) pada origin terpisah (default: `http://localhost:3001`).
- Aplikasi ini tidak menampilkan halaman login sendiri saat berjalan sebagai remote app.
- Token akses dan data user dibagikan oleh ESSPortal menggunakan mekanisme `postMessage` (window-to-window messaging) ke iframe Update-Data.
- Token disimpan di `localStorage` dan diperbarui otomatis (auto-refresh) sebelum kedaluwarsa.

## Kebutuhan dari ESSPortal
1. Memuat halaman Update-Data dalam `<iframe>` yang mengarah ke URL Update-Data (mis. `http://localhost:3001/update-data`).
2. Mengirim token ke iframe melalui `postMessage` dengan format pesan sebagai berikut:

```javascript
// Dikirim dari ESSPortal (Host) ke iframe (Remote)
iframe.contentWindow.postMessage({
  type: 'AUTH_TOKEN',
  source: 'ess-sigma',    // penanda sumber pesan
  data: {
    access_token: '...',  // JWT access token
    refresh_token: '...', // optional, untuk auto-refresh
    expires_in: 1800,     // detik; default 30 menit
    user: {               // optional, data profil untuk UI
      employee_name: '...',
      email: '...'
    },
    user_roles: [/* optional, daftar role */],
    user_permissions: [/* optional, daftar permission */]
  }
}, remoteOrigin);
```

3. Mengizinkan origin Update-Data di whitelist Host (CSP/sandbox policy sesuai kebijakan keamanan).
4. Menangani permintaan dari Remote:
   - `REQUEST_TOKEN` → Host mengirim ulang `AUTH_TOKEN` bila diminta
   - `TOKEN_EXPIRED` → Host melakukan refresh atau login ulang, lalu kirim token baru
   - `LOGOUT_COMPLETE` → Notifikasi dari Remote bahwa token lokal telah dibersihkan

## Perilaku Update-Data (Remote)
- Plugin `plugins/iframe-token-handler.client.js` akan:
  - Memvalidasi origin pengirim berdasarkan `config/environment.js` (`REMOTE_APP.ALLOWED_ORIGINS`).
  - Menyimpan token, refresh token, dan expiry ke `localStorage`.
  - Menjadwalkan auto-refresh sebelum kedaluwarsa (buffer 5 menit).
  - Merespons event `LOGOUT` dari Host dengan membersihkan semua token lokal.
  - Meminta token ke Host jika belum tersedia (`REQUEST_TOKEN`).

- Middleware `middleware/auth.ts` memastikan halaman tetap dapat diakses di mode iframe meski token belum ada (akan diminta dari Host).
- Middleware `middleware/rbac.js` memvalidasi izin berdasarkan JWT atau `localStorage:user_permissions`.

## Alur Sederhana
1. ESSPortal memuat iframe Update-Data.
2. Update-Data mengirim `IFRAME_READY` (opsional) atau langsung `REQUEST_TOKEN` jika tidak ada token lokal.
3. ESSPortal mengirim `AUTH_TOKEN` ke iframe.
4. Update-Data menyimpan token, mengaktifkan auto-refresh, dan mulai memanggil API melalui proxy server (`/api/proxy/*`).
5. Jika token akan habis, Update-Data melakukan refresh menggunakan `refresh_token` (atau meminta Host jika refresh gagal).

## Pesan postMessage yang Didukung
- Dari Host ke Remote:
  - `AUTH_TOKEN` → Mengirim token dan data user.
  - `TOKEN_REFRESH` → Meminta Remote melakukan refresh token segera.
  - `LOGOUT` → Instruksi untuk logout/bersihkan token lokal.
  - `TICKET_AUTH` (opsional, untuk skenario SSO Ticket) → Mengirim ticket agar Remote melakukan exchange.

- Dari Remote ke Host:
  - `REQUEST_TOKEN` → Meminta Host mengirim `AUTH_TOKEN`.
  - `TOKEN_EXPIRED` → Memberi tahu Host token telah kadaluwarsa.
  - `IFRAME_READY` → Memberi tahu Host bahwa Remote siap menerima token.
  - `LOGOUT_COMPLETE` → Konfirmasi token lokal telah dibersihkan.

## Konfigurasi Keamanan
- Pastikan `REMOTE_APP.ALLOWED_ORIGINS` pada `config/environment.js` mencantumkan origin ESSPortal.
- Host sebaiknya mengonfigurasi iframe dengan sandbox/permission sesuai kebijakan keamanan.
- Hindari mengirim token ke origin yang tidak ter-allowlist.

## Minimal Integrasi di ESSPortal (Contoh)
```javascript
// Setelah iframe Update-Data dimuat dan siap menerima pesan
function sendAuthTokenToIframe(iframeEl, remoteOrigin, tokenBundle) {
  iframeEl.contentWindow.postMessage({
    type: 'AUTH_TOKEN',
    source: 'ess-sigma',
    data: tokenBundle // { access_token, refresh_token, expires_in, user, user_roles, user_permissions }
  }, remoteOrigin);
}

window.addEventListener('message', (event) => {
  if (event.data?.type === 'REQUEST_TOKEN') {
    // Kirim ulang token saat diminta
    sendAuthTokenToIframe(document.getElementById('updateDataIframe'), 'http://localhost:3001', getTokenBundle());
  }
  if (event.data?.type === 'TOKEN_EXPIRED') {
    // Refresh token di Host, lalu kirim ulang AUTH_TOKEN
    refreshAtHost().then(newBundle => {
      sendAuthTokenToIframe(document.getElementById('updateDataIframe'), 'http://localhost:3001', newBundle);
    });
  }
});
```

## Catatan
- Mode standalone (tanpa Host) tidak disarankan untuk produksi; mekanisme login dan token harus disediakan sendiri.
- Untuk skenario SSO Ticket, gunakan plugin `plugins/ticket-handler.client.js` dan endpoint `server/api/ticket-exchange.post.js` sebagai fallback. Namun alur utama yang disarankan adalah token sharing via `postMessage` dari ESSPortal.

## Deploy dengan Domain/IP Sendiri

Ketika Update-Data dideploy dengan domain/IP sendiri (mis. `https://update-data.company.com`), lakukan penyesuaian berikut:

### 1) Konfigurasi di Update-Data (Remote)
- Set environment production:
  - `API_BASE_URL` → URL backend ESS (prod)
  - `NUXT_PUBLIC_APP_NAME`, `NUXT_PUBLIC_APP_VERSION` (opsional)
- Sesuaikan origin Host (ESSPortal) di `config/environment.js`:
  - `REMOTE_APP.HOST_ORIGIN` → origin ESSPortal, mis. `https://portal.company.com`
  - `REMOTE_APP.ALLOWED_ORIGINS` → tambahkan seluruh origin ESSPortal (prod, staging bila perlu)
- Jika menerapkan CSP di Update-Data, pastikan mengizinkan di-embed oleh ESSPortal:
  - Header: `Content-Security-Policy: frame-ancestors https://portal.company.com;`
- Pastikan build/serve via HTTPS di production untuk mencegah mixed content di portal (jika portal HTTPS).

### 2) Penyesuaian di ESSPortal (Host)
- Iframe src diarahkan ke domain Update-Data:
  ```html
  <iframe
    id="updateDataIframe"
    src="https://update-data.company.com/update-data"
    sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-popups"
    allow="clipboard-read; clipboard-write"
  ></iframe>
  ```
- Set `remoteOrigin` sesuai domain Update-Data saat mengirim `postMessage`:
  ```javascript
  const remoteOrigin = 'https://update-data.company.com';
  iframe.contentWindow.postMessage({ type: 'AUTH_TOKEN', source: 'ess-sigma', data: tokenBundle }, remoteOrigin);
  ```
- Dengarkan pesan dari iframe dan validasi `event.origin` harus sama dengan domain Update-Data.
- Jika ESSPortal memakai CSP, tambahkan domain Update-Data ke directives terkait embedding dan koneksi:
  - `frame-src https://update-data.company.com` (atau `child-src` tergantung kebijakan)
  - `connect-src` jika portal melakukan komunikasi fetch ke domain Update-Data (biasanya tidak diperlukan karena komunikasi pakai `postMessage`).
- Jika menggunakan reverse proxy (Nginx/Ingress), pastikan header `X-Frame-Options` tidak memblokir embedding Update-Data oleh portal (gunakan CSP `frame-ancestors` sebagai gantinya).

### 3) Penyesuaian URL dan Origin per Lingkungan
Gunakan mapping per-environment (dev, staging, prod) di kedua sisi:
- Di Update-Data: set `HOST_ORIGIN` dan `ALLOWED_ORIGINS` sesuai portal environment aktif.
- Di ESSPortal: set `remoteOrigin` dan `iframe.src` sesuai domain Update-Data environment.

### 4) Alur Auth setelah Deployment
1. User login di ESSPortal (satu jalur otentikasi).
2. ESSPortal memuat iframe ke `https://update-data.company.com/update-data`.
3. Update-Data meminta token (`REQUEST_TOKEN`) bila belum ada.
4. ESSPortal mengirim `AUTH_TOKEN` ke origin `https://update-data.company.com`.
5. Update-Data menyimpan token dan menjalankan auto-refresh.
6. Seluruh panggilan API dari Update-Data berjalan via proxy `/api/proxy/*` ke `API_BASE_URL` (backend ESS) menggunakan bearer token.

### 5) Checklist Cepat
- [ ] `REMOTE_APP.HOST_ORIGIN` dan `ALLOWED_ORIGINS` diset ke domain ESSPortal
- [ ] ESSPortal mengirim `AUTH_TOKEN` ke `remoteOrigin` yang tepat (domain Update-Data)
- [ ] CSP/headers tidak memblokir embedding dan komunikasi (frame-ancestors, frame-src)
- [ ] HTTPS konsisten di portal dan Update-Data
- [ ] `API_BASE_URL` mengarah ke backend prod yang benar
