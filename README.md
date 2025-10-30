# Update Data - Remote Microfrontend App

Update Data adalah aplikasi remote microfrontend yang berjalan terpisah dari ESS-Sigma (Host) dan dimuat melalui iframe. Aplikasi ini menghandle semua fitur terkait update data karyawan.

## 🏗️ Arsitektur

```
SuperSigma/
├── ESS-Sigma/          # Host Application (Portal)
│   ├── pages/
│   │   └── update-data-iframe.vue  # Iframe container page
│   └── composables/
│       └── useIframeAuth.js        # Iframe authentication handler
│
└── Update-Data/        # Remote Application (Microfrontend)
    ├── pages/
    │   ├── index.vue              # Landing page (redirects)
    │   └── update-data/           # Main update data pages
    ├── components/
    │   └── update-data/           # Update data components
    ├── plugins/
    │   └── iframe-token-handler.client.js  # Token receiver & auto-refresh
    └── config/
        └── environment.js         # Remote app configuration
```

## 🚀 Setup & Development

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

```bash
cd Update-Data
npm install
```

### Development

```bash
# Run Update-Data on port 3001
npm run dev
```

Aplikasi akan running di `http://localhost:3001`

### Build for Production

```bash
npm run build
npm run start
```

## 🔐 Authentication Flow

Lihat juga: `REMOTE_APP_TOKEN_GUIDE.md` untuk ringkasan remote app & token sharing dari ESSPortal.

Catatan deployment: Bila Update-Data menggunakan domain sendiri (mis. `https://update-data.company.com`), ESSPortal harus menyesuaikan `iframe.src`, `remoteOrigin` pada `postMessage`, dan CSP (`frame-ancestors`/`frame-src`). Detail lengkap ada di `REMOTE_APP_TOKEN_GUIDE.md` bagian Deploy.

### 1. Token Passing dari Host ke Remote

Ketika ESS-Sigma membuka Update-Data via iframe:

1. **ESS-Sigma** (Host) mengirim token via `postMessage`:
```javascript
iframe.contentWindow.postMessage({
  type: 'AUTH_TOKEN',
  data: {
    access_token: '...',
    refresh_token: '...',
    expires_in: 1800
  }
}, remoteOrigin);
```

2. **Update-Data** (Remote) menerima token via plugin `iframe-token-handler.client.js`:
```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'AUTH_TOKEN') {
    saveTokens(data.access_token, data.refresh_token, data.expires_in);
  }
});
```

### 2. Auto Token Refresh

Update-Data secara otomatis refresh token 5 menit sebelum expired:

```javascript
// Setup auto-refresh timer
const refreshBuffer = 5 * 60 * 1000; // 5 minutes
const refreshTime = (expires_in * 1000) - refreshBuffer;

setTimeout(() => {
  refreshAccessToken();
}, refreshTime);
```

### 3. Token Expired Handling

Jika token expired, Update-Data notify Host untuk request token baru:

```javascript
window.parent.postMessage({
  type: 'TOKEN_EXPIRED',
  source: 'update-data'
}, hostOrigin);
```

## 📡 API Communication

### Axios Configuration

Axios client sudah dikonfigurasi untuk menggunakan token dari `iframe-token-handler`:

```javascript
// Request interceptor
apiService.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Error Handling

Jika API return 401 (Unauthorized), axios akan notify parent:

```javascript
if (isTokenExpired && process.client) {
  window.parent.postMessage({
    type: 'TOKEN_EXPIRED',
    source: 'update-data'
  }, envConfig.REMOTE_APP.HOST_ORIGIN);
}
```

## 🔧 Configuration

### Environment Variables

File: `config/environment.js`

```javascript
export default {
  API_BASE_URL: 'https://apigwsand.telkomsigma.co.id/essbe',
  REMOTE_APP: {
    PORT: 3001,
    HOST_ORIGIN: 'http://localhost:3000',
    ALLOWED_ORIGINS: [
      'http://localhost:3000',
      'https://ess-dev.telkomsigma.co.id'
    ]
  },
  SECURITY: {
    JWT_EXPIRY: 1800000, // 30 minutes
    TOKEN_REFRESH_BUFFER: 300000 // 5 minutes
  }
}
```

### Nuxt Config

Port development: **3001**

```javascript
devServer: {
  port: 3001,
  host: '0.0.0.0'
}
```

### Tech Stack

- Nuxt 3 (SPA, ssr: false), Vue 3, Vue Router
- PrimeVue 4, PrimeIcons, @primeuix/themes (Aura)
- TailwindCSS, @nuxtjs/google-fonts (Lato)
- @vueuse/core & @vueuse/nuxt
- Axios (client-side helpers)

### NPM Scripts

```bash
npm run dev              # Start dev server (port 3001)
npm run build            # Build
npm run start            # Start production build (.output)
npm run build:production # Build with NODE_ENV=production (Windows)
npm run start:production # Start with NODE_ENV=production
npm run generate         # SSG generate (tidak digunakan; app ini SPA)
npm run preview          # Preview build
npm run lint             # ESLint
npm run lint:fix         # ESLint --fix
npm run type-check       # Nuxt typecheck (TS)
```

### Nuxt Modules & Plugins

- Modules: TailwindCSS, Google Fonts, Color Mode, PrimeVue
- Plugins client:
  - `plugins/iframe-token-handler.client.js` (token receiver, auto-refresh, postMessage)
  - `plugins/update-data-navigation.client.js` (reset cache saat kembali dari history)
  - `plugins/ticket-handler.client.js` (opsional; SSO ticket flow)
  - `plugins/url-sync.client.js`, `plugins/iframe-ready.client.js` (utility)

### Middleware

- `middleware/auth.ts`: cek token hanya di client; jika tidak valid di iframe → minta token ke parent, tidak redirect ke login
- `middleware/rbac.js`: validasi permissions dari JWT atau `localStorage:user_permissions`; 403 bila tidak memenuhi

## 🧩 Server (Nitro) & Proxy Endpoints

Semua endpoint berada di `server/api/` (base route: `/api`). Menggunakan preset Node.

- `POST /api/ticket-exchange`
  - Body: `{ ticket }`
  - Proxy ke `${API_BASE_URL}/auth/ticket-exchange`

- `ALL /api/proxy/[...path]`
  - Catch-all proxy: meneruskan query, Authorization, dan body
  - Validasi response JSON (error bila backend mengembalikan HTML)

- `GET /api/proxy/employee/basic-information`
  - Ambil token dari Authorization/cookies/query
  - Proxy ke `${API_BASE_URL}/employee/basic-information`
  - Normalisasi response: `{ success, status, data }`

- `GET /api/proxy/employee/address`
  - Proxy ke `${API_BASE_URL}/employee/address`

- `GET /api/proxy/master-api?category=...`
  - Proxy ke `${API_BASE_URL}/master-api` dengan query params

- Struktur lainnya (tersedia via file route):
  - `/api/proxy/employee/attachments/[id]/(information|preview|download|delete)`
  - `/api/proxy/employee/attachments/parent/[parent_id]/item/[item_id]/(preview|download)`
  - `/api/proxy/employee/change-request` (GET/POST)
  - `/api/proxy/employee/change-request/[id]` (GET/PUT)
  - `/api/proxy/employee/change-request/[id]/attachments` (POST)
  - `/api/proxy/employee/change-request/[id]/attachments/[attachmentId]` (DELETE)

## 🧩 Composables Penting (ringkas)

- Auth/komunikasi host: `useAuth.js`, `useAuthenticationCore.js`
- API & cache: `useApi.js`, `useApiCache.js`, `useMasterData.js`, `useMasterOptions.js`
- Edit flows/state: `useUnifiedEditState.js`, `useEditModePreservation.js`, `useTabManagement.js`
- Histori: `useRequestHistory.js`, `useChangeRequestHistory.js`, `useHybridRequestHistory.js`
- UX/observabilitas: `useErrorHandler.js`, `useToast.js`, `useLogger.js`

## 🗂️ Struktur Direktori (ringkas)

```
components/                # UI components (common, form, layout, update-data/*)
composables/               # Reusable state & logic (auth, api, cache, edit flows)
layouts/update-data.vue    # Layout utama
middleware/auth.ts         # Auth check (client), iframe-friendly
middleware/rbac.js         # RBAC dari JWT/localStorage
pages/                     # Halaman (login, ticket-loading, update-data/*)
plugins/                   # Iframe token/ticket handlers, navigation reset
server/api/                # Nitro endpoints (proxy, ticket-exchange)
assets/css/                # Tailwind & global styles
config/environment.js      # Konfigurasi env & constants
```

## 📋 Features

### Modules yang tersedia:
- ✅ **Update Personal Data** - Update informasi pribadi karyawan
- ✅ **Address Management** - Manage alamat karyawan
- ✅ **Emergency Contact** - Manage kontak darurat
- ✅ **Family Data** - Manage data keluarga
- ✅ **Education** - Manage riwayat pendidikan
- ✅ **Payroll Account** - Manage akun payroll
- ✅ **Social Security** - Manage data BPJS/Jamsostek
- ✅ **Medical Record** - Manage rekam medis
- ✅ **Employment Info** - Informasi kepegawaian
- ✅ **Change Request History** - Riwayat perubahan data
- ✅ **Consent Management** - Manage persetujuan data

## 🔒 Security

### Origin Validation

Semua postMessage divalidasi origin-nya:

```javascript
const isValidOrigin = (origin) => {
  return envConfig.REMOTE_APP.ALLOWED_ORIGINS.includes(origin);
};

window.addEventListener('message', (event) => {
  if (!isValidOrigin(event.origin)) {
    console.warn('Invalid origin:', event.origin);
    return;
  }
  // Process message...
});
```

### Token Storage

Token disimpan di `localStorage` dengan key:
- `access_token`
- `refresh_token`
- `token_expiry`

### Iframe Sandbox

Iframe di host menggunakan sandbox attributes untuk security:

```html
<iframe
  sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-popups"
  allow="clipboard-read; clipboard-write"
/>
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Token berhasil diterima dari Host
- [ ] Token auto-refresh berjalan dengan baik
- [ ] Token expired handling bekerja
- [ ] Navigation antar pages berfungsi
- [ ] API calls menggunakan token yang benar
- [ ] Logout dari Host membersihkan token di Remote

### Testing Commands

```bash
# Run dev mode
npm run dev

# Test in browser
# 1. Run ESS-Sigma (Host) on port 3000
# 2. Run Update-Data (Remote) on port 3001
# 3. Navigate to http://localhost:3000/update-data-iframe
```

## 📦 Deployment

### Production Build

```bash
npm run build:production
```

### Environment Setup

Production environment harus set:
- `API_BASE_URL` - Production API endpoint
- `HOST_ORIGIN` - Production host URL
- `ALLOWED_ORIGINS` - List of allowed origins

### Port Configuration

Development: `3001`
Production: Configure sesuai infrastructure

## 🐛 Troubleshooting

### Token tidak diterima dari Host

**Solusi:**
1. Check console untuk error postMessage
2. Verify origin di `ALLOWED_ORIGINS`
3. Check iframe load event

### API calls returning 401

**Solusi:**
1. Check token di localStorage
2. Verify axios interceptor
3. Check token expiry time

### Iframe tidak load

**Solusi:**
1. Check remote app running di port 3001
2. Verify iframe URL di host
3. Check browser console untuk CORS errors

## 📚 Resources

- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [Iframe Security Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#security_concerns)

## 👥 Team

Developed by Telkom Sigma ESS Team

## 📄 License

Proprietary - Telkom Sigma
