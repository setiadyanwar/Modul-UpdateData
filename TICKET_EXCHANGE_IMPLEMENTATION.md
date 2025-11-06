# Ticket Exchange Implementation - Update-Data Microfrontend

Dokumentasi implementasi SSO Ticket Exchange untuk bypass login Update-Data ketika dibuka dalam iframe ESSPortal.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Alur Kerja (Flow)](#alur-kerja-flow)
3. [Komponen yang Diimplementasikan](#komponen-yang-diimplementasikan)
4. [API Endpoint](#api-endpoint)
5. [Setup di ESSPortal (Parent App)](#setup-di-essportal-parent-app)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Update-Data microfrontend sekarang mendukung **SSO Ticket Exchange** untuk bypass login ketika dibuka dalam iframe ESSPortal.

**Cara kerja:**
1. User login di ESSPortal → dapat ticket
2. ESSPortal load iframe Update-Data dengan URL: `?ticket=xxx`
3. Update-Data detect ticket → exchange dengan essbe API
4. Update-Data dapat JWT token → simpan → redirect ke `/update-data`
5. User langsung masuk tanpa login manual

---

## 🔄 Alur Kerja (Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                     1. User Login di ESSPortal                   │
│                     POST /auth/login → dapat ticket              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│        2. ESSPortal load iframe dengan ticket di URL             │
│        <iframe src="http://localhost:3001?ticket=xxx">           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│   3. Update-Data Plugin (ticket-handler.client.js) detect       │
│      ticket di URL atau via postMessage dari parent              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│       4. Redirect ke /ticket-loading page (loading UI)           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│   5. Plugin call API essbe: POST /auth/ticket/login              │
│      Request: { "ticket": "xxx" }                                │
│      Response: {                                                 │
│        "status": true,                                           │
│        "data": { user_id, employee_id, email, name, ... },       │
│        "token": {                                                │
│          "access_token": "eyJhbGci...",                          │
│          "refresh_token": "...",                                 │
│          "expires_in": 1800                                      │
│        }                                                         │
│      }                                                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│   6. Simpan ke localStorage:                                     │
│      - access_token                                              │
│      - refresh_token                                             │
│      - token_expiry                                              │
│      - user (JSON data)                                          │
│      - user_roles (optional)                                     │
│      - user_permissions (optional)                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            7. Redirect ke /update-data (main app)                │
│               User langsung masuk, bypass login! ✅              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Komponen yang Diimplementasikan

### 1. **Plugin: ticket-handler.client.js**

**Location:** `plugins/ticket-handler.client.js`

**Fungsi:**
- Detect ticket dari URL query parameter (`?ticket=xxx`)
- Detect ticket dari postMessage parent (jika CORS block direct access)
- Clear old tokens sebelum exchange
- Exchange ticket dengan API essbe `POST /auth/ticket/login`
- Simpan token & user data ke localStorage
- Redirect ke `/update-data`

**Key Features:**
```javascript
// Detect ticket dari URL
let ticket = route.query.ticket;

// Detect ticket dari parent via postMessage
if (!ticket && window.parent !== window) {
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'TICKET_AUTH') {
      ticket = event.data.ticket;
    }
  });
}

// Exchange ticket
const response = await apiPost('/auth/ticket/login', { ticket });
localStorage.setItem('access_token', response.token.access_token);
router.push('/update-data');
```

---

### 2. **Page: ticket-loading.vue**

**Location:** `pages/ticket-loading.vue`

**Fungsi:**
- Menampilkan loading UI saat proses ticket exchange
- Simple spinner + text "Authenticating..."
- Layout disabled (full screen)

---

### 3. **Parent Script: parent-ticket-sender.js**

**Location:** `public/parent-ticket-sender.js`

**Fungsi:** (Untuk ESSPortal)
- Ambil ticket dari parent URL
- Cari iframe Update-Data
- Kirim ticket via postMessage dengan type `TICKET_AUTH`
- Listen untuk `REQUEST_TICKET` dari iframe

**⚠️ IMPORTANT:** Script ini harus di-include di **ESSPortal**, bukan Update-Data!

---

## 🔌 API Endpoint

### POST `/auth/ticket/login`

**Base URL:** `https://apigwsand.telkomsigma.co.id/essbe` (development)

**Request:**
```json
{
  "ticket": "a959636cc6695-49a2-8ea9-3cc6cadf7c6d2"
}
```

**Response (Success):**
```json
{
  "status": true,
  "message": "your data is available",
  "data": {
    "user_id": 43,
    "employee_id": "3271",
    "nik": "500202029",
    "email": "OKTAVIAN.ARIES@TELKOM.CO.ID",
    "name": "OKTAVIAN ARIES AZIZ",
    "photo": null,
    "source": "SSO"
  },
  "token": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "...",
    "expires_in": 1800
  }
}
```

**Response (Error):**
```json
{
  "status": false,
  "message": "Invalid ticket or ticket expired"
}
```

---

## 🔧 Setup di ESSPortal (Parent App)

### Step 1: Copy Script ke ESSPortal

Copy file `public/parent-ticket-sender.js` ke folder public/static ESSPortal.

### Step 2: Include Script di ESSPortal

**Option A: Via nuxt.config.js**
```javascript
export default {
  head: {
    script: [
      { src: '/parent-ticket-sender.js', defer: true }
    ]
  }
}
```

**Option B: Via index.html/app.html**
```html
<script src="/parent-ticket-sender.js"></script>
```

### Step 3: Load Iframe dengan Ticket

Di ESSPortal, ketika load iframe Update-Data, pastikan URL include ticket:

```javascript
// Example di ESSPortal
const ticket = 'a959636cc6695-49a2-8ea9-3cc6cadf7c6d2'; // dari SSO login
const iframeUrl = `http://localhost:3001?ticket=${ticket}`;

// Load iframe
const iframe = document.createElement('iframe');
iframe.src = iframeUrl;
iframe.id = 'update-data-iframe'; // IMPORTANT: Set ID/name untuk detection
document.body.appendChild(iframe);
```

**⚠️ PENTING:**
- Iframe harus punya `id="update-data-iframe"` atau `name="update-data"` atau URL include `update-data`
- Ini digunakan oleh `parent-ticket-sender.js` untuk find iframe yang correct

---

## 🧪 Testing

### Development Testing (localhost)

1. **Start Update-Data:**
   ```bash
   npm run dev
   # Jalan di http://localhost:3001
   ```

2. **Simulate ESSPortal:**
   Buat file HTML sederhana untuk test:

   ```html
   <!-- test-parent.html -->
   <!DOCTYPE html>
   <html>
   <head>
     <title>ESSPortal Test</title>
   </head>
   <body>
     <h1>ESSPortal Simulator</h1>
     <iframe
       id="update-data-iframe"
       src="http://localhost:3001?ticket=a959636cc6695-49a2-8ea9-3cc6cadf7c6d2"
       width="100%"
       height="600px"
     ></iframe>

     <script src="http://localhost:3001/parent-ticket-sender.js"></script>
   </body>
   </html>
   ```

3. **Open test-parent.html di browser**
   - Check console log untuk melihat ticket exchange process
   - Seharusnya Update-Data langsung redirect ke `/update-data`

### Production Testing

1. Build Update-Data:
   ```bash
   npm run build
   pm2 start ecosystem.config.cjs
   ```

2. Test dengan ESSPortal production URL:
   ```
   https://people-dev.telkomsigma.co.id/update-data?ticket=xxx
   ```

---

## 🐛 Troubleshooting

### Issue 1: "No ticket found"

**Symptom:** Console log menunjukkan `[Ticket Handler] ❌ No ticket found`

**Solution:**
- Pastikan URL include `?ticket=xxx`
- Check apakah parent-ticket-sender.js sudah jalan di ESSPortal
- Check console log di parent window untuk lihat apakah ticket dikirim

**Debug:**
```javascript
// Di browser console (parent window)
console.log(window.location.search); // Should show ?ticket=xxx

// Di iframe console
console.log(route.query.ticket); // Should show ticket value
```

---

### Issue 2: "CORS blocked"

**Symptom:**
```
Access to XMLHttpRequest at 'https://apigwsand.telkomsigma.co.id/essbe/auth/ticket/login'
from origin 'http://localhost:3001' has been blocked by CORS policy
```

**Solution:**
- Check API server CORS configuration
- Ensure `Access-Control-Allow-Origin` header di-set oleh server
- Untuk development, bisa gunakan proxy di nuxt.config.ts

**Workaround:**
```javascript
// nuxt.config.ts
export default {
  nitro: {
    devProxy: {
      '/api/proxy': {
        target: 'https://apigwsand.telkomsigma.co.id/essbe',
        changeOrigin: true,
        prependPath: true
      }
    }
  }
}
```

---

### Issue 3: "Ticket exchange failed"

**Symptom:** API return `{ "status": false, "message": "Invalid ticket" }`

**Possible Causes:**
1. Ticket sudah expired (biasanya ticket lifetime 5-10 menit)
2. Ticket sudah pernah dipakai (single-use)
3. Ticket format salah
4. API endpoint salah

**Solution:**
- Generate ticket baru dari SSO login
- Check API base URL di `config/environment.js`
- Verify endpoint: `/auth/ticket/login` (bukan `/ticket-login/`)

---

### Issue 4: "postMessage not received"

**Symptom:** Iframe tidak menerima ticket via postMessage

**Solution:**
1. Check `parent-ticket-sender.js` sudah load di parent window
2. Check iframe ID/name correct:
   ```javascript
   // Harus salah satu dari:
   iframe.id = 'update-data-iframe'
   iframe.name = 'update-data'
   // ATAU URL include 'update-data'
   ```

3. Check target origin di postMessage:
   ```javascript
   // Di parent-ticket-sender.js, ganti '*' dengan origin spesifik
   const targetOrigin = 'http://localhost:3001'; // Development
   // atau
   const targetOrigin = 'https://people-dev.telkomsigma.co.id'; // Production
   ```

---

### Issue 5: "Token saved but still redirect to login"

**Symptom:** Token tersimpan di localStorage tapi tetap ke login page

**Solution:**
- Check middleware/auth.ts atau auth guard
- Pastikan token format correct: `Bearer xxx`
- Check token expiry:
  ```javascript
  const expiry = localStorage.getItem('token_expiry');
  console.log('Token expired?', Date.now() > parseInt(expiry));
  ```

---

## ✅ Checklist Implementation

### Update-Data (Sudah Selesai ✅)

- [x] Plugin `ticket-handler.client.js` created
- [x] Page `ticket-loading.vue` created
- [x] Plugin registered di `nuxt.config.ts`
- [x] Config environment untuk HOST_ORIGIN
- [x] API client support `/auth/ticket/login`

### ESSPortal (Perlu Dilakukan)

- [ ] Copy `parent-ticket-sender.js` ke ESSPortal public folder
- [ ] Include script di nuxt.config atau index.html
- [ ] Set iframe ID/name yang correct
- [ ] Pass ticket di URL saat load iframe
- [ ] Test end-to-end flow

---

## 📚 References

- Mango ticket exchange implementation: `/mango/plugins/ticket-handler.client.js`
- Environment config: `/config/environment.js`
- API client: `/axios/api.client.js`
- Accessibility sync plugin: `/plugins/accessibility-sync.client.js`

---

## 🔐 Security Notes

1. **Ticket Lifetime:** Ticket hanya valid untuk waktu terbatas (biasanya 5-10 menit)
2. **Single Use:** Ticket biasanya single-use, setelah di-exchange tidak bisa dipakai lagi
3. **HTTPS Required:** Di production, gunakan HTTPS untuk secure communication
4. **Target Origin:** Set target origin spesifik di postMessage (jangan `'*'` di production)
5. **Token Storage:** Token disimpan di localStorage, rentan terhadap XSS. Ensure app ter-protect dari XSS.

---

## 📞 Contact

Jika ada issue atau pertanyaan, hubungi:
- ESS Sigma Team
- Update-Data Development Team

---

**Last Updated:** 2025-11-06
**Version:** 1.0.0
