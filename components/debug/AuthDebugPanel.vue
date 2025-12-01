<template>
  <div v-if="isVisible" class="auth-debug-panel" :class="{ 'minimized': isMinimized }">
    <!-- Header -->
    <div class="debug-header" @click="toggleMinimize">
      <span class="debug-title">🔐 Auth Debug Monitor</span>
      <div class="debug-actions">
        <button @click.stop="refresh" class="debug-btn" title="Refresh">🔄</button>
        <button @click.stop="toggleMinimize" class="debug-btn">
          {{ isMinimized ? '📖' : '📕' }}
        </button>
        <button @click.stop="close" class="debug-btn">✖</button>
      </div>
    </div>

    <!-- Content (collapsed when minimized) -->
    <div v-if="!isMinimized" class="debug-content">
      <!-- Authentication Status -->
      <div class="debug-section">
        <div class="debug-label">Auth Status:</div>
        <div class="debug-value" :class="statusClass">
          {{ isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated' }}
        </div>
      </div>

      <!-- Token Expiry -->
      <div class="debug-section">
        <div class="debug-label">Token Expires In:</div>
        <div class="debug-value" :class="tokenExpiryClass">
          {{ tokenExpiryText }}
        </div>
        <div class="debug-progress">
          <div class="progress-bar" :style="{ width: tokenProgress + '%' }"></div>
        </div>
      </div>

      <!-- Last Activity -->
      <div class="debug-section">
        <div class="debug-label">Last Activity:</div>
        <div class="debug-value" :class="activityClass">
          {{ lastActivityText }}
        </div>
        <div class="debug-progress">
          <div class="progress-bar activity-bar" :style="{ width: activityProgress + '%' }"></div>
        </div>
      </div>

      <!-- Session Warning -->
      <div class="debug-section">
        <div class="debug-label">Session Warning In:</div>
        <div class="debug-value" :class="warningClass">
          {{ sessionWarningText }}
        </div>
      </div>

      <!-- Last Chance Monitoring -->
      <div class="debug-section">
        <div class="debug-label">Last Chance Monitor:</div>
        <div class="debug-value" :class="lastChanceClass">
          {{ lastChanceStatus }}
        </div>
        <div v-if="isLastChanceMonitoringActive" class="debug-sub-info">
          <div class="sub-item">
            <span class="sub-label">Activity Detected:</span>
            <span :class="['sub-value', lastChanceActivityDetected ? 'warning' : 'success']">
              {{ lastChanceActivityDetected ? '🔒 LOCKED' : '🔓 READY' }}
            </span>
          </div>
          <div class="sub-item">
            <span class="sub-label">Refresh Count:</span>
            <span class="sub-value info">{{ lastChanceRefreshCount }}</span>
          </div>
          <div v-if="lastRefreshTime" class="sub-item">
            <span class="sub-label">Last Refresh:</span>
            <span class="sub-value success">{{ formatTimeAgo(lastRefreshTime) }}</span>
          </div>
          <div class="sub-item">
            <span class="sub-label">Window:</span>
            <span class="sub-value">{{ lastChanceWindowText }}</span>
          </div>
        </div>
      </div>

      <!-- Modal Status -->
      <div v-if="isSessionWarningVisible" class="debug-section warning">
        <div class="debug-label">⚠️ Session Modal:</div>
        <div class="debug-value">
          VISIBLE - Countdown: {{ sessionCountdownTime }}s
        </div>
      </div>

      <!-- Info -->
      <div class="debug-info">
        <div class="info-item">
          <strong>Config (CORRECTED):</strong><br>
          • Modal After: 15 min idle<br>
          • Modal Countdown: 5 min<br>
          • Last Chance: min 10-15 (5 min window)<br>
          • Token Lifetime: 20 min
        </div>
      </div>

      <!-- Actions -->
      <div class="debug-actions-bar">
        <button @click="forceModal" class="action-btn">Show Modal</button>
        <button @click="forceLogout" class="action-btn danger">Force Logout</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthenticationCore } from '~/composables/useAuthenticationCore';

const props = defineProps({
  defaultVisible: {
    type: Boolean,
    default: true
  }
});

const isVisible = ref(props.defaultVisible);
const isMinimized = ref(false);

// Get auth state
const auth = useAuthenticationCore();
  const {
    isAuthenticated,
    isSessionWarningVisible,
    sessionCountdownTime,
    lastActivityTime,
    isLastChanceMonitoringActive,
    lastChanceActivityDetected,
    lastChanceRefreshCount,
    lastRefreshTime,
    timeSinceLastActivity,
    sessionMonitorStartTime,
    sessionMonitorTargetTime
  } = auth;

// Local state for real-time updates
const now = ref(Date.now());
const tokenExpiryTime = ref(0);
let updateInterval = null;

// Parse token to get expiry
const parseToken = () => {
  if (process.server) return;
  
  const token = localStorage.getItem('access_token');
  if (!token) {
    tokenExpiryTime.value = 0;
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    tokenExpiryTime.value = payload.exp * 1000;
  } catch (e) {
    tokenExpiryTime.value = 0;
  }
};

// Token expiry countdown
const tokenTimeRemaining = computed(() => {
  if (!tokenExpiryTime.value) return 0;
  return Math.max(0, tokenExpiryTime.value - now.value);
});

const tokenExpiryText = computed(() => {
  if (!isAuthenticated.value) return 'N/A';
  if (!tokenTimeRemaining.value) return '⏰ EXPIRED';
  
  const minutes = Math.floor(tokenTimeRemaining.value / 60000);
  const seconds = Math.floor((tokenTimeRemaining.value % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
});

const tokenExpiryClass = computed(() => {
  if (!tokenTimeRemaining.value) return 'danger';
  if (tokenTimeRemaining.value < 300000) return 'warning'; // < 5 min
  return 'success';
});

const tokenProgress = computed(() => {
  if (!tokenExpiryTime.value) return 0;
  const total = 20 * 60 * 1000; // 20 minutes (CORRECTED!)
  return Math.max(0, Math.min(100, (tokenTimeRemaining.value / total) * 100));
});

// Last activity
const timeSinceActivity = computed(() => {
  return now.value - lastActivityTime.value;
});

const lastActivityText = computed(() => {
  if (!isAuthenticated.value) return 'N/A';
  
  const seconds = Math.floor(timeSinceActivity.value / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s ago`;
  }
  return `${seconds}s ago`;
});

const activityClass = computed(() => {
  if (timeSinceActivity.value > 900000) return 'danger'; // > 15 min
  if (timeSinceActivity.value > 600000) return 'warning'; // > 10 min
  return 'success';
});

const activityProgress = computed(() => {
  if (!sessionMonitorStartTime?.value || !sessionMonitorTargetTime?.value) {
    return 0;
  }
  const total = sessionMonitorTargetTime.value - sessionMonitorStartTime.value;
  if (total <= 0) return 100;
  const elapsed = now.value - sessionMonitorStartTime.value;
  const progress = (elapsed / total) * 100;
  return Math.max(0, Math.min(100, progress));
});

// Session warning countdown (fixed session window)
const sessionWarningTimeRemaining = computed(() => {
  if (!sessionMonitorTargetTime?.value) return 0;
  return Math.max(0, sessionMonitorTargetTime.value - now.value);
});

const sessionWarningText = computed(() => {
  if (!isAuthenticated.value) return 'N/A';
  if (isSessionWarningVisible.value) return '🚨 MODAL SHOWN';
  if (sessionWarningTimeRemaining.value === 0) return '⏰ SHOULD SHOW';
  
  const minutes = Math.floor(sessionWarningTimeRemaining.value / 60000);
  const seconds = Math.floor((sessionWarningTimeRemaining.value % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
});

const warningClass = computed(() => {
  if (isSessionWarningVisible.value) return 'danger blink';
  if (sessionWarningTimeRemaining.value === 0) return 'danger';
  if (sessionWarningTimeRemaining.value < 300000) return 'warning'; // < 5 min
  return 'success';
});

// Last chance monitoring
const lastChanceStatus = computed(() => {
  if (!isAuthenticated.value) return 'N/A';
  if (isLastChanceMonitoringActive.value) return '🟢 ACTIVE';
  
  const windowStart = sessionMonitorTargetTime?.value
    ? sessionMonitorTargetTime.value - 300000
    : 0;
  const nowMs = now.value;
  
  if (windowStart && nowMs >= windowStart && nowMs < sessionMonitorTargetTime.value) {
    return '🟡 SHOULD BE ACTIVE';
  }
  
  return '⚪ Inactive';
});

const lastChanceClass = computed(() => {
  if (isLastChanceMonitoringActive.value) return 'success';
  const windowStart = sessionMonitorTargetTime?.value
    ? sessionMonitorTargetTime.value - 300000
    : 0;
  const nowMs = now.value;
  if (windowStart && nowMs >= windowStart && nowMs < sessionMonitorTargetTime.value) {
    return 'warning';
  }
  return 'info';
});

// Last chance window timing
const lastChanceWindowText = computed(() => {
  if (!sessionMonitorTargetTime?.value) return 'N/A';
  const windowStart = sessionMonitorTargetTime.value - 300000;
  const windowEnd = sessionMonitorTargetTime.value;
  const nowMs = now.value;
  
  if (nowMs < windowStart) {
    const timeUntilWindow = windowStart - nowMs;
    const minutes = Math.floor(timeUntilWindow / 60000);
    const seconds = Math.floor((timeUntilWindow % 60000) / 1000);
    return `Starts in ${minutes}m ${seconds}s`;
  } else if (nowMs >= windowStart && nowMs < windowEnd) {
    const timeInWindow = nowMs - windowStart;
    const minutes = Math.floor(timeInWindow / 60000);
    const seconds = Math.floor((timeInWindow % 60000) / 1000);
    return `Active: ${minutes}m ${seconds}s in`;
  } else {
    return 'Window passed';
  }
});

// Format time ago
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'N/A';
  const diff = now.value - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s ago`;
};

// Status class
const statusClass = computed(() => {
  return isAuthenticated.value ? 'success' : 'danger';
});

// Actions
const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value;
};

const close = () => {
  isVisible.value = false;
  localStorage.setItem('auth_debug_panel_hidden', 'true');
};

const refresh = () => {
  parseToken();
  now.value = Date.now();
};

const forceModal = () => {
  if (auth.showSessionWarning) {
    auth.showSessionWarning();
  }
};

const forceLogout = () => {
  if (confirm('Force logout?')) {
    auth.logout('Debug panel force logout');
  }
};

// Update timer
onMounted(() => {
  // Check if user previously closed panel
  const wasHidden = localStorage.getItem('auth_debug_panel_hidden');
  if (wasHidden === 'true') {
    isVisible.value = false;
  }

  parseToken();
  
  // Update every 100ms for smooth countdown
  updateInterval = setInterval(() => {
    now.value = Date.now();
    
    // Re-parse token every 10 seconds to catch refresh
    if (now.value % 10000 < 100) {
      parseToken();
    }
  }, 100);

  // Keyboard shortcut: Ctrl+Shift+D to toggle
  const handleKeyPress = (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      isVisible.value = !isVisible.value;
      if (isVisible.value) {
        localStorage.removeItem('auth_debug_panel_hidden');
      }
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  
  onUnmounted(() => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    window.removeEventListener('keydown', handleKeyPress);
  });
});
</script>

<style scoped>
.auth-debug-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.95);
  color: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  font-family: 'Courier New', monospace;
  font-size: 12px;
  z-index: 99999;
  min-width: 320px;
  max-width: 400px;
  backdrop-filter: blur(10px);
  border: 2px solid #333;
  transition: all 0.3s ease;
}

.auth-debug-panel.minimized {
  min-width: auto;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px 10px 0 0;
  cursor: pointer;
  user-select: none;
}

.debug-title {
  font-weight: bold;
  font-size: 14px;
}

.debug-actions {
  display: flex;
  gap: 8px;
}

.debug-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  transition: background 0.2s;
}

.debug-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.debug-content {
  padding: 16px;
  max-height: 80vh;
  overflow-y: auto;
}

.debug-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #333;
}

.debug-section.warning {
  background: rgba(255, 152, 0, 0.1);
  padding: 12px;
  border-radius: 8px;
  border: 2px solid #ff9800;
}

.debug-label {
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.debug-value {
  font-size: 16px;
  font-weight: bold;
  padding: 4px 0;
}

.debug-value.success {
  color: #4caf50;
}

.debug-value.warning {
  color: #ff9800;
}

.debug-value.danger {
  color: #f44336;
}

.debug-value.info {
  color: #2196f3;
}

.debug-value.blink {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.5; }
}

.debug-progress {
  margin-top: 8px;
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.1s linear;
}

.progress-bar.activity-bar {
  background: linear-gradient(90deg, #4caf50, #ff9800, #f44336);
}

.debug-info {
  margin-top: 16px;
  padding: 12px;
  background: rgba(33, 150, 243, 0.1);
  border-radius: 8px;
  border-left: 4px solid #2196f3;
}

.info-item {
  font-size: 11px;
  line-height: 1.6;
  color: #ccc;
}

.debug-sub-info {
  margin-top: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 10px;
}

.sub-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.sub-item:last-child {
  margin-bottom: 0;
}

.sub-label {
  color: #999;
}

.sub-value {
  font-weight: bold;
}

.sub-value.success {
  color: #4caf50;
}

.sub-value.warning {
  color: #ff9800;
}

.sub-value.info {
  color: #2196f3;
}

.debug-actions-bar {
  margin-top: 16px;
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  background: #667eea;
  border: none;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.action-btn.danger {
  background: #f44336;
}

.action-btn.danger:hover {
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
}

/* Scrollbar styling */
.debug-content::-webkit-scrollbar {
  width: 6px;
}

.debug-content::-webkit-scrollbar-track {
  background: #222;
}

.debug-content::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 3px;
}

.debug-content::-webkit-scrollbar-thumb:hover {
  background: #764ba2;
}
</style>

