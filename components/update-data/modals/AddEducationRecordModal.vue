<template>
  <UiModal
    :is-open="isOpen"
    @close="handleCancel"
    title="Add Education Record"
    size="lg"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Education Level -->
      <FormField
        label="Education Level"
        type="select"
        v-model="formData.edu_level"
        :master-data-category="'EDUCATION_LEVEL'"
        placeholder="Select education level"
        required
      />

      <!-- Major/Field of Study -->
      <FormField
        label="Major/Field of Study"
        type="text"
        v-model="formData.edu_major"
        placeholder="Enter major or field of study"
        required
      />

      <!-- Institution -->
      <FormField
        label="Institution"
        type="text"
        v-model="formData.edu_institution"
        placeholder="Enter institution name"
        required
      />

      <!-- Start Date -->
      <FormField
        label="Start Date"
        type="date"
        v-model="formData.edu_start_date"
        placeholder="Select start date"
        :min-date="new Date(1900, 0, 1)"
        :max-date="new Date(new Date().getFullYear() + 10, 11, 31)"
        required
      />

      <!-- End Date -->
      <FormField
        label="End Date"
        type="date"
        v-model="formData.edu_end_date"
        placeholder="Select end date"
        :min-date="new Date(1900, 0, 1)"
        :max-date="new Date(new Date().getFullYear() + 10, 11, 31)"
        required
      />

      <!-- Ijazah Document -->
      <FormField
        label="Ijazah Document"
        type="file"
        v-model="formData.ijazah_doc"
        accept=".pdf,.jpg,.jpeg,.png"
        file-hint="Upload ijazah or certificate document"
      />

      <!-- Action Buttons -->
      <div class="flex justify-end gap-3 pt-4 border-t border-grey-200 dark:border-grey-700">
        <UiButton
          type="button"
          variant="secondary"
          @click="handleCancel"
        >
          Cancel
        </UiButton>
        <UiButton
          type="submit"
          :loading="loading"
        >
          Add Record
        </UiButton>
      </div>
    </form>
    
    <!-- Unsaved Changes Modal -->
    <UiConfirmationModal
      :is-open="showUnsavedModal"
      title="You have unsaved education record data"
      message="You have filled in some information for this education record. What would you like to do with your changes?"
      save-button-text="Save as Draft"
      continue-button-text="Discard Changes"
      @close="showUnsavedModal = false"
      @save-draft="handleSaveDraft"
      @continue="handleDiscardChanges"
    />
  </UiModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import UiConfirmationModal from '~/components/ui/ConfirmationModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'save', 'save-draft']);

const loading = ref(false);
const showUnsavedModal = ref(false);

// Form data
const formData = ref({
  edu_level: '',
  edu_major: '',
  edu_institution: '',
  edu_start_date: '',
  edu_end_date: '',
  ijazah_doc: ''
});

// Initial form state for comparison
const initialFormData = {
  edu_level: '',
  edu_major: '',
  edu_institution: '',
  edu_start_date: '',
  edu_end_date: '',
  ijazah_doc: ''
};

// Check if form has changes
const hasUnsavedChanges = computed(() => {
  return Object.keys(formData.value).some(key => {
    const currentValue = formData.value[key];
    const initialValue = initialFormData[key];
    
    // Consider non-empty strings as changes
    if (typeof currentValue === 'string') {
      return currentValue.trim() !== initialValue;
    }
    
    return currentValue !== initialValue;
  });
});

// Reset form when modal opens
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    resetForm();
  }
});

const resetForm = () => {
  formData.value = {
    edu_level: '',
    edu_major: '',
    edu_institution: '',
    edu_start_date: '',
    edu_end_date: '',
    ijazah_doc: ''
  };
};

// Handle cancel button
const handleCancel = () => {
  if (hasUnsavedChanges.value) {
    showUnsavedModal.value = true;
  } else {
    emit('close');
  }
};

// Handle save as draft
const handleSaveDraft = () => {
  showUnsavedModal.value = false;
  
  // Emit save-draft event with current form data
  emit('save-draft', { ...formData.value });
  
  // Close modal and reset form
  emit('close');
  resetForm();
};

// Handle discard changes
const handleDiscardChanges = () => {
  showUnsavedModal.value = false;
  
  // Reset form and close modal
  resetForm();
  emit('close');
};

const handleSubmit = async () => {
  loading.value = true;
  
  try {
    // Validate form
    if (!formData.value.edu_level || !formData.value.edu_major || 
        !formData.value.edu_institution || !formData.value.edu_start_date || 
        !formData.value.edu_end_date) {
      throw new Error('Please fill in all required fields');
    }

    // Validate dates
    const startDate = new Date(formData.value.edu_start_date);
    const endDate = new Date(formData.value.edu_end_date);
    
    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    // Emit save event
    emit('save', { ...formData.value });
    
    // Close modal
    emit('close');
    
    // Reset form
    resetForm();
    
  } catch (error) {
    // You can add toast notification here
  } finally {
    loading.value = false;
  }
};
</script>

