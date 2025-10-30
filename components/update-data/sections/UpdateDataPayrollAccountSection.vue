<template>
  <div>
    <div v-if="isLoading">
      <PayrollAccountSkeleton />
    </div>
    <div v-else>
      <div class="w-full">
        <div class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6">
          <div class="flex items-center mb-6">
            <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-md flex items-center justify-center mr-3">
              <i class="pi pi-credit-card text-purple-600 dark:text-purple-400 text-lg"></i>
            </div>
            <h4 class="text-xl font-bold text-text-main">Payroll Account Details</h4>
          </div>
          
          <!-- Show message when no fields are visible in Need Revision status -->
          <div v-if="!hasVisibleFields && formConfig" class="text-center py-8 text-gray-500">
            <i class="pi pi-info-circle text-2xl mb-2"></i>
            <p>No fields require revision for this section.</p>
          </div>
          
          <!-- Form Fields -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              v-if="isFieldVisible('number_rekening')"
              label="Bank Account Number" 
              type="text" 
              :model-value="getFieldValue('number_rekening')" 
              @update:model-value="val => updateField('number_rekening', val)" 
              :disabled="!isFieldEditable('number_rekening')" 
            />
            
            <FormField 
              v-if="isFieldVisible('bank_id')"
              label="Bank Name" 
              type="select" 
              :model-value="getFieldValue('bank_id')" 
              @update:model-value="val => updateField('bank_id', val)" 
              :disabled="!isFieldEditable('bank_id')" 
              placeholder="Select bank" 
              master-data-category="BANK"
            />
            
            <FormField 
              v-if="isFieldVisible('holder_name')"
              label="Account Holder Name" 
              type="text" 
              :model-value="getFieldValue('holder_name')" 
              @update:model-value="val => updateField('holder_name', val)" 
              :disabled="!isFieldEditable('holder_name')"
            />
            
            <FormField 
              v-if="isFieldVisible('tax_status_id')"
              label="Tax Status" 
              type="select" 
              :model-value="getFieldValue('tax_status_id')" 
              @update:model-value="val => updateField('tax_status_id', val)" 
              :disabled="!isFieldEditable('tax_status_id')" 
              placeholder="Select tax status" 
              master-data-category="TAX_STATUS"
            />
            
            <FormField 
              v-if="isFieldVisible('npwp')"
              label="NPWP Number" 
              type="text" 
              :model-value="getFieldValue('npwp')" 
              @update:model-value="val => updateField('npwp', val)" 
              :disabled="!isFieldEditable('npwp')" 
              class="md:col-span-2"
            />
            
            <FormField 
              v-if="isFieldVisible('npwp_doc')"
              label="NPWP Document" 
              type="file" 
              :model-value="getFieldValue('npwp_doc')" 
              @update:model-value="val => updateField('npwp_doc', val)" 
              :disabled="!isFieldEditable('npwp_doc')" 
              accept=".pdf,.jpg,.jpeg,.png"
              file-hint="Upload NPWP document (PDF, JPG, PNG)"
              :use-update-data-preview="true"
            />
            
            <FormField 
              v-if="isFieldVisible('saving_book_doc')"
              label="Saving Book Document" 
              type="file" 
              :model-value="getFieldValue('saving_book_doc')" 
              @update:model-value="val => updateField('saving_book_doc', val)" 
              :disabled="!isFieldEditable('saving_book_doc')" 
              accept=".pdf,.jpg,.jpeg,.png"
              file-hint="Upload saving book document (PDF, JPG, PNG)"
              :use-update-data-preview="true"
            />
            
          </div>
        </div>

        <!-- Document Upload Section -->
        <div id="payroll-account-upload">
          <MultiDocumentUpload
            v-if="showMultiUpload && editMode"
            :edit-mode="editMode"
            :allow-multiple="true"
            :max-size="25 * 1024 * 1024"
            accept=".jpg,.jpeg,.png,.pdf"
            :max-files="2"
            :show-type-selector="true"
            :document-type-options="docTypeOptions"
            title="Document Upload"
            :description="`Upload your <span class='text-primary-500 font-bold'>NPWP Document</span> and <span class='text-primary-500 font-bold'>Saving Book Document</span> (required)`"
            :required-document-count="2"
            @filesChanged="handleFilesChanged"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import PayrollAccountSkeleton from '~/components/form/PayrollAccountSkeleton.vue';
import FormField from '~/components/form/FormField.vue';
import MultiDocumentUpload from '~/components/common/MultiDocumentUpload.vue';
import { useDocumentTypes } from '~/composables/useDocumentTypes';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
      bank_id: '',
      number_rekening: '',
      holder_name: '',
      tax_status_id: '',
      npwp: '',
      npwp_doc: '',
      saving_book_doc: ''
    })
  },
  editMode: { type: Boolean, required: true },
  isLoading: { type: Boolean, required: true },
  formConfig: { type: Object, default: null },
  disableEditRevision: { type: Boolean, default: false },
  originalData: { type: Object, default: null },
  showMultiUpload: { type: Boolean, default: true },
});

const emit = defineEmits(['update:modelValue', 'files-changed']);

// Document types (reuse same pattern as basic info)
const { documentTypes, fetchDocumentTypes } = useDocumentTypes();
const docTypeOptions = computed(() =>
  (documentTypes.value || [])
    .filter(dt => ['4', '7'].includes(dt.code)) // Only NPWP and Saving Book
    .map(dt => ({ value: dt.code, label: dt.value }))
);

fetchDocumentTypes();

// Watch for modelValue changes
watch(
  () => props.modelValue,
  (newValue) => {
    // Handle modelValue updates
  },
  { deep: true, immediate: true }
);

// Watch for originalData changes
watch(
  () => props.originalData,
  (newValue) => {
    // Handle originalData updates
  },
  { deep: true, immediate: true }
);

function updateField(key, value) {
  // Update local data first
  localData.value = { ...localData.value, [key]: value };

  // For need revision mode, emit the updated localData
  if (props.formConfig?.isNeedRevision) {
    emit('update:modelValue', { ...localData.value });
  } else {
    // For other modes, use the original logic
    emit('update:modelValue', { ...props.modelValue, [key]: value });
  }
}

// Helper functions for displaying original data
const getBankName = (bankId) => {
  if (!bankId) return 'N/A';
  // Try to get from master data or return a more user-friendly format
  return `Bank (ID: ${bankId})`;
};

const getTaxStatusName = (taxStatusId) => {
  if (!taxStatusId) return 'N/A';
  // Try to get from master data or return a more user-friendly format
  return `Tax Status (ID: ${taxStatusId})`;
};

// Computed properties for formConfig support
const isFieldVisible = (fieldName) => {
  if (!props.formConfig) {
    return true;
  }

  // For need revision status, show ALL fields (like draft mode)
  if (props.formConfig.isNeedRevision) {
    return true; // Always show all fields for need revision
  }

  // If visibleFields is null, show all fields (for draft status)
  if (props.formConfig.visibleFields === null) {
    return true;
  }

  // If showOnlyChangedFields is true (Need Revision status), only show editable fields
  if (props.formConfig.showOnlyChangedFields) {
    const editableFields = props.formConfig.editableFields || [];
    return editableFields.includes(fieldName);
  }

  // If visibleFields is null, show all fields
  if (props.formConfig.visibleFields === null) return true;

  // Check if field is in the visible fields list
  const visibleFields = props.formConfig.visibleFields || [];
  const isVisible = visibleFields.includes(fieldName);
  return isVisible;
};

const hasVisibleFields = computed(() => {
  if (!props.formConfig) return true;
  
  const allFields = ['number_rekening', 'bank_id', 'holder_name', 'tax_status_id', 'npwp', 'npwp_doc', 'saving_book_doc'];
  const hasVisible = allFields.some(field => isFieldVisible(field));
  return hasVisible;
});

const isFieldEditable = (fieldName) => {
  // Tax status is always read-only (view only)
  if (fieldName === 'tax_status_id') {
    return false;
  }

  if (!props.formConfig) return props.editMode;

  // For need revision status, check if field is in editableFields (new_data fields)
  if (props.formConfig.isNeedRevision) {
    const editableFields = props.formConfig.editableFields;

    if (!editableFields) {
      return false;
    }

    // Handle both Set and Array
    let isEditable = false;
    try {
      if (editableFields instanceof Set) {
        isEditable = editableFields.has(fieldName);
      } else if (Array.isArray(editableFields)) {
        isEditable = editableFields.includes(fieldName);
      } else {
        isEditable = false;
      }
    } catch (error) {
      isEditable = false;
    }

    return isEditable;
  }

  // For draft mode, all fields are editable
  return props.editMode;
};

// Local reactive data to track user changes
const localData = ref({ ...props.modelValue });

// Watch for props.modelValue changes to update localData
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && typeof newValue === 'object') {
      // For need revision mode, only update non-editable fields
      if (props.formConfig?.isNeedRevision) {
        const editableFields = props.formConfig.editableFields;
        if (editableFields && typeof editableFields.has === 'function') {
          // Only update non-editable fields
          Object.keys(newValue).forEach(key => {
            if (!editableFields.has(key)) {
              localData.value[key] = newValue[key];
            }
          });
        } else {
          // If no editableFields, update all fields
          localData.value = { ...newValue };
        }
      } else {
        // For non-need revision mode, update all fields
        localData.value = { ...newValue };
      }
    }
  },
  { deep: true, immediate: true }
);

// Get field value - show original data for disabled fields, new data for editable fields
const getFieldValue = (fieldName) => {
  // For need revision status
  if (props.formConfig?.isNeedRevision) {
    // For editable fields, use localData (user changes) or fallback to modelValue
    // For non-editable fields, show original data
    if (isFieldEditable(fieldName)) {
      // Editable field - use localData if available, otherwise use modelValue
      const localValue = localData.value[fieldName];
      const modelValue = props.modelValue[fieldName];
      const finalValue = localValue !== undefined ? localValue : modelValue;
      return finalValue || '';
    } else {
      // Non-editable field - show original data from originalData prop
      const originalValue = props.originalData?.[fieldName] || '';
      return originalValue;
    }
  }

  // For non-revision mode, show local data or new data
  const localValue = localData.value[fieldName];
  const nonRevisionValue = props.modelValue[fieldName] || '';
  const finalValue = localValue !== undefined ? localValue : nonRevisionValue;
  return finalValue;
};


// Handle file uploads from MultiDocumentUpload component
const handleFilesChanged = (files) => {
  emit('files-changed', files);
};

// Scroll to upload section
const scrollToUpload = () => {
  if (process.client) {
    setTimeout(() => {
      const uploadSection = document.getElementById('payroll-account-upload');
      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
};

// Expose method for parent component
defineExpose({
  scrollToUpload
});
</script>
