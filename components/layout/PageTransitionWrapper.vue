<template>
  <div class="relative">
    <!-- Main Content -->
    <slot />

    <!-- Page Loading Overlay -->
    <Transition
      name="loading"
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <PageLoading
        v-if="showLoadingScreen"
        :loading-text="loadingText"
        :show-progress="showProgress"
        :progress="progress"
      />
    </Transition>

    <!-- Page Skeleton (Alternative to loading screen) -->
    <Transition
      name="skeleton"
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <PageSkeleton v-if="showSkeleton" />
    </Transition>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import PageLoading from '~/components/ui/PageLoading.vue';
import PageSkeleton from '~/components/ui/PageSkeleton.vue';

const props = defineProps({
  // Force show skeleton instead of loading screen
  preferSkeleton: {
    type: Boolean,
    default: false
  },
  // Route paths that should use skeleton
  skeletonRoutes: {
    type: Array,
    default: () => ['/update-data', '/update-data/history']
  }
});

// Get page transition state
const { isLoading, loadingText, showProgress, progress } = usePageTransition();

// Determine which loading type to show
const currentRoute = useRoute();

const showSkeleton = computed(() => {
  if (!isLoading.value) return false;

  // Disable loading states in iframe mode
  if (process.client && window.parent !== window) {
    return false;
  }

  return props.preferSkeleton ||
         props.skeletonRoutes.includes(currentRoute.path);
});

const showLoadingScreen = computed(() => {
  // Disable loading states in iframe mode
  if (process.client && window.parent !== window) {
    return false;
  }

  return isLoading.value && !showSkeleton.value;
});
</script>

<style scoped>
/* Loading transition effects */
.loading-enter-active,
.loading-leave-active {
  transition: all 0.3s ease;
}

.loading-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.loading-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

/* Skeleton transition effects */
.skeleton-enter-active,
.skeleton-leave-active {
  transition: opacity 0.2s ease;
}

.skeleton-enter-from,
.skeleton-leave-to {
  opacity: 0;
}
</style>