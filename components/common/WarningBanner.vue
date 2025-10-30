<template>
  <div v-if="!isEligible" class="mb-4">
    <div 
      class="border rounded-md p-4"
      :class="{
        'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800': computedVariant === 'locked' || computedVariant === 'pending',
        'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800': computedVariant === 'draft',
        'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800': computedVariant === 'need-revision'
      }"
    >
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 mt-0.5">
          <i 
            class="text-lg"
            :class="{
              'pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400': computedVariant === 'locked' || computedVariant === 'pending',
              'pi pi-file-edit text-blue-600 dark:text-blue-400': computedVariant === 'draft',
              'pi pi-exclamation-circle text-orange-600 dark:text-orange-400': computedVariant === 'need-revision'
            }"
          ></i>
        </div>
        <div class="flex-1">
          <h3 
            class="text-sm font-medium mt-1"
            :class="{
              'text-yellow-800 dark:text-yellow-200': computedVariant === 'locked' || computedVariant === 'pending',
              'text-blue-800 dark:text-blue-200': computedVariant === 'draft',
              'text-orange-800 dark:text-orange-200': computedVariant === 'need-revision'
            }"
          >
            <span v-if="computedVariant === 'locked'">
              Section Locked
            </span>
            <span v-else-if="computedVariant === 'pending'">
              Request Pending Approval
            </span>
            <span v-else-if="computedVariant === 'draft'">
              Draft Exists
            </span>
            <span v-else-if="computedVariant === 'need-revision'">
              Request Needs Revision
            </span>
          </h3>
          <p 
          
            class="text-sm mt-1"
            :class="{
              'text-yellow-900 dark:text-yellow-300': computedVariant === 'locked' || computedVariant === 'pending',
              'text-blue-900 dark:text-blue-300': computedVariant === 'draft',
              'text-orange-900 dark:text-orange-300': computedVariant === 'need-revision'
            }"
          >
            <span v-if="computedVariant === 'locked'">
              This section is locked due to company policy and cannot be modified.
            </span>
            <span v-else-if="computedVariant === 'pending'">
              This section cannot be edited because there is a request waiting for approval. 
              Please wait until the current request is processed before making new changes.
            </span>
            <span v-else-if="computedVariant === 'draft'">
              You already have a draft request for this section. Please complete or submit the existing draft before creating a new one.
            </span>
            <span v-else-if="computedVariant === 'need-revision'">
              You have a request that needs revision. Please fix the revision comments first before creating a new request.
            </span>
          </p>
          <div v-if="computedVariant === 'pending' || computedVariant === 'draft' || computedVariant === 'need-revision'" class="mt-2">
            <NuxtLink 
              :to="computedHistoryLink" 
              class="text-sm font-medium underline"
              :class="{
                'text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100': computedVariant === 'pending',
                'text-blue-800 dark:text-blue-200 hover:text-blue-900 dark:hover:text-blue-100': computedVariant === 'draft',
                'text-orange-800 dark:text-orange-200 hover:text-orange-900 dark:hover:text-orange-100': computedVariant === 'need-revision'
              }"
            >
              <span v-if="computedVariant === 'pending'">View pending request →</span>
              <span v-else-if="computedVariant === 'draft'">View existing draft →</span>
              <span v-else-if="computedVariant === 'need-revision'">Open revision page →</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

/**
 * WarningBanner Component
 * 
 * Menampilkan warning banner dengan 4 varian:
 * - 'locked': Section yang terkunci karena policy (warna kuning)
 * - 'pending': Edit mode disabled karena ada request pending (warna kuning)  
 * - 'draft': Draft sudah ada untuk section ini (warna biru)
 * - 'need-revision': Permintaan perlu direvisi (warna orange)
 * 
 * Usage:
 * 
 * // Untuk draft warning
 * <WarningBanner 
 *   :is-eligible="!hasDraftForTab" 
 *   :has-draft="hasDraftForTab"
 *   variant="draft"
 * />
 * 
 * // Auto-detect variant
 * <WarningBanner 
 *   :is-eligible="!isLocked && !hasDraft" 
 *   :is-locked="isLocked"
 *   :has-draft="hasDraft"
 * />
 */
const props = defineProps({
  isEligible: {
    type: Boolean,
    required: true
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  hasDraft: {
    type: Boolean,
    default: false
  },
  hasNeedRevision: {
    type: Boolean,
    default: false
  },
  needRevisionRequest: {
    type: Object,
    default: null
  },
  variant: {
    type: String,
    default: 'pending',
    validator: (value) => ['locked', 'pending', 'draft', 'need-revision', 'eligible'].includes(value)
  },
  historyLink: {
    type: String,
    default: '/update-data/history'
  }
});

// Auto-detect variant based on props if not explicitly set
const computedVariant = computed(() => {
  // If variant is explicitly set, use it
  if (props.variant && props.variant !== 'pending') {
    return props.variant;
  }
  
  // Auto-detect based on props
  if (props.isLocked) return 'locked';
  if (props.hasNeedRevision) return 'need-revision';
  if (props.hasDraft) return 'draft';
  
  // If not eligible but not locked or draft, it's pending
  if (!props.isEligible) return 'pending';
  
  return 'eligible';
});

// Computed history link that can be customized for need revision
const computedHistoryLink = computed(() => {
  if (computedVariant.value === 'need-revision' && props.needRevisionRequest?.id) {
    return `/update-data/edit/${props.needRevisionRequest.id}`;
  }
  if (computedVariant.value === 'draft' && props.needRevisionRequest?.id) {
    return `/update-data/edit/${props.needRevisionRequest.id}`;
  }
  if (computedVariant.value === 'pending' && props.needRevisionRequest?.id) {
    return `/update-data/view/${props.needRevisionRequest.id}`;
  }
  return props.historyLink;
});
</script>
