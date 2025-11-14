<template>
  <aside
    :class="[
      'bg-background border-r border-grey-200 dark:border-grey-800 flex flex-col transition-all duration-300 ease-in-out',
      isSidebarCollapsed ? 'w-14' : 'w-64',
    ]"
    @contextmenu.prevent
  >
    <div
      :class="[
        'h-16 flex items-center border-b border-grey-200 dark:border-grey-800 flex-shrink-0 w-full relative',
        isSidebarCollapsed ? 'px-1 justify-center' : 'px-4',
      ]"
    >
      <template v-if="!isSidebarCollapsed">
        <img
          src="@/assets/logo.svg"
          alt="Logo"
          class="h-8 dark:invert dark:brightness-0 flex-shrink-0"
        />
        <img
          src="@/assets/logo-ess-transparant.png"
          alt="ESS Logo"
          class="h-4 object-contain ml-2 flex-shrink-0"
          draggable="false"
        />
        <button
          @click="toggleSidebar"
          class="ml-auto p-2 rounded-md bg-background border border-grey-200 dark:border-grey-800 hover:bg-grey-200 dark:hover:bg-grey-700 transition-all duration-300 ease-in-out"
          aria-label="Toggle sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
        </button>
      </template>
      <template v-else>
        <div class="relative group flex items-center justify-center">
          <img
            src="@/assets/logo-ess-transparant.png"
            alt="ESS Logo"
            class="h-6 max-w-[32px] object-contain"
            draggable="false"
          />
          <div
            class="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50"
          >
            ESS Sigma
          </div>
        </div>
      </template>
    </div>

    <nav class="flex-1 py-4 space-y-1" :class="isSidebarCollapsed ? 'px-1' : 'px-3'">
      <!-- Back to Dashboard -->
      <button
        @click="navigateToParentDashboard"
        class="flex items-center rounded-md transition-all duration-200 overflow-hidden whitespace-nowrap text-grey-600 dark:text-grey-400 hover:bg-grey-100 dark:hover:bg-grey-800 relative group w-full no-link-preview"
        :class="[
          isSidebarCollapsed
            ? 'w-10 h-10 justify-center mx-auto'
            : 'py-2.5 px-4'
        ]"
        :title="'Back to Dashboard'"
        @contextmenu.prevent
      >
        <i :class="[
          'pi pi-home flex-shrink-0',
          isSidebarCollapsed ? 'text-base' : 'text-lg'
        ]"></i>
        <span v-if="!isSidebarCollapsed" class="ml-3 text-sm font-medium">Back to Dashboard</span>

        <div
          v-if="isSidebarCollapsed"
          class="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50"
        >
          Back to Dashboard
        </div>
      </button>

      <!-- Divider -->
      <div v-if="!isSidebarCollapsed" class="h-px bg-grey-200 dark:bg-grey-700 my-4"></div>
      <div v-if="isSidebarCollapsed" class="h-px bg-grey-200 dark:bg-grey-700 mx-2 my-4"></div>

      <!-- Regular Navigation -->
      <NuxtLink
        v-for="item in regularNavigation"
        :key="item.name"
        :to="item.href"
        class="flex items-center rounded-md transition-all duration-200 overflow-hidden whitespace-nowrap relative group no-link-preview"
        :class="[
          isSidebarCollapsed 
            ? 'w-10 h-10 justify-center mx-auto' 
            : 'py-2.5 px-4',
          isActive(item.href)
            ? 'bg-primary-50 dark:bg-primary-800/50 text-primary dark:text-white font-semibold'
            : 'text-grey-600 dark:text-grey-400 hover:bg-primary-50 dark:hover:bg-primary-900/50'
        ]"
        :title="item.name"
        draggable="false"
        @contextmenu.prevent
        @click.middle.prevent
        @auxclick.prevent
        @dragstart.prevent
      >
        <i :class="[
          item.icon, 
          'flex-shrink-0',
          isSidebarCollapsed ? 'text-base' : 'text-lg'
        ]"></i>
        <span v-if="!isSidebarCollapsed" class="ml-3 text-sm font-medium">{{ item.name }}</span>
        
        <div
          v-if="isSidebarCollapsed"
          class="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50"
        >
          {{ item.name }}
        </div>
      </NuxtLink>

      <!-- HC Only Section -->
      <div v-if="hcNavigation.length > 0" class="mt-6">
        <!-- HC Only Header -->
        <div v-if="!isSidebarCollapsed" class="px-4 py-2">
          <div class="flex items-center">
            <span class="text-xs font-semibold text-grey-500 dark:text-grey-400 uppercase tracking-wider">
              HC Only
            </span>
            <div class="h-px bg-grey-300 dark:bg-grey-600 flex-1 ml-3"></div>
          </div>
        </div>
        
        <!-- HC Only Divider for collapsed -->
        <div v-if="isSidebarCollapsed" class="h-px bg-grey-300 dark:bg-grey-600 mx-2 my-4"></div>

        <!-- HC Only Navigation -->
        <NuxtLink
          v-for="item in hcNavigation"
          :key="item.name"
          :to="item.href"
          class="flex items-center rounded-md transition-all duration-200 overflow-hidden whitespace-nowrap relative group no-link-preview"
          :class="[
            isSidebarCollapsed 
              ? 'w-10 h-10 justify-center mx-auto' 
              : 'py-2.5 px-4',
            isActive(item.href)
              ? 'bg-orange-50 dark:bg-orange-800/50 text-orange-600 dark:text-orange-400 font-semibold'
              : 'text-grey-600 dark:text-grey-400 hover:bg-orange-50 dark:hover:bg-orange-900/50'
          ]"
          :title="item.name"
          draggable="false"
          @contextmenu.prevent
          @click.middle.prevent
          @auxclick.prevent
          @dragstart.prevent
        >
          <i :class="[
            item.icon, 
            'flex-shrink-0',
            isSidebarCollapsed ? 'text-base' : 'text-lg'
          ]"></i>
          <span v-if="!isSidebarCollapsed" class="ml-3 text-sm font-medium">{{ item.name }}</span>
          
          <div
            v-if="isSidebarCollapsed"
            class="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50"
          >
            {{ item.name }}
          </div>
        </NuxtLink>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from "vue";
import { useLayout } from "~/composables/useLayout";
import { useRoute } from 'vue-router';
import { useRBAC } from "~/composables/useRBAC";
import envConfig from '~/config/environment.js';

const { isSidebarCollapsed, toggleSidebar } = useLayout();
const route = useRoute();
const { canUpdatePersonalData, canViewHistory, canManageConsent } = useRBAC();

/**
 * Get parent origin dynamically
 */
const getParentOrigin = () => {
  try {
    const referrer = document.referrer || '';
    if (referrer) {
      const origin = new URL(referrer).origin;
      if (origin) return origin;
    }
  } catch (e) {}
  return envConfig.REMOTE_APP.HOST_ORIGIN;
};

/**
 * Navigate to parent dashboard (for iframe mode)
 */
const navigateToParentDashboard = () => {
  const externalUrl = 'https://people-dev.telkomsigma.co.id/';
  if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
    try {
      window.parent.postMessage({ type: 'NAVIGATE', source: 'update-data', path: '/' }, getParentOrigin());
      return;
    } catch {}
  }
  window.location.href = externalUrl;
};

// Regular navigation items (permission-based)
const regularNavigation = computed(() => {
  const items = [];

  // Only show Update Data Personal if user has permission
  if (canUpdatePersonalData.value) {
    items.push({ name: "Update Data Personal", href: "/update-data", icon: "pi pi-pencil" });
  }

  // Only show Request History if user has permission
  if (canViewHistory.value) {
    items.push({
      name: "Request History & Status",
      href: "/update-data/history",
      icon: "pi pi-history",
    });
  }

  return items;
});

// HC Only navigation items (permission-based)
const hcNavigation = computed(() => {
  const items = [];

  // Only show Consent Management if user has permission
  if (canManageConsent.value) {
    items.push({
      name: "Consent Management",
      href: "/update-data/consent",
      icon: "pi pi-file",
    });
  }

  return items;
});

// Helper to determine if a navigation item is active
const isActive = (href) => {
  if (href === "/update-data") {
    // Active only for the main update-data page
    return route.path === "/update-data";
  } else if (href === "/update-data/history") {
    // Active for all history, edit, and view pages
    return (
      route.path.startsWith("/update-data/history") ||
      route.path.startsWith("/update-data/edit") ||
      route.path.startsWith("/update-data/view")
    );
  } else if (href === "/update-data/consent") {
    // Active for consent management page
    return route.path === "/update-data/consent";
  }
  // Fallback: active if path matches exactly
  return route.path === href;
};
</script>

<style scoped>
.group:hover .tooltip {
  @apply opacity-100;
}

nav::-webkit-scrollbar {
  width: 4px;
}

nav::-webkit-scrollbar-track {
  @apply bg-transparent;
}

nav::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

nav::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}

/* Prevent link preview and context menu */
.no-link-preview {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* Prevent text selection on hover */
nav a,
nav button {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>