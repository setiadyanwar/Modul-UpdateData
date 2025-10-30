<template>
  <div>
    <!-- Actual Form -->
    <div class="grid grid-cols-1">
      <!-- Form Section -->
      <div>
        <AddressForm
          v-if="dynamicFormData && Object.keys(dynamicFormData).length > 0"
          :model-value="dynamicFormData"
          :edit-mode="true"
          :disabled="false"
          :form-config="formConfig"
          :disable-edit-revision="normalizeStatus(requestDetail)?.isRejected === true"
          :is-loading="isLoadingAddress"
          @update:model-value="handleFormDataUpdate"
        />
        <div v-else class="border border-red-300 bg-red-50 p-4 rounded">
          <p class="text-red-800">⚠️ No form data available:</p>
          <p class="text-xs">requestDetail: {{ requestDetail ? 'exists' : 'missing' }}</p>
          <p class="text-xs">old_data: {{ requestDetail?.old_data ? Object.keys(requestDetail.old_data).length + ' keys' : 'missing' }}</p>
          <p class="text-xs">new_data: {{ requestDetail?.new_data?.data ? Object.keys(requestDetail.new_data.data).length + ' keys' : 'missing' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, unref } from "vue";

// Form Components
import AddressForm from "~/components/form/AddressForm.vue";

// Composables
import { usePersonalData } from "~/composables/usePersonalData";
import { mapAddress, resolveAddress } from "~/utils/dataResolver";

// Props
const props = defineProps({
  requestDetail: {
    type: Object,
    required: true
  },
  activeTab: {
    type: String,
    required: true
  },
  formConfig: {
    type: Object,
    default: () => ({})
  },
  isUploading: {
    type: Boolean,
    default: false
  },
  addressData: {
    type: Object,
    default: () => ({})
  },
  originalAddressData: {
    type: Object,
    default: () => ({})
  }
});

// Emits
const emit = defineEmits([
  'form-data-update'
]);

// Refs
const formData = ref({});
const isLoadingAddress = ref(false);

// Import composables to get original address data
const personalData = usePersonalData();
const { addressData: composableAddressData } = personalData;

// Enhanced computed properties with complete address data
const dynamicFormData = computed(() => {
  if (!props.requestDetail) return {};


  // Get base employee data (try multiple sources)
  let employeeBase = {};

  // Priority 1: Use addressData from props (passed from parent) - MOST RELIABLE
  const addressDataValue = unref(props.addressData);
  if (addressDataValue && typeof addressDataValue === 'object' && Object.keys(addressDataValue).length > 0) {
    employeeBase = { ...addressDataValue };
  }
  // Priority 2: Use originalAddressData from props
  else if (props.originalAddressData) {
    const originalAddressDataValue = unref(props.originalAddressData);
    if (originalAddressDataValue && typeof originalAddressDataValue === 'object' && Object.keys(originalAddressDataValue).length > 0) {
      employeeBase = { ...originalAddressDataValue };
    }
  }
  // Priority 3: Try changes.addressData.old (fallback for edit mode)
  else if (props.requestDetail.changes?.addressData?.old) {
    const addressChanges = props.requestDetail.changes.addressData;
    if (addressChanges.old && typeof addressChanges.old === 'object') {
      employeeBase = { ...addressChanges.old };
    }
  }
  // Priority 4: Use composable addressData (might be empty)
  else {
    const composableAddressDataValue = unref(composableAddressData);
    if (composableAddressDataValue && typeof composableAddressDataValue === 'object' && Object.keys(composableAddressDataValue).length > 0) {
      employeeBase = { ...composableAddressDataValue };
    }
    else {
    }
  }

  // Get old_data and new_data
  const oldData = props.requestDetail.old_data || {};
  const newData = props.requestDetail.new_data?.data || props.requestDetail.new_data || {};


  // Use resolveAddress to properly map and merge all data sources
  // This ensures proper field mapping from API format to form format
  const resolvedData = resolveAddress(employeeBase, oldData, newData);


  return resolvedData;
});

// Helper function to normalize status
const normalizeStatus = (requestDetail) => {
  if (!requestDetail) return { isDraft: false, isRejected: false };

  const status = requestDetail.status || requestDetail.status_raw || '';
  return {
    isDraft: status === '1' || status === 'draft' || status === 'Draft',
    isRejected: status === '3' || status === 'rejected' || status === 'Rejected'
  };
};

// Simplified methods
const handleFormDataUpdate = (newData) => {
  if (!newData || typeof newData !== 'object') return;

  formData.value = { ...formData.value, ...newData };
  emit('form-data-update', newData);
};

// Initialize formData with dynamicFormData
watch(dynamicFormData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    if (!formData.value || Object.keys(formData.value).length === 0) {
      formData.value = { ...newData };
    } else {
      // Merge new data while preserving existing form data
      formData.value = { ...newData, ...formData.value };
    }
  }
}, { immediate: true });

// Initialize on mount
onMounted(() => {
  if (dynamicFormData.value && Object.keys(dynamicFormData.value).length > 0) {
    // Don't override if formData already has content
    if (!formData.value || Object.keys(formData.value).length === 0) {
      formData.value = { ...dynamicFormData.value };
    } else {
      // Merge, but preserve existing values
      formData.value = { ...dynamicFormData.value, ...formData.value };
    }
  }
});
</script>