<template>
  <div>
    <div v-if="isLoading">
      <EducationSkeleton />
    </div>
    <div v-else>
      <!-- Header with Action Buttons -->
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-md flex items-center justify-center mr-3">
            <i class="pi pi-graduation-cap text-indigo-600 dark:text-indigo-400 text-lg"></i>
          </div>
          <h3 class="text-xl font-bold text-text-main">Education Records</h3>
        </div>
        <div class="flex items-center gap-2">
          <!-- Info text when button is disabled due to edit mode -->
          <span v-if="editMode" class="text-xs text-grey-500 dark:text-grey-400">
            Cannot add new record while editing existing data
          </span>
          
          <!-- Info text when button is disabled due to tab not eligible -->
          <span v-if="!isTabEligible && !editMode" class="text-xs text-grey-500 dark:text-grey-400">
            Cannot add new record at this time
          </span>
          
          <!-- Add New Button -->
          <UiButton
            variant="primary"
            size="small"
            @click="startInsertFlow"
            :disabled="!isTabEligible || editMode"
          >
            <i class="pi pi-plus mr-2"></i>
            Add Education Record
          </UiButton>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="modelValue.length === 0 && !showInsertForm" class="text-center py-12 bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700">
        <div class="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4 mx-auto">
          <i class="pi pi-graduation-cap text-indigo-600 dark:text-indigo-400 text-2xl"></i>
        </div>
        <h4 class="text-lg font-medium text-text-main mb-2">No Education Records</h4>
        <p class="text-grey-600 dark:text-grey-400">Add education records to get started</p>
      </div>
      
      <!-- Existing Education Records -->
      <div v-else-if="modelValue.length > 0 && !showInsertForm" class="space-y-6">
        <div v-for="(record, index) in modelValue" :key="index" class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6">
          <div class="flex justify-between items-start mb-6">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mr-3">
                <span class="text-indigo-600 dark:text-indigo-400 font-medium text-sm">{{ index + 1 }}</span>
              </div>
              <h4 class="text-lg font-semibold text-text-main">{{ getEducationTitle(record, index) }}</h4>
            </div>
            <div class="flex items-center gap-3">
              <Toggle 
                :model-value="record.status === 1" 
                @update:model-value="val => updateField(index, 'status', val ? 1 : 0)" 
                :disabled="!editMode || !isTabEligible"
              />
              <!-- Command: Remove button - hidden but kept for functionality -->
              <UiButton
                v-if="false && editMode && isTabEligible"
                variant="outline"
                size="small"
                @click="() => props.removeEducationRecord ? props.removeEducationRecord(index) : removeRecord(index)"
                class="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
              >
                <i class="pi pi-trash mr-2"></i>
                Remove
              </UiButton>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label="Level" 
              type="select" 
              :model-value="record.edu_level_id || record.edu_level" 
              @update:model-value="val => updateField(index, 'edu_level_id', val)" 
              :disabled="!editMode || !isTabEligible" 
              master-data-category="EDU_LEVELS"
              :class="getFieldClass(record, 'edu_level_id')"
            />
            <FormField 
              label="Major" 
              type="select" 
              :model-value="record.edu_major_id || record.edu_major" 
              @update:model-value="val => updateField(index, 'edu_major_id', val)" 
              :disabled="!editMode || !isTabEligible" 
              master-data-category="EDU_MAJORS"
              :class="getFieldClass(record, 'edu_major_id')"
            />
            <FormField 
              label="Institution" 
              type="select" 
              :model-value="record.edu_institution_id || record.edu_institution" 
              @update:model-value="val => updateField(index, 'edu_institution_id', val)" 
              :disabled="!editMode || !isTabEligible" 
              master-data-category="EDU_INSTITUTIONS"
              :class="getFieldClass(record, 'edu_institution_id')"
            />
            <!-- FIXED: [DATE] - Corrected field names to match documentation
                 ISSUE: Existing record form was using 'edu_edu_start_date' and 'edu_edu_end_date'
                 IMPACT: Field names didn't match validation logic and documentation
                 SOLUTION: Update to use correct field names 'edu_start_date' and 'edu_end_date'
                 BEFORE: edu_edu_start_date, edu_edu_end_date
                 AFTER:  edu_start_date, edu_end_date -->
            <FormField 
              label="Start Date" 
              type="date" 
              :model-value="record.edu_start_date" 
              @update:model-value="val => updateField(index, 'edu_start_date', val)" 
              :disabled="!editMode || !isTabEligible" 
              placeholder="Select start date"
              :min-date="new Date(1900, 0, 1)"
              :max-date="new Date(new Date().getFullYear() + 10, 11, 31)"
              :class="getFieldClass(record, 'edu_start_date')"
            />
            <FormField 
              label="End Date" 
              type="date" 
              :model-value="record.edu_end_date" 
              @update:model-value="val => updateField(index, 'edu_end_date', val)" 
              :disabled="!editMode || !isTabEligible" 
              placeholder="Select end date"
              :min-date="new Date(1900, 0, 1)"
              :max-date="new Date(new Date().getFullYear() + 10, 11, 31)"
              :class="getFieldClass(record, 'edu_end_date')"
            />
            <!-- Document field - always visible but disabled for upload -->
            <FormField 
              label="Your Ijazah" 
              type="file" 
              :model-value="record.ijazah_doc" 
              :disabled="true" 
              accept=".jpg,.jpeg,.png,.pdf" 
              class="md:col-span-2" 
            />
            <div v-if="editMode && isTabEligible" class="md:col-span-2 mt-2">
              <UiFileUpload
                name="ijazah"
                title="Upload New Ijazah"
                file-info="PNG, JPG, JPEG, PDF · max 25MB"
                empty-text="Drag & drop or browse ijazah."
                @select="(e) => { onRecordUploadSelected(index, e.files?.[0]); }"
                @uploader="(e) => onRecordUploadSelected(index, e.files?.[0])"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Insert Forms Section - Always editable for new data -->
      <div v-if="showInsertForm" class="space-y-6">
        <!-- Section Header for Insert Forms -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-md">
          <div class="flex items-center gap-2">
            <i class="pi pi-plus-circle text-blue-600 dark:text-blue-400 text-lg"></i>
            <h5 class="font-semibold text-blue-800 dark:text-blue-200">Adding New Education Records</h5>
          </div>
          <p class="text-blue-700 dark:text-blue-300 text-sm mt-1">Fill in the forms below to add new education records</p>
        </div>
        
        <!-- Individual Insert Forms -->
        <div v-for="(form, formIdx) in insertForms" :key="form.id" :data-form-id="form.id" class="education-record-card bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <!-- Left side: Title -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-2">
              <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                {{ formIdx + 1 }}
              </span>
              <h6 class="font-semibold text-text-main">{{ getInsertFormTitle(form, formIdx) }}</h6>
            </div>
            
            <!-- Right side: Toggle and Action buttons -->
            <div class="flex items-center gap-3">
              <Toggle 
                :model-value="form.status === 1" 
                @update:model-value="val => updateInsertField(form.id, 'status', val ? 1 : 0)" 
              />
              <UiButton 
                variant="outline" 
                size="small" 
                @click="removeInsertForm(form.id)" 
                class="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
              >
                <i class="pi pi-trash mr-2"></i> Remove
              </UiButton>
            </div>
          </div>
          
          <!-- Form Fields -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Level" type="select" :model-value="form.edu_level_id" @update:model-value="val => updateInsertField(form.id, 'edu_level_id', val)" master-data-category="EDU_LEVELS" :validation-rules="{ required: true }" />
            <FormField label="Major" type="select" :model-value="form.edu_major_id" @update:model-value="val => updateInsertField(form.id, 'edu_major_id', val)" master-data-category="EDU_MAJORS" :validation-rules="{ required: true }" />
            <FormField label="Institution" type="select" :model-value="form.edu_institution_id" @update:model-value="val => updateInsertField(form.id, 'edu_institution_id', val)" master-data-category="EDU_INSTITUTIONS" :validation-rules="{ required: true }" />
            <FormField label="Start Date" type="date" :model-value="form.edu_start_date" @update:model-value="val => updateInsertField(form.id, 'edu_start_date', val)" placeholder="Select start date" :min-date="new Date(1900, 0, 1)" :max-date="new Date(new Date().getFullYear() + 10, 11, 31)" :validation-rules="{ required: true }" />
            <FormField label="End Date" type="date" :model-value="form.edu_end_date" @update:model-value="val => updateInsertField(form.id, 'edu_end_date', val)" placeholder="Select end date" :min-date="new Date(1900, 0, 1)" :max-date="new Date(new Date().getFullYear() + 10, 11, 31)" :validation-rules="{ required: true }" />
            <div class="md:col-span-2 mt-2">
              <UiFileUpload
                name="ijazah"
                title="Upload Ijazah"
                file-info="PNG, JPG, JPEG, PDF · max 25MB"
                empty-text="Drag & drop or browse ijazah."
                @select="(e) => { onInsertUploadSelected(form.id, e.files?.[0]); }"
              />
            </div>
          </div>
        </div>
        
        <!-- Global Actions -->
        <div class="space-y-4 pt-4 border-t border-grey-200 dark:border-grey-700">
          <!-- Action Buttons Row - Responsive -->
          <div class="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
            <UiButton
              variant="outline"
              size="small"
              @click="addInsertForm" 
              class="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400 w-full sm:w-auto"
            >
              <i class="pi pi-plus mr-2"></i> Add Another Form
            </UiButton>
            <UiButton 
              variant="outline" 
              size="small" 
              @click="showDiscardConfirmation" 
              class="text-grey-600 hover:text-grey-700 w-full sm:w-auto"
            >
              <i class="pi pi-times mr-2"></i> Cancel All
            </UiButton>
          </div>
          
          <!-- Submit All Button - Full Width -->
          <UiButton
            variant="primary"
            size="small"
            @click="submitAllInserts"
            :disabled="!hasValidInsertData"
            class="w-full bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700"
          >
            <i class="pi pi-check mr-2"></i> Submit All
          </UiButton>
        </div>
      </div>
    </div>
    
    <!-- Unsaved Changes Modal -->
    <UiConfirmationModal
      :is-open="showUnsavedChangesModal"
      :is-visible="showUnsavedChangesModal"
      title="You have unsaved education data"
      message="You have filled in some information for education records. What would you like to do with your changes?"
      save-button-text="Save as Draft"
      continue-button-text="Discard Changes"
      @close="showUnsavedChangesModal = false"
      @save-draft="handleSaveDraftFromModal"
      @continue="handleDiscardChanges"
    />
  </div>
</template>

<script setup>
import EducationSkeleton from '~/components/form/EducationSkeleton.vue';
import UiButton from '~/components/ui/Button.vue';
import FormField from '~/components/form/FormField.vue';
import UiConfirmationModal from '~/components/ui/ConfirmationModal.vue';
import Toggle from '~/components/ui/Toggle.vue';
import UiFileUpload from '~/components/ui/FileUpload.vue';
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import { useMasterData } from '~/composables/useMasterData';
import { useChangeRequestSubmit } from '~/composables/useChangeRequestSubmit';

const props = defineProps({
  modelValue: { type: Array, required: true },
  editMode: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  formConfig: { type: Object, default: () => ({}) },
  isLoading: { type: Boolean, default: false },
  isTabEligible: { type: Boolean, default: true },
  addEducationRecord: { type: Function, required: false },
  removeEducationRecord: { type: Function, required: false },
});

const emit = defineEmits([
  'update:modelValue', 
  'insertRequest', 
  'openChangeRequestModal',
  'editRequest'
]);

// Insert form state
const showInsertForm = ref(false);
const insertForms = ref([]);
const showUnsavedChangesModal = ref(false);

// Default implementations for functions if not provided
const addEducationRecord = props.addEducationRecord || (() => {});
const removeEducationRecord = props.removeEducationRecord || (() => {});
// Minimalistic upload state (does not change existing request flow)
const recordUploadFiles = ref({}); // index -> File
const insertUploadFiles = ref({}); // formId -> File

// Client key generation for insert records
const insertFormClientKeys = ref({}); // formId -> client_key
const recordClientKeys = ref({}); // index -> client_key (for edit records)
const generateClientKey = () => {
  // RFC4122-ish v4 using crypto if available
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // @ts-ignore
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
    const toHex = (n) => n.toString(16).padStart(2, '0');
    const hex = Array.from(bytes, toHex).join('');
    return `${hex.substr(0, 8)}-${hex.substr(8, 4)}-${hex.substr(12, 4)}-${hex.substr(16, 4)}-${hex.substr(20)}`;
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const onRecordUploadSelected = (idx, file) => {
  try {
    recordUploadFiles.value[idx] = file;
    
    // FIXED: Ensure client_key is available for upload
    // Get client_key from props.modelValue or generate new one
    const record = props.modelValue[idx];
    const clientKey = record?.client_key || generateClientKey();
    
    // Store client_key for this record index
    recordClientKeys.value[idx] = clientKey;
    
    // FIXED: Update props.modelValue with client_key if it doesn't exist
    if (!record?.client_key) {
      const updated = props.modelValue.map((item, i) => 
        i === idx ? { ...item, client_key: clientKey } : item
      );
      emit('update:modelValue', updated);
    }
    
    // FIXED: Also update recordClientKeys to ensure it's available for upload
    recordClientKeys.value[idx] = clientKey;
    
    
  } catch (error) {
    console.error("❌ Error in onRecordUploadSelected:", error);
  }
};

const onInsertUploadSelected = (formId, file) => {
  try {
    insertUploadFiles.value[formId] = file;
    
    // client_key should already exist (generated when form was created)
    const existingClientKey = insertFormClientKeys.value[formId];
    
    if (!existingClientKey) {
      console.error("❌ No client_key found for form during file selection", { formId, availableKeys: Object.keys(insertFormClientKeys.value) });
    }
    
  } catch (error) {
    console.error("❌ Error in onInsertUploadSelected:", error);
  }
};

// Restore form data from localStorage if available (in case of page reload)
if (process.client) {
  const savedForms = localStorage.getItem('educationInsertForms');
  if (savedForms) {
    try {
      const parsedForms = JSON.parse(savedForms);
      if (Array.isArray(parsedForms) && parsedForms.length > 0) {
        insertForms.value = parsedForms;
        showInsertForm.value = true;
      }
    } catch (error) {
      localStorage.removeItem('educationInsertForms');
    }
  }
}

// Computed properties
const hasValidInsertData = computed(() => {
  if (insertForms.value.length === 0) {
    return false;
  }
  
  // CORRECTED: [DATE] - Using correct field names as per documentation
  // DOCUMENTATION: Field names should be 'edu_start_date' and 'edu_end_date'
  // IMPACT: Ensures validation matches the correct field names from documentation
  // SOLUTION: Use correct field names 'edu_start_date' and 'edu_end_date'
  const requiredFields = ['edu_level_id', 'edu_major_id', 'edu_institution_id', 'edu_start_date', 'edu_end_date'];
  
  const isValid = insertForms.value.every((form, formIndex) => {
    const allFieldsValid = requiredFields.every(field => {
      const value = form[field];
      return value && value.toString().trim() !== '';
    });
    
    return allFieldsValid;
  });
  
  // Form validation completed
  
  return isValid;
});

// Function to check if a specific field has been changed
const isFieldChanged = (record, field) => {
  if (!props.editMode || !props.originalData) return true;
  
  const originalRecord = props.originalData.find(orig => orig.id_education === record.id_education);
  if (!originalRecord) return true; // New record counts as changed
  
  const currentValue = record[field];
  const originalValue = originalRecord[field];
  return String(currentValue || '') !== String(originalValue || '');
};

// Reactive state for validation
const validationState = ref({});

// Function to update validation state
const updateValidationState = () => {
  
  if (!props.editMode || !props.originalData || !props.modelValue) {
    validationState.value = {};
    return;
  }
  
  // CORRECTED: [DATE] - Using correct field names as per documentation
  // DOCUMENTATION: Field names should be 'edu_start_date' and 'edu_end_date'
  // IMPACT: Ensures change detection matches the correct field names from documentation
  // SOLUTION: Use correct field names 'edu_start_date' and 'edu_end_date'
  const requiredFields = ['edu_level_id', 'edu_major_id', 'edu_institution_id', 'edu_start_date', 'edu_end_date'];
  const state = {};
  
  // Check if there are any changes
  const hasChanges = props.modelValue.some(r => 
    requiredFields.some(f => isFieldChanged(r, f))
  );
  
  
  if (!hasChanges) {
    validationState.value = {};
    return;
  }
  
  // For each record, check which fields are changed
  props.modelValue.forEach((record, recordIndex) => {
    const recordId = record.id_education || recordIndex;
    state[recordId] = {};
    
    requiredFields.forEach(field => {
      const isChanged = isFieldChanged(record, field);
      state[recordId][field] = isChanged;
      
    });
  });
  
  validationState.value = state;
};

// Watch for changes and update validation state
watch([() => props.editMode, () => props.modelValue, () => props.originalData], () => {
  updateValidationState();
}, { immediate: true, deep: true });

// Computed property for field classes
const getFieldClass = (record, field) => {
  
  if (!props.editMode) {
    return '';
  }
  
  if (!props.originalData || !Array.isArray(props.originalData)) {
    return '';
  }
  
  const originalRecord = props.originalData.find(orig => orig.id_education === record.id_education);
  if (!originalRecord) {
    return '';
  }
  
  const currentValue = record[field];
  const originalValue = originalRecord[field];
  const isChanged = String(currentValue || '') !== String(originalValue || '');
  
  
  return isChanged ? '' : 'border-red-500 focus:border-red-500';
};

// Get master data
const { getOptions } = useMasterData();

// Cache for master data labels
const masterDataCache = ref({
  EDU_LEVELS: [],
  EDU_INSTITUTIONS: [],
  EDU_MAJORS: []
});

// ✅ OPTIMIZED: Master data is now preloaded in layout, populate cache
onMounted(async () => {
  try {
    const [levels, institutions, majors] = await Promise.all([
      getOptions('EDU_LEVELS'),
      getOptions('EDU_INSTITUTIONS'),
      getOptions('EDU_MAJORS')
    ]);

    masterDataCache.value.EDU_LEVELS = levels || [];
    masterDataCache.value.EDU_INSTITUTIONS = institutions || [];
    masterDataCache.value.EDU_MAJORS = majors || [];
  } catch (error) {
    console.error('Error loading master data:', error);
  }
});

// Helper function to get label from master data
const getLabelFromMasterData = (category, code) => {
  if (!code) return null;

  // Convert code to string for comparison
  const codeStr = String(code);
  const data = masterDataCache.value[category] || [];

  // Try to find by code first
  let item = data.find(item => String(item.code) === codeStr);

  // If not found by code, try to find by id
  if (!item) {
    item = data.find(item => String(item.id) === codeStr);
  }

  // Return value if found, otherwise null (not the code itself)
  return item ? item.value : null;
};

// Helper methods for titles
const getEducationTitle = (record, index = 0) => {
  const levelLabel = getLabelFromMasterData('EDU_LEVELS', record.edu_level_id || record.edu_level);
  const institutionLabel = getLabelFromMasterData('EDU_INSTITUTIONS', record.edu_institution_id || record.edu_institution);

  // Check if we have valid labels (not null and not just IDs)
  const hasValidLevel = levelLabel && !levelLabel.match(/^\d+$/);
  const hasValidInstitution = institutionLabel && !institutionLabel.match(/^\d+$/);

  if (hasValidLevel && hasValidInstitution) {
    return `${levelLabel} | ${institutionLabel}`;
  } else if (hasValidLevel) {
    return levelLabel;
  } else if (hasValidInstitution) {
    return institutionLabel;
  } else {
    // Fallback to "Education 1", "Education 2", etc
    return `Education ${index + 1}`;
  }
};

const getInsertFormTitle = (form, formIdx) => {
  const levelLabel = getLabelFromMasterData('EDU_LEVELS', form.edu_level_id || form.edu_level);
  const institutionLabel = getLabelFromMasterData('EDU_INSTITUTIONS', form.edu_institution_id || form.edu_institution);

  // Check if we have valid labels (not null and not just IDs)
  const hasValidLevel = levelLabel && !levelLabel.match(/^\d+$/);
  const hasValidInstitution = institutionLabel && !institutionLabel.match(/^\d+$/);

  if (hasValidLevel && hasValidInstitution) {
    return `${levelLabel} | ${institutionLabel}`;
  } else if (hasValidLevel) {
    return levelLabel;
  } else if (hasValidInstitution) {
    return institutionLabel;
  } else {
    return `New Education Record #${formIdx + 1}`;
  }
};

// Watch for changes in insert forms to ensure modal state is correct
watch(insertForms, (newForms) => {
  // Force reactivity update for modal
  if (showUnsavedChangesModal.value) {
    nextTick(() => {
      showUnsavedChangesModal.value = true;
    });
  }
}, { deep: true });

// Methods
const startInsertFlow = () => {
  showInsertForm.value = true;
  
  // Add new insert form
  const newForm = {
    id: Date.now() + Math.random(),
    edu_level_id: "",
    edu_major_id: "",
    edu_institution_id: "",
    edu_start_date: "",
    edu_end_date: "",
    ijazah_doc: "",
    status: 1, // Default to active status (required by API)
  };
  
  insertForms.value.push(newForm);
  // Pre-generate client_key for this form id
  insertFormClientKeys.value[newForm.id] = generateClientKey();
  
  // Auto scroll to the new form after it's rendered
  nextTick(() => {
    const newFormElement = document.querySelector(`[data-form-id="${newForm.id}"]`);
    if (newFormElement) {
      newFormElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  });
};

const addInsertForm = () => {
  const newForm = {
    id: Date.now() + Math.random(),
    edu_level_id: "",
    edu_major_id: "",
    edu_institution_id: "",
    edu_start_date: "",
    edu_end_date: "",
    ijazah_doc: "",
    status: 1, // Default to active status (required by API)
  };
  
  insertForms.value.push(newForm);
  // Pre-generate client_key for this form id
  insertFormClientKeys.value[newForm.id] = generateClientKey();
  
  // Auto scroll to the new form after it's rendered
  nextTick(() => {
    const newFormElement = document.querySelector(`[data-form-id="${newForm.id}"]`);
    if (newFormElement) {
      newFormElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  });
};

const removeInsertForm = (formId) => {
  insertForms.value = insertForms.value.filter(f => f.id !== formId);
  
  // Auto exit adding mode if all forms are removed
  if (insertForms.value.length === 0) {
    showInsertForm.value = false;
  }
  // Clean client key
  delete insertFormClientKeys.value[formId];
};

const updateInsertField = (formId, key, value) => {
  const form = insertForms.value.find(f => f.id === formId);
  if (!form) return;
  
  form[key] = value;
  
  // Log untuk memastikan data yang tersimpan adalah ID
  if (key === 'edu_level_id' || key === 'edu_institution_id') {
  }
};

const showDiscardConfirmation = () => {
  
  // Simplified check - if there are any forms, show modal
  const hasUnsavedChanges = insertForms.value.length > 0;
  
  
  if (hasUnsavedChanges) {
    // Show confirmation modal
    showUnsavedChangesModal.value = true;
  } else {
    // No changes, directly reset
    handleDiscardChanges();
  }
};

const submitAllInserts = (isDraft = false) => {
  if (!hasValidInsertData.value) {
    return;
  }
  
  // Get all valid forms
  const validForms = insertForms.value.filter(form => 
    form.edu_level_id && form.edu_level_id.trim() !== '' && 
    form.edu_institution_id && form.edu_institution_id.trim() !== ''
  );
  
  if (validForms.length === 0) {
    return;
  }
  
  // Additional validation: ensure we have meaningful data
  const hasDataToSubmit = validForms.some(form => {
    const hasLevel = form.edu_level_id && form.edu_level_id.trim() !== '';
    const hasInstitution = form.edu_institution_id && form.edu_institution_id.trim() !== '';
    return hasLevel && hasInstitution;
  });
  
  if (!hasDataToSubmit) {
    return;
  }
  
  // CORRECTED: [DATE] - Using correct field names as per documentation
  // DOCUMENTATION: Field names should be 'edu_start_date' and 'edu_end_date'
  // IMPACT: Ensures field name validation matches the correct field names from documentation
  // SOLUTION: Use correct field names 'edu_start_date' and 'edu_end_date'
  // Field name validation completed
  

// Transform education data untuk API sesuai dengan struktur yang diharapkan
  const transformedData = validForms.map((form, index) => {
    
    // FIXED: [DATE] - Corrected field names to match documentation
    // ISSUE: API transformation was using 'edu_edu_start_date' and 'edu_edu_end_date'
    // IMPACT: Field names didn't match the correct form field names
    // SOLUTION: Update to use correct field names 'edu_start_date' and 'edu_end_date'
    // Format dates to DD-MM-YYYY if they exist
    let formattedStartDate = form.edu_start_date || '';
    let formattedEndDate = form.edu_end_date || '';
    
    if (formattedStartDate) {
      if (formattedStartDate.match(/^\d{2}-\d{2}-\d{4}$/)) {
      } else {
        const date = new Date(formattedStartDate);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          formattedStartDate = `${day}-${month}-${year}`;
        }
      }
    }
    
    if (formattedEndDate) {
      if (formattedEndDate.match(/^\d{2}-\d{2}-\d{4}$/)) {
      } else {
        const date = new Date(formattedEndDate);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          formattedEndDate = `${day}-${month}-${year}`;
        }
      }
    }
    
    // Force status to always be 1 for new education records
    let finalStatus = 1; // Default active status
    if (form.status === 0 || form.status === false) {
      finalStatus = 0; // Inactive
    }
    
    // FIXED: [DATE] - Conditionally include ijazah_doc_id to prevent backend validation errors
    // ISSUE: Backend validation rejects null ijazah_doc_id values
    // IMPACT: Prevents submission failure while preserving document upload functionality
    // SOLUTION: Only include ijazah_doc_id when it has a meaningful value
    // Get client_key for this form (should already be set when form was created)
    let ck = insertFormClientKeys.value[form.id];
    if (!ck) {
      console.error("❌ No client_key found for form during submit, generating new one", { formId: form.id, availableKeys: Object.keys(insertFormClientKeys.value) });
      insertFormClientKeys.value[form.id] = generateClientKey();
      ck = insertFormClientKeys.value[form.id];
    }

    const transformed = {
      edu_level_id: form.edu_level_id || '',
      edu_major_id: form.edu_major_id || '',
      edu_institution_id: form.edu_institution_id || '',
      edu_start_date: formattedStartDate,
      edu_end_date: formattedEndDate,
      client_key: ck,
      status: finalStatus, // Always a number: 0 or 1
    };
    
    // SAFE: Only include ijazah_doc_id when it has a valid value
    // This prevents null values while preserving document upload functionality
    if (form.ijazah_doc && form.ijazah_doc !== '' && form.ijazah_doc !== null) {
      transformed.ijazah_doc_id = form.ijazah_doc;
    }
    
    return transformed;
  });
  
  
  // Save form data to localStorage before opening modal (in case of page reload)
  if (process.client) {
    localStorage.setItem('educationInsertForms', JSON.stringify(insertForms.value));
  }
  
  const finalAction = isDraft ? "insert" : "insert"; // Always "insert" for new education records
  
  
  // Emit open change request modal event dengan data yang benar
  // Send transformedData directly as the data array (like family)
  emit("openChangeRequestModal", {
    currentTab: "education",
    data: transformedData, // Send as direct array for EDC category
    tab: "education",
    action: finalAction, 
    type: "insert", // Always "insert" for new education records
    isDraft: isDraft
  });
  
  // DON'T reset form here - let the modal handle it after successful submission
};

// Handle save as draft from modal
const handleSaveDraftFromModal = () => {
  showUnsavedChangesModal.value = false;
  
  // Submit current data as draft
  if (hasValidInsertData.value) {
    submitAllInserts(true); // Pass true for isDraft
  }
};

// Handle discard changes from modal
const handleDiscardChanges = () => {
  showUnsavedChangesModal.value = false;
  
  // Reset insert form completely
  insertForms.value = [];
  showInsertForm.value = false;
  
  // Clear any stored form data
  if (process.client) {
    localStorage.removeItem('educationInsertForms');
  }
};

// Handle update model value
const updateField = (index, key, value) => {
  const updated = props.modelValue.map((item, idx) => 
    idx === index ? { ...item, [key]: value } : item
  );
  
  emit('update:modelValue', updated);
};

// Remove record function
const removeRecord = (index) => {
  const updated = props.modelValue.filter((_, idx) => idx !== index);
  emit('update:modelValue', updated);
};

// Expose clearAllInserts method
const clearAllInserts = () => {
  insertForms.value = [];
  showInsertForm.value = false;
  
  // Clear any stored form data
  if (process.client) {
    localStorage.removeItem('educationInsertForms');
  }
};

// Submit edit changes
const submitEditChanges = () => {
  
  // Emit open change request modal event untuk edit mode
  // Ensure each updated record has a client_key
  const enrichedNew = (props.modelValue || []).map((item, idx) => {
    const clientKey = item?.client_key || recordClientKeys.value[idx] || generateClientKey();
    
    // FIXED: Update recordClientKeys to ensure it's available for upload
    recordClientKeys.value[idx] = clientKey;
    
    return {
      ...item,
      client_key: clientKey,
    };
  });

  emit("openChangeRequestModal", {
    currentTab: "education",
    changes: {
      education: {
        old: [], // Will be populated by parent component
        new: enrichedNew // Current edited data with client_key
      }
    },
    data: enrichedNew,
    tab: "education",
    action: "update",
    type: "update"
  });
  
};

// Pre-upload attachments on draft submit to obtain backend-generated client_key (if applicable)
// REMOVED: This was causing conflicts with the main upload listener below

// Listen for change request submission success to reset form
if (process.client) {
  window.addEventListener('changeRequestSubmitted', (event) => {
    
    // Only process education tab
    
    if (event.detail.success && event.detail.tab === 'education') {
      // After CR created, upload any selected files with client_key linkage
      const changeRequestId = event.detail.id || event.detail.data?.id_change_req || event.detail.data?.id;
      
      if (changeRequestId) {
        // Lazy import to avoid circular deps
        import('~/composables/useAttachments').then(({ useAttachments }) => {
          const { uploadAttachment } = useAttachments();
          
          // Upload edited records files
          
          // FIXED: Only process records that actually have files
          const recordsWithFiles = Object.keys(recordUploadFiles.value).filter(k => recordUploadFiles.value[k]);
          
          recordsWithFiles.forEach(async (k) => {
            const idx = Number(k);
            const file = recordUploadFiles.value[idx];
            
            // FIXED: Handle both draft save and modal submission
            // For draft save: data is sent as educationData in event.detail
            // For modal submission: data is sent as data or changes in event.detail
            let educationData = event.detail.educationData;
            if (!educationData) {
              // Try to get data from modal submission
              educationData = event.detail.data || event.detail.changes?.education?.new || event.detail.changes?.education;
            }
            
            // FIXED: Prioritize client_key from educationData (change request data) first
            let ck = null;
            if (educationData) {
              const recordData = Array.isArray(educationData) ? educationData[idx] : educationData;
              ck = recordData?.client_key;
            }
            
            // Fallback to recordClientKeys if not found in educationData
            if (!ck) {
              ck = recordClientKeys.value[idx];
            }
            
            // Final fallback to props.modelValue
            if (!ck) {
              const record = props.modelValue[idx];
              ck = record?.client_key;
            }
            
            
            if (file && ck) {
              try { 
                const result = await uploadAttachment(changeRequestId, file, ['8'], null, { client_key: ck });
                
                // FIXED: Clear the uploaded file from recordUploadFiles
                delete recordUploadFiles.value[idx];
              } catch (error) {
                console.error("❌ Record file upload failed", error);
              }
            } else {
              console.error("❌ Missing file or client_key for record upload", { file: !!file, clientKey: !!ck });
            }
          });
          
          // Upload insert forms files
          
          // FIXED: Only process insert forms that actually have files
          const insertFormsWithFiles = Object.keys(insertUploadFiles.value).filter(k => insertUploadFiles.value[k]);
          
          insertFormsWithFiles.forEach(async (k) => {
            const formId = k;
            const file = insertUploadFiles.value[formId];
            const ck = insertFormClientKeys.value[formId];
            if (!ck) {
              console.error("❌ No client_key found for insert form", { formId, availableKeys: Object.keys(insertFormClientKeys.value) });
              return;
            }
            if (file) {
              try { 
                const result = await uploadAttachment(changeRequestId, file, ['8'], null, { client_key: ck });
                
                // FIXED: Clear the uploaded file from insertUploadFiles
                delete insertUploadFiles.value[formId];
              } catch (error) {
                console.error("❌ Insert file upload failed", error);
              }
            }
          });
          
          // For draft save, check if there are files in form data that need to be uploaded
          const currentFormData = props.modelValue || [];
          
          // Check if any record has ijazah_doc that needs to be uploaded
          currentFormData.forEach(async (record, index) => {
            if (record.ijazah_doc && record.client_key) {
              
              // Note: For draft save, we would need to convert ijazah_doc (which might be a file path or ID)
              // to an actual File object for upload. This depends on how the file is stored.
              // For now, we just log the client_key that would be used.
            }
          });
        });
      }
      clearAllInserts();
    }
  });
  
  // Listen for form reset event
  window.addEventListener('formReset', (event) => {
    if (event.detail.success) {
      clearAllInserts();
    }
  });
  
  // Listen for beforeunload event to show confirmation modal
  window.addEventListener('beforeunload', (event) => {
    if (showInsertForm.value && hasValidInsertData.value) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
}

// Expose methods to parent component
defineExpose({
  clearAllInserts
});
</script>

