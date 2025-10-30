<template>
  <div class="overflow-hidden w-full">
    <!--
      Table Header with Search and Filter
      -----------------------------------
      Contains search input and filter dropdown for request history.
    -->
    <div
      class="px-6 sm:px-8 lg:px-6 xl:px-8 py-6 border-b border-grey-200 dark:border-grey-700"
    >
      <!-- Search and Filter Bar -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <!-- Search Input -->
        <div class="relative">
          <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
          >
            <i class="pi pi-search text-grey-400"></i>
          </div>
          <input
            type="text"
            placeholder="Search..."
            class="w-full sm:w-72 pl-10 pr-3 py-2 border border-grey-300 dark:border-grey-600 rounded-md leading-5 bg-white dark:bg-grey-800 text-grey-900 dark:text-grey-100 placeholder-grey-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            @input="$emit('search', $event.target.value)"
          />
        </div>
      </div>
    </div>

    <!--
      Loading State
      -------------
      Shows skeleton loaders while data is being fetched.
    -->
    <div v-if="loading" class="p-8">
      <div class="space-y-4">
        <div v-for="i in 5" :key="i" class="animate-pulse">
          <div class="h-12 bg-grey-200 dark:bg-grey-700 rounded"></div>
        </div>
      </div>
    </div>

    <!--
      Desktop Table View
      ------------------
      Shows the request history in a table format for large screens.
    -->
    <div
      v-if="!loading && displayData.length > 0"
      class="hidden lg:block overflow-x-auto min-w-full lg:px-6 xl:px-8 scrollbar-thin scrollbar-thumb:bg-grey-300 dark:scrollbar-thumb:bg-grey-700 scrollbar-track:bg-grey-100 dark:scrollbar-track:bg-grey-900"
    >
      <table class="w-full table-fixed">
        <thead class="bg-grey-50 dark:bg-grey-800">
          <tr>
            <th
              class="px-3 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider w-48"
            >
              ID Request
            </th>
            <th
              class="px-3 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider w-52"
            >
              Update Category
            </th>
            <th
              class="px-3 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider w-36"
            >
              Status
            </th>
            <th
              class="px-3 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider w-44"
            >
              Date Change
            </th>

            <th
              v-if="hasApprovedRequests"
              class="px-3 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider w-48"
            >
              Approved At
            </th>
            <th
              class="px-3 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider w-56"
            >
              Reviewer
            </th>
            <th
              class="px-3 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider w-32"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody
          class="bg-white dark:bg-grey-800 divide-y divide-grey-200 dark:divide-grey-700"
        >
          <tr
            v-for="request in displayData"
            :key="request.id"
            class="hover:bg-grey-100 dark:hover:bg-grey-500 transition-all duration-200 cursor-pointer"
            @click="handleRowClick(request)"
          >
            <td
              class="px-3 py-3 whitespace-nowrap text-sm font-medium text-text-main dark:text-grey-100"
            >
              {{ request.request_id || request.id }}
            </td>
            <td class="px-3 py-3 whitespace-nowrap">
              <span
                class="inline-flex px-2 py-1 text-xs font-medium bg-grey-100 dark:bg-grey-700 text-grey-800 dark:text-grey-200 rounded-md"
              >
                {{ getCategoryDisplayName(request.update || request.category) }}
              </span>
            </td>
            <td class="px-3 py-3 whitespace-nowrap">
              <StatusBadge :status="getNormalizedStatus(request)" />
            </td>
            <td
              class="px-3 py-3 whitespace-nowrap text-sm text-grey-600 dark:text-grey-400"
            >
              {{ formatDate(request.submittedAt || request.dateChange || request.date_change) }}
            </td>

            <td
              v-if="hasApprovedRequests"
              class="px-3 py-3 whitespace-nowrap text-sm text-grey-600 dark:text-grey-400"
            >
              {{ getNormalizedStatus(request) === 'Approved' || getNormalizedStatus(request) === 'approved' 
                  ? formatDate(request.lastUpdated || request.approvedAt || request.approved_at) 
                  : '-' }}
            </td>
            <td class="px-3 py-3 whitespace-nowrap">
              <div v-if="request.reviewer" class="flex items-center min-w-0">
                <div
                  class="w-6 h-6 rounded-full bg-primary-50 text-primary font-bold flex items-center justify-center mr-2 select-none overflow-hidden"
                  :title="getReviewerName(request.reviewer)"
                >
                  <span class="text-[10px] leading-none">{{ getInitials(getReviewerName(request.reviewer)) }}</span>
                </div>
                <span
                  class="text-sm text-grey-600 dark:text-grey-400 truncate"
                  :title="getReviewerName(request.reviewer)"
                  style="max-width: 10rem; display: inline-block;"
                >{{ getReviewerName(request.reviewer) }}</span>
              </div>
              <span v-else class="text-sm text-grey-400">-</span>
            </td>

            <td class="px-3 py-3 whitespace-nowrap text-sm font-medium w-32">
              <div class="flex items-center gap-1 shrink-0">
                <!-- View, Edit, Delete Action Buttons -->
                <button
                  @click.stop="handleView(request)"
                  class="inline-flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-md transition-colors"
                  title="View Details"
                >
                  <i class="pi pi-eye text-xs"></i>
                </button>
                <button
                  v-if="canEdit(getNormalizedStatus(request))"
                  @click.stop="handleEdit(request)"
                  class="inline-flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-blue-900 hover:bg-green-200 dark:hover:bg-blue-800 text-green-600 dark:text-blue-400 rounded-md transition-colors"
                  title="Edit Request"
                >
                  <i class="pi pi-pencil text-xs"></i>
                </button>
                <button
                  v-if="canDelete(getNormalizedStatus(request))"
                  @click.stop="handleDelete(request)"
                  class="inline-flex items-center justify-center w-6 h-6 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400 rounded-md transition-colors"
                  title="Delete Request"
                >
                  <i class="pi pi-trash text-xs"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!--
      Mobile List View
      ----------------
      Shows the request history in a card/list format for mobile screens.
    -->
    <div v-if="!loading && displayData.length > 0" class="lg:hidden px-6 sm:px-8">
      <div class="space-y-4">
        <div
          v-for="request in displayData"
          :key="request.id"
          class="bg-white dark:bg-grey-800 border border-grey-200 dark:border-grey-700 rounded-md p-4 space-y-3 hover:bg-grey-50 dark:hover:bg-grey-800 transition-colors cursor-pointer"
          @click="handleRowClick(request)"
        >
          <!-- Header with ID -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex flex-col">
                <span
                  class="text-sm font-medium text-text-main dark:text-grey-100"
                  >{{ request.request_id || request.id }}</span
                >
              </div>
            </div>
            <StatusBadge :status="getNormalizedStatus(request)" />
          </div>

          <!-- Category and Date -->
          <div class="flex items-center justify-between">
            <span
              class="inline-flex px-2 py-1 text-xs font-medium bg-grey-100 dark:bg-grey-700 text-grey-800 dark:text-grey-200 rounded-md"
            >
              {{ getCategoryDisplayName(request.update || request.category) }}
            </span>
            <span class="text-xs text-grey-500">{{
              formatDate(request.submittedAt || request.dateChange || request.date_change)
            }}</span>
          </div>



          <!-- Reviewer and Approved At -->
          <div class="flex items-center justify-between text-xs text-grey-500">
            <div v-if="request.reviewer" class="flex items-center">
              <div
                class="w-4 h-4 rounded-full bg-primary-50 text-primary font-bold flex items-center justify-center mr-2 select-none overflow-hidden"
                :title="getReviewerName(request.reviewer)"
              >
                <span class="text-[8px] leading-none">{{ getInitials(getReviewerName(request.reviewer)) }}</span>
              </div>
              <span>{{ getReviewerName(request.reviewer) }}</span>
            </div>
            <span v-else>-</span>
            <span v-if="getNormalizedStatus(request) === 'Approved' || getNormalizedStatus(request) === 'approved'">{{
              formatDate(request.lastUpdated || request.approvedAt || request.approved_at)
            }}</span>
            <span v-else>-</span>
          </div>

          <!-- Actions -->
          <div
            class="flex items-center justify-end gap-2 pt-2 border-t border-grey-100 dark:border-grey-700"
          >
            <button
              @click.stop="handleView(request)"
              class="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-md transition-colors"
              title="View Details"
            >
              <i class="pi pi-eye text-sm"></i>
            </button>
            <button
              v-if="canEdit(getNormalizedStatus(request))"
              @click.stop="handleEdit(request)"
              class="inline-flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-600 dark:text-green-400 rounded-md transition-colors"
              title="Edit Request"
            >
              <i class="pi pi-pencil text-sm"></i>
            </button>
            <button
              v-if="canDelete(getNormalizedStatus(request))"
              @click.stop="handleDelete(request)"
              class="inline-flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400 rounded-md transition-colors"
              title="Delete Request"
            >
              <i class="pi pi-trash text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!--
      Empty State
      -----------
      Shown when there are no requests to display.
    -->
    <div v-if="!loading && displayData.length === 0" class="p-12 text-center">
      <i class="pi pi-inbox text-4xl text-grey-400 dark:text-grey-500 mb-4"></i>
      <h3 class="text-lg font-medium text-grey-900 dark:text-grey-100 mb-2">
        No requests found
      </h3>
      <p class="text-grey-600 dark:text-grey-400">
        No request history available at the moment.
      </p>
    </div>

    <!--
      Pagination Section
      ------------------
      Controls for navigating between pages of requests.
    -->
    <div
      v-if="displayData.length > 0"
      class="px-4 sm:px-6 py-4 border-t border-grey-200 dark:border-grey-700"
    >
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div
          class="text-sm text-grey-600 dark:text-grey-400 text-center sm:text-left"
        >
          Showing {{ displayData.length }} of {{ totalItems || data.length }} results
        </div>
        <div class="flex items-center justify-center sm:justify-end gap-1">
          <UiPagination
            :current-page="currentPage || 1"
            :total-pages="totalPages || 1"
            :has-prev-page="hasPrevPage"
            :has-next-page="hasNextPage"
            @prev-page="$emit('prev-page')"
            @next-page="$emit('next-page')"
            @goto-page="$emit('goto-page', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Import Vue and component dependencies
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import StatusBadge from "~/components/update-data/status/StatusBadge.vue";
import UiPagination from "~/components/ui/UiPagination.vue";

// Define props for the request history table
const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  filterOptions: {
    type: Array,
    default: () => [
      { value: "all", label: "All Status" },
      { value: "draft", label: "Draft" },
      { value: "approved", label: "Approved" },
      { value: "waiting", label: "Waiting Approval" },
      { value: "rejected", label: "Rejected" },
    ],
  },
  // Pagination props
  currentPage: {
    type: Number,
    default: 1,
  },
  totalItems: {
    type: Number,
    default: 0,
  },
  hasNextPage: {
    type: Boolean,
    default: false,
  },
  hasPrevPage: {
    type: Boolean,
    default: false,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
});

// Define emits for table actions
const emit = defineEmits([
  "view",
  "edit",
  "delete",
  "search",
  "row-click",
  // Pagination emits
  "prev-page",
  "next-page",
  "goto-page",
]);
// Compute limited page numbers (max 2 around current)
// Pagination buttons are now handled inside UiPagination

// State for selected items and filter dropdown
// No bulk selection state

// Limit displayed items to 40 to avoid vertical scrolling in the table
const displayData = computed(() => {
  if (!Array.isArray(props.data)) return [];
  return props.data.slice(0, 40);
});

// Check if there are any approved requests to show the Approved At column
const hasApprovedRequests = computed(() => {
  const hasApproved = displayData.value.some(request => {
    const status = getNormalizedStatus(request);
    return status === 'Approved' || status === 'approved';
  });
  return hasApproved;
});

// Helper functions for display and formatting
const getCategoryDisplayName = (category) => {
  if (!category || typeof category !== 'string') return "Personal Data";
  // Normalize the category string
  const normalized = category
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
  const categoryMap = {
    data_employee: "Basic Information",
    "basic-information": "Basic Information",
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

// Normalize status untuk menampilkan "Rejected" untuk status "3" (Need Revision)
const getNormalizedStatus = (request) => {
  const status = request.statusDisplay || request.status;
  
  // Jika status adalah "3" atau "Need Revision", tampilkan sebagai "Rejected"
  if (status === '3' || status === 3 || 
      status === 'Need Revision' || status === 'need_revision' || 
      status === 'needs_revision') {
    return 'Rejected';
  }
  
  return status;
};

const formatDate = (dateString) => {
  if (!dateString || dateString === null || dateString === undefined)
    return "-";
  try {
    // Handle format "DD-MM-YYYY HH:MM" from database
    if (typeof dateString === 'string' && dateString.includes('-') && dateString.includes(' ')) {
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('-');
      
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      
      const monthName = monthNames[parseInt(month) - 1];
      
      return `${day} ${monthName} ${year}, ${timePart}`;
    }
    
    // Fallback to Date object parsing for other formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    
    // Format DD Bulan YYYY, HH:MM
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  } catch (error) {
    return "-";
  }
};

const getReviewerName = (reviewer) => {
  const toProperName = (str) => {
    if (!str || typeof str !== 'string') return str;
    return str
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!reviewer) return "System";
  if (typeof reviewer === "string") return toProperName(reviewer);
  if (typeof reviewer === "object" && reviewer.name) return toProperName(reviewer.name);
  return "System";
};

const getReviewerAvatar = (reviewer) => {
  if (!reviewer) return "https://i.pravatar.cc/32?u=system";
  if (typeof reviewer === "object" && reviewer.avatar) return reviewer.avatar;
  if (typeof reviewer === "string")
    return `https://i.pravatar.cc/32?u=${reviewer}`;
  return "https://i.pravatar.cc/32?u=reviewer";
};

// Compute initials like header/profile
const getInitials = (name) => {
  try {
    const n = (name || '').trim();
    if (!n) return 'HC';
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } catch (e) {
    return 'HC';
  }
};

const canEdit = (status) => {
  // Allow editing for Draft (1) and Need Revision (3) statuses
  const s = (status || '').toString().trim()
  return s === "1" || s === "3" || 
         s.toLowerCase() === "draft" ||
         s.toLowerCase() === "need revision" || s.toLowerCase() === "need_revision" ||
         s.toLowerCase() === "rejected";
};

const canDelete = (status) => {
  // Allow deletion only for Draft (1) status
  return status === "1" || status === "Draft" || status === "draft";
};



// Event handlers for selection, filter, and actions
// No bulk selection handlers

// no filter UI

const handleRowClick = (request) => {
  emit("row-click", request);
};

// Handle actions - emit with full request data
const handleView = (request) => {
  emit("view", request);
};

const handleEdit = (request) => {
  emit("edit", request);
};

const handleDelete = (request) => {
  emit("delete", request);
};

// No selection watch needed

// no dropdown handlers

// No updateSelectedItems


</script>
