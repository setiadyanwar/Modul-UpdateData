<template>
  <div>
    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
      <!-- Left Column - Form -->
      <div class="lg:col-span-4">
        <!-- Action Buttons for mobile and tablet -->
        <div class="lg:hidden mb-4">
          <PageActions
            :isSubmitting="isSubmitting"
            :showChangeLogs="true"
            :status="requestDetail?.status"
            :showSaveAsDraft="requestDetail?.status === '1' || requestDetail?.status === 'draft'"
            :hasValidData="hasValidFormData"
            :activeTab="activeTab"
            saveButtonText="Save Changes"
            @open-change-history="$emit('open-change-history')"
            @submit="$emit('submit-direct')"
            @save-as-draft="$emit('save-as-draft')"
          />
        </div>

        <!-- Editable Form Section - Always show for edit page -->
        <div class="mb-4 md:mb-6">
          <div class="bg-white dark:bg-grey-800 rounded-lg shadow-sm border border-grey-200 dark:border-grey-700">
            <div class="p-3 md:p-4 border-b border-grey-200 dark:border-grey-700">
              <h3 class="font-semibold text-text-main text-sm md:text-base">
                {{ normalizeStatus(requestDetail)?.isDraft ? 'Edit Data' : 'Revise Data' }}
              </h3>
              <p class="text-xs text-grey-500 mt-1">
                {{
                  normalizeStatus(requestDetail)?.isDraft
                    ? 'You can edit the data below and submit your changes'
                    : 'Please revise the data below based on the review feedback'
                }}
              </p>
            </div>
            <div class="p-3 md:p-4">


              <!-- Basic Information Section -->
              <div v-if="activeTab === 'basic-information' && requestDetail">

                <EditDataBasicInformation
                  ref="editDataBasicInfoRef"
                  :request-detail="requestDetail"
                  :active-tab="activeTab"
                  :form-config="formConfig"
                  :is-uploading="isUploading"
                  :employee-data="originalEmployeeData"
                  @form-data-update="$emit('form-data-update', $event)"
                  @professional-photo-upload="$emit('professional-photo-upload', $event)"
                />
              </div>

              <!-- Address Section -->
              <div v-if="activeTab === 'address' && requestDetail">
                <EditDataAddress
                  :request-detail="requestDetail"
                  :active-tab="activeTab"
                  :form-config="formConfig"
                  :is-uploading="isUploading"
                  :address-data="addressData"
                  :original-address-data="originalAddressData"
                  @form-data-update="$emit('form-data-update', $event)"
                />
              </div>


              <!-- Other Form Components -->
              <component
                v-if="activeTab !== 'basic-information' && activeTab !== 'address' && currentFormComponent"
                :is="currentFormComponent"
                ref="currentFormRef"
                :class="{ 'hide-add-education': activeTab === 'education' }"
                :key="activeTab === 'payroll-account' ?
                  `payroll-${requestDetail?.id_change_req || 'new'}-${formConfig?.isNeedRevision ? 'revision' : 'draft'}-${JSON.stringify(requestDetail?.new_data?.data || {})}`
                  : activeTab === 'education' ?
                    `education-${requestDetail?.id_change_req || 'new'}-${educationFormKey}`
                    : `${activeTab}-${requestDetail?.id_change_req || 'new'}`"
                :model-value="activeTab === 'payroll-account' ?
                  (() => {
                    // FORCE FRESH DATA - bypass any Vue caching
                    const statusInfo = normalizeStatus(requestDetail);
                    const isDraft = statusInfo.isDraft;
                    const isRejected = statusInfo.isRejected;

                    if ((isDraft || isRejected) && formConfig?.isNeedRevision) {
                      // For need revision: show new_data values, old_data as fallback
                      const oldData = requestDetail?.old_data || {};
                      const newDataFromRequest = requestDetail?.new_data?.data || {};

                      // Start with old_data as base, then override with ALL new_data values
                      // The editableFields only controls which fields can be edited, not displayed values
                      const result = { ...oldData, ...newDataFromRequest };


                      return result;
                    }

                    // For other cases, use dynamicFormData
                    return dynamicFormData;
                  })()
                  : dynamicFormData"
                :edit-mode="true"
                :disabled="false"
                :form-config="formConfig"
                :disable-edit-revision="normalizeStatus(requestDetail)?.isRejected === true"
                :is-loading="false"
                :is-tab-eligible="true"
                :original-data="activeTab === 'education' ? (requestDetail?.old_data?.education || []) : (activeTab === 'payroll-account' ? (originalPayrollAccountData || {}) : (activeTab === 'social-security' ? (originalSocialSecurityData || {}) : []))"
                :is-edit-draft-page="isEditDraftPage"
                :is-field-visible="isFieldVisible"
                :blood-type-options="activeTab === 'medical-record' ? bloodTypeOptions : []"
                :health-status-options="activeTab === 'medical-record' ? healthStatusOptions : []"
                :request-detail="activeTab === 'education' ? requestDetail : null"
                :show-multi-upload="(activeTab === 'payroll-account' || activeTab === 'social-security') ? false : true"
                @update:model-value="$emit('form-data-update', $event)"
                @insertRequest="$emit('insert-request', $event)"
                @openChangeRequestModal="$emit('open-change-request-modal', $event)"
                @editRequest="$emit('edit-request', $event)"
                @refresh-request-detail="$emit('refresh-request-detail', $event)"
                @pending-upload="$emit('pending-upload', $event)"
              />

              <!-- Fallback if no form component found -->
              <div v-if="!currentFormComponent && activeTab !== 'basic-information' && activeTab !== 'address'" class="text-center py-6">
                <i class="pi pi-exclamation-triangle text-2xl text-grey-400 mb-2"></i>
                <p class="text-sm text-grey-500">Form component not available for this category</p>
              </div>
            </div>
          </div>

          <!-- Multi Document Upload Section - Only for specific categories -->
          <div v-if="['basic-information', 'address', 'family', 'payroll-account', 'social-security'].includes(activeTab)" class="mt-6 lg:col-span-2">
              <MultiDocumentUpload
                :key="`multi-upload-${activeTab}-${multiDocumentUploadKey}`"
                ref="multiDocumentUploadRef"
                data-multi-upload
                :files="uploadedDocuments"
                :is-uploading="isUploading"
                :disabled="false"
                :max-files="getMaxFiles(activeTab)"
                :max-file-size="5"
                :allowed-types="['.jpg', '.jpeg', '.png', '.pdf']"
                :show-type-selector="shouldShowTypeSelector"
                :document-type-options="docTypeOptions"
                :lock-type="shouldLockType"
                :lock-type-value="lockedTypeValue"
                :required-documents="getRequiredDocuments(activeTab)"
                :show-required-indicator="true"
                :title="getDocumentUploadTitle(activeTab)"
                :description="getDocumentUploadSubtitle(activeTab)"
                :existing-document-count="documentCount"
                :existing-documents="existingDocuments"
                :category="activeTab"
                :required-document-count="getRequiredDocumentCount(activeTab)"
                @filesChanged="$emit('files-changed', $event)"
                @upload="$emit('upload', $event)"
                @remove="$emit('document-deleted', $event)"
              />
          </div>
        </div>
      </div>

      <!-- Right Column - Review Notes -->
      <div class="lg:col-span-1">
        <!-- Right Column Sections (Sticky) -->
        <div class="w-full lg:sticky lg:top-6 space-y-4 md:space-y-6">

          <!-- SideEditPage - Show for all categories -->
          <div v-if="requestDetail">

            <SideEditPage
              :request-detail="requestDetail"
              :update-category="getSideEditPageCategory(activeTab)"
              :categories="[activeTab]"
              :files="uploadedDocuments"
              :is-uploading="isUploading"
              :disabled="false"
              :max-files="getMaxFiles(activeTab)"
              :accepted-types="'.jpg,.jpeg,.png,.pdf'"
              :document-section-key="documentSectionKey"
              :multi-document-upload-key="multiDocumentUploadKey"
              :existing-document-count="documentCount"
              @document-view="$emit('document-view', $event)"
              @document-deleted="$emit('document-deleted', $event)"
              @document-count-changed="$emit('document-count-changed', $event)"
              @files-changed="$emit('files-changed', $event)"
              @upload="$emit('upload', $event)"
              @remove="$emit('document-deleted', $event)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Import components
import PageActions from "~/components/common/PageActions.vue";
import EditDataBasicInformation from "~/components/update-data/EditPage/forms/EditDataBasicInformation.vue";
import EditDataAddress from "~/components/update-data/EditPage/forms/EditDataAddress.vue";
import SideEditPage from "~/components/update-data/EditPage/SideEditPage.vue";
import MultiDocumentUpload from "~/components/common/MultiDocumentUpload.vue";

// Define props
const props = defineProps({
  isSubmitting: {
    type: Boolean,
    default: false
  },
  requestDetail: {
    type: Object,
    default: null
  },
  hasValidFormData: {
    type: Boolean,
    default: false
  },
  activeTab: {
    type: String,
    default: ''
  },
  originalEmployeeData: {
    type: Object,
    default: null
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
    default: null
  },
  originalAddressData: {
    type: Object,
    default: null
  },
  currentFormComponent: {
    type: [Object, String],
    default: null
  },
  educationFormKey: {
    type: Number,
    default: 0
  },
  dynamicFormData: {
    type: [Object, Array],
    default: () => ({})
  },
  originalPayrollAccountData: {
    type: Object,
    default: null
  },
  originalSocialSecurityData: {
    type: Object,
    default: null
  },
  isEditDraftPage: {
    type: Boolean,
    default: true
  },
  isFieldVisible: {
    type: Function,
    default: () => true
  },
  bloodTypeOptions: {
    type: Array,
    default: () => []
  },
  healthStatusOptions: {
    type: Array,
    default: () => []
  },
  uploadedDocuments: {
    type: Array,
    default: () => []
  },
  multiDocumentUploadKey: {
    type: Number,
    default: 0
  },
  getMaxFiles: {
    type: Function,
    required: true
  },
  shouldShowTypeSelector: {
    type: Boolean,
    default: false
  },
  docTypeOptions: {
    type: Array,
    default: () => []
  },
  shouldLockType: {
    type: Boolean,
    default: false
  },
  lockedTypeValue: {
    type: String,
    default: ''
  },
  getRequiredDocuments: {
    type: Function,
    required: true
  },
  getDocumentUploadTitle: {
    type: Function,
    required: true
  },
  getDocumentUploadSubtitle: {
    type: Function,
    required: true
  },
  documentCount: {
    type: Number,
    default: 0
  },
  getRequiredDocumentCount: {
    type: Function,
    required: true
  },
  getSideEditPageCategory: {
    type: Function,
    required: true
  },
  documentSectionKey: {
    type: Number,
    default: 0
  },
  normalizeStatus: {
    type: Function,
    required: true
  }
});

// Define emits
defineEmits([
  'open-change-history',
  'submit-direct',
  'save-as-draft',
  'form-data-update',
  'professional-photo-upload',
  'insert-request',
  'open-change-request-modal',
  'edit-request',
  'refresh-request-detail',
  'pending-upload',
  'files-changed',
  'upload',
  'document-deleted',
  'document-view',
  'document-count-changed'
]);

// Computed to get existing documents from requestDetail
const existingDocuments = computed(() => {
  return props.requestDetail?.attachments || props.requestDetail?.documents || [];
});
</script>