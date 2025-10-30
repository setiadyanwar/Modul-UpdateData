<template>
  <div class="flex flex-col items-end gap-4 w-full lg:col-span-1">
    <div class="w-full lg:sticky lg:top-6 space-y-4 md:space-y-6">
      <ChangeReasonSection
        v-if="showReason"
        :reason="reason"
        :reason-when-waiting="reasonWhenWaiting"
        :variant="'view'"
        class="hidden lg:block"
      />

      <HCReviewNotesSection
        v-if="showReviewNotes"
        :status="statusLabelOrCode"
        :review-notes="reviewNotes"
        :reviewer="requestDetail?.request_approver?.name_approver || undefined"
      />

      <DocumentSection
        :request-detail="requestDetail"
        :request-data="requestData"
        @view="$emit('view', $event)"
        @delete="$emit('delete', $event)"
        @edit="$emit('edit', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import ChangeReasonSection from '~/components/update-data/modals/ChangeReasonSection.vue'
import HCReviewNotesSection from '~/components/update-data/history/HCReviewNotesSection.vue'
import DocumentSection from '~/components/DocumentSection.vue'

const props = defineProps({
  showReason: Boolean,
  reason: String,
  reasonWhenWaiting: String,
  showReviewNotes: Boolean,
  statusLabelOrCode: String,
  reviewNotes: Array,
  requestDetail: Object,
  requestData: Object
})

// Debug logging

defineEmits(['view', 'delete', 'edit'])
</script>
