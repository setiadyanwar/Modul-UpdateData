<template>
  <div class="space-y-8">
    

    <!-- BPJS Kesehatan -->
    <div v-if="isBpjsKesehatanVisible" class="">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">BPJS Kesehatan</h3>

      <!-- Row 1: BPJS Health Number -->
      <div class="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
        <FormField
          v-if="isFieldVisible('no_bpjs') || isFieldVisible('bpjs_health_number')"
          label="BPJS Health Number"
          v-model="localData.no_bpjs"
          type="text"
          :disabled="!isFieldEditable('no_bpjs')"
          placeholder="Enter BPJS Health number"
          inputmode="numeric"
          pattern="[0-9]*"
          :max-length="13"
          @keypress="onlyNumbersKeypress"
          @input="(event) => onlyNumbersInput(event, 'no_bpjs', 13)"
        />
      </div>
    </div>

    <!-- BPJS Ketenagakerjaan -->
    <div v-if="isBpjsKetenagakerjaanVisible" class="">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        BPJS Ketenagakerjaan
      </h3>

      <!-- Row 1: BPJS Employment Number, Effective Date -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <FormField
          v-if="isFieldVisible('no_bpjs_tk') || isFieldVisible('bpjs_tk_number')"
          label="BPJS Employment Number"
          v-model="localData.no_bpjs_tk"
          type="text"
          :disabled="!isFieldEditable('no_bpjs_tk')"
          placeholder="Enter BPJS Employment number"
          inputmode="numeric"
          pattern="[0-9]*"
          :max-length="11"
          @keypress="onlyNumbersKeypress"
          @input="(event) => onlyNumbersInput(event, 'no_bpjs_tk', 11)"
        />

        <FormField
          v-if="isFieldVisible('bpjs_tk_effective_date')"
          label="Effective Date"
          v-model="localData.bpjs_tk_effective_date"
          type="date"
          :disabled="!editMode"
          :min-date="minDate"
          :max-date="maxDate"
          placeholder="Select effective date (up to today)"
        />
      </div>
    </div>

    <!-- Telkomedika -->
    <div v-if="isTelkomedikaVisible" class="">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Telkomedika</h3>

      <!-- Row 1: Telkomedika Card Number -->
      <div class="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
        <FormField
          v-if="isFieldVisible('no_telkomedika') || isFieldVisible('telkomedika_card_number')"
          label="Telkomedika Card Number"
          v-model="localData.no_telkomedika"
          type="text"
          :disabled="!editMode"
          placeholder="Enter Telkomedika card number"
          inputmode="numeric"
          pattern="[0-9]*"
          :max-length="16"
          @keypress="onlyNumbersKeypress"
          @input="(event) => onlyNumbersInput(event, 'no_telkomedika', 16)"
        />
      </div>
    </div>

    <!-- Documents -->
    <div v-if="isDocumentsVisible" class="">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        Supporting Documents
      </h3>

      <!-- Row 1: BPJS Card Photo, Telkomedika Card Photo -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          v-if="isFieldVisible('bpjs_doc')"
          label="BPJS Card Photo"
          v-model="localData.bpjs_doc"
          type="file"
          :disabled="!editMode"
          accept=".jpg,.jpeg,.png,.pdf"
          file-hint="Upload JPG, PNG, or PDF (Max 5MB)"
          @file-upload="handleBpjsUpload"
          :use-update-data-preview="true"
        />

        <FormField
          v-if="isFieldVisible('telkomedika_doc')"
          label="Telkomedika Card Photo"
          v-model="localData.telkomedika_doc"
          type="file"
          :disabled="!editMode"
          accept=".jpg,.jpeg,.png,.pdf"
          file-hint="Upload JPG, PNG, or PDF (Max 5MB)"
          @file-upload="handleTelkomedikaUpload"
          :use-update-data-preview="true"
        />
      </div>
    </div>

    <!-- Fallback message when no fields are visible -->
    <div v-if="formConfig && formConfig.isNeedRevision && !isBpjsKesehatanVisible && !isBpjsKetenagakerjaanVisible && !isTelkomedikaVisible && !isDocumentsVisible" 
         class="text-center py-12 text-gray-500">
      <i class="pi pi-info-circle text-3xl mb-4"></i>
      <p class="text-lg font-medium mb-2">No Benefit fields to revise</p>
      <p class="text-sm">This revision request doesn't include any Benefit changes.</p>
    </div>

  </div>
</template>

<script setup>
import FormField from "./FormField.vue";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
      no_bpjs: "",
      bpjs_tk_effective_date: "",
      no_bpjs_tk: "",
      no_telkomedika: "",
      telkomedika_doc: "",
      bpjs_doc: "",
    }),
  },
  editMode: {
    type: Boolean,
    default: false,
  },
  formConfig: {
    type: Object,
    default: () => ({}),
  },
  disableEditRevision: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "update:modelValue",
  "bpjs-uploaded",
  "telkomedika-uploaded",
]);

// Field visibility control based on formConfig
const isFieldVisible = (fieldName) => {
  // If no formConfig or no visibleFields specified, show all fields
  if (!props.formConfig || !props.formConfig.visibleFields) {
    return true;
  }
  
  // For need revision status, only show fields that are in visibleFields
  if (props.formConfig.isNeedRevision && props.formConfig.visibleFields) {
    const isVisible = props.formConfig.visibleFields.has(fieldName);
    
    return isVisible;
  }
  
  // For other statuses, show all fields
  return true;
};

// Field editability control based on formConfig
const isFieldEditable = (fieldName) => {
  // If disableEditRevision is true, use the new logic for need revision
  if (props.disableEditRevision && props.formConfig && props.formConfig.isNeedRevision) {
    // For need revision status, only allow editing fields that are in editableFields
    if (props.formConfig.editableFields) {
      const isEditable = props.formConfig.editableFields.has(fieldName);
      
      return isEditable && props.editMode;
    }
    // If no editableFields specified in need revision, disable all fields
    return false;
  }
  
  // Default behavior for non-revision mode or when disableEditRevision is false
  
  return props.editMode;
};

// Check if field needs warning (for need revision status)
const isFieldNeedingWarning = (fieldName) => {
  if (!props.formConfig || !props.formConfig.isNeedRevision) {
    return false;
  }
  
  const isEditable = props.formConfig.editableFields && props.formConfig.editableFields.has(fieldName);
  
  
  return isEditable;
};

// Local reactive copy of data
const localData = ref({ ...props.modelValue });

// Date range configuration for BPJS TK Effective Date
// Minimum date: Today (user cannot select past dates)
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


// Section visibility - show section if any field in it is visible
const isBpjsKesehatanVisible = computed(() => {
  if (!props.formConfig || !props.formConfig.isNeedRevision) {
    return true;
  }
  
  // If no visibleFields specified, show all fields
  if (!props.formConfig.visibleFields) {
    return true;
  }
  
  return isFieldVisible('no_bpjs') || isFieldVisible('bpjs_health_number');
});

const isBpjsKetenagakerjaanVisible = computed(() => {
  if (!props.formConfig || !props.formConfig.isNeedRevision) {
    return true;
  }
  
  // If no visibleFields specified, show all fields
  if (!props.formConfig.visibleFields) {
    return true;
  }
  
  return isFieldVisible('no_bpjs_tk') || isFieldVisible('bpjs_tk_number') || isFieldVisible('bpjs_tk_effective_date');
});

const isTelkomedikaVisible = computed(() => {
  if (!props.formConfig || !props.formConfig.isNeedRevision) {
    return true;
  }
  
  // If no visibleFields specified, show all fields
  if (!props.formConfig.visibleFields) {
    return true;
  }
  
  return isFieldVisible('no_telkomedika') || isFieldVisible('telkomedika_card_number');
});

const isDocumentsVisible = computed(() => {
  return isFieldVisible('bpjs_doc') || isFieldVisible('telkomedika_doc');
});

// Watch for changes and emit updates
watch(
  localData,
  (newValue) => {
    emit("update:modelValue", newValue);
  },
  { deep: true }
);

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    // Only reset if the values are actually different to prevent infinite loop
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      // Check if user is actively editing - if so, don't reset
      const isUserEditing = document.activeElement && 
        (document.activeElement.tagName === 'INPUT' || 
         document.activeElement.tagName === 'SELECT' || 
         document.activeElement.tagName === 'TEXTAREA');
      
      if (!isUserEditing) {
        localData.value = { ...newValue };
      }
    }
  },
  { deep: true }
);

// Watch for formConfig changes and log debug info
watch(
  () => props.formConfig,
  (newConfig) => {
    
  },
  { deep: true, immediate: true }
);

// Watch for BPJS field changes to enforce length limits
watch(
  () => localData.value.no_bpjs,
  (newValue) => {
    if (newValue && newValue.length > 13) {
      localData.value.no_bpjs = newValue.substring(0, 13);
    }
    // Remove non-numeric characters
    if (newValue && /[^0-9]/.test(newValue)) {
      localData.value.no_bpjs = newValue.replace(/[^0-9]/g, '');
    }
  }
);

watch(
  () => localData.value.no_bpjs_tk,
  (newValue) => {
    if (newValue && newValue.length > 11) {
      localData.value.no_bpjs_tk = newValue.substring(0, 11);
    }
    // Remove non-numeric characters
    if (newValue && /[^0-9]/.test(newValue)) {
      localData.value.no_bpjs_tk = newValue.replace(/[^0-9]/g, '');
    }
  }
);

watch(
  () => localData.value.no_telkomedika,
  (newValue) => {
    if (newValue && newValue.length > 16) {
      localData.value.no_telkomedika = newValue.substring(0, 16);
    }
    // Remove non-numeric characters
    if (newValue && /[^0-9]/.test(newValue)) {
      localData.value.no_telkomedika = newValue.replace(/[^0-9]/g, '');
    }
  }
);

// Options data
const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const membershipTypeOptions = [
  { value: "Regular", label: "Regular" },
  { value: "Premium", label: "Premium" },
];

// Listen for form reset events
if (process.client) {
  window.addEventListener('formReset', (event) => {
    if (event.detail.success) {
      
      localData.value = { ...props.modelValue };
    }
  });
}

const handleBpjsUpload = (file) => {
  emit("bpjs-uploaded", file);
  
};

const handleTelkomedikaUpload = (file) => {
  emit("telkomedika-uploaded", file);
  
};


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

const onlyNumbersInput = (event, fieldName, maxLength) => {
  // Remove any non-numeric characters
  let value = event.target.value.replace(/[^0-9]/g, '');
  
  // Limit to maxLength
  if (value.length > maxLength) {
    value = value.substring(0, maxLength);
  }
  
  // Update the input value if it changed
  if (value !== event.target.value) {
    event.target.value = value;
  }
  
  // Update the model value
  if (fieldName && localData.value.hasOwnProperty(fieldName)) {
    localData.value[fieldName] = value;
  }
  
  
};
</script>
