<template>
  <div class="animate-pulse">
    <!-- Skeleton untuk form field -->
    <div v-if="type === 'form-field'" class="space-y-2">
      <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-1/3"></div>
      <div class="h-10 bg-grey-200 dark:bg-grey-700 rounded"></div>
    </div>

    <!-- Skeleton untuk card -->
    <div v-else-if="type === 'card'" class="space-y-4">
      <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-3/4"></div>
      <div class="h-3 bg-grey-200 dark:bg-grey-700 rounded w-1/2"></div>
      <div class="h-3 bg-grey-200 dark:bg-grey-700 rounded w-2/3"></div>
    </div>

    <!-- Skeleton untuk text -->
    <div v-else-if="type === 'text'" class="space-y-2">
      <div
        class="h-4 bg-grey-200 dark:bg-grey-700 rounded"
        :style="{ width: width || '100%' }"
      ></div>
    </div>

    <!-- Default skeleton -->
    <div
      v-else
      class="h-4 bg-grey-200 dark:bg-grey-700 rounded"
      :style="{ width: width || '100%' }"
    ></div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: "text",
    validator: (value) =>
      ["form-field", "photo", "card", "text"].includes(value),
  },
  width: {
    type: String,
    default: "100%",
  },
});
</script>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
</style>
