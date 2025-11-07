# Deployment Fix untuk Dev Staging

## Problem Summary

Di dev staging (`https://updatedata-people-dev.telkomsigma.co.id`), terjadi beberapa error:

1. ❌ **X-Frame-Options Warning**: `ALLOW-FROM` directive sudah deprecated
2. ❌ **postMessage Origin Mismatch**: Target origin tidak match dengan recipient origin
3. ❌ **Roles tidak terbaca**: Karena token tidak ter-share dari parent
4. ❌ **Back button tidak bekerja**: Karena postMessage communication gagal
5. ❌ **CORS error di ticket login**: Request langsung ke API tanpa proxy

## Root Cause Analysis

### 1. postMessage menggunakan wildcard `'*'` origin
Beberapa file menggunakan `'*'` sebagai target origin di `postMessage`, yang menyebabkan browser reject pesan.

**Files yang sudah di-fix:**
- `plugins/url-sync.client.js` (line 48)
- `middleware/rbac.js` (line 97)
- `composables/useAuthenticationCore.js` (line 1062)

### 2. X-Frame-Options menggunakan deprecated directive
Header `X-Frame-Options: ALLOW-FROM` sudah tidak didukung browser modern. Perlu diganti dengan `Content-Security-Policy: frame-ancestors`.

### 3. Wrong HOST_ORIGIN configuration
Di dev server, `HOST_ORIGIN` masih default `http://localhost:3000`, seharusnya `https://people-dev.telkomsigma.co.id`.

### 4. API Base URL conditional logic
Function `getApiBaseUrl()` menggunakan conditional yang menyebabkan di production/dev langsung hit API (CORS error), tidak melalui proxy.

## Solutions Applied

### ✅ 1. Fix postMessage Origin (Code Changes)

**Before:**
```javascript
window.parent.postMessage({...}, '*');
```

**After:**
```javascript
import envConfig from '~/config/environment';
window.parent.postMessage({...}, envConfig.REMOTE_APP.HOST_ORIGIN);
```

### ✅ 2. Replace X-Frame-Options with CSP frame-ancestors

**Added to `nuxt.config.ts`:**
```javascript
nitro: {
  routeRules: {
    '/**': {
      headers: {
        'Content-Security-Policy': 'frame-ancestors https://people-dev.telkomsigma.co.id ...',
        'X-Frame-Options': 'SAMEORIGIN'
      }
    }
  }
}
```

### ✅ 3. Hardcode Dev Staging Config

**Updated `config/environment.js`:**
```javascript
export default {
  API_BASE_URL: 'https://apigwsand.telkomsigma.co.id/essbe',

  REMOTE_APP: {
    PORT: 3001,
    HOST_ORIGIN: 'https://people-dev.telkomsigma.co.id',  // ← FIXED!
    ALLOWED_ORIGINS: [
      'https://people-dev.telkomsigma.co.id',
      'https://ess-dev.telkomsigma.co.id',
      'http://localhost:3000',
      'http://localhost:8001',
      'http://127.0.0.1:3000'
    ]
  }
}
```

### ✅ 4. Force API Proxy Usage

**Fixed in `axios/api.client.js`:**
```javascript
function getApiBaseUrl() {
  // ALWAYS use server proxy to avoid CORS
  return '/api/proxy';
}
```

## Required DevOps Actions

### 📋 Action 1: Verify Configuration (No Changes Needed!)

**GOOD NEWS:** Configuration sudah hardcoded di `config/environment.js` untuk dev staging!

**Current values:**
- ✅ `API_BASE_URL`: `https://apigwsand.telkomsigma.co.id/essbe`
- ✅ `HOST_ORIGIN`: `https://people-dev.telkomsigma.co.id`
- ✅ No `.env` file needed!

**NOTE untuk Production nanti:**
Saat deploy ke production, tinggal edit `config/environment.js`:
```javascript
API_BASE_URL: 'https://apigw.telkomsigma.co.id/essbe'
HOST_ORIGIN: 'https://people.telkomsigma.co.id'
```

### 📋 Action 2: Deploy dengan Node.js Runtime

**IMPORTANT:** Jangan gunakan static deployment (`nuxt generate`)!

```bash
# Build
npm run build

# Start Node.js server
npm run start

# Atau menggunakan PM2 (recommended)
pm2 start ecosystem.config.cjs --env production
pm2 save
```

**Kenapa harus Node.js runtime?**
- ✅ Server routes `/api/proxy` perlu Nuxt server
- ✅ Nitro preset: `node-server` (bukan static)
- ❌ Static hosting = `/api/proxy` tidak tersedia = CORS error

### 📋 Action 3: Verify Server Routes Available

Test bahwa `/api/proxy` endpoint tersedia:

```bash
curl -X POST https://updatedata-people-dev.telkomsigma.co.id/api/proxy/auth/ticket/login \
  -H "Content-Type: application/json" \
  -d '{"ticket":"test-ticket-123"}'
```

**Expected:** Response dari backend API (bisa error "invalid ticket", tapi bukan 404)
**NOT Expected:** 404 Not Found

### 📋 Action 4: Verify Security Headers

Check security headers:

```bash
curl -I https://updatedata-people-dev.telkomsigma.co.id/
```

**Expected headers:**
```
Content-Security-Policy: frame-ancestors https://people-dev.telkomsigma.co.id ...
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
```

## Testing Checklist After Deployment

Setelah deployment, verify di browser:

### Browser Console Tests
- [ ] **No postMessage errors**
  - ✅ Should NOT see: "Failed to execute 'postMessage' on 'DOMWindow'"

- [ ] **No X-Frame-Options warnings**
  - ✅ Should NOT see: "Invalid 'X-Frame-Options' header"

- [ ] **No CORS errors**
  - ✅ Should NOT see: "CORS policy blocked..."

### Functionality Tests
- [ ] **Token received from parent portal**
  - Open DevTools → Console
  - Look for: `[Update-Data] Token received from parent`

- [ ] **User roles terbaca**
  - DevTools → Application → Local Storage
  - Check `user_roles` key exists and has data

- [ ] **Back button bekerja**
  - Navigate between pages di iframe
  - Click browser back button
  - Should navigate back correctly

- [ ] **API calls berhasil**
  - DevTools → Network tab
  - Filter: `/api/proxy`
  - Should see successful requests (200 status)

- [ ] **Ticket login berhasil**
  - Login dari portal dengan ticket
  - Should redirect to update-data page
  - Should have token in localStorage

## Debugging Guide

### Problem: postMessage still not working

**Check browser console:**
```
Failed to execute 'postMessage': The target origin provided...
```

**Solution:**
1. Check `config/environment.js` → `HOST_ORIGIN` value
2. Must match parent portal domain exactly
3. Rebuild and restart: `npm run build && npm run start`

### Problem: CORS error on API calls

**Check Network tab:**
```
Access to fetch at 'https://apigwsand...' has been blocked by CORS
```

**Solution:**
1. Verify `/api/proxy` routes available:
   ```bash
   curl https://updatedata-people-dev.telkomsigma.co.id/api/proxy/health
   ```
2. If 404, check:
   - Node.js server running? `pm2 status`
   - Not using static deployment? Check build command
   - Restart server: `pm2 restart update-data`

### Problem: Roles not found

**Check localStorage:**
```
[RBAC] ⚠️ No permissions found in JWT or localStorage
```

**Solution:**
1. Check if token received: `localStorage.getItem('access_token')`
2. Check if roles saved: `localStorage.getItem('user_roles')`
3. If missing, check postMessage working (see above)
4. Clear localStorage and re-login from portal

### Problem: X-Frame-Options warning still appears

**Check response headers:**
```bash
curl -I https://updatedata-people-dev.telkomsigma.co.id/ | grep -i "frame"
```

**Should see:**
```
Content-Security-Policy: frame-ancestors https://people-dev...
X-Frame-Options: SAMEORIGIN
```

**If headers missing:**
1. Check `nuxt.config.ts` → `nitro.routeRules`
2. Rebuild: `npm run build`
3. Restart server: `pm2 restart update-data`

## Files Modified

### Code Fixes (5 files)
1. `axios/api.client.js` - Force proxy usage
2. `plugins/url-sync.client.js` - Fix postMessage origin + import envConfig
3. `middleware/rbac.js` - Fix postMessage origin + import envConfig
4. `composables/useAuthenticationCore.js` - Fix postMessage origin
5. `nuxt.config.ts` - Add CSP frame-ancestors headers

### Configuration (1 file)
6. `config/environment.js` - Hardcode dev staging values (no .env needed)

## Architecture Note

**Simplified approach:**
- ✅ All config in `config/environment.js`
- ✅ No `.env` file needed for dev staging
- ✅ Direct hardcoded values for known environments
- ✅ Easy to update: just edit one file

**When to change config:**
- Dev/Staging → Production: Edit `config/environment.js`
- New API endpoint: Edit `config/environment.js`
- New parent domain: Edit `config/environment.js`

**Files to edit for production:**
```javascript
// config/environment.js
API_BASE_URL: 'https://apigw.telkomsigma.co.id/essbe',  // Remove 'sand'
HOST_ORIGIN: 'https://people.telkomsigma.co.id',        // Remove '-dev'

// nuxt.config.ts → routeRules → headers
'Content-Security-Policy': 'frame-ancestors https://people.telkomsigma.co.id ...'
```

## Support

Jika masih ada masalah setelah deployment:

1. Check browser console untuk error messages
2. Check server logs: `pm2 logs update-data`
3. Verify configuration: `cat config/environment.js | grep HOST_ORIGIN`
4. Test `/api/proxy` endpoint availability
5. Contact ESS Sigma Dev Team

---

**Last Updated:** 2025-11-07
**Environment:** Dev Staging
**Author:** ESS Sigma Development Team
