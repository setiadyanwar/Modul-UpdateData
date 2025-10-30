<template>
  <div>
    <!-- Change History Modal -->
    <ChangeHistoryModal 
      :isOpen="isChangeHistoryOpen" 
      :request-data="requestDetail" 
      @close="$emit('close-change-history')" 
    />

    <!-- Submit Revision Confirmation Modal -->
    <ConfirmationModal 
      :is-visible="isSubmitRevisionModalOpen" 
      variant="submit-revision" 
      title="Submit Revision"
      message="Are you sure you want to submit this revision? Your changes will be sent for review by the HC team."
      @close="$emit('close-submit-revision-modal')" 
      @submit-revision="$emit('confirm-submit-revision')" 
      @view-privacy="$emit('view-privacy')" 
    />

    <!-- Change Request Modal for Draft Status -->
    <ChangeRequestModal
      :is-open="isChangeRequestModalOpen"
      :current-tab="activeTab"
      :request-type="getRequestTypeFromTab(activeTab)"
      :action="requestDetail?.new_data?.action || 'update'"
      :data="getChangeRequestModalData()"
      :changes="modalDataForSubmit.changes || calculateChanges()"
      :existing-request-id="requestDetail?.id_change_req"
      :note="requestDetail?.note_employee || ''"
      :professional-photo-file="getProfessionalPhotoFile()"
      :disable-submit="true"
      @close="$emit('close-change-request-modal')"
      @submit-data="$emit('change-request', $event)"
    />

    <!-- Change Request Modal for Insert Request -->
    <ChangeRequestModal
      :is-open="isInsertRequestModalOpen"
      :current-tab="activeTab"
      :request-type="getRequestTypeFromTab(activeTab)"
      :action="'insert'"
      :data="pendingInsertData || {}"
      :changes="{}"
      @close="$emit('close-insert-request-modal')"
      @success="$emit('insert-request-success', $event)"
    />

    <!-- Document Preview Modal -->
    <DocumentPreviewModal 
      :isOpen="isDocumentPreviewOpen" 
      :documentUrl="previewDocumentUrl"
      :documentName="previewDocumentName" 
      :itemId="previewItemId" 
      @close="$emit('close-document-preview')" 
    />
  </div>
</template>

<script setup>
// Import components
import ChangeHistoryModal from "~/components/update-data/modals/ChangeHistoryModal.vue";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";
import ChangeRequestModal from "~/components/ui/ChangeRequestModal.vue";
import DocumentPreviewModal from "~/components/update-data/modals/DocumentPreviewModal.vue";

// Define props
defineProps({
  isChangeHistoryOpen: {
    type: Boolean,
    default: false
  },
  requestDetail: {
    type: Object,
    default: null
  },
  isSubmitRevisionModalOpen: {
    type: Boolean,
    default: false
  },
  isChangeRequestModalOpen: {
    type: Boolean,
    default: false
  },
  activeTab: {
    type: String,
    default: ''
  },
  getRequestTypeFromTab: {
    type: Function,
    required: true
  },
  modalDataForSubmit: {
    type: Object,
    default: () => ({ data: null, changes: null })
  },
  calculateChanges: {
    type: Function,
    required: true
  },
  getProfessionalPhotoFile: {
    type: Function,
    required: true
  },
  getChangeRequestModalData: {
    type: Function,
    required: true
  },
  isInsertRequestModalOpen: {
    type: Boolean,
    default: false
  },
  pendingInsertData: {
    type: Object,
    default: null
  },
  isDocumentPreviewOpen: {
    type: Boolean,
    default: false
  },
  previewDocumentUrl: {
    type: String,
    default: ''
  },
  previewDocumentName: {
    type: String,
    default: ''
  },
  previewItemId: {
    type: String,
    default: ''
  }
});

// Define emits
defineEmits([
  'close-change-history',
  'close-submit-revision-modal',
  'confirm-submit-revision',
  'view-privacy',
  'close-change-request-modal',
  'change-request',
  'close-insert-request-modal',
  'insert-request-success',
  'close-document-preview'
]);
</script>