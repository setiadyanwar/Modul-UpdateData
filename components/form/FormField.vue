<template>
  <div class="space-y-1">
    <label
      v-if="type !== 'checkbox'"
      :for="id"
      class="block text-xs md:text-sm font-medium text-grey-700 dark:text-grey-300"
    >
      {{ label }}
    </label>

    <!-- Text Input -->
    <template v-if="type === 'text' || type === 'email' || type === 'tel'">
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        @input="handleTextInput"
        @blur="validateField"
        @keydown="handleKeyDown"
        @paste="handlePaste"
        @cut="handleCut"
        class="w-full px-2 md:px-3 py-1.5 md:py-2 border border-grey-300 dark:border-grey-600 rounded-md shadow-sm bg-white dark:bg-grey-800 text-grey-900 dark:text-grey-100 placeholder-grey-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        :class="{ 
          'border-red-500 focus:ring-red-500 focus:border-red-500': validationMessage || props.validationMessage,
          'border-yellow-400 focus:ring-yellow-400 focus:border-yellow-400': warningBorder,
          'bg-grey-100 dark:bg-grey-700 text-grey-500 dark:text-grey-400': disabled
        }"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxLength"
      />
      <!-- Validation Message (text/email/tel) -->
      <div v-if="validationMessage || props.validationMessage" class="text-xs text-red-600 dark:text-red-400 mt-1">
        {{ props.validationMessage || validationMessage }}
      </div>
      <!-- Warning Message (text/email/tel) -->
      <div v-if="warningMessage" class="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center">
        <i class="pi pi-exclamation-triangle mr-1"></i>
        {{ warningMessage }}
      </div>
    </template>

    <!-- Number Input -->
    <template v-else-if="type === 'number'">
      <input
        :id="id"
        type="number"
        :value="modelValue"
        @input="handleNumberInput"
        @blur="validateField"
        class="w-full px-2 md:px-3 py-1.5 md:py-2 border border-grey-300 dark:border-grey-600 rounded-md shadow-sm bg-white dark:bg-grey-800 text-grey-900 dark:text-grey-100 placeholder-grey-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        :placeholder="placeholder"
        :disabled="disabled"
      />
      <!-- Validation Message (number) -->
      <div v-if="validationMessage || props.validationMessage" class="text-xs text-red-600 dark:text-red-400 mt-1">
        {{ props.validationMessage || validationMessage }}
      </div>
      <!-- Warning Message (number) -->
      <div v-if="warningMessage" class="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center">
        <i class="pi pi-exclamation-triangle mr-1"></i>
        {{ warningMessage }}
      </div>
    </template>

    <!-- Select Input dengan Master Data -->
    <div v-else-if="type === 'select'">
      <ModernSelect
        :id="id"
        :model-value="modelValue"
        @update:model-value="handleSelectChange"
        :options="finalOptions"
        :placeholder="placeholder || 'Select an option'"
        :disabled="disabled"
        :loading="masterDataLoading"
        :searchable="props.searchable || masterDataSearchable"
        :warning-border="warningBorder"
        loading-style="hidden"
      />
      <!-- Validation Message (select) -->
      <div v-if="validationMessage || props.validationMessage" class="text-xs text-red-600 dark:text-red-400 mt-1">
        {{ props.validationMessage || validationMessage }}
      </div>
      
      <!-- Warning Message for Select -->
      <div v-if="warningMessage" class="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center">
        <i class="pi pi-exclamation-triangle mr-1"></i>
        {{ warningMessage }}
      </div>
    </div>

         <!-- Date Input -->
     <div v-else-if="type === 'date'">
       <ModernDatePicker
         :id="id"
         :model-value="modelValue"
         @update:model-value="handleDateChange"
         :placeholder="placeholder || 'Select date'"
         :disabled="disabled"
         format="dd-mm-yy"
         :allow-future="allowFuture"
         :min-date="minDate"
         :max-date="maxDate"
       />
       <!-- Validation Message (date) -->
       <div v-if="validationMessage || props.validationMessage" class="text-xs text-red-600 dark:text-red-400 mt-1">
         {{ props.validationMessage || validationMessage }}
       </div>
       <!-- Warning Message (date) -->
       <div v-if="warningMessage" class="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center">
         <i class="pi pi-exclamation-triangle mr-1"></i>
         {{ warningMessage }}
       </div>
     </div>



    <!-- Textarea -->
    <template v-else-if="type === 'textarea'">
      <textarea
        :id="id"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="validateField"
        :rows="rows"
        class="w-full px-2 md:px-3 py-1.5 md:py-2 border border-grey-300 dark:border-grey-600 rounded-md shadow-sm bg-white dark:bg-grey-800 text-grey-900 dark:text-grey-100 placeholder-grey-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-xs md:text-sm resize-vertical disabled:opacity-50 disabled:cursor-not-allowed"
        :placeholder="placeholder"
        :disabled="disabled"
      ></textarea>
      <!-- Validation Message (textarea) -->
      <div v-if="validationMessage || props.validationMessage" class="text-xs text-red-600 dark:text-red-400 mt-1">
        {{ props.validationMessage || validationMessage }}
      </div>
      <!-- Warning Message (textarea) -->
      <div v-if="warningMessage" class="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center">
        <i class="pi pi-exclamation-triangle mr-1"></i>
        {{ warningMessage }}
      </div>
    </template>

    <!-- Checkbox Input -->
    <div v-else-if="type === 'checkbox'" class="flex items-center">
      <Checkbox
        :id="id"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        variant="form"
        :disabled="disabled"
      />
      <span class="ml-2 block text-xs md:text-sm text-grey-700 dark:text-grey-300">
        {{ label }}
      </span>
    </div>

    <!-- File Input -->
    <div v-else-if="type === 'file'" class="space-y-2">
      <!-- Portfolio Style Document Area -->
      <div class="border-2 border-dashed border-grey-300 dark:border-grey-600 rounded-lg p-4 bg-grey-50 dark:bg-grey-900">
        <div class="flex items-center md:items-center gap-3 md:gap-4">
          <!-- Document Icon -->
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-red-100/50 dark:bg-red-100/10 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_40001075_26890)">
                  <g clip-path="url(#clip1_40001075_26890)">
                    <path d="M0 2.25C0 1.00898 1.00898 0 2.25 0H7.875V4.5C7.875 5.12227 8.37773 5.625 9 5.625H13.5V10.6875H6.1875C4.94648 10.6875 3.9375 11.6965 3.9375 12.9375V18H2.25C1.00898 18 0 16.991 0 15.75V2.25ZM13.5 4.5H9V0L13.5 4.5ZM6.1875 12.375H7.3125C8.39883 12.375 9.28125 13.2574 9.28125 14.3438C9.28125 15.4301 8.39883 16.3125 7.3125 16.3125H6.75V17.4375C6.75 17.7469 6.49687 18 6.1875 18C5.87813 18 5.625 17.7469 5.625 17.4375V15.75V12.9375C5.625 12.6281 5.87813 12.375 6.1875 12.375ZM7.3125 15.1875C7.78008 15.1875 8.15625 14.8113 8.15625 14.3438C8.15625 13.8762 7.78008 13.5 7.3125 13.5H6.75V15.1875H7.3125ZM10.6875 12.375H11.8125C12.7441 12.375 13.5 13.1309 13.5 14.0625V16.3125C13.5 17.2441 12.7441 18 11.8125 18H10.6875C10.3781 18 10.125 17.7469 10.125 17.4375V12.9375C10.125 12.6281 10.3781 12.375 10.6875 12.375ZM11.8125 16.875C12.1219 16.875 12.375 16.6219 12.375 16.3125V14.0625C12.375 13.7531 12.1219 13.5 11.8125 13.5H11.25V16.875H11.8125ZM14.625 12.9375C14.625 12.6281 14.8781 12.375 15.1875 12.375H16.875C17.1844 12.375 17.4375 12.6281 17.4375 12.9375C17.4375 13.2469 17.1844 13.5 16.875 13.5H15.75V14.625H16.875C17.1844 14.625 17.4375 14.8781 17.4375 15.1875C17.4375 15.4969 17.1844 15.75 16.875 15.75H15.75V17.4375C15.75 17.7469 15.4969 18 15.1875 18C14.8781 18 14.625 17.7469 14.625 17.4375V15.1875V12.9375Z" fill="#EF4444"/>
                  </g>
                </g>
                <defs>
                  <clipPath id="clip0_40001075_26890">
                    <rect width="18" height="18" fill="white"/>
                  </clipPath>
                  <clipPath id="clip1_40001075_26890">
                    <path d="M0 0H18V18H0V0Z" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>

          <!-- Document Status -->
          <div class="flex-1 min-w-0">
            <p v-if="!hasDocument" class="text-sm text-grey-500 dark:text-grey-400">
              No Document
            </p>
            <p v-else class="text-sm font-medium text-grey-900 dark:text-grey-100 truncate" :title="getFileName(modelValue)">
              {{ getFileName(modelValue) }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2 flex-shrink-0">

            
  
            <!-- View Button (always show when document exists, regardless of disabled state) -->
            <button
              v-if="hasDocument"
              @click="handleViewClick"
              type="button"
              class="px-2 md:px-3 py-1.5 md:py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white text-xs md:text-sm font-medium rounded-lg transition-colors duration-200 border border-primary-600 dark:border-grey-600 whitespace-nowrap"
            >
              View
            </button>
          </div>
        </div>
      </div>

      

      <div v-if="fileHint && !disabled" class="text-xs text-grey-500 dark:text-grey-300">
        {{ fileHint }}
      </div>
    </div>

    <!-- Document Preview Modal -->
    <DocumentPreviewModal
      v-if="type === 'file'"
      :is-open="showPreviewModal"
      :document-url="modelValue"
      :document-name="getFileName(modelValue)"
      :item-id="resolveItemId(modelValue)"
      @close="closePreviewModal"
    />
    
    <UpdateDataDocumentPreviewModal
      v-if="type === 'file'"
      :is-open="showUpdateDataPreviewModal"
      :parent-id="getParentIdFromModelValue()"
      :item-id="getItemIdFromModelValue()"
      :document-info="getDocumentInfo()"
      @close="closeUpdateDataPreviewModal"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, inject } from "vue";
import { useMasterData } from "~/composables/useMasterData";
import DocumentPreviewModal from "~/components/update-data/modals/DocumentPreviewModal.vue";
import UpdateDataDocumentPreviewModal from "~/components/update-data/modals/UpdateDataDocumentPreviewModal.vue";
import ModernSelect from "../ui/ModernSelect.vue";
import ModernDatePicker from "../ui/ModernDatePicker.vue";
import Checkbox from "../ui/Checkbox.vue";

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: "text",
    validator: (value) =>
      [
        "text",
        "email",
        "select",
        "date",
        "textarea",
        "file",
        "tel",
        "number",
        "checkbox",
      ].includes(value),
  },
  modelValue: {
    type: [String, Number, Boolean],
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
  options: {
    type: Array,
    default: () => [],
  },
  searchable: {
    type: Boolean,
    default: false,
  },
  masterDataCategory: {
    type: String,
    default: "",
  },
  // NEW: optional subcategory to refine master data query
  masterDataSubCategory: {
    type: String,
    default: "",
  },
  filterBy: {
    type: Object,
    default: null,
  },
  rows: {
    type: Number,
    default: 3,
  },
  accept: {
    type: String,
    default: "",
  },
  fileHint: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  maxLength: {
    type: Number,
    default: null,
  },
  minLength: {
    type: Number,
    default: null,
  },
  validationMessage: {
    type: String,
    default: "",
  },
  warningBorder: {
    type: Boolean,
    default: false,
  },
  warningMessage: {
    type: String,
    default: "",
  },
  allowFuture: {
    type: Boolean,
    default: false,
  },
  minDate: {
    type: Date,
    default: null,
  },
  maxDate: {
    type: Date,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "file-upload"]);

// Handle text input with validation
const handleTextInput = (event) => {
  let value = event.target.value;
  
  
  
  // Prevent editing for disabled Name field
  if (props.label === 'Name' && props.disabled) {
    return; // Don't allow any changes to Name field
  }
  
  // Validate KTP number (only numbers, exactly 16 characters)
  if (props.label === 'KTP Number' || props.label === 'ID Number (KTP)') {
    value = value.replace(/[^0-9]/g, ''); // Only allow numbers
    if (value.length > 16) {
      value = value.substring(0, 16); // Limit to 16 characters
    }
    // Show validation message if not exactly 16 digits
    if (value.length > 0 && value.length !== 16) {
      showValidationMessage('KTP Number must be exactly 16 digits');
    } else {
      clearValidationMessage();
    }
  }
  
  // Validate Account Number (only numbers, 10-20 characters)
  if (props.label === 'Account Number' || props.label === 'Bank Account Number') {
    
    
    value = value.replace(/[^0-9]/g, ''); // Only allow numbers
    if (value.length > 20) {
      value = value.substring(0, 20); // Limit to 20 characters
    }
    
    
    // Update input field immediately to show restriction
    if (event.target.value !== value) {
      event.target.value = value;
      
    }
    
    // Show validation message based on length
    if (value.length > 0 && value.length < 10) {
      showValidationMessage('Account number must be at least 10 digits');
      
    } else if (value.length > 20) {
      showValidationMessage('Account number cannot exceed 20 digits');
      
    } else if (value.length >= 10 && value.length <= 20) {
      clearValidationMessage();
      
    } else if (value.length === 0) {
      clearValidationMessage();
      
    }
  }

  // Validate BPJS Employment Number (only numbers, exactly 11 digits)
  if (props.label === 'BPJS Employment Number') {
    const originalValue = value
    value = value.replace(/[^0-9]/g, '')
    if (value.length > 11) {
      value = value.substring(0, 11)
    }

    // Reflect filtered value immediately
    if (event.target.value !== value) {
      event.target.value = value
    }

    if (value.length > 0 && value.length !== 11) {
      showValidationMessage('BPJS TK number must be exactly 11 digits')
    } else if (value.length === 0) {
      clearValidationMessage()
    } else {
      clearValidationMessage()
    }
  }
  
  // Validate BPJS TK Number (only numbers, exactly 11 digits)
  if (props.label === 'BPJS TK Number') {
    const originalValue = value
    value = value.replace(/[^0-9]/g, '')
    if (value.length > 11) {
      value = value.substring(0, 11)
    }

    if (event.target.value !== value) {
      event.target.value = value
    }

    // Avoid duplicate messaging; clamp only. Message shown on blur or by parent if any
  }

  // Validate BPJS Health Number (only numbers, exactly 13 digits)
  if (props.label === 'BPJS Health Number') {
    const originalValue = value
    value = value.replace(/[^0-9]/g, '')
    if (value.length > 13) {
      value = value.substring(0, 13)
    }

    if (event.target.value !== value) {
      event.target.value = value
    }

    // Avoid duplicate messaging; clamp only. Message shown on blur or by parent if any
  }
  
  // Validate NPWP Number (only numbers, exactly 15 digits, with auto-formatting)
  if (props.label === 'NPWP Number') {
    
    
    // Remove all non-numeric characters first
    const numericValue = value.replace(/[^0-9]/g, '');
    
    
    // Limit to 15 digits max
    const limitedValue = numericValue.substring(0, 15);
    
    // Apply NPWP formatting progressively
    let formattedValue = limitedValue;
    if (limitedValue.length === 15) {
      formattedValue = limitedValue.replace(/(\d{2})(\d{3})(\d{3})(\d{1})(\d{3})(\d{3})/, '$1.$2.$3.$4-$5.$6');
      clearValidationMessage();
      
    } else if (limitedValue.length >= 9) {
      formattedValue = limitedValue.replace(/(\d{2})(\d{3})(\d{3})(\d*)/, '$1.$2.$3.$4');
      if (limitedValue.length > 0) {
        showValidationMessage('NPWP number must be exactly 15 digits');
        
      }
    } else if (limitedValue.length >= 6) {
      formattedValue = limitedValue.replace(/(\d{2})(\d{3})(\d*)/, '$1.$2.$3');
      if (limitedValue.length > 0) {
        showValidationMessage('NPWP number must be exactly 15 digits');
        
      }
    } else if (limitedValue.length >= 3) {
      formattedValue = limitedValue.replace(/(\d{2})(\d*)/, '$1.$2');
      if (limitedValue.length > 0) {
        showValidationMessage('NPWP number must be exactly 15 digits');
        
      }
    } else {
      if (limitedValue.length > 0) {
        showValidationMessage('NPWP number must be exactly 15 digits');
        
      } else {
        clearValidationMessage();
        
      }
    }
    
    value = formattedValue;
    
    // Update the input field immediately to show formatting
    if (event.target.value !== formattedValue) {
      event.target.value = formattedValue;
    }
  }
  
  // Validate phone numbers (Indonesian phone format) - Only allow digits
  if (props.type === 'tel') {
    
    
    // Only allow digits for Indonesian phone numbers
    const hasInvalidChars = /[^0-9]/.test(value);
    if (hasInvalidChars) {
      // Remove all non-digit characters
      value = value.replace(/[^0-9]/g, '');
      // Update the input field to show only valid characters
      event.target.value = value;
      
    }
    
    if (value.length > 15) { // Allow up to 15 digits
      value = value.substring(0, 15);
      event.target.value = value;
    }
    
    // Validate Indonesian phone number format
    if (value.length > 0) {
      // Must start with 08 or 628 for mobile numbers
      const validPrefixes = /^(08|628)/;
      
      
      if (!validPrefixes.test(value)) {
        showValidationMessage('Phone number must start with 08 or 628');
      } else if (value.length > 15) {
        showValidationMessage('Phone number must not exceed 15 digits');
        
      } else {
        clearValidationMessage();
        
      }
    } else {
      clearValidationMessage();
      
    }
  }
  
  // Validate email addresses
  if (props.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (value.length > 0) {
      // Basic email format validation
      if (!emailRegex.test(value)) {
        showValidationMessage('Please enter a valid email address');
      } else {
        const domain = value.split('@')[1]?.toLowerCase();
        
        // Business email validation (must be sigma.co.id)
        if (props.label === 'Business Email') {
          if (domain !== 'sigma.co.id') {
            showValidationMessage('Business email must use sigma.co.id domain');
          } else {
            clearValidationMessage();
          }
        }
        // Private email validation
        else if (props.label === 'Private Email') {
          const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];
          const forbiddenDomains = ['sigma.co.id'];
          
          if (forbiddenDomains.includes(domain)) {
            showValidationMessage('Private email cannot use sigma.co.id domain');
          } else if (!allowedDomains.includes(domain)) {
            showValidationMessage('Private email must use gmail.com, outlook.com, yahoo.com, or hotmail.com');
          } else {
            clearValidationMessage();
          }
        } else {
          clearValidationMessage();
        }
      }
    } else {
      clearValidationMessage();
    }
  }
  
  // Validate RT field (only numbers, max 3 digits)
  if (props.label === 'RT') {
    const originalValue = value;
    value = value.replace(/[^0-9]/g, ''); // Only allow numbers
    if (value.length > 3) {
      value = value.substring(0, 3); // Limit to 3 characters
    }
    
    // Update input field immediately to show restriction
    if (event.target.value !== value) {
      event.target.value = value;
    }
    
    // Show validation message if non-numeric characters were removed
    if (originalValue !== value && originalValue.length > 0) {
      showValidationMessage('RT must contain only numbers');
    } else if (value.length === 0) {
      // Clear validation message when field is empty
      clearValidationMessage();
    } else {
      // Clear validation message for valid input
      clearValidationMessage();
    }
  }
  
  // Validate RW field (only numbers, max 3 digits)
  if (props.label === 'RW') {
    const originalValue = value;
    value = value.replace(/[^0-9]/g, ''); // Only allow numbers
    if (value.length > 3) {
      value = value.substring(0, 3); // Limit to 3 characters
    }
    
    // Update input field immediately to show restriction
    if (event.target.value !== value) {
      event.target.value = value;
    }
    
    // Show validation message if non-numeric characters were removed
    if (originalValue !== value && originalValue.length > 0) {
      showValidationMessage('RW must contain only numbers');
    } else if (value.length === 0) {
      // Clear validation message when field is empty
      clearValidationMessage();
    } else {
      // Clear validation message for valid input
      clearValidationMessage();
    }
  }
  
  // House Number field - allow letters and numbers (VARCHAR support)
  if (props.label === 'House Number') {
    // No character restrictions - allow letters and numbers
    // Length limit is handled by maxLength prop in the input field
    clearValidationMessage();
  }
  
  // Validate Postal Code field (only numbers, max 5 digits)
  if (props.label === 'Postal Code') {
    const originalValue = value;
    value = value.replace(/[^0-9]/g, ''); // Only allow numbers
    if (value.length > 5) {
      value = value.substring(0, 5); // Limit to 5 characters
    }
    
    // Update input field immediately to show restriction
    if (event.target.value !== value) {
      event.target.value = value;
    }
    
    // Show validation message if non-numeric characters were removed
    if (originalValue !== value && originalValue.length > 0) {
      showValidationMessage('Postal code must contain only numbers');
    } else if (value.length === 0) {
      // Clear validation message when field is empty
      clearValidationMessage();
    } else {
      // Clear validation message for valid input
      clearValidationMessage();
    }
  }

  // Validate Name field (only letters and spaces)
  if (props.label === 'Name') {
    const originalValue = value;
    value = value.replace(/[^a-zA-Z\s]/g, ''); // Only allow letters and spaces
    
    // Update input field immediately to show restriction
    if (event.target.value !== value) {
      event.target.value = value;
    }
    
    // Show validation message if non-letter characters were removed
    if (originalValue !== value && originalValue.length > 0) {
      showValidationMessage('Name can only contain letters and spaces');
    } else if (value.length === 0) {
      // Clear validation message when field is empty
      clearValidationMessage();
    } else {
      // Clear validation message for valid input
      clearValidationMessage();
    }
  }
  
  // Validate Place of Birth field (only letters and spaces)
  if (props.label === 'Place of Birth') {
    const originalValue = value;
    value = value.replace(/[^a-zA-Z\s]/g, ''); // Only allow letters and spaces
    
    // Update input field immediately to show restriction
    if (event.target.value !== value) {
      event.target.value = value;
    }
    
    // Show validation message if non-letter characters were removed
    if (originalValue !== value && originalValue.length > 0) {
      showValidationMessage('Place of birth can only contain letters and spaces');
    } else if (value.length === 0) {
      // Clear validation message when field is empty
      clearValidationMessage();
    } else {
      // Clear validation message for valid input
      clearValidationMessage();
    }
  }
  
  // Validate Telkomedika Card Number (only numbers, 10-15 digits)
  if (props.label === 'Telkomedika Card Number') {
    const originalValue = value;
    value = value.replace(/[^0-9]/g, ''); // Only allow numbers
    if (value.length > 15) {
      value = value.substring(0, 15); // Limit to 15 characters
    }
    
    // Update input field immediately to show restriction
    if (event.target.value !== value) {
      event.target.value = value;
    }
    
    // Show validation message based on length
    if (value.length > 0 && value.length < 10) {
      showValidationMessage('Telkomedika card number must be 10-15 digits');
    } else if (value.length > 15) {
      showValidationMessage('Telkomedika card number cannot exceed 15 digits');
    } else if (value.length >= 10 && value.length <= 15) {
      clearValidationMessage();
    } else if (value.length === 0) {
      // Clear validation message when field is empty
      clearValidationMessage();
    } else {
      // Show validation message if non-numeric characters were removed
      if (originalValue !== value && originalValue.length > 0) {
        showValidationMessage('Telkomedika card number must contain only numbers');
      }
    }
  }
  
  // Validate passport number (alphanumeric, 6-12 characters)
  if (props.label === 'Passport Number') {
    value = value.replace(/[^a-zA-Z0-9]/g, ''); // Only allow alphanumeric characters
    if (value.length > 12) {
      value = value.substring(0, 12); // Limit to 12 characters
    }
    // Show validation message if length is not within range
    if (value.length > 0 && (value.length < 6 || value.length > 12)) {
      showValidationMessage('Passport number must be between 6-12 characters');
    } else {
      clearValidationMessage();
    }
  }
  
  // Validate Postal Code (Indonesian 5-digit format)
  if (props.label && props.label.includes('Postal Code')) {
    value = value.replace(/[^0-9]/g, ''); // Only allow numbers
    if (value.length > 5) {
      value = value.substring(0, 5); // Limit to 5 characters
    }
    // Show validation message if not exactly 5 digits when filled
    if (value.length > 0 && value.length !== 5) {
      showValidationMessage('Postal code must be exactly 5 digits');
    } else {
      clearValidationMessage();
    }
  }
  
  // Validate RT/RW (1-3 digits)
  if (props.label === 'RT' || props.label === 'RW') {
    value = value.replace(/[^0-9]/g, ''); // Only allow numbers
    if (value.length > 3) {
      value = value.substring(0, 3); // Limit to 3 characters
    }
    // Show validation message if invalid length when filled
    if (value.length > 0 && (value.length < 1 || value.length > 3)) {
      showValidationMessage('RT/RW must be 1-3 digits');
    } else {
      clearValidationMessage();
    }
  }
  
  // Generic min/max length validation (skip for KTP as it has specific validation)
  if ((props.label !== 'KTP Number' && props.label !== 'ID Number (KTP)')) {
    if (props.minLength && value.length > 0 && value.length < props.minLength) {
      showValidationMessage(`${props.label} must be at least ${props.minLength} characters`);
    } else if (props.maxLength && value.length > props.maxLength) {
      showValidationMessage(`${props.label} must not exceed ${props.maxLength} characters`);
    } else if (!validationMessage.value) {
      clearValidationMessage();
    }
  }
  
  emit('update:modelValue', value);
};

// Handle number input with soft validation and clamping when min/max provided via attributes
const handleNumberInput = (event) => {
  let value = event.target.value
  // strip non-digits (allow '-') only at beginning if needed later, here we enforce digits only
  value = value.replace(/[^0-9]/g, '')

  // Read min/max if present on element attributes (provided by parent usage)
  const minAttr = event.target.getAttribute('min')
  const maxAttr = event.target.getAttribute('max')
  const hasMin = minAttr !== null && minAttr !== ''
  const hasMax = maxAttr !== null && maxAttr !== ''
  const minVal = hasMin ? parseInt(minAttr) : undefined
  const maxVal = hasMax ? parseInt(maxAttr) : undefined

  // Clamp if numeric
  if (value !== '') {
    let n = parseInt(value)
    if (!Number.isNaN(n)) {
      if (hasMin && n < minVal) n = minVal
      if (hasMax && n > maxVal) n = maxVal
      value = String(n)
    }
  }

  if (event.target.value !== value) {
    event.target.value = value
  }

  // Convert to number for numeric fields
  const numericValue = value === '' ? null : parseFloat(value);
  emit('update:modelValue', numericValue)

  // Show inline validation message if out of range after parsing
  if (value !== '') {
    const n = parseInt(value)
    if ((hasMin && n < minVal) || (hasMax && n > maxVal)) {
      if (hasMin && hasMax) {
        showValidationMessage(`Value must be between ${minVal} and ${maxVal}`)
      } else if (hasMin) {
        showValidationMessage(`Value must be at least ${minVal}`)
      } else if (hasMax) {
        showValidationMessage(`Value must be at most ${maxVal}`)
      }
    } else {
      clearValidationMessage()
    }
  } else {
    clearValidationMessage()
  }
}

// Validation message state
const validationMessage = ref('');

const showValidationMessage = (message) => {
  validationMessage.value = message;
  
};

const clearValidationMessage = () => {
  validationMessage.value = '';
  
};

// Validate field on blur for additional validation
const validateField = () => {
  const value = props.modelValue;
  
  // Phone number validation on blur
  if (props.type === 'tel' && value && value.length > 0) {
    const validPrefixes = /^(08|628)/;
    if (!validPrefixes.test(value)) {
      showValidationMessage('Phone number must start with 08 or 628');
      return false;
    }
    if (value.length > 15) {
      showValidationMessage('Phone number must not exceed 15 digits');
      return false;
    }
  }
  
  // Email validation on blur
  if (props.type === 'email' && value && value.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      showValidationMessage('Please enter a valid email address');
      return false;
    }
    
    const domain = value.split('@')[1]?.toLowerCase();
    
    // Business email validation
    if (props.label === 'Business Email') {
      if (domain !== 'sigma.co.id') {
        showValidationMessage('Business email must use sigma.co.id domain');
        return false;
      }
    }
    // Private email validation
    else if (props.label === 'Private Email') {
      const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];
      const forbiddenDomains = ['sigma.co.id'];
      
      if (forbiddenDomains.includes(domain)) {
        showValidationMessage('Private email cannot use sigma.co.id domain');
        return false;
      } else if (!allowedDomains.includes(domain)) {
        showValidationMessage('Private email must use gmail.com, outlook.com, yahoo.com, or hotmail.com');
        return false;
      }
    }
  }
  
  // KTP number validation on blur
  if ((props.label === 'KTP Number' || props.label === 'ID Number (KTP)') && value && value.length > 0) {
    if (value.length !== 16) {
      showValidationMessage('KTP Number must be exactly 16 digits');
      return false;
    }
    if (!/^[0-9]+$/.test(value)) {
      showValidationMessage('KTP Number can only contain numbers');
      return false;
    }
  }
  
  // BPJS TK Number exact length on blur
  if (props.label === 'BPJS TK Number' && value && value.length > 0) {
    const numeric = String(value).replace(/[^0-9]/g, '')
    if (numeric.length !== 11) {
      showValidationMessage('BPJS TK number must be exactly 11 digits');
      return false;
    }
  }
  
  // BPJS Health Number exact length on blur
  if (props.label === 'BPJS Health Number' && value && value.length > 0) {
    const numeric = String(value).replace(/[^0-9]/g, '')
    if (numeric.length !== 13) {
      showValidationMessage('BPJS Health number must be exactly 13 digits');
      return false;
    }
  }
  
  // Account number validation on blur
  if (props.label === 'Account Number' && value && value.length > 0) {
    if (value.length < 10) {
      showValidationMessage('Account number must be at least 10 digits');
      return false;
    }
    if (value.length > 20) {
      showValidationMessage('Account number cannot exceed 20 digits');
      return false;
    }
    if (!/^[0-9]+$/.test(value)) {
      showValidationMessage('Account number can only contain numbers');
      return false;
    }
  }
  
  // NPWP number validation on blur
  if (props.label === 'NPWP Number' && value && value.length > 0) {
    // Remove formatting to check actual digits
    const cleanNPWP = value.replace(/[.\s-]/g, '');
    if (cleanNPWP.length !== 15) {
      showValidationMessage('NPWP number must be exactly 15 digits');
      return false;
    }
    if (!/^[0-9]+$/.test(cleanNPWP)) {
      showValidationMessage('NPWP number can only contain numbers');
      return false;
    }
  }
  
  // Passport number validation on blur
  if (props.label === 'Passport Number' && value && value.length > 0) {
    if (value.length < 6 || value.length > 12) {
      showValidationMessage('Passport number must be between 6-12 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9]+$/.test(value)) {
      showValidationMessage('Passport number can only contain letters and numbers');
      return false;
    }
  }
  
  return true;
};

// Handle select change with validation
const handleSelectChange = (value) => {
  
  emit('update:modelValue', value);
  validateField();
};

// Handle date change with validation
const handleDateChange = (value) => {
  emit('update:modelValue', value);
  validateField();
};


// Handle keydown events to prevent editing disabled fields and non-numeric input for phone
const handleKeyDown = (event) => {
  // Prevent any key input for disabled Name field
  if (props.label === 'Name' && props.disabled) {
    event.preventDefault();
    return false;
  }
  
  // Prevent non-numeric input for phone numbers and KTP
  if (props.type === 'tel' || props.label === 'KTP Number' || props.label === 'ID Number (KTP)') {
    const key = event.key;
    let allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    
    if (!allowedKeys.includes(key)) {
      event.preventDefault();
      return false;
    }
  }
  
  // Prevent non-numeric input for BPJS Employment Number as well
  if (props.label === 'BPJS Employment Number') {
    const key = event.key
    const allowedKeys = ['0','1','2','3','4','5','6','7','8','9','Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End']
    if (!allowedKeys.includes(key)) {
      event.preventDefault()
      return false
    }
  }
  
  // Prevent non-numeric input for BPJS TK and BPJS Health
  if (props.label === 'BPJS TK Number' || props.label === 'BPJS Health Number') {
    const key = event.key
    const allowedKeys = ['0','1','2','3','4','5','6','7','8','9','Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End']
    if (!allowedKeys.includes(key)) {
      event.preventDefault()
      return false
    }
  }

  // Prevent numeric input for Birth Place
  if (props.label === 'Birth Place') {
    const key = event.key;
    const numericKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    if (numericKeys.includes(key)) {
      event.preventDefault();
      return false;
    }
  }
  
  // Allow only alphanumeric for Passport Number
  if (props.label === 'Passport Number') {
    const key = event.key;
    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    
    if (!allowedKeys.includes(key)) {
      event.preventDefault();
      return false;
    }
  }
};

// Handle paste events to prevent editing disabled fields and non-numeric input for phone
const handlePaste = (event) => {
  // Prevent paste for disabled Name field
  if (props.label === 'Name' && props.disabled) {
    event.preventDefault();
    return false;
  }
  
  // For phone numbers and KTP, only allow numeric content
  if (props.type === 'tel' || props.label === 'KTP Number' || props.label === 'ID Number (KTP)') {
    const pastedText = (event.clipboardData || window.clipboardData).getData('text');
    
    // Only allow digits for all phone numbers and KTP
    let allowedContent = pastedText.replace(/[^0-9]/g, '');
    
    if (allowedContent !== pastedText) {
      event.preventDefault();
      // Insert only allowed characters
      const target = event.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const currentValue = target.value;
      const newValue = currentValue.substring(0, start) + allowedContent + currentValue.substring(end);
      
      // Update the input value
      target.value = newValue;
      target.setSelectionRange(start + allowedContent.length, start + allowedContent.length);
      
      // Emit the change
      emit('update:modelValue', newValue);
      return false;
    }
  }
  
  // For BPJS Employment Number: allow only digits and clamp to 11 on paste
  if (props.label === 'BPJS Employment Number') {
    const pastedText = (event.clipboardData || window.clipboardData).getData('text')
    let allowedContent = pastedText.replace(/[^0-9]/g, '').substring(0, 11)
    if (allowedContent !== pastedText) {
      event.preventDefault()
      const target = event.target
      const start = target.selectionStart
      const end = target.selectionEnd
      const currentValue = target.value
      const newValueRaw = currentValue.substring(0, start) + allowedContent + currentValue.substring(end)
      const newValue = newValueRaw.replace(/[^0-9]/g, '').substring(0, 11)
      target.value = newValue
      target.setSelectionRange(Math.min(start + allowedContent.length, 11), Math.min(start + allowedContent.length, 11))
      emit('update:modelValue', newValue)
      return false
    }
  }

  // For BPJS TK Number: allow only digits and clamp to 11 on paste
  if (props.label === 'BPJS TK Number') {
    const pastedText = (event.clipboardData || window.clipboardData).getData('text')
    let allowedContent = pastedText.replace(/[^0-9]/g, '').substring(0, 11)
    if (allowedContent !== pastedText) {
      event.preventDefault()
      const target = event.target
      const start = target.selectionStart
      const end = target.selectionEnd
      const currentValue = target.value
      const newValueRaw = currentValue.substring(0, start) + allowedContent + currentValue.substring(end)
      const newValue = newValueRaw.replace(/[^0-9]/g, '').substring(0, 11)
      target.value = newValue
      target.setSelectionRange(Math.min(start + allowedContent.length, 11), Math.min(start + allowedContent.length, 11))
      emit('update:modelValue', newValue)
      return false
    }
  }

  // For BPJS Health Number: allow only digits and clamp to 13 on paste
  if (props.label === 'BPJS Health Number') {
    const pastedText = (event.clipboardData || window.clipboardData).getData('text')
    let allowedContent = pastedText.replace(/[^0-9]/g, '').substring(0, 13)
    if (allowedContent !== pastedText) {
      event.preventDefault()
      const target = event.target
      const start = target.selectionStart
      const end = target.selectionEnd
      const currentValue = target.value
      const newValueRaw = currentValue.substring(0, start) + allowedContent + currentValue.substring(end)
      const newValue = newValueRaw.replace(/[^0-9]/g, '').substring(0, 13)
      target.value = newValue
      target.setSelectionRange(Math.min(start + allowedContent.length, 13), Math.min(start + allowedContent.length, 13))
      emit('update:modelValue', newValue)
      return false
    }
  }

  // For Birth Place, prevent numeric content
  if (props.label === 'Birth Place') {
    const pastedText = (event.clipboardData || window.clipboardData).getData('text');
    const hasNumbers = /[0-9]/.test(pastedText);
    
    if (hasNumbers) {
      event.preventDefault();
      // Insert only non-numeric characters
      const target = event.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const currentValue = target.value;
      const nonNumericOnly = pastedText.replace(/[0-9]/g, '');
      const newValue = currentValue.substring(0, start) + nonNumericOnly + currentValue.substring(end);
      
      // Update the input value
      target.value = newValue;
      target.setSelectionRange(start + nonNumericOnly.length, start + nonNumericOnly.length);
      
      // Emit the change
      emit('update:modelValue', newValue);
      return false;
    }
  }
  
  // For Passport Number, only allow alphanumeric content
  if (props.label === 'Passport Number') {
    const pastedText = (event.clipboardData || window.clipboardData).getData('text');
    const alphanumericOnly = pastedText.replace(/[^a-zA-Z0-9]/g, '');
    
    if (alphanumericOnly !== pastedText) {
      event.preventDefault();
      // Insert only alphanumeric characters
      const target = event.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const currentValue = target.value;
      const newValue = currentValue.substring(0, start) + alphanumericOnly + currentValue.substring(end);
      
      // Update the input value
      target.value = newValue;
      target.setSelectionRange(start + alphanumericOnly.length, start + alphanumericOnly.length);
      
      // Emit the change
      emit('update:modelValue', newValue);
      return false;
    }
  }
};

// Handle cut events to prevent editing disabled fields
const handleCut = (event) => {
  // Prevent cut for disabled Name field
  if (props.label === 'Name' && props.disabled) {
    event.preventDefault();
    return false;
  }
};

// Preview modal state
const showPreviewModal = ref(false);
const showUpdateDataPreviewModal = ref(false);

// Master data integration
const { getOptions, loading: masterDataLoading, masterData } = useMasterData();
const masterOptions = ref([]);
const optionsLoaded = ref(false); // Track if options are already loaded

// ✅ INJECT: Get master data ready state from layout
const masterDataReady = inject('masterDataReady', ref(false));

// ✅ GLOBAL CACHE: Track loaded categories to prevent duplicate calls (outside component scope)
if (!window.globalOptionsCache) {
  window.globalOptionsCache = new Map();
}
const globalOptionsCache = window.globalOptionsCache;

// Determine if master data should be searchable based on category
const masterDataSearchable = computed(() => {
  const searchableCategories = ['PROVINCE', 'CITY', 'BANK', 'EDU_INSTITUTIONS', 'EDU_LEVELS', 'EDU_MAJORS', 'EDUCATION_INSTITUTION', 'EDUCATION_LEVEL', 'EDUCATION_MAJOR', 'TAX_STATUS'];
  return searchableCategories.includes(props.masterDataCategory);
});

// Load master data with global caching
const loadMasterOptions = async () => {
  if (!props.masterDataCategory) return;

  // ✅ FIX: Allow reload if options are empty even if marked as loaded
  if (optionsLoaded.value && masterOptions.value && masterOptions.value.length > 0) return;

  try {
    // ✅ FIX: Normalize cache key to UPPERCASE for consistency with master data preload
    const normalizedCategory = props.masterDataCategory.toUpperCase();
    const normalizedSubCategory = props.masterDataSubCategory
      ? props.masterDataSubCategory.toUpperCase()
      : null;

    const cacheKey = normalizedSubCategory
      ? `${normalizedCategory}_${normalizedSubCategory}`
      : normalizedCategory;

    // ✅ GLOBAL CACHE: Check if this category was already loaded by another FormField
    if (globalOptionsCache.has(cacheKey)) {
      const cached = globalOptionsCache.get(cacheKey);
      if (cached && cached.length > 0) {
        masterOptions.value = cached;
        optionsLoaded.value = true;
        return;
      }
    }

    // ✅ OPTIMIZED: Check masterData cache first (don't wait for masterDataReady if data exists)
    if (masterData.value && masterData.value[cacheKey]) {
      const cachedData = masterData.value[cacheKey];
      masterOptions.value = cachedData.map(item => ({
        code: item.code,
        value: item.value,
        label: item.value
      }));
      optionsLoaded.value = true;

      // ✅ GLOBAL CACHE: Store in global cache for other FormFields
      globalOptionsCache.set(cacheKey, masterOptions.value);
      return; // ✅ Early return - data loaded from cache
    }

    // ✅ WAIT: For master data preload to complete only if data not in cache
    if (!masterDataReady.value) {
      // Set timeout to prevent infinite waiting (max 3 seconds)
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve(), 3000);
      });
      
      const readyPromise = new Promise((resolve) => {
        const unwatch = watch(masterDataReady, (ready) => {
          if (ready) {
            unwatch();
            resolve();
          }
        }, { immediate: true });
      });
      
      await Promise.race([readyPromise, timeoutPromise]);
    }

    // ✅ OPTIMIZED: Check masterData again after waiting (might have been loaded during wait)
    if (masterData.value && masterData.value[cacheKey]) {
      const cachedData = masterData.value[cacheKey];
      masterOptions.value = cachedData.map(item => ({
        code: item.code,
        value: item.value,
        label: item.value
      }));
      optionsLoaded.value = true;

      // ✅ GLOBAL CACHE: Store in global cache for other FormFields
      globalOptionsCache.set(cacheKey, masterOptions.value);
      return; // ✅ Early return - data loaded from cache
    }

    // If somehow preload didn't include this category, load it now
    masterOptions.value = await getOptions(props.masterDataCategory, props.masterDataSubCategory || null);
    optionsLoaded.value = true;

    // ✅ GLOBAL CACHE: Store in global cache for other FormFields
    globalOptionsCache.set(cacheKey, masterOptions.value);
  } catch (error) {
    console.error(`[FormField] Error loading master options for ${props.masterDataCategory}:`, error);
    masterOptions.value = [];
  }
};

// Watch for master data category changes with minimal debouncing
let categoryChangeTimeout = null;
watch(() => [props.masterDataCategory, props.masterDataSubCategory], (newVals, oldVals) => {
  const [newCategory, newSubCategory] = newVals || [];
  const [oldCategory, oldSubCategory] = oldVals || [];

  if (newCategory && newCategory !== oldCategory) {
    // Clear existing timeout
    if (categoryChangeTimeout) {
      clearTimeout(categoryChangeTimeout);
    }

    // ✅ OPTIMIZED: Reduced debounce for faster loading (50ms instead of 100ms)
    categoryChangeTimeout = setTimeout(() => {
      loadMasterOptions();
    }, 50); // 50ms debounce for faster response
  }
});

// Load master options on mount
onMounted(() => {
  // Trigger load if master data category is specified
  if (props.masterDataCategory) {
    nextTick(() => {
      loadMasterOptions();
    });
  }
});

// ✅ OPTIMIZED: Watch for master data availability - only check specific cache key, not deep watch
let masterDataTimeout = null;
watch(() => {
  // ✅ OPTIMIZED: Only watch the specific cache key, not entire masterData object
  if (!props.masterDataCategory) return null;
  const normalizedCategory = props.masterDataCategory.toUpperCase();
  const normalizedSubCategory = props.masterDataSubCategory ? props.masterDataSubCategory.toUpperCase() : null;
  const cacheKey = normalizedSubCategory ? `${normalizedCategory}_${normalizedSubCategory}` : normalizedCategory;
  return masterData.value?.[cacheKey] || null;
}, (newData) => {
  if (masterDataTimeout) {
    clearTimeout(masterDataTimeout);
  }
  
  // ✅ OPTIMIZED: Reduced debounce and only trigger if data actually changed
  masterDataTimeout = setTimeout(() => {
    if (newData && Array.isArray(newData) && newData.length > 0 && props.masterDataCategory) {
      // Only load if options not already loaded
      if (!optionsLoaded.value || masterOptions.value.length === 0) {
        loadMasterOptions();
      }
    }
  }, 10); // ✅ Reduced to 10ms for faster response
}, { immediate: true });

// Use master options if available, otherwise use props options
const finalOptions = computed(() => {
  let options = [];

  // Prioritas: jika ada masterDataCategory DAN masterOptions tidak kosong, gunakan masterOptions
  // Jika tidak, gunakan props.options
  if (props.masterDataCategory && masterOptions.value && masterOptions.value.length > 0) {
    options = masterOptions.value;
  } else if (props.options && props.options.length > 0) {
    options = props.options;
  }

  // Debug logging for troubleshooting
  if (props.masterDataCategory && typeof window !== 'undefined') {
    console.log(`[FormField] finalOptions for ${props.masterDataCategory}:`, {
      category: props.masterDataCategory,
      subcategory: props.masterDataSubCategory,
      masterOptionsLength: masterOptions.value?.length || 0,
      propsOptionsLength: props.options?.length || 0,
      finalOptionsLength: options.length,
      optionsLoaded: optionsLoaded.value,
      sample: options.slice(0, 2)
    });
  }

  // Apply filtering if filterBy prop is provided
  if (props.filterBy && props.filterBy.field && props.filterBy.value && options.length > 0) {
    options = options.filter(option => {
      const filterValue = String(option[props.filterBy.field] || '');
      const targetValue = String(props.filterBy.value || '');

      const matches = filterValue === targetValue;
      return matches;
    });
  }

  return options;
});

// Cleanup timeouts on unmount
onUnmounted(() => {
  if (categoryChangeTimeout) {
    clearTimeout(categoryChangeTimeout);
    categoryChangeTimeout = null;
  }
  if (masterDataTimeout) {
    clearTimeout(masterDataTimeout);
    masterDataTimeout = null;
  }
});

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Validate file type for KTP document
    if (props.label === 'KTP Document') {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!allowedTypes.includes(file.type)) {
        showValidationMessage('KTP document must be JPG, PNG, or PDF format');
        return;
      }
      
      if (file.size > maxSize) {
        showValidationMessage('KTP document must be less than 5MB');
        return;
      }
      
      clearValidationMessage();
    }
    
    // Emit the actual File to parent for upload logic
    emit("file-upload", file);
    // Update model with the filename for display
    emit("update:modelValue", file.name);
  }
};

const splitModelValue = (value) => {
  if (!value || typeof value !== 'string') return [];
  if (value.includes(',')) return value.split(',');
  return [];
};

const handleViewClick = () => {
  // Check if modelValue contains parent_id,item_id format (comma preferred, hyphen fallback)
  if (props.modelValue && typeof props.modelValue === 'string') {
    const parts = splitModelValue(props.modelValue);
    if (parts.length >= 2) {
      // This is update-data format, use new modal
      openPreviewModalUpdateData();
      return;
    }
  }
  
  // Default to old modal
  openPreviewModal();
};

const openPreviewModal = () => {
  // Open when we have either a direct URL or an attachment ID/object
  if (props.modelValue) {
    showPreviewModal.value = true;
  }
};

const closePreviewModal = () => {
  showPreviewModal.value = false;
};

const openPreviewModalUpdateData = () => {
  if (props.modelValue) {
    showUpdateDataPreviewModal.value = true;
  }
};

const closeUpdateDataPreviewModal = () => {
  showUpdateDataPreviewModal.value = false;
};

const getParentIdFromModelValue = () => {
  const parts = splitModelValue(props.modelValue);
  return parts.length >= 2 ? parts[0] : '';
};

const getItemIdFromModelValue = () => {
  const parts = splitModelValue(props.modelValue);
  return parts.length >= 2 ? parts[1] : '';
};

const getDocumentInfo = () => {
  return {
    filename: getFileName(props.modelValue),
    file_type: 'Document',
    file_size: 0
  };
};

// Function to resolve item ID from various possible shapes
const resolveItemId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    // If it's a URL, the modal will use documentUrl; still pass null ID
    if (value.startsWith('http')) return null;
    // Otherwise treat as attachment ID
    return value;
  }
  if (typeof value === 'object') {
    return value.id || value.code || value.value || null;
  }
  return null;
};

// Function to get filename from URL or filename with smart truncation
const getFileName = (value) => {
  if (!value) return "";

  let fileName = "";

  // If it's a URL, extract filename from the URL
  if (typeof value === 'string' && value.startsWith("http")) {
    const urlParts = value.split("/");
    fileName = urlParts[urlParts.length - 1] || "Document";

    // For very long URLs, try to extract a meaningful name
    if (fileName.length > 50 || fileName.includes("?")) {
      // Try to find a better filename from the URL path
      const pathParts = value.split("/");
      for (let i = pathParts.length - 1; i >= 0; i--) {
        const part = pathParts[i];
        if (
          part &&
          !part.includes("?") &&
          !part.includes("&") &&
          part.length < 30
        ) {
          fileName = part;
          break;
        }
      }
      // If still too long, use a generic name
      if (fileName.length > 30 || fileName.includes("?")) {
        fileName = "Document";
      }
    }
  } else if (typeof value === 'string') {
    // If it's already a filename, use it, but mask internal IDs when needed
    // Detect obvious internal IDs (no dot/extension and quite long)
    const looksLikeInternalId = (!value.includes('.') && value.length >= 10) || /^[A-Za-z0-9_-]{12,}$/.test(value);
    if (looksLikeInternalId && props.type === 'file') {
      const label = String(props.label || '').toLowerCase();
      if (label.includes('ijazah')) {
        fileName = 'Ijazah.pdf';
      } else if (label.includes('npwp')) {
        fileName = 'NPWP.pdf';
      } else if (label.includes('ktp')) {
        fileName = 'KTP.pdf';
      } else if (label.includes('kk')) {
        fileName = 'KK.pdf';
      } else {
        fileName = 'Document.pdf';
      }
    } else {
      fileName = value;
    }
  } else if (typeof value === 'object') {
    fileName = value.name || value.file_name || value.filename || value.original_name || 'Document';
  }

  // Smart truncation: keep extension visible, truncate in the middle
  if (fileName.length > 20) {
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex > 0) {
      const name = fileName.substring(0, lastDotIndex);
      const extension = fileName.substring(lastDotIndex);
      const maxNameLength = 15 - extension.length;

      if (name.length > maxNameLength) {
        const firstPart = name.substring(0, Math.floor(maxNameLength / 2));
        const lastPart = name.substring(
          name.length - Math.floor(maxNameLength / 2)
        );
        return `${firstPart}...${lastPart}${extension}`;
      }
    } else {
      // No extension, truncate normally
      return fileName.substring(0, 15) + "...";
    }
  }

  return fileName;
};

const id = computed(() => `field-${Math.random().toString(36).substr(2, 9)}`);

// Treat values like '-' or empty string as no document
const hasDocument = computed(() => {
  const v = props.modelValue;
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed === '' || trimmed === '-' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
      return false;
    }
  }
  return true;
});
</script>


