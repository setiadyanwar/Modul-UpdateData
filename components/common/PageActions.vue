<template>
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-3">
      <UiButton
        v-if="showChangeLogs"
        variant="outline"
        size="small"
        class="w-fit whitespace-nowrap"
        @click="$emit('open-change-history')"
      >
        <i class="pi pi-clock mr-2"></i>
        Change Logs
      </UiButton>

      <UiButton
        v-if="showSaveAsDraft"
        variant="outline"
        size="small"
        class="w-fit whitespace-nowrap"
        :disabled="isSubmitting"
        @click="handleSaveAsDraftClick"
      >
        <i v-if="!isSubmitting" class="pi pi-save mr-2"></i>
        <i v-if="isSubmitting" class="pi pi-spin pi-spinner mr-2"></i>
        {{ isSubmitting ? 'Saving...' : saveButtonText }}
      </UiButton>

      <UiButton
        variant="primary"
        size="small"
        class="w-fit whitespace-nowrap"
        :disabled="isSubmitting"
        @click="handleSubmitClick"
      >
        {{ submitLabel }}
      </UiButton>
    </div>
  </div>
</template>

<script setup>
import UiButton from "~/components/ui/Button.vue";
import { useToast } from "~/composables/useToast";
import { computed } from 'vue';

const props = defineProps({
  isSubmitting: { type: Boolean, default: false },
  showChangeLogs: { type: Boolean, default: true },
  showSaveAsDraft: { type: Boolean, default: false },
  status: { type: String, default: '' },
  hasValidData: { type: Boolean, default: true },
  hasUnsavedChanges: { type: Boolean, default: false },
  saveButtonText: { type: String, default: 'Save as Draft' },
  // New props for need revision validation
  hasDataChanges: { type: Boolean, default: true },
  hasExistingAttachments: { type: Boolean, default: true },
  hasUploadedFiles: { type: Boolean, default: false },
  activeTab: { type: String, default: '' }
});

const emit = defineEmits(['open-change-history', 'submit', 'save-as-draft', 'scroll-to-upload']);

const handleSubmitClick = () => {
  const { warning: toastWarning } = useToast();
  
  // Check if it's need revision status
  const normalizedStatus = props.status === '3' || props.status === 3 ? 'rejected' : props.status;
  const isNeedRevision = normalizedStatus === 'rejected';
  
  const isDraft = props.status === '1' || props.status === 1 || props.status === 'draft';

  if (isNeedRevision) {
    // Special validation for need revision

    // 1. Check if there are any data changes
    if (!props.hasDataChanges) {
      toastWarning('Please make at least one change to your data before submitting revisions');
      return;
    }

    // 2. Check attachments - existing OR uploaded
    const categoriesRequiringDocuments = ['basic-information', 'address', 'family', 'payroll-account', 'social-security', 'education'];
    const categoryRequiresDocuments = categoriesRequiringDocuments.includes(props.activeTab);

    if (categoryRequiresDocuments) {
      const hasRequiredAttachments = props.hasExistingAttachments || props.hasUploadedFiles;

      if (!hasRequiredAttachments) {
        if (props.activeTab === 'education') {
          toastWarning('Please ensure ijazah document(s) are uploaded for all education records before submitting revisions.');
        } else {
          toastWarning('Please upload required attachments before submitting revisions.');
        }
        emit('scroll-to-upload');
        return;
      }
    }

  } else if (isDraft) {
    // For draft status, use more lenient validation

    // For draft, basic validation is enough - don't block if form validation fails
    // The server will handle the actual validation

    if (props.hasUnsavedChanges) {
      toastWarning('Please save your changes first before submitting');
      return;
    }

    // For education draft: check if there are attachments (existing OR pending uploads)
    if (props.activeTab === 'education') {
      const hasAnyEducationAttachments = props.hasExistingAttachments || props.hasUploadedFiles;

      if (!hasAnyEducationAttachments) {
        toastWarning('Please upload ijazah document(s) before submitting.');
        emit('scroll-to-upload');
        return;
      }
    }

  } else {
    // Regular validation for other statuses
    if (!props.hasValidData) {
      toastWarning('Please fill in at least one field before submitting');
      return;
    }
    
    if (props.hasUnsavedChanges) {
      toastWarning('Please save your changes first before submitting');
      return;
    }
  }
  
  emit('submit');
};

const handleSaveAsDraftClick = () => {
  // Check validation but don't prevent save - show toast warning instead
  if (!props.hasValidData) {
    const { warning: toastWarning } = useToast();
    toastWarning('Please fill in at least one field before saving');
    return;
  }
  
  emit('save-as-draft');
};

const submitLabel = computed(() => {
  // Handle status "3" (Need Revision) as rejected for UI display
  const normalizedStatus = props.status === '3' || props.status === 3 ? 'rejected' : props.status;
  return normalizedStatus === 'rejected' ? 'Submit Revisions' : 'Submit';
});


</script>
