<template>
  <div class="space-y-8">
    <!-- Basic Health Information -->
    <div v-if="isBasicHealthVisible" class="">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        Basic Health Information
      </h3>

      <!-- Row 1: Blood Type, Height, Weight -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <FormField
          v-if="isFieldVisible('blood_type_id')"
          label="Blood Type"
          v-model="localData.blood_type_id"
          type="select"
          :disabled="!isFieldEditable('blood_type_id')"
          placeholder="Select blood type"
          :options="bloodTypeOptions"
          :validation-message="errors.blood_type_id"
        />

        <FormField
          v-if="isFieldVisible('height')"
          label="Height (cm)"
          v-model="localData.height"
          type="number"
          :disabled="!isFieldEditable('height')"
          placeholder="Enter height in cm"
          min="100"
          max="250"
          inputmode="numeric"
          pattern="[0-9]*"
          @keypress="onlyIntegerKeypress"
          @input="(event) => { onlyIntegerInput(event, 'height', 100, 250); validateHeight(); }"
          :validation-message="errors.height"
        />

        <FormField
          v-if="isFieldVisible('weight')"
          label="Weight (kg)"
          v-model="localData.weight"
          type="number"
          :disabled="!isFieldEditable('weight')"
          placeholder="Enter weight in kg"
          min="30"
          max="200"
          inputmode="numeric"
          pattern="[0-9]*"
          @keypress="onlyIntegerKeypress"
          @input="(event) => { onlyIntegerInput(event, 'weight', 30, 200); validateWeight(); }"
          :validation-message="errors.weight"
        />
      </div>

      <!-- Row 2: Head Size, Has Disability -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          v-if="isFieldVisible('head_size')"
          label="Head Size (cm)"
          v-model="localData.head_size"
          type="number"
          :disabled="!isFieldEditable('head_size')"
          placeholder="Enter head size (0-100 cm)"
          min="0"
          max="100"
          inputmode="numeric"
          pattern="[0-9]*"
          @keypress="onlyIntegerKeypress"
          @input="(event) => { onlyIntegerInput(event, 'head_size', 0, 100); validateHead(); }"
          :validation-message="errors.head_size"
        />

        <FormField
          v-if="isFieldVisible('has_disability_id')"
          label="Has Disability"
          v-model="localData.has_disability_id"
          type="checkbox"
          :disabled="!isFieldEditable('has_disability_id')"
        />
      </div>
    </div>

    <!-- Medical History -->
    <div v-if="isMedicalHistoryVisible" class="">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Medical History</h3>

      <!-- Row 1: Last MCU Date, Has Disability -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <FormField
          v-if="isFieldVisible('last_mcu_date')"
          label="Last Medical Check-up Date"
          v-model="localData.last_mcu_date"
          type="date"
          :disabled="!isFieldEditable('last_mcu_date')"
          :warning-border="isFieldNeedingWarning('last_mcu_date')"
          :warning-message="isFieldNeedingWarning('last_mcu_date') ? 'This field needs revision' : ''"
        />

        <FormField
          v-if="isFieldVisible('health_status_id')"
          label="Health Status"
          v-model="localData.health_status_id"
          type="select"
          :disabled="!isFieldEditable('health_status_id')"
          placeholder="Select health status"
          :options="healthStatusOptions"
          :validation-message="errors.health_status_id"
        />
      </div>

      <!-- Row 2: Health Concerns -->
      <div class="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
        <FormField
          v-if="isFieldVisible('health_concern')"
          label="Health Concerns"
          v-model="localData.health_concern"
          type="textarea"
          :disabled="!isFieldEditable('health_concern')"
          placeholder="Enter any health concerns or conditions"
        />
      </div>

      <!-- Row 3: Medical Treatment Record -->
      <div class="grid grid-cols-1 md:grid-cols-1 gap-6">
        <FormField
          v-if="isFieldVisible('medical_treatment_record')"
          label="Medical Treatment Record"
          v-model="localData.medical_treatment_record"
          type="textarea"
          :disabled="!isFieldEditable('medical_treatment_record')"
          placeholder="Enter medical treatment history"
        />
      </div>
    </div>

    <!-- Vaccination History -->
    <div v-if="isVaccinationVisible" class="">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        Vaccination History
      </h3>

      <!-- Row 1: Vaccination Records -->
      <div class="grid grid-cols-1 md:grid-cols-1 gap-6">
        <FormField
          v-if="isFieldVisible('vaccinationRecord')"
          label="Vaccination Records"
          v-model="localData.vaccinationRecord"
          type="textarea"
          :disabled="!isFieldEditable('vaccinationRecord')"
          placeholder="Enter vaccination history"
        />
      </div>
    </div>

    <!-- Special Conditions -->
    <div v-if="isSpecialConditionsVisible" class="">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        Special Conditions
      </h3>

      <!-- Row 1: Special Medical Conditions -->
      <div class="grid grid-cols-1 md:grid-cols-1 gap-6">
        <FormField
          v-if="isFieldVisible('specialConditions')"
          label="Special Medical Conditions"
          v-model="localData.specialConditions"
          type="textarea"
          :disabled="!isFieldEditable('specialConditions')"
          placeholder="Enter any special medical conditions that need attention"
        />
      </div>
    </div>

    <!-- Fallback message when no fields are visible -->
    <div v-if="formConfig && formConfig.isNeedRevision && !isBasicHealthVisible && !isMedicalHistoryVisible && !isVaccinationVisible && !isSpecialConditionsVisible" 
         class="text-center py-12 text-gray-500">
      <i class="pi pi-info-circle text-3xl mb-4"></i>
      <p class="text-lg font-medium mb-2">No Medical Record fields to revise</p>
      <p class="text-sm">This revision request doesn't include any medical record changes.</p>
    </div>
  </div>
</template>

<script setup>
import FormField from "./FormField.vue";
import { ref, watch, computed, onMounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
      blood_type_id: "",
      height: null,
      weight: null,
      head_size: null,
      health_status_id: "",
      last_mcu_date: "",
      has_disability_id: false,
      health_concern: "",
      medical_treatment_record: "",
      vaccinationRecord: "",
      specialConditions: "",
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

const emit = defineEmits(["update:modelValue"]);

// UI validation state
const errors = ref({
  blood_type_id: '',
  height: '',
  weight: '',
  head_size: '',
  health_status_id: ''
});

const validateHeight = () => {
  errors.value.height = ''
  const v = parseInt(localData.value.height)
  if (Number.isNaN(v)) return
  if (v < 100 || v > 250) errors.value.height = 'Height must be between 100 and 250 cm'
}

const validateWeight = () => {
  errors.value.weight = ''
  const v = parseInt(localData.value.weight)
  if (Number.isNaN(v)) return
  if (v < 30 || v > 200) errors.value.weight = 'Weight must be between 30 and 200 kg'
}

const validateHead = () => {
  errors.value.head_size = ''
  const v = parseInt(localData.value.head_size)
  if (Number.isNaN(v)) return
  if (v < 0 || v > 100) errors.value.head_size = 'Head size must be between 0 and 100 cm'
}

const validateSelects = () => {
  errors.value.blood_type_id = ''
  errors.value.health_status_id = ''
  // simple required validation when value present in edit mode
  if (localData.value.blood_type_id && !bloodTypeOptions.find(o => o.value === localData.value.blood_type_id)) {
    errors.value.blood_type_id = 'Invalid blood type'
  }
  if (localData.value.health_status_id && !healthStatusOptions.find(o => o.value === localData.value.health_status_id)) {
    errors.value.health_status_id = 'Invalid health status'
  }
}

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

// Check if sections are visible
const isBasicHealthVisible = computed(() => {
  if (!props.formConfig || !props.formConfig.isNeedRevision) {
    return true;
  }
  
  // If no visibleFields specified, show all fields
  if (!props.formConfig.visibleFields) {
    return true;
  }
  
  const basicHealthFields = ['bloodType', 'heightCm', 'weightKg', 'headSize', 'hasDisability'];
  return basicHealthFields.some(field => isFieldVisible(field));
});

const isMedicalHistoryVisible = computed(() => {
  if (!props.formConfig || !props.formConfig.isNeedRevision) {
    return true;
  }
  
  // If no visibleFields specified, show all fields
  if (!props.formConfig.visibleFields) {
    return true;
  }
  
  const medicalHistoryFields = ['lastMcuDate', 'healthStatus', 'healthConcern', 'medicalTreatmentRecord'];
  return medicalHistoryFields.some(field => isFieldVisible(field));
});

const isVaccinationVisible = computed(() => {
  if (!props.formConfig || !props.formConfig.isNeedRevision) {
    return true;
  }
  
  // If no visibleFields specified, show all fields
  if (!props.formConfig.visibleFields) {
    return true;
  }
  
  return isFieldVisible('vaccinationRecord');
});

const isSpecialConditionsVisible = computed(() => {
  if (!props.formConfig || !props.formConfig.isNeedRevision) {
    return true;
  }
  
  // If no visibleFields specified, show all fields
  if (!props.formConfig.visibleFields) {
    return true;
  }
  
  return isFieldVisible('specialConditions');
});

// Local reactive copy of data
const localData = ref({ ...props.modelValue });

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
    if (newConfig && newConfig.visibleFields) {
    }
  },
  { deep: true, immediate: true }
);

// Watch for numeric field changes to enforce range limits
watch(
  () => localData.value.heightCm,
  (newValue) => {
    if (newValue !== null && newValue !== undefined && newValue !== '') {
      const intValue = parseInt(newValue);
      if (!isNaN(intValue)) {
        if (intValue < 100) {
          localData.value.heightCm = 100;
        } else if (intValue > 250) {
          localData.value.heightCm = 250;
        } else {
          localData.value.heightCm = intValue;
        }
      }
    }
  }
);

watch(
  () => localData.value.weightKg,
  (newValue) => {
    if (newValue !== null && newValue !== undefined && newValue !== '') {
      const intValue = parseInt(newValue);
      if (!isNaN(intValue)) {
        if (intValue < 30) {
          localData.value.weightKg = 30;
        } else if (intValue > 200) {
          localData.value.weightKg = 200;
        } else {
          localData.value.weightKg = intValue;
        }
      }
    }
  }
);

watch(
  () => localData.value.headSize,
  (newValue) => {
    if (newValue !== null && newValue !== undefined && newValue !== '') {
      const intValue = parseInt(newValue);
      if (!isNaN(intValue)) {
        if (intValue < 50) {
          localData.value.headSize = 50;
        } else if (intValue > 70) {
          localData.value.headSize = 70;
        } else {
          localData.value.headSize = intValue;
        }
      }
    }
  }
);

// Options data (local fallback; page-level should provide dynamic options)
const bloodTypeOptions = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
];

const healthStatusOptions = [
  { value: "Fit", label: "Fit" },
  { value: "Unfit", label: "Unfit" },
  { value: "Under Treatment", label: "Under Treatment" },
  { value: "Requires Monitoring", label: "Requires Monitoring" },
];

// Input restriction functions for integer fields
const onlyIntegerKeypress = (event) => {
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

const onlyIntegerInput = (event, fieldName, minValue, maxValue) => {
  // Remove any non-numeric characters
  let value = event.target.value.replace(/[^0-9]/g, '');
  
  // Convert to integer
  let intValue = parseInt(value) || 0;
  
  // Enforce min/max limits
  if (intValue < minValue) {
    intValue = minValue;
  } else if (intValue > maxValue) {
    intValue = maxValue;
  }
  
  // Update the input value if it changed
  const finalValue = intValue.toString();
  if (finalValue !== event.target.value) {
    event.target.value = finalValue;
  }
  
  // Update the model value
  if (fieldName && localData.value.hasOwnProperty(fieldName)) {
    localData.value[fieldName] = intValue;
  }
};


// Normalize health status value - simple text matching
const normalizeHealthStatus = (value) => {
  if (!value || value === '') return '';
  
  // Valid options
  const validOptions = ['Fit', 'Unfit', 'Under Treatment', 'Requires Monitoring'];
  
  // Try exact match first
  if (validOptions.includes(value)) {
    return value;
  }
  
  // Try case-insensitive match
  const normalizedValue = String(value).toLowerCase().trim();
  const match = validOptions.find(option => 
    option.toLowerCase() === normalizedValue
  );
  
  return match || String(value);
};

// Preload master data and normalize existing values on mount
onMounted(async () => {
  // Normalize initial localData if props provided
  if (props.modelValue && Object.keys(props.modelValue).length > 0) {
    const copy = { ...props.modelValue };
    copy.healthStatus = normalizeHealthStatus(copy.healthStatus);
    localData.value = copy;
  }
});

// Listen for form reset events
if (process.client) {
  window.addEventListener('formReset', (event) => {
    if (event.detail.success) {
      localData.value = { ...props.modelValue };
    }
  });
}
</script>
