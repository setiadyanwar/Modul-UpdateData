<template>
  <div class="bg-white dark:bg-grey-800 rounded-md shadow-sm">
    

    <div class="flex items-center mb-6">
      <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-md flex items-center justify-center mr-3">
        <i class="pi pi-credit-card text-purple-600 dark:text-purple-400 text-lg"></i>
      </div>
      <h4 class="text-xl font-bold text-text-main">Payroll Account Information</h4>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField 
        v-if="isFieldVisible('bank_id')"
        label="Bank" 
        type="select" 
        v-model="localData.bank_id" 
        :disabled="!isFieldEditable('bank_id')" 
        master-data-category="BANK"
        placeholder="Select Bank"
      />
      
      <FormField 
        v-if="isFieldVisible('number_rekening')"
        label="Account Number" 
        type="text" 
        v-model="localData.number_rekening" 
        :disabled="!isFieldEditable('number_rekening')"
        placeholder="Enter account number (10-20 digits)"
        :minLength="10"
        :maxLength="20"
      />
      
      <FormField 
        v-if="isFieldVisible('holder_name')"
        label="Account Holder Name" 
        type="text" 
        v-model="localData.holder_name" 
        :disabled="!isFieldEditable('holder_name')"
        placeholder="Enter account holder name"
        :maxLength="100"
      />
      
      <FormField 
        v-if="isFieldVisible('tax_status_id')"
        label="Tax Status" 
        type="select" 
        v-model="localData.tax_status_id" 
        :disabled="!isFieldEditable('tax_status_id')" 
        master-data-category="TAX_STATUS"
        placeholder="Select tax status"
      />
      
      <FormField 
        v-if="isFieldVisible('npwp')"
        label="NPWP Number" 
        type="text" 
        v-model="localData.npwp" 
        :disabled="!isFieldEditable('npwp')"
        placeholder="Enter NPWP number (15 digits)"
        :maxLength="20"
      />
      
      <FormField 
        v-if="isFieldVisible('npwp_doc')"
        label="NPWP Document" 
        type="file" 
        v-model="localData.npwp_doc" 
        :disabled="!isFieldEditable('npwp_doc')"
        accept=".pdf,.jpg,.jpeg,.png"
        file-hint="Upload NPWP document (PDF, JPG, PNG)"
        :use-update-data-preview="true"
      />
      
      <FormField 
        v-if="isFieldVisible('saving_book_doc')"
        label="Saving Book Document" 
        type="file" 
        v-model="localData.saving_book_doc" 
        :disabled="!isFieldEditable('saving_book_doc')"
        accept=".pdf,.jpg,.jpeg,.png"
        file-hint="Upload saving book document (PDF, JPG, PNG)"
        :use-update-data-preview="true"
      />
    </div>

    
    <!-- Fallback message when no fields are visible -->
    <div v-if="formConfig && formConfig.isNeedRevision && !hasVisibleFields" 
         class="text-center py-12 text-gray-500">
      <i class="pi pi-info-circle text-3xl mb-4"></i>
      <p class="text-lg font-medium mb-2">No Payroll Account fields to revise</p>
      <p class="text-sm">This revision request doesn't include any payroll account changes.</p>
    </div>
  </div>
</template>

<script setup>
import FormField from "./FormField.vue";
import { onMounted, ref, watch, computed } from 'vue';
import { useMasterData } from '~/composables/useMasterData';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
      bank_id: undefined,
      number_rekening: "",
      holder_name: "",
      tax_status_id: undefined,
      npwp: "",
      npwp_doc: "",
      saving_book_doc: "",
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

// Field visibility control based on formConfig
const isFieldVisible = (fieldName) => {
  // For need revision status, show ALL fields (both original and new data)
  // This ensures users can see the complete data context
  if (props.formConfig && props.formConfig.isNeedRevision) {
    return true; // Show all fields in need revision
  }

  // If no formConfig or no visibleFields specified, show all fields
  if (!props.formConfig || !props.formConfig.visibleFields) {
    return true;
  }

  // For other statuses, show all fields
  return true;
};

// Check if any fields are visible for fallback message
const hasVisibleFields = computed(() => {
  if (!props.formConfig || !props.formConfig.isNeedRevision) {
    return true;
  }
  
  // If no visibleFields specified, show all fields
  if (!props.formConfig.visibleFields) {
    return true;
  }
  
  const payrollFields = [
    'bank_id', 'number_rekening', 'holder_name', 'tax_status_id', 'npwp', 'npwp_doc', 'saving_book_doc'
  ];
  
  return payrollFields.some(field => isFieldVisible(field));
});

// Field editability control based on formConfig
const isFieldEditable = (fieldName) => {
  // Tax status is always read-only (view only)
  if (fieldName === 'tax_status_id') {
    return false;
  }

  // For need revision status, use editableFields from formConfig
  if (props.formConfig && props.formConfig.isNeedRevision) {
    // Only allow editing fields that are in editableFields (from new_data)
    if (props.formConfig.editableFields) {
      const isEditable = props.formConfig.editableFields.has(fieldName);
      return isEditable && props.editMode;
    }
    // If no editableFields specified in need revision, disable all fields
    return false;
  }

  // Default behavior for non-revision mode
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

// Watch for props.modelValue changes to reset localData when data is reset
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

// Watch for changes and emit updates
watch(
  localData,
  (newValue) => {
    emit("update:modelValue", newValue);
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

// Master-data helpers
const { loadMasterData, getOptions, masterData } = useMasterData();

// Listen for form reset events
if (process.client) {
  window.addEventListener('formReset', (event) => {
    if (event.detail.success) {
      
      localData.value = { ...props.modelValue };
    }
  });
}

// Resolve various incoming shapes into the option.code (ID string)
const resolveMasterId = async (category, raw) => {
  if (raw == null) return '';

  // If it's already an object with an id field
  if (typeof raw === 'object') {
    const id = raw.id_bank || raw.id || raw.value || raw.code;
    return id == null ? '' : String(id);
  }

  // If it's a number-like or already id string
  if (typeof raw === 'number' || /^[0-9]+$/.test(String(raw))) {
    return String(raw);
  }

  // Otherwise treat as a display name: try to match with master data options
  try {
    const opts = await getOptions(category);
    const rawStr = String(raw).toLowerCase().trim();

    // Match case-insensitive against option.value or option.code, allow partial matches on the label
    const match = opts.find(o => {
      const val = String(o.value ?? '').toLowerCase().trim();
      const code = String(o.code ?? '').toLowerCase().trim();
      return val === rawStr || code === rawStr || val.includes(rawStr);
    });

    if (match) return String(match.code);
  } catch (e) {
    // ignore and fallback to raw
  }

  return String(raw);
};

// Watch for external changes and normalize bank/tax status ids to option.code strings
// REMOVED: Watch yang berlebihan menyebabkan infinite loop


// ✅ OPTIMIZED: Master data is now preloaded in layout, no need to load here
onMounted(async () => {
  // Master data is already preloaded in update-data layout
  // Data normalization will be handled by watcher when master data is available
});

// Watch for master data availability and normalize data when ready
watch(() => masterData.value, async (newMasterData) => {
  if (newMasterData && Object.keys(newMasterData).length > 0) {
    
    // Normalize initial localData if props provided
    if (props.modelValue && Object.keys(props.modelValue).length > 0) {
      const copy = { ...props.modelValue };
      copy.bank_id = await resolveMasterId('BANK', copy.bank_id);
      copy.tax_status_id = await resolveMasterId('TAX_STATUS', copy.tax_status_id);
      localData.value = copy;
    }
  }
}, { deep: true, immediate: true });
</script>
