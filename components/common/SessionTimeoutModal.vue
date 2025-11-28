<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 z-50 flex items-center justify-center"
    style="background: rgba(0, 0, 0, 0) !important; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
    @click.self="handleBackgroundClick"
  >
    <!-- Modal panel -->
    <div class="bg-white dark:bg-grey-900 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all max-w-lg w-full mx-4 border border-grey-200 dark:border-grey-700">
      <div class="bg-white dark:bg-grey-900 px-6 pt-6 pb-4">
        <div class="flex items-start">
          <!-- Warning Icon -->
          <div class="flex-shrink-0 warning-icon-container">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 3 Q12 2.2 12.6 3.4 L21 19.5 Q21.5 20.6 20.3 20.6 H3.7 Q2.5 20.6 3 19.5 L11.4 3.4 Q12 2.2 12 3 Z"
                fill="#FFC107"
                stroke="white"
                stroke-width="1"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M12 8V13"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle cx="12" cy="17" r="1" fill="white" />
            </svg>
          </div>
          <div class="ml-4 flex-1">
            <h3
              class="text-lg leading-6 font-medium text-grey-900 dark:text-white"
              id="modal-title"
            >
              Session Will Expire Soon
            </h3>
            <div class="mt-2">
              <p class="text-sm text-grey-500 dark:text-grey-400">
                Your session will expire in
                <span class="font-semibold text-orange-600 dark:text-orange-500 text-base">
                  {{ formatTime(remainingTime) }}
                </span>
                due to inactivity. Click "Extend Session" to stay signed in.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="bg-grey-50 dark:bg-grey-800 px-6 py-4 flex flex-row-reverse gap-3">
        <button
          type="button"
          class="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          @click="handleExtendSession"
          :disabled="isLoading"
        >
          <i v-if="isLoading" class="pi pi-spin pi-spinner mr-2"></i>
          {{ isLoading ? 'Extending...' : 'Extend Session' }}
        </button>
        <button
          type="button"
          class="inline-flex justify-center rounded-md border border-grey-300 dark:border-grey-600 shadow-sm px-4 py-2 bg-white dark:bg-grey-700 text-sm font-medium text-grey-700 dark:text-grey-300 hover:bg-grey-50 dark:hover:bg-grey-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          @click="handleLogout"
          :disabled="isLoading"
        >
          Logout
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  remainingTime: {
    type: Number,
    default: 300
  }
});

const emit = defineEmits(['logout', 'extend-session']);

const isLoading = ref(false);

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds < 0) {
    return '5:00';
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const handleExtendSession = async () => {
  isLoading.value = true;
  try {
    emit('extend-session');
  } finally {
    isLoading.value = false;
  }
};

const handleLogout = () => {
  emit('logout');
};

const handleBackgroundClick = () => {
  // Prevent closing by clicking background
};
</script>

<style scoped>
/* Warning icon container */
.warning-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}

.warning-icon-container svg {
  /* Subtle shadow for depth */
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
}

/* Ensure overlay is transparent - override any other styles */
div[role="dialog"] {
  background: transparent !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
}

/* Remove any background color that might be added */
div[role="dialog"]::before {
  display: none !important;
}

/* Modal entrance animation */
div[role="dialog"] {
  animation: fadeIn 0.3s ease-out;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
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
div[role="dialog"] > div {
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

