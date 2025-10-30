<template>
  <PageTransitionWrapper prefer-skeleton>
    <div
      class="relative flex h-screen bg-dashboard dark:bg-grey-900 text-text-main"
      :class="{ 'focus-mode-active': isFocusMode }"
    >
    <UpdateDataSidebar v-show="!isFocusMode" />

    <button
      v-if="isSidebarCollapsed && !isFocusMode"
      @click="toggleSidebar"
      class="absolute top-5 -translate-x-1/2 z-20 p-2 rounded-md bg-background border border-grey-200 dark:border-grey-800 hover:bg-grey-200 dark:hover:bg-grey-700 transition-all duration-300 ease-in-out"
      :class="isSidebarCollapsed ? 'left-20' : 'left-64'"
      aria-label="Toggle Sidebar"
    >
      <svg
        class="transition-transform duration-300"
        :class="{ 'rotate-180': isSidebarCollapsed }"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
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

    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Main Header -->
      <Header v-show="!isFocusMode" />

      

      <main
        class="flex-1 overflow-x-hidden overflow-y-auto py-6 md:py-8 px-6 md:px-10 bg-dashboard dark:bg-grey-900 transition-all duration-300"
        :class="{ 'pt-0': isFocusMode }"
      >
        <slot />
      </main>
    </div>

    <!-- Toast Notifications -->
    <Toast />

    <!-- Session Timeout Modal - FIXED -->
    <SessionTimeoutModal
      :is-visible="isSessionWarningVisible"
      :remaining-time="sessionCountdownTime"
      @extend-session="handleExtendSession"
      @logout="handleLogout"
    />
    <!-- Accessibility Menu - Tambahkan ini -->
    <AccessibilityMenu />
    </div>
  </PageTransitionWrapper>
</template>

<script setup>
import { ref, onMounted, provide, computed } from "vue";
import { useLayout } from "~/composables/useLayout";
import { useAuthenticationCore } from "~/composables/useAuthenticationCore";
import { useMasterData } from "~/composables/useMasterData";
import { useMasterOptions } from "~/composables/useMasterOptions";

import PageTransitionWrapper from "~/components/layout/PageTransitionWrapper.vue";
import Header from "~/components/layout/Header.vue";
import UpdateDataSidebar from "~/components/layout/UpdateDataSidebar.vue";
import SessionTimeoutModal from "~/components/common/SessionTimeoutModal.vue";
import Toast from "~/components/ui/Toast.vue";
import AccessibilityMenu from "~/components/common/AccessibilityMenu.vue";

const { isSidebarCollapsed, toggleSidebar } = useLayout();

// Focus Mode State
const isFocusMode = ref(false);

// Removed Auth Debug UI and logic

// Auth state for session timeout modal
const {
  isSessionWarningVisible,
  sessionCountdownTime,
  extendSession,
  logout
} = useAuthenticationCore();

// Handle session timeout modal events
const handleExtendSession = async () => {
  await extendSession();
};

const handleLogout = async () => {
  await logout('User logged out from session timeout modal');
};

// ✅ CENTRALIZED: Preload master data for all update-data pages
const { preloadCommonData, masterData } = useMasterData();
const isMasterDataReady = ref(false);

// Listen for focus mode toggle events
onMounted(async () => {
  if (process.client) {
    window.addEventListener('toggleFocusMode', (event) => {
      isFocusMode.value = event.detail.isFocusMode;
    });

    // Removed Auth Debug listeners and intervals

    // ✅ PRELOAD: Load master data once for all update-data pages
    try {
      await preloadCommonData();
      isMasterDataReady.value = true;
    } catch (error) {
      // Even on error, allow components to load so they can handle fallback
      isMasterDataReady.value = true;
    }
  }
});

// ✅ PROVIDE: Master data ready state to child components
provide('masterDataReady', isMasterDataReady);



// SEO
useHead({
  titleTemplate: "%s - Update Data - ESS Sigma",
  meta: [
    {
      name: "description",
      content: "Update personal data dashboard for ESS Sigma application",
    },
  ],
});
</script>

<style scoped>
/* Focus Mode Styles */
.focus-mode-active {
  /* Full width layout when focus mode is active */
  --sidebar-width: 0px;
  --header-height: 0px;
}

.focus-mode-active .main-content {
  margin-left: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
}

/* Smooth transitions for focus mode */
.transition-all {
  transition: all 0.3s ease-in-out;
}
</style>
