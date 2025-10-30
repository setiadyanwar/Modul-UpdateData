<template>
  <div>
    <div v-if="isLoading">
      <EmploymentInfoSkeleton />
    </div>
    <div v-else>
      <div class="w-full">
        <div class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6">
          <div class="flex items-center mb-6">
            <div class="w-10 h-10 bg-cyan-100 dark:bg-cyan-900 rounded-md flex items-center justify-center mr-3">
              <i class="pi pi-briefcase text-cyan-600 dark:text-cyan-400 text-lg"></i>
            </div>
            <h4 class="text-xl font-bold text-text-main">Employment Information</h4>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="NIK" type="text" :model-value="modelValue.nik" :disabled="true" />
            <FormField label="NIK Telkom" type="text" :model-value="modelValue.nik_telkom" :disabled="true" />
            <FormField label="Business Email" type="email" :model-value="modelValue.business_email" :disabled="true" />
            <FormField label="Directorate" type="text" :model-value="modelValue.directorate" :disabled="true" />
            <FormField label="Business Unit" type="text" :model-value="modelValue.business_unit" :disabled="true" />
            <FormField label="Division" type="text" :model-value="modelValue.divisi" :disabled="true" />
            <FormField label="Grade" type="text" :model-value="modelValue.grade" :disabled="true" />
            <FormField label="Grade Date" type="date" :model-value="modelValue.grade_date" :disabled="true" />
            <FormField label="Band Position" type="text" :model-value="modelValue.band_position" :disabled="true" />
            <FormField label="Level" type="text" :model-value="modelValue.level" :disabled="true" />
            <FormField label="Level Date" type="date" :model-value="modelValue.level_date" :disabled="true" />
            <FormField label="Position" type="text" :model-value="modelValue.position" :disabled="true" />
            <FormField label="Direct Superior" type="text" :model-value="modelValue.supervisor" :disabled="true" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import EmploymentInfoSkeleton from '~/components/form/EmploymentInfoSkeleton.vue';
import FormField from '~/components/form/FormField.vue';
const props = defineProps({
  modelValue: { type: Object, required: true },
  isLoading: { type: Boolean, required: true },
});
</script>
