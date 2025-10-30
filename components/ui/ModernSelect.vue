<template>
  <div class="relative" ref="selectContainer">
    <!-- Trigger Button -->
    <button
      type="button"
      @click="toggleDropdown"
      @blur="handleBlur"
      :disabled="disabled"
      class="w-full px-3 py-2 text-left bg-white dark:bg-grey-800 border border-grey-300 dark:border-grey-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      :class="{
        'border-primary-500 ring-1 ring-primary-500': isOpen,
        'border-yellow-400 focus:ring-yellow-400 focus:border-yellow-400': warningBorder,
        'hover:border-grey-400 dark:hover:border-grey-500': !isOpen && !disabled && !warningBorder
      }"
    >
      <div class="flex items-center justify-between">
        <span 
          class="block truncate text-sm"
          :class="{
            'text-grey-900 dark:text-grey-100': selectedOption,
            'text-grey-500 dark:text-grey-400': !selectedOption
          }"
        >
          {{ selectedOption ? (selectedOption.label || selectedOption.value) : placeholder }}
        </span>
                 <svg 
           class="w-4 h-4 text-grey-400 transition-transform duration-200"
           :class="{ 'rotate-180': isOpen }"
           fill="none" 
           stroke="currentColor" 
           viewBox="0 0 24 24"
         >
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
         </svg>
      </div>
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      class="absolute z-50 w-full mt-1 bg-white dark:bg-grey-800 border border-grey-300 dark:border-grey-600 rounded-md shadow-lg max-h-60 overflow-auto"
    >
      <!-- Search Input (if searchable) -->
      <div v-if="searchable" class="sticky top-0 bg-white dark:bg-grey-800 border-b border-grey-200 dark:border-grey-700 p-2">
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Search..."
          class="w-full px-3 py-2 text-sm bg-grey-50 dark:bg-grey-700 border border-grey-300 dark:border-grey-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          @keydown.esc="closeDropdown"
        />
      </div>

      <!-- Options List -->
      <div class="py-1">
        <!-- Loading State in Dropdown -->
        <div
          v-if="loading"
          class="px-3 py-4 text-sm text-grey-500 dark:text-grey-400 text-center"
        >
          <div class="flex items-center justify-center gap-2">
            <div class="flex items-center space-x-1">
              <div class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
              <div class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
              <div class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
            </div>
            <span>Loading options...</span>
          </div>
        </div>
        
        <!-- No Options State -->
        <div
          v-else-if="filteredOptions.length === 0"
          class="px-3 py-2 text-sm text-grey-500 dark:text-grey-400 text-center"
        >
          {{ searchable && searchQuery ? 'No options found' : 'No options available' }}
        </div>
        
        <button
          v-for="option in filteredOptions"
          :key="option.code"
          type="button"
          @click="selectOption(option)"
          @mouseenter="hoveredIndex = option.code"
          class="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:bg-primary-50 dark:focus:bg-primary-900/20 focus:outline-none transition-colors duration-150"
          :class="{
            'bg-primary-100 dark:bg-primary-800/30 text-primary-900 dark:text-primary-100': isSelected(option),
            'text-grey-900 dark:text-grey-100': !isSelected(option)
          }"
        >
          <div class="flex items-center justify-between">
            <span class="truncate">{{ option.value }}</span>
            <svg
              v-if="isSelected(option)"
              class="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </button>
      </div>
    </div>

    <!-- Loading State - Only show in dropdown, not covering the field -->
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: 'Select an option'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  searchable: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  warningBorder: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// State
const isOpen = ref(false);
// Search functionality with debouncing
const searchQuery = ref('');
const debouncedSearchQuery = ref('');

// Debounce search input to prevent excessive filtering
let searchTimeout = null;
watch(searchQuery, (newQuery) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newQuery;
  }, 150); // 150ms debounce for better performance
});

// Filtered options based on debounced search
const filteredOptions = computed(() => {
  // Debug: Log options received
  if (typeof window !== 'undefined' && props.options) {
    console.log('[ModernSelect] filteredOptions computed:', {
      optionsCount: props.options.length,
      hasSearch: !!debouncedSearchQuery.value,
      firstOption: props.options[0],
      allOptions: props.options
    });
  }

  if (!debouncedSearchQuery.value) return props.options;

  const query = debouncedSearchQuery.value.toLowerCase().trim();
  return props.options.filter(option =>
    option.value.toLowerCase().includes(query) ||
    String(option.code).toLowerCase().includes(query)
  );
});

const hoveredIndex = ref(null);

// Refs
const searchInput = ref(null);
const selectContainer = ref(null);

// Computed
const selectedOption = computed(() => {
  // Perbaikan: Gunakan String() untuk memastikan "0" tidak dianggap falsy
  const modelValueStr = String(props.modelValue);
  if (modelValueStr === 'undefined' || modelValueStr === 'null' || modelValueStr === '') return null;
  
  
  
  
  // Try exact match first by code (with type conversion)
  let found = props.options.find(option => 
    String(option.code) === modelValueStr || 
    option.code === props.modelValue
  );
  
  // If not found, try by value (with type conversion)
  if (!found && modelValueStr !== '') {
    found = props.options.find(option => 
      String(option.value) === modelValueStr || 
      option.value === props.modelValue
    );
  }
  
  // If still not found, try loose comparison
  if (!found && modelValueStr !== '') {
    found = props.options.find(option => 
      option.code == props.modelValue ||
      option.value == props.modelValue
    );
  }
  
  // Debug hasil untuk member status
  if (props.options.length > 0 && props.options.some(opt => opt.label === 'Active' || opt.label === 'Inactive')) {
    if (!found) {
      props.options.forEach((opt, idx) => {
      });
    }
  }
  
  
  return found || null;
});

// Methods
const toggleDropdown = () => {
  if (props.disabled) {
    closeDropdown();
    return;
  }
  
  isOpen.value = !isOpen.value;
  
  if (isOpen.value && props.searchable) {
    nextTick(() => {
      searchInput.value?.focus();
    });
  }
};

const closeDropdown = () => {
  isOpen.value = false;
  searchQuery.value = '';
  hoveredIndex.value = null;
};

const selectOption = (option) => {
  try {
    const optionValue = option.code !== undefined ? option.code : option.value;
    if (option && optionValue !== undefined) {
      // Perbaikan: Pastikan nilai yang di-emit selalu string untuk menghindari masalah falsy dengan "0"
      const stringValue = String(optionValue);
      
     
      
      
      
      emit('update:modelValue', stringValue);
      emit('change', option);
      
      closeDropdown();
    }
  } catch (error) {
  }
};

const isSelected = (option) => {
  try {
    // 🔧 FIX: Use explicit undefined check instead of falsy check to handle "0" codes
    const optionValue = option.code !== undefined ? option.code : option.value;
    if (!option || optionValue === undefined) return false;
    
    const modelValueStr = String(props.modelValue);
    
    
    // Try exact match first
    if (String(optionValue) === modelValueStr) return true;
    
    // Try value comparison
    if (option.value === modelValueStr) return true;
    
    return false;
  } catch (error) {
    return false;
  }
};

const handleBlur = (event) => {
  // Safety check untuk event dan currentTarget
  if (!event || !event.currentTarget) return;
  
  // Delay closing to allow click events to fire
  setTimeout(() => {
    try {
      if (event.currentTarget && document.activeElement && !event.currentTarget.contains(document.activeElement)) {
        closeDropdown();
      }
    } catch (error) {
      // Fallback: close dropdown jika ada error
      closeDropdown();
    }
  }, 100);
};

// Handle click outside
const handleClickOutside = (event) => {
  try {
    if (selectContainer.value && event.target && !selectContainer.value.contains(event.target)) {
      closeDropdown();
    }
  } catch (error) {
    // Fallback: close dropdown jika ada error
    closeDropdown();
  }
};

// Keyboard navigation
const handleKeydown = (event) => {
  try {
    if (!isOpen.value) return;
    
    switch (event.key) {
      case 'Escape':
        closeDropdown();
        break;
      case 'Enter':
        if (hoveredIndex.value) {
          const option = props.options.find(opt => opt && opt.code === hoveredIndex.value);
          if (option) selectOption(option);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        navigateOptions(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        navigateOptions(-1);
        break;
    }
  } catch (error) {
  }
};

const navigateOptions = (direction) => {
  try {
    if (!props.options || !Array.isArray(props.options)) return;
    
    const currentIndex = props.options.findIndex(opt => opt && opt.code === hoveredIndex.value);
    let newIndex = currentIndex + direction;
    
    if (newIndex < 0) newIndex = props.options.length - 1;
    if (newIndex >= props.options.length) newIndex = 0;
    
    const newOption = props.options[newIndex];
    if (newOption && newOption.code) {
      hoveredIndex.value = newOption.code;
    }
  } catch (error) {
  }
};

// Watch for external changes
watch(() => props.modelValue, () => {
  // Reset search when value changes externally
  if (!isOpen.value) {
    searchQuery.value = '';
  }
});

// Watch for disabled state changes
watch(() => props.disabled, (newDisabled) => {
  if (newDisabled && isOpen.value) {
    closeDropdown();
  }
});

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* Custom scrollbar for dropdown */
.overflow-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.dark .overflow-auto::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.dark .overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
