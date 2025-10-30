<template>
  <div
    class="absolute right-0 mt-2 w-80 md:w-96 bg-dashboard rounded-md shadow-xl border border-grey-200 dark:border-grey-700 z-50"
  >
    <div
      class="flex justify-between items-center p-4 border-b border-grey-200 dark:border-grey-700"
    >
      <h3 class="font-semibold text-text-main flex items-center gap-2">
        Notification
        <span
          class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-secondary text-white ring-secondary-600/10 dark:bg-secondary-800 dark:text-secondary-300"
        >
          {{ notifications.length }}
        </span>
      </h3>
      <button class="text-xs text-secondary font-regular hover:underline">
        Mark As Read
      </button>
    </div>

    <div class="max-h-96 overflow-y-auto px-2 py-3">
      <div v-if="notifications.length > 0" class="space-y-4">
        <div
          v-for="notif in notifications"
          :key="notif.id"
          class="bg-white dark:bg-grey-900 rounded-xl border border-grey-200 dark:border-grey-800 p-5 flex gap-4 items-start transition-colors hover:bg-grey-100 dark:hover:bg-grey-800 cursor-pointer"
        >
          <div class="flex flex-col items-center gap-2">
            <img :src="notif.icon" alt="icon" class="w-8 h-8" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start mb-1">
              <span class="text-xs text-grey-400">{{
                notif.date || "Friday, 20 Jun 2025"
              }}</span>
              <span class="text-xs text-grey-400 flex-shrink-0 ml-2">{{
                notif.time
              }}</span>
            </div>
            <div class="flex items-center gap-2 mb-1">
              <p class="font-bold text-base text-text-main">
                {{ notif.title }}
              </p>
              <span
                class="inline-flex items-center rounded bg-primary text-white text-xs px-2 py-0.5 ml-1"
                >1</span
              >
            </div>
            <p class="text-sm text-grey-500 truncate">
              {{ notif.description }}
            </p>
            <a
              href="#"
              class="text-sm text-primary font-semibold hover:underline mt-1 inline-block"
              >view more</a
            >
          </div>
        </div>
      </div>
      <div v-else class="p-10 text-center text-grey-500">
        This feature is currently under development.
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  notifications: {
    type: Array,
    required: true,
  },
});
</script>

<style scoped>
/* Hapus custom-scrollbar, gunakan default scrollbar browser */
</style>
