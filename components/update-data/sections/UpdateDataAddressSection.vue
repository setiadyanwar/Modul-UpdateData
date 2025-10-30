<template>
  <div class="bg-gray-50 dark:bg-grey-900">
    <div class="bg-white dark:bg-grey-800 rounded-md shadow-sm p-6">
      <AddressSkeleton v-if="isLoading" />
      <AddressForm v-else :model-value="modelValue" :edit-mode="editMode" @update:model-value="val => emit('update:modelValue', val)" />
    </div>

    <!-- Document Upload Section (consistent with payroll/social security) -->
    <div v-if="editMode" class="mt-6 pt-6 border-t border-grey-200 dark:border-grey-700" id="address-upload">
      <MultiDocumentUpload
        :edit-mode="editMode"
        :allow-multiple="false"
        :max-size="5 * 1024 * 1024"
        accept=".pdf,.jpg,.jpeg,.png"
        :max-files="1"
        :show-type-selector="false"
        :lock-type="true"
        :lock-type-value="'3'"
        title="Document Upload"
        :description="`Upload your <span class='text-primary-500 font-bold'>KTP</span> document (required)`"
        :ktp-type="'3'"
        ktp-label="KTP Document"
        @filesChanged="handleFilesChanged"
      />
    </div>
  </div>
</template>

<script setup>
import AddressSkeleton from '~/components/form/AddressSkeleton.vue';
import AddressForm from '~/components/form/AddressForm.vue';
import MultiDocumentUpload from "~/components/common/MultiDocumentUpload.vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  editMode: { type: Boolean, required: true },
  isLoading: { type: Boolean, required: true },
});
const emit = defineEmits(['update:modelValue', 'files-changed']);

// Handle file uploads from MultiDocumentUpload component
const handleFilesChanged = (files) => {
  emit('files-changed', files);
};

// Scroll to upload section
const scrollToUpload = () => {
  if (process.client) {
    setTimeout(() => {
      const uploadSection = document.getElementById('address-upload');
      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
};

// Expose method for parent component
defineExpose({
  scrollToUpload
});
</script>
