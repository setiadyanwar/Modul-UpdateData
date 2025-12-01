# Authentication Issue Analysis

## 🔍 Problem Description
User mengalami:
1. Terlogout sendiri padahal sedang berinteraksi dengan website
2. SessionTimeoutModal muncul terlalu cepat (sebelum 15 menit)

## 📋 Expected Behavior

### Timeline yang Benar:
```
0 menit  → Login/Token Refresh
         → Access token berlaku 20 menit
         → SessionTimeoutModal countdown: 15 menit

10 menit → Last chance monitoring START (pengecekan aktivitas)
         → Jika ada aktivitas: Hit refresh token endpoint
         → Reset access token ke 20 menit lagi
         → Reset SessionTimeoutModal ke 15 menit lagi

15 menit → SessionTimeoutModal muncul (jika tidak ada aktivitas di 10-15 menit)
         → Countdown 5 menit

20 menit → Jika tidak klik "Extend Session": Auto logout
```

### Rules:
1. **Access token**: 20 menit lifetime
2. **SessionTimeoutModal**: Muncul setelah 15 menit inactivity
3. **Last chance monitoring**: Aktif di menit 10-15 (5 menit window)
4. **Aktivitas di window 10-15**: Trigger refresh token → reset semua timer
5. **Aktivitas di luar window**: Tidak trigger refresh (hanya update lastActivityTime)
6. **Extend Session**: Reset token 20 menit + modal 15 menit
7. **Tidak extend**: Auto logout setelah 5 menit countdown

## 🐛 Issues Found

### Issue 1: Last Chance Activity Detection - Flag Permanent
**Location**: `handleLastChanceActivity()` line 588-640

**Problem**:
```javascript
// Line 604: Flag di-set permanent
lastChanceActivityDetected.value = true;

// Line 619-623: Comment mengatakan flag TIDAK di-reset
// ❌ REMOVED: lastChanceActivityDetected.value = false;
```

**Impact**:
- Hanya refresh token SEKALI selama window 10-15 menit
- Jika user terus aktif (mouse move, keyboard), hanya refresh pertama yang terjadi
- Aktivitas selanjutnya diabaikan, sehingga token tidak di-refresh lagi

**Expected**:
- Setiap aktivitas di window 10-15 menit harus trigger refresh token
- Setelah refresh berhasil, reset flag agar bisa detect aktivitas berikutnya
- Tapi perlu throttle untuk mencegah spam (misal: refresh max 1x per 30 detik)

### Issue 2: Inactivity Monitoring Not Restarted After Refresh
**Location**: `handleLastChanceActivity()` line 610-624

**Problem**:
```javascript
const newToken = await refreshAccessToken();
if (newToken) {
  // ✅ Token refreshed
  // ❌ TAPI tidak restart inactivity monitoring!
  // ❌ Tidak reset sessionMonitorStartTime
  // ❌ Tidak reset sessionMonitorTargetTime
}
```

**Impact**:
- Token di-refresh, tapi timer modal masih jalan dari waktu lama
- Modal bisa muncul lebih cepat dari seharusnya (karena timer tidak di-reset)

**Expected**:
- Setelah refresh berhasil, panggil `startInactivityMonitoring()` lagi
- Reset `sessionMonitorStartTime` ke waktu sekarang
- Reset `sessionMonitorTargetTime` ke 15 menit dari sekarang

### Issue 3: scheduleTokenRefresh Doesn't Reset Existing Timer
**Location**: `scheduleTokenRefresh()` line 451-472

**Problem**:
```javascript
const scheduleTokenRefresh = (token) => {
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
  }
  // ... parse token ...
  
  // ✅ Start inactivity monitoring
  startInactivityMonitoring();
}
```

**Analysis**:
- `startInactivityMonitoring()` dipanggil, tapi jika sudah ada timer yang jalan, timer lama tidak di-clear dengan benar
- `startInactivityMonitoring()` sudah clear timer (line 477-484), jadi seharusnya OK
- TAPI: Jika dipanggil dari `handleLastChanceActivity()`, mungkin ada race condition

### Issue 4: extendSession() - Need Verify Reset
**Location**: `extendSession()` line 794-822

**Current Code**:
```javascript
const newToken = await refreshAccessToken();
if (newToken) {
  hideSessionWarning();
  stopLastChanceMonitoring('manual_extend');
  resetActivityTimer(true);
  scheduleTokenRefresh(newToken); // ✅ Restart monitoring
  success('Session extended successfully for another 20 minutes');
}
```

**Analysis**:
- ✅ Memanggil `scheduleTokenRefresh()` yang akan restart monitoring
- ✅ Stop last chance monitoring
- ✅ Reset activity timer
- **Looks OK**, tapi perlu verify apakah benar-benar reset ke 20 menit dan 15 menit

### Issue 5: Activity Detection Outside Last Chance Window
**Location**: `resetActivityTimer()` line 666-706

**Current Behavior**:
- Aktivitas di luar window 10-15 menit hanya update `lastActivityTime`
- Tidak trigger refresh token
- **This is CORRECT** sesuai requirement

**But**:
- Jika user aktif terus-menerus, token akan expire di menit 20
- Tapi modal sudah muncul di menit 15 (karena inactivity timer tidak di-reset)
- **This might be the issue!**

## 🔧 Root Cause Analysis

### Primary Issue:
**Last chance monitoring hanya refresh token SEKALI** karena flag `lastChanceActivityDetected` di-set permanent dan tidak di-reset setelah refresh berhasil.

### Secondary Issue:
**Setelah refresh token di last chance monitoring, inactivity monitoring tidak di-restart**, sehingga timer modal masih jalan dari waktu lama.

### Flow yang Salah:
```
0:00  → Login, start monitoring (modal target: 15:00)
10:00 → Last chance START
10:05 → User aktif → Refresh token ✅
       → TAPI flag permanent = true ❌
       → Timer modal masih target 15:00 (dari 0:00) ❌
15:00 → Modal muncul (padahal seharusnya 15:00 dari 10:05 = 15:05)
```

### Flow yang Benar:
```
0:00  → Login, start monitoring (modal target: 15:00)
10:00 → Last chance START
10:05 → User aktif → Refresh token ✅
       → Reset flag = false ✅
       → Restart monitoring (modal target: 15:05 dari sekarang = 25:05) ✅
10:10 → User aktif lagi → Refresh token lagi ✅
       → Restart monitoring lagi ✅
15:05 → Modal muncul (15 menit dari refresh terakhir)
```

## ✅ Solution

### Fix 1: Reset Flag After Successful Refresh
```javascript
const handleLastChanceActivity = async () => {
  if (!isLastChanceMonitoringActive.value || lastChanceActivityDetected.value) {
    return;
  }

  lastChanceActivityDetected.value = true;
  lastActivityTime.value = Date.now();

  try {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // ✅ FIX: Restart inactivity monitoring
      scheduleTokenRefresh(newToken);
      
      // ✅ FIX: Reset flag after delay (throttle: 30 seconds)
      setTimeout(() => {
        lastChanceActivityDetected.value = false;
      }, 30000); // 30 seconds throttle
    }
  } catch (error) {
    // Keep flag = true on error to prevent spam
  }
};
```

### Fix 2: Ensure scheduleTokenRefresh Restarts Monitoring Correctly
```javascript
const scheduleTokenRefresh = (token) => {
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
  }
  
  const payload = parseJWTPayload(token);
  if (!payload) return;
  
  // ✅ FIX: Stop existing monitoring first
  if (sessionWarningTimer) {
    clearTimeout(sessionWarningTimer);
    sessionWarningTimer = null;
  }
  if (lastChanceScheduleTimer) {
    clearTimeout(lastChanceScheduleTimer);
    lastChanceScheduleTimer = null;
  }
  
  // ✅ Start fresh inactivity monitoring
  startInactivityMonitoring();
};
```

### Fix 3: Verify extendSession() Reset
```javascript
const extendSession = async () => {
  try {
    const newToken = await refreshAccessToken();
    if (newToken) {
      hideSessionWarning();
      stopLastChanceMonitoring('manual_extend');
      
      // ✅ FIX: Reset activity timer
      resetActivityTimer(true);
      
      // ✅ FIX: Restart monitoring (this will reset to 15 min from now)
      scheduleTokenRefresh(newToken);
      
      success('Session extended successfully for another 20 minutes');
      return true;
    }
  } catch (error) {
    // ...
  }
};
```

## 📝 Testing Checklist

- [ ] Login → Verify modal target: 15 menit dari sekarang
- [ ] Di menit 10 → Verify last chance monitoring start
- [ ] Di menit 10-15, user aktif → Verify refresh token + reset timer
- [ ] Di menit 10-15, user aktif multiple times → Verify multiple refreshes (dengan throttle)
- [ ] Di menit 10-15, user tidak aktif → Verify modal muncul di menit 15
- [ ] Modal muncul → Klik "Extend Session" → Verify reset ke 20 menit + 15 menit
- [ ] Modal muncul → Tidak klik extend → Verify auto logout setelah 5 menit
- [ ] User aktif di luar window 10-15 → Verify tidak trigger refresh (hanya update lastActivityTime)

