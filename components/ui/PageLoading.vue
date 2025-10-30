<template>
  <div class="fixed inset-0 z-[9999] bg-white dark:bg-gray-900 flex items-center justify-center">
    <!-- Clean Loading Animation -->
    <div class="text-center">
      <!-- Loading Animation -->
      <div class="relative mb-16">
        <!-- Background Glow -->
        <div class="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-3xl blur-2xl animate-glow-elegant"></div>
        
        <!-- Main Loading Ring -->
        <div class="relative w-32 h-32 mx-auto">
          <!-- Outer Ring -->
          <div class="absolute inset-0 rounded-full border-4 border-secondary-200"></div>
          <!-- Logo Container -->
          <div class="absolute inset-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
            <img 
              src="~/assets/logo.svg" 
              alt="TelkomSigma Logo" 
              class="w-20 h-20 object-contain"
              @error="handleLogoError"
            />
          </div>
          <!-- Simple Spinning Ring -->
          <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-secondary-600 animate-spin-slow"></div>
        </div>
      </div>

    <!-- Subtitle -->
        <div class="text-lg text-gray-600 dark:text-gray-300 font-medium mb-4">
          Employee Self Service
        </div>
      <!-- Loading Text -->
      <h3 class="text-3xl font-medium text-gray-800 dark:text-gray-100 mb-2 animate-fade-in shine-text">
        {{ computedLoadingText }}
      </h3>
      
      <!-- Simple Branding -->
      <div class="space-y-4 mb-8 animate-fade-in" style="animation-delay: 0.3s;">
        <!-- Powered by -->
        <div class="flex items-center justify-center space-x-2">
          <span class="text-sm text-gray-500 dark:text-gray-400">Powered by</span>
          <div class="bg-white dark:bg-gray-800 px-3 py-2 rounded-full border border-gray-200 dark:border-gray-600">
            <span class="text-sm font-bold text-red-600">telkomsigma</span>
          </div>
        </div>
      </div>
      
      <!-- Loading Dots -->
      <div class="flex justify-center space-x-2 mb-8">
        <div v-for="i in 3" :key="i" 
             class="w-2 h-2 bg-secondary-500 rounded-full animate-pulse-dots"
             :style="{ 'animation-delay': `${i * 0.3}s` }">
        </div>
      </div>

      <!-- Progress Bar -->
      <div v-if="showProgress" class="w-80 mx-auto">
        <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
          <span>Progress</span>
          <span>{{ Math.round(progress) }}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="h-full bg-secondary-600 rounded-full transition-all duration-500 ease-out"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGlobalPageLoadingState } from '~/composables/useGlobalPageLoadingState'

const props = defineProps({
  loadingText: {
    type: String,
    default: 'Loading...'
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  },
  useGlobal: {
    type: Boolean,
    default: false
  }
});

const { isLoading: globalIsLoading, loadingText: globalLoadingText } = useGlobalPageLoadingState()

const computedLoadingText = computed(() => {
  if (props.useGlobal) {
    return globalLoadingText.value
  }
  return props.loadingText
})

const handleLogoError = () => {
};
</script>

<style scoped>
/* Elegant glow animation */
@keyframes glow-elegant {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

.animate-glow-elegant {
  animation: glow-elegant 3s ease-in-out infinite;
}

/* Soft pulse animation */
@keyframes pulse-soft {
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.02);
  }
}

.animate-pulse-soft {
  animation: pulse-soft 2s ease-in-out infinite;
}

/* Elegant scale animation */
@keyframes scale-elegant {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.01);
  }
}

.animate-scale-elegant {
  animation: scale-elegant 3s ease-in-out infinite;
}

/* Slow spin animation */
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

/* Elegant floating dots animation */
@keyframes float-elegant {
  0%, 100% {
    transform: translate(var(--x, 0), var(--y, 0)) scale(1);
    opacity: 0.6;
  }
  25% {
    transform: translate(calc(var(--x, 0) + 3px), calc(var(--y, 0) - 3px)) scale(1.1);
    opacity: 0.9;
  }
  50% {
    transform: translate(calc(var(--x, 0) + 6px), calc(var(--y, 0) + 2px)) scale(1.3);
    opacity: 1;
  }
  75% {
    transform: translate(calc(var(--x, 0) + 2px), calc(var(--y, 0) - 4px)) scale(1.1);
    opacity: 0.8;
  }
}

.animate-float-elegant {
  animation: float-elegant 3s ease-in-out infinite;
  animation-delay: var(--delay, 0s);
}

/* Fade in animation */
@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 1s ease-out both;
}

/* Pulse dots animation */
@keyframes pulse-dots {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.animate-pulse-dots {
  animation: pulse-dots 1.5s ease-in-out infinite;
}

/* Shine text effect */
@keyframes shine {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

.shine-text {
  background: linear-gradient(
    90deg,
    #374151 0%,
    #6b7280 25%,
    #1f2937 50%,
    #6b7280 75%,
    #374151 100%
  );
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine 4s linear infinite;
}

/* Dark mode shine effect */
.dark .shine-text {
  background: linear-gradient(
    90deg,
    #f3f4f6 0%,
    #9ca3af 25%,
    #ffffff 50%,
    #9ca3af 75%,
    #f3f4f6 100%
  );
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine 4s linear infinite;
}

/* Smooth transitions */
* {
  transition: all 0.3s ease;
}
</style>