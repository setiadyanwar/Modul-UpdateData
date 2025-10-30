<template>
  <div>
    <div v-if="isLoading">
      <EmergencyContactSkeleton />
    </div>
    <div v-else>
      <!-- Header with Action Buttons -->
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-md flex items-center justify-center mr-3">
            <i class="pi pi-phone text-red-600 dark:text-red-400 text-lg"></i>
          </div>
          <h3 class="text-xl font-bold text-text-main">Emergency Contacts</h3>
        </div>
        <div class="flex items-center gap-2">
          <!-- Info text when button is disabled due to edit mode -->
          <span v-if="editMode && !showInsertForm" class="text-xs text-grey-500 dark:text-grey-400">
            Cannot add new contact while editing existing data
          </span>
          
          <!-- Info text when button is disabled due to insert mode -->
          <span v-if="showInsertForm" class="text-xs text-orange-500 dark:text-orange-400">
            Cannot add new contact while in insert mode
          </span>
          
          <!-- Info text when button is disabled due to tab not eligible -->
          <span v-if="!isTabEligible && !editMode && !showInsertForm" class="text-xs text-grey-500 dark:text-grey-400">
            Cannot add new contact at this time
          </span>
          
          <!-- Add New Button -->
          <UiButton
            variant="primary"
            size="small"
            @click="startInsertFlow"
            :disabled="!isTabEligible || showInsertForm || editMode"
          >
            <i class="pi pi-plus mr-2"></i>
            Add Emergency Contact
          </UiButton>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="modelValue.length === 0 && !showInsertForm" class="text-center py-12 bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700">
        <div class="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4 mx-auto">
          <i class="pi pi-phone text-red-600 dark:text-red-400 text-2xl"></i>
        </div>
        <h4 class="text-lg font-medium text-text-main mb-2">No Emergency Contacts</h4>
        <p class="text-grey-600 dark:text-grey-400">Add emergency contacts to get started</p>
      </div>
      
      <!-- Existing Emergency Contacts -->
      <div v-else-if="modelValue.length > 0 && !showInsertForm" class="space-y-6">
        <div v-for="(contact, index) in modelValue" :key="index" class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6">
          <div class="flex justify-between items-start mb-6">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-3">
                <span class="text-red-600 dark:text-red-400 font-medium text-sm">{{ index + 1 }}</span>
              </div>
              <h4 class="text-lg font-semibold text-text-main">{{ contact.emgc_name || 'Emergency Contact' }}</h4>
            </div>
            <div class="flex items-center gap-3">
              <Toggle 
                :model-value="contact.status === 1" 
                @update:model-value="val => handleToggleActive(index, val)" 
                :disabled="!editMode || !isTabEligible"
              />
              <!-- Command: Remove button - hidden but kept for functionality -->
              <UiButton
                v-if="false && editMode && isTabEligible"
                variant="outline"
                size="small"
                @click="() => removeEmergencyContact(index)"
                class="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
              >
                <i class="pi pi-trash mr-2"></i>
                Remove
              </UiButton>
            </div>
          </div>
          <!-- Row 1: Name, Phone, Relationship -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <FormField 
                label="Name" 
                type="text" 
                :model-value="contact.emgc_name" 
                @update:model-value="val => updateField(index, 'emgc_name', val)" 
                @blur="() => validateExistingName(index, String(contact.emgc_name || ''))"
                :disabled="!editMode || !isTabEligible"
                :maxlength="100"
                pattern="^[A-Za-zÀ-ÖØ-öø-ÿ'\-\.\s]{2,100}$"
                placeholder="Full name"
              />
              <p v-if="errors[index] && errors[index].emgc_name" class="mt-1 text-xs text-red-600">{{ errors[index].emgc_name }}</p>
            </div>
            <div>
              <FormField 
                label="Phone Number" 
                type="tel" 
                :model-value="contact.emgc_number" 
                @update:model-value="val => updateField(index, 'emgc_number', val)" 
                @blur="() => validateExistingPhone(index, String(contact.emgc_number || ''))"
                :disabled="!editMode || !isTabEligible"
                inputmode="tel"
                :maxlength="16"
                pattern="^(628|08)\\d{7,12}$"
                placeholder="e.g. 0812345678 / 62812345678"
              />
              <p v-if="errors[index] && errors[index].emgc_number" class="mt-1 text-xs text-red-600">{{ errors[index].emgc_number }}</p>
            </div>
            <FormField 
              label="Relationship" 
              type="select" 
              :model-value="contact.emgc_relationship_id || contact.emgc_relationship"
              @update:model-value="val => updateField(index, 'emgc_relationship_id', val ? Number(val) : null)"
              :disabled="!editMode || !isTabEligible"
              master-data-category="FAMILY_RELATION"
              placeholder="Select relation"
            />
          </div>
          <!-- Row 2: Address full width -->
          <div class="mt-4">
            <FormField 
              label="Address" 
              type="textarea" 
              :model-value="contact.emgc_address" 
              @update:model-value="val => updateField(index, 'emgc_address', val)" 
              :disabled="!editMode || !isTabEligible" 
              :rows="3"
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
            <h5 class="font-semibold text-blue-800 dark:text-blue-200">Adding New Emergency Contacts</h5>
          </div>
          <p class="text-blue-700 dark:text-blue-300 text-sm mt-1">Fill in the forms below to add new emergency contacts</p>
        </div>
        
        <!-- Individual Insert Forms -->
        <div v-for="(form, formIdx) in insertForms" :key="form.id" :data-form-id="form.id" class="emergency-contact-card bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <!-- Left side: Title -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-2">
              <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                {{ formIdx + 1 }}
              </span>
              <h6 class="font-semibold text-text-main">Emergency Contact</h6>
            </div>
            
            <!-- Right side: Toggle and Action buttons -->
            <div class="flex items-center gap-3">
              <Toggle 
                :model-value="form.active" 
                @update:model-value="val => updateInsertField(form.id, 'active', val)" 
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
          
          <!-- Row 1: Name, Phone, Relationship -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <FormField 
                label="Name" 
                type="text" 
                :model-value="form.emgc_name" 
                @update:model-value="val => updateInsertField(form.id, 'emgc_name', val)"
                @blur="() => validateInsertName(form.id, String(form.emgc_name || ''))"
                :maxlength="100"
                pattern="^[A-Za-zÀ-ÖØ-öø-ÿ'\-\.\s]{2,100}$"
                placeholder="Full name"
              />
              <p v-if="insertErrors[form.id] && insertErrors[form.id].emgc_name" class="mt-1 text-xs text-red-600">{{ insertErrors[form.id].emgc_name }}</p>
            </div>
            <div>
              <FormField 
                label="Phone Number" 
                type="tel" 
                :model-value="form.emgc_number" 
                @update:model-value="val => updateInsertField(form.id, 'emgc_number', val)"
                @blur="() => validateInsertPhone(form.id, String(form.emgc_number || ''))"
                inputmode="tel"
                :maxlength="16"
                pattern="^(628|08)\\d{7,12}$"
                placeholder="e.g. 0812345678 / 62812345678"
              />
              <p v-if="insertErrors[form.id] && insertErrors[form.id].emgc_number" class="mt-1 text-xs text-red-600">{{ insertErrors[form.id].emgc_number }}</p>
            </div>
            <FormField 
              label="Relationship" 
              type="select" 
              :model-value="form.emgc_relationship_id" 
              @update:model-value="val => updateInsertField(form.id, 'emgc_relationship_id', val ? Number(val) : null)"
              master-data-category="FAMILY_RELATION"
              placeholder="Select relation"
            />
          </div>
          <!-- Row 2: Address full width -->
          <div class="mt-4">
            <FormField label="Address" type="textarea" :model-value="form.emgc_address" @update:model-value="val => updateInsertField(form.id, 'emgc_address', val)" :rows="3" />
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
      title="You have unsaved emergency contact data"
      message="You have filled in some emergency contact information. What would you like to do with your changes?"
      save-button-text="Save as Draft"
      continue-button-text="Discard Changes"
      @close="showUnsavedChangesModal = false"
      @save-draft="handleSaveDraftFromModal"
      @continue="handleDiscardChanges"
    />
  </div>
</template>

<script setup>
import EmergencyContactSkeleton from '~/components/form/EmergencyContactSkeleton.vue';
import UiButton from '~/components/ui/Button.vue';
import FormField from '~/components/form/FormField.vue';
import UiConfirmationModal from '~/components/ui/ConfirmationModal.vue';
import Toggle from '~/components/ui/Toggle.vue';
import { ref, computed, nextTick, watch } from 'vue';


const props = defineProps({
  modelValue: { type: Array, required: true },
  editMode: { type: Boolean, required: true },
  isLoading: { type: Boolean, required: true },
  isTabEligible: { type: Boolean, required: true },
  addEmergencyContact: { type: Function, required: true },
  removeEmergencyContact: { type: Function, required: true },
  handleToggleActive: { type: Function, required: true },
});

const emit = defineEmits([
  'update:modelValue', 
  'insertRequest', 
  'openChangeRequestModal'
]);

// Insert form state
const showInsertForm = ref(false);
const insertForms = ref([]);
const showUnsavedChangesModal = ref(false);
const insertErrors = ref({}); // { [formId]: { emgc_number?: string|null, emgc_name?: string|null } }
const errors = ref([]); // for existing contacts: [{ emgc_number?: string|null, emgc_name?: string|null }]



// Computed properties
const hasValidInsertData = computed(() => {
  // First check if we have any forms at all
  if (insertForms.value.length === 0) return false;
  
  // Then check if every form has valid data
  return insertForms.value.every(form => {
    const phone = String(form.emgc_number || '').trim();
    const name = String(form.emgc_name || '').trim();
    const relationship = form.emgc_relationship_id;
    return isValidName(name) && isValidIndonesianPhone(phone) && relationship !== null && relationship !== undefined;
  });
});



// Watch for changes in insert forms to ensure modal state is correct
watch(insertForms, (newForms) => {
  // Force reactivity update for modal
  if (showUnsavedChangesModal.value) {
    nextTick(() => {
      showUnsavedChangesModal.value = true;
    });
  }
}, { deep: true });

// Watch for editMode changes to clear errors when exiting edit mode
watch(() => props.editMode, (newEditMode) => {
  if (!newEditMode) {
    // Clear existing contact validation errors when exiting edit mode
    errors.value = [];
  }
});

// Watch for showInsertForm changes to clear errors when hiding insert forms
watch(showInsertForm, (newValue) => {
  if (!newValue) {
    // Clear insert form validation errors when hiding insert forms
    insertErrors.value = {};
  }
});

// Methods
const startInsertFlow = () => {
  showInsertForm.value = true;
  
  // Add new insert form
  const newForm = {
    id: Date.now() + Math.random(),
    emgc_name: "",
    emgc_number: "",
    emgc_address: "",
    emgc_relationship_id: null,
    active: true,
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
    emgc_name: "",
    emgc_number: "",
    emgc_address: "",
    emgc_relationship_id: null,
    active: true,
  };
  
  insertForms.value.push(newForm);
  // Initialize error holder
  insertErrors.value[newForm.id] = { emgc_number: null };
  
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
  
  // Clear validation errors for the removed form
  if (insertErrors.value[formId]) {
    delete insertErrors.value[formId];
  }
  
  // Auto exit adding mode if all forms are removed
  if (insertForms.value.length === 0) {
    showInsertForm.value = false;
  }
};

const updateInsertField = (formId, key, value) => {
  const form = insertForms.value.find(f => f.id === formId);
  if (!form) return;
  
  if (key === 'emgc_number') {
    const current = String(form.emgc_number || '');
    const next = String(value || '');
    if (!canAcceptPhoneInput(current, next)) {
      // Reject invalid keystroke/update (keep previous value)
      validateInsertPhone(formId, current);
      return;
    }
    form[key] = next;
    validateInsertPhone(formId, next);
  } else {
    if (key === 'emgc_name') {
      const current = String(form.emgc_name || '');
      const next = String(value || '');
      if (!canAcceptNameInput(current, next)) {
        validateInsertName(formId, current);
        return;
      }
      form[key] = next;
      validateInsertName(formId, next);
    } else {
      form[key] = value;
    }
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
  
  // Clear all validation errors
  insertErrors.value = {};
  errors.value = [];
  
  // Force reactivity update to ensure errors are cleared
  nextTick(() => {
    insertErrors.value = {};
    errors.value = [];
  });
  
  // Clear any stored form data
  if (process.client) {
    localStorage.removeItem('emergencyContactInsertForms');
  }
};

const submitAllInserts = (isDraft = false) => {
  
  if (!hasValidInsertData.value) {
    return;
  }
  
  // Get all valid forms
  const validForms = insertForms.value.filter(form =>
    form.emgc_name.trim() !== '' &&
    form.emgc_relationship_id !== null && form.emgc_relationship_id !== undefined &&
    form.emgc_number.trim() !== ''
  );
  
  
  if (validForms.length === 0) {
    return;
  }
  
  // Additional validation: ensure we have meaningful data
  const hasDataToSubmit = validForms.some(form => {
    const hasName = form.emgc_name && form.emgc_name.trim() !== '';
    const hasPhone = form.emgc_number && form.emgc_number.trim() !== '';
    const hasRelationship = form.emgc_relationship_id !== null && form.emgc_relationship_id !== undefined;
    return hasName && hasPhone && hasRelationship;
  });
  
  if (!hasDataToSubmit) {
    return;
  }
  
  // Log the original form data before transformation
  
  // Transform emergency contact data untuk API sesuai dengan struktur yang diharapkan
  const transformedData = validForms.map(form => {
    
    const transformed = {
      emgc_name: form.emgc_name || '',
      emgc_number: form.emgc_number || '',
      emgc_address: form.emgc_address || '',
      emgc_relationship_id: form.emgc_relationship_id, // FIXED: Use emgc_relationship_id as number
      status: form.active ? 1 : 0, // Convert boolean to 0/1 for backend
      // Pastikan tidak ada id_contact atau id fields untuk insert operations
      // DO NOT include: id_contact, id, contact_id, etc.
    };
    
    return transformed;
  });
  
  // Always use "insert" for new emergency contacts, regardless of draft status
  const finalAction = "insert";
  
  
  // Emit open change request modal event dengan data yang benar
  // Send transformedData directly as the data array (like family and education)
  const emitData = {
    currentTab: "emergency-contact",
    data: transformedData, // Send as direct array for EMC category
    tab: "emergency-contact",
    action: finalAction,
    type: finalAction, // Always "insert" for new emergency contacts
    isDraft: isDraft
  };
  
  transformedData.forEach((item, index) => {
  });
  emit("openChangeRequestModal", emitData);
  
  // Reset form after emitting (will be handled by event listener)
};

// Handle update model value
const updateField = (index, key, value) => {
  // Ensure we have valid data
  if (!Array.isArray(props.modelValue) || index >= props.modelValue.length) return;
  
  let nextValue = value;
  
  // Debug untuk relationship field
  if (key === 'emgc_relationship_id') {
  }
  
  if (key === 'emgc_number') {
    const current = String(props.modelValue[index]?.emgc_number || '');
    const proposed = String(value || '');
    if (!canAcceptPhoneInput(current, proposed)) {
      // Reject invalid keystroke/update (keep previous value)
      validateExistingPhone(index, current);
      return;
    }
    nextValue = proposed;
  } else if (key === 'emgc_name') {
    const current = String(props.modelValue[index]?.emgc_name || '');
    const proposed = String(value || '');
    if (!canAcceptNameInput(current, proposed)) {
      validateExistingName(index, current);
      return;
    }
    nextValue = proposed;
  }
  
  // Create a new array to ensure reactivity
  const updated = props.modelValue.map((item, idx) => 
    idx === index ? { ...item, [key]: nextValue } : item
  );
  
  // Emit immediately to ensure reactivity
  emit('update:modelValue', updated);
  
  // Validate after update
  if (key === 'emgc_number') {
    validateExistingPhone(index, String(nextValue || ''));
  } else if (key === 'emgc_name') {
    validateExistingName(index, String(nextValue || ''));
  }
  
};

// Expose clearAllInserts method
const clearAllInserts = () => {
  insertForms.value = [];
  showInsertForm.value = false;
  
  // Clear all validation errors
  insertErrors.value = {};
  errors.value = [];
  
  // Force reactivity update to ensure errors are cleared
  nextTick(() => {
    insertErrors.value = {};
    errors.value = [];
  });
  
  // Clear any stored form data
  if (process.client) {
    localStorage.removeItem('emergencyContactInsertForms');
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

// Expose methods to parent component
defineExpose({
  clearAllInserts
});

// Validation helpers
const isValidIndonesianPhone = (raw) => {
  if (!raw) return false;
  const normalized = String(raw).replace(/\s|-/g, '');
  // Allow 628... or 08...
  const startsOk = normalized.startsWith('628') || normalized.startsWith('08');
  // Digits count
  const digitsOnly = normalized.replace(/\D/g, '');
  const lenOk = digitsOnly.length >= 10 && digitsOnly.length <= 15;
  return startsOk && lenOk;
};

// Name validation helpers
const isValidName = (raw) => {
  if (!raw) return false;
  const str = String(raw).trim();
  // Allow letters (including accents), spaces, apostrophes, hyphens, and periods. Require at least 2 characters
  return /^[A-Za-zÀ-ÖØ-öø-ÿ'\-\.\s]{2,100}$/.test(str);
};

const canAcceptNameInput = (current, next) => {
  if (next == null) return true;
  const str = String(next);
  // Allow only permitted characters while typing
  if (/[^A-Za-zÀ-ÖØ-öø-ÿ'\-\.\s]/.test(str)) return false;
  if (str.length > 100) return false;
  return true;
};

// Guard: block invalid phone input instead of sanitizing
const canAcceptPhoneInput = (current, next) => {
  if (next == null) return true;
  const str = String(next);
  // Only allow digits
  if (/[^0-9]/.test(str)) return false;
  // Progressive prefix validation (allow partial typing)
  const normalized = str;
  const allowedPrefixes = ['6', '62', '628', '0', '08'];
  const isPrefixOk =
    normalized === '' ||
    allowedPrefixes.some(p => normalized === p) ||
    normalized.startsWith('628') ||
    normalized.startsWith('08');
  if (!isPrefixOk) return false;
  // Length check 10-15 digits max
  if (normalized.length > 15) return false;
  return true;
};

const validateInsertPhone = (formId, value) => {
  // Don't validate if the form doesn't exist anymore
  const form = insertForms.value.find(f => f.id === formId);
  if (!form) return;
  
  const ok = isValidIndonesianPhone(value);
  const message = ok ? null : 'Phone must be Indonesian format (08/628) with 10-15 digits';
  if (!insertErrors.value[formId]) insertErrors.value[formId] = {};
  insertErrors.value[formId].emgc_number = message;
};

const validateExistingPhone = (index, value) => {
  const ok = isValidIndonesianPhone(value);
  const message = ok ? null : 'Phone must be Indonesian format (08/628) with 10-15 digits';
  if (!errors.value[index]) errors.value[index] = {};
  errors.value[index].emgc_number = message;
};

const validateInsertName = (formId, value) => {
  // Don't validate if the form doesn't exist anymore
  const form = insertForms.value.find(f => f.id === formId);
  if (!form) return;
  
  const ok = isValidName(value);
  const message = ok ? null : 'Name must be letters only (2-100 chars)';
  if (!insertErrors.value[formId]) insertErrors.value[formId] = {};
  insertErrors.value[formId].emgc_name = message;
};

const validateExistingName = (index, value) => {
  const ok = isValidName(value);
  const message = ok ? null : 'Name must be letters only (2-100 chars)';
  if (!errors.value[index]) errors.value[index] = {};
  errors.value[index].emgc_name = message;
};
</script>
