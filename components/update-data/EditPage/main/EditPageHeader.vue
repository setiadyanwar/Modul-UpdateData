<template>
  <div>
    <!-- Breadcrumb -->
    <UiBreadcrumb v-if="!isLoadingDetail && !isInitializing" :items="breadcrumbItems" class="mb-4" />

    <!-- Status Request Header -->
    <StatusHeader 
      :request-id="displayRequestCode" 
      :reviewer-name="reviewerName"
      :approver-name="requestDetail?.request_approver?.name_approver || requestDetail?.request_approver?.name || ''"
      :approver-email="requestDetail?.request_approver?.email_approver || ''" 
      :steps="statusSteps" 
      class="mb-6" 
    />

    <!-- Header dengan button sejajar title -->
    <div class="mb-4">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <h2 class="text-xl md:text-2xl lg:text-3xl font-bold text-text-main">
            Update Personal Data
          </h2>
          <StatusBadge 
            :status="requestDetail?.status || 'draft'"
            :status-label="requestDetail?.status_label || 'Draft'" 
          />
        </div>

        <!-- Reusable action buttons for desktop -->
        <div class="hidden lg:flex flex-col items-end gap-3">
          <PageActions
            :isSubmitting="isSubmitting"
            :showChangeLogs="true"
            :status="requestDetail?.status"
            :showSaveAsDraft="requestDetail?.status === '1' || requestDetail?.status === 'draft'"
            :hasValidData="hasValidFormData"
            :hasDataChanges="hasDataChanges"
            :hasExistingAttachments="hasExistingAttachments"
            :hasUploadedFiles="hasUploadedFiles"
            :activeTab="activeTab"
            saveButtonText="Save Changes"
            @open-change-history="$emit('open-change-history')" 
            @submit="$emit('submit-direct')"
            @save-as-draft="$emit('save-as-draft')"
            @scroll-to-upload="$emit('scroll-to-upload')"
          />
        </div>
      </div>
      <!-- Simple Category Label (tab navigation active style) -->
      <div class="my-4 md:mb-6">
        <div class="inline-flex">
            <div class="px-4 py-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium text-sm rounded-md">
              <div class="flex items-center gap-2">
                <i :class="`pi ${categoryIcon} text-sm`"></i>
                <span>{{ categoryLabel || 'Update Data' }}</span>
              </div>
            </div>
          </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Import components
import UiBreadcrumb from "~/components/ui/Breadcrumb.vue";
import StatusHeader from "~/components/update-data/status/StatusHeader.vue";
import StatusBadge from "~/components/update-data/status/StatusBadge.vue";
import PageActions from "~/components/common/PageActions.vue";

import { computed } from 'vue'

// Define props
const props = defineProps({
  isLoadingDetail: {
    type: Boolean,
    default: false
  },
  isInitializing: {
    type: Boolean,
    default: false
  },
  breadcrumbItems: {
    type: Array,
    default: () => []
  },
  displayRequestCode: {
    type: String,
    default: ''
  },
  reviewerName: {
    type: String,
    default: ''
  },
  requestDetail: {
    type: Object,
    default: null
  },
  statusSteps: {
    type: Array,
    default: () => []
  },
  isSubmitting: {
    type: Boolean,
    default: false
  },
  hasValidFormData: {
    type: Boolean,
    default: false
  },
  categoryLabel: {
    type: String,
    default: 'Update Data'
  },
  // New props for need revision validation
  hasDataChanges: {
    type: Boolean,
    default: true
  },
  hasExistingAttachments: {
    type: Boolean,
    default: true
  },
  hasUploadedFiles: {
    type: Boolean,
    default: false
  },
  activeTab: {
    type: String,
    default: ''
  }
});

// Get icon based on category
const categoryIcon = computed(() => {
  const label = props.categoryLabel?.toLowerCase() || ''

  if (label.includes('family')) return 'pi-users'
  if (label.includes('basic') || label.includes('information')) return 'pi-user'
  if (label.includes('address')) return 'pi-map-marker'
  if (label.includes('emergency')) return 'pi-phone'
  if (label.includes('payroll')) return 'pi-credit-card'
  if (label.includes('education')) return 'pi-graduation-cap'

  return 'pi-file-edit'
})

// Define emits
defineEmits([
  'open-change-history',
  'submit-direct',
  'save-as-draft',
  'scroll-to-upload'
]);
</script>