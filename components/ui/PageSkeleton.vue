<template>
  <div class="min-h-screen bg-background">
    <!-- Header Skeleton -->
    <div class="bg-white dark:bg-grey-800 border-b border-grey-200 dark:border-grey-700 p-6">
      <div class="max-w-7xl mx-auto">
        <!-- Breadcrumb Skeleton -->
        <div class="flex items-center space-x-2 mb-4">
          <div class="h-4 w-16 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
          <div class="h-4 w-1 bg-grey-300 dark:bg-grey-600 rounded"></div>
          <div class="h-4 w-20 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
          <div class="h-4 w-1 bg-grey-300 dark:bg-grey-600 rounded"></div>
          <div class="h-4 w-24 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
        </div>

        <!-- Page Title Skeleton -->
        <div class="flex justify-between items-center">
          <div class="space-y-2">
            <div class="h-8 w-64 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
            <div class="h-4 w-96 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
          </div>
          <div class="flex space-x-3">
            <div class="h-10 w-24 bg-grey-200 dark:bg-grey-700 rounded-md animate-pulse"></div>
            <div class="h-10 w-32 bg-grey-200 dark:bg-grey-700 rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto p-6">
      <div class="grid grid-cols-12 gap-6">
        <!-- Sidebar Skeleton -->
        <div class="col-span-3">
          <div class="bg-white dark:bg-grey-800 rounded-lg border border-grey-200 dark:border-grey-700 p-4">
            <!-- Navigation Items -->
            <div class="space-y-3">
              <div v-for="i in 4" :key="i" class="flex items-center space-x-3">
                <div class="h-5 w-5 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
                <div class="h-4 w-32 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Skeleton -->
        <div class="col-span-9">
          <div class="bg-white dark:bg-grey-800 rounded-lg border border-grey-200 dark:border-grey-700">
            <!-- Tabs Skeleton -->
            <div class="border-b border-grey-200 dark:border-grey-700 p-6">
              <div class="flex space-x-6">
                <div v-for="i in 5" :key="i" class="h-6 w-24 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
              </div>
            </div>

            <!-- Form Content Skeleton -->
            <div class="p-6 space-y-6">
              <!-- Form Sections -->
              <div v-for="section in 3" :key="section" class="space-y-4">
                <!-- Section Title -->
                <div class="h-6 w-48 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>

                <!-- Form Fields -->
                <div class="grid grid-cols-2 gap-4">
                  <div v-for="field in 4" :key="field" class="space-y-2">
                    <div class="h-4 w-24 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
                    <div class="h-10 w-full bg-grey-200 dark:bg-grey-700 rounded-md animate-pulse"></div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons Skeleton -->
              <div class="flex justify-end space-x-3 pt-6 border-t border-grey-200 dark:border-grey-700">
                <div class="h-10 w-20 bg-grey-200 dark:bg-grey-700 rounded-md animate-pulse"></div>
                <div class="h-10 w-32 bg-grey-200 dark:bg-grey-700 rounded-md animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Animation Overlay -->
    <div class="fixed top-4 right-4 bg-white dark:bg-grey-800 border border-grey-200 dark:border-grey-700 rounded-lg p-4 shadow-lg">
      <div class="flex items-center space-x-3">
        <div class="w-5 h-5 border-2 border-grey-200 dark:border-grey-700 border-t-primary rounded-full animate-spin"></div>
        <span class="text-sm text-grey-600 dark:text-grey-400">Loading content...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// No props needed for skeleton, it's a static loading state
</script>

<style scoped>
/* Enhanced pulse animation for better effect */
@keyframes pulse-wave {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}

.animate-pulse {
  animation: pulse-wave 1.5s ease-in-out infinite;
}

/* Staggered animation for multiple elements */
.animate-pulse:nth-child(1) { animation-delay: 0s; }
.animate-pulse:nth-child(2) { animation-delay: 0.1s; }
.animate-pulse:nth-child(3) { animation-delay: 0.2s; }
.animate-pulse:nth-child(4) { animation-delay: 0.3s; }
.animate-pulse:nth-child(5) { animation-delay: 0.4s; }
</style>