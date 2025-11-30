<template>
  <div>
    <div class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-4 md:p-6">
      <!-- Mobile Layout -->
      <div class="block lg:hidden">
        <div class="flex flex-col items-center mb-6">
          <template v-if="isLoading">
            <div class="flex flex-col items-center w-full">
              <!-- Photo skeleton -->
              <div class="relative mb-4 w-full">
                <div class="mx-auto w-full max-w-[8rem] md:max-w-[10rem] aspect-[3/4] rounded-md bg-gradient-to-br from-grey-200 to-grey-300 dark:from-grey-600 dark:to-grey-700 animate-pulse flex items-center justify-center">
                  <div class="w-12 h-12 bg-grey-300 dark:bg-grey-600 rounded-full animate-pulse"></div>
                </div>
              </div>
              <!-- Alert skeleton -->
              <div class="mt-3 md:mt-4 w-full">
                <div class="h-12 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
              </div>
            </div>
          </template>
            <template v-else>
              <PhotoUpload
                :photo-url="modelValue.professionalPhoto || modelValue.professional_photo"
                :disabled="!(editMode && isTabEligible)"
                :parent-loading="isLoading"
                @photo-changed="handleProfessionalPhotoUpload"
              />
            </template>
        </div>
        <BasicInformationSkeleton v-if="isLoading" />
        <BasicInformationForm
          v-else
          :model-value="modelValue"
          :edit-mode="editMode"
          :is-loading="isSubmitting"
          @update:model-value="val => emit('update:modelValue', val)"
        />
      </div>
      <!-- Tablet Layout -->
      <div class="hidden lg:block xl:hidden">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-1 flex flex-col items-center justify-start w-full">
            <template v-if="isLoading">
              <div class="flex flex-col items-center w-full">
                <!-- Photo skeleton -->
                <div class="relative mb-4 w-full">
                  <div class="mx-auto w-full max-w-[8rem] md:max-w-[10rem] aspect-[3/4] rounded-md bg-gradient-to-br from-grey-200 to-grey-300 dark:from-grey-600 dark:to-grey-700 animate-pulse flex items-center justify-center">
                    <div class="w-12 h-12 bg-grey-300 dark:bg-grey-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <!-- Alert skeleton -->
                <div class="mt-3 md:mt-4 w-full">
                  <div class="h-12 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="flex flex-col items-center w-full">
                <PhotoUpload
                  :photo-url="modelValue.professionalPhoto || modelValue.professional_photo"
                  :disabled="!(editMode && isTabEligible)"
                  :parent-loading="isLoading"
                  @photo-changed="handleProfessionalPhotoUpload"
                />
              </div>
            </template>
          </div>
          <div class="lg:col-span-2">
            <BasicInformationSkeleton v-if="isLoading" />
            <BasicInformationForm
              v-else
              :model-value="modelValue"
              :edit-mode="editMode"
              :is-loading="isSubmitting"
              @update:model-value="val => emit('update:modelValue', val)"
            />
          </div>
        </div>
      </div>
      <!-- Desktop Layout -->
      <div class="hidden xl:block">
        <div class="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <div class="xl:col-span-1 flex flex-col items-center justify-start w-full">
            <template v-if="isLoading">
              <div class="flex flex-col items-center w-full">
                <!-- Photo skeleton -->
                <div class="relative mb-4 w-full">
                  <div class="mx-auto w-full max-w-[8rem] md:max-w-[10rem] lg:max-w-[11rem] xl:max-w-[13rem] aspect-[3/4] rounded-md bg-gradient-to-br from-grey-200 to-grey-300 dark:from-grey-600 dark:to-grey-700 animate-pulse flex items-center justify-center">
                    <div class="w-12 h-12 bg-grey-300 dark:bg-grey-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <!-- Alert skeleton -->
                <div class="mt-3 md:mt-4 w-full">
                  <div class="h-12 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
                </div>
              </div>
            </template>
            <template v-else>
              <PhotoUpload
                :photo-url="modelValue.professionalPhoto || modelValue.professional_photo"
                :disabled="!(editMode && isTabEligible)"
                :parent-loading="isLoading"
                @photo-changed="handleProfessionalPhotoUpload"
              />
            </template>
          </div>
          <div class="xl:col-span-4">
            <BasicInformationSkeleton v-if="isLoading" />
            <BasicInformationForm
              v-else
              :model-value="modelValue"
              :edit-mode="editMode"
              :is-loading="isSubmitting"
              @update:model-value="val => emit('update:modelValue', val)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Document Upload Section (reusable component) -->
    <MultiDocumentUpload
      v-if="editMode"
      :edit-mode="editMode"
      :allow-multiple="false"
      :max-size="25 * 1024 * 1024"
      accept=".jpg,.jpeg,.png,.pdf"
      :max-files="1"
      :show-type-selector="false"
      :lock-type="true"
      :lock-type-value="ktpCode"
      :document-type-options="docTypeOptions"
      title="Document Upload"
      :description="`Upload your <span class='text-primary-500 font-bold'>KTP</span> document (required)`"
      :ktp-type="'3'"
      ktp-label="KTP Document"
      @filesChanged="handleFilesChanged"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useDocumentTypes } from '~/composables/useDocumentTypes'
import BasicInformationForm from '~/components/form/BasicInformationForm.vue';
import BasicInformationSkeleton from '~/components/form/BasicInformationSkeleton.vue';
import PhotoUpload from '~/components/form/PhotoUpload.vue';
import Skeleton from '~/components/ui/Skeleton.vue';
import MultiDocumentUpload from '~/components/common/MultiDocumentUpload.vue';

const props = defineProps({
  modelValue: { type: Object, required: true },
  editMode: { type: Boolean, required: true },
  isLoading: { type: Boolean, required: true },
  isSubmitting: { type: Boolean, required: true },
  isTabEligible: { type: Boolean, required: true },
  handlePhotoUpload: { type: Function, required: true },
});

const emit = defineEmits(['update:modelValue', 'filesChanged', 'professional-photo-changed']);

// Load document types from master API and map to options
const { documentTypes, fetchDocumentTypes, getDocumentTypeCode } = useDocumentTypes()
const docTypeOptions = computed(() => documentTypes.value.map(dt => ({ value: dt.code, label: dt.value })))
const ktpCode = computed(() => getDocumentTypeCode('KTP'))

// Store uploaded files and professional photo
const uploadedFiles = ref([]);
const professionalPhotoFile = ref(null);

// Handle professional photo upload from PhotoUpload component
const handleProfessionalPhotoUpload = (file) => {
  professionalPhotoFile.value = file;
  emit('professional-photo-changed', file);
};

// Handle KTP files from MultiDocumentUpload component
const handleFilesChanged = (files) => {
  uploadedFiles.value = files;
  emit('filesChanged', files);
};

// Expose files for parent component to use in save operations
defineExpose({
  getUploadedFiles: () => uploadedFiles.value,
  getProfessionalPhotoFile: () => professionalPhotoFile.value,
  clearFiles: () => {
    uploadedFiles.value = [];
    professionalPhotoFile.value = null;
  }
});

onMounted(() => {
  fetchDocumentTypes()
});

</script>
