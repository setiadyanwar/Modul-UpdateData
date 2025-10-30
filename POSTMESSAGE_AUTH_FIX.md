# PostMessage Authentication & Data Loading Fix

## Problem Summary

Setelah kembali ke mekanisme postMessage authentication yang biasa, ada 2 masalah:

### Problem 1: Ticket Masih Muncul di URL
URL: `http://localhost:3000/update-data?ticket=22111c9a-50d4-4417-8369-ec2a4f1fd875`

**Expected**: `/update-data` tanpa parameter ticket
**Actual**: `/update-data?ticket=xxx`

### Problem 2: Change Request Data Tidak Muncul
Data change request history tidak muncul di halaman `/update-data/history` meskipun token sudah diterima dengan benar via postMessage.

## Root Cause Analysis

### Problem 1 Root Cause:

Dashboard (`ESSHost/pages/index.vue`) masih melakukan **generate ticket untuk semua app yang punya `client_id` atau `aud`** di database, termasuk Update-Data.

Flow yang terjadi:
```
1. User click "Update Data Personal" di dashboard
2. Dashboard deteksi app punya client_id/aud
3. Dashboard generate ticket via API
4. Dashboard navigate ke /update-data?ticket=xxx
5. Update-Data receive ticket parameter (tidak digunakan karena pakai postMessage)
```

### Problem 2 Root Cause:

Proxy handler (`Update-Data/server/api/proxy/[...path].js`) menambahkan **trailing slash** sebelum query string, menyebabkan backend API tidak mengenali endpoint.

Request transformation:
```
Client request:
/api/proxy/employee/change-request?page=1&limit=50

Proxy transforms to:
/employee/change-request/?page=1&limit=50
                        ^ TRAILING SLASH PROBLEM!

Backend receives:
https://apigwsand.telkomsigma.co.id/essbe/employee/change-request/?page=1&limit=50
```

Backend kemungkinan besar:
- Tidak mengenali endpoint dengan slash sebelum `?`
- Return 404 atau HTML error page
- Frontend tidak menerima data

## Fixes Implemented

### Fix 1: Skip Ticket Generation for Update-Data

**File**: `ESSHost/pages/index.vue`
**Location**: Lines 452-465

**Before**:
```javascript
// Determine if app needs SSO ticket
let clientAud = app.client_id || app.aud;
const needsTicket = !!clientAud;
```

**After**:
```javascript
// Determine if app needs SSO ticket
// Apps with client_id/aud need ticket (like Mango)
// Update-Data uses postMessage auth, no ticket needed

// ✅ CHECK: Update-Data should NOT use ticket mechanism
const isUpdateData = app.name?.toLowerCase().includes('update') ||
                     app.href?.includes('update-data') ||
                     app.url?.includes('update-data');

if (isUpdateData) {
  console.log('[Dashboard] 🔐 Update-Data detected, skipping ticket generation (uses postMessage auth)');
  await navigateTo(app.href);
  return;
}

// ✅ FIX: Use client_id as aud (they're the same in OAuth2)
let clientAud = app.client_id || app.aud;
const needsTicket = !!clientAud;
```

**Why**: This prevents ticket generation entirely for Update-Data, ensuring clean URL navigation without ticket parameter.

### Fix 2: Remove Trailing Slash in Proxy Handler

**File**: `Update-Data/server/api/proxy/[...path].js`
**Location**: Lines 52-56

**Before**:
```javascript
const queryString = new URLSearchParams(query).toString();

// Build endpoint with query params
// Add trailing slash before query string if path doesn't already end with /
const pathWithSlash = path.endsWith('/') ? path : `${path}/`;
const endpoint = queryString ? `/${pathWithSlash}?${queryString}` : `/${path}`;
```

**After**:
```javascript
const queryString = new URLSearchParams(query).toString();

// Build endpoint with query params
// ✅ FIX: Don't add trailing slash - backend may not accept it
const endpoint = queryString ? `/${path}?${queryString}` : `/${path}`;
```

**Why**: Backend API endpoints typically do NOT accept trailing slashes before query parameters. Removing this ensures proper endpoint recognition.

## Expected Behavior After Fix

### Update-Data Access Flow:

```
1. User clicks "Update Data Personal" in dashboard
2. Dashboard detects Update-Data app
3. Dashboard logs: "🔐 Update-Data detected, skipping ticket generation"
4. Dashboard navigates directly to: /update-data (NO TICKET)
5. pages/update-data.vue loads iframe: http://localhost:3001/update-data
6. iframe-token-handler.client.js initializes (no ticket in URL)
7. iframe sends IFRAME_READY to parent
8. ESSHost useIframeAuth sends AUTH_TOKEN via postMessage
9. iframe receives and stores token
10. App loads normally with token
```

### Change Request Data Loading Flow:

```
1. User navigates to /update-data/history
2. useChangeRequestHistory composable calls loadChangeRequests()
3. Calls apiGet('/employee/change-request?page=1&limit=50')
4. useApi forwards to /api/proxy/employee/change-request?page=1&limit=50
5. Proxy handler builds endpoint: /employee/change-request?page=1&limit=50 (NO TRAILING SLASH)
6. Proxy forwards to: https://apigwsand.telkomsigma.co.id/essbe/employee/change-request?page=1&limit=50
7. Backend recognizes endpoint and returns data
8. Data displayed in table
```

## Testing Checklist

### Test 1: Verify No Ticket in URL
- [ ] Open ESSHost dashboard: `http://localhost:3000`
- [ ] Click "Update Data Personal"
- [ ] **Verify**: URL is `http://localhost:3000/update-data` (NO `?ticket=xxx`)
- [ ] **Verify**: Console shows "🔐 Update-Data detected, skipping ticket generation"

### Test 2: Verify PostMessage Auth Works
- [ ] After accessing Update-Data
- [ ] **Verify**: Console shows "[Update-Data] 🚀 Initializing iframe token handler..."
- [ ] **Verify**: Console shows "[Update-Data] 📩 Received message from parent: AUTH_TOKEN"
- [ ] **Verify**: Console shows "[Update-Data] 🔑 Received token from parent"
- [ ] **Verify**: Console shows "[Update-Data] Tokens saved successfully"

### Test 3: Verify Change Request Data Loads
- [ ] Navigate to `/update-data/history`
- [ ] **Verify**: Console shows "[API Proxy] Request: employee/change-request?page=1&limit=50"
- [ ] **Verify**: Console shows "[API Proxy] ✅ Success"
- [ ] **Verify**: Data table shows change request records
- [ ] **Verify**: Stats cards show correct counts

### Test 4: Verify Proxy Endpoint Format
- [ ] Open browser DevTools > Network tab
- [ ] Navigate to `/update-data/history`
- [ ] Find request to `/api/proxy/employee/change-request`
- [ ] **Verify**: Request URL is `http://localhost:3001/api/proxy/employee/change-request?page=1&limit=50`
- [ ] **Verify**: NO trailing slash before `?`

## Console Logs to Expect

### Successful Update-Data Access:
```
[Dashboard] 🔐 Update-Data detected, skipping ticket generation (uses postMessage auth)
[ESSHost] 📥 Iframe load event triggered
[ESSHost] 🔐 No ticket found, using old AUTH_TOKEN mechanism
[Update-Data] 🚀 Initializing iframe token handler...
[Update-Data] 🔍 Checking for ticket in URL: {hasTicket: false, ticket: "NONE", fullURL: "..."}
[Update-Data] 🔐 No ticket found, proceeding with token handler initialization
[Update-Data] 📩 Received message from parent: AUTH_TOKEN
[Update-Data] 🔑 Received token from parent
[Update-Data] Tokens saved successfully
[ESSHost] ✅ Received IFRAME_READY from update-data
```

### Successful Data Loading:
```
[API Proxy] Request: {method: "GET", endpoint: "/employee/change-request?page=1&limit=50", ...}
[API Proxy] Forwarding to: https://apigwsand.telkomsigma.co.id/essbe/employee/change-request?page=1&limit=50
[API Proxy] ✅ Success {endpoint: "/employee/change-request?page=1&limit=50", ...}
```

## Files Modified

1. **ESSHost/pages/index.vue**
   - Lines 456-465
   - Added Update-Data detection and early return to skip ticket generation

2. **Update-Data/server/api/proxy/[...path].js**
   - Lines 54-56
   - Removed trailing slash logic from endpoint construction

## Related Files (Context)

- `ESSHost/pages/update-data.vue` - Dedicated route that loads iframe
- `ESSHost/composables/auth/useIframeAuth.js` - PostMessage token sharing
- `Update-Data/plugins/iframe-token-handler.client.js` - Token receiver in iframe
- `Update-Data/composables/useChangeRequestHistory.js` - Data loading composable
- `Update-Data/composables/useApi.js` - API client with proxy
- `Update-Data/pages/update-data/history.vue` - History page

## Rollback Instructions

If issues occur, rollback by:

### Rollback Fix 1:
```javascript
// In ESSHost/pages/index.vue, remove lines 456-465
// Keep original:
let clientAud = app.client_id || app.aud;
const needsTicket = !!clientAud;
```

### Rollback Fix 2:
```javascript
// In Update-Data/server/api/proxy/[...path].js, restore:
const pathWithSlash = path.endsWith('/') ? path : `${path}/`;
const endpoint = queryString ? `/${pathWithSlash}?${queryString}` : `/${path}`;
```

## Additional Notes

### Why Not Remove client_id from Database?

Instead of removing `client_id`/`aud` from Update-Data in database, we handle it at the dashboard level because:
1. Database might be used for other purposes (auditing, app catalog, etc.)
2. Easier to modify code than database schema
3. More maintainable - clear separation of ticket vs postMessage apps

### Trailing Slash Issue Background

Some backend frameworks (like Django, Flask with strict_slashes=True) treat:
- `/api/endpoint/` (with slash) as different from
- `/api/endpoint` (without slash)

The backend API is likely rejecting requests with trailing slash before query params, returning HTML error pages instead of JSON.

## Next Steps

After successful testing:
1. Monitor production logs for similar issues in other endpoints
2. Consider adding integration tests for proxy handler
3. Document which apps use ticket vs postMessage in app catalog
4. Update deployment documentation

---

**Date**: 2025-10-29
**Author**: Claude Code
**Status**: Completed & Ready for Testing
