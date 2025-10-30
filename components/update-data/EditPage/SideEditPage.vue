<template>
  <div class="sticky top-4 space-y-6">

    <!-- Change Reason Section - Only show when status is draft or need revision -->
    <div v-if="shouldShowChangeReason">
      <ChangeReasonSection
        :reason="getNoteEmployee() || getReasonUpdate() || ''"
        :reason-when-waiting="requestDetail?.reason_when_waiting || ''"
        variant="view"
      />
    </div>


    <!-- HC Review Note - Only show when status is need revision -->
    <div v-if="shouldShowHCReviewNote">
      <HCReviewNotesSection
        :note="requestDetail?.note_hc || ''"
        :feedback="requestDetail?.feedback || ''"
        :rejection-note="requestDetail?.rejection_note || ''"
        :reviewer="requestDetail?.request_approver?.name_approver || undefined"
      />
    </div>

    <!-- Document Section - Only show for allowed categories -->
    <DocumentSection
      v-if="shouldShowDocumentSection"
      :key="documentSectionKey"
      ref="documentSectionRef"
      :request-detail="requestDetail"
      :update-category="updateCategory"
      :categories="categories"
      :can-delete="true"
      @view="$emit('document-view', $event)"
      @deleted="$emit('document-deleted', $event)"
      @document-count-changed="$emit('document-count-changed', $event)"
    />


    <!-- Fallback content for categories that don't need documents -->
    <div v-if="!shouldShowDocumentSection && !shouldShowChangeReason && !shouldShowHCReviewNote"
         class="bg-gray-50 rounded-lg p-4 text-center">
      <i class="pi pi-info-circle text-2xl text-gray-400 mb-2"></i>
      <p class="text-sm text-gray-600">
        No additional information required for this category.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Components
import ChangeReasonSection from '~/components/update-data/modals/ChangeReasonSection.vue';
import HCReviewNotesSection from '~/components/update-data/history/HCReviewNotesSection.vue';
import DocumentSection from '~/components/common/DocumentSection.vue';
import MultiDocumentUpload from '~/components/common/MultiDocumentUpload.vue';

// Props
const props = defineProps({
  requestDetail: {
    type: Object,
    required: true
  },
  updateCategory: {
    type: String,
    default: 'Basic Information'
  },
  categories: {
    type: Array,
    default: () => ['basic-information']
  },
  files: {
    type: Array,
    default: () => []
  },
  isUploading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  maxFiles: {
    type: Number,
    default: 10
  },
  acceptedTypes: {
    type: String,
    default: '.pdf,.jpg,.jpeg,.png'
  },
  documentSectionKey: {
    type: [String, Number],
    default: 0
  },
  multiDocumentUploadKey: {
    type: [String, Number],
    default: 0
  },
  existingDocumentCount: {
    type: Number,
    default: 0
  }
});

// Emits
defineEmits([
  'document-view',
  'document-deleted',
  'document-count-changed',
  'files-changed',
  'upload',
  'remove'
]);

// Helper function to normalize status (robust across fields and types)
const normalizeStatus = (requestDetail) => {
  if (!requestDetail) return { isDraft: false, isRejected: false, isNeedRevision: false, normalized: '' };

  const rawStatus = requestDetail.status;
  const rawStatusAlt = requestDetail.status_raw;
  const statusLabel = requestDetail.status_label || '';

  // Prefer string comparison but handle numbers too
  const statusStr = rawStatus != null ? String(rawStatus) : '';
  const statusAltStr = rawStatusAlt != null ? String(rawStatusAlt) : '';

  const normalized = statusStr || statusAltStr || '';

  const isDraft =
    normalized === '1' ||
    statusStr === 'draft' || statusStr === 'Draft' ||
    statusAltStr === '1' || rawStatusAlt === 1 ||
    (typeof statusLabel === 'string' && statusLabel.toLowerCase() === 'draft');

  const isRejected =
    normalized === '3' ||
    statusStr === 'rejected' || statusStr === 'Rejected' ||
    statusAltStr === '3' || rawStatusAlt === 3 ||
    (typeof statusLabel === 'string' && statusLabel.toLowerCase() === 'rejected');

  const isNeedRevision =
    isRejected ||
    (typeof statusLabel === 'string' && statusLabel.toLowerCase().includes('revision'));

  return { isDraft, isRejected, isNeedRevision, normalized };
};

// Computed properties
const shouldShowChangeReason = computed(() => {
  try {
    if (!props.requestDetail) return false;

    const statusInfo = normalizeStatus(props.requestDetail);
    const isDraftOrNeedRevision = statusInfo.isDraft || statusInfo.isNeedRevision;

    // Relaxed: always show in draft or need revision, even if reason empty
    // Still log available reasons for debugging/analytics
    const noteEmployee = props.requestDetail?.note_employee ||
                         props.requestDetail?.data?.note_employee ||
                         props.requestDetail?.employee_note ||
                         props.requestDetail?.reason ||
                         props.requestDetail?.employee_reason;
    const reasonUpdate = props.requestDetail?.reason_update ||
                         props.requestDetail?.data?.reason_update;

    return isDraftOrNeedRevision;
  } catch (error) {
    console.error('Error in shouldShowChangeReason:', error);
    return false;
  }
});

const shouldShowHCReviewNote = computed(() => {
  try {
    const statusInfo = normalizeStatus(props.requestDetail);

    // Show HC Review Note when status is need revision (only when HC has provided feedback)
    return statusInfo.isNeedRevision && (props.requestDetail?.note_hc || props.requestDetail?.feedback);
  } catch (error) {
    console.error('Error in shouldShowHCReviewNote:', error);
    return false;
  }
});

// Check if document section should be shown based on category
const shouldShowDocumentSection = computed(() => {
  const allowedCategories = [
    'basic-information',
    'address',
    'payroll-account',
    'education',
    'family',
    'social-security',
    // Also support label versions
    'Basic Information',
    'Address',
    'Payroll Account',
    'Education',
    'Family',
    'Social Security',
    'Benefit'
  ];
  const category = props.updateCategory;

  return allowedCategories.includes(category);
});

// Helper functions to get note_employee and reason_update from multiple possible paths
const getNoteEmployee = () => {
  return props.requestDetail?.note_employee ||
         props.requestDetail?.data?.note_employee ||
         props.requestDetail?.employee_note ||
         props.requestDetail?.reason ||
         props.requestDetail?.employee_reason ||
         '';
};

const getReasonUpdate = () => {
  return props.requestDetail?.reason_update ||
         props.requestDetail?.data?.reason_update ||
         '';
};

// Expose refs for parent component
defineExpose({
  documentSectionRef: null
});
</script>