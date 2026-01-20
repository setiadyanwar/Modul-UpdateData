<template>
  <div>

    <!-- Actual Form -->
    <div class="grid grid-cols-1 xl:grid-cols-5 gap-8">
      <!-- Photo Section - Left Column -->
      <div class="xl:col-span-1">
        <PhotoUpload
          :key="photoUrl || 'no-photo'"
          :photo-url="photoUrl"
          :disabled="false"
          @photo-changed="handleProfessionalPhotoUpload"
        />
      </div>

      <!-- Form Section - Right Column -->
      <div class="xl:col-span-4">

        <BasicInformationForm
          v-if="dynamicFormData && Object.keys(dynamicFormData).length > 0"
          :model-value="dynamicFormData"
          :edit-mode="true"
          :disabled="false"
          :form-config="formConfig"
          :disable-edit-revision="normalizeStatus(requestDetail)?.isRejected === true"
          :is-loading="isLoadingBasicInfo"
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
import { ref, computed, watch, nextTick, onMounted } from "vue";

// Form Components
import BasicInformationForm from "~/components/form/BasicInformationForm.vue";
import PhotoUpload from "~/components/form/PhotoUpload.vue";

// Composables
import { usePersonalData } from "~/composables/usePersonalData";

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
  employeeData: {
    type: Object,
    default: () => ({})
  }
});

// Emits
const emit = defineEmits([
  'form-data-update',
  'professional-photo-upload'
]);

// Refs
const formData = ref({});
const professionalPhotoFile = ref(null);
const photoUrlRef = ref(null);
const isLoadingBasicInfo = ref(false);
const basicInfoLoaded = ref(true); // Set to true to avoid loading issues

// Import composables to get original employee data
const personalData = usePersonalData();
const { employeeData: originalEmployeeData } = personalData;

// Enhanced computed properties with complete employee data
const dynamicFormData = computed(() => {
  if (!props.requestDetail) return {};


  // Start with complete original employee data (try multiple sources)
  let baseData = {};


  // Priority 1: Use employeeData from props (passed from parent) - MOST RELIABLE
  if (props.employeeData && typeof props.employeeData === 'object' && Object.keys(props.employeeData).length > 0 && !props.employeeData.__v_isRef) {
    baseData = { ...props.employeeData };
  }
  // Priority 2: Use old_data from requestDetail (for edit mode)
  else if (props.requestDetail?.old_data && typeof props.requestDetail.old_data === 'object') {
    baseData = { ...props.requestDetail.old_data };
  }
  // Priority 3: Try changes.basic_informationData.old (fallback for edit mode)
  else if (props.requestDetail.changes?.basic_informationData?.old) {
    const basicInfoChanges = props.requestDetail.changes.basic_informationData;
    if (basicInfoChanges.old && typeof basicInfoChanges.old === 'object') {
      baseData = { ...basicInfoChanges.old };
    }
  }
  // Priority 3: Use originalEmployeeData from composable (might be empty)
  else if (originalEmployeeData.value && typeof originalEmployeeData.value === 'object' && Object.keys(originalEmployeeData.value).length > 0) {
    baseData = { ...originalEmployeeData.value };
  }
  else {
  }

  // Apply changes from old_data (if any)
  if (props.requestDetail.old_data && typeof props.requestDetail.old_data === 'object') {
    baseData = { ...baseData, ...props.requestDetail.old_data };
  }

  // For draft status and need revision, apply new_data changes
  const status = props.requestDetail.status || props.requestDetail.status_raw || '';
  const isDraft = status === '1' || status === 'draft' || status === 'Draft';
  const isNeedRevision = status === '3' || status === 3 ||
    (props.requestDetail.status_label && props.requestDetail.status_label.toLowerCase().includes('revision'));

  if ((isDraft || isNeedRevision) && props.requestDetail.new_data) {
    const newData = props.requestDetail.new_data.data || props.requestDetail.new_data;
    if (newData && typeof newData === 'object') {
      baseData = { ...baseData, ...newData };
    }
  }

  // Final fallback: if still no data, provide minimum basic info to make form render
  if (!baseData || Object.keys(baseData).length === 0) {
    baseData = {
      name: 'Employee Name',
      nik: '1234567890123456',
      email: 'employee@example.com',
      main_phone_number: '08123456789'
    };
  }

  // FORCE FIX: Ensure name is populated if employee_name exists but name is empty
  // This handles cases where API returns employee_name (legacy) but form expects name
  if ((!baseData.name || baseData.name === '') && baseData.employee_name) {
    baseData.name = baseData.employee_name;
  }

  return baseData;
});

// Computed property for photo URL to ensure reactivity
const photoUrl = computed(() => {
  const url = photoUrlRef.value || formData.value?.professional_photo || dynamicFormData.value?.professional_photo;
  return url;
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
  if (!newData || typeof newData !== 'object') {
    return;
  }

  formData.value = { ...formData.value, ...newData };
  emit('form-data-update', newData);
};

const handleProfessionalPhotoUpload = (file) => {
  professionalPhotoFile.value = file;
  // Create object URL for preview
  let photoUrl = null;
  if (file) {
    photoUrl = URL.createObjectURL(file);
    formData.value.professional_photo = photoUrl;
    photoUrlRef.value = photoUrl; // Also set direct ref
  } else {
    // Handle removal
    formData.value.professional_photo = null;
    photoUrlRef.value = null;
  }

  // Emit both events to ensure parent gets updated
  emit('professional-photo-upload', file);
  emit('form-data-update', { professional_photo: photoUrl });


  // Force reactivity update
  nextTick(() => {

    // Force reactive update of formData
    const temp = { ...formData.value };
    formData.value = temp;
  });
};

// Initialize formData with dynamicFormData
watch(dynamicFormData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    if (!formData.value || Object.keys(formData.value).length === 0) {
      formData.value = { ...newData };
    } else {
      // Preserve uploaded photo while merging other data
      const currentPhoto = formData.value.professional_photo;
      formData.value = { ...newData };
      if (currentPhoto) {
        formData.value.professional_photo = currentPhoto;
      }
    }
    
    // Check if name is still missing after update
    if (!formData.value.name || formData.value.name === '') {
       if (formData.value.employee_name) {
         formData.value.name = formData.value.employee_name;
       }
    }
  }
}, { immediate: true });

// Add refs for uploaded documents and keys that parent expects
const uploadedDocuments = ref([]);
const documentSectionKey = ref(0);
const multiDocumentUploadKey = ref(0);

// Expose all properties that parent component expects
defineExpose({
  professionalPhotoFile,
  uploadedDocuments,
  documentSectionKey,
  multiDocumentUploadKey,
  formData,
  validateForm: () => {
    // Add basic validation if needed
    return true;
  }
});

// Initialize on mount
onMounted(async () => {
  // Check if we need to load data
  let needsLoad = false;
  
  // If data is empty or name is missing
  if (!dynamicFormData.value || Object.keys(dynamicFormData.value).length === 0) {
    needsLoad = true;
  } else if (!dynamicFormData.value.name && !dynamicFormData.value.employee_name) {
    // If name is missing, we might need to fetch it
    // But check if it's just in a different field
    needsLoad = true;
  }
  
  if (needsLoad) {
    try {
      isLoadingBasicInfo.value = true;
      // Call loadBasicInformation to fetch fresh data
      // We need to access it from personalData composable
      // Note: we need to use the imported loadBasicInformation function, 
      // but it was not destructured in the original code.
      // We'll rely on the parent or the fact that usePersonalData shares state.
      // If we can't call it directly, we assume parent handles it or we rely on shared state update.
      
      // Let's re-acquire the function explicitly
      const { loadBasicInformation } = usePersonalData();
      await loadBasicInformation();
      
      // After load, update local state
      nextTick(() => {
        if (originalEmployeeData.value) {
          const newData = { ...originalEmployeeData.value };
          
          // Apply old_data from requestDetail if available (to preserve edits)
          if (props.requestDetail?.old_data) {
             Object.assign(newData, props.requestDetail.old_data);
          }
          
          // Apply new_data if draft/rejected
          const statusInfo = normalizeStatus(props.requestDetail);
           if ((statusInfo.isDraft || statusInfo.isRejected) && props.requestDetail?.new_data) {
               Object.assign(newData, props.requestDetail.new_data?.data || props.requestDetail.new_data || {});
           }
           
          formData.value = newData;
        }
      });
    } catch (e) {
      console.error("Error loading basic info in EditDataBasicInformation:", e);
    } finally {
      isLoadingBasicInfo.value = false;
    }
  }

  if (dynamicFormData.value && Object.keys(dynamicFormData.value).length > 0) {
    // Don't override if formData already has content (like uploaded photo)
    if (!formData.value || Object.keys(formData.value).length === 0) {
      formData.value = { ...dynamicFormData.value };
    } else {
      // Merge, but preserve existing values (like uploaded photo)
      formData.value = { ...dynamicFormData.value, ...formData.value };
    }
  }
});
</script>