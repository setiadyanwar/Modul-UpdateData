<template>
  <div
    v-if="isSessionWarningVisible"
    class="fixed inset-0 z-50 flex items-center justify-center"
    style="background: transparent; backdrop-filter: blur(2px);"
    @click.self="handleBackdropClick"
  >
    <div class="bg-white dark:bg-grey-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 transform translate-y-0 border border-grey-200 dark:border-grey-700">
      <!-- Header -->
      <div class="flex items-center mb-4">
        <div class="flex-shrink-0">
          <i class="pi pi-clock text-orange-500 text-2xl"></i>
        </div>
        <div class="ml-3">
          <h3 class="text-lg font-medium text-grey-900 dark:text-grey-100">
            Session Timeout Warning
          </h3>
        </div>
      </div>

      <!-- Content -->
      <div class="mb-6">
        <p class="text-sm text-grey-600 dark:text-grey-400 mb-4">
          Your session will expire in:
        </p>
        
        <!-- Countdown Display -->
        <div class="text-center mb-4">
          <div class="text-3xl font-bold text-orange-600 dark:text-orange-500 mb-2">
            {{ formatCountdown(sessionCountdownTime) }}
          </div>
          <div class="text-sm text-grey-500 dark:text-grey-400">
            {{ sessionCountdownTime <= 60 ? 'seconds' : 'minutes' }} remaining
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-grey-200 dark:bg-grey-700 rounded-full h-2 mb-4">
          <div
            class="bg-orange-500 dark:bg-orange-600 h-2 rounded-full transition-all duration-1000"
            :style="{ width: `${(sessionCountdownTime / 300) * 100}%` }"
          ></div>
        </div>

        <p class="text-sm text-grey-600 dark:text-grey-400">
          Click "Extend Session" to continue working, or you will be automatically logged out.
        </p>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <UiButton
          variant="outline"
          size="small"
          @click="handleLogout"
          :disabled="isExtending"
        >
          <i class="pi pi-sign-out mr-2"></i>
          Logout
        </UiButton>
        
        <UiButton
          variant="primary"
          size="small"
          @click="handleExtendSession"
          :disabled="isExtending"
        >
          <i
            :class="isExtending ? 'pi pi-spin pi-spinner mr-2' : 'pi pi-refresh mr-2'"
          ></i>
          {{ isExtending ? 'Extending...' : 'Extend Session' }}
        </UiButton>
      </div>

      <!-- Warning Message -->
      <div v-if="sessionCountdownTime <= 30" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="pi pi-exclamation-triangle text-red-500 dark:text-red-400"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700 dark:text-red-300">
              <strong>Warning:</strong> Your session will expire very soon. Please extend your session to avoid losing your work.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuth } from '~/composables/useAuth'

// Composables
const { 
  isSessionWarningVisible, 
  sessionCountdownTime, 
  extendSession, 
  logout 
} = useAuth()

// Local state
const isExtending = ref(false)

// Methods
const handleExtendSession = async () => {
  if (isExtending.value) return
  
  try {
    isExtending.value = true
    const success = await extendSession()
    
    if (!success) {
      // If extension failed, the user will be logged out automatically
    }
  } catch (error) {
  } finally {
    isExtending.value = false
  }
}

const handleLogout = () => {
  logout('User chose to logout')
}

const handleBackdropClick = () => {
  // Don't allow closing by clicking backdrop during countdown
  // User must explicitly choose to extend or logout
}

// Format countdown time
const formatCountdown = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Watch for countdown changes
watch(sessionCountdownTime, (newCountdown) => {
  if (newCountdown <= 0) {
    // Auto logout when countdown reaches 0
  }
})

// Watch for modal visibility
watch(isSessionWarningVisible, (isVisible) => {
  if (isVisible) {
  } else {
  }
})

// Listen for force show modal event (for testing)
onMounted(() => {
  const handleForceShowModal = (event) => {
    isSessionWarningVisible.value = true
    if (event.detail?.countdown) {
      sessionCountdownTime.value = event.detail.countdown
    }
  }
  
  window.addEventListener('force-show-session-modal', handleForceShowModal)
  
  // Cleanup
  onUnmounted(() => {
    window.removeEventListener('force-show-session-modal', handleForceShowModal)
  })
})
</script>

<style scoped>
/* Custom animations for countdown */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.text-orange-600 {
  animation: pulse 2s infinite;
}

/* Progress bar animation */
.transition-all {
  transition: width 1s ease-in-out;
}

/* Modal entrance animation */
.fixed {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Modal slide in from center */
.fixed > div {
  animation: slideInCenter 0.3s ease-out;
}

@keyframes slideInCenter {
  from {
    transform: translateY(-20px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
</style>