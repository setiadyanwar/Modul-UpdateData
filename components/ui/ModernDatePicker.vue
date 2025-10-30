<template>
  <div class="relative">
    <!-- PrimeVue DatePicker -->
    <DatePicker
      :id="id"
      v-model="dateValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :showIcon="true"
      :showOnFocus="false"
      :dateFormat="format"
      :maxDate="computedMaxDate"
      :minDate="computedMinDate"
      :showButtonBar="true"
      :showTodayButton="true"
      :showClearButton="true"
      :todayButtonLabel="'Hari Ini'"
      :clearButtonLabel="'Clear'"
      :monthNavigator="true"
      :yearNavigator="true"
      :yearRange="yearRange"
      class="w-full"
      :class="{
        'opacity-50 cursor-not-allowed': disabled
      }"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  id: {
    type: String,
    default: ''
  },
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Select date'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  format: {
    type: String,
    default: 'dd-mm-yy'
  },
  allowFuture: {
    type: Boolean,
    default: false
  },
  minDate: {
    type: Date,
    default: null
  },
  maxDate: {
    type: Date,
    default: null
  }
});

const emit = defineEmits(['update:modelValue']);

// Internal date value (Date object for PrimeVue)
const dateValue = ref(null);

// Computed properties for PrimeVue DatePicker
const computedMaxDate = computed(() => {
  
  if (props.maxDate) {
    return props.maxDate;
  }
  // If allowFuture is true, don't set maxDate (allow all future dates)
  if (props.allowFuture) {
    return null;
  }
  // Default: disable future dates
  return new Date();
});

const computedMinDate = computed(() => {
  
  if (props.minDate) {
    return props.minDate;
  }
  return new Date(1900, 0, 1); // Allow dates from 1900
});

const yearRange = computed(() => {
  const currentYear = new Date().getFullYear();
  return `${currentYear - 100}:${currentYear + 10}`;
});

// Watch for external modelValue changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // Handle different date formats and convert to Date object
    let date;
    
    // Handle DD-MM-YYYY format (our standard format)
    if (/^\d{2}-\d{2}-\d{4}$/.test(newValue)) {
      const parts = newValue.split('-');
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const year = parseInt(parts[2]);
      date = new Date(year, month, day);
    }
    // Handle DD/MM/YYYY format
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(newValue)) {
      const parts = newValue.split('/');
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const year = parseInt(parts[2]);
      date = new Date(year, month, day);
    }
    // Handle YYYY-MM-DD format
    else if (/^\d{4}-\d{2}-\d{2}$/.test(newValue)) {
      const parts = newValue.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const day = parseInt(parts[2]);
      date = new Date(year, month, day);
    }
    // Try direct Date constructor for other formats
    else {
      date = new Date(newValue);
    }
    
    if (date && !isNaN(date.getTime())) {
      dateValue.value = date;
    }
  } else {
    dateValue.value = null;
  }
}, { immediate: true });

// Watch for internal dateValue changes and emit to parent
watch(dateValue, (newValue) => {
  if (newValue) {
    // Convert Date object to DD-MM-YYYY format for parent
    const year = newValue.getFullYear();
    const month = String(newValue.getMonth() + 1).padStart(2, '0');
    const day = String(newValue.getDate()).padStart(2, '0');
    emit('update:modelValue', `${day}-${month}-${year}`);
  } else {
    emit('update:modelValue', '');
  }
});
</script>

<style scoped>
/* Styling sudah dipindah ke main.css */
</style>
