<template>
  <div class="space-y-8">
    <!-- Employee Identification -->
    <div class="">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        Employee Identification
      </h3>

      <!-- Row 1: NIK, NIK Telkom, Business Email -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <FormField
          v-if="isFieldVisible('nik')"
          label="NIK"
          v-model="localData.nik"
          type="text"
          :disabled="!isFieldEditable('nik')"
          placeholder="Enter NIK"
        />

        <FormField
          v-if="isFieldVisible('nikTelkom')"
          label="NIK Telkom"
          v-model="localData.nikTelkom"
          type="text"
          :disabled="!isFieldEditable('nikTelkom')"
          placeholder="Enter NIK Telkom"
        />

        <FormField
          v-if="isFieldVisible('businessEmail')"
          label="Business Email"
          v-model="localData.businessEmail"
          type="email"
          :disabled="!isFieldEditable('businessEmail')"
          placeholder="Enter business email"
        />
      </div>
    </div>

    <!-- Organizational Structure -->
    <div class="">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        Organizational Structure
      </h3>

      <!-- Row 1: Directorate, Business Unit, Division -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <FormField
          v-if="isFieldVisible('directorate')"
          label="Directorate"
          v-model="localData.directorate"
          type="text"
          :disabled="!isFieldEditable('directorate')"
          placeholder="Enter directorate"
        />

        <FormField
          v-if="isFieldVisible('businessUnit')"
          label="Business Unit"
          v-model="localData.businessUnit"
          type="text"
          :disabled="!isFieldEditable('businessUnit')"
          placeholder="Enter business unit"
        />

        <FormField
          v-if="isFieldVisible('divisi')"
          label="Division"
          v-model="localData.divisi"
          type="text"
          :disabled="!isFieldEditable('divisi')"
          placeholder="Enter division"
        />
      </div>

      <!-- Row 2: Position, Supervisor -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Position"
          v-model="localData.position"
          type="text"
          :disabled="!editMode"
          placeholder="Enter position"
        />

        <FormField
          label="Direct Superior"
          v-model="localData.supervisor"
          type="text"
          :disabled="!editMode"
          placeholder="Enter direct supervisor name"
        />
      </div>
    </div>

    <!-- Grade and Level Information -->
    <div class="">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        Grade and Level Information
      </h3>

      <!-- Row 1: Grade, Grade Date, Band Position -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <FormField
          label="Grade"
          v-model="localData.grade"
          type="text"
          :disabled="!editMode"
          placeholder="Enter grade"
        />

        <FormField
          label="Grade Date"
          v-model="localData.gradeDate"
          type="date"
          :disabled="!editMode"
        />

        <FormField
          label="Band Position"
          v-model="localData.bandPosition"
          type="text"
          :disabled="!editMode"
          placeholder="Enter band position"
        />
      </div>

      <!-- Row 2: Band Position Date, Level, Level Date -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          label="Band Position Date"
          v-model="localData.bandPositionDate"
          type="date"
          :disabled="!editMode"
        />

        <FormField
          label="Level"
          v-model="localData.level"
          type="text"
          :disabled="!editMode"
          placeholder="Enter level"
        />

        <FormField
          label="Level Date"
          v-model="localData.levelDate"
          type="date"
          :disabled="!editMode"
        />
      </div>
    </div>

    <!-- Employment Dates -->
    <div class="">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Employment Dates</h3>

      <!-- Row 1: Join Date, Start Date -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <FormField
          label="Join Date"
          v-model="localData.joinDate"
          type="date"
          :disabled="!editMode"
        />

        <FormField
          label="Start Date"
          v-model="localData.startDate"
          type="date"
          :disabled="!editMode"
        />
      </div>

      <!-- Row 2: Terminate Date, Retirement Date -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Terminate Date"
          v-model="localData.terminateDate"
          type="date"
          :disabled="!editMode"
        />

        <FormField
          label="Retirement Date"
          v-model="localData.retirementDate"
          type="date"
          :disabled="!editMode"
        />
      </div>
    </div>

    <!-- Employment Status -->
    <div class="">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        Employment Status
      </h3>

      <!-- Row 1: Status, Reason Employee In -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <FormField
          label="Status"
          v-model="localData.status"
          type="select"
          :disabled="!editMode"
          placeholder="Select status"
          :options="statusOptions"
        />

        <FormField
          label="Reason Employee In"
          v-model="localData.reasonEmployeeIn"
          type="text"
          :disabled="!editMode"
          placeholder="Enter reason for joining"
        />
      </div>

      <!-- Row 2: Reason Employee Out -->
      <div class="grid grid-cols-1 md:grid-cols-1 gap-6">
        <FormField
          label="Reason Employee Out"
          v-model="localData.reasonEmployeeOut"
          type="text"
          :disabled="!editMode"
          placeholder="Enter reason for leaving (if applicable)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import FormField from "./FormField.vue";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
      nik: "",
      nikTelkom: "",
      businessEmail: "",
      directorate: "",
      businessUnit: "",
      divisi: "",
      grade: "",
      gradeDate: "",
      bandPosition: "",
      bandPositionDate: "",
      level: "",
      levelDate: "",
      position: "",
      supervisor: "",
      joinDate: "",
      startDate: "",
      terminateDate: "",
      reasonEmployeeIn: "",
      reasonEmployeeOut: "",
      status: "",
      retirementDate: "",
    }),
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
});

const emit = defineEmits(["update:modelValue"]);

// Field visibility control based on formConfig
const isFieldVisible = (fieldName) => {
  // If no formConfig or no visibleFields specified, show all fields
  if (!props.formConfig || !props.formConfig.visibleFields) {
    return true;
  }
  
  // For need revision status, only show fields that are in visibleFields
  if (props.formConfig.isNeedRevision && props.formConfig.visibleFields) {
    const isVisible = props.formConfig.visibleFields.has(fieldName);
    return isVisible;
  }
  
  // For other statuses, show all fields
  return true;
};

// Field editability control based on formConfig
const isFieldEditable = (fieldName) => {
  // If disableEditRevision is true, use the new logic for need revision
  if (props.disableEditRevision && props.formConfig && props.formConfig.isNeedRevision) {
    // For need revision status, only allow editing fields that are in editableFields
    if (props.formConfig.editableFields) {
      const isEditable = props.formConfig.editableFields.has(fieldName);
      return isEditable && props.editMode;
    }
    // If no editableFields specified in need revision, disable all fields
    return false;
  }
  
  // Default behavior for non-revision mode or when disableEditRevision is false
  return props.editMode;
};

// Check if field needs warning (for need revision status)
const isFieldNeedingWarning = (fieldName) => {
  if (!props.formConfig || !props.formConfig.isNeedRevision) {
    return false;
  }
  
  const isEditable = props.formConfig.editableFields && props.formConfig.editableFields.has(fieldName);
  
  return isEditable;
};

// Local reactive copy of data
const localData = ref({ ...props.modelValue });

// Watch for changes and emit updates
watch(
  localData,
  (newValue) => {
    emit("update:modelValue", newValue);
  },
  { deep: true }
);

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    // Only reset if the values are actually different to prevent infinite loop
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      // Check if user is actively editing - if so, don't reset
      const isUserEditing = document.activeElement && 
        (document.activeElement.tagName === 'INPUT' || 
         document.activeElement.tagName === 'SELECT' || 
         document.activeElement.tagName === 'TEXTAREA');
      
      if (!isUserEditing) {
        localData.value = { ...newValue };
      }
    }
  },
  { deep: true }
);

// Options data
const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Terminated", label: "Terminated" },
  { value: "Retired", label: "Retired" },
  { value: "Contract", label: "Contract" },
  { value: "Probation", label: "Probation" },
];

// Listen for form reset events
if (process.client) {
  window.addEventListener('formReset', (event) => {
    if (event.detail.success) {
      localData.value = { ...props.modelValue };
    }
  });
}
</script>
