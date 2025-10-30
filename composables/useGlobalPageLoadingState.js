/**
 * Global Page Loading State Composable
 * 
 * Provides global loading state management for page-level loading indicators.
 * This composable is used by PageLoading.vue component.
 * 
 * Features:
 * - Global loading state
 * - Custom loading messages
 * - Reactive loading text
 * - Show/hide loading controls
 */

import { reactive, toRef } from 'vue'

// Global state for page loading
const globalPageLoadingState = reactive({
  isLoading: false,
  loadingText: 'Loading...'
})

/**
 * Global Page Loading State Composable
 * 
 * @returns {Object} Loading state and control functions
 * @returns {Ref<boolean>} isLoading - Current loading state
 * @returns {Ref<string>} loadingText - Current loading text
 * @returns {Function} showLoading - Show loading with optional text
 * @returns {Function} hideLoading - Hide loading
 */
export const useGlobalPageLoadingState = () => {
  /**
   * Show loading state with optional custom text
   * 
   * @param {string} text - Custom loading text (default: 'Loading...')
   */
  const showLoading = (text = 'Loading...') => {
    // Disable loading states in iframe mode
    if (process.client && window.parent !== window) {
      return;
    }

    globalPageLoadingState.loadingText = text
    globalPageLoadingState.isLoading = true
  }

  /**
   * Hide loading state
   */
  const hideLoading = () => {
    globalPageLoadingState.isLoading = false
  }

  return {
    isLoading: toRef(globalPageLoadingState, 'isLoading'),
    loadingText: toRef(globalPageLoadingState, 'loadingText'),
    showLoading,
    hideLoading
  }
}
