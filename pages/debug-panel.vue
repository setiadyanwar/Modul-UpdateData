<template>
  <div class="debug-panel">
    <div class="debug-header">
      <h1>🔧 Update-Data Debug Panel</h1>
      <p class="timestamp">{{ currentTime }}</p>
    </div>

    <div class="debug-grid">
      <!-- URL & Environment Info -->
      <div class="debug-card">
        <h2>🌐 Environment Info</h2>
        <div class="debug-content">
          <div class="debug-row">
            <span class="label">Current URL:</span>
            <code>{{ urlInfo.full }}</code>
          </div>
          <div class="debug-row">
            <span class="label">Path:</span>
            <code>{{ urlInfo.path }}</code>
          </div>
          <div class="debug-row">
            <span class="label">Is in iframe:</span>
            <span :class="['badge', urlInfo.isInIframe ? 'badge-success' : 'badge-warning']">
              {{ urlInfo.isInIframe ? 'YES' : 'NO' }}
            </span>
          </div>
          <div class="debug-row">
            <span class="label">Parent URL:</span>
            <code>{{ urlInfo.parentUrl }}</code>
          </div>
        </div>
      </div>

      <!-- Ticket Info -->
      <div class="debug-card">
        <h2>🎫 Ticket Info</h2>
        <div class="debug-content">
          <div class="debug-row">
            <span class="label">Ticket in URL:</span>
            <span :class="['badge', ticketInfo.hasTicket ? 'badge-success' : 'badge-error']">
              {{ ticketInfo.hasTicket ? 'YES' : 'NO' }}
            </span>
          </div>
          <div v-if="ticketInfo.hasTicket" class="debug-row">
            <span class="label">Ticket Value:</span>
            <code class="ticket-preview">{{ ticketInfo.preview }}</code>
          </div>
          <div v-if="ticketInfo.hasTicket" class="debug-row">
            <span class="label">Ticket Length:</span>
            <code>{{ ticketInfo.length }}</code>
          </div>
          <div class="debug-row">
            <span class="label">Full Ticket:</span>
            <textarea readonly class="ticket-full">{{ ticketInfo.full || 'No ticket' }}</textarea>
          </div>
        </div>
      </div>

      <!-- Token Info -->
      <div class="debug-card">
        <h2>🔑 Token Info</h2>
        <div class="debug-content">
          <div class="debug-row">
            <span class="label">Has Access Token:</span>
            <span :class="['badge', tokenInfo.hasToken ? 'badge-success' : 'badge-error']">
              {{ tokenInfo.hasToken ? 'YES' : 'NO' }}
            </span>
          </div>
          <div v-if="tokenInfo.hasToken" class="debug-row">
            <span class="label">Token Preview:</span>
            <code class="token-preview">{{ tokenInfo.preview }}</code>
          </div>
          <div v-if="tokenInfo.hasToken" class="debug-row">
            <span class="label">Token Length:</span>
            <code>{{ tokenInfo.length }}</code>
          </div>
          <div class="debug-row">
            <span class="label">Token Expiry:</span>
            <code>{{ tokenInfo.expiry }}</code>
          </div>
          <div class="debug-row">
            <span class="label">Is Expired:</span>
            <span :class="['badge', tokenInfo.isExpired ? 'badge-error' : 'badge-success']">
              {{ tokenInfo.isExpired ? 'YES' : 'NO' }}
            </span>
          </div>
          <div class="debug-row">
            <span class="label">Refresh Token:</span>
            <span :class="['badge', tokenInfo.hasRefreshToken ? 'badge-success' : 'badge-warning']">
              {{ tokenInfo.hasRefreshToken ? 'YES' : 'NO' }}
            </span>
          </div>
        </div>
      </div>

      <!-- User Data Info -->
      <div class="debug-card">
        <h2>👤 User Data</h2>
        <div class="debug-content">
          <div class="debug-row">
            <span class="label">Has User Data:</span>
            <span :class="['badge', userData.hasUser ? 'badge-success' : 'badge-error']">
              {{ userData.hasUser ? 'YES' : 'NO' }}
            </span>
          </div>
          <div v-if="userData.hasUser" class="debug-row">
            <span class="label">Employee Name:</span>
            <code>{{ userData.employeeName }}</code>
          </div>
          <div v-if="userData.hasUser" class="debug-row">
            <span class="label">Email:</span>
            <code>{{ userData.email }}</code>
          </div>
          <div class="debug-row">
            <span class="label">Has Roles:</span>
            <span :class="['badge', userData.hasRoles ? 'badge-success' : 'badge-warning']">
              {{ userData.hasRoles ? 'YES' : 'NO' }}
            </span>
          </div>
          <div v-if="userData.hasRoles" class="debug-row">
            <span class="label">Roles Count:</span>
            <code>{{ userData.rolesCount }}</code>
          </div>
          <div class="debug-row">
            <span class="label">Has Permissions:</span>
            <span :class="['badge', userData.hasPermissions ? 'badge-success' : 'badge-warning']">
              {{ userData.hasPermissions ? 'YES' : 'NO' }}
            </span>
          </div>
          <div v-if="userData.hasPermissions" class="debug-row">
            <span class="label">Permissions Count:</span>
            <code>{{ userData.permissionsCount }}</code>
          </div>
        </div>
      </div>

      <!-- localStorage Full Dump -->
      <div class="debug-card full-width">
        <h2>💾 LocalStorage Dump</h2>
        <div class="debug-content">
          <pre class="json-dump">{{ localStorageDump }}</pre>
        </div>
      </div>

      <!-- Console Logs -->
      <div class="debug-card full-width">
        <h2>📝 Recent Console Logs</h2>
        <div class="debug-content">
          <div class="console-logs">
            <div v-for="(log, index) in consoleLogs" :key="index" :class="['log-entry', log.type]">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
          <button @click="clearLogs" class="btn btn-secondary">Clear Logs</button>
        </div>
      </div>

      <!-- Actions -->
      <div class="debug-card full-width">
        <h2>🎮 Actions</h2>
        <div class="debug-content">
          <div class="actions-grid">
            <button @click="refreshData" class="btn btn-primary">🔄 Refresh Data</button>
            <button @click="testAPI" class="btn btn-primary">🧪 Test API Call</button>
            <button @click="clearTokens" class="btn btn-danger">🗑️ Clear All Tokens</button>
            <button @click="requestTokenFromParent" class="btn btn-warning">📞 Request Token from Parent</button>
          </div>
        </div>
      </div>

      <!-- API Test Results -->
      <div v-if="apiTestResult" class="debug-card full-width">
        <h2>🧪 API Test Results</h2>
        <div class="debug-content">
          <div v-if="apiTestResult.success" class="alert alert-success">
            <strong>✅ API Call Successful</strong>
            <pre class="json-dump">{{ apiTestResult.data }}</pre>
          </div>
          <div v-else class="alert alert-error">
            <strong>❌ API Call Failed</strong>
            <pre class="json-dump">{{ apiTestResult.error }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const currentTime = ref('');
const consoleLogs = ref([]);
const apiTestResult = ref(null);

// URL Info
const urlInfo = computed(() => {
  if (typeof window === 'undefined') {
    return {
      full: 'N/A (SSR)',
      path: 'N/A',
      isInIframe: false,
      parentUrl: 'N/A'
    };
  }

  const isInIframe = window.parent !== window;
  let parentUrl = 'N/A (not in iframe)';

  if (isInIframe) {
    try {
      parentUrl = window.parent.location.href;
    } catch (e) {
      parentUrl = 'CORS blocked (cannot access parent)';
    }
  }

  return {
    full: window.location.href,
    path: window.location.pathname,
    isInIframe,
    parentUrl
  };
});

// Ticket Info
const ticketInfo = computed(() => {
  if (typeof window === 'undefined') {
    return { hasTicket: false, preview: '', length: 0, full: '' };
  }

  const urlParams = new URLSearchParams(window.location.search);
  const ticket = urlParams.get('ticket');

  return {
    hasTicket: !!ticket,
    preview: ticket ? `${ticket.substring(0, 30)}...${ticket.substring(ticket.length - 10)}` : '',
    length: ticket?.length || 0,
    full: ticket || ''
  };
});

// Token Info
const tokenInfo = computed(() => {
  if (typeof window === 'undefined') {
    return {
      hasToken: false,
      preview: '',
      length: 0,
      expiry: 'N/A',
      isExpired: true,
      hasRefreshToken: false
    };
  }

  const token = localStorage.getItem('access_token');
  const expiry = localStorage.getItem('token_expiry');
  const refreshToken = localStorage.getItem('refresh_token');

  let expiryString = 'N/A';
  let isExpired = true;

  if (expiry) {
    const expiryTime = parseInt(expiry);
    expiryString = new Date(expiryTime).toLocaleString();
    isExpired = Date.now() > expiryTime;
  }

  return {
    hasToken: !!token,
    preview: token ? `${token.substring(0, 30)}...${token.substring(token.length - 10)}` : '',
    length: token?.length || 0,
    expiry: expiryString,
    isExpired,
    hasRefreshToken: !!refreshToken
  };
});

// User Data Info
const userData = computed(() => {
  if (typeof window === 'undefined') {
    return {
      hasUser: false,
      employeeName: '',
      email: '',
      hasRoles: false,
      rolesCount: 0,
      hasPermissions: false,
      permissionsCount: 0
    };
  }

  const userStr = localStorage.getItem('user');
  const rolesStr = localStorage.getItem('user_roles');
  const permissionsStr = localStorage.getItem('user_permissions');

  let user = null;
  let roles = null;
  let permissions = null;

  try {
    if (userStr) user = JSON.parse(userStr);
    if (rolesStr) roles = JSON.parse(rolesStr);
    if (permissionsStr) permissions = JSON.parse(permissionsStr);
  } catch (e) {
    console.error('Error parsing user data:', e);
  }

  return {
    hasUser: !!user,
    employeeName: user?.employee_name || user?.name || '',
    email: user?.email || '',
    hasRoles: !!roles && Array.isArray(roles) && roles.length > 0,
    rolesCount: Array.isArray(roles) ? roles.length : 0,
    hasPermissions: !!permissions && Array.isArray(permissions) && permissions.length > 0,
    permissionsCount: Array.isArray(permissions) ? permissions.length : 0
  };
});

// LocalStorage Dump
const localStorageDump = computed(() => {
  if (typeof window === 'undefined') {
    return 'N/A (SSR)';
  }

  const dump = {};
  const authKeys = [
    'access_token',
    'refresh_token',
    'token_expiry',
    'user',
    'user_roles',
    'user_permissions',
    'auth_token',
    'auth_user'
  ];

  authKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      // Try to parse JSON
      try {
        dump[key] = JSON.parse(value);
      } catch {
        // If not JSON, store as string preview
        dump[key] = value.length > 100 ? `${value.substring(0, 100)}... (${value.length} chars)` : value;
      }
    } else {
      dump[key] = null;
    }
  });

  return JSON.stringify(dump, null, 2);
});

// Update time
const updateTime = () => {
  currentTime.value = new Date().toLocaleString();
};

// Add console log
const addLog = (message, type = 'info') => {
  consoleLogs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message,
    type
  });

  // Keep only last 50 logs
  if (consoleLogs.value.length > 50) {
    consoleLogs.value = consoleLogs.value.slice(0, 50);
  }
};

// Clear logs
const clearLogs = () => {
  consoleLogs.value = [];
  addLog('Logs cleared', 'info');
};

// Refresh data
const refreshData = () => {
  updateTime();
  addLog('Data refreshed', 'info');
};

// Test API
const testAPI = async () => {
  addLog('Testing API call...', 'info');
  apiTestResult.value = null;

  try {
    const token = localStorage.getItem('access_token');

    if (!token) {
      throw new Error('No access token available');
    }

    addLog('Making API call to /employee/change-request', 'info');

    const response = await $fetch('/api/proxy/employee/change-request', {
      method: 'GET',
      params: { page: 1, limit: 5 }
    });

    addLog('✅ API call successful', 'success');
    apiTestResult.value = {
      success: true,
      data: response
    };
  } catch (error) {
    addLog(`❌ API call failed: ${error.message}`, 'error');
    apiTestResult.value = {
      success: false,
      error: {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        data: error.data
      }
    };
  }
};

// Clear tokens
const clearTokens = () => {
  if (confirm('Are you sure you want to clear all tokens and auth data?')) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user');
    localStorage.removeItem('user_roles');
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');

    addLog('🗑️ All tokens cleared', 'warning');
    updateTime();
  }
};

// Request token from parent
const requestTokenFromParent = () => {
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'REQUEST_TOKEN',
      source: 'update-data'
    }, '*');
    addLog('📞 Sent REQUEST_TOKEN to parent', 'info');
  } else {
    addLog('⚠️ Not in iframe, cannot request token from parent', 'warning');
  }
};

// Listen for postMessage
const handlePostMessage = (event) => {
  addLog(`📩 Received postMessage: ${event.data?.type || 'unknown'}`, 'info');

  if (event.data?.type) {
    addLog(`Message details: ${JSON.stringify(event.data)}`, 'info');
  }
};

// Intercept console.log
let originalConsoleLog;
let originalConsoleError;
let originalConsoleWarn;

onMounted(() => {
  updateTime();
  addLog('Debug panel initialized', 'success');

  // Update time every second
  const timeInterval = setInterval(updateTime, 1000);

  // Listen for postMessage
  window.addEventListener('message', handlePostMessage);

  // Intercept console logs
  originalConsoleLog = console.log;
  originalConsoleError = console.error;
  originalConsoleWarn = console.warn;

  console.log = (...args) => {
    originalConsoleLog.apply(console, args);
    addLog(args.join(' '), 'info');
  };

  console.error = (...args) => {
    originalConsoleError.apply(console, args);
    addLog(args.join(' '), 'error');
  };

  console.warn = (...args) => {
    originalConsoleWarn.apply(console, args);
    addLog(args.join(' '), 'warning');
  };

  onUnmounted(() => {
    clearInterval(timeInterval);
    window.removeEventListener('message', handlePostMessage);

    // Restore console
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });
});
</script>

<style scoped>
.debug-panel {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.debug-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.debug-header h1 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 700;
}

.timestamp {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.debug-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.debug-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.debug-card.full-width {
  grid-column: 1 / -1;
}

.debug-card h2 {
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
}

.debug-content {
  font-size: 14px;
}

.debug-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.debug-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #555;
  min-width: 150px;
}

code {
  background: #f4f4f4;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  word-break: break-all;
  flex: 1;
  margin-left: 10px;
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
}

.badge-success {
  background: #10b981;
  color: white;
}

.badge-error {
  background: #ef4444;
  color: white;
}

.badge-warning {
  background: #f59e0b;
  color: white;
}

.json-dump {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  max-height: 400px;
}

.ticket-preview,
.token-preview {
  font-size: 11px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ticket-full {
  width: 100%;
  min-height: 80px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 11px;
  resize: vertical;
}

.console-logs {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 15px;
  border-radius: 6px;
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 10px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 12px;
}

.log-entry {
  padding: 5px 0;
  border-bottom: 1px solid #333;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry.info {
  color: #4ade80;
}

.log-entry.error {
  color: #f87171;
}

.log-entry.warning {
  color: #fbbf24;
}

.log-entry.success {
  color: #34d399;
}

.log-time {
  color: #888;
  margin-right: 10px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}

.alert {
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.alert strong {
  display: block;
  margin-bottom: 10px;
  font-size: 16px;
}
</style>
