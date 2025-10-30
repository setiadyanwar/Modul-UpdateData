<template>
  <div>
    <!-- Import existing SocialSecurityForm for now, will be refactored later if needed -->
    <SocialSecurityForm
      :model-value="modelValue"
      :edit-mode="editMode"
      :disabled="disabled"
      :form-config="formConfig"
      :is-loading="isLoading"
      :is-tab-eligible="isTabEligible"
      :original-data="originalData"
      :is-edit-draft-page="isEditDraftPage"
      :is-field-visible="isFieldVisible"
      @update:model-value="$emit('update:modelValue', $event)"
      @insertRequest="$emit('insertRequest', $event)"
      @openChangeRequestModal="$emit('openChangeRequestModal', $event)"
      @editRequest="$emit('editRequest', $event)"
      @refresh-request-detail="$emit('refresh-request-detail', $event)"
      @pending-upload="$emit('pending-upload', $event)"
    />
  </div>
</template>

<script setup>
import SocialSecurityForm from '~/components/form/SocialSecurityForm.vue';

// Props - keeping the same interface as used in EditPageContent
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  editMode: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  formConfig: {
    type: Object,
    default: () => ({})
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  isTabEligible: {
    type: Boolean,
    default: true
  },
  originalData: {
    type: Object,
    default: () => ({})
  },
  isEditDraftPage: {
    type: Boolean,
    default: false
  },
  isFieldVisible: {
    type: Function,
    default: () => true
  }
});

// Events - keeping the same events as used in EditPageContent
const emit = defineEmits([
  'update:modelValue',
  'insertRequest',
  'openChangeRequestModal',
  'editRequest',
  'refresh-request-detail',
  'pending-upload'
]);
</script>