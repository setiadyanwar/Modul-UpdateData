<template>
  <div>
    <!-- Breadcrumb -->
    <UiBreadcrumb :items="breadcrumbItems" class="mb-4" />

    <!-- Loading State -->
    <div v-if="isLoadingDetail" class="py-8">
      <div class="space-y-6 animate-pulse">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
            <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="mb-4">
      <div
        class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-8 text-center"
      >
        <div class="mb-4">
          <i
            class="pi pi-exclamation-triangle text-4xl text-grey-400 dark:text-grey-500"
          ></i>
        </div>
        <h3 class="text-lg font-medium text-grey-900 dark:text-grey-100 mb-2">
          API Not Ready
        </h3>
        <p class="text-grey-600 dark:text-grey-400 mb-6">
          {{ error }}
        </p>
        <div class="flex justify-center gap-3">
          <UiButton variant="outline" size="small" @click="goBack">
            <i class="pi pi-arrow-left mr-2"></i>
            Back to History
          </UiButton>
          <UiButton variant="primary" size="small" @click="retryLoad">
            <i class="pi pi-refresh mr-2"></i>
            Retry
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Content when loaded -->
    <div v-else-if="requestDetail">
      <!-- Page Header -->
      <div class="mb-6">
        <div
          class="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div>
            <h1 class="text-2xl font-bold text-text-main">
              View Request Detail
            </h1>
            <p class="mt-1 text-grey-600">
              ID: {{ requestDetail.request_id }} -
              {{ getCategoryDisplayName(requestDetail.update) }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <UiButton variant="outline" size="small" @click="goBack">
              <i class="pi pi-arrow-left mr-2"></i>
              Back
            </UiButton>
            <UiButton variant="secondary" size="small" @click="handleEdit">
              <i class="pi pi-pencil mr-2"></i>
              Edit
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Review Note for Rejected Status -->
      <div
        v-if="requestDetail.status === 'rejected' && requestDetail.review_note"
        class="mb-6"
      >
        <ReviewNote
          title="Review Note"
          :content="requestDetail.review_note"
          :reviewer="requestDetail.reviewer || 'HC Telkomsigma'"
          icon="pi-exclamation-triangle"
        />
      </div>

      <!-- Status Request Header -->
      <StatusHeader
        class="mb-6"
        title="Status Request"
        :request-id="requestDetail.request_id"
        :reviewer-name="requestDetail.reviewer || 'HC Team'"
        :reviewer-avatar="''"
        :approver-name="requestDetail?.request_approver?.name_approver || requestDetail?.request_approver?.name || ''"
        :approver-email="requestDetail?.request_approver?.email_approver || ''"
        :last-updated="formatDate(requestDetail.date_change)"
        :steps="statusSteps"
      />

      <!-- Request Information -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Request Details -->
        <div class="lg:col-span-2">
          <div
            class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700"
          >
            <div
              class="p-4 md:p-6 border-b border-grey-200 dark:border-grey-700"
            >
              <h3 class="font-semibold text-text-main text-lg">
                Request Information
              </h3>
            </div>
            <div class="p-4 md:p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    class="block text-sm font-medium text-grey-700 dark:text-grey-300 mb-1"
                  >
                    Request ID
                  </label>
                  <p class="text-sm text-text-main">
                    {{ requestDetail.request_id }}
                  </p>
                </div>
                <div>
                  <label
                    class="block text-sm font-medium text-grey-700 dark:text-grey-300 mb-1"
                  >
                    Category
                  </label>
                  <p class="text-sm text-text-main">
                    {{ getCategoryDisplayName(requestDetail.update) }}
                  </p>
                </div>
                <div>
                  <label
                    class="block text-sm font-medium text-grey-700 dark:text-grey-300 mb-1"
                  >
                    Status
                  </label>
                  <StatusBadge :status="requestDetail.status" />
                </div>
                <div>
                  <label
                    class="block text-sm font-medium text-grey-700 dark:text-grey-300 mb-1"
                  >
                    Date Submitted
                  </label>
                  <p class="text-sm text-text-main">
                    {{ formatDate(requestDetail.date_change) }}
                  </p>
                </div>
                <div v-if="requestDetail.reason_update" class="md:col-span-2">
                  <label
                    class="block text-sm font-medium text-grey-700 dark:text-grey-300 mb-1"
                  >
                    Reason for Update
                  </label>
                  <p class="text-sm text-text-main">
                    {{ requestDetail.reason_update }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Data Changes -->
          <div
            class="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-grey-800 dark:to-grey-700 rounded-lg border border-blue-200 dark:border-grey-600"
          >
            <div class="p-4 md:p-6 border-b border-blue-200 dark:border-grey-600">
              <div class="flex items-center gap-3">
                <i class="pi pi-sync text-blue-600 dark:text-blue-400 text-xl"></i>
                <h3 class="font-semibold text-text-main text-lg">Data Changes</h3>
                <span
                  v-if="requestDetail.changes && Object.keys(requestDetail.changes).length > 0"
                  class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full"
                >
                  {{ Object.keys(requestDetail.changes).length }} changes
                </span>
              </div>
            </div>
            <div class="p-4 md:p-6">
              <!-- Data Changes Content -->
              <div
                v-if="
                  requestDetail.changes &&
                  Object.keys(requestDetail.changes).length > 0
                "
                class="space-y-4"
              >
                <div
                  v-for="(change, field, index) in requestDetail.changes"
                  :key="field"
                  class="bg-white dark:bg-grey-800 rounded-md border border-grey-200 dark:border-grey-700 p-3 shadow-sm"
                >
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="font-medium text-text-main capitalize">
                      {{ field.replace(/_/g, " ") }}
                    </h4>
                    <span class="bg-grey-100 dark:bg-grey-700 text-grey-700 dark:text-grey-300 text-xs font-medium px-2 py-0.5 rounded-full">
                      Field {{ index + 1 }}
                    </span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-md p-3">
                      <div class="flex items-center gap-2 mb-2">
                        <i class="pi pi-minus-circle text-red-500 text-sm"></i>
                        <label class="text-xs font-medium text-red-700 dark:text-red-300">
                          Old Value
                        </label>
                      </div>
                      <div class="text-sm text-red-800 dark:text-red-200">
                        {{ change.old || "Not set" }}
                      </div>
                    </div>
                    <div class="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-md p-3">
                      <div class="flex items-center gap-2 mb-2">
                        <i class="pi pi-plus-circle text-green-500 text-sm"></i>
                        <label class="text-xs font-medium text-green-700 dark:text-green-300">
                          New Value
                        </label>
                      </div>
                      <div class="text-sm text-green-800 dark:text-green-200 font-medium">
                        {{ change.new || "Not set" }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State - No Changes Available -->
              <div v-else class="text-center py-8">
                <div class="mb-4">
                  <i
                    class="pi pi-info-circle text-3xl text-grey-400 dark:text-grey-500"
                  ></i>
                </div>
                <h3
                  class="text-lg font-medium text-grey-900 dark:text-grey-100 mb-2"
                >
                  No Changes Available
                </h3>
                <p class="text-grey-600 dark:text-grey-400">
                  No data changes are available for this request.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Documents -->
          <div
            class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700"
          >
            <div class="p-4 border-b border-grey-200 dark:border-grey-700">
              <h3 class="font-semibold text-text-main">Documents</h3>
            </div>
            <div class="p-4">
              <div
                v-if="
                  requestDetail.documents && requestDetail.documents.length > 0
                "
                class="space-y-3"
              >
                <div
                  v-for="doc in requestDetail.documents"
                  :key="doc.id"
                  class="border border-grey-200 dark:border-grey-700 rounded-md p-3"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <i class="pi pi-file-pdf text-red-600"></i>
                    <h4 class="font-medium text-text-main text-sm">
                      {{ doc.name }}
                    </h4>
                  </div>
                  <div class="space-y-1 text-xs">
                    <p class="text-grey-600 dark:text-grey-400">
                      Old: {{ doc.old_file || "No document" }}
                    </p>
                    <p class="text-grey-600 dark:text-grey-400">
                      New: {{ doc.new_file }}
                    </p>
                    <a href="#" class="text-primary hover:underline text-xs"
                      >View Document</a
                    >
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4">
                <i class="pi pi-file text-grey-400 text-xl mb-2"></i>
                <p class="text-xs text-grey-500">No documents available</p>
              </div>
            </div>
          </div>

          <!-- Timeline -->
          <div
            class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700"
          >
            <div class="p-4 border-b border-grey-200 dark:border-grey-700">
              <h3 class="font-semibold text-text-main">Timeline</h3>
            </div>
            <div class="p-4">
              <div class="space-y-3">
                <div class="flex items-start gap-3">
                  <div class="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <div>
                    <p class="text-sm font-medium text-text-main">
                      Request Submitted
                    </p>
                    <p class="text-xs text-grey-500">
                      {{ formatDate(requestDetail.date_change) }}
                    </p>
                  </div>
                </div>
                <div
                  v-if="requestDetail.reviewed_at"
                  class="flex items-start gap-3"
                >
                  <div class="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p class="text-sm font-medium text-text-main">Reviewed</p>
                    <p class="text-xs text-grey-500">
                      {{ formatDate(requestDetail.reviewed_at) }}
                    </p>
                  </div>
                </div>
                <div
                  v-if="requestDetail.approved_at"
                  class="flex items-start gap-3"
                >
                  <div class="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p class="text-sm font-medium text-text-main">Approved</p>
                    <p class="text-xs text-grey-500">
                      {{ formatDate(requestDetail.approved_at) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { createError } from "nuxt/app";
import { useRequestHistory } from "~/composables/useRequestHistory";
import { useToast } from "~/composables/useToast";
import ReviewNote from "~/components/update-data/status/ReviewNote.vue";
import StatusHeader from "~/components/update-data/status/StatusHeader.vue";

definePageMeta({
  layout: "update-data",
  middleware: 'rbac',
  permissions: ['update_data_personal']
});

const route = useRoute();
const router = useRouter();

// Use composables
const { getRequestById, requests } = useRequestHistory();
const requestDetail = ref(null);
const isLoadingDetail = ref(false);
const error = ref(null);
const { error: showError } = useToast();

// Breadcrumb items
const breadcrumbItems = computed(() => [
  { label: "Dashboard", href: "/", icon: "pi pi-home" },
  { label: "Update Data", href: "/update-data" },
  { label: "Request History", href: "/update-data/history" },
  {
    label: `View ${requestDetail.value?.request_id || "Request"}`,
    current: true,
  },
]);

// Load detail on mount
onMounted(async () => {
      if (route.params.id) {

    try {
      // Load from localStorage using useRequestHistory
      const result = getRequestById(route.params.id);
      
      if (!result) {
        // Request not found
        throw createError({
          statusCode: 404,
          statusMessage: "Request Not Found",
          message: `Request with ID "${route.params.id}" was not found. Please check the ID and try again.`,
        });
      }
      
      requestDetail.value = result;
    } catch (apiError) {
      // If it's already a createError, re-throw it
      if (apiError.statusCode) {
        throw apiError;
      }
      
      // For other errors, show generic error
      error.value = "Failed to load request details";
    }
  }
});

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Get category display name
const getCategoryDisplayName = (category) => {
  const categoryMap = {
    education: "Education Data",
    address: "Address Data",
    family: "Family Data",
    emergency_contact: "Emergency Contact Data",
    medical_record: "Medical Record Data",
    payroll_account: "Payroll Account Data",
    social_security: "Benefit Data",
    "basic-information": "Basic Information Data",
  };
  return categoryMap[category] || "Personal Data";
};

// Status steps - dinamis berdasarkan status
const statusSteps = computed(() => {
  const currentStatus = requestDetail.value?.status;

  if (!currentStatus) {
    return [
      { label: "Draft", icon: "pi pi-file", status: "current" },
      { label: "Submitted", icon: "pi pi-user", status: "pending" },
      { label: "Waiting Approval", icon: "pi pi-calendar", status: "pending" },
      { label: "Approved", icon: "pi pi-check", status: "pending" },
    ];
  }

  if (currentStatus === "rejected") {
    return [
      { label: "Submitted", icon: "pi pi-user", status: "completed" },
      {
        label: "Waiting Approval",
        icon: "pi pi-calendar",
        status: "completed",
      },
      {
        label: "Rejected",
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
  } else if (currentStatus === "submitted") {
    return [
      { label: "Draft", icon: "pi pi-file", status: "completed" },
      { label: "Submitted", icon: "pi pi-user", status: "current" },
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
  } else if (currentStatus === "approved") {
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

// Methods
const goBack = () => {
  router.back();
};

const handleEdit = () => {
  navigateTo(`/update-data/edit/${route.params.id}`);
};

const retryLoad = async () => {
  if (route.params.id) {
    await fetchRequestDetail(route.params.id);
  }
};
</script>
