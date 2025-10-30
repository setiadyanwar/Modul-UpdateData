<template>
  <div>
    <div class="lg:hidden mb-4">
      <PageActions
        :isSubmitting="isSubmitting"
        :showChangeLogs="true"
        :status="status"
        :showSaveAsDraft="showSaveAsDraft"
        :hasValidData="hasValidData"
        saveButtonText="Save Changes"
        @open-change-history="$emit('open-change-history')"
        @submit="$emit('submit')"
        @save-as-draft="$emit('save-as-draft')"
      />
    </div>

    <div class="mb-4 md:mb-6">
      <div class="bg-card-bg rounded-lg shadow-sm border border-grey-200 dark:border-grey-700">
        <div class="p-3 md:p-4 border-b border-grey-200 dark:border-grey-700">
          <h3 class="font-semibold text-text-main text-sm md:text-base">
            {{ status === 'draft' ? 'Edit Data' : 'Revise Data' }}
          </h3>
          <p class="text-xs text-grey-500 mt-1">
            {{ status === 'draft' ? 'You can edit the data below and submit your changes' : 'Please revise the data below based on the review feedback' }}
          </p>
        </div>
        <div class="p-3 md:p-4">
          <div v-if="activeTab === 'basic-information'" class="mb-6">
            <div class="grid grid-cols-1 xl:grid-cols-5 gap-8">
              <div class="xl:col-span-1">
                <PhotoUpload :photo-url="photoUrl" :disabled="false" @photo-changed="$emit('photo-changed', $event)" />
              </div>
              <div class="xl:col-span-4">
                <component
                  v-if="currentFormComponent"
                  :is="currentFormComponent"
                  :model-value="dynamicFormData"
                  :edit-mode="true"
                  :disabled="false"
                  :form-config="formConfig"
                  @update:model-value="$emit('update:model-value', $event)"
                />
              </div>
            </div>
          </div>

          <component
            v-if="activeTab !== 'basic-information' && currentFormComponent"
            :is="currentFormComponent"
            :class="{ 'hide-add-education': activeTab === 'education' }"
            :model-value="dynamicFormData"
            :edit-mode="true"
            :disabled="false"
            :form-config="formConfig"
            :is-loading="isLoading"
            :is-tab-eligible="true"
            :original-data="activeTab === 'education' ? (originalEducationData || []) : []"
            :is-edit-draft-page="true"
            @update:model-value="$emit('update:model-value', $event)"
            @insertRequest="$emit('insertRequest', $event)"
            @openChangeRequestModal="$emit('openChangeRequestModal', $event)"
            @editRequest="$emit('editRequest', $event)"
          />

          <div v-if="!currentFormComponent" class="text-center py-6">
            <i class="pi pi-exclamation-triangle text-2xl text-grey-400 mb-2"></i>
            <p class="text-sm text-grey-500">Form component not available for this category</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import PageActions from '~/components/PageActions.vue'
import PhotoUpload from '~/components/form/PhotoUpload.vue'

const props = defineProps({
  isSubmitting: Boolean,
  status: String,
  showSaveAsDraft: Boolean,
  hasValidData: Boolean,
  activeTab: String,
  currentFormComponent: [Object, Function, String],
  dynamicFormData: Object,
  formConfig: Object,
  isLoading: Boolean,
  originalEducationData: Array,
  photoUrl: String
})

defineEmits([
  'open-change-history',
  'submit',
  'save-as-draft',
  'update:model-value',
  'insertRequest',
  'openChangeRequestModal',
  'editRequest',
  'photo-changed'
])
</script>

<style>
/* Hide Add New button in EducationForm only on edit page */
.hide-add-education .flex.gap-2 > button:last-of-type {
  display: none !important;
}
</style>
