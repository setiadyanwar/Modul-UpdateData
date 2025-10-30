<template>
  <div class="bg-card-bg rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-4 md:p-6">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div class="flex-1 min-w-0">
        <h1 class="text-lg md:text-xl font-bold text-text-main mb-2">
          {{ title || 'Status Request' }}
        </h1>
        <p class="text-sm md:text-base text-grey-600 dark:text-grey-400">
          ID Request: {{ requestId }}
        </p>
      </div>
      <div class="flex items-center gap-3 lg:gap-4 min-w-0">
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-10 h-10 md:w-12 md:h-12 rounded-full flex-shrink-0 bg-primary-50 flex items-center justify-center text-primary font-bold select-none overflow-hidden"
            :title="displayName"
          >
            <span class="text-sm font-semibold">{{ initials }}</span>
          </div>
          <div class="text-left min-w-0">
            <p class="text-sm md:text-base font-medium text-grey-900 dark:text-grey-100 max-w-[60vw] lg:max-w-xs truncate" :title="approverName || reviewerName">
              {{ approverName || reviewerName || 'HC Team' }}
            </p>
            <p class="text-xs md:text-sm text-grey-500 max-w-[60vw] lg:max-w-xs truncate" :title="approverEmail">
              {{ (approverEmail && approverEmail.trim() !== '') ? `${approverEmail}` : '' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4">
      <StatusTracker :steps="steps" />
    </div>
  </div>
</template>

<script setup>
import StatusTracker from './StatusTracker.vue'

const props = defineProps({
  title: { type: String, default: 'Status Request' },
  requestId: { type: String, default: '' },
  reviewerName: { type: String, default: '' },
  approverName: { type: String, default: '' },
  approverEmail: { type: String, default: '' },
  steps: { type: Array, default: () => [] }
})

// Compute display name and initials (fallback like profile)
const displayName = computed(() => props.approverName || props.reviewerName || 'HC Team')
const initials = computed(() => {
  const name = (displayName.value || '').trim()
  if (!name) return 'HC'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})
</script>


