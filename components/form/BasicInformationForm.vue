<template>
  <div class="bg-white dark:bg-grey-800 rounded-md shadow-sm">

    <!-- Top row with 3 columns (Name, NIK, KTP) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <FormField 
        v-if="isFieldVisible('name')"
        label="Name" 
        type="text" 
        v-model="localData.name" 
        :disabled="true"
        placeholder="Employee name field cannot be modified"
      />
      
      <FormField 
        v-if="isFieldVisible('nik')"
        label="NIK" 
        type="text" 
        v-model="localData.nik" 
        :disabled="true"
        placeholder="Employee ID"
      />
      
      <FormField 
        v-if="isFieldVisible('no_ktp')"
        label="ID Number (KTP)" 
        type="text" 
        v-model="localData.no_ktp"
        :disabled="!isFieldEditable('no_ktp')"
        placeholder="Enter KTP number (16 digits) - Optional"
        :maxLength="16"
        :validationMessage="getKTPValidationMessage()"
      />
    </div>
    
    <!-- Second row with 3 columns for contact fields -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <FormField 
        v-if="isFieldVisible('main_phone_number')"
        label="Main Phone Number" 
        type="tel" 
        v-model="localData.main_phone_number" 
        :disabled="!isFieldEditable('main_phone_number')"
        placeholder="Enter phone number (08xxx or 628xxx)"
        :minLength="10"
        :maxLength="15"
      />
      
      <FormField 
        v-if="isFieldVisible('private_email')"
        label="Private Email" 
        type="email" 
        v-model="localData.private_email" 
        :disabled="!isFieldEditable('private_email')"
        placeholder="Enter private email (gmail, outlook, yahoo, hotmail)"
      />
      
      <FormField 
        v-if="isFieldVisible('business_email')"
        label="Business Email" 
        type="email" 
        v-model="localData.business_email" 
        :disabled="true"
        placeholder="Business email cannot be modified"
      />
    </div>
    
    <!-- Third row with 3 columns -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <FormField 
        v-if="isFieldVisible('secondary_phone_number')"
        label="Secondary Phone Number" 
        type="tel" 
        v-model="localData.secondary_phone_number" 
        :disabled="!isFieldEditable('secondary_phone_number')"
        placeholder="Enter phone number (08xxx or 628xxx)"
        :minLength="10"
        :maxLength="15"
      />
      
      <FormField 
        v-if="isFieldVisible('birth_date')"
        label="Birth Date" 
        type="date" 
        v-model="localData.birth_date" 
        :disabled="!isFieldEditable('birth_date')"
        placeholder="Select birth date"
        format="dd-mm-yy"
      />
      
      <FormField 
        v-if="isFieldVisible('birth_place')"
        label="Birth Place" 
        type="text" 
        v-model="localData.birth_place" 
        :disabled="!isFieldEditable('birth_place')"
        placeholder="Enter birth place (no numbers allowed)"
      />
    </div>
    
    <!-- Fourth row with 3 columns -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <FormField 
        v-if="isFieldVisible('gender_id')"
        label="Gender" 
        type="select" 
        v-model="localData.gender_id" 
        :disabled="!isFieldEditable('gender_id')" 
        master-data-category="GENDER"
        placeholder="Select gender"
      />
      
      <FormField 
        v-if="isFieldVisible('marital_status_id')"
        label="Marital Status" 
        type="select" 
        v-model="localData.marital_status_id" 
        :disabled="!isFieldEditable('marital_status_id')" 
        master-data-category="MARITAL_STATUS"
        placeholder="Select marital status"
      />
      
      <FormField 
        v-if="isFieldVisible('religion_id')"
        label="Religion" 
        type="select" 
        v-model="localData.religion_id" 
        :disabled="!isFieldEditable('religion_id')" 
        master-data-category="RELIGION"
        placeholder="Select religion"
      />
    </div>
    
    <!-- Fifth row with 3 columns -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <FormField 
        v-if="isFieldVisible('nationality_id')"
        label="Nationality" 
        type="select" 
        v-model="localData.nationality_id" 
        :disabled="!isFieldEditable('nationality_id')" 
        master-data-category="NATIONALITY"
        placeholder="Select nationality"
      />
      
      <FormField 
        v-if="isFieldVisible('clothing_size_id')"
        label="Clothing Size" 
        type="select" 
        v-model="localData.clothing_size_id" 
        :disabled="!isFieldEditable('clothing_size_id')" 
        master-data-category="CLOTHING"
        placeholder="Select clothing size"
        @update:model-value="(val) => { localData.clothing_size_id = val; }"
      />
      
      <FormField 
        v-if="isFieldVisible('passport_number')"
        label="Passport Number" 
        type="text" 
        v-model="localData.passport_number" 
        :disabled="!isFieldEditable('passport_number')"
        placeholder="Enter passport number (6-12 characters)"
        :minLength="6"
        :maxLength="12"
      />
    </div>
    
    <!-- Sixth row with KTP document -->
    <div class="grid grid-cols-1 gap-4 mb-6">
      <div v-if="isFieldVisible('ktp_doc')">
        <FormField 
          label="KTP Document" 
          type="file" 
          v-model="localData.ktp_doc" 
          :disabled="!isFieldEditable('ktp_doc')"
          accept=".jpg,.jpeg,.png,.pdf"
          :use-update-data-preview="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import FormField from "./FormField.vue";
import { onMounted, ref, watch, computed, nextTick } from 'vue';
import { useMasterData } from '~/composables/useMasterData';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
      nik: "",
      name: "",
      no_ktp: "",
      business_email: "",
      private_email: "",
      main_phone_number: "",
      secondary_phone_number: "",
      birth_date: "",
      birth_place: "",
      gender_id: "",
      marital_status_id: "",
      religion_id: "",
      nationality_id: "",
      clothing_size_id: "",
      passport_number: "",
      professional_photo: "",
      ktp_doc: "",
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
  // If no formConfig, show all fields
  if (!props.formConfig) {
    return true;
  }
  
  // If visibleFields is null or not specified, show all fields
  if (!props.formConfig.visibleFields) {
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

  // For need revision status, only allow editing fields that are in editableFields (new_data)
  if (props.formConfig && props.formConfig.isNeedRevision) {
    // Only allow editing fields that are in editableFields (new_data fields)
    if (props.formConfig.editableFields) {
      const isEditable = props.formConfig.editableFields.has(fieldName);
      const result = isEditable && props.editMode;


      return result;
    }
    // If no editableFields specified in need revision, disable all fields
    return false;
  }

  // Default behavior for non-revision mode
  return props.editMode;
};

// Check if any fields are visible for fallback message
const hasVisibleFields = computed(() => {
  if (!props.formConfig || !props.formConfig.isNeedRevision || !props.formConfig.visibleFields) {
    return true;
  }
  
  const basicInfoFields = [
    'name', 'nik', 'no_ktp', 'business_email', 'private_email', 'main_phone_number', 
    'secondary_phone_number', 'birth_date', 'birth_place', 
    'gender_id', 'marital_status_id', 'religion_id', 
    'nationality_id', 'clothing_size_id', 'passport_number', 'ktp_doc'
  ];
  
  return basicInfoFields.some(field => isFieldVisible(field));
});


// KTP validation function
const getKTPValidationMessage = () => {
  const ktpValue = localData.value.no_ktp;
  
  // Only validate if field is visible and user has started typing
  if (!isFieldVisible('no_ktp')) {
    return '';
  }
  
  // If field is empty, don't show error (field is optional)
  if (!ktpValue || ktpValue.trim() === '') {
    return '';
  }
  
  // Check if KTP has invalid length when filled
  if (ktpValue.length > 0 && ktpValue.length !== 16) {
    return 'KTP Number must be exactly 16 digits';
  }
  
  // Check if KTP contains non-numeric characters when filled
  if (ktpValue.length > 0 && !/^\d+$/.test(ktpValue)) {
    return 'KTP Number can only contain numbers';
  }
  
  return '';
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
        // reset localData from props
        nextTick(() => {
          localData.value = { ...newValue };
        });
      }
    }
  },
  { deep: true }
);


// Watch for changes and emit updates
// Note: Using immediate: true and comparing with props.modelValue instead of oldValue
// because Vue deep watch has issues where oldValue === newValue (same reference)
watch(
  localData,
  (newValue) => {
    // Compare with original props.modelValue
    const originalValue = props.modelValue || {};

    const keyFields = ['nik', 'main_phone_number', 'business_email', 'private_email', 'secondary_phone_number', 'birth_date', 'birth_place', 'no_ktp', 'passport_number', 'marital_status_id', 'gender_id', 'religion_id', 'nationality_id', 'clothing_size_id'];
    let hasChanges = false;

    for (const field of keyFields) {
      if (newValue[field] !== originalValue[field]) {
        hasChanges = true;
        break;
      }
    }

    if (hasChanges) {
      // Normalize birth_date format if needed
      if (newValue.birth_date && newValue.birth_date.includes('/')) {
        const parts = newValue.birth_date.split('/');
        if (parts.length === 3) newValue.birth_date = `${parts[0]}-${parts[1]}-${parts[2]}`;
      }

      // Emit updated model to parent
      emit("update:modelValue", newValue);
    }
  },
  { deep: true, immediate: false }
);

// Watch for formConfig changes and log debug info
watch(
  () => props.formConfig,
  (newConfig) => {
    // formConfig updated
  },
  { deep: true, immediate: true }
);

// Master-data helpers
const { loadMasterData, loadMultipleMasterData, getOptions, masterData } = useMasterData();


// Document preview state

// Listen for form reset events - once only
if (process.client) {
  let hasResetListener = false;
  
  if (!hasResetListener) {
    window.addEventListener('formReset', async (event) => {
      if (event.detail.success) {
        try {
          await nextTick();
          localData.value = { ...props.modelValue };
        } catch (error) {
          // Error during form reset
        }
      }
    });
    hasResetListener = true;
  }
}

// Resolve various incoming shapes into the option.code (ID string)
const resolveMasterId = async (category, raw) => {
  // Perbaikan: Gunakan String() untuk memastikan "0" tidak dianggap falsy
  const rawStr = String(raw);
  if (rawStr === 'undefined' || rawStr === 'null' || rawStr === '') return '';

  // If it's already an object with an id field
  if (typeof raw === 'object') {
    const id = raw.id || raw.value || raw.code;
    return id == null ? '' : String(id);
  }

  // If it's a number-like or already id string
  if (typeof raw === 'number' || /^[0-9]+$/.test(rawStr)) {
    return rawStr;
  }

  // Otherwise treat as a display name: try to match with master data options
  try {
    // ✅ OPTIMIZED: Use cached master data directly if available
    let opts = [];
    if (masterData.value && masterData.value[category]) {
      opts = masterData.value[category].map(item => ({
        code: item.code,
        value: item.value
      }));
    } else {
      // Only call API if cache not available
      opts = await getOptions(category);
    }
    const rawStrLower = rawStr.toLowerCase().trim();

    // Match case-insensitive against option.value or option.code, allow partial matches on the label
    const match = opts.find(o => {
      const val = String(o.value ?? '').toLowerCase().trim();
      const code = String(o.code ?? '').toLowerCase().trim();
      return val === rawStrLower || code === rawStrLower || val.includes(rawStrLower);
    });

    if (match) {
      return String(match.code);
    }
  } catch (e) {
    // Error matching display name for master data
  }

  return rawStr;
};


// Watch for master data availability and normalize data when ready
watch(() => masterData.value, async (newMasterData) => {
  
  if (newMasterData && Object.keys(newMasterData).length > 0) {
    
    // Normalize initial localData if props provided
    if (props.modelValue && Object.keys(props.modelValue).length > 0) {
      const copy = { ...props.modelValue };
      
      // Ensure birth_date is in DD-MM-YYYY format
      if (copy.birth_date && copy.birth_date.includes('/')) {
        const parts = copy.birth_date.split('/');
        if (parts.length === 3) {
          copy.birth_date = `${parts[0]}-${parts[1]}-${parts[2]}`;
        }
      }
      
      copy.gender_id = await resolveMasterId('GENDER', copy.gender_id);
      copy.marital_status_id = await resolveMasterId('MARITAL_STATUS', copy.marital_status_id);
      copy.religion_id = await resolveMasterId('RELIGION', copy.religion_id);
      copy.nationality_id = await resolveMasterId('NATIONALITY', copy.nationality_id);
      copy.clothing_size_id = await resolveMasterId('CLOTHING', copy.clothing_size_id);
      
      localData.value = copy;
    }

    // Set default nationality to Indonesia (id/code "1") if empty
    if (!localData.value.nationality_id || String(localData.value.nationality_id).trim() === '') {
      localData.value.nationality_id = '1';
    }
  } else {
  }
}, { deep: true, immediate: true });
</script>
