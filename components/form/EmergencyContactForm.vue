<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center">
        <div class="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-md flex items-center justify-center mr-3">
          <i class="pi pi-phone text-red-600 dark:text-red-400 text-lg"></i>
        </div>
        <h4 class="text-xl font-bold text-text-main">Emergency Contact</h4>
      </div>
      <!-- Action Buttons -->
      <div v-if="!isEditDraftPage" class="flex gap-2 items-center">
        <!-- Info text when button is disabled -->
        <span v-if="editMode" class="text-xs text-grey-500 dark:text-grey-400 mr-2">
          Cannot add new contact while editing existing data
        </span>
        
        <!-- Info text when button is disabled due to active requests -->
        <span v-if="!editMode && !canAddNewEmergencyContact" class="text-xs text-orange-500 dark:text-orange-400 mr-2">
          {{ disabledReason }}
        </span>
        
        <!-- Add New Button - Disabled when editMode is true or when there are active requests -->
        <UiButton
          variant="primary"
          size="small"
          @click="startInsertFlow"
          :disabled="editMode || !canAddNewEmergencyContact"
        >
          <i class="pi pi-plus mr-2"></i>
          Add New
        </UiButton>
      </div>
    </div>

    <!-- Existing Emergency Contacts -->
    <div v-if="Array.isArray(modelValue) && modelValue.length > 0" class="space-y-6 mb-6">
      <div v-for="(contact, idx) in modelValue" :key="idx" class="emergency-contact-card bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700">
        <!-- Card Header -->
        <div
          class="flex justify-between items-center p-6"
        >
          <div class="flex items-center gap-2">
            <span class="font-semibold text-text-main">
              <template v-if="contact.emgc_name && contact.emgc_relationship">
                {{ contact.emgc_name }} ({{ contact.emgc_relationship }})
              </template>
              <template v-else-if="contact.emgc_name">
                {{ contact.emgc_name }}
              </template>
              <template v-else> Emergency Contact </template>
            </span>

            <!-- Status Badge -->
            <span class="ml-2 px-2 py-1 rounded text-xs font-medium"
              :class="contact.status === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-grey-100 text-grey-600 dark:bg-grey-900 dark:text-grey-400'">
              {{ contact.status === 1 ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <div class="flex gap-2 items-center">
            <!-- Status Toggle - Always visible when editMode is true -->
            <Toggle
              v-if="editMode && isFieldEditable('status', idx)"
              :model-value="contact.status === 1"
              @update:model-value="val => handleToggleActive(idx, val)"
              class="mr-2"
            />
          </div>
        </div>

        <!-- Form Content (Always visible, no accordion) -->
        <div class="px-6 pb-6">
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField 
            v-if="isFieldVisible('emgc_name', idx)"
            label="Name" 
            type="text" 
            :model-value="contact.emgc_name" 
            @update:model-value="val => updateField(idx, 'emgc_name', val)" 
            :disabled="!isFieldEditable('emgc_name', idx)"
          />
          <FormField 
            v-if="isFieldVisible('emgc_relationship_id', idx)"
            label="Relationship" 
            type="select" 
            :model-value="contact.emgc_relationship_id || contact.emgc_relationship" 
            @update:model-value="val => updateField(idx, 'emgc_relationship_id', val ? Number(val) : null)" 
            :disabled="!isFieldEditable('emgc_relationship_id', idx)"
            master-data-category="FAMILY_RELATION"
            placeholder="Select relation"
          />
          <FormField 
            v-if="isFieldVisible('emgc_number', idx)"
            label="Phone Number" 
            type="tel" 
            :model-value="contact.emgc_number" 
            @update:model-value="val => updateField(idx, 'emgc_number', val)" 
            :disabled="!isFieldEditable('emgc_number', idx)"
          />
          <FormField 
            v-if="isFieldVisible('emgc_address', idx)"
            label="Address" 
            type="textarea" 
            :model-value="contact.emgc_address" 
            @update:model-value="val => updateField(idx, 'emgc_address', val)" 
            :disabled="!isFieldEditable('emgc_address', idx)" 
            class="md:col-span-2" 
            :rows="3"
          />
        </div>
        </div>
      </div>
         </div>
        
    <!-- No Emergency Contacts Message -->
    <div v-else class="text-center py-8 mb-6">
      <div class="bg-grey-50 dark:bg-grey-800 rounded-lg p-6 border border-grey-200 dark:border-grey-700">
        <i class="pi pi-phone text-4xl text-grey-400 mb-4"></i>
        <h3 class="text-lg font-semibold text-grey-600 dark:text-grey-400 mb-2">No Emergency Contacts</h3>
        <p class="text-grey-500 dark:text-grey-500 mb-4">You haven't added any emergency contacts yet.</p>
        <UiButton
          variant="primary"
          size="small"
          @click="startInsertFlow"
          :disabled="!canAddNewEmergencyContact"
        >
          <i class="pi pi-plus mr-2"></i>
          Add Emergency Contact
        </UiButton>
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
              <span class="font-semibold text-text-main">New Emergency Contact #{{ formIdx + 1 }}</span>
            </div>
           
           <!-- Right side: Action Buttons - Responsive -->
           <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
             <!-- Status Badge and Toggle Row -->
             <div class="flex items-center gap-2">
               <span class="px-2 py-1 rounded text-xs font-medium"
                 :class="form.status === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-grey-100 text-grey-600 dark:bg-grey-900 dark:text-grey-400'">
                 {{ form.status === 1 ? 'Active' : 'Inactive' }}
               </span>
               
               <!-- Status Toggle -->
               <Toggle
                 :model-value="form.status === 1"
                 @update:model-value="val => form.status = val ? 1 : 0"
               />
             </div>
             
             <!-- Remove Button -->
             <UiButton 
               variant="outline" 
               size="small" 
               @click="() => removeInsertForm(form.id)" 
               class="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400 w-full sm:w-auto"
             >
               <i class="pi pi-trash mr-2"></i> Remove
             </UiButton>
           </div>
         </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Name" type="text" v-model="form.emgc_name" placeholder="Enter contact name" />
          <FormField 
            label="Relationship" 
            type="select" 
            v-model="form.emgc_relationship_id" 
            master-data-category="FAMILY_RELATION"
            placeholder="Select relation" />
          <FormField label="Phone Number" type="tel" v-model="form.emgc_number" placeholder="Enter phone number" />
          <FormField label="Address" type="textarea" v-model="form.emgc_address" placeholder="Enter complete address" class="md:col-span-2" :rows="3" />
        </div>
      </div>
      
      <!-- Global Actions -->
       <div class="space-y-4 pt-4 border-t border-grey-200 dark:border-grey-700">
         <!-- Action Buttons Row - Responsive -->
         <div class="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
           <UiButton
             variant="outline"
             size="small"
             @click="startInsertFlow"
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
           class="w-full bg-primary-600 hover:bg-primary-700 border-primary-600 hover:border-primary-700"
         >
           <i class="pi pi-check mr-2"></i> Submit All
         </UiButton>
       </div>
    </div>

    <!-- Confirmation Modal for Discard Changes -->
    <ConfirmationModal
      :is-visible="showDiscardModal"
      title="Discard Changes?"
      message="You have unsaved changes. Are you sure you want to discard them? This action cannot be undone."
      variant="danger"
      @close="showDiscardModal = false"
      @confirm="discardChanges"
      @cancel="showDiscardModal = false"
    />
  </div>
</template>

<script setup>
import FormField from "./FormField.vue";
import UiButton from "~/components/ui/Button.vue";
import Toggle from "~/components/ui/Toggle.vue";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";
import { useRequestStatus } from "~/composables/useRequestStatus";
import { useMasterData } from "~/composables/useMasterData";
import { ref, computed, watch, nextTick } from 'vue';

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
  isEditDraftPage: {
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

const emit = defineEmits(["update:modelValue", "insertRequest", "editRequest", "openChangeRequestModal"]);

// Field visibility control based on formConfig
const isFieldVisible = (fieldName, contactIndex = 0) => {
  // Always show all fields - we'll handle visibility with accordion instead
  return true;
};

// Field editability control based on formConfig
const isFieldEditable = (fieldName, contactIndex = 0) => {
  const contact = props.modelValue[contactIndex];

  if (!contact) {
    return false;
  }

  // For edit page with draft or need revision status
  if (props.isEditDraftPage) {
    // Check if this is need revision status (not draft)
    const isNeedRevision = props.formConfig?.isNeedRevision || props.disableEditRevision;

    if (isNeedRevision) {
      // NEED REVISION: Only allow editing if contact is marked as edited (_isEdited: true)
      // This means only contacts from new_data are editable
      if (contact._isEdited === false) {
        return false; // Read-only for unedited contacts
      }

      // For edited contacts, also check if specific field has value in new_data
      const newData = props.formConfig?.newData || [];
      const contactInNewData = newData.find(item => item.id_contact === contact.id_contact);

      if (contactInNewData) {
        const hasValue = contactInNewData[fieldName] !== null &&
                        contactInNewData[fieldName] !== undefined &&
                        contactInNewData[fieldName] !== '';
        return hasValue && props.editMode;
      }

      return props.editMode;
    } else {
      // DRAFT: All contacts are editable (both edited and unedited)
      return props.editMode;
    }
  }

  // Default behavior for non-edit page
  return props.editMode;
};

// Check if field needs warning (for need revision status)
const isFieldNeedingWarning = (fieldName, contactIndex = 0) => {
  if (!props.formConfig || !props.formConfig.isNeedRevision) {
    return false;
  }
  
  // Field needs warning if it's editable (meaning it's in new_data)
  return isFieldEditable(fieldName, contactIndex);
};

// Request status checking
const { canAddNewRecord, getDisabledReason } = useRequestStatus()

// Master data for relationship lookups
const { masterData, loadMasterData } = useMasterData()

// Removed accordion logic - forms are now always expanded in edit page

// Helper function to get relationship label by ID
const getRelationshipLabel = (relationshipId) => {
  if (!relationshipId || !masterData.value.FAMILY_RELATION) return '';

  const relationshipData = masterData.value.FAMILY_RELATION;
  const relationship = relationshipData.find(item =>
    String(item.code) === String(relationshipId) ||
    String(item.id) === String(relationshipId)
  );

  return relationship ? relationship.value : '';
};

// Check if user can add new emergency contact
const canAddNewEmergencyContact = computed(() => {
  // For draft edit page, always allow adding new contacts
  if (props.isEditDraftPage) {
    return true
  }
  
  return canAddNewRecord('Emergency Contact')
})

// Get disabled reason for emergency contact
const disabledReason = computed(() => {
  return getDisabledReason('Emergency Contact')
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
  emgc_name: "",
  emgc_relationship_id: "",
  emgc_number: "",
  emgc_address: "",
  status: 1, // Default to active
});

// Start insert flow
const startInsertFlow = () => {
  showInsertForm.value = true;
  
  // Add new insert form
  const newForm = {
    id: Date.now() + Math.random(), // Unique ID
    emgc_name: "",
    emgc_relationship_id: "",
    emgc_number: "",
    emgc_address: "",
    status: 1,
  };
  
  insertForms.value.push(newForm);
  
  // Auto scroll to the new form after a short delay
  nextTick(() => {
    const newFormElement = document.querySelector(`[data-form-id="${newForm.id}"]`);
    if (newFormElement) {
      newFormElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  });
};

// Show discard confirmation
const showDiscardConfirmation = () => {
  if (hasInsertData()) {
    showDiscardModal.value = true;
  } else {
    cancelInsert();
  }
};

// Check if insert form has data
const hasInsertData = () => {
  return insertForms.value.some(form => 
    form.emgc_name.trim() !== '' || 
    form.emgc_relationship_id.trim() !== '' ||
    form.emgc_number.trim() !== '' ||
    form.emgc_address.trim() !== ''
  );
};

// Check if all insert forms have valid data
const hasValidInsertData = computed(() => {
  if (insertForms.value.length === 0) return false;
  
  return insertForms.value.every(form => {
    const name = String(form.emgc_name || '').trim();
    const number = String(form.emgc_number || '').trim();
    const relationshipId = form.emgc_relationship_id;
    
    return name !== '' && 
           number !== '' &&
           relationshipId !== null && 
           relationshipId !== undefined && 
           relationshipId !== '';
  });
});

// Discard changes
const discardChanges = () => {
  showDiscardModal.value = false;
  cancelInsert();
};

// Cancel insert
const cancelInsert = () => {
  showInsertForm.value = false;
  insertForms.value = [];
};

// Remove specific insert form
const removeInsertForm = (formId) => {
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
    form.emgc_name.trim() !== '' && 
    form.emgc_relationship_id.trim() !== '' &&
    form.emgc_number.trim() !== ''
  );
  
  if (validForms.length === 0) return;
  
  // Create changes structure expected by ChangeRequestModal
  const changes = {
    emergency_contactData: {
      old: [], // Empty array for insert
      new: validForms.map(form => ({
        ...form,
        // Ensure relationship_id is number, not string
        emgc_relationship_id: form.emgc_relationship_id ? Number(form.emgc_relationship_id) : form.emgc_relationship_id
      }))
    }
  };
  
  // Emit event to open ChangeRequestModal with proper structure
  emit("openChangeRequestModal", {
    type: "insert",
    action: "insert",
    currentTab: "emergency-contact",
    changes: changes,
    data: validForms,
    tab: "emergency-contact"
  });
};

// Update existing contact field
const updateField = (index, key, value) => {
  // Ensure we have valid data
  if (!Array.isArray(props.modelValue) || index >= props.modelValue.length) return;
  
  const updated = props.modelValue.map((item, idx) => {
    if (idx === index) {
      const updatedItem = { ...item, [key]: value };
      
      // FIXED: Handle relationship field updates for backward compatibility
      if (key === 'emgc_relationship_id') {
        // Convert to number to ensure proper data type
        updatedItem.emgc_relationship_id = value ? Number(value) : null;

        // For relationship changes, get the label from master data immediately
        if (value) {
          const relationshipLabel = getRelationshipLabel(value);
          updatedItem.emgc_relationship = relationshipLabel;
        } else {
          updatedItem.emgc_relationship = '';
        }
      }
      
      return updatedItem;
    }
    return item;
  });
  
  // Emit immediately to ensure reactivity
  emit("update:modelValue", updated);
  
  // Also trigger a nextTick update to ensure all watchers are notified
  nextTick(() => {
  });
};

// Toggle active status - only change the specific contact
const handleToggleActive = (idx, val) => {
  // Only allow toggle when editMode is true
  if (!props.editMode) return;
  
  // Ensure we have valid data
  if (!Array.isArray(props.modelValue) || idx >= props.modelValue.length) return;
  
  // FIXED: Only change the specific contact's status, keep others unchanged
  const updated = props.modelValue.map((item, i) => ({
    ...item,
    status: i === idx ? (val ? 1 : 0) : item.status // Keep other contacts' status unchanged
  }));
  
  // Emit immediately to ensure reactivity
  emit("update:modelValue", updated);
  
  // Also trigger a nextTick update to ensure all watchers are notified
  nextTick(() => {
  });
};

// Watch for editMode changes from parent - simplified
watch(() => props.editMode, (newValue) => {
  if (!newValue) {
    // Reset insert form when editMode becomes false
    showInsertForm.value = false;
    insertForms.value = [];
  }
}, { immediate: true });

// Load family relation master data on component mount
watch(() => masterData.value, async () => {
  if (!masterData.value.FAMILY_RELATION) {
    try {
      await loadMasterData('FAMILY_RELATION');
    } catch (error) {
    }
  }
}, { immediate: true });
</script>