<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black bg-opacity-50 z-40"
        @click="closeModal"
      ></div>
    </Transition>

    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 flex items-center justify-center z-50 p-4"
      >
        <div class="w-full lg:w-11/12 lg:max-w-7xl max-h-[90vh] bg-white dark:bg-grey-800 shadow-xl rounded-md overflow-hidden">
          
          <!-- Header -->
          <div class="sticky top-0 bg-white dark:bg-grey-800 border-b border-grey-200 dark:border-grey-700 p-4 md:p-6">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg md:text-xl font-bold text-text-main">
                  View Request Data
                </h2>
                <p class="text-xs md:text-sm text-grey-600 dark:text-grey-400 mt-1">
                  {{ requestId }} -
                  {{ getCategoryDisplayName(requestData?.update || requestDetail?.update) }}
                </p>
              </div>
              <button
                @click="closeModal"
                class="p-2 hover:bg-grey-100 dark:hover:bg-grey-700 rounded-md transition-colors"
              >
                <i class="pi pi-times text-grey-600 dark:text-grey-400"></i>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="overflow-y-auto max-h-[calc(90vh-120px)]">
            <div class="p-4 md:p-6">
              <!-- Status Request Header -->
              <StatusHeader
                :request-id="(requestDetail?.code || requestData?.code || requestId)"
                :reviewer-name="requestDetail?.reviewer || requestData?.reviewer || 'No Reviewer'"
                :approver-name="requestDetail?.request_approver?.name_approver || requestDetail?.request_approver?.name || requestData?.request_approver?.name_approver || requestData?.request_approver?.name || ''"
                :approver-email="requestDetail?.request_approver?.email_approver || requestData?.request_approver?.email_approver || ''"
                :reviewer-avatar="getReviewerAvatar(requestData?.reviewer)"
                :last-updated="formatDate(requestDetail?.lastUpdated || requestDetail?.date_change || requestData?.lastUpdated || requestData?.date_change)"
                :steps="statusSteps"
                class="mb-4 md:mb-6"
              />
              <!-- Main Content -->
              <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <!-- Form Section - 3 columns -->
                <div class="lg:col-span-3">
                  <!-- Header -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <h2 class="text-xl md:text-2xl lg:text-3xl font-bold text-text-main">
                        View {{ getCategoryDisplayName(requestDetail?.update || requestData?.update) }}
                      </h2>
                      <StatusBadge :status="getStatusDisplayName(requestDetail?.status || requestStatus)" />
                    </div>
                  </div>

                  <!-- Action Buttons for mobile -->
                  <div class="lg:hidden mb-4">
                    <div class="flex justify-end">
                      <ActionButtons
                        :can-edit="canEdit"
                        @open-change-history="openChangeHistory"
                        @handle-edit="handleEdit"
                      />
                    </div>
                  </div>

                  <UiTabNavigation
                    :tabs="tabs"
                    :active-tab="activeTab"
                    class="mb-4 md:mb-6"
                  />

                  <!-- Form Card -->
                  <div class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700">
                    <div class="p-4 md:p-6">
                      <div class="flex flex-col lg:flex-row gap-4 md:gap-6">
                        <!-- Profile Picture Section -->
                        <div
                          v-if="requestDetail?.changes?.professional_photo"
                          class="flex-shrink-0 flex flex-col items-center lg:items-start"
                        >
                          <div class="w-32 h-32 md:w-40 md:h-40 bg-grey-200 dark:bg-grey-700 rounded-md flex items-center justify-center mb-3 md:mb-4">
                            <img
                              :src="requestDetail.changes.professional_photo.new"
                              alt="Updated Profile Photo"
                              class="w-full h-full object-cover rounded-md"
                            />
                          </div>
                          <span class="text-xs text-grey-500 text-center">Updated Profile Photo</span>
                        </div>

                        <!-- Form Fields -->
                        <div class="flex-1">
                          <!-- Loading State -->
                          <div v-if="isLoading || isDataTransforming" class="space-y-4">
                            <div v-for="i in 5" :key="i" class="animate-pulse">
                              <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-1/4 mb-2"></div>
                              <div class="h-10 bg-grey-200 dark:bg-grey-700 rounded"></div>
                            </div>
                            
                            <!-- Data Transformation Loading Message -->
                            <div v-if="isDataTransforming && !isLoading" class="text-center py-4">
                              <div class="flex items-center justify-center space-x-2">
                                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span class="text-sm text-grey-600 dark:text-grey-400">
                                  Processing data comparison...
                                </span>
                              </div>
                            </div>
                            
                            <!-- Initial Loading Message -->
                            <div v-if="isLoading && !isDataTransforming" class="text-center py-4">
                              <div class="flex items-center justify-center space-x-2">
                                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span class="text-sm text-grey-600 dark:text-grey-400">
                                  Loading request data...
                                </span>
                              </div>
                            </div>
                          </div>

                          <!-- API Not Ready State -->
                          <div v-else-if="isApiNotReady" class="text-center py-8">
                            <div class="mb-4">
                              <i class="pi pi-exclamation-triangle text-4xl text-orange-400 dark:text-orange-500"></i>
                            </div>
                            <h3 class="text-lg font-medium text-grey-900 dark:text-grey-100 mb-2">
                              API Configuration Needed
                            </h3>
                            <p class="text-grey-600 dark:text-grey-400 text-sm mb-4">
                              The mock API is returning data for a different request ID (ESS-WAP001) instead of the requested {{ requestId }}. The API mock needs proper configuration to return the correct data for each request ID.
                            </p>
                            <div v-if="requestDetail?.networkError" class="text-red-600 dark:text-red-400 text-sm">
                              <i class="pi pi-wifi text-red-600 mr-2"></i>
                              Network connection error occurred
                            </div>
                          </div>

                          <!-- Empty State - No Changes -->
                          <div v-else-if="!hasChanges" class="text-center py-8">
                            <div class="mb-4">
                              <i class="pi pi-info-circle text-4xl text-grey-400 dark:text-grey-500"></i>
                            </div>
                            <h3 class="text-lg font-medium text-grey-900 dark:text-grey-100 mb-2">
                              No Changes Available
                            </h3>
                            <p class="text-grey-600 dark:text-grey-400 text-sm">
                              This request doesn't contain any data changes to display.
                            </p>
                          </div>

                          <!-- Form Component - Only show when data is ready -->
                          <div v-else-if="isDataReady" class="space-y-4">
                            <!-- Data Comparison Section -->
                            <div>
                              <DataComparisonSection
                                :old-data="getOldData()"
                                :new-data="getNewData()"
                              />
                            </div>

                            <!-- Read-only Form Snapshot -->
                            <component
                              :is="getFormComponent(requestDetail?.update || requestData?.update)"
                              :model-value="displayData"
                              :disabled="true"
                              :is-view-mode="true"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Documents Section - Mobile Only -->
                  <div class="lg:hidden mt-4">
                    <DocumentSection
                      :request-detail="requestDetail"
                      :request-data="requestData"
                      :original-education-data="getOriginalEducationData()"
                      @view="openDocumentPreview"
                      @delete="deleteDocument"
                      @edit="editDocument"
                    />
                  </div>
                </div>

                <!-- Right Column - Action Buttons dan Documents - 1 column -->
                <div class="lg:col-span-1 space-y-4">
                  <!-- Action Buttons - Desktop only -->
                  <div class="hidden lg:block">
                    <div class="flex justify-end">
                      <ActionButtons
                        :can-edit="canEdit"
                        @open-change-history="openChangeHistory"
                        @handle-edit="handleEdit"
                      />
                    </div>
                  </div>
                  
                  <!-- Change Reason & Documents Section - Desktop Only, Sticky -->
                  <div class="hidden lg:block lg:sticky lg:top-6 space-y-4">
                    <ChangeReasonSection
                      v-if="requestDetail?.note_employee || requestDetail?.reason_update"
                      :reason="requestDetail?.reason_update || ''"
                      :reason-when-waiting="requestDetail?.note_employee || ''"
                      variant="view"
                    />
                    <DocumentSection
                      :request-detail="requestDetail"
                      :request-data="requestData"
                      :original-education-data="getOriginalEducationData()"
                      @view="openDocumentPreview"
                      @delete="deleteDocument"
                      @edit="editDocument"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Document Preview Modal -->
    <DocumentPreviewModal
      :is-open="isDocumentPreviewOpen"
      :document-url="selectedDocument?.url || selectedDocument?.preview_url || ''"
      :document-name="selectedDocument?.name || selectedDocument?.filename || 'Document'"
      :item-id="selectedDocument?.id || null"
      @close="closeDocumentPreview"
    />

    <!-- Change History Modal -->
    <ChangeHistoryModal
      :is-open="isChangeHistoryOpen"
      :request-data="requestDetail || requestData"
      @close="closeChangeHistory"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      :is-visible="showDeleteModal"
      title="Hapus File"
      :message="deleteModalMessage"
      save-button-text="Batal"
      continue-button-text="Hapus"
      @close="showDeleteModal = false"
      @save-draft="showDeleteModal = false"
      @continue="confirmDeleteDocument"
    />
  </Teleport>
</template>
  
  <script setup>
  import { ref, computed, watch, toRaw, onUnmounted } from "vue";
  import FormField from "~/components/form/FormField.vue";
  import StatusHeader from "~/components/update-data/status/StatusHeader.vue";
  import ChangeHistoryModal from "~/components/update-data/modals/ChangeHistoryModal.vue";
  import StatusBadge from "~/components/update-data/status/StatusBadge.vue";
  import DocumentPreviewModal from "./DocumentPreviewModal.vue";
  import DocumentSection from "~/components/common/DocumentSection.vue";
import ActionButtons from "~/components/common/ActionButtons.vue";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";
import DataComparisonSection from "~/components/ui/DataComparisonSection.vue";
import ChangeReasonSection from "~/components/update-data/modals/ChangeReasonSection.vue";
import UiTabNavigation from "~/components/ui/TabNavigation.vue";
  import { useApi } from "~/composables/useApi";
  import { useAttachments } from "~/composables/useAttachments";
  import { useToast } from "~/composables/useToast";
  import { formatValue, getFullValue, formatFileSize } from "~/composables/useTextFormatting.js";
  import { useMasterData } from "~/composables/useMasterData";
  import { useMasterOptions } from "~/composables/useMasterOptions";
  
  const props = defineProps({
    isOpen: { type: Boolean, default: false },
    requestStatus: { type: String, default: "waiting_approval" },
    requestId: { type: String, default: "ESS-UPD002" },
    requestData: { type: Object, default: null },
  });
  
  const emit = defineEmits(["close", "edit"]);
  
  const activeTab = computed(() => {
  return requestDetail.value?.update || props.requestData?.update;
  });
  const isChangeHistoryOpen = ref(false);
  const isDocumentPreviewOpen = ref(false);
  const selectedDocument = ref(null);
  const formData = ref({});
  const requestDetail = ref(null);
  const isLoading = ref(false);
  const isDataTransforming = ref(false);
  const error = ref("");

// Delete confirmation modal state
const showDeleteModal = ref(false);
const deleteModalMessage = ref("");
const attachmentToDelete = ref(null);
  
  const { apiGet, apiDelete } = useApi();
// Attachments helper for download functionality
const { downloadAttachment } = useAttachments();
  // Toast notifications
  const { success: showSuccess, error: showError } = useToast();
  // ADDED: [DATE] - Initialize master data composables
  // REASON: Need access to master data for field value translation
  // IMPACT: Provides master data access throughout the component
  // SOLUTION: Initialize composables with proper error handling
  const { options, getOption } = useMasterOptions();
  const { masterData, getMasterData } = useMasterData();
// API only mode - no localStorage fallback
const DEMO_MODE = false;

// Function to enrich education data with labels for DocumentSection
const enrichEducationDataWithLabels = async (educationData) => {
  if (!Array.isArray(educationData) || educationData.length === 0) {
    return;
  }

  try {
    
    // Load master data for education
    const [levels, majors, institutions] = await Promise.all([
      getOption('EDU_LEVELS'),
      getOption('EDU_MAJORS'),
      getOption('EDU_INSTITUTIONS')
    ]);

    // Enrich each education record with labels
    educationData.forEach((record, index) => {
      // Add level label
      if (record.edu_level_id && levels) {
        const levelData = levels.find(level => level.code == record.edu_level_id);
        if (levelData) {
          record.edu_level = levelData.value || levelData.label || levelData.name || `Level ${record.edu_level_id}`;
        }
      }

      // Add major label
      if (record.edu_major_id && majors) {
        const majorData = majors.find(major => major.code == record.edu_major_id);
        if (majorData) {
          record.edu_major = majorData.value || majorData.label || majorData.name || `Major ${record.edu_major_id}`;
        }
      }

      // Add institution label
      if (record.edu_institution_id && institutions) {
        const institutionData = institutions.find(institution => institution.code == record.edu_institution_id);
        if (institutionData) {
          record.edu_institution = institutionData.value || institutionData.label || institutionData.name || `Institution ${record.edu_institution_id}`;
        }
      }
    });

  } catch (error) {
    console.error('❌ ViewDataModal error enriching education data with labels:', error);
  }
};

// Document preview functions
  const openDocumentPreview = (document) => {
    selectedDocument.value = document;
    isDocumentPreviewOpen.value = true;
  };

  const closeDocumentPreview = () => {
    isDocumentPreviewOpen.value = false;
    selectedDocument.value = null;
  };



  const downloadDocument = async (attachment) => {
    const itemId = attachment.item_id || attachment.id;
    if (!itemId) {
      showError('Cannot download: No file ID found');
      return;
    }

    try {
      await downloadAttachment(itemId, attachment.name || attachment.filename || 'document');
    } catch (error) {
      showError(`Download failed: ${error.message}`);
    }
  };

  const deleteDocument = async (attachment) => {
    const itemId = attachment.item_id || attachment.id;
    const changeRequestId = requestDetail.value?.id_change_req || requestDetail.value?.id || props.requestId;
    
    if (!itemId) {
      showError('Cannot delete: No file ID found');
      return;
    }

    if (!changeRequestId) {
      showError('Cannot delete: No change request ID found');
      return;
    }

  // Show confirmation modal instead of browser confirm
  attachmentToDelete.value = attachment;
  deleteModalMessage.value = `Are you sure you want to delete the file "${attachment.name}"?`;
  showDeleteModal.value = true;
};

const confirmDeleteDocument = async () => {
  const attachment = attachmentToDelete.value;
  if (!attachment) return;

  // Try different ID fields
  const itemId = attachment.item_id || attachment.id || attachment.attachment_id;
  
  try {
    // Use the direct attachment delete endpoint
    const response = await apiDelete(`/employee/attachments/${itemId}/delete`);
    
    if (response && response.success) {
        // Remove from local state to update UI immediately
        if (requestDetail.value?.attachments) {
          requestDetail.value.attachments = requestDetail.value.attachments.filter(
            att => (att.item_id || att.id) !== itemId
          );
        }
        
        // Also remove from documents array for backward compatibility
        if (requestDetail.value?.documents) {
          requestDetail.value.documents = requestDetail.value.documents.filter(
            att => (att.item_id || att.id) !== itemId
          );
        }
        
      showSuccess(`File "${attachment.name}" berhasil dihapus`);
    } else {
      throw new Error(response?.message || 'Delete failed');
    }
  } catch (error) {
    showError(`Gagal menghapus file: ${error.message}`);
  } finally {
    // Close modal and reset state
    showDeleteModal.value = false;
    attachmentToDelete.value = null;
    deleteModalMessage.value = "";
  }
};

const editDocument = async (attachment) => {
  // Create a file input element
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.txt,.rtf,.xls,.xlsx,.csv,.ppt,.pptx,.zip,.rar,.7z,.tar,.gz';
  
  fileInput.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      // Show loading message
      showSuccess(`Uploading replacement for "${attachment.name}"...`);
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        showError(`File size too large. Maximum size is 10MB.`);
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp',
        'image/svg+xml',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'application/x-tar',
        'application/gzip'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        showError(`File type not supported: ${file.type}`);
        return;
      }
      
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', attachment.document_type || 'general');
      formData.append('change_request_id', requestDetail.value?.id_change_req || requestDetail.value?.id || props.requestId);
      
      // Upload file using API
      const { apiPost } = useApi();
      const uploadResponse = await apiPost('/employee/attachments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (uploadResponse && uploadResponse.success) {
        // Delete old file first
        try {
          await apiDelete(`/employee/attachments/${attachment.item_id || attachment.id}/delete`);
        } catch (deleteError) {
        }
        
        // Refresh document list
        await loadRequestDetail();
        
        showSuccess(`File "${attachment.name}" replaced successfully with "${file.name}"`);
      } else {
        throw new Error(uploadResponse?.message || 'Upload failed');
      }
      
    } catch (error) {
      showError(`Failed to replace file: ${error.message}`);
    }
  };
  
  // Trigger file selection
  fileInput.click();
  };
  
  // Display data computed - combines requestDetail or prop changes with original data
  const displayData = computed(() => {
    const normalizeChanges = (changes) => {
      if (!changes || typeof changes !== "object") return {};
      // If value is object with {old, new}, pick new; otherwise keep as is
      return Object.fromEntries(
        Object.entries(changes).map(([key, val]) => [key, val && typeof val === "object" && "new" in val ? val.new : val])
      );
    };
  
    const requestChanges = normalizeChanges(requestDetail.value?.changes);
    const propChanges = normalizeChanges(props.requestData?.changes);
  
    return {
      ...formData.value,
      ...requestChanges,
      ...propChanges,
    };
  });
  
  // Check if there are any changes (from API or from prop)
  const hasChanges = computed(() => {
    const has = (obj) => obj && Object.keys(obj).length > 0;
    const hasChangesData = has(requestDetail.value?.changes) || has(props.requestData?.changes);
    
    
    // For draft status, also check if there are normalized changes
    if (requestDetail.value?.status === 'draft' || props.requestStatus === 'draft') {
      const result = hasChangesData || normalizedChanges.value.length > 0;
      return result;
    }
    
    const result = hasChangesData;
    return result;
  });

  // Check if data is ready to display (including transformation completion)
  const isDataReady = computed(() => {
    // Data is ready when:
    // 1. Not loading
    // 2. Not transforming data
    // 3. Has request detail or request data
    // 4. Data comparison is complete (old and new data are available)
    const hasRequestData = requestDetail.value || props.requestData;
    const hasOldData = getOldData() !== null;
    const hasNewData = getNewData() !== null;
    
    // Additional check: ensure data transformation is complete
    const isTransformationComplete = !isDataTransforming.value;
    
    // Temporarily remove the hasOldData || hasNewData condition to see if that's the issue
    const result = !isLoading.value && 
           isTransformationComplete && 
           hasRequestData;
    
    
    return result;
  });

// Check if API is not ready
const isApiNotReady = computed(() => {
  // Hanya tampilkan API Not Ready jika memang tidak ada perubahan untuk ditampilkan
  const has = (obj) => obj && Object.keys(obj).length > 0;
  const anyChanges = has(requestDetail.value?.changes) || has(props.requestData?.changes);
  const result = requestDetail.value?.apiNotReady === true && !anyChanges;
    return result;
  });
  
  // Computed properties
  const canEdit = computed(() => {
  const status = requestDetail.value?.status || props.requestStatus;
  const statusStr = String(status).toLowerCase();
  // Support both string status and numeric status codes
  // Status codes: 1=draft, 3=need_revision/rejected, 2=waiting_approval, 4=approved
  return ["draft", "rejected", "needs_revision", "need_revision", "1", "3"].includes(statusStr) ||
         statusStr.includes("revision") || statusStr.includes("reject");
  });
  
  const hasDocuments = computed(() => {
    const category = requestDetail.value?.update || props.requestData?.update;
    return ["education", "family", "medical_record"].includes(category);
  });
  
  // Status steps - dinamis berdasarkan status dari requestDetail
  const statusSteps = computed(() => {
    const currentStatus = requestDetail.value?.status || props.requestStatus;
  
    if (currentStatus === "rejected" || currentStatus === "needs_revision") {
      return [
        { label: "Draft", icon: "pi pi-file", status: "completed" },
        { label: "Submitted", icon: "pi pi-user", status: "completed" },
        {
          label: "Needs Revision",
          icon: "pi pi-exclamation-triangle",
          status: "current",
        },
        { label: "Approved", icon: "pi pi-check", status: "pending" },
      ];
    } else if (currentStatus === "draft") {
      return [
        { label: "Draft", icon: "pi pi-file", status: "current" },
        { label: "Submitted", icon: "pi pi-user", status: "pending" },
        { label: "Waiting Approval", icon: "pi pi-calendar", status: "pending" },
        { label: "Approved", icon: "pi pi-check", status: "pending" },
      ];
    } else if (currentStatus === "waiting_approval") {
      return [
        { label: "Draft", icon: "pi pi-file", status: "completed" },
        { label: "Submitted", icon: "pi pi-user", status: "completed" },
        { label: "Waiting Approval", icon: "pi pi-calendar", status: "current" },
        { label: "Approved", icon: "pi pi-check", status: "pending" },
      ];
    } else if (currentStatus === "approved" || currentStatus === "Approved") {
      return [
        { label: "Draft", icon: "pi pi-file", status: "completed" },
        { label: "Submitted", icon: "pi pi-user", status: "completed" },
        {
          label: "Waiting Approval",
          icon: "pi pi-calendar",
          status: "completed",
        },
        { label: "Approved", icon: "pi pi-check", status: "current" },
      ];
    } else {
      return [
        { label: "Draft", icon: "pi pi-file", status: "completed" },
        { label: "Submitted", icon: "pi pi-user", status: "completed" },
        { label: "Waiting Approval", icon: "pi pi-calendar", status: "current" },
        { label: "Approved", icon: "pi pi-check", status: "pending" },
      ];
    }
  });
  
  // Tab navigation - dinamis berdasarkan category dari requestDetail
  const tabs = computed(() => {
    const category = requestDetail.value?.update || props.requestData?.update;
    const categoryName = getCategoryDisplayName(category);
    const categoryIcon = getCategoryIcon(category);
  
    return [
      {
        id: category || "basic-information",
        label: categoryName,
        icon: categoryIcon,
      },
    ];
  });
  
  // Helper functions
  const getCategoryDisplayName = (category) => {
    if (!category || typeof category !== 'string') return "Unknown Category";
    const normalized = category
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_');
    const categoryMap = {
      "basic-information": "Basic Information",
      data_employee: "Basic Information",
      address: "Address",
      emergency_contact: "Emergency Contact",
      payroll_account: "Payroll Account",
      family: "Family",
      education: "Education",
      social_security: "Benefit",
      medical_record: "Medical Record",
      employment_info: "Employment Information",
      employment_information: "Employment Information",
    };
    return categoryMap[normalized] || category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };
  
  // Get category icon
  const getCategoryIcon = (category) => {
    if (!category || typeof category !== 'string') return "pi pi-file";
    
    const normalized = category
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_');
    
    const iconMap = {
      "basic-information": "pi pi-user",
      "data_employee": "pi pi-user",
      "address": "pi pi-map-marker",
      "emergency_contact": "pi pi-phone",
      "payroll_account": "pi pi-credit-card",
      "family": "pi pi-users",
      "education": "pi pi-graduation-cap",
      "social_security": "pi pi-shield",
      "medical_record": "pi pi-heart",
      "employment_info": "pi pi-briefcase",
      "employment_information": "pi pi-briefcase",
    };
    
    return iconMap[normalized] || "pi pi-file";
  };
  
  // Helpers to detect empty values
  function isEmptyValue(val) {
    if (val === null || val === undefined) return true;
    if (typeof val === 'string') return val.trim() === '';
    if (Array.isArray(val)) return val.length === 0;
    if (typeof val === 'object') return Object.keys(val).length === 0;
    return false;
  }
  
  // Get reviewer avatar
  const getReviewerAvatar = (reviewer) => {
    if (!reviewer) return 'https://i.pravatar.cc/48?u=default';
    return `https://i.pravatar.cc/48?u=${encodeURIComponent(reviewer)}`;
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString || dateString === "Invalid Date WIB") return "Unknown date";
  
    try {
      // Handle different date formats
      let date;
      if (dateString.includes("T")) {
        // ISO format: 2025-07-20T09:00:00Z
        date = new Date(dateString);
      } else {
        // Other formats
        date = new Date(dateString);
      }
  
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
  
      return (
        date.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Jakarta",
        }) + " WIB"
      );
    } catch (error) {
      return "Invalid date";
    }
  };
  
  // Get status display name
  const getStatusDisplayName = (status) => {
    if (!status) return 'Unknown';
    
    // Handle status "3" (Need Revision) as "Rejected"
    if (status === '3' || status === 3) {
      return 'Rejected';
    }
    
    const statusMap = {
      'draft': 'Draft',
      '1': 'Draft',
      'waiting_approval': 'Waiting Approval',
      'approved': 'Approved',
      'rejected': 'Rejected',
      '3': 'Rejected',
      'needs_revision': 'Rejected',
      'need_revision': 'Rejected'
    };
    return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    // Handle status "3" (Need Revision) as "rejected"
    const normalizedStatus = (status === '3' || status === 3) ? 'rejected' : status;
    
    const classMap = {
      draft: "bg-blue-100 text-blue-800",
      "1": "bg-blue-100 text-blue-800",
      submitted: "bg-yellow-100 text-yellow-800",
      waiting_approval: "bg-orange-100 text-orange-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      "3": "bg-red-100 text-red-800",
      needs_revision: "bg-red-100 text-red-800",
      need_revision: "bg-red-100 text-red-800",
    };
    return classMap[normalizedStatus] || "bg-grey-100 text-grey-800";
  };
  
  const getDocumentTitle = (category) => {
    const titleMap = {
      education: "Education Certificate",
      family: "Family Document",
      medical_record: "Medical Certificate",
      address: "Address Document",
      employment_info: "Employment Document",
    };
    return titleMap[category] || "Document";
  };
  
  const getOldDocument = (category) => {
    return "no-document-before";
  };
  
  const getNewDocument = (category) => {
    const newMap = {
      education: "ijazah_s1.pdf",
      family: "kartu_keluarga.pdf",
      medical_record: "medical_certificate.pdf",
      address: "ktp.pdf",
      employment_info: "employment_contract.pdf",
    };
    return newMap[category] || "document.pdf";
  };
  
  function toLabel(path) {
    // Field mapping to match actual API structure
    const fieldMap = {
      'employee_name': 'Employee Name',
      'place_of_birth': 'Place of Birth',
      'birth_date': 'Birth Date',
      'gender': 'Gender',
      'no_ktp': 'ID Number (KTP)',
      'passport_number': 'Passport Number',
      'religion': 'Religion',
      'marital_status': 'Marital Status',
      'nationality': 'Nationality',
      'clothing_size': 'Clothing Size',
      'main_phone_number': 'Main Phone Number',
      'secondary_phone_number': 'Secondary Phone Number',
      'private_email': 'Private Email',
      'photo_ktp': 'KTP Photo',
      'professional_photo': 'Professional Photo',
      'business_email': 'Business Email',
      'nik': 'NIK',
      'nik_telkom': 'NIK Telkom',
      'directorate': 'Directorate',
      'business_unit': 'Business Unit',
      'division': 'Division',
      'grade': 'Grade',
      'grade_date': 'Grade Date',
      'band_position': 'Band Position',
      'band_position_date': 'Band Position Date',
      'level': 'Level',
      'level_date': 'Level Date',
      'position': 'Position',
      'supervisor': 'Supervisor',
      'join_date': 'Join Date',
      'start_date': 'Start Date',
      'terminate_date': 'Terminate Date',
      'reason_employee_in': 'Reason Employee In',
      'reason_employee_out': 'Reason Employee Out',
      'status': 'Status',
      'retirement_date': 'Retirement Date',
      'street_name': 'Street Name',
      'house_number': 'House Number',
      'rt': 'RT',
      'rw': 'RW',
      'village': 'Village',
      'district': 'District',
      'city': 'City',
      'province': 'Province',
      'postal_code': 'Postal Code',
      'detail': 'Detail',
      'sub_district': 'Sub District',
      'administrative_village': 'Administrative Village',
      'domicile_same_as_ktp': 'Domicile Same as KTP',
      'domicile_street_name': 'Domicile Street Name',
      'domicile_street_number': 'Domicile Street Number',
      'domicile_rt': 'Domicile RT',
      'domicile_rw': 'Domicile RW',
      'domicile_village': 'Domicile Village',
      'domicile_district': 'Domicile District',
      'domicile_city': 'Domicile City',
      'domicile_province': 'Domicile Province',
      'domicile_postal_code': 'Domicile Postal Code',
      'name': 'Name',
      'relationship': 'Relationship',
      'phone_number': 'Phone Number',
      'address': 'Address',
      'number_rekening': 'Bank Account Number',
      'bank': 'Bank Name',
      'holder_name': 'Account Holder Name',
      'tax_status': 'Tax Status',
      'npwp': 'NPWP Number',
      'npwp_doc': 'NPWP Document',
      'saving_book_doc': 'Saving Book Document',
      'education_level': 'Education Level',
      'institution': 'Institution',
      'major': 'Major',
      'graduation_year': 'Graduation Year',
      'gpa': 'GPA',
      'start_year': 'Start Date',
      'end_year': 'End Date',
      'telkomedika_card_number': 'Telkomedika Card Number',
      'bpjs_tk_number': 'BPJS TK Number',
      'bpjs_tk_effective_date': 'BPJS TK Effective Date',
      'bpjs_health_number': 'BPJS Health Number',
      'telkomedika_doc': 'Telkomedika Document',
      'bpjs_doc': 'BPJS Document',
      'health_status': 'Health Status',
      'last_mcu_date': 'Last MCU Date',
      'blood_type': 'Blood Type',
      'height': 'Height',
      'weight': 'Weight',
      'has_disability': 'Has Disability',
      'head_size': 'Head Size',
      'health_concern': 'Health Concern',
      'medical_treatment_record': 'Medical Treatment Record',
      'occupation': 'Occupation',
      'relation': 'Relation',
      'member_sequence': 'Member Sequence',
      'telkomedika_member_status': 'Telkomedika Member Status',
      'kk_doc': 'KK Document',
      'family_document': 'Family Document',
      'no_telkomedika': 'Telkomedika Card Number' // Added for SSI request type
    };
  
    // Check if we have a direct mapping
    if (fieldMap[path]) {
      return fieldMap[path];
    }
  
    // Fallback to original logic for unmapped fields
    return path
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }
  
  function deepEqual(a, b) {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return a === b;
    }
  }
  
  function shouldExcludeField(path) {
    const key = path.toLowerCase();
    
    // Exclude meta/system fields - hanya tampilkan data changes saja
    const excludeFields = [
      // Core system fields
      'id_change_req',
      'id',
      'code',
      'request_type',
      'request_type_label',
      'status',
      'status_label',
      'created_date',
      'updated_date',
      'attachments',
      'consent',
      'note_employee', 
      'note_hc',
      'reviewer',
      'action',
      'message',
      'success',
      'activetab',
      // Data wrapper fields
      'old_data',
      'new_data'
    ];
    
    // Check exact match - be more strict
    if (excludeFields.includes(key)) {
      return true;
    }
    
    // Also exclude if it's a root-level system field path
    const pathParts = path.split('.');
    if (pathParts.length === 1 && excludeFields.includes(pathParts[0].toLowerCase())) {
      return true;
    }
    
    return false;
  }
  
  function flattenChanges(prefix, obj, out, oldObj) {
    if (shouldExcludeField(prefix)) return;
    if (typeof obj !== 'object' || obj === null) {
      // Include if new has value and old is missing/empty or different
      if (!isEmptyValue(obj) && (oldObj === undefined || isEmptyValue(oldObj) || !deepEqual(oldObj, obj))) {
        out.push({ field: prefix, old: oldObj ?? '', new: obj });
      }
      return;
    }
    if (Array.isArray(obj)) {
      if (!isEmptyValue(obj) && (oldObj === undefined || isEmptyValue(oldObj) || !deepEqual(oldObj, obj))) {
        out.push({ field: prefix, old: oldObj ?? [], new: obj });
      }
      return;
    }
    const keys = Object.keys(obj);
    if (keys.length === 0) return;
    keys.forEach((k) => {
      const next = prefix ? `${prefix}.${k}` : k;
      const oldVal = oldObj && typeof oldObj === 'object' ? oldObj[k] : undefined;
      flattenChanges(next, obj[k], out, oldVal);
    });
  }

  /**
   * ADDED: [DATE] - Master data translation function for ViewDataModal
   * REASON: ViewDataModal was showing raw IDs instead of translated values
   * IMPACT: Education fields now show "Bachelor's Degree" instead of "10"
   * SOLUTION: Add same translation logic used in DataComparisonSection
   * 
   * @param {string} fieldName - The field name (e.g., 'edu_level_id')
   * @param {string|number} code - The ID value to translate (e.g., '10')
   * @returns {string} - Translated display value (e.g., 'Bachelor's Degree')
   */
  const getMasterValue = (fieldName, code) => {
    try {
      // Handle empty or null codes
      if (!code && code !== 0) return code;
      
      const codeStr = String(code);
      
      // Map field names to master data categories
      const fieldToMasterDataMap = {
        // Education fields - these are the ones causing the issue
        'edu_level': 'EDU_LEVELS',
        'edu_level_id': 'EDU_LEVELS',
        'education_level': 'EDU_LEVELS',
        'education_level_id': 'EDU_LEVELS',
        
        'edu_major': 'EDU_MAJORS',
        'edu_major_id': 'EDU_MAJORS',
        'education_major': 'EDU_MAJORS',
        'education_major_id': 'EDU_MAJORS',
        
        'edu_institution': 'EDU_INSTITUTIONS',
        'edu_institution_id': 'EDU_INSTITUTIONS',
        'education_institution': 'EDU_INSTITUTIONS',
        'education_institution_id': 'EDU_INSTITUTIONS',
        
        // Other fields for completeness
        'gender': 'GENDER',
        'gender_id': 'GENDER',
        'religion': 'RELIGION',
        'religion_id': 'RELIGION',
        'marital_status': 'MARITAL_STATUS',
        'marital_status_id': 'MARITAL_STATUS',
        'martial_status_id': 'MARITAL_STATUS',
        'clothing_size': 'CLOTHING',
        'clothing_size_id': 'CLOTHING',
        'relation': 'FAMILY_RELATION',
        'relation_id': 'FAMILY_RELATION',
        'emgc_relationship': 'FAMILY_RELATION',
        'emgc_relationship_id': 'FAMILY_RELATION',
        'bank': 'BANK',
        'bank_id': 'BANK',
        'nationality': 'NATIONALITY',
        'nationality_id': 'NATIONALITY',
        'tax_status': 'TAX_STATUS',
        'tax_status_id': 'TAX_STATUS',
        'health_status': 'EMP_HEALTH_OVERALL_STATUS',
        'health_status_id': 'EMP_HEALTH_OVERALL_STATUS',
        'blood_type': 'EMP_HEALTH_BLOOD_TYPE',
        'blood_type_id': 'EMP_HEALTH_BLOOD_TYPE',
        
        // Address fields
        'province': 'PROVINCES',
        'province_id': 'PROVINCES',
        'province_ktp': 'PROVINCES',
        'province_ktp_id': 'PROVINCES',
        'province_domicile': 'PROVINCES',
        'province_domicile_id': 'PROVINCES',
        'city': 'CITIES',
        'city_id': 'CITIES',
        'city_ktp': 'CITIES',
        'city_ktp_id': 'CITIES',
        'city_domicile': 'CITIES',
        'city_domicile_id': 'CITIES',
        'sub_district': 'SUBDISTRICTS',
        'sub_district_id': 'SUBDISTRICTS',
        'sub_distric': 'SUBDISTRICTS',
        'sub_distric_id': 'SUBDISTRICTS',
        'sub_distric_ktp': 'SUBDISTRICTS',
        'sub_distric_ktp_id': 'SUBDISTRICTS',
        'sub_distric_domicile': 'SUBDISTRICTS',
        'sub_distric_domicile_id': 'SUBDISTRICTS',
        'administrative_village': 'ADMINISTRATIVE_VILLAGES',
        'administrative_village_id': 'ADMINISTRATIVE_VILLAGES',
        'administrative_village_ktp': 'ADMINISTRATIVE_VILLAGES',
        'administrative_village_ktp_id': 'ADMINISTRATIVE_VILLAGES',
        'administrative_village_domicile': 'ADMINISTRATIVE_VILLAGES',
        'administrative_village_domicile_id': 'ADMINISTRATIVE_VILLAGES',
      };
      
      // Get the master data category for this field
      const masterDataCategory = fieldToMasterDataMap[fieldName];
      if (!masterDataCategory) {
        return code; // Fallback to original code
      }
      
      // Get master data for the category
      const masterDataOptions = getMasterData(masterDataCategory);
      if (!masterDataOptions || !Array.isArray(masterDataOptions)) {
        return code; // Fallback to original code
      }
      
      // Find the option that matches the code
      const option = masterDataOptions.find(opt => 
        String(opt.code) === codeStr || 
        String(opt.id) === codeStr ||
        String(opt.value) === codeStr
      );
      
      // Return translated value or fallback to original code
      return option ? option.value : code;
      
    } catch (error) {
      return code; // Fallback to original code on error
    }
  };

  /**
   * ADDED: [DATE] - Enhanced field value formatter with master data translation
   * REASON: ViewDataModal needs to format field values and translate IDs
   * IMPACT: All field values are properly formatted and translated
   * SOLUTION: Enhanced formatter that handles master data translation
   * 
   * @param {any} value - The field value to format
   * @param {string} fieldName - The field name for context
   * @returns {string} - Formatted display value
   */
  const formatFieldValue = (value, fieldName = '') => {
    try {
      // Handle empty values
      if (value === null || value === undefined || value === '') {
        return 'Not set';
      }
      
      // Handle boolean values
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      
      // Handle object values
      if (typeof value === 'object') {
        return 'Object data';
      }
      
      // Handle date strings (ISO format)
      if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
        try {
          const date = new Date(value);
          return date.toLocaleDateString('id-ID');
        } catch {
          return value;
        }
      }
      
      // DEBUG: Log field names and values for education fields
      if (fieldName.includes('edu') || fieldName.includes('education') || 
          (typeof value === 'string' && /^\d+$/.test(value) && parseInt(value) > 100)) {
      }
      
      // Check if field needs master data translation
      // More comprehensive detection for education fields and numeric values
      const needsTranslation = fieldName.includes('_id') || 
        ['gender', 'religion', 'marital_status', 'martial_status', 'clothing_size', 'nationality', 
         'bank', 'tax_status', 'edu_level', 'edu_major', 'edu_institution', 'education_level', 
         'education_major', 'education_institution', 'relation', 'emgc_relationship', 
         'blood_type', 'health_status',
         'province', 'city', 'sub_district', 'sub_distric', 'administrative_village'].some(key => 
         fieldName.includes(key)) ||
        // Also check for numeric values that might be IDs (education fields often have numeric IDs)
        (typeof value === 'string' && /^\d+$/.test(value) && parseInt(value) > 10 && parseInt(value) < 10000);
      
      
      // If field needs translation, use master data translation
      if (needsTranslation) {
        const translatedValue = getMasterValue(fieldName, value);
        // If translation failed (returned original code), show original value
        return translatedValue === value ? value : translatedValue;
      }
      
      // Return string representation for other values
      return String(value);
      
    } catch (error) {
      return String(value); // Fallback to string representation
    }
  };
  
// Normalized changes for listing: flatten all changes (including nested/array) and show all valid changes
  const normalizedChanges = computed(() => {
    try {
      const detailChanges = requestDetail.value?.changes || {};
      const propChanges = props.requestData?.changes || {};
      const raw = Object.keys(detailChanges).length > 0 ? detailChanges : propChanges;
      const currentStatus = requestDetail.value?.status || props.requestStatus;
      
      
      // For draft status, show all data from the category instead of just changes
      if (currentStatus === 'draft' && Object.keys(raw).length > 0) {
        const result = [];
        
        
        Object.entries(raw).forEach(([field, value]) => {
          if (value && typeof value === 'object' && ('old' in value || 'new' in value)) {
            // If value has old/new structure (like categoryData objects)
            if (typeof value.new === 'object' && value.new !== null) {
              // For category data objects, show all fields
              const oldData = value.old || {};
              const newData = value.new || {};
              
                              // Show all fields in the category data for draft status
              Object.keys(newData).forEach(key => {
                const oldValue = oldData[key];
                const newValue = newData[key];
                
                if (!isEmptyValue(newValue)) {
                  // If the value is an object, flatten it to show individual fields
                  if (typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue)) {
                    Object.keys(newValue).forEach(subKey => {
                      const subOldValue = oldValue && typeof oldValue === 'object' ? oldValue[subKey] : '';
                      const subNewValue = newValue[subKey];
                      
                      if (!isEmptyValue(subNewValue)) {
                        result.push({ 
                          field: `${field}.${key}.${subKey}`, 
                          label: toLabel(`${field}.${key}.${subKey}`), 
                          old: formatFieldValue(subOldValue ?? '', `${field}.${key}.${subKey}`), 
                          new: formatFieldValue(subNewValue, `${field}.${key}.${subKey}`) 
                        });
                      }
                    });
                  } else {
                    result.push({ 
                      field: `${field}.${key}`, 
                      label: toLabel(key), 
                      old: formatFieldValue(oldValue ?? '', key), 
                      new: formatFieldValue(newValue, key) 
                    });
                  }
                }
              });
            } else if (!isEmptyValue(value.new)) {
              result.push({ field, label: toLabel(field), old: '', new: formatFieldValue(value.new, field) });
            }
          } else if (typeof value === 'object' && value !== null) {
            // If value is nested object, flatten and show all
            flattenAllFields(field, value, result);
          } else if (!isEmptyValue(value)) {
            result.push({ field, label: toLabel(field), old: '', new: formatFieldValue(value, field) });
          }
        });
        

        return result;
      }
      
      // For non-draft status, show only changes as before
      if (!raw || Object.keys(raw).length === 0) {
        return [];
      }
      const result = [];
      
      Object.entries(raw).forEach(([field, value]) => {
        if (value && typeof value === 'object' && ('old' in value || 'new' in value)) {
          // If value has old/new structure (like categoryData objects)
          if (typeof value.new === 'object' && value.new !== null) {
            // For category data objects, expand and show all non-empty new subfields
            const oldData = value.old || {};
            const newData = value.new || {};

              Object.keys(newData).forEach(key => {
                const oldValue = oldData[key];
                const newValue = newData[key];

                // Show the field if the new value is present (non-empty). This avoids rendering a single JSON blob
                // and makes nested address/official/domicle fields readable in the changes list.
          if (!isEmptyValue(newValue)) {
                result.push({
                  field: `${field}.${key}`,
                  label: toLabel(key),
                  old: formatFieldValue(oldValue ?? '', key),
                  new: formatFieldValue(newValue, key)
                });
              }
            });
          } else if (!deepEqual(value.old, value.new) && !isEmptyValue(value.new)) {
            result.push({ field, label: toLabel(field), old: formatFieldValue(value.old ?? '', field), new: formatFieldValue(value.new, field) });
          }
        } else if (typeof value === 'object' && value !== null) {
          // If value is nested object, flatten
          flattenChanges(field, value, result);
        } else if (!isEmptyValue(value)) {
          result.push({ field, label: toLabel(field), old: '', new: formatFieldValue(value, field) });
        }
      });
      
      return result;
    } catch (error) {
      return [];
    }
  });
  
  // Helper function to flatten all fields for draft status
  function flattenAllFields(prefix, obj, out) {
    if (shouldExcludeField(prefix)) return;
    if (typeof obj !== 'object' || obj === null) {
      // Include if new has value
      if (!isEmptyValue(obj)) {
        out.push({ field: prefix, label: toLabel(prefix), old: '', new: formatFieldValue(obj, prefix) });
      }
      return;
    }
  if (Array.isArray(obj)) {
    if (!isEmptyValue(obj)) {
      out.push({ field: prefix, label: toLabel(prefix), old: '', new: formatFieldValue(obj, prefix) });
    }
      return;
    }
    const keys = Object.keys(obj);
    if (keys.length === 0) return;
    keys.forEach((k) => {
      const next = prefix ? `${prefix}.${k}` : k;
      flattenAllFields(next, obj[k], out);
    });
  }
  
  const getFormComponent = (category) => {
    const normalize = (c) => (c || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");
    const key = normalize(category);
    const componentMap = {
      "basic-information": "BasicInformationForm",
      data_employee: "BasicInformationForm",
      address: "AddressForm",
      emergency_contact: "EmergencyContactForm",
      payroll_account: "PayrollAccountForm",
      family: "FamilyForm",
      education: "EducationForm",
      social_security: "SocialSecurityForm",
      medical_record: "MedicalRecordForm",
      employment_info: "EmploymentInfoForm",
      employment_information: "EmploymentInfoForm",
    };
    return componentMap[key] || "BasicInformationForm";
  };

  const loadRequestDetail = async () => {
    if (!props.requestId) return;
    isLoading.value = true;
    isDataTransforming.value = false;
    error.value = "";

    try {
      // Attempt to load real change request from API
      // Based on Django URL patterns, we need to use numeric ID or try different endpoints
      const tryEndpoints = [
        // Try numeric ID first (if requestId is numeric)
        isNaN(props.requestId) ? null : `/employee/change-request/${props.requestId}`,
        // Try with code parameter
        `/employee/change-request?code=${encodeURIComponent(props.requestId)}`,
        // Try update-histories endpoint as fallback
        `/employee/update-histories?code=${encodeURIComponent(props.requestId)}`,
        // Try change-request endpoint with code
        `/employee/change-request?request_code=${encodeURIComponent(props.requestId)}`
      ].filter(Boolean); // Remove null values

      let response = null;
      for (const ep of tryEndpoints) {
        try {
          response = await apiGet(ep);
          if (response && response.success && response.data) {
            break;
          }
        } catch (e) {
          // ignore and try next
        }
      }

      if (response && response.success && response.data) {
        const d = response.data;


        // Access data from the correct structure
        // Data is in d.new_data.data and d.old_data (not nested under d.data)
        let newData = {};
        let oldData = {};
        
        if (d.new_data && d.new_data.data) {
          newData = d.new_data.data;
        }
        
        if (d.old_data) {
          oldData = d.old_data;
        }

        // Map numeric/string status codes to readable status keys used in UI
        const statusMap = {
          '1': 'draft',
          '2': 'waiting_approval',
          '3': 'needs_revision',
          '4': 'approved',
          '5': 'rejected'
        };

        // Map request_type to internal category/update id
        const typeToUpdate = {
          'BSC': 'basic-information',
          'ADR': 'address',
          'PYR': 'payroll-account',
          'EMC': 'emergency-contact',
          'EDC': 'education',
          'SSI': 'social_security', // CORRECTED: SSI should map to social_security
          'MDR': 'medical_record',
          'EMP': 'employment-information',
          'FMY': 'family'
        };

        const updateKey = typeToUpdate[d.data?.request_type] || (d.data?.request_type_label ? d.data.request_type_label.toLowerCase().replace(/\s+/g,'_') : 'basic-information');

        // Extract data changes from API response structure
        let extractedNewData = null;
        let extractedOldData = null;
        
        
        // Handle new_data structure: { action: "update", data: {...} }
        if (d.new_data && typeof d.new_data === 'object') {
          if (d.new_data.data && typeof d.new_data.data === 'object') {
            extractedNewData = d.new_data.data;
          }
        }
        
        // Handle old_data structure - check both d.old_data and d.data.old_data
        if (d.old_data && typeof d.old_data === 'object') {
          extractedOldData = d.old_data;
        } else if (d.data?.old_data && typeof d.data.old_data === 'object') {
          extractedOldData = d.data.old_data;
        }
        
        if (extractedOldData) {
          
          // WORKAROUND: Refine handling of nulls in old_data (avoid discarding partial data)
          // - Skip invalidation for address category
          // - Only invalidate if the entire structure is effectively empty
          if (updateKey !== 'address') {
            const hasSignificantValue = (val) => {
              if (val === null || val === undefined) return false;
              if (typeof val === 'string') return val.trim() !== '';
              if (Array.isArray(val)) return val.length > 0;
              if (typeof val === 'object') return Object.keys(val).length > 0 && Object.values(val).some((v) => v !== null && v !== '');
              return true;
            };

            if (Array.isArray(extractedOldData)) {
              // Consider empty only if no item has any significant non-null value (excluding date fields)
              const hasAnySignificantItem = extractedOldData.some((item) => {
                if (!item || typeof item !== 'object') return false;
                return Object.entries(item).some(([key, value]) => {
                  if (key.includes('date') || key.includes('_date')) return false;
                  return hasSignificantValue(value);
                });
              });
              if (!hasAnySignificantItem) {
                extractedOldData = null; // Reset to trigger API fetch fallback
              }
            } else if (typeof extractedOldData === 'object') {
              // Consider empty only if no key has significant value (excluding date fields)
              const hasAnySignificant = Object.entries(extractedOldData).some(([key, value]) => {
                if (key.includes('date') || key.includes('_date')) return false;
                return hasSignificantValue(value);
              });
              if (!hasAnySignificant) {
                extractedOldData = null; // Reset to trigger API fetch fallback
              }
            }
          }
        }
        
        // Special handling for different data types
        if (updateKey === 'basic-information') {
          
          // WORKAROUND: If old_data is null/incomplete due to backend bug, fetch from API
          if (!extractedOldData || extractedOldData === null) {
            try {
              const { apiGet } = useApi();
              const employeeResponse = await apiGet('/employee/basic-information');
              
              if (employeeResponse.success && employeeResponse.data) {
                const employeeData = employeeResponse.data;
                extractedOldData = {
                  nik: employeeData.nik || '',
                  name: employeeData.name || '',
                  no_ktp: employeeData.no_ktp || '',
                  business_email: employeeData.business_email || '',
                  private_email: employeeData.private_email || '',
                  main_phone_number: employeeData.main_phone_number || employeeData.phone || '',
                  secondary_phone_number: employeeData.secondary_phone_number || '',
                  birth_date: employeeData.birth_date || '',
                  birth_place: employeeData.birth_place || '',
                  gender: employeeData.gender || '',
                  gender_id: employeeData.gender_id || '',
                  religion: employeeData.religion || '',
                  religion_id: employeeData.religion_id || '',
                  marital_status: employeeData.marital_status || '',
                  nationality_id: employeeData.nationality_id || '',
                  clothing_size: employeeData.clothing_size || '',
                  passport_number: employeeData.passport_number || '',
                  ktp_doc: employeeData.ktp_doc || ''
                };
              } else {
                extractedOldData = {};
              }
            } catch (error) {
              extractedOldData = {};
            }
          }
        } else if (updateKey === 'address') {
          
          // For address, new_data.data is already in nested format
          // Handle various old_data scenarios
          if (!extractedOldData || extractedOldData === null || 
              (extractedOldData && extractedOldData.official_address === null && extractedOldData.domicile_address === null)) {
            // If old_data is completely null or has null address values, fetch from employee API
            try {
              const { apiGet } = useApi();
              const employeeAddressResponse = await apiGet('/employee/address');
              
              if (employeeAddressResponse.success && employeeAddressResponse.data) {
                const employeeData = employeeAddressResponse.data;
                extractedOldData = transformAddressData(employeeData);
              } else {
            extractedOldData = {
              official_address: {},
              domicile_address: {}
            };
              }
            } catch (error) {
              extractedOldData = {
                official_address: {},
                domicile_address: {}
              };
            }
          } else if (extractedOldData && !extractedOldData.official_address && !extractedOldData.domicile_address) {
            // If old_data is in flat format (from /employee/address API), transform it
            extractedOldData = transformAddressData(extractedOldData);
          }
          
          // Check if new_data is already in nested format (has official_address/domicile_address keys)
          if (extractedNewData && (extractedNewData.official_address || extractedNewData.domicile_address)) {
            // Data is already in nested format, keep as is
          } else if (extractedNewData && !extractedNewData.official_address && !extractedNewData.domicile_address) {
            // Data is in flat format, transform it
            extractedNewData = transformAddressData(extractedNewData);
          }
        } else if (['education', 'family', 'emergency_contact', 'employment-information'].includes(updateKey)) {
          
          // For multiple records categories, handle array comparison
          if (extractedOldData && Array.isArray(extractedOldData)) {
            extractedOldData = processMultipleRecords(extractedOldData, 'old');
          }
          if (extractedNewData && Array.isArray(extractedNewData)) {
            extractedNewData = processMultipleRecords(extractedNewData, 'new');
          }
        }
        
        // Create changes object with proper structure
        const changes = {};
        if (extractedNewData || extractedOldData) {
          changes[updateKey] = {
            old: extractedOldData || {},
            new: extractedNewData || {}
          };
        }
        
        // If no changes found in standard structure, try alternative extraction
        if (Object.keys(changes).length === 0) {
          
          // Try to extract from any field that might contain actual data
          Object.keys(d).forEach(key => {
            const value = d[key];
            
            // Skip system fields using our comprehensive exclusion function
            if (shouldExcludeField(key)) {
              return;
            }
            
            // Skip if value is empty or null
            if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
              return;
            }
            
            
            // If this field contains object data, use it
            if (value && typeof value === 'object' && Object.keys(value).length > 0) {
              let transformedValue = value;
              
              // Transform address data if needed
              if (updateKey === 'address') {
                transformedValue = transformAddressData(value);
              }
              
              changes[updateKey] = {
                old: {},
                new: transformedValue
              };
              
            }
          });
        }
        
        requestDetail.value = {
          ...d,
          request_id: d.data?.code || props.requestId,
          update: updateKey,
          request_type: d.data?.request_type || updateKey, // Add request_type for mapping
          status: statusMap[String(d.data?.status)] || d.data?.status,
          reason_update: d.data?.reason || d.data?.reason_when_waiting || '',
          note_employee: d.data?.note_employee || d.data?.note_employee || '',
          reviewer: d.data?.reviewer || null,
          request_approver: d.data?.request_approver || null,
          lastUpdated: d.data?.updated_date || d.data?.created_date || null,
          date_change: d.data?.created_date || null,
          approved_at: d.data?.updated_date || null,
          attachments: d.data?.attachments || [],
          documents: d.data?.attachments || [], // Keep for backward compatibility
          changes: changes,
          // Store old_data and new_data directly for DataComparisonSection
          old_data: extractedOldData,
          new_data: extractedNewData,
          // Add change request logs for ChangeHistoryModal
          change_request_logs: d.change_request_logs || d.change_history || [],
          // Add id_change_req for API calls
          id_change_req: d.id_change_req || d.id || props.requestId,
          apiNotReady: false
        };
        
        


        // Start data transformation process
        isDataTransforming.value = true;
        
        try {
          // Load form structure for that category so displayData can merge correctly
          await loadCategoryData(requestDetail.value.update);
          
          // Transform data with ID to value mapping
          const transformedData = await transformDataWithMapping(extractedOldData, extractedNewData, updateKey);
          
          // Update the requestDetail with transformed data
          if (transformedData) {
            requestDetail.value.old_data = transformedData.oldData;
            requestDetail.value.new_data = transformedData.newData;
          }
        } catch (transformError) {
          // Continue even if transformation fails
        } finally {
          // Data transformation complete
          isDataTransforming.value = false;
        }
        return;
      }

      // If we reach here, API didn't return usable data
      error.value = 'Unable to load change request from API.';
    } catch (err) {
      error.value = "Unable to load request data";
    } finally {
      isLoading.value = false;
      // Always reset isDataTransforming in finally block to ensure it's cleaned up
      isDataTransforming.value = false;
    }
  };
  
  // Load original data for the category (DEMO: basic structure only)
  const loadCategoryData = async (category) => {
    try {
      const structure = getBasicFormStructure(category);
      formData.value = structure;
    } catch (error) {
      formData.value = getBasicFormStructure(category);
    }
  };

  // Transform data with ID to value mapping
  const transformDataWithMapping = async (oldData, newData, category) => {
    
    try {
      // Simulate async data transformation process
      // This ensures that any ID to value mapping is completed before showing content
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Here you can add specific transformation logic for different categories
      // For example, mapping ID fields to their display values
      
      // For address category, ensure nested structure is properly formed
      if (category === 'address') {
        if (oldData && typeof oldData === 'object') {
          // Ensure old data has proper nested structure
          if (!oldData.official_address && !oldData.domicile_address) {
            oldData = transformAddressData(oldData);
          }
        }
        if (newData && typeof newData === 'object') {
          // Ensure new data has proper nested structure
          if (!newData.official_address && !newData.domicile_address) {
            newData = transformAddressData(newData);
          }
        }
      }
      
      return { oldData, newData };
    } catch (error) {
      throw error;
    }
  };
  
  // Helper function to transform address data from flat to nested structure
  const transformAddressData = (flatData) => {
    if (!flatData || typeof flatData !== 'object') return flatData;
    
    const transformed = {
      official_address: {},
      domicile_address: {}
    };
    
    // Extract KTP fields (official address) - handle both _ktp suffix and direct fields
    Object.keys(flatData).forEach(key => {
      if (key.endsWith('_ktp')) {
        transformed.official_address[key] = flatData[key];
      } else if (key.startsWith('detail_ktp') || key.startsWith('province_ktp') || key.startsWith('city_ktp') || 
                 key.startsWith('postal_code_ktp') || key.startsWith('sub_distric_ktp') || key.startsWith('administrative_village_ktp') ||
                 key.startsWith('rt_ktp') || key.startsWith('rw_ktp') || key.startsWith('street_name_ktp') || key.startsWith('house_number_ktp')) {
        transformed.official_address[key] = flatData[key];
      }
    });
    
    // Extract domicile fields - handle both _domicile suffix and direct fields
    Object.keys(flatData).forEach(key => {
      if (key.endsWith('_domicile')) {
        transformed.domicile_address[key] = flatData[key];
      } else if (key.startsWith('detail_domicile') || key.startsWith('province_domicile') || key.startsWith('city_domicile') || 
                 key.startsWith('postal_code_domicile') || key.startsWith('sub_distric_domicile') || key.startsWith('administrative_village_domicile') ||
                 key.startsWith('rt_domicile') || key.startsWith('rw_domicile') || key.startsWith('street_name_domicile') || key.startsWith('house_number_domicile')) {
        transformed.domicile_address[key] = flatData[key];
      }
    });
    
    return transformed;
  };
  
  // Helper function to process multiple records (education, family, emergency contact, etc.)
  const processMultipleRecords = (records, type) => {
    if (!Array.isArray(records)) return records;
    
    // Process each record to ensure it has proper structure
    return records.map(record => {
      if (typeof record === 'object' && record !== null) {
        // Ensure each record has an ID for comparison
        if (!record.id && record.id_education) {
          record.id = record.id_education;
        } else if (!record.id && record.id_family) {
          record.id = record.id_family;
        } else if (!record.id && record.id_emergency_contact) {
          record.id = record.id_emergency_contact;
        } else if (!record.id && record.id_employment) {
          record.id = record.id_employment;
        }
        
        // Add metadata for tracking
        record._recordType = type;
        record._originalIndex = records.indexOf(record);
      }
      return record;
    });
  };
  
  // Helper functions to get old and new data for DataComparisonSection
  const getOldData = () => {
    try {
      
      // Try from API response structure - check both levels
      if (requestDetail.value?.old_data !== undefined) {
        
        // For draft status, old_data from API might be incomplete (only changed fields)
        // We need to get original employee data for better comparison
        const currentStatus = requestDetail.value?.status || props.requestStatus;
        if (currentStatus === 'draft' || currentStatus === '1') {
          
          // Get original employee data from the original API call if available
          // This should include complete employee data like name, birth_date, etc.
          if (formData.value && Object.keys(formData.value).length > 0) {
            // Merge API old_data with complete original data
            const apiOldData = requestDetail.value.old_data || {};
            const originalCompleteData = { ...formData.value };
            
            // Create enhanced old_data by using original complete data as base
            // and overriding with API old_data where available
            const enhancedOldData = {
              ...originalCompleteData,
              ...apiOldData
            };
            
            // For array data (emergency contact, family, education), we need special handling
            const arrayTabs = ['emergency-contact', 'family', 'education'];
            const currentTab = requestDetail.value?.request_type_label?.toLowerCase().replace(' ', '-') || '';
            
            if (arrayTabs.includes(currentTab)) {
              // For array data, if old_data is empty or incomplete, use original data
              if (!Array.isArray(apiOldData) || apiOldData.length === 0) {
                return originalCompleteData;
              }
            }
            
            // But we need to remove the changed fields to show original state
            const changesData = requestDetail.value?.new_data?.data || {};
            Object.keys(changesData).forEach(apiField => {
              // Map API fields to form fields for proper comparison
              let formField = apiField;
              if (apiField === 'phone') formField = 'main_phone_number';
              
              // Use the value from API old_data for changed fields
              if (apiOldData[apiField] !== undefined) {
                enhancedOldData[formField] = apiOldData[apiField];
              }
            });
            
            return enhancedOldData;
          }
        }
        
        return requestDetail.value.old_data;
      }
      
      // Try from API nested data structure
      if (requestDetail.value?.data?.old_data !== undefined) {
        return requestDetail.value.data.old_data;
      }
      
      // Try from API response structure - check both levels
      if (requestDetail.value?.old_data !== undefined) {
        return requestDetail.value.old_data;
      }
      
      // Try from props.requestData if available
      if (props.requestData?.old_data !== undefined) {
        return props.requestData.old_data;
      }
      
      // Fallback to changes structure if available
      if (requestDetail.value?.changes || props.requestData?.changes) {
        const changes = requestDetail.value?.changes || props.requestData?.changes;
        
        // Try to extract old_data from changes
        const firstKey = Object.keys(changes)[0];
        if (firstKey && changes[firstKey]?.old) {
          return changes[firstKey].old;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };

  const getNewData = () => {
    try {
      
      // Try from API response structure - check both levels
      if (requestDetail.value?.new_data) {
        let newData = requestDetail.value.new_data;
        
        // If new_data has action and data structure, extract the data part
        if (newData.action && newData.data && Object.keys(newData.data).length > 0) {
          return newData.data;
        }
        
        return newData;
      }
      
      // Try from API nested data structure
      if (requestDetail.value?.data?.new_data) {
        let newData = requestDetail.value.data.new_data;
        
        // If new_data has action and data structure, extract the data part
        if (newData.action && newData.data && Object.keys(newData.data).length > 0) {
          return newData.data;
        }
        
        return newData;
      }
      
      // Fallback to props.requestData if available
      if (props.requestData?.new_data) {
        let newData = props.requestData.new_data;
        
        // If new_data has action and data structure and is not empty, extract the data part
        if (newData.action && newData.data && Object.keys(newData.data).length > 0) {
          return newData.data;
        }
        
        // If action wrapper is empty, try to use other fields from props.requestData
        if (newData.action && newData.data && Object.keys(newData.data).length === 0) {
          
          // For some request types, the actual data might be in the root of props.requestData
          // excluding system fields
          const excludeFields = ['id_change_req', 'code', 'request_type', 'request_type_label', 'status', 'status_label', 'created_date', 'updated_date', 'attachments', 'consent', 'note_employee', 'note_hc', 'new_data', 'old_data'];
          const actualData = {};
          
          Object.keys(props.requestData).forEach(key => {
            if (!excludeFields.includes(key)) {
              actualData[key] = props.requestData[key];
            }
          });
          
          if (Object.keys(actualData).length > 0) {
            return actualData;
          }
        }
        
        return newData;
      }
      
      // Fallback to changes structure if available
      if (requestDetail.value?.changes || props.requestData?.changes) {
        const changes = requestDetail.value?.changes || props.requestData?.changes;
        
        // Try to extract new_data from changes
        const firstKey = Object.keys(changes)[0];
        if (firstKey && changes[firstKey]?.new) {
          return changes[firstKey].new;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };
  
  // Helper function to get original education data for DocumentSection
  const getOriginalEducationData = () => {
    try {
      
      // For education category, try to get original data from old_data
      if (requestDetail.value?.update === 'education' || requestDetail.value?.update === 'Education') {
        let educationData = [];
        
        // Try to get from old_data first
        if (Array.isArray(requestDetail.value?.old_data) && requestDetail.value.old_data.length > 0) {
          educationData = [...requestDetail.value.old_data];
        }
        // Try to get from old_data.education
        else if (Array.isArray(requestDetail.value?.old_data?.education) && requestDetail.value.old_data.education.length > 0) {
          educationData = [...requestDetail.value.old_data.education];
        }
        
        // If we have education data, enrich it with labels
        if (educationData.length > 0) {
          enrichEducationDataWithLabels(educationData);
          return educationData;
        }
      }
      
      return [];
    } catch (error) {
      return [];
    }
  };
  
  // Helper function to get basic form structure based on category
  const getBasicFormStructure = (category) => {
    const basicStructures = {
      'basic-information': {
        employee_name: "",
        employee_id: "",
        email: "",
        phone: "",
        gender: "",
        religion: "",
        place_of_birth: "",
        date_of_birth: "",
        national_id: "",
      },
      data_employee: {
        employee_name: "",
        employee_id: "",
        email: "",
        phone: "",
        gender: "",
        religion: "",
        place_of_birth: "",
        date_of_birth: "",
        national_id: "",
        private_email: "",
      },
      address: {
        streetName: "",
        streetNumber: "",
        rt: "",
        rw: "",
        village: "",
        district: "",
        city: "",
        province: "",
        postalCode: "",
        domicile_same_as_ktp: false,
        domicile_street_name: "",
        domicile_street_number: "",
        domicile_rt: "",
        domicile_rw: "",
        domicile_village: "",
        domicile_district: "",
        domicile_city: "",
        domicile_province: "",
        domicile_postal_code: "",
      },
      education: {
        edu_level_id: "",
        edu_institution_id: "",
        edu_major_id: "",
        
        edu_start_date: "",
        edu_end_date: "",
        status: 1,
      },
      family: {
        marital_status: "",
        spouse_name: "",
        spouse_birth_date: "",
        spouse_occupation: "",
        spouse_company: "",
        marriage_date: "",
        children_count: 0,
        child_1_name: "",
        child_1_birth_date: "",
        child_1_gender: "",
        child_2_name: "",
        child_2_birth_date: "",
        child_2_gender: "",
      },
      emergency_contact: {
        primary_contact_name: "",
        primary_contact_phone: "",
        primary_contact_relationship: "",
        primary_contact_address: "",
        secondary_contact_name: "",
        secondary_contact_phone: "",
        secondary_contact_relationship: "",
        secondary_contact_address: "",
      },
      employment_info: {
        employee_id: "",
        join_date: "",
        department: "",
        position: "",
        employment_status: "",
        work_location: "",
        reporting_manager: "",
        employee_type: "",
        grade: "",
      },
      payroll_account: {
        bank_id: "",
        number_rekening: "",
        holder_name: "",
        tax_status_id: "",
        npwp: "",
        npwp_doc: "",
        saving_book_doc: "",
      },
      social_security: {
        bpjs_ketenagakerjaan: "",
        bpjs_kesehatan: "",
        bpjs_pensiun: "",
        npwp: "",
        tax_status: "",
        jamsostek_number: "",
      },
      medical_record: {
        blood_type: "",
        height: "",
        weight: "",
        allergies: "",
        medical_conditions: "",
        emergency_medical_contact: "",
        insurance_provider: "",
        insurance_number: "",
        vaccination_status: "",
        last_medical_checkup: "",
      },
    };
  
    return basicStructures[category] || {};
  };
  
  // Watch untuk perubahan modal state dan requestId
  watch(
    () => [props.isOpen, props.requestId],
    ([isOpen, requestId]) => {
      if (isOpen && requestId) {
        // Add error handling to prevent modal from closing
        try {
          loadRequestDetail();
        } catch (error) {
          // Don't close modal on error
        }
      }
    },
    { immediate: true }
  );
  
  // Watch untuk perubahan requestData (fallback)
  watch(
    () => props.requestData,
    (newData) => {
      if (newData && props.isOpen && !requestDetail.value) {
        // Only load if we don't have request detail yet
        try {
          loadRequestDetail();
        } catch (error) {
        }
      }
    },
    { deep: true }
  );
  
  // Watch untuk perubahan props.isOpen
  watch(
    () => props.isOpen,
    (isOpen) => {
      if (isOpen) {
        // Add safety check for document.body
        if (typeof document !== 'undefined' && document.body) {
          document.body.style.overflow = "hidden";
        }
      } else {
        if (typeof document !== 'undefined' && document.body) {
          document.body.style.overflow = "auto";
        }
      }
    }
  );
  
  // Modal functions
  const closeModal = () => {
    emit("close");
  };
  
  const handleEdit = () => {
  navigateTo(`/update-data/edit/${props.requestId}`);
    closeModal();
  };
  
  // Change History Modal
  const openChangeHistory = () => {
    isChangeHistoryOpen.value = true;
  };
  
  const closeChangeHistory = () => {
    isChangeHistoryOpen.value = false;
  };

  
  onUnmounted(() => {
    document.body.style.overflow = "auto";
  });
  
  // Debug function untuk melihat data yang sedang diproses di ViewDataModal
const debugViewDataModal = () => {
  
  // Check old data
  const oldData = getOldData();
  
  // Check new data
  const newData = getNewData();
  
  // Check if has changes
  
  // Check display data
  
};

// Expose debug function to window for manual testing
if (process.client) {
  window.debugViewDataModal = debugViewDataModal;
}
  
  </script>
  
  <style scoped>
  .backdrop-enter-active,
  .backdrop-leave-active {
    transition: opacity 0.3s ease;
  }
  .backdrop-enter-from,
  .backdrop-leave-to {
    opacity: 0;
  }
  
  .modal-enter-active,
  .modal-leave-active {
    transition: all 0.3s ease;
  }
  .modal-enter-from {
    opacity: 0;
    transform: scale(0.9);
  }
  .modal-leave-to {
    opacity: 0;
    transform: scale(0.9);
  }
  .modal-enter-to,
  .modal-leave-from {
    opacity: 1;
    transform: scale(1);
  }
  </style>
