<template>
  <UiModal
    :is-open="isOpen"
    @close="handleCancel"
    title="Add Family Member"
    size="lg"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Name -->
      <FormField
        label="Full Name"
        type="text"
        v-model="formData.name"
        placeholder="Enter full name"
        required
      />

      <!-- Relationship -->
      <FormField
        label="Relationship"
        type="select"
        v-model="formData.relation"
        :master-data-category="'FAMILY_RELATION'"
        placeholder="Select relationship"
        required
      />

      <!-- Gender -->
      <FormField
        label="Gender"
        type="select"
        v-model="formData.gender"
        :master-data-category="'GENDER'"
        placeholder="Select gender"
        required
      />

      <!-- Birth Date -->
      <FormField
        label="Birth Date"
        type="date"
        v-model="formData.birth_date"
        required
      />

      <!-- Birth Place -->
      <FormField
        label="Birth Place"
        type="text"
        v-model="formData.birth_place"
        placeholder="Enter birth place"
        required
      />

      <!-- Address -->
      <FormField
        label="Address"
        type="textarea"
        v-model="formData.address"
        placeholder="Enter address"
        :rows="3"
        required
      />

      <!-- Occupation -->
      <FormField
        label="Occupation"
        type="text"
        v-model="formData.occupation"
        placeholder="Enter occupation"
      />

      <!-- Marital Status -->
      <FormField
        label="Marital Status"
        type="select"
        v-model="formData.marital_status"
        :master-data-category="'MARITAL_STATUS'"
        placeholder="Select marital status"
      />

      <!-- Member Sequence -->
      <FormField
        label="Member Sequence"
        type="number"
        v-model="formData.member_sequence"
        placeholder="Enter member sequence"
      />

      <!-- No Telkomedika -->
      <FormField
        label="No Telkomedika"
        type="text"
        v-model="formData.no_telkomedika"
        placeholder="Enter Telkomedika number"
      />

      <!-- Member Status -->
      <FormField
        label="Telkomedika Member Status"
        type="select"
        v-model="formData.member_status"
        :options="[
          { label: 'Active', value: 1 },
          { label: 'Inactive', value: 0 }
        ]"
        placeholder="Select member status"
      />

      <!-- KK Document -->
      <FormField
        label="KK Document"
        type="file"
        v-model="formData.kk_doc"
        accept=".pdf,.jpg,.jpeg,.png"
        file-hint="Upload family card document"
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
          Add Member
        </UiButton>
      </div>
    </form>
    
    <!-- Unsaved Changes Modal -->
    <UiConfirmationModal
      :is-open="showUnsavedModal"
      title="You have unsaved family member data"
      message="You have filled in some information for this family member. What would you like to do with your changes?"
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
  name: '',
  relation: '',
  gender: '',
  birth_date: '',
  birth_place: '',
  address: '',
  occupation: '',
  marital_status: '',
  member_sequence: '',
  no_telkomedika: '',
  member_status: '',
  kk_doc: ''
});

// Initial form state for comparison
const initialFormData = {
  name: '',
  relation: '',
  gender: '',
  birth_date: '',
  birth_place: '',
  address: '',
  occupation: '',
  marital_status: '',
  member_sequence: '',
  no_telkomedika: '',
  member_status: '',
  kk_doc: ''
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
    name: '',
    relation: '',
    gender: '',
    birth_date: '',
    birth_place: '',
    address: '',
    occupation: '',
    marital_status: '',
    member_sequence: '',
    no_telkomedika: '',
    member_status: '',
    kk_doc: ''
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
    if (!formData.value.name || !formData.value.relation || 
        !formData.value.gender || !formData.value.birth_date || 
        !formData.value.birth_place || !formData.value.address) {
      throw new Error('Please fill in all required fields');
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

