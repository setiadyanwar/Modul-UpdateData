/**
 * Page Transition Loading Composable
 * Manages loading states during page navigation
 *
 * Features:
 * - Global loading state
 * - Custom loading messages
 * - Progress tracking
 * - Auto cleanup
 */

import { ref, computed } from 'vue';
import { navigateTo } from '#app';

// Global state
let transitionInstance = null;

export const usePageTransition = () => {
  // Return existing instance if available (singleton pattern)
  if (transitionInstance) {
    return transitionInstance;
  }

  // Reactive state
  const isLoading = ref(false);
  const loadingText = ref('Loading...');
  const showProgress = ref(false);
  const progress = ref(0);
  const startTime = ref(null);

  // Timeout references for cleanup
  let loadingTimeout = null;
  let progressInterval = null;
  let minLoadingTimeout = null;

  // Predefined loading messages for different routes
  const routeMessages = {
    '/update-data': 'Loading Personal Data...',
    '/update-data/history': 'Loading Request History...',
    '/update-data/consent': 'Loading Consent Management...',
    '/rbac': 'Loading RBAC Management...',
    '/favorites': 'Loading Favorites...',
    '/manage-app': 'Loading App Management...',
  };

  // Start loading with optional custom message
  const startLoading = (customText = null, routePath = null, enableProgress = false) => {
    // Disable loading states in iframe mode
    if (process.client && window.parent !== window) {
      return;
    }

    // Clear any existing timers
    clearTimers();

    // Set loading state
    isLoading.value = true;
    showProgress.value = enableProgress;
    progress.value = 0;
    startTime.value = Date.now();

    // Determine loading text
    if (customText) {
      loadingText.value = customText;
    } else if (routePath && routeMessages[routePath]) {
      loadingText.value = routeMessages[routePath];
    } else {
      loadingText.value = 'Loading...';
    }

    // Start progress simulation if enabled
    if (enableProgress) {
      simulateProgress();
    }

    // Auto stop loading after maximum time (fallback)
    loadingTimeout = setTimeout(() => {
      stopLoading();
    }, 10000); // 10 second max
  };

  // Stop loading with minimum display time
  const stopLoading = (immediate = false) => {
    const elapsed = startTime.value ? Date.now() - startTime.value : 0;
    const minDisplayTime = 500; // Minimum 500ms to avoid flash

    const finishLoading = () => {
      isLoading.value = false;
      loadingText.value = 'Loading...';
      showProgress.value = false;
      progress.value = 0;
      startTime.value = null;
      clearTimers();
    };

    if (immediate || elapsed >= minDisplayTime) {
      finishLoading();
    } else {
      // Wait for minimum display time
      minLoadingTimeout = setTimeout(finishLoading, minDisplayTime - elapsed);
    }
  };

  // Simulate progress for better UX
  const simulateProgress = () => {
    progress.value = 0;

    progressInterval = setInterval(() => {
      if (progress.value < 95) {
        // Simulate realistic loading progress
        const increment = Math.random() * 10 + 3; // 3-13% increments
        progress.value = Math.min(progress.value + increment, 95);
      } else if (progress.value < 100) {
        // Slow down near completion
        progress.value = Math.min(progress.value + 1, 100);
      }
    }, 200); // Update every 200ms
  };

  // Complete progress (called when actual loading finishes)
  const completeProgress = () => {
    if (showProgress.value) {
      progress.value = 100;
      // Small delay before hiding to show completion
      setTimeout(() => {
        stopLoading();
      }, 200);
    } else {
      stopLoading();
    }
  };

  // Clear all timers
  const clearTimers = () => {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      loadingTimeout = null;
    }
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    if (minLoadingTimeout) {
      clearTimeout(minLoadingTimeout);
      minLoadingTimeout = null;
    }
  };

  // Navigation wrapper with loading
  const navigateWithLoading = async (to, options = {}) => {
    const {
      loadingMessage,
      enableProgress = true,
      external = false,
      applicationName = null
    } = options;

    try {
      // Mark this as application card navigation if applicationName is provided
      if (applicationName && !external) {
        const { markApplicationCardNavigation } = await import('~/composables/useApplicationNavigation');
        markApplicationCardNavigation(applicationName);
      }

      // Navigate
      if (external) {
        await navigateTo(to, { external: true });
      } else {
        await navigateTo(to);
      }

    } catch (error) {
      stopLoading(true); // Stop immediately on error
      throw error;
    }
  };

  // Computed properties
  const isTransitioning = computed(() => isLoading.value);
  const loadingDuration = computed(() => {
    return startTime.value ? Date.now() - startTime.value : 0;
  });

  // Create singleton instance
  transitionInstance = {
    // State
    isLoading: computed(() => isLoading.value),
    isTransitioning,
    loadingText: computed(() => loadingText.value),
    showProgress: computed(() => showProgress.value),
    progress: computed(() => progress.value),
    loadingDuration,

    // Methods
    startLoading,
    stopLoading,
    completeProgress,
    navigateWithLoading,

    // Utils
    clearTimers,
  };

  // Cleanup on page unload
  if (process.client) {
    window.addEventListener('beforeunload', () => {
      clearTimers();
    });
  }

  return transitionInstance;
};