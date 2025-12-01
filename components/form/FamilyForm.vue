<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center">
        <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-md flex items-center justify-center mr-3">
          <i class="pi pi-users text-orange-600 dark:text-orange-400 text-lg"></i>
        </div>
        <h4 class="text-xl font-bold text-text-main">Family Members</h4>
      </div>
      <!-- Action Buttons -->
      <div class="flex gap-2 items-center">
        <!-- Info text when button is disabled -->
        <span v-if="editMode && !isEditDraftPage" class="text-xs text-grey-500 dark:text-grey-400 mr-2">
          Cannot add new member while editing existing data
        </span>

        <!-- Info text when button is disabled due to active requests -->
        <span v-if="!editMode && !canAddNewFamilyMember" class="text-xs text-orange-500 dark:text-orange-400 mr-2">
          {{ disabledReason }}
        </span>

        <!-- Add New Button - Hidden in edit page draft, disabled when editMode is true or when there are active requests -->
        <UiButton v-if="!isEditDraftPage" variant="primary" size="small" @click="startInsertFlow"
          :disabled="editMode || !canAddNewFamilyMember">
          <i class="pi pi-plus mr-2"></i>
          Add New
        </UiButton>
      </div>
    </div>

    <!-- Existing Family Members -->
    <div v-if="Array.isArray(modelValue) && modelValue.length > 0" class="space-y-6 mb-6">
      <div v-for="(member, idx) in modelValue" :key="idx"
        class="family-member-card bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700">
        <!-- Card Header -->
        <div class="flex justify-between items-center p-6">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-text-main">
              <template v-if="member.name && member.relation">
                {{ member.name }} ({{ getRelationLabel(member.relation_id || member.relation) }})

              </template>
              <template v-else-if="member.name">
                {{ member.name }}
              </template>
              <template v-else> Family Member </template>
            </span>
          </div>

          <!-- Right side: Toggle Active Status -->
          <div class="flex items-center gap-2">
            <Toggle :model-value="member.status === 1"
              @update:model-value="val => updateField(idx, 'status', val ? 1 : 0)"
              :disabled="!isFieldEditable('status', idx)" />
            <span class="text-xs text-grey-600 dark:text-grey-400">
              {{ member.status === 1 ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <!-- Form Content (Always visible, no accordion) -->
        <div class="px-6 pb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Name" type="text" :model-value="member.name"
              @update:model-value="val => updateField(idx, 'name', val)" :disabled="!isFieldEditable('name', idx)"
              :validation-rules="{
                pattern: /^[a-zA-Z\s]+$/,
                message: 'Name can only contain letters and spaces',
                required: true
              }" />
            <FormField label="Gender" type="select" :model-value="member.gender_id || member.gender"
              master-data-category="GENDER" @update:model-value="val => updateField(idx, 'gender_id', val)"
              :disabled="!isFieldEditable('gender', idx)" />

            <FormField label="Birth Date" type="date" :model-value="member.birth_date"
              @update:model-value="val => updateField(idx, 'birth_date', val)"
              :disabled="!isFieldEditable('birth_date', idx)" />
            <FormField label="Place of Birth" type="text" :model-value="member.birth_place"
              @update:model-value="val => updateField(idx, 'birth_place', val)"
              :disabled="!isFieldEditable('birth_place', idx)" :validation-rules="{
                pattern: /^[a-zA-Z\s]+$/,
                message: 'Place of birth can only contain letters and spaces'
              }" />
            <FormField label="Address" type="text" :model-value="member.address"
              @update:model-value="val => updateField(idx, 'address', val)"
              :disabled="!isFieldEditable('address', idx)" />
            <FormField label="Occupation" type="select"
              :model-value="member.occupation_id !== undefined && member.occupation_id !== null ? String(member.occupation_id) : (member.occupation || '')"
              master-data-category="FAMILY" master-data-sub-category="occupation"
              @update:model-value="val => updateField(idx, 'occupation_id', val)"
              :disabled="!isFieldEditable('occupation', idx)" :validation-rules="{ required: true }" />
            <FormField label="Relation" type="select" :model-value="member.relation_id || member.relation"
              master-data-category="FAMILY_RELATION" @update:model-value="val => updateField(idx, 'relation_id', val)"
              :disabled="!isFieldEditable('relation', idx)" />
            <FormField label="Marital Status" type="select"
              :model-value="member.marital_status_id || member.marital_status" master-data-category="MARITAL_STATUS"
              @update:model-value="val => updateField(idx, 'marital_status_id', val)"
              :disabled="!isFieldEditable('marital_status_id', idx)" />

            <FormField label="Telkomedika Card Number" type="text" :model-value="member.no_telkomedika"
              @update:model-value="val => updateField(idx, 'no_telkomedika', val)" :disabled="true"
              placeholder="Disabled" />
          </div>
        </div>
      </div>
    </div>

    <!-- KK Document Section (Separate from family member forms) -->
    <div v-if="Array.isArray(modelValue) && modelValue.length > 0" class="mt-6">
      <div class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6">
        <h5 class="font-semibold text-text-main mb-4">Family Card (KK) Document</h5>
        <FormField label="KK Document" type="file" :model-value="modelValue[0]?.kk_doc"
          @update:model-value="val => updateField(0, 'kk_doc', val)" :disabled="!isFieldEditable('kk_doc', 0)"
          accept=".jpg,.jpeg,.png,.pdf" :use-update-data-preview="true" />
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
      <div v-for="(form, formIdx) in insertForms" :key="form.id" :data-form-id="form.id"
        class="family-member-card bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <!-- Left side: Title -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <h6 class="font-semibold text-text-main">New Family Member #{{ formIdx + 1 }}</h6>
          </div>

          <!-- Right side: Action buttons -->
          <div class="flex gap-2">
            <UiButton variant="outline" size="small" @click="removeInsertForm(form.id)"
              class="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400">
              <i class="pi pi-trash mr-2"></i> Remove
            </UiButton>
          </div>
        </div>

        <!-- Form Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField label="Name" type="text" :model-value="form.name"
            @update:model-value="val => updateInsertField(form.id, 'name', val)" :validation-rules="{
              pattern: /^[a-zA-Z\s]+$/,
              message: 'Name can only contain letters and spaces',
              required: true
            }" />
          <FormField label="Gender" type="select" :model-value="form.gender_id || form.gender"
            master-data-category="GENDER" @update:model-value="val => updateInsertField(form.id, 'gender_id', val)"
            :validation-rules="{ required: true }" />
          <FormField label="Birth Date" type="date" :model-value="form.birth_date"
            @update:model-value="val => updateInsertField(form.id, 'birth_date', val)"
            :validation-rules="{ required: true }" />
          <FormField label="Place of Birth" type="text" :model-value="form.birth_place"
            @update:model-value="val => updateInsertField(form.id, 'birth_place', val)" :validation-rules="{
              pattern: /^[a-zA-Z\s]+$/,
              message: 'Place of birth can only contain letters and spaces',
              required: true
            }" />
          <FormField label="Address" type="text" :model-value="form.address"
            @update:model-value="val => updateInsertField(form.id, 'address', val)"
            :validation-rules="{ required: true }" />
          <FormField label="Occupation" type="select"
            :model-value="form.occupation_id !== undefined && form.occupation_id !== null ? String(form.occupation_id) : (form.occupation || '')"
            master-data-category="FAMILY" master-data-sub-category="occupation"
            @update:model-value="val => updateInsertField(form.id, 'occupation_id', val)"
            :validation-rules="{ required: true }" />
          <FormField label="Relation" type="select" :model-value="form.relation" master-data-category="FAMILY_RELATION"
            @update:model-value="val => updateInsertField(form.id, 'relation', val)"
            :validation-rules="{ required: true }" />
          <FormField label="Marital Status" type="select" :model-value="form.marital_status_id || form.marital_status"
            master-data-category="MARITAL_STATUS"
            @update:model-value="val => updateInsertField(form.id, 'marital_status_id', val)" />
          <FormField label="Member Sequence" type="number" :model-value="form.member_sequence"
            @update:model-value="val => updateInsertField(form.id, 'member_sequence', val)"
            @input="event => handleMemberSequenceInput(event, form.id, 'insert')" :validation-rules="{
              min: 0,
              max: 12,
              message: 'Member sequence must be between 0 and 12',
              required: true
            }" :warning-border="form.member_sequence > 12"
            :warning-message="form.member_sequence > 12 ? 'Member sequence cannot be more than 12' : ''"
            placeholder="0-12 (Required)" />
          <FormField label="Telkomedika Card Number" type="text" :model-value="form.telkomedika_card_number"
            @update:model-value="val => updateInsertField(form.id, 'telkomedika_card_number', val)" :disabled="true"
            placeholder="Disabled" />
          <FormField label="KK Document" type="file" :model-value="form.kk_doc"
            @update:model-value="val => updateInsertField(form.id, 'kk_doc', val)"
            @file-upload="file => handleKKFileUpload(form.id, file)"
            accept=".jpg,.jpeg,.png,.pdf"
            class="lg:col-span-3" :use-update-data-preview="true" />
        </div>
      </div>

      <!-- Action Buttons for Insert Forms -->
      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Left side: Add more and cancel buttons -->
        <div class="flex gap-2">
          <UiButton variant="outline" size="small" @click="addInsertForm"
            class="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400">
            <i class="pi pi-plus mr-2"></i> Add Another
          </UiButton>
          <UiButton variant="outline" size="small" @click="showDiscardConfirmation"
            class="text-grey-600 hover:text-grey-700 w-full sm:w-auto">
            <i class="pi pi-times mr-2"></i> Cancel All
          </UiButton>
        </div>

        <!-- Submit All Button - Full Width -->
        <UiButton variant="primary" size="small" @click="submitAllInserts" :disabled="!hasValidInsertData"
          class="w-full bg-primary-600 hover:bg-primary-700 border-primary-600 hover:border-primary-700">
          <i class="pi pi-check mr-2"></i> Submit All
        </UiButton>
      </div>
    </div>

    <!-- Confirmation Modal for Discard Changes -->
    <ConfirmationModal :is-open="showDiscardModal" title="Discard Changes?"
      message="You have unsaved changes. Are you sure you want to discard them? This action cannot be undone."
      confirm-text="Discard" cancel-text="Keep Editing" variant="danger" @confirm="discardChanges"
      @cancel="showDiscardModal = false" />

  </div>
</template>

<script setup>
import FormField from "./FormField.vue";
import UiButton from "~/components/ui/Button.vue";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";
import Toggle from "~/components/ui/Toggle.vue";
import { useRequestStatus } from "~/composables/useRequestStatus";
import { useMasterData } from "~/composables/useMasterData";
import { ref, computed, watch, nextTick, onMounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
    default: () => [],
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
  isEditDraftPage: {
    type: Boolean,
    default: false,
  },
  isFieldVisible: {
    type: Function,
    default: () => true,
  },
});

const emit = defineEmits(["update:modelValue", "insertRequest", "editRequest", "openChangeRequestModal"]);

// Field editability control based on formConfig
const isFieldEditable = (fieldName, memberIndex) => {
  const member = props.modelValue[memberIndex];

  if (!member) {
    return false;
  }

  // For edit page with draft or need revision status
  if (props.isEditDraftPage) {
    // Check if this is need revision status (not draft)
    const isNeedRevision = props.formConfig?.isNeedRevision || props.disableEditRevision;

    if (isNeedRevision) {
      // NEED REVISION: Only allow editing if member is marked as edited (_isEdited: true)
      // This means only members from new_data are editable
      if (member._isEdited === false) {
        return false; // Read-only for unedited members
      }

      // For edited members, also check if specific field has value in new_data
      const newData = props.formConfig?.newData || [];

      // Find member in new_data - for INSERT match by client_key, for UPDATE match by id_family
      let memberInNewData;
      if (member.id_family) {
        // UPDATE: match by id_family
        memberInNewData = newData.find(item => (item.id_family || item.id) === (member.id_family || member.id));
      } else if (member.client_key) {
        // INSERT: match by client_key
        memberInNewData = newData.find(item => item.client_key === member.client_key);
      } else {
        // Fallback: match by index
        memberInNewData = newData[memberIndex];
      }

      // For INSERT action (no id_family), all fields in new_data are editable
      if (!member.id_family) {
        return props.editMode;
      }

      // For UPDATE action, check if specific field has value in new_data
      if (memberInNewData) {
        const hasValue = memberInNewData[fieldName] !== null &&
          memberInNewData[fieldName] !== undefined &&
          memberInNewData[fieldName] !== '';
        return hasValue && props.editMode;
      }

      return props.editMode;
    } else {
      // DRAFT: All members are editable (both edited and unedited)
      return props.editMode;
    }
  }

  // Default behavior for non-edit page
  return props.editMode;
};


// Request status checking
const { canAddNewRecord, getDisabledReason } = useRequestStatus()

// Removed accordion logic - forms are now always expanded in edit page

// Master data integration
const { getOptions } = useMasterData();
const relationOptions = ref([]);

// ✅ OPTIMIZED: Relation options will be loaded when needed via getOptions
// No need to preload here as master data is already cached

// Get relation label from code
const getRelationLabel = (code) => {
  if (!code) return 'Family Member';

  const option = relationOptions.value.find(opt =>
    opt.code == code ||
    opt.id == code ||
    opt.value == code
  );

  return option ? (option.label || option.value) : code; // Use label first, fallback to value
};

// Load relation options on mount
onMounted(async () => {
  try {
    relationOptions.value = await getOptions('FAMILY_RELATION');
  } catch (error) {
    console.warn('Failed to load family relation options:', error);
  }
});

// Check if user can add new family member
const canAddNewFamilyMember = computed(() => {
  return canAddNewRecord('Family')
})

// Get disabled reason for family member
const disabledReason = computed(() => {
  return getDisabledReason('Family')
})


// Expose methods to parent component
defineExpose({
  clearAllInserts: () => {
    insertForms.value = [];
    showInsertForm.value = false;
  }
});

// Insert form state
const showInsertForm = ref(false);
const showDiscardModal = ref(false);
const insertForms = ref([]); // Array of insert forms
const insertData = ref({
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
  member_status: 1,
  kk_doc: "",
});

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
      'birth_date',
      'birth_place',
      'relation',
      'address',
      'occupation_id',
      'no_telkomedika'
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

  // Check if at least one form has KK document uploaded
  // KK document is required - at least one form must have kk_doc
  // FormField emits file.name (string) when file is selected via update:modelValue
  const hasKKDocument = insertForms.value.some(form => {
    const kkDoc = form.kk_doc;
    
    // If kk_doc is null, undefined, or empty string, no document uploaded
    // Initial value is "" (empty string), so we need to check for that
    if (kkDoc === null || kkDoc === undefined || kkDoc === '') return false;
    
    // If it's a File object, document is uploaded
    if (kkDoc instanceof File) return true;
    
    // If it's an array with files, document is uploaded
    if (Array.isArray(kkDoc) && kkDoc.length > 0) return true;
    
    // If it's a string (file name from FormField), check if it's not empty
    if (typeof kkDoc === 'string') {
      const trimmed = kkDoc.trim();
      // Empty string means no file uploaded (initial value is "")
      if (trimmed === '') return false;
      // Non-empty string means file is uploaded (FormField sends file.name)
      return true;
    }
    
    return false;
  });

  // Button enabled only if all fields are valid AND KK document is uploaded
  return allFieldsValid && hasKKDocument;
});

// Start insert flow
const startInsertFlow = () => {
  showInsertForm.value = true;

  // Add new insert form
  const newForm = {
    id: Date.now() + Math.random(),
    ...insertData.value
  };

  insertForms.value.push(newForm);
};

// Add another insert form
const addInsertForm = () => {
  const newForm = {
    id: Date.now() + Math.random(),
    ...insertData.value
  };

  insertForms.value.push(newForm);
};

// Remove insert form
const removeInsertForm = (formId) => {
  insertForms.value = insertForms.value.filter(f => f.id !== formId);

  // Auto exit adding mode if all forms are removed
  if (insertForms.value.length === 0) {
    showInsertForm.value = false;
  }
};

// Handle KK file upload - ensure file is stored
const handleKKFileUpload = (formId, file) => {
  const form = insertForms.value.find(f => f.id === formId);
  if (!form) return;
  
  // Store File object for actual upload
  form.kk_doc_file = file;
  // Ensure kk_doc has file name (FormField also emits this via update:modelValue)
  if (file && file.name) {
    form.kk_doc = file.name;
  }
};

// Update insert form field
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

// Show discard confirmation
const showDiscardConfirmation = () => {
  showDiscardModal.value = true;
};

// Discard changes
const discardChanges = () => {
  insertForms.value = [];
  showInsertForm.value = false;
  showDiscardModal.value = false;
};

// Submit single insert form
const submitSingleInsert = (formId) => {
  const form = insertForms.value.find(f => f.id === formId);
  if (!form) return;

  // Validate form data
  if (!form.name.trim() || !form.relation.trim()) {
    return;
  }

  emit("insertRequest", {
    action: "insert",
    data: [{ ...form }]
  });

  // Remove the submitted form
  insertForms.value = insertForms.value.filter(f => f.id !== formId);

  // Auto exit adding mode if all forms are removed
  if (insertForms.value.length === 0) {
    showInsertForm.value = false;
  }
};

// Submit all insert forms at once
const submitAllInserts = () => {
  if (!hasValidInsertData.value) return;

  // Get all valid forms
  const validForms = insertForms.value.filter(form =>
    form.name.trim() !== '' &&
    form.relation.trim() !== ''
  );

  if (validForms.length === 0) return;

  // Create changes structure expected by ChangeRequestModal
  const changes = {
    familyData: {
      old: [], // Empty array for insert
      new: validForms.map(form => ({ ...form }))
    }
  };

  // Emit open change request modal event
  emit("openChangeRequestModal", {
    currentTab: "family",
    changes: changes,
    data: validForms,
    tab: "family",
    action: "insert", // Always "insert" for new family members
    type: "insert"    // Always "insert" for new family members
  });
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

// Update existing member field
const updateField = (index, key, value) => {
  // Ensure we have valid data
  if (!Array.isArray(props.modelValue) || index >= props.modelValue.length) return;

  // Convert numeric fields to proper data types
  let processedValue = value;
  if (key === 'gender_id' || key === 'relation_id' || key === 'marital_status_id' || key === 'member_status' || key === 'status') {
    processedValue = value !== '' && value !== null && value !== undefined ? Number(value) : null;
  }

  const updated = props.modelValue.map((item, idx) => {
    if (idx === index) {
      const updatedItem = { ...item, [key]: processedValue };

      // Special handling: if relation_id is updated, also update relation field for consistency
      if (key === 'relation_id') {
        updatedItem.relation = processedValue;
      }

      // Special handling: if gender_id is updated, also update gender field for consistency
      if (key === 'gender_id') {
        updatedItem.gender = processedValue;
      }

      // Special handling: if marital_status_id is updated, also update marital_status field for consistency
      if (key === 'marital_status_id') {
        updatedItem.marital_status = processedValue;
      }
      // Special handling: if occupation_id is updated, also update occupation field for consistency
      if (key === 'occupation_id') {
        updatedItem.occupation = processedValue;
      }

      return updatedItem;
    }
    return item;
  });

  // Use nextTick to ensure state update is stable
  nextTick(() => {
    emit("update:modelValue", updated);
  });
};

// Watch for editMode changes from parent - simplified
watch(() => props.editMode, (newValue) => {
  if (!newValue) {
    // Reset insert form when editMode becomes false
    showInsertForm.value = false;
  }
}, { immediate: true });
</script>
