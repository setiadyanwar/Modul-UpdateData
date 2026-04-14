import { ref, onMounted, onUnmounted, watch, getCurrentInstance } from 'vue';
import { AUTH_CONFIG, ACTIVITY_EVENTS } from './authConfig';
import { logger } from '~/utils/logger';

export const useSessionMonitor = (isAuthenticated, forceLogout, options = {}) => {
  const lastActivityTime = ref(Date.now());
  const idleTimer = ref(null);
  const isSessionWarningShown = ref(false);
  
  // Update last activity time
  const updateActivity = () => {
    if (!isAuthenticated.value) return;

    const now = Date.now();
    // Throttle updates to avoid perf issues
    if (now - lastActivityTime.value > AUTH_CONFIG.ACTIVITY_THROTTLE) {
      lastActivityTime.value = now;
      resetIdleTimer();
    }
  };

  // Reset the main idle timer
  const resetIdleTimer = () => {
    if (process.server || !isAuthenticated.value) return;

    if (idleTimer.value) clearTimeout(idleTimer.value);

    idleTimer.value = setTimeout(() => {
      handleIdleTimeout();
    }, AUTH_CONFIG.SESSION_WARNING_TIME);
  };

  const sessionCountdownTime = ref(0);
  let countdownTimer = null;

  // Handle what happens when user becomes idle
  const handleIdleTimeout = () => {
    if (isSessionWarningShown.value) return;
    
    logger.authEvent('SESSION_IDLE_TIMEOUT', {
      lastActivity: new Date(lastActivityTime.value).toISOString()
    });

    if (options.onWarning) {
      isSessionWarningShown.value = true;
      startCountdown();
      options.onWarning();
    } else {
      forceLogout('Session timed out due to inactivity');
    }
  };

  const startCountdown = () => {
    if (countdownTimer) clearInterval(countdownTimer);
    
    sessionCountdownTime.value = AUTH_CONFIG.COUNTDOWN_DURATION / 1000;
    
    countdownTimer = setInterval(() => {
      sessionCountdownTime.value--;
      if (sessionCountdownTime.value <= 0) {
        clearInterval(countdownTimer);
        forceLogout('Session expired due to inactivity');
      }
    }, 1000);
  };

  const stopCountdown = () => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    sessionCountdownTime.value = 0;
  };

  const hideWarning = () => {
    isSessionWarningShown.value = false;
    stopCountdown();
  };

  // Visibility and focus handling
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      updateActivity();
    }
  };

  const handleWindowFocus = () => {
    updateActivity();
  };

  // Setup event listeners
  const setupEventListeners = () => {
    if (process.server) return;

    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
  };

  const removeEventListeners = () => {
    if (process.server) return;

    ACTIVITY_EVENTS.forEach(event => {
      window.removeEventListener(event, updateActivity);
    });

    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleWindowFocus);
  };

  // Watch authentication state to start/stop monitoring
  watch(isAuthenticated, (newValue) => {
    if (newValue) {
      resetIdleTimer();
      setupEventListeners();
    } else {
      if (idleTimer.value) clearTimeout(idleTimer.value);
      stopCountdown();
      removeEventListeners();
    }
  }, { immediate: true });

  // ✅ FIX: Check if there's an active component instance before using lifecycle hooks
  // This prevents Vue warnings when composable is called from plugin context
  const instance = getCurrentInstance();
  if (instance) {
    onUnmounted(() => {
      if (idleTimer.value) clearTimeout(idleTimer.value);
      stopCountdown();
      removeEventListeners();
    });
  } else if (process.client && typeof window !== 'undefined') {
    // If no component instance (e.g., called from plugin), setup manual cleanup
    // when page unloads
    window.addEventListener('beforeunload', () => {
      if (idleTimer.value) clearTimeout(idleTimer.value);
      stopCountdown();
      removeEventListeners();
    });
  }

  return {
    lastActivityTime,
    isSessionWarningShown,
    sessionCountdownTime,
    updateActivity,
    resetIdleTimer,
    hideWarning
  };
};
