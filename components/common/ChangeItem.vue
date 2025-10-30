<template>
  <div class="flex items-start space-x-3 p-3 rounded-lg hover:bg-grey-50 dark:hover:bg-grey-700/50 transition-colors">
    <!-- Icon with colored circle background. Icon type depends on fieldLabel. -->
    <div class="flex-shrink-0">
      <div class="w-10 h-10 rounded-full flex items-center justify-center">
        <!-- Default Icon -->
        <svg v-if="getIconType(fieldLabel) === 'default'" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16C0 7.16344 7.16344 0 16 0Z" fill="#DCFCE7"/>
          <path d="M16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16C0 7.16344 7.16344 0 16 0Z" stroke="#E5E7EB"/>
          <path d="M23 26H9V6H23V26Z" stroke="#E5E7EB"/>
          <g clip-path="url(#clip0_594_26215)">
            <path d="M21.8953 9.34316C21.2965 8.74434 20.3285 8.74434 19.7297 9.34316L18.9066 10.1635L21.5836 12.8404L22.4066 12.0174C23.0055 11.4186 23.0055 10.4506 22.4066 9.85176L21.8953 9.34316ZM13.7141 15.3588C13.5473 15.5256 13.4187 15.7307 13.3449 15.9576L12.5355 18.3857C12.4562 18.6209 12.5191 18.8807 12.6941 19.0584C12.8691 19.2361 13.1289 19.2963 13.3668 19.217L15.7949 18.4076C16.0191 18.3338 16.2242 18.2053 16.3937 18.0385L20.9684 13.4611L18.2887 10.7814L13.7141 15.3588ZM11.625 10.4998C10.1758 10.4998 9 11.6756 9 13.1248V20.1248C9 21.574 10.1758 22.7498 11.625 22.7498H18.625C20.0742 22.7498 21.25 21.574 21.25 20.1248V17.4998C21.25 17.0158 20.859 16.6248 20.375 16.6248C19.891 16.6248 19.5 17.0158 19.5 17.4998V20.1248C19.5 20.6088 19.109 20.9998 18.625 20.9998H11.625C11.141 20.9998 10.75 20.6088 10.75 20.1248V13.1248C10.75 12.6408 11.141 12.2498 11.625 12.2498H14.25C14.734 12.2498 15.125 11.8588 15.125 11.3748C15.125 10.8908 14.734 10.4998 14.25 10.4998H11.625Z" fill="#16A34A"/>
          </g>
          <defs>
            <clipPath id="clip0_594_26215">
              <path d="M9 8.75H23V22.75H9V8.75Z" fill="white"/>
            </clipPath>
          </defs>
        </svg>
        <!-- Address Icon -->
        <svg v-else-if="getIconType(fieldLabel) === 'address'" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16C0 7.16344 7.16344 0 16 0Z" fill="#DBEAFE"/>
          <path d="M16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16C0 7.16344 7.16344 0 16 0Z" stroke="#E5E7EB"/>
          <path d="M21.25 26H10.75V6H21.25V26Z" stroke="#E5E7EB"/>
          <g clip-path="url(#clip0_594_26232)">
            <path d="M16.648 22.4C18.0508 20.6445 21.25 16.3898 21.25 14C21.25 11.1016 18.8984 8.75 16 8.75C13.1016 8.75 10.75 11.1016 10.75 14C10.75 16.3898 13.9492 20.6445 15.352 22.4C15.6883 22.8184 16.3117 22.8184 16.648 22.4ZM16 12.25C16.4641 12.25 16.9092 12.4344 17.2374 12.7626C17.5656 13.0908 17.75 13.5359 17.75 14C17.75 14.4641 17.5656 14.9092 17.2374 15.2374C16.9092 15.5656 16.4641 15.75 16 15.75C15.5359 15.75 15.0908 15.5656 14.7626 15.2374C14.4344 14.9092 14.25 14.4641 14.25 14C14.25 13.5359 14.4344 13.0908 14.7626 12.7626C15.0908 12.4344 15.5359 12.25 16 12.25Z" fill="#2563EB"/>
          </g>
          <defs>
            <clipPath id="clip0_594_26232">
              <path d="M10.75 8.75H21.25V22.75H10.75V8.75Z" fill="white"/>
            </clipPath>
          </defs>
        </svg>
        <!-- Email Icon -->
        <svg v-else-if="getIconType(fieldLabel) === 'email'" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16C0 7.16344 7.16344 0 16 0Z" fill="#F3E8FF"/>
          <path d="M16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16C0 7.16344 7.16344 0 16 0Z" stroke="#E5E7EB"/>
          <path d="M23 26H9V6H23V26Z" stroke="#E5E7EB"/>
          <path d="M23 22.75H9V8.75H23V22.75Z" stroke="#E5E7EB"/>
          <path d="M10.3125 10.5C9.58789 10.5 9 11.0879 9 11.8125C9 12.2254 9.19414 12.6137 9.525 12.8625L15.475 17.325C15.7867 17.5574 16.2133 17.5574 16.525 17.325L22.475 12.8625C22.8059 12.6137 23 12.2254 23 11.8125C23 11.0879 22.4121 10.5 21.6875 10.5H10.3125ZM9 13.5625V19.25C9 20.2152 9.78477 21 10.75 21H21.25C22.2152 21 23 20.2152 23 19.25V13.5625L17.05 18.025C16.4266 18.4926 15.5734 18.4926 14.95 18.025L9 13.5625Z" fill="#9333EA"/>
        </svg>
        <!-- Document Icon -->
        <svg v-else-if="getIconType(fieldLabel) === 'document'" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16C0 7.16344 7.16344 0 16 0Z" fill="#FEF0EF"/>
          <path d="M16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16C0 7.16344 7.16344 0 16 0Z" stroke="#E5E7EB"/>
          <g clip-path="url(#clip0_602_22479)">
            <g clip-path="url(#clip1_602_22479)">
              <path d="M7 9.25C7 8.00898 8.00898 7 9.25 7H14.875V11.5C14.875 12.1223 15.3777 12.625 16 12.625H20.5V17.6875H13.1875C11.9465 17.6875 10.9375 18.6965 10.9375 19.9375V25H9.25C8.00898 25 7 23.991 7 22.75V9.25ZM20.5 11.5H16V7L20.5 11.5ZM13.1875 19.375H14.3125C15.3988 19.375 16.2812 20.2574 16.2812 21.3438C16.2812 22.4301 15.3988 23.3125 14.3125 23.3125H13.75V24.4375C13.75 24.7469 13.4969 25 13.1875 25C12.8781 25 12.625 24.7469 12.625 24.4375V22.75V19.9375C12.625 19.6281 12.8781 19.375 13.1875 19.375ZM14.3125 22.1875C14.7801 22.1875 15.1562 21.8113 15.1562 21.3438C15.1562 20.8762 14.7801 20.5 14.3125 20.5H13.75V22.1875H14.3125ZM17.6875 19.375H18.8125C19.7441 19.375 20.5 20.1309 20.5 21.0625V23.3125C20.5 24.2441 19.7441 25 18.8125 25H17.6875C17.3781 25 17.125 24.7469 17.125 24.4375V19.9375C17.125 19.6281 17.3781 19.375 17.6875 19.375ZM18.8125 23.875C19.1219 23.875 19.375 23.6219 19.375 23.3125V21.0625C19.375 20.7531 19.1219 20.5 18.8125 20.5H18.25V23.875H18.8125ZM21.625 19.9375C21.625 19.6281 21.8781 19.375 22.1875 19.375H23.875C24.1844 19.375 24.4375 19.6281 24.4375 19.9375C24.4375 20.2469 24.1844 20.5 23.875 20.5H22.75V21.625H23.875C24.1844 21.625 24.4375 21.8781 24.4375 22.1875C24.4375 22.4969 24.1844 22.75 23.875 22.75H22.75V24.4375C22.75 24.7469 22.4969 25 22.1875 25C21.8781 25 21.625 24.7469 21.625 24.4375V22.1875V19.9375Z" fill="#EF4444"/>
            </g>
          </g>
          <defs>
            <clipPath id="clip0_602_22479">
              <rect width="18" height="18" fill="white" transform="translate(7 7)"/>
            </clipPath>
            <clipPath id="clip1_602_22479">
              <path d="M7 7H25V25H7V7Z" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      </div>
    </div>

    <!-- Content: Field label, date, old value, new value, and view button for documents -->
    <div class="flex-grow min-w-0">
      <div class="flex items-center justify-between mb-2">
        <!-- Field label -->
        <h4 class="font-medium text-text-main text-sm truncate">
          {{ fieldLabel }}
        </h4>
        <!-- Date of change -->
        <span class="text-xs text-grey-700 flex-shrink-0 ml-2">
          {{ date }}
        </span>
      </div>

      <!-- Old Value Section -->
      <div class="mb-1">
        <span class="text-xs text-grey-600 font-medium">Old: </span>
        <span 
          class="text-xs text-red-500 line-through break-all"
          :title="getFullValue(oldValue)"
        >
          {{ formatValue(oldValue) }}
        </span>
      </div>
      
      <!-- New Value Section -->
      <div class="mb-1">
        <span class="text-xs text-grey-600 font-medium">New: </span>
        <span 
          class="text-xs text-green-500 font-semibold break-all"
          :title="getFullValue(newValue)"
        >
          {{ formatValue(newValue) }}
        </span>
        <!-- View button for document values -->
        <button 
          v-if="isDocument(newValue)" 
          class="ml-2 text-xs text-blue-500 hover:text-blue-600 underline flex-shrink-0"
        >
          View
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// Import utility functions for formatting values
import { formatValue, getFullValue } from '~/composables/useTextFormatting.js'

// Props for the change item
const props = defineProps({
  // The label of the field that was changed
  fieldLabel: {
    type: String,
    required: true
  },
  // The old value before the change
  oldValue: {
    type: [String, Number, Object, Array],
    default: null
  },
  // The new value after the change
  newValue: {
    type: [String, Number, Object, Array],
    default: null
  },
  // The date of the change
  date: {
    type: String,
    default: ''
  },
})

// Check if the value is a document (by file extension)
const isDocument = (value) => {
  if (typeof value === 'string') {
    return value.toLowerCase().includes('.pdf') || 
           value.toLowerCase().includes('.doc') || 
           value.toLowerCase().includes('.jpg') || 
           value.toLowerCase().includes('.png')
  }
  return false
}

// Get icon type based on the field label
const getIconType = (fieldLabel) => {
  const label = fieldLabel.toLowerCase()
  if (label.includes('address') || label.includes('location') || label.includes('street') || label.includes('city') || label.includes('province')) {
    return 'address'
  }
  if (label.includes('email') || label.includes('mail')) {
    return 'email'
  }
  if (label.includes('document') || label.includes('file') || label.includes('pdf') || label.includes('ktp') || label.includes('npwp')) {
    return 'document'
  }
  if (label.includes('phone') || label.includes('number')) {
    return 'default'
  }
  if (label.includes('name') || label.includes('employee')) {
    return 'default'
  }
  // Default icon for other fields
  return 'default'
}
</script>