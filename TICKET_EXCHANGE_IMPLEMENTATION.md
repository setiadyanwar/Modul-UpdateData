# Ticket Exchange Implementation for Update-Data

## Overview
Update-Data sekarang menggunakan mekanisme **Ticket Exchange** yang sama dengan Mango, menggantikan mekanisme postMessage token sharing sebelumnya.

## Perubahan yang Dilakukan

### 1. Plugin Ticket Handler (`plugins/ticket-handler.client.js`)
**Purpose:** Mendeteksi dan memproses SSO ticket sebelum halaman di-render

**Flow:**
1. Cek ticket di URL query parameter (`?ticket=xxx`)
2. Jika ada ticket, clear token lama dan redirect ke `/ticket-loading`
3. Request exchange ticket ke parent (ESSHost) via postMessage `EXCHANGE_TICKET`
4. Terima response dengan token dari parent
5. Simpan token, user data, roles, dan permissions ke localStorage
6. Redirect ke `/update-data` (main app)

**Key Features:**
- Deteksi ticket dari URL atau postMessage
- Request exchange via parent untuk avoid CORS
- Clear old tokens sebelum exchange
- Support iframe dan standalone mode

### 2. Ticket Loading Page (`pages/ticket-loading.vue`)
**Purpose:** Menampilkan loading UI saat proses ticket exchange

**Features:**
- Full-screen loading dengan spinner
- Layout minimalis tanpa navbar/sidebar
- Auto-processing ticket via plugin

### 3. Ticket Exchange API (`server/api/ticket-exchange.post.js`)
**Purpose:** Backend proxy untuk exchange ticket (jika diperlukan)

**Endpoint:** `POST /api/ticket-exchange`

**Body:**
```json
{
  "ticket": "xxx-xxx-xxx"
}
```

**Response:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 1800,
  "user": {...},
  "user_roles": [...],
  "user_permissions": [...]
}
```

### 4. Nuxt Config Update
Plugin `ticket-handler.client.js` ditambahkan sebagai plugin pertama agar process sebelum plugin lain.

```typescript
plugins: [
  { src: '~/plugins/ticket-handler.client.js', mode: 'client' }, // Must be first
  { src: '~/plugins/iframe-token-handler.client.js', mode: 'client' },
  { src: '~/plugins/update-data-navigation.client.js', mode: 'client' }
]
```

## Integration dengan ESSHost

### ESSHost Side Changes Needed:

1. **Remove dedicated `pages/update-data.vue`** - Update-Data sekarang di-handle sebagai dynamic app via `[...slug].vue`

2. **Add Update-Data ke App Catalog** dengan:
   - `route`: `/update-data`
   - `url`: `http://localhost:3001`
   - `client_id`: Client ID untuk SSO
   - `aud`: Audience untuk ticket generation
   - `isActive`: true

3. **ESSHost akan otomatis:**
   - Generate ticket untuk Update-Data
   - Inject ticket ke iframe URL
   - Handle `EXCHANGE_TICKET` request dari Update-Data
   - Return token via `TICKET_EXCHANGE_RESPONSE`

## PostMessage Communication

### Update-Data → ESSHost:

**1. REQUEST_TICKET** (fallback jika ticket tidak di URL)
```javascript
{
  type: 'REQUEST_TICKET',
  source: 'update-data'
}
```

**2. EXCHANGE_TICKET** (request exchange via parent)
```javascript
{
  type: 'EXCHANGE_TICKET',
  ticket: '...',
  messageId: 'exchange_xxx',
  source: 'update-data'
}
```

**3. IFRAME_READY** (notify parent iframe is ready)
```javascript
{
  type: 'IFRAME_READY',
  source: 'update-data',
  appName: 'Update Data',
  timestamp: 1234567890
}
```

### ESSHost → Update-Data:

**1. TICKET_AUTH** (send ticket to iframe)
```javascript
{
  type: 'TICKET_AUTH',
  ticket: '...',
  source: 'ess-sigma',
  timestamp: 1234567890
}
```

**2. TICKET_EXCHANGE_RESPONSE** (response dari exchange request)
```javascript
{
  type: 'TICKET_EXCHANGE_RESPONSE',
  messageId: 'exchange_xxx',
  success: true,
  data: {
    access_token: '...',
    refresh_token: '...',
    expires_in: 1800,
    user: {...},
    user_roles: [...],
    user_permissions: [...]
  },
  source: 'ess-sigma'
}
```

## Testing

### 1. Development Mode
```bash
# Terminal 1: ESSHost
cd ESSHost
npm run dev

# Terminal 2: Update-Data
cd Update-Data
npm run dev
```

### 2. Access Update-Data
```
http://localhost:3000/update-data
```

ESSHost akan:
1. Generate ticket
2. Load iframe dengan URL: `http://localhost:3001?ticket=xxx`
3. Update-Data detect ticket dan exchange
4. Redirect ke `/update-data` setelah authenticated

### 3. Check Console Logs
**Browser Console:**
- `[Ticket Handler]` - Ticket detection dan processing
- `[Ticket Exchange API]` - API exchange logs
- `[Update-Data]` - General app logs

**Server Terminal:**
- `[Ticket Exchange API]` - Backend exchange logs
- `[API Proxy]` - Proxy request logs

## Migration Notes

### Old Mechanism (PostMessage Token Sharing):
```javascript
// ESSHost sends token directly
postMessage({ type: 'AUTH_TOKEN', data: { access_token, ... } })

// Update-Data receives and stores token
localStorage.setItem('access_token', token)
```

### New Mechanism (Ticket Exchange):
```javascript
// ESSHost generates ticket and adds to URL
iframe.src = 'http://localhost:3001?ticket=xxx'

// Update-Data exchanges ticket for token
postMessage({ type: 'EXCHANGE_TICKET', ticket })

// ESSHost proxies to backend and returns token
postMessage({ type: 'TICKET_EXCHANGE_RESPONSE', data: { access_token, ... } })
```

## Benefits

1. **Consistent dengan Mango** - Sama flow dengan microfrontend lain
2. **More Secure** - Token tidak di-pass langsung via postMessage
3. **Better Error Handling** - Dedicated loading page dan error states
4. **Cleaner Code** - Separation of concerns
5. **SSO Compliant** - Follow SSO ticket exchange pattern

## Troubleshooting

### Issue: Ticket not detected
**Solution:** Check console for `[Ticket Handler]` logs, pastikan ticket ada di URL

### Issue: Exchange timeout
**Solution:** Check ESSHost handler untuk `EXCHANGE_TICKET`, pastikan response dikirim

### Issue: Token not saved
**Solution:** Check browser localStorage, pastikan tidak ada error di ticket exchange

### Issue: Redirect loop
**Solution:** Clear localStorage dan cookies, refresh browser

## Next Steps

1. Update ESSHost app catalog untuk register Update-Data
2. Remove dedicated `pages/update-data.vue` dari ESSHost
3. Test ticket flow end-to-end
4. Monitor logs untuk errors
5. Update backend jika perlu endpoint `/auth/ticket-exchange`
