<template>
  <div>
    <div v-if="isLoading">
      <SocialSecuritySkeleton />
    </div>
    <div v-else>
      <div class="w-full">
        <div class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6">
          <div class="flex items-center mb-6">
            <div class="w-10 h-10 bg-teal-100 dark:bg-teal-900 rounded-md flex items-center justify-center mr-3">
              <i class="pi pi-shield text-teal-600 dark:text-teal-400 text-lg"></i>
            </div>
            <h4 class="text-xl font-bold text-text-main">Benefit</h4>
          </div>
          <!-- Show message when no fields are visible in Need Revision status -->
          <div v-if="!hasVisibleFields && formConfig" class="text-center py-8 text-gray-500">
            <i class="pi pi-info-circle text-2xl mb-2"></i>
            <p>No fields require revision for this section.</p>
          </div>

          <!-- Form Fields -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Telkomedika Card Number -->
            <div v-if="isFieldVisible('no_telkomedika')">
              <FormField
                label="Telkomedika Card Number"
                type="text"
                :model-value="getFieldValue('no_telkomedika')"
                @update:model-value="val => updateField('no_telkomedika', val)"
                @blur="() => validateTelkomedika(String(getFieldValue('no_telkomedika') || ''))"
                @keypress="onlyNumbersKeypress"
                @input="(event) => onlyNumbersInput(event, 'no_telkomedika', 15)"
                :disabled="!isFieldEditable('no_telkomedika')"
                inputmode="numeric"
                pattern="[0-9]*"
                :maxlength="15"
                placeholder="Enter 10-15 digit number"
              />
              <p v-if="errors.no_telkomedika" class="mt-1 text-xs text-red-600">{{ errors.no_telkomedika }}</p>
            </div>

            <!-- BPJS TK Number -->
            <div v-if="isFieldVisible('no_bpjs_tk')">
              <FormField
                label="BPJS TK Number"
                type="text"
                :model-value="getFieldValue('no_bpjs_tk')"
                @update:model-value="val => updateField('no_bpjs_tk', val)"
                @blur="() => validateBpjsTk(String(getFieldValue('no_bpjs_tk') || ''))"
                @keypress="onlyNumbersKeypress"
                @input="(event) => onlyNumbersInput(event, 'no_bpjs_tk', 11)"
                :disabled="!isFieldEditable('no_bpjs_tk')"
                inputmode="numeric"
                pattern="[0-9]*"
                :maxlength="11"
                placeholder="Enter 11 digit number"
              />
              <p v-if="errors.no_bpjs_tk" class="mt-1 text-xs text-red-600">{{ errors.no_bpjs_tk }}</p>
            </div>

            <!-- BPJS TK Effective Date -->
            <div v-if="isFieldVisible('bpjs_tk_effective_date')">
              <FormField
                label="BPJS TK Effective Date"
                type="date"
                :model-value="getFieldValue('bpjs_tk_effective_date')"
                @update:model-value="val => updateField('bpjs_tk_effective_date', val)"
                @blur="() => validateBpjsTkDate(String(getFieldValue('bpjs_tk_effective_date') || ''))"
                :disabled="!isFieldEditable('bpjs_tk_effective_date')"
                placeholder="DD-MM-YYYY"
                :max-date="maxDate"
              />
              <p v-if="errors.bpjs_tk_effective_date" class="mt-1 text-xs text-red-600">{{ errors.bpjs_tk_effective_date }}</p>
            </div>

            <!-- BPJS Health Number -->
            <div v-if="isFieldVisible('no_bpjs')">
              <FormField
                label="BPJS Kesehatan Number"
                type="text"
                :model-value="getFieldValue('no_bpjs')"
                @update:model-value="val => updateField('no_bpjs', val)"
                @blur="() => validateBpjsHealth(String(getFieldValue('no_bpjs') || ''))"
                @keypress="onlyNumbersKeypress"
                @input="(event) => onlyNumbersInput(event, 'no_bpjs', 13)"
                :disabled="!isFieldEditable('no_bpjs')"
                inputmode="numeric"
                pattern="[0-9]*"
                :maxlength="13"
                placeholder="Enter 13 digit number"
              />
              <p v-if="errors.no_bpjs" class="mt-1 text-xs text-red-600">{{ errors.no_bpjs }}</p>
            </div>

            <div v-if="isFieldVisible('bpjs_doc')">
              <FormField
                label="BPJS Card Photo"
                type="file"
                :model-value="getFieldValue('bpjs_doc')"
                @update:model-value="val => updateField('bpjs_doc', val)"
                :disabled="!isFieldEditable('bpjs_doc')"
                accept=".jpg,.jpeg,.png,.pdf"
                :use-update-data-preview="true"
              />
            </div>

            <div v-if="isFieldVisible('telkomedika_doc')">
              <FormField
                label="Telkomedika Card Photo"
                type="file"
                :model-value="getFieldValue('telkomedika_doc')"
                @update:model-value="val => updateField('telkomedika_doc', val)"
                :disabled="!isFieldEditable('telkomedika_doc')"
                accept=".jpg,.jpeg,.png,.pdf"
                :use-update-data-preview="true"
              />
            </div>

          </div>
        </div>

        <!-- Document Upload Section (same format as basic info) -->
        <div id="social-security-upload">
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
            :description="`Upload your <span class='text-primary-500 font-bold'>Telkomedika Card Photo</span> and <span class='text-primary-500 font-bold'>BPJS Card Photo</span> (required)`"
            :required-document-count="2"
            @filesChanged="handleFilesChanged"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import SocialSecuritySkeleton from '~/components/form/SocialSecuritySkeleton.vue';
import FormField from '~/components/form/FormField.vue';
import MultiDocumentUpload from '~/components/common/MultiDocumentUpload.vue';
import { useDocumentTypes } from '~/composables/useDocumentTypes';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
      no_telkomedika: '',
      no_bpjs_tk: '',
      bpjs_tk_effective_date: '',
      no_bpjs: '',
      bpjs_doc: '',
      telkomedika_doc: ''
    })
  },
  editMode: { type: Boolean, required: true },
  isLoading: { type: Boolean, required: true },
  isTabEligible: { type: Boolean, default: true },
  showMultiUpload: { type: Boolean, default: true },
  formConfig: { type: Object, default: null },
  disableEditRevision: { type: Boolean, default: false },
  originalData: { type: Object, default: null },
});

const emit = defineEmits(['update:modelValue', 'validation-change', 'files-changed']);

// Document types (reuse same pattern as basic info)
const { documentTypes, fetchDocumentTypes } = useDocumentTypes();
const docTypeOptions = computed(() =>
  (documentTypes.value || [])
    .filter(dt => ['5', '6'].includes(dt.code)) // Only Telkomedika and BPJS
    .map(dt => ({ value: dt.code, label: dt.value }))
);

fetchDocumentTypes();

// Local reactive data to track user changes
const localData = ref({ ...props.modelValue });

// Error tracking
const errors = ref({
  no_telkomedika: '',
  no_bpjs_tk: '',
  bpjs_tk_effective_date: '',
  no_bpjs: ''
});

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

// Watch for originalData changes
watch(
  () => props.originalData,
  (newValue) => {
    // Handle originalData updates
  },
  { deep: true, immediate: true }
);

// Minimum date for BPJS TK Effective Date (today)
const minDate = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  return today; // Return Date object, not string
});

// Maximum date: Today (user cannot select future dates)
const maxDate = computed(() => {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of day
  return today;
});

// Watch for modelValue changes to reset validation errors when form is reset
watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    // If the data was reset (all fields became empty/reset), clear validation errors
    if (newValue && oldValue) {
      const hasBeenReset = Object.keys(newValue).every(key => {
        const newVal = newValue[key];
        const oldVal = oldValue[key];
        return (!newVal || newVal === '') && oldVal && oldVal !== '';
      });
      
      if (hasBeenReset) {
        // Clear all validation errors when form is reset
        errors.value = {
          no_telkomedika: '',
          no_bpjs_tk: '',
          bpjs_tk_effective_date: '',
          no_bpjs: ''
        };
      }
    }
  },
  { deep: true }
);

// Validation functions
const isNumericString = (str) => {
  return /^[0-9]+$/.test(str);
};

const isValidDateFormat = (dateStr) => {
  // Check if date is in DD-MM-YYYY format
  const ddmmyyyyRegex = /^\d{2}-\d{2}-\d{4}$/;
  return ddmmyyyyRegex.test(dateStr);
};

// Telkomedika validation (10-15 digits, numeric string)
const validateTelkomedika = (value) => {
  errors.value.no_telkomedika = '';
  
  if (!value || value.trim() === '') {
    return true; // Optional field
  }
  
  const cleanValue = value.trim();
  
  if (!isNumericString(cleanValue)) {
    errors.value.no_telkomedika = 'Telkomedika number must contain only numbers';
    return false;
  }
  
  if (cleanValue.length < 10 || cleanValue.length > 15) {
    errors.value.no_telkomedika = 'Telkomedika number must be between 10-15 digits';
    return false;
  }
  
  return true;
};

// BPJS TK validation (exactly 11 digits, numeric string)
const validateBpjsTk = (value) => {
  errors.value.no_bpjs_tk = '';
  
  if (!value || value.trim() === '') {
    return true; // Optional field
  }
  
  const cleanValue = value.trim();
  
  if (!isNumericString(cleanValue)) {
    errors.value.no_bpjs_tk = 'BPJS TK number must contain only numbers';
    return false;
  }
  
  if (cleanValue.length !== 11) {
    errors.value.no_bpjs_tk = 'BPJS TK number must be exactly 11 digits';
    return false;
  }
  
  return true;
};

// BPJS Health validation (exactly 13 digits, numeric string)
const validateBpjsHealth = (value) => {
  errors.value.no_bpjs = '';
  
  if (!value || value.trim() === '') {
    return true; // Optional field
  }
  
  const cleanValue = value.trim();
  
  if (!isNumericString(cleanValue)) {
    errors.value.no_bpjs = 'BPJS Health number must contain only numbers';
    return false;
  }
  
  if (cleanValue.length !== 13) {
    errors.value.no_bpjs = 'BPJS Health number must be exactly 13 digits';
    return false;
  }
  
  return true;
};

// BPJS TK Effective Date validation (DD-MM-YYYY only)
const validateBpjsTkDate = (value) => {
  errors.value.bpjs_tk_effective_date = '';
  
  if (!value || value.trim() === '') {
    return true; // Optional field
  }
  
  const cleanValue = value.trim();
  
  // Check if it's in DD-MM-YYYY format
  if (isValidDateFormat(cleanValue)) {
    const dateParts = cleanValue.split('-');
    const day = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const year = parseInt(dateParts[2]);
    
    const testDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (testDate.getDate() !== day || 
        testDate.getMonth() !== month - 1 || 
        testDate.getFullYear() !== year) {
      errors.value.bpjs_tk_effective_date = 'Please enter a valid date';
      return false;
    }
    
    // Only allow dates up to today (no future dates)
    if (testDate > today) {
      errors.value.bpjs_tk_effective_date = 'Date cannot be in the future (must be ≤ today)';
      return false;
    }
    
    return true;
  }
  
  errors.value.bpjs_tk_effective_date = 'Date must be in DD-MM-YYYY format';
  return false;
};

// Validate all fields (skip Telkomedika as it's readonly)
const validateAllFields = () => {
  const results = [
    // Skip Telkomedika validation as it's readonly
    // validateTelkomedika(String(props.modelValue.no_telkomedika || '')),
    validateBpjsTk(String(props.modelValue.no_bpjs_tk || '')),
    validateBpjsHealth(String(props.modelValue.no_bpjs || '')),
    validateBpjsTkDate(String(props.modelValue.bpjs_tk_effective_date || ''))
  ];
  
  return results.every(result => result === true);
};

// Check if form has validation errors (exclude readonly Telkomedika field)
const hasValidationErrors = computed(() => {
  return Object.entries(errors.value)
    .filter(([key]) => key !== 'no_telkomedika') // Exclude readonly field
    .some(([, error]) => error !== '');
});

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

  // Check if field is in the visible fields list
  const visibleFields = props.formConfig.visibleFields || [];
  const isVisible = visibleFields.includes(fieldName);
  return isVisible;
};

const hasVisibleFields = computed(() => {
  if (!props.formConfig) return true;

  const allFields = ['no_telkomedika', 'no_bpjs_tk', 'bpjs_tk_effective_date', 'no_bpjs', 'bpjs_doc', 'telkomedika_doc'];
  const hasVisible = allFields.some(field => isFieldVisible(field));
  return hasVisible;
});

const isFieldEditable = (fieldName) => {
  // Telkomedika is always read-only (view only)
  if (fieldName === 'no_telkomedika') {
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

  // For draft mode, all fields are editable except readonly ones
  return props.editMode;
};

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

// Update field with validation
function updateField(key, value) {
  // Skip updates for readonly Telkomedika field
  if (key === 'no_telkomedika') {
    return;
  }

  // Update local data first
  localData.value = { ...localData.value, [key]: value };

  // For need revision mode, emit the updated localData
  if (props.formConfig?.isNeedRevision) {
    emit('update:modelValue', { ...localData.value });
  } else {
    // For other modes, use the original logic
    emit('update:modelValue', { ...props.modelValue, [key]: value });
  }

  // Trigger validation for the specific field
  switch (key) {
    case 'no_telkomedika':
      // Skip validation for readonly field
      break;
    case 'no_bpjs_tk':
      validateBpjsTk(String(value || ''));
      break;
    case 'no_bpjs':
      validateBpjsHealth(String(value || ''));
      break;
    case 'bpjs_tk_effective_date':
      validateBpjsTkDate(String(value || ''));
      break;
  }

  // Emit validation state change
  emit('validation-change', {
    hasErrors: hasValidationErrors.value,
    isValid: !hasValidationErrors.value
  });
}

// Input restriction functions - only allow numbers
const onlyNumbersKeypress = (event) => {
  // Allow backspace, delete, tab, escape, enter
  if ([8, 9, 27, 13, 46].indexOf(event.keyCode) !== -1 ||
      // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (event.keyCode === 65 && event.ctrlKey === true) ||
      (event.keyCode === 67 && event.ctrlKey === true) ||
      (event.keyCode === 86 && event.ctrlKey === true) ||
      (event.keyCode === 88 && event.ctrlKey === true) ||
      // Allow home, end, left, right arrows
      (event.keyCode >= 35 && event.keyCode <= 39)) {
    return;
  }
  
  // Ensure that it's a number and stop the keypress
  if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105)) {
    event.preventDefault();
  }
};

const onlyNumbersInput = (event) => {
  // Remove any non-numeric characters
  const value = event.target.value.replace(/[^0-9]/g, '');
  if (value !== event.target.value) {
    event.target.value = value;
    // Trigger input event to update the model
    event.target.dispatchEvent(new Event('input', { bubbles: true }));
  }
};

// Listen for form reset events from parent
if (process.client) {
  const handleFormReset = () => {
    errors.value = {
      no_telkomedika: '', // Keep for display but won't affect validation
      no_bpjs_tk: '',
      bpjs_tk_effective_date: '',
      no_bpjs: ''
    };
  };

  onMounted(() => {
    window.addEventListener('formReset', handleFormReset);
  });

  onUnmounted(() => {
    window.removeEventListener('formReset', handleFormReset);
  });
}

// Handle file uploads from MultiDocumentUpload component
const handleFilesChanged = (files) => {
  emit('files-changed', files);
};

// Scroll to upload section
const scrollToUpload = () => {
  if (process.client) {
    setTimeout(() => {
      const uploadSection = document.getElementById('social-security-upload');
      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
};

// Expose validation function and scroll method for parent components
defineExpose({
  validateAllFields,
  hasValidationErrors: computed(() => hasValidationErrors.value),
  errors: computed(() => errors.value),
  scrollToUpload
});
</script>
