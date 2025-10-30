import { ref, readonly, reactive, toRef } from 'vue';

export const useSimplePageLoading = () => {
  const isLoading = ref(false);
  const loadingText = ref('Loading...');

  const showLoading = (text = 'Loading...') => {
    loadingText.value = text
    isLoading.value = true
  }

  const hideLoading = () => {
    isLoading.value = false
  }

  return {
    isLoading: readonly(isLoading),
    loadingText: readonly(loadingText),
    showLoading,
    hideLoading
  }
}

// Global state for simple loading
const globalState = reactive({
  isLoading: false,
  loadingText: 'Loading...'
})

export const useGlobalSimplePageLoading = () => {
  const showLoading = (text = 'Loading...') => {
    // Disable loading states in iframe mode
    if (process.client && window.parent !== window) {
      return;
    }

    globalState.loadingText = text
    globalState.isLoading = true
  }

  const hideLoading = () => {
    globalState.isLoading = false
  }

  return {
    isLoading: toRef(globalState, 'isLoading'),
    loadingText: toRef(globalState, 'loadingText'),
    showLoading,
    hideLoading
  }
}