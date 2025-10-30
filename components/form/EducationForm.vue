<template>
  <div>

    <!-- Show message when no fields are visible -->
    <div v-if="formConfig && formConfig.isNeedRevision && !isSectionVisible" class="text-center py-8 text-gray-500">
      <p>No education fields need to be updated for this revision.</p>
    </div>
    <!-- Header with Action Buttons -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center">
        <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-md flex items-center justify-center mr-3">
          <i class="pi pi-graduation-cap text-indigo-600 dark:text-indigo-400 text-lg"></i>
        </div>
        <h4 class="text-xl font-bold text-text-main">Education Information</h4>
      </div>
      <div class="flex gap-2">
        <!-- Edit Button - Only visible when there's existing data and not in insert mode -->
        <!-- HIDDEN: Edit button removed for edit draft page -->
        <button v-if="hasExistingData && !showInsertForm && !isEditing && !isEditDraftPage" @click="startEditMode"
          type="button"
          class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
            </path>
          </svg>
          Edit
        </button>

        <!-- Update/Cancel Buttons - Only visible when editing and NOT on edit draft page -->
        <template v-if="isEditing && !showInsertForm && !isEditDraftPage">
          <button @click="saveChanges" type="button"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            :disabled="!hasChanges">
            <i class="pi pi-check mr-2"></i>
            Update
          </button>
          <button @click="cancelEdit" type="button"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <i class="pi pi-times mr-2"></i>
            Cancel
          </button>
        </template>

        <!-- Info text when button is disabled due to active requests -->
        <span v-if="!isEditing && !showInsertForm && !canAddNewEducationRecord"
          class="text-xs text-orange-500 dark:text-orange-400 mr-2">
          {{ disabledReason }}
        </span>

        <!-- Add New Button - Disabled when editing, inserting, or when there are active requests -->
        <button @click="startInsertFlow" type="button"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          :disabled="isEditing || showInsertForm || !canAddNewEducationRecord">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Add New
        </button>
      </div>
    </div>

    <!-- Insert Form - Always editable for new data -->
    <div v-if="showInsertForm"
      class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-text-main">New Education Record</span>
          <span
            class="ml-2 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            Adding
          </span>
        </div>
        <div class="flex gap-2 items-center">
          <button @click="showDiscardConfirmation" type="button"
            class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <i class="pi pi-times mr-2"></i> Cancel
          </button>
          <button @click="submitInsert" type="button"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            :disabled="!isInsertDataValid">
            <i class="pi pi-check mr-2"></i> Submit
          </button>
        </div>
      </div>

      <!-- New Education Record Form -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField 
          label="Level" 
          type="select" 
          v-model="insertData.edu_level_id" 
          master-data-category="EDU_LEVELS"
          placeholder="Select level"
        />
        
        <FormField 
          label="Major" 
          type="select" 
          v-model="insertData.edu_major_id" 
          master-data-category="EDU_MAJORS"
          placeholder="Select major"
        />
        
        <FormField 
          label="Institution" 
          type="select" 
          v-model="insertData.edu_institution_id" 
          master-data-category="EDU_INSTITUTIONS"
          placeholder="Select institution"
        />
        
        <FormField 
          label="Start Date" 
          type="date" 
          v-model="insertData.edu_start_date" 
          placeholder="Select start date"
          :min-date="new Date(1900, 0, 1)"
          :max-date="new Date(new Date().getFullYear() + 10, 11, 31)"
        />
        
        <FormField 
          label="End Date" 
          type="date" 
          v-model="insertData.edu_end_date" 
          placeholder="Select end date"
          :min-date="new Date(1900, 0, 1)"
          :max-date="new Date(new Date().getFullYear() + 10, 11, 31)"
        />
        
        <FormField 
          label="Ijazah Document" 
          type="file" 
          v-model="insertData.ijazah_doc" 
          accept=".jpg,.jpeg,.png,.pdf"
          file-hint="Upload ijazah document (PDF, JPG, PNG)"
          class="md:col-span-2"
          :use-update-data-preview="true"
          @file-upload="onInsertFileSelected"
        />
      </div>
    </div>

    <!-- Existing Education Records -->
    <div v-if="Array.isArray(localData.education_records) && localData.education_records.length > 0" class="space-y-6 education-records-list">
      <div v-for="(record, index) in localData.education_records" :key="index"
        :data-record-index="index"
        class="education-record-card bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6 transition-all">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
              <span class="text-indigo-600 dark:text-indigo-400 font-medium text-sm">{{ index + 1 }}</span>
            </div>
            <h4 class="text-md font-bold text-gray-900 dark:text-gray-100">
              {{ getEducationTitle(record, index) }}
            </h4>
          </div>

          <div class="flex gap-3 items-center">
            <!-- Status Toggle -->
            <Toggle
              :model-value="record.status === 1"
              @update:model-value="val => updateRecordStatus(index, val ? 1 : 0)"
              :disabled="!effectiveIsEditing || !isFieldEditable('edu_level_id', index)"
            />
          </div>
        </div>

        <!-- Content -->
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Level"
            type="select"
            v-model="record.edu_level_id"
            :disabled="!effectiveIsEditing || !isFieldEditable('edu_level_id', index)"
            master-data-category="EDU_LEVELS"
            placeholder="Select level"
            :class="getFieldValidationClass(record, 'edu_level_id')"
          />

          <FormField
            label="Major"
            type="select"
            v-model="record.edu_major_id"
            :disabled="!effectiveIsEditing || !isFieldEditable('edu_major_id', index)"
            master-data-category="EDU_MAJORS"
            placeholder="Select major"
            :class="getFieldValidationClass(record, 'edu_major_id')"
          />

          <FormField
            label="Institution"
            type="select"
            v-model="record.edu_institution_id"
            :disabled="!effectiveIsEditing || !isFieldEditable('edu_institution_id', index)"
            master-data-category="EDU_INSTITUTIONS"
            placeholder="Select institution"
            :class="getFieldValidationClass(record, 'edu_institution_id')"
          />

          <FormField
            label="Start Date"
            type="date"
            v-model="record.edu_start_date"
            :disabled="!effectiveIsEditing || !isFieldEditable('edu_start_date', index)"
            placeholder="Select start date"
            :min-date="new Date(1900, 0, 1)"
            :max-date="new Date(new Date().getFullYear() + 10, 11, 31)"
            :class="getFieldValidationClass(record, 'edu_start_date')"
          />

          <FormField
            label="End Date"
            type="date"
            v-model="record.edu_end_date"
            :disabled="!effectiveIsEditing || !isFieldEditable('edu_end_date', index)"
            placeholder="Select end date"
            :min-date="new Date(1900, 0, 1)"
            :max-date="new Date(new Date().getFullYear() + 10, 11, 31)"
            :class="getFieldValidationClass(record, 'edu_end_date')"
          />
          
          <!-- Hide Ijazah Document field in edit page -->
          <FormField 
            v-if="!isEditDraftPage"
            label="Ijazah Document" 
            type="file" 
            v-model="record.ijazah_doc" 
            :disabled="!effectiveIsEditing || !isFieldEditable('edu_level_id', index)"
            accept=".jpg,.jpeg,.png,.pdf"
            file-hint="Upload ijazah document (PDF, JPG, PNG)"
            class="md:col-span-2"
            :use-update-data-preview="true"
            @file-upload="file => onEditFileSelected(index, file)"
          />
          
          <!-- Attachments section for edit page -->
          <div v-if="isEditDraftPage" class="md:col-span-2">
            
            
            <UiFileUpload
              name="ijazah"
              title="Ijazah Document"
              file-info="PNG, JPG, JPEG, PDF · max 25MB"
              empty-text="Drag & drop or browse ijazah."
              :disabled="isUploading"
              :existing-files="getExistingFiles(record, index)"
              @select="(e) => uploadNewAttachment(e.files?.[0], index)"
              @view-existing="viewAttachment"
              @remove-existing="removeAttachment"
            />
            
            <!-- Pending uploads indicator - only show for draft, not for need revisions -->
            <div v-if="record.pendingUploads && record.pendingUploads.length > 0 && !isNeedRevisionStatus" class="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <div class="flex items-center gap-2">
                <i class="pi pi-clock text-yellow-600 dark:text-yellow-400"></i>
                <span class="text-sm text-yellow-800 dark:text-yellow-200">
                  {{ record.pendingUploads.length }} file(s) ready for upload. Click "Save Changes" to upload.
                </span>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>

    <!-- Single Education Form (for backward compatibility) -->
    <div v-else-if="!showInsertForm"
      class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField 
          label="Level" 
          type="select" 
          v-model="localData.edu_level_id" 
          :disabled="!isEditing"
          master-data-category="EDU_LEVELS"
          placeholder="Select level"
        />
        
        <FormField 
          label="Major" 
          type="select" 
          v-model="localData.edu_major_id" 
          :disabled="!isEditing"
          master-data-category="EDU_MAJORS"
          placeholder="Select major"
        />
        
        <FormField 
          label="Institution" 
          type="select" 
          v-model="localData.edu_institution_id" 
          :disabled="!isEditing"
          master-data-category="EDU_INSTITUTIONS"
          placeholder="Select institution"
        />
        
        <FormField 
          label="Start Date" 
          type="date" 
          v-model="localData.edu_start_date" 
          :disabled="!isEditing"
          placeholder="Select start date"
          :min-date="new Date(1900, 0, 1)"
          :max-date="new Date(new Date().getFullYear() + 10, 11, 31)"
        />
        
        <FormField 
          label="End Date" 
          type="date" 
          v-model="localData.edu_end_date" 
          :disabled="!isEditing"
          placeholder="Select end date"
          :min-date="new Date(1900, 0, 1)"
          :max-date="new Date(new Date().getFullYear() + 10, 11, 31)"
        />
        
        <FormField 
          label="Ijazah Document" 
          type="file" 
          v-model="localData.ijazah_doc" 
          :disabled="true"
          accept=".jpg,.jpeg,.png,.pdf"
          file-hint="Document upload is disabled"
          class="md:col-span-2"
          :use-update-data-preview="true"
        />
      </div>
    </div>

    <!-- Confirmation Modal for Discard Changes -->
    <ConfirmationModal
      :is-visible="showDiscardModal"
      title="Discard Changes?"
      message="You have unsaved changes. Are you sure you want to discard them? This action cannot be undone."
      variant="danger"
      @close="showDiscardModal = false"
      @confirm="discardChanges"
      @cancel="showDiscardModal = false"
    />

    <!-- Document Preview Modal -->
    <DocumentPreviewModal
      :is-open="showDocumentPreview"
      :item-id="selectedDocument?.item_id"
      :document-name="selectedDocument?.file_name || 'Document'"
      @close="closeDocumentPreview"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      :is-visible="showDeleteModal"
      title="Delete File"
      :message="deleteModalMessage"
      save-button-text="Cancel"
      continue-button-text="Delete"
      @close="showDeleteModal = false"
      @save-draft="showDeleteModal = false"
      @continue="confirmDeleteAttachment"
    />

  </div>
</template>

<script setup>
import FormField from "./FormField.vue";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";
import UiFileUpload from '~/components/ui/FileUpload.vue';
import DocumentPreviewModal from "~/components/update-data/modals/DocumentPreviewModal.vue";
import Toggle from "~/components/ui/Toggle.vue";
import { onMounted, ref, watch, computed, nextTick } from 'vue';
import { useMasterData } from '~/composables/useMasterData';
import { useRequestStatus } from "~/composables/useRequestStatus";
import { useAttachments } from "~/composables/useAttachments";
import { useApi } from "~/composables/useApi.js";
import { useToast } from "~/composables/useToast.js";

// Cache for master data labels
const masterDataCache = ref({
  EDU_LEVELS: [],
  EDU_INSTITUTIONS: [],
  EDU_MAJORS: []
});

// Helper function to get label from master data
const getLabelFromMasterData = (category, code) => {
  if (!code) return null;

  // Convert code to string for comparison
  const codeStr = String(code);
  const data = masterDataCache.value[category] || [];

  // Try to find by code first
  let item = data.find(item => String(item.code) === codeStr);

  // If not found by code, try to find by id
  if (!item) {
    item = data.find(item => String(item.id) === codeStr);
  }

  // Return value if found, otherwise null (not the code itself)
  return item ? item.value : null;
};

// Helper function to get education title (level | institution)
const getEducationTitle = (record, index = 0) => {
  const levelLabel = getLabelFromMasterData('EDU_LEVELS', record.edu_level_id || record.edu_level);
  const institutionLabel = getLabelFromMasterData('EDU_INSTITUTIONS', record.edu_institution_id || record.edu_institution);

  // Check if we have valid labels (not null and not just IDs)
  const hasValidLevel = levelLabel && !levelLabel.match(/^\d+$/);
  const hasValidInstitution = institutionLabel && !institutionLabel.match(/^\d+$/);

  if (hasValidLevel && hasValidInstitution) {
    return `${levelLabel} | ${institutionLabel}`;
  } else if (hasValidLevel) {
    return levelLabel;
  } else if (hasValidInstitution) {
    return institutionLabel;
  } else {
    // Fallback to "Education 1", "Education 2", etc
    return `Education ${index + 1}`;
  }
};

// Simplified upload function for edit page


// Document preview modal state
const showDocumentPreview = ref(false);
const selectedDocument = ref(null);

// Delete confirmation modal state
const showDeleteModal = ref(false);
const deleteModalMessage = ref('');
const attachmentToDelete = ref(null);

// Function to view attachment (opens DocumentPreviewModal)
const viewAttachment = (attachment) => {
  if (attachment) {
    selectedDocument.value = attachment;
    showDocumentPreview.value = true;
  }
};

// Function to close document preview modal
const closeDocumentPreview = () => {
  showDocumentPreview.value = false;
  selectedDocument.value = null;
};

// Function to remove attachment
const removeAttachment = (attachment) => {
  if (!attachment || !attachment.item_id) {
    console.warn('Invalid attachment for removal:', attachment);
    toastError('Cannot delete: No file ID found');
    return;
  }

  // Store attachment to delete and show confirmation modal
  attachmentToDelete.value = attachment;
  deleteModalMessage.value = `Are you sure you want to delete "${attachment.file_name || 'this document'}"? This action cannot be undone.`;
  showDeleteModal.value = true;
};

// Function to confirm delete attachment
const confirmDeleteAttachment = async () => {
  const attachment = attachmentToDelete.value;
  if (!attachment) return;

  try {
    // Set loading state
    isUploading.value = true;
    
    // Make API call to delete attachment using the correct endpoint
    const response = await apiDelete(`/employee/attachments/${attachment.item_id}/delete`);
    
    if (response.success || response.status) {
      toastSuccess('Document deleted successfully');
      
      // Emit event to parent to refresh data
      emit('remove-attachment', attachment);
      
      // Emit event to parent to refresh request detail
      emit('refresh-request-detail');
    } else {
      throw new Error(response.message || 'Failed to delete document');
    }
  } catch (error) {
    toastError(error.message || 'Failed to delete document. Please try again.');
  } finally {
    isUploading.value = false;
    showDeleteModal.value = false;
    attachmentToDelete.value = null;
    deleteModalMessage.value = '';
  }
};

// Function to get existing files from request detail attachments by client_key
const getExistingFiles = (record, recordIndex) => {
  // First check if record has attachment field (from parent mapping)
  if (record.attachment) {
    // Validate attachment has required fields
    if (record.attachment.item_id && record.attachment.file_name) {
      return [record.attachment];
    }
  }
  
  // Get attachments from request detail by client_key
  const requestDetail = props.requestDetail;
  
  // Try attachments first
  let attachments = requestDetail?.attachments;
  if (!attachments) {
    // Fallback to documents
    attachments = requestDetail?.documents;
  }
  
  if (requestDetail && attachments && Array.isArray(attachments)) {
    // Find attachment by matching client_key instead of using index
    const recordClientKey = record.client_key;
    
    if (recordClientKey) {
      const matchingAttachment = attachments.find(attachment => 
        attachment.client_key === recordClientKey
      );
      
      // Validate attachment exists and has required fields
      if (matchingAttachment && matchingAttachment.item_id && matchingAttachment.file_name) {
        const attachmentWithUrls = {
          ...matchingAttachment,
          preview_url: `/employee/attachments/${matchingAttachment.item_id}/preview`,
          download_url: `/employee/attachments/${matchingAttachment.item_id}/download`,
          info_url: `/employee/attachments/${matchingAttachment.item_id}/information`,
        };
        
        return [attachmentWithUrls];
      }
    }
  }
  
  return [];
};

// Function to upload pending files after save changes
const uploadPendingFiles = async (changeRequestId) => {
  const pendingUploads = [];
  
  // Collect all pending uploads from all records
  if (localData.value.education_records) {
    localData.value.education_records.forEach((record, recordIndex) => {
      if (record.pendingUploads && record.pendingUploads.length > 0) {
        record.pendingUploads.forEach(pendingFile => {
          pendingUploads.push({
            ...pendingFile,
            changeRequestId: changeRequestId
          });
        });
      }
    });
  }
  
  if (pendingUploads.length === 0) {
    return { success: true, uploaded: 0 };
  }
  
  try {
    isUploading.value = true;
    
    // Upload all pending files
    const uploadPromises = pendingUploads.map(async (pendingFile) => {
      try {
        const result = await uploadAttachment(
          changeRequestId, 
          pendingFile.file, 
          ['8'], 
          null, 
          { client_key: pendingFile.clientKey }
        );
        
        if (result.success) {
          // Clear pending uploads for this record
          const record = pendingFile.record;
          if (record.pendingUploads) {
            record.pendingUploads = record.pendingUploads.filter(
              p => p !== pendingFile
            );
          }
          
          return { success: true, data: result.data };
        } else {
          throw new Error(result.message || 'Upload failed');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        return { success: false, error: error.message };
      }
    });
    
    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    if (successful > 0) {
      toastSuccess(`${successful} file(s) uploaded successfully`);
    }
    
    if (failed > 0) {
      toastError(`${failed} file(s) failed to upload`);
    }
    
    return { success: true, uploaded: successful, failed: failed };
    
  } catch (error) {
    toastError('Failed to upload files: ' + error.message);
    return { success: false, error: error.message };
  } finally {
    isUploading.value = false;
  }
};

// Expose uploadPendingFiles function to parent
defineExpose({
  uploadPendingFiles
});


// Function to upload new attachment (store locally, upload on save)
const uploadNewAttachment = async (file, recordIndex) => {
  if (!file) return;
  
  try {
    isUploading.value = true;
    
    // Generate client key for this record
    const record = localData.value.education_records[recordIndex];

    // Use existing client_key if available, otherwise generate new one
    let clientKey = record.client_key;
    if (!clientKey) {
      clientKey = generateClientKey();
      // Set client_key in the record
      record.client_key = clientKey;
    }

    
    // Store file locally for later upload
    const pendingFile = {
      file: file,
      recordIndex: recordIndex,
      clientKey: clientKey,
      record: record
    };
    
    // Add to pending uploads
    if (!record.pendingUploads) {
      record.pendingUploads = [];
    }
    record.pendingUploads.push(pendingFile);

    // Show success message (only for draft, not for need revisions)
    if (!isNeedRevisionStatus.value) {
      toastSuccess('File ready for upload. Click "Save Changes" to upload.');
    } else {
      toastSuccess('File selected. Will be uploaded when you submit the revision.');
    }

    // Emit event to parent to indicate pending upload
    emit('pending-upload', { file: pendingFile, recordIndex });

  } catch (error) {
    console.error('🔍 Error in uploadNewAttachment:', error);
    toastError(error.message || 'Failed to prepare file for upload. Please try again.');
  } finally {
    isUploading.value = false;
  }
};

const props = defineProps({
  modelValue: {
    type: [Object, Array],
    required: true,
    default: () => [],
  },
  editMode: {
    type: Boolean,
    default: false,
  },
  formConfig: {
    type: Object,
    default: () => ({}),
  },
  originalData: {
    type: Array,
    default: () => [],
  },
  isEditDraftPage: {
    type: Boolean,
    default: false,
  },
  requestDetail: {
    type: Object,
    default: null,
  },
  disableEditRevision: {
    type: Boolean,
    default: false,
  },
  disableEditRevision: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "insertRequest", "editRequest", "openChangeRequestModal", "view", "deleted", "uploaded", "remove-attachment", "refresh-request-detail", "pending-upload"]);
// Attachments helper
const { validateFile, uploadAttachment } = useAttachments();
const { apiDelete } = useApi();
const { success: toastSuccess, error: toastError } = useToast();

// client_key generator
const generateClientKey = () => {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
};

// Track client_key per record (for insert forms and edit records)
const insertClientKey = ref("");
const isUploading = ref(false);

const onInsertFileSelected = (file) => {
  try {
    validateFile(file);
  } catch (e) {
    insertData.value.ijazah_doc = "";
    return;
  }
  if (!insertClientKey.value) insertClientKey.value = generateClientKey();
};

const onEditFileSelected = (index, file) => {
  try {
    validateFile(file);
  } catch (e) {
    if (localData.value.education_records[index]) {
      localData.value.education_records[index].ijazah_doc = "";
    }
    return;
  }
  // Generate client key for this record
  const record = localData.value.education_records[index];
  if (!record.client_key) {
    record.client_key = generateClientKey();
  }
};

// Field visibility control based on formConfig
const isFieldVisible = (fieldName) => {
  // Always show all fields - we'll handle visibility with accordion instead
  return true;
};

// Check section visibility
const isSectionVisible = computed(() => {
  if (!props.formConfig || !props.formConfig.visibleFields || !props.formConfig.isNeedRevision) {
    return true;
  }

  const educationFields = [
    'education_institution', 'education_level', 'education_major',
    'graduation_year', 'gpa', 'education_certificate', 'academic_transcript'
  ];

  return educationFields.some(field => props.formConfig.visibleFields.has(field));
});

// Check if record is in new_data (for accordion logic)
const isRecordInNewData = (recordIndex) => {
  if (!props.isEditDraftPage) return true;

  const newData = props.formConfig?.newData || [];
  const record = props.modelValue[recordIndex];

  if (!record || !record.id_education) {
    return false;
  }

  const recordInNewData = newData.find(item => item.id_education === record.id_education);
  return !!recordInNewData;
};

// Field editability control based on formConfig
const isFieldEditable = (fieldName, recordIndex = 0) => {
  // Debug formConfig

  // Get current record
  const records = Array.isArray(localData.value.education_records)
    ? localData.value.education_records
    : (Array.isArray(props.modelValue) ? props.modelValue : []);

  const record = records[recordIndex];

  if (!record) {
    return false;
  }


  // PRIORITY 1: For need revision status, check if this specific field is in new_data (field-level check)
  if (props.formConfig && props.formConfig.isNeedRevision) {
    let newData = props.formConfig.newData || [];

    // Handle case where newData might be nested under 'education' key
    if (!Array.isArray(newData) && newData.education) {
      newData = newData.education;
    }

    // Ensure newData is an array
    if (!Array.isArray(newData)) {
      newData = [];
    }


    // ✅ FIX: For action INSERT (no id_education yet), match by client_key or index
    let recordInNewData;
    if (record.id_education) {
      // UPDATE action: match by id_education
      recordInNewData = newData.find(item => item.id_education === record.id_education);
    } else if (record.client_key) {
      // INSERT action: match by client_key
      recordInNewData = newData.find(item => item.client_key === record.client_key);
    } else {
      // Fallback: match by index
      recordInNewData = newData[recordIndex];
    }

    if (!recordInNewData) {
      return false;
    }

    // ✅ For INSERT action, all fields in new_data are editable
    if (!record.id_education) {
      return props.editMode;
    }

    // For UPDATE action, check if this specific field has a value in new_data (meaning it was edited)
    const hasValue = recordInNewData[fieldName] !== null &&
      recordInNewData[fieldName] !== undefined &&
      recordInNewData[fieldName] !== '';

    return hasValue && props.editMode;
  }

  // PRIORITY 2: For draft status in edit page, only allow editing if record is in new_data
  if (props.isEditDraftPage) {
    // Check if this record exists in new_data
    let newData = props.formConfig?.newData || [];

    // Handle case where newData might be nested under 'education' key
    if (!Array.isArray(newData) && newData.education) {
      newData = newData.education;
    }

    if (!record.id_education) {
      return false;
    }

    // Check if this record exists in new_data
    const recordInNewData = newData.find(item => item.id_education === record.id_education);
    if (!recordInNewData) {
      return false;
    }

    return props.editMode;
  }

  // Default behavior for non-revision mode
  return props.editMode;
};

// Check if field needs warning (for need revision status)
const isFieldNeedingWarning = (fieldName, recordIndex = 0) => {
  if (!props.formConfig || !props.formConfig.isNeedRevision) {
    return false;
  }

  // Field needs warning if it's editable (meaning it's in new_data)
  return isFieldEditable(fieldName, recordIndex);
};

// Request status checking
const { canAddNewRecord, getDisabledReason } = useRequestStatus()

// Update record status
const updateRecordStatus = (index, status) => {
  if (localData.value.education_records[index]) {
    localData.value.education_records[index].status = status;
  }
};

// Check if user can add new education record
const canAddNewEducationRecord = computed(() => {
  return canAddNewRecord('Education')
})

// Get disabled reason for education
const disabledReason = computed(() => {
  return getDisabledReason('Education')
})

// Function to check if a specific field has been changed
const isFieldChanged = (record, field) => {
  if (!props.editMode || !props.originalData || !Array.isArray(props.originalData)) return true;

  const originalRecord = props.originalData.find(orig => orig.id_education === record.id_education);
  if (!originalRecord) return true; // New record counts as changed

  const currentValue = record[field];
  const originalValue = originalRecord[field];
  return String(currentValue || '') !== String(originalValue || '');
};

// Function to get field validation class (red border if not changed)
const getFieldValidationClass = (record, field) => {
  if (!props.editMode) return '';

  const requiredFields = ['edu_level_id', 'edu_major_id', 'edu_institution_id', 'edu_start_date', 'edu_end_date'];
  if (!requiredFields.includes(field)) return '';

  const hasChanges = localData.value.education_records?.some(r =>
    requiredFields.some(f => isFieldChanged(r, f))
  );

  if (!hasChanges) return ''; // No changes at all, no validation needed

  const isChanged = isFieldChanged(record, field);


  return isChanged ? '' : 'border-red-500 focus:border-red-500';
};

// Function to validate education fields - check if all required fields are modified when any field is changed
const validateEducationFields = () => {
  if (!props.editMode || !localData.value.education_records || !Array.isArray(localData.value.education_records)) {
    return true;
  }

  const original = props.originalData;
  const current = localData.value.education_records;

  if (!original || !Array.isArray(original) || original.length === 0) {
    return true;
  }

  const requiredFields = ['edu_level_id', 'edu_major_id', 'edu_institution_id', 'edu_start_date', 'edu_end_date'];

  // Check if any record has been modified
  const hasAnyChanges = current.some((record, index) => {
    const originalRecord = original.find(orig => orig.id_education === record.id_education);
    if (!originalRecord) {
      return true; // New record counts as change
    }

    const recordHasChanges = requiredFields.some(field => {
      const currentValue = record[field];
      const originalValue = originalRecord[field];
      const isChanged = String(currentValue || '') !== String(originalValue || '');

      return isChanged;
    });

    return recordHasChanges;
  });

  // If no changes, validation passes
  if (!hasAnyChanges) {
    return true;
  }

  // If changes exist, ALL required fields must be CHANGED for ALL records that have changes
  const allFieldsChanged = current.every((record, index) => {
    const originalRecord = original.find(orig => orig.id_education === record.id_education);

    // If this is a new record, it's valid
    if (!originalRecord) {
      return true;
    }

    // Check if this record has any changes
    let hasRecordChanges = false;
    for (const field of requiredFields) {
      const currentValue = record[field];
      const originalValue = originalRecord[field];

      // Normalize values for comparison
      const normalizedCurrent = String(currentValue || '').trim();
      const normalizedOriginal = String(originalValue || '').trim();

      if (normalizedCurrent !== normalizedOriginal) {
        hasRecordChanges = true;
        break;
      }
    }

    // If this record has changes, ALL fields must be changed
    if (hasRecordChanges) {
      let allFieldsChangedForRecord = true;

      for (const field of requiredFields) {
        const currentValue = record[field];
        const originalValue = originalRecord[field];

        // Normalize values for comparison
        const normalizedCurrent = String(currentValue || '').trim();
        const normalizedOriginal = String(originalValue || '').trim();

        if (normalizedCurrent === normalizedOriginal) {
          allFieldsChangedForRecord = false;
        }
      }

      if (!allFieldsChangedForRecord) {
        return false;
      }
    }

    return true; // If no changes, record is valid
  });

  return allFieldsChanged;
};

// Local reactive copy of data - normalize to proper structure
const localData = ref(normalizeEducationData(props.modelValue));

// Helper function to normalize data structure
function normalizeEducationData(data) {
  let normalizedData;
  
  if (Array.isArray(data)) {
    // If data is array, wrap it in education_records structure
    normalizedData = {
      education_records: data,
      edu_level_id: null,
      edu_major_id: null,
      edu_institution_id: null,
      edu_start_date: "",
      edu_end_date: "",
      ijazah_doc: null,
      ijazah_doc_id: null,
    };
  } else if (data && typeof data === 'object') {
    // If data is object, use as is but ensure education_records exists
    normalizedData = {
      education_records: data.education_records || [],
      edu_level_id: data.edu_level_id || null,
      edu_major_id: data.edu_major_id || null,
      edu_institution_id: data.edu_institution_id || null,
      edu_start_date: data.edu_start_date || "",
      edu_end_date: data.edu_end_date || "",
      ijazah_doc: data.ijazah_doc || null,
      ijazah_doc_id: data.ijazah_doc_id || null,
    };
  } else {
    // Default structure
    normalizedData = {
      education_records: [],
      edu_level_id: null,
      edu_major_id: null,
      edu_institution_id: null,
      edu_start_date: "",
      edu_end_date: "",
      ijazah_doc: null,
      ijazah_doc_id: null,
    };
  }
  
  // Ensure all education records have client_key
  if (normalizedData.education_records && Array.isArray(normalizedData.education_records)) {
    normalizedData.education_records.forEach((record, index) => {
      if (!record.client_key) {
        record.client_key = generateClientKey();
      }
    });
  }
  
  return normalizedData;
}

// Insert form state
const showInsertForm = ref(false);
const isEditing = ref(false);
const originalData = ref({});
const showDiscardModal = ref(false);

// For edit draft page, always enable editing
const effectiveIsEditing = computed(() => {
  return isEditing.value || props.isEditDraftPage;
});

// Check if current status is need revision
const isNeedRevisionStatus = computed(() => {
  return props.formConfig?.isNeedRevision || false;
});
const insertData = ref({
  edu_institution_id: "",
  edu_level_id: "",
  edu_major_id: "",
  edu_start_date: "",
  edu_end_date: "",
  ijazah_doc: "",
  status: 1,
});

// Computed properties
const isInsertMode = computed(() => showInsertForm.value);
const hasExistingData = computed(() => {
  return (Array.isArray(localData.value.education_records) && localData.value.education_records.length > 0) ||
    localData.value.edu_institution_id ||
    localData.value.edu_level_id ||
    localData.value.edu_major_id;
});

const isInsertDataValid = computed(() => {
  return insertData.value.edu_institution_id !== '' &&
    insertData.value.edu_level_id !== '' &&
    insertData.value.edu_major_id !== '';
});

const hasChanges = computed(() => {
  if (!isEditing.value || !originalData.value.education_records) return false;

  return JSON.stringify(localData.value) !== JSON.stringify(originalData.value);
});

// Watch for changes and emit updates
watch(
  localData,
  (newValue) => {
    // Ensure all education records have client_key
    if (newValue.education_records && Array.isArray(newValue.education_records)) {
      newValue.education_records.forEach((record, index) => {
        if (!record.client_key) {
          record.client_key = generateClientKey();
        }
      });
    }
    
    // Always emit education_records array for education data
    // This ensures consistent array format for education submissions
    emit("update:modelValue", newValue.education_records || []);
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

      if (!isUserEditing && newValue) {
        localData.value = normalizeEducationData(newValue);
        
        // Ensure all education records have client_key after normalization
        if (localData.value.education_records && Array.isArray(localData.value.education_records)) {
          localData.value.education_records.forEach((record, index) => {
            if (!record.client_key) {
              record.client_key = generateClientKey();
            }
          });
        }
      }
    }
  },
  { deep: true }
);

// Master-data helpers
const { loadMasterData, getOptions, masterData } = useMasterData();

// Resolve various incoming shapes into the option.code (ID string)
const resolveMasterId = async (category, raw) => {
  if (raw == null) return '';

  // If it's already an object with an id field
  if (typeof raw === 'object') {
    const id = raw.id_edu_institution || raw.id_edu_level || raw.id_edu_major || raw.id || raw.value || raw.code;
    return id == null ? '' : String(id);
  }

  // If it's a number-like or already id string
  if (typeof raw === 'number' || /^[0-9]+$/.test(String(raw))) {
    return String(raw);
  }

  // Otherwise treat as a display name: try to match with master data options
  try {
    const opts = await getOptions(category);
    const rawStr = String(raw).toLowerCase().trim();

    // Match case-insensitive against option.value or option.code, allow partial matches on the label
    const match = opts.find(o => {
      const val = String(o.value ?? '').toLowerCase().trim();
      const code = String(o.code ?? '').toLowerCase().trim();
      return val === rawStr || code === rawStr || val.includes(rawStr);
    });

    if (match) return String(match.code);
  } catch (e) {
    // ignore and fallback to raw
  }

  return String(raw);
};

// Start insert flow
const startInsertFlow = () => {
  showInsertForm.value = true;
  isEditing.value = false;

  // Emit event to activate edit mode
  emit("editRequest", {
    action: "activate_edit_mode",
    data: null
  });

  // Reset form
  insertData.value = {
    edu_institution_id: "",
    edu_level_id: "",
    edu_major_id: "",
    edu_start_date: "",
    edu_end_date: "",
    ijazah_doc: "",
    status: 1,
  };
  insertClientKey.value = "";
};

// Listen for form reset events
if (process.client) {
  window.addEventListener('formReset', (event) => {
    if (event.detail.success) {
      localData.value = { ...props.modelValue };
    }
  });
}

// Start edit mode
const startEditMode = () => {
  isEditing.value = true;
  showInsertForm.value = false;
  // Store original data for comparison
  originalData.value = JSON.parse(JSON.stringify(localData.value));
};

// Cancel edit mode
const cancelEdit = () => {
  isEditing.value = false;
  // Restore original data
  localData.value = { ...originalData.value };
};

// Validate attachments for education records
const validateAttachments = () => {
  if (!localData.value.education_records || !Array.isArray(localData.value.education_records)) {
    return { valid: true, missingIndex: -1 };
  }

  for (let i = 0; i < localData.value.education_records.length; i++) {
    const record = localData.value.education_records[i];

    // Check if record has existing attachment or pending upload
    const hasExistingFile = getExistingFiles(record, i).length > 0;
    const hasPendingUpload = record.pendingUploads && record.pendingUploads.length > 0;

    if (!hasExistingFile && !hasPendingUpload) {
      return { valid: false, missingIndex: i };
    }
  }

  return { valid: true, missingIndex: -1 };
};

// Save changes
const saveChanges = () => {

  // Check for pending uploads before saving
  if (localData.value.education_records) {
    localData.value.education_records.forEach((record, index) => {
      // Check for pending uploads
    });
  }

  // Check education validation first
  if (!validateEducationFields()) {
    toastError("For education records, you must update ALL required fields (Level, Major, Institution, Start Date, End Date) for each record before saving");
    return;
  }

  // Validate attachments
  const attachmentValidation = validateAttachments();
  if (!attachmentValidation.valid) {
    toastError("Each education record must have an ijazah document attached. Please upload the missing document.");

    // Scroll to the record with missing attachment
    const recordIndex = attachmentValidation.missingIndex;
    if (recordIndex >= 0) {
      // Wait for next tick to ensure DOM is updated
      nextTick(() => {
        const recordElement = document.querySelector(`.education-record-card[data-record-index="${recordIndex}"]`);
        if (recordElement) {
          recordElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          // Add highlight effect
          recordElement.classList.add('ring-2', 'ring-red-500', 'ring-offset-2');
          setTimeout(() => {
            recordElement.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2');
          }, 3000);
        }
      });
    }
    return;
  }

  isEditing.value = false;
  emit("editRequest", {
    action: "update",
    data: { ...localData.value }
  });
};

// Show discard confirmation
const showDiscardConfirmation = () => {
  if (hasInsertData()) {
    showDiscardModal.value = true;
  } else {
    cancelInsert();
  }
};

// Check if insert form has data
const hasInsertData = () => {
  return insertData.value.edu_institution_id !== '' ||
    insertData.value.edu_level_id !== '' ||
    insertData.value.edu_major_id !== '' ||
    insertData.value.edu_start_date !== '' ||
    insertData.value.edu_end_date !== '' ||
    insertData.value.ijazah_doc !== '';
};

// Discard changes
const discardChanges = () => {
  showDiscardModal.value = false;
  cancelInsert();
};

// Cancel insert
const cancelInsert = () => {
  showInsertForm.value = false;
  insertData.value = {
    edu_institution_id: "",
    edu_level_id: "",
    edu_major_id: "",
    edu_start_date: "",
    edu_end_date: "",
    ijazah_doc: "",
    status: 1,
  };
  insertClientKey.value = "";
};

// Submit insert
const submitInsert = () => {
  if (!isInsertDataValid.value) return;

  // Transform data to API format
  const transformedData = {
    edu_level_id: insertData.value.edu_level_id,
    edu_major_id: insertData.value.edu_major_id,
    edu_institution_id: insertData.value.edu_institution_id,
    edu_start_date: insertData.value.edu_start_date,
    edu_end_date: insertData.value.edu_end_date,
    ijazah_doc_id: insertData.value.ijazah_doc || null,
    client_key: insertClientKey.value || generateClientKey(),
    status: insertData.value.status || 1,
  };

  // Emit event to open ChangeRequestModal with proper structure
  emit("openChangeRequestModal", {
    type: "insert",
    action: "insert",
    currentTab: "education",
    data: [transformedData],
    tab: "education"
  });

  // Reset form
  cancelInsert();
};

// Remove education record
const removeEducationRecord = (index) => {
  localData.value.education_records.splice(index, 1);
};


// Watch for master data availability and normalize data when ready
watch(() => masterData.value, async (newMasterData) => {
  if (newMasterData && Object.keys(newMasterData).length > 0) {
    // Normalize initial localData if props provided
    if (props.modelValue && (Array.isArray(props.modelValue) ? props.modelValue.length > 0 : Object.keys(props.modelValue).length > 0)) {
      const normalized = normalizeEducationData(props.modelValue);

      // Resolve master data IDs for existing records
      if (normalized.education_records && Array.isArray(normalized.education_records)) {
        for (let record of normalized.education_records) {
          record.edu_institution_id = await resolveMasterId('EDU_INSTITUTIONS', record.edu_institution_id || record.edu_institution);
          record.edu_level_id = await resolveMasterId('EDU_LEVELS', record.edu_level_id || record.edu_level);
          record.edu_major_id = await resolveMasterId('EDU_MAJORS', record.edu_major_id || record.edu_major);
        }
      }

      // Also resolve for single form fields if they exist
      normalized.edu_institution_id = await resolveMasterId('EDU_INSTITUTIONS', normalized.edu_institution_id);
      normalized.edu_level_id = await resolveMasterId('EDU_LEVELS', normalized.edu_level_id);
      normalized.edu_major_id = await resolveMasterId('EDU_MAJORS', normalized.edu_major_id);

      localData.value = normalized;
    }
  }
}, { deep: true, immediate: true });

// Watch for editMode changes from parent
watch(() => props.editMode, (newValue) => {
  if (!newValue) {
    isEditing.value = false;
    showInsertForm.value = false;
  }
});

// No auto-enable editing for edit draft page - editing is handled by parent

// Load master data on mount
onMounted(async () => {
  try {
    const [levels, institutions, majors] = await Promise.all([
      getOptions('EDU_LEVELS'),
      getOptions('EDU_INSTITUTIONS'),
      getOptions('EDU_MAJORS')
    ]);

    masterDataCache.value.EDU_LEVELS = levels || [];
    masterDataCache.value.EDU_INSTITUTIONS = institutions || [];
    masterDataCache.value.EDU_MAJORS = majors || [];
  } catch (error) {
    console.error('Error loading master data:', error);
  }
});

</script>

