<template>
  <div>
    <div v-if="isLoading">
      <FamilySkeleton />
    </div>
    <div v-else>
      <!-- Header with Action Buttons -->
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-md flex items-center justify-center mr-3">
            <i class="pi pi-users text-orange-600 dark:text-orange-400 text-lg"></i>
          </div>
          <h3 class="text-xl font-bold text-text-main">Family Members</h3>
        </div>
        <div class="flex items-center gap-2">
          <!-- Info text when button is disabled due to edit mode -->
          <span v-if="editMode && !showInsertForm" class="text-xs text-grey-500 dark:text-grey-400">
            Cannot add new member while editing existing data
          </span>
          
          <!-- Info text when button is disabled due to insert mode -->
          <span v-if="showInsertForm" class="text-xs text-orange-500 dark:text-orange-400">
            Cannot add new member while in insert mode
          </span>
          
          <!-- Info text when button is disabled due to tab not eligible -->
          <span v-if="!isTabEligible && !editMode && !showInsertForm" class="text-xs text-grey-500 dark:text-grey-400">
            Cannot add new member at this time
          </span>
          
          <!-- Add New Button -->
          <UiButton
            variant="primary"
            size="small"
            @click="startInsertFlow"
            :disabled="!isTabEligible || showInsertForm || editMode"
          >
            <i class="pi pi-plus mr-2"></i>
            Add Family Member
          </UiButton>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="modelValue.length === 0 && !showInsertForm" class="text-center py-12 bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700">
        <div class="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4 mx-auto">
          <i class="pi pi-users text-orange-600 dark:text-orange-400 text-2xl"></i>
        </div>
        <h4 class="text-lg font-medium text-text-main mb-2">No Family Members</h4>
        <p class="text-grey-600 dark:text-grey-400">Add family members to get started</p>
      </div>
      
      <!-- Existing Family Members -->
      <div v-else-if="modelValue.length > 0 && !showInsertForm" class="space-y-6">
        <div v-for="(member, index) in modelValue" :key="index" class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6">
          <div class="flex justify-between items-start mb-6">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mr-3">
                <span class="text-orange-600 dark:text-orange-400 font-medium text-sm">{{ index + 1 }}</span>
              </div>
              <h4 class="text-lg font-semibold text-text-main">{{ getFamilyMemberTitle(member) }}</h4>
            </div>
            <div class="flex items-center gap-3">
              <Toggle 
                :model-value="member.status === 1" 
                @update:model-value="val => updateField(index, 'status', val ? 1 : 0)" 
                :disabled="!editMode || !isTabEligible"
              />
              <!-- Command: Remove button - hidden but kept for functionality -->
              <UiButton
                v-if="false && editMode && isTabEligible"
                variant="outline"
                size="small"
                @click="() => removeFamilyMember(index)"
                class="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
              >
                <i class="pi pi-trash mr-2"></i>
                Remove
              </UiButton>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField 
              label="Name" 
              type="text" 
              :model-value="member.name" 
              @update:model-value="val => updateField(index, 'name', val)" 
              :disabled="!editMode || !isTabEligible" 
              :validation-rules="{ 
                pattern: /^[a-zA-Z\s]+$/, 
                message: 'Name can only contain letters and spaces',
                required: true
              }"
            />
            <FormField label="Gender" type="select" :model-value="member.gender_id || member.gender" master-data-category="GENDER" @update:model-value="val => updateField(index, 'gender_id', val)" :disabled="!editMode || !isTabEligible" />
            <FormField label="Birth Date" type="date" :model-value="member.birth_date" @update:model-value="val => updateField(index, 'birth_date', val)" :disabled="!editMode || !isTabEligible" />
            <FormField 
              label="Place of Birth" 
              type="text" 
              :model-value="member.birth_place" 
              @update:model-value="val => updateField(index, 'birth_place', val)" 
              :disabled="!editMode || !isTabEligible" 
              :validation-rules="{ 
                pattern: /^[a-zA-Z\s]+$/, 
                message: 'Place of birth can only contain letters and spaces' 
              }"
            />
            <FormField label="Address" type="text" :model-value="member.address" @update:model-value="val => updateField(index, 'address', val)" :disabled="!editMode || !isTabEligible" />
            <FormField 
              label="Occupation" 
              type="select" 
              :model-value="member.occupation_id !== undefined && member.occupation_id !== null ? String(member.occupation_id) : (member.occupation || '')" 
              master-data-category="FAMILY"
              master-data-sub-category="occupation"
              @update:model-value="val => updateField(index, 'occupation_id', val)" 
              :disabled="!editMode || !isTabEligible" 
              :validation-rules="{ required: true }"
            />
            <FormField label="Relation" type="select" :model-value="member.relation_id || member.relation" master-data-category="FAMILY_RELATION" @update:model-value="val => updateField(index, 'relation_id', val)" :disabled="!editMode || !isTabEligible" />
            <FormField
              label="Marital Status"
              type="select"
              :model-value="member.marital_status_id !== undefined && member.marital_status_id !== null ? String(member.marital_status_id) : (member.marital_status || '')"
              master-data-category="MARITAL_STATUS"
              @update:model-value="val => updateField(index, 'marital_status_id', val)"
              :disabled="!editMode || !isTabEligible"
            />
            
            <FormField 
              label="Telkomedika Card Number" 
              type="text" 
              :model-value="member.no_telkomedika" 
              @update:model-value="val => updateField(index, 'no_telkomedika', val)" 
              :disabled="true" 
              placeholder="Disabled" 
            />
          </div>
        </div>
      </div>
      
      <!-- Insert Forms Section - Always editable for new data -->
      <div v-if="showInsertForm" class="space-y-6">
        <!-- Section Header for Insert Forms -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-md">
          <div class="flex items-center gap-2">
            <i class="pi pi-plus-circle text-blue-600 dark:text-blue-400 text-lg"></i>
            <h5 class="font-semibold text-blue-800 dark:text-blue-200">Adding New Family Members</h5>
          </div>
          <p class="text-blue-700 dark:text-blue-300 text-sm mt-1">Fill in the forms below to add new family members</p>
        </div>
        
        <!-- Individual Insert Forms -->
        <div v-for="(form, formIdx) in insertForms" :key="form.id" :data-form-id="form.id" class="family-member-card bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <!-- Left side: Title -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-2">
              <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                {{ formIdx + 1 }}
              </span>
              <h6 class="font-semibold text-text-main">{{ getInsertFormTitle(form, formIdx + 1) }}</h6>
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
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField 
              label="Name" 
              type="text" 
              :model-value="form.name" 
              @update:model-value="val => updateInsertField(form.id, 'name', val)"
              :validation-rules="{ 
                pattern: /^[a-zA-Z\s]+$/, 
                message: 'Name can only contain letters and spaces',
                required: true
              }"
            />
            <FormField label="Gender" type="select" :model-value="form.gender_id || form.gender" master-data-category="GENDER" @update:model-value="val => updateInsertField(form.id, 'gender_id', val)" :validation-rules="{ required: true }" />
            <FormField label="Birth Date" type="date" :model-value="form.birth_date" @update:model-value="val => updateInsertField(form.id, 'birth_date', val)" :validation-rules="{ required: true }" />
            <FormField 
              label="Place of Birth" 
              type="text" 
              :model-value="form.birth_place" 
              @update:model-value="val => updateInsertField(form.id, 'birth_place', val)"
              :validation-rules="{ 
                pattern: /^[a-zA-Z\s]+$/, 
                message: 'Place of birth can only contain letters and spaces',
                required: true
              }"
            />
            <FormField label="Address" type="text" :model-value="form.address" @update:model-value="val => updateInsertField(form.id, 'address', val)" :validation-rules="{ required: true }" />
            <FormField 
              label="Occupation" 
              type="select" 
              :model-value="form.occupation_id !== undefined && form.occupation_id !== null ? String(form.occupation_id) : (form.occupation || '')" 
              master-data-category="FAMILY"
              master-data-sub-category="occupation"
              @update:model-value="val => updateInsertField(form.id, 'occupation_id', val)"
              :validation-rules="{ required: true }"
            />
            <FormField label="Relation" type="select" :model-value="form.relation_id || form.relation" master-data-category="FAMILY_RELATION" @update:model-value="val => updateInsertField(form.id, 'relation_id', val)" :validation-rules="{ required: true }" />
            <FormField
              label="Marital Status"
              type="select"
              :model-value="form.marital_status_id !== undefined && form.marital_status_id !== null ? String(form.marital_status_id) : (form.marital_status || '')"
              master-data-category="MARITAL_STATUS"
              @update:model-value="val => updateInsertField(form.id, 'marital_status_id', val)"
            />
            
            <FormField 
              label="Telkomedika Card Number" 
              type="text" 
              :model-value="form.no_telkomedika" 
              @update:model-value="val => updateInsertField(form.id, 'no_telkomedika', val)"
              :disabled="true"
              placeholder="Disabled"
            />
            
          </div>
        </div>

        <!-- KK Document Upload Section for Insert Mode -->
        <div class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6 mt-6" ref="kkDocumentSection">
          <MultiDocumentUpload
            :edit-mode="true"
            :allow-multiple="false"
            :max-size="25 * 1024 * 1024"
            accept=".jpg,.jpeg,.png,.pdf"
            :max-files="1"
            :show-type-selector="false"
            :lock-type="true"
            :lock-type-value="kkCode"
            :document-type-options="kkOnlyDocTypeOptions"
            title="KK Upload (Required)"
            :description="`Upload your <span class='text-primary-500 font-bold'>Family Card (KK)</span> document - <span class='text-red-500 font-bold'>Required before submitting</span>`"
            :ktp-type="'2'"
            ktp-label="KK"
            @filesChanged="handleKKFilesChanged"
          />
        </div>

        <!-- Global Actions -->
        <div class="space-y-4 pt-4 border-t border-grey-200 dark:border-grey-700">
          <!-- Action Buttons Row - Responsive -->
          <div class="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
            <UiButton
              variant="outline"
              size="small"
              @click="addInsertForm" 
              class="text-primary-600 hover:text-primary-700 border-blue-300 hover:border-primary-400 w-full sm:w-auto"
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
            @click="() => submitAllInserts(false)"
            :disabled="!hasValidInsertData"
            :class="[
              'w-full',
              hasValidInsertData
                ? 'bg-primary-600 hover:bg-primary-700 border-primary-600 hover:border-primary-700'
                : 'bg-grey-300 border-grey-300 text-grey-600 cursor-not-allowed pointer-events-none opacity-50'
            ]"
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
      title="You have unsaved family member data"
      message="You have filled in some information for family members. What would you like to do with your changes?"
      save-button-text="Cancel"
      continue-button-text="Discard Changes"
      @close="showUnsavedChangesModal = false"
      @save-draft="showUnsavedChangesModal = false"
      @continue="handleDiscardChanges"
    />
    
    <!-- KK Document Section -->
    <div v-if="modelValue && modelValue.length > 0" class="mt-6" ref="kkDocumentSection">
      <!-- Multi-Upload for Edit Mode -->
      <MultiDocumentUpload
        v-if="editMode"
        :edit-mode="editMode"
        :allow-multiple="false"
        :max-size="25 * 1024 * 1024"
        accept=".jpg,.jpeg,.png,.pdf"
        :max-files="1"
        :show-type-selector="false"
        :lock-type="true"
        :lock-type-value="kkCode"
        :document-type-options="kkOnlyDocTypeOptions"
        title="KK Upload"
        :description="`Upload your <span class='text-primary-500 font-bold'>Family Card (KK)</span> document (required)`"
        :ktp-type="'2'"
        ktp-label="KK"
        @filesChanged="handleKKFilesChanged"
      />

      <!-- Read-only FormField for View Mode - Hide when in insert mode -->
      <div v-else-if="!showInsertForm" class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-4">
        <h5 class="text-sm font-medium text-text-main mb-3">KK Document</h5>
        <FormField
          label="Family Card (KK) Document"
          type="file"
          :model-value="firstKkDoc"
          :disabled="true"
          accept=".jpg,.jpeg,.png,.pdf"
          file-hint="Document uploaded (view only)"
          class="lg:col-span-3"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import FamilySkeleton from '~/components/form/FamilySkeleton.vue';
import UiButton from '~/components/ui/Button.vue';
import FormField from '~/components/form/FormField.vue';
import UiConfirmationModal from '~/components/ui/ConfirmationModal.vue';
import Toggle from '~/components/ui/Toggle.vue';
import MultiDocumentUpload from '~/components/common/MultiDocumentUpload.vue';
import { ref, computed, nextTick, watch, onMounted } from 'vue';
import { useMasterData } from '~/composables/useMasterData';
import { useDocumentTypes } from '~/composables/useDocumentTypes';
import { useToast } from '~/composables/useToast';

const props = defineProps({
  modelValue: { type: Array, required: true },
  editMode: { type: Boolean, required: true },
  isLoading: { type: Boolean, required: true },
  isTabEligible: { type: Boolean, required: true },
});

const emit = defineEmits([
  'update:modelValue',
  'insert-request',
  'edit-request',
  'open-change-request-modal',
  'field-touched',
  'filesChanged'
]);

// Insert form state
const showInsertForm = ref(false);
const insertForms = ref([]);
const showUnsavedChangesModal = ref(false);

// Document upload refs
const kkDocumentSection = ref(null);
const kkUploadedFiles = ref([]);

// Document types for KK
const { documentTypes } = useDocumentTypes();
const docTypeOptions = computed(() => documentTypes.value || []);
const kkOnlyDocTypeOptions = computed(() => (documentTypes.value || []).filter(t => String(t.code) === '2'));
const kkCode = computed(() => {
  const kkType = documentTypes.value?.find(type => type.id === 2 || type.code === '2' || type.name?.toLowerCase().includes('kk'));
  return kkType?.code || '2';
});

// Master data integration
const { getOptions } = useMasterData();
const familyRelationOptions = ref([]);

// Compute first available KK document from family members
const firstKkDoc = computed(() => {
  if (!Array.isArray(props.modelValue)) return ''
  const found = props.modelValue.find(m => m && (m.kk_doc || m.kkDoc))
  return found ? (found.kk_doc || found.kkDoc) : ''
})

// Computed properties
const hasValidInsertData = computed(() => {
  // Check if there's at least one form and all forms have all required fields filled
  if (insertForms.value.length === 0) return false;
  
  // Check if all forms have required fields filled
  const allFieldsValid = insertForms.value.every(form => {
    // List of required fields for family member
    const requiredFields = [
      'name',
      'gender_id',
      'birth_place',
      'birth_date',
      'address',
      'occupation_id',
      'relation_id',
      'marital_status_id'
    ];
    
    // Check if all required fields are filled and not empty
    const fieldsValid = requiredFields.every(field => {
      const value = form[field];
      if (typeof value === 'string') {
        return value.trim() !== '';
      }
      return value !== null && value !== undefined && value !== '';
    });
    
    return fieldsValid;
  });
  
  // Check if KK document is uploaded (required)
  // KK document is uploaded via MultiDocumentUpload and stored in kkUploadedFiles
  // Access kkUploadedFiles.value to ensure reactivity
  const kkFiles = kkUploadedFiles.value;
  const hasKKDocument = Array.isArray(kkFiles) && kkFiles.length > 0;
  
  // Debug: log to see what we're checking
  console.log('🔍 hasValidInsertData check:', {
    allFieldsValid,
    hasKKDocument,
    kkUploadedFilesLength: kkFiles ? kkFiles.length : 0,
    kkUploadedFiles: kkFiles,
    insertFormsCount: insertForms.value.length,
    kkUploadedFilesRef: kkUploadedFiles.value
  });
  
  // Button enabled only if all fields are valid AND KK document is uploaded
  const result = allFieldsValid && hasKKDocument;
  console.log('🔍 Final result:', result);
  return result;
});

// Function to get relation label from ID
const getRelationLabel = (relationId) => {
  if (!relationId) return '';
  const relation = familyRelationOptions.value.find(option => 
    option.id === relationId || option.value === relationId
  );
  return relation ? relation.label : '';
};

// Helper function untuk generate title family member
const getFamilyMemberTitle = (member) => {
  if (!member) return '';
  
  const relation = getRelationLabel(member.family_relation_id);
  const name = member.name || '';
  
  if (relation && name) {
    return `${relation.toUpperCase()}`;
  } else if (relation) {
    return relation.toUpperCase();
  } else if (name) {
    return name;
  }
  
  return 'Family Member';
};

// Helper function untuk generate title insert form
const getInsertFormTitle = (form, index) => {
  if (!form) return `Family Member ${index}`;
  
  const relation = getRelationLabel(form.family_relation_id);
  const name = form.name || '';
  
  if (relation && name) {
    return `${relation.toUpperCase()}`;
  } else if (relation) {
    return relation.toUpperCase();
  } else if (name) {
    return name;
  }
  
  return `Family Member ${index}`;
};

// ✅ OPTIMIZED: Master data is now preloaded in layout, no need to load here
onMounted(async () => {
  // Master data is already preloaded in update-data layout
  // Family relation options will be loaded when needed via getOptions
});

// Watch for changes in insert forms to ensure modal state is correct
watch(insertForms, (/* newForms */) => {
  // Force reactivity update for modal when needed
  if (showUnsavedChangesModal.value) {
    nextTick(() => {
      showUnsavedChangesModal.value = true;
    });
  }
}, { deep: true });

// Methods
const startInsertFlow = async () => {
  showInsertForm.value = true;
  
  // Load family relation options if not already loaded
  if (familyRelationOptions.value.length === 0) {
    try {
      familyRelationOptions.value = await getOptions('FAMILY_RELATION');
    } catch {
      // ignore load errors - UI will fallback to textual relation
    }
  }
  
  // Add new insert form
  const newForm = {
    id: Date.now() + Math.random(),
    name: "",
    gender_id: null,
    birth_date: "",
    birth_place: "",
    address: "",
    occupation: "",
    relation: "",
    relation_id: null,
    marital_status_id: null,
    member_sequence: "",
    no_telkomedika: "",
    member_status: 1, // Default to Active status (1 = Active, 0 = Inactive)
    kk_doc: "",
    status: 1, // Default to active (required by API)
  };
  
  insertForms.value.push(newForm);
  
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
    name: "",
    gender_id: null,
    birth_date: "",
    birth_place: "",
    address: "",
    occupation: "",
    relation: "",
    relation_id: null,
    marital_status_id: null,
    member_sequence: "",
    no_telkomedika: "",
    member_status: 1, // Default to Active status (1 = Active, 0 = Inactive)
    kk_doc: "",
    status: 1, // Default to active (required by API)
  };
  
  insertForms.value.push(newForm);
  
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
};

const updateInsertField = (formId, key, value) => {
  const form = insertForms.value.find(f => f.id === formId);
  if (!form) return;
  
  // Convert numeric fields to proper data types
  let processedValue = value;
  if (key === 'gender_id' || key === 'relation_id' || key === 'marital_status_id' || key === 'member_status' || key === 'status' || key === 'occupation_id') {
    processedValue = value !== '' && value !== null && value !== undefined ? Number(value) : null;
  }
  
  form[key] = processedValue;
};

// Check if forms have any data entered
const hasFormData = () => {
  // Check if there are any forms
  if (insertForms.value.length === 0) return false;
  
  // Check if any form has data entered (not just empty/default values)
  return insertForms.value.some(form => {
    // Check if any required field has been filled
    const hasName = form.name && form.name.trim() !== '';
    const hasGender = form.gender_id !== null && form.gender_id !== undefined;
    const hasBirthDate = form.birth_date && form.birth_date.trim() !== '';
    const hasBirthPlace = form.birth_place && form.birth_place.trim() !== '';
    const hasAddress = form.address && form.address.trim() !== '';
    const hasOccupation = form.occupation_id !== null && form.occupation_id !== undefined;
    const hasRelation = form.relation_id !== null && form.relation_id !== undefined;
    const hasMaritalStatus = form.marital_status_id !== null && form.marital_status_id !== undefined;
    const hasKKDoc = form.kk_doc && form.kk_doc.trim() !== '';
    
    return hasName || hasGender || hasBirthDate || hasBirthPlace || hasAddress || 
           hasOccupation || hasRelation || hasMaritalStatus || hasKKDoc;
  }) || (Array.isArray(kkUploadedFiles.value) && kkUploadedFiles.value.length > 0);
};

const showDiscardConfirmation = () => {
  // Check if forms have any data entered
  const hasData = hasFormData();
  
  if (hasData) {
    // Show confirmation modal if there's data
    showUnsavedChangesModal.value = true;
  } else {
    // No data entered, directly exit insert mode
    handleDiscardChanges();
  }
};

const submitAllInserts = (isDraft = false) => {
  if (!hasValidInsertData.value) {
    return;
  }
  
  // Require KK document upload for family (both draft and submit), and auto-scroll
  if (!Array.isArray(kkUploadedFiles.value) || kkUploadedFiles.value.length === 0) {
    const { warning: toastWarning } = useToast();
    toastWarning('KK (Family Card) document is required. Please upload the KK document.');
    // Auto-scroll to KK upload section
    scrollToKKDocument();
    return;
  }
  
  // Get all forms that have at least basic information
  const basicValidForms = insertForms.value.filter(form => {
    const hasName = form.name && form.name.trim() !== '';
    const hasRelation = (form.relation_id || form.relation) && (form.relation_id || form.relation).toString().trim() !== '';
    
    // Minimum requirement for processing
    return hasName && hasRelation;
  });
  
  if (basicValidForms.length === 0) {
    // Allow proceed with the current forms to avoid blocking
    // Fallback to all insert forms; API-level validation will handle details
    basicValidForms.push(...insertForms.value);
  }
  
  // Check which forms have complete information for API validation
  const completeFormWarnings = [];
  const validFormsForAPI = basicValidForms.filter((form, index) => {
    const hasName = typeof form.name === 'string' && form.name.trim() !== '';
    const hasGender = form.gender_id !== null && form.gender_id !== undefined && String(form.gender_id).trim() !== '';
    const hasBirthPlace = typeof form.birth_place === 'string' && form.birth_place.trim() !== '';
    const hasBirthDate = typeof form.birth_date === 'string' && form.birth_date.trim() !== '';
    const hasAddress = typeof form.address === 'string' && form.address.trim() !== '';
    const hasOccupation = (form.occupation_id !== null && form.occupation_id !== undefined && String(form.occupation_id).trim() !== '');
    const hasRelation = (form.relation_id !== null && form.relation_id !== undefined && String(form.relation_id).trim() !== '');
    const hasMaritalStatus = (form.marital_status_id !== null && form.marital_status_id !== undefined && String(form.marital_status_id).trim() !== '');
    const isComplete = hasName && hasGender && hasBirthPlace && hasBirthDate && hasAddress && hasOccupation && hasRelation && hasMaritalStatus;
    
    if (!isComplete) {
      const missingFields = [];
      if (!hasName) missingFields.push('Name');
      if (!hasGender) missingFields.push('Gender');
      if (!hasBirthPlace) missingFields.push('Birth Place');
      if (!hasBirthDate) missingFields.push('Birth Date');
      if (!hasAddress) missingFields.push('Address');
      if (!hasOccupation) missingFields.push('Occupation');
      if (!hasRelation) missingFields.push('Relation');
      if (!hasMaritalStatus) missingFields.push('Marital Status');
      // Optional fields are not required for insert in this UI
      
      completeFormWarnings.push(`Family member ${index + 1} is missing: ${missingFields.join(', ')}`);
    }
    
    return isComplete;
  });
  
  // Proceed without blocking with confirm dialog
  
  // Use complete forms for submission, fall back to basic forms if no complete ones
  const validForms = validFormsForAPI.length > 0 ? validFormsForAPI : basicValidForms;
  
  
  // Log the original form data before transformation
  
  // Transform family data untuk API sesuai dengan struktur yang diharapkan
  const toNum = (v) => {
    // Handle 0 as a valid value, only return undefined for truly empty values
    if (v === '' || v === null || v === undefined) return undefined;
    const num = Number(v);
    return isNaN(num) ? undefined : num;
  };
  const transformedData = validForms.map(form => {
    
    // Validate and format birth date to DD-MM-YYYY format as required by API
    let formattedBirthDate = form.birth_date || '';
    if (formattedBirthDate) {
      // Check if date is already in DD-MM-YYYY format
      if (formattedBirthDate.match(/^\d{2}-\d{2}-\d{4}$/)) {
        // Already in correct format, use as is
      } else {
        // Convert from other formats to DD-MM-YYYY
        const date = new Date(formattedBirthDate);
        if (!isNaN(date.getTime())) {
          // Format as DD-MM-YYYY
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          formattedBirthDate = `${day}-${month}-${year}`;
        }
      }
    }
    
    const seqParsed = (() => {
      const seq = form.member_sequence;
      if (!seq && seq !== 0) return undefined;
      const parsed = Number(seq);
      if (Number.isNaN(parsed)) return undefined;
      return Math.max(0, Math.min(12, parsed));
    })();

    const transformed = {
      name: form.name || '',
      // IDs must be numeric - handle 0 values properly
      gender_id: toNum(form.gender_id !== undefined && form.gender_id !== null ? form.gender_id : form.gender),
      marital_status_id: toNum(form.marital_status_id !== undefined && form.marital_status_id !== null ? form.marital_status_id : form.marital_status),
      relation_id: toNum(form.relation_id !== undefined && form.relation_id !== null ? form.relation_id : form.relation),

      birth_date: formattedBirthDate,
      birth_place: form.birth_place || '',
      address: form.address || '',
      occupation_id: toNum(form.occupation_id !== undefined && form.occupation_id !== null ? form.occupation_id : form.occupation),

      // Required: status field (0 or 1)
      status: form.status !== undefined ? form.status : 1
    };

    return transformed;
  });
  
  const finalAction = "insert"; // Always "insert" for new family members
  
  
  // Emit open change request modal event dengan data yang benar
  // Send transformedData directly as the data array (not wrapped in changes)
  const payload = {
    currentTab: "family",
    data: transformedData,
    tab: "family",
    action: finalAction,
    type: finalAction,
    isDraft: isDraft
  };
  emit("open-change-request-modal", payload);
  
  // Reset form after emitting (will be handled by event listener)
};

// Handle save as draft from modal
// Handle discard changes from modal
const handleDiscardChanges = () => {
  showUnsavedChangesModal.value = false;
  
  // Reset insert form completely
  insertForms.value = [];
  showInsertForm.value = false;
  
  // Clear any stored form data
  if (process.client) {
    localStorage.removeItem('familyInsertForms');
  }
};

// Handle member sequence input with length restriction
const handleMemberSequenceInput = (event, index, type) => {
  const value = event.target.value;
  const stringValue = String(value);
  
  // If more than 2 digits, truncate to first 2 digits
  if (stringValue.length > 2) {
    const truncatedValue = stringValue.substring(0, 2);
    const numValue = Number(truncatedValue);
    
    if (type === 'insert') {
      updateInsertField(index, 'member_sequence', numValue);
    } else {
      updateField(index, 'member_sequence', numValue);
    }
  } else {
    const numValue = value === '' ? '' : Number(value);
    if (type === 'insert') {
      updateInsertField(index, 'member_sequence', numValue);
    } else {
      updateField(index, 'member_sequence', numValue);
    }
  }
};

// Handle update model value
const updateField = (index, key, value) => {
  // Convert numeric fields to proper data types
  let processedValue = value;
  if (key === 'gender_id' || key === 'relation_id' || key === 'marital_status_id' || key === 'member_status' || key === 'status') {
    processedValue = value !== '' && value !== null && value !== undefined ? Number(value) : null;
  }
  
  const updated = props.modelValue.map((item, idx) => 
    idx === index ? { ...item, [key]: processedValue } : item
  );
  emit('update:modelValue', updated);
  try {
    const idFamily = props.modelValue[index]?.id_family || props.modelValue[index]?.id;
    if (idFamily) {
      emit('field-touched', { id_family: idFamily, index, field: key });
    }
  } catch {}
};

// Handle remove family member
const removeFamilyMember = (index) => {
  const updated = props.modelValue.filter((item, idx) => idx !== index);
  emit('update:modelValue', updated);
};

// Expose clearAllInserts method
const clearAllInserts = () => {
  insertForms.value = [];
  showInsertForm.value = false;
  
  // Clear any stored form data
  if (process.client) {
    localStorage.removeItem('familyInsertForms');
  }
};

// Listen for change request submission success to reset form
if (process.client) {
  window.addEventListener('changeRequestSubmitted', (event) => {
    if (event.detail.success) {
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

// Handle KK files from MultiDocumentUpload component
const handleKKFilesChanged = (files) => {
  console.log('📁 handleKKFilesChanged called with:', files);
  kkUploadedFiles.value = Array.isArray(files) ? files : [];
  console.log('📁 kkUploadedFiles.value updated to:', kkUploadedFiles.value, 'Length:', kkUploadedFiles.value.length);
  emit('filesChanged', files);
};

// Scroll to KK document section
const scrollToKKDocument = () => {
  if (kkDocumentSection.value) {
    kkDocumentSection.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Expose methods to parent component
defineExpose({
  clearAllInserts,
  scrollToKKDocument,
  scrollToUpload: scrollToKKDocument, // Alias for consistency
  showInsertForm
});
</script>
