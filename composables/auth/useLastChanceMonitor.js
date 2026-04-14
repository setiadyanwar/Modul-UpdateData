import { ref, onMounted, onUnmounted, watch, getCurrentInstance } from 'vue';
import { AUTH_CONFIG } from './authConfig';
import { logger } from '~/utils/logger';

export const useLastChanceMonitor = (isAuthenticated, lastActivityTime, rotateToken) => {
  const lastChanceTimer = ref(null);

  // Setup the "last chance" check interval
  const startLastChanceMonitor = () => {
    if (process.server || !isAuthenticated.value) return;

    if (lastChanceTimer.value) clearInterval(lastChanceTimer.value);

    // Run every minute
    lastChanceTimer.value = setInterval(() => {
      performLastChanceCheck();
    }, 60000);
  };

  const performLastChanceCheck = async () => {
    if (!isAuthenticated.value) return;

    const now = Date.now();
    const idleTime = now - lastActivityTime.value;

    // If user is in the "last chance" window (e.g., between 10-15 minutes of idle time)
    // but was active recently according to standard timers, or if we want to ensure 
    // fresh token before they hit a critical inactivity threshold
    if (idleTime >= 600000 && idleTime < AUTH_CONFIG.SESSION_WARNING_TIME) {
      if (process.dev) {
        logger.authEvent('LAST_CHANCE_ROTATION_TRIGGERED', {
          idleMinutes: Math.floor(idleTime / 60000)
        });
      }
      
      if (rotateToken) {
        await rotateToken();
      }
    }
  };

  watch(isAuthenticated, (newValue) => {
    if (newValue) {
      startLastChanceMonitor();
    } else {
      if (lastChanceTimer.value) clearInterval(lastChanceTimer.value);
    }
  }, { immediate: true });

  // ✅ FIX: Check if there's an active component instance before using lifecycle hooks
  // This prevents Vue warnings when composable is called from plugin context
  const instance = getCurrentInstance();
  if (instance) {
    onUnmounted(() => {
      if (lastChanceTimer.value) clearInterval(lastChanceTimer.value);
    });
  } else if (process.client && typeof window !== 'undefined') {
    // If no component instance (e.g., called from plugin), setup manual cleanup
    // when page unloads
    window.addEventListener('beforeunload', () => {
      if (lastChanceTimer.value) clearInterval(lastChanceTimer.value);
    });
  }

  return {
    performLastChanceCheck
  };
};
