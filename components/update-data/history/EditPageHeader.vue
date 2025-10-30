<template>
  <div class="mb-4">
    <StatusHeader
      :request-id="requestId"
      :reviewer-name="reviewerName"
      :reviewer-avatar="reviewerAvatar"
      :last-updated="lastUpdated"
      :steps="statusSteps"
      class="mb-6"
    />

    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <h2 class="text-xl md:text-2xl lg:text-3xl font-bold text-text-main">Update Personal Data</h2>
        <StatusBadge :status="status" :status-label="statusLabel" />
      </div>

      <div class="hidden lg:flex flex-col items-end gap-3">
        <PageActions
          :isSubmitting="isSubmitting"
          :showChangeLogs="true"
          :status="status"
          :showSaveAsDraft="showSaveAsDraft"
          :hasValidData="hasValidData"
          saveButtonText="Save Changes"
          @open-change-history="$emit('open-change-history')"
          @submit="$emit('submit')"
          @save-as-draft="$emit('save-as-draft')"
        />
      </div>
    </div>

    <UiTabNavigation
      :tabs="tabs"
      :active-tab="activeTab"
      class="my-4 md:mb-6"
      @tab-change="$emit('tab-change', $event)"
    />
  </div>
</template>

<script setup>
import StatusHeader from '~/components/StatusHeader.vue'
import StatusBadge from '~/components/StatusBadge.vue'
import PageActions from '~/components/PageActions.vue'
import UiTabNavigation from '~/components/ui/TabNavigation.vue'

const props = defineProps({
  requestId: [String, Number],
  reviewerName: String,
  reviewerAvatar: String,
  lastUpdated: String,
  statusSteps: Array,
  status: String,
  statusLabel: String,
  isSubmitting: Boolean,
  showSaveAsDraft: Boolean,
  hasValidData: Boolean,
  tabs: Array,
  activeTab: String
})

defineEmits(['open-change-history', 'submit', 'save-as-draft', 'tab-change'])
</script>
