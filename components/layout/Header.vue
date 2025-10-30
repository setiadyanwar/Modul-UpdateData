<template>
  <header class="h-16 bg-background border-b border-grey-200 dark:border-grey-800 flex items-center justify-end px-6 flex-shrink-0">
    <!-- User Profile & Notifications -->
    <div v-if="isAuthenticated && hasValidUserData" class="flex items-center gap-4 relative">
      <div class="relative">
        <!-- Notification Bell Icon -->
        <NotificationBell
          :count="unreadCount"
          @click="
            isNotificationOpen = !isNotificationOpen;
            isProfileOpen = false;
          "
        />
        <!-- Notification Dropdown -->
        <transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95"
        >
          <NotificationDropdown
            v-if="isNotificationOpen"
            :notifications="notifications"
          />
        </transition>
      </div>

      <div class="flex items-center gap-4">
        <!-- User Info (Name & Email) -->
        <div class="text-right hidden sm:block max-w-[26rem]">
          <p class="text-sm font-semibold text-text-main">
            {{ employeeName }}
          </p>
          <div class="mt-0.5 flex items-center justify-end gap-1 flex-wrap">
            <div class="flex items-center gap-1 flex-wrap justify-end">
              <span
                v-for="role in visibleRoles"
                :key="`hdr-role-${role}`"
                :class="[
                  'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] leading-4 border',
                  isAdminRole(role)
                    ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
                    : 'bg-primary-50 text-primary border-primary/20'
                ]"
                :title="role"
              >
                {{ role }}
              </span>
              <span
                v-if="extraRoleCount > 0"
                class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] leading-4 bg-grey-100 dark:bg-grey-800 text-grey-700 dark:text-grey-300 border border-grey-200 dark:border-grey-700"
                :title="`+${extraRoleCount} more: ${displayRoles}`"
              >
                +{{ extraRoleCount }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Profile Avatar Button -->
        <div class="relative">
          <button
            @click="
              isProfileOpen = !isProfileOpen;
              isNotificationOpen = false;
            "
            class="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary font-bold hover:bg-primary-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 overflow-hidden"
          >
            <img
              v-if="photoProfile && photoProfile !== '/images/placeholder-avatar.png'"
              :src="photoProfile"
              :alt="employeeName || 'User'"
              class="w-full h-full object-cover"
              @error="handleProfileImageError"
            />
            <span v-else class="text-sm font-semibold">{{ userInitials }}</span>
          </button>
          
          <!-- Profile Dropdown -->
          <transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <div
              v-if="isProfileOpen"
              class="absolute right-0 mt-2 w-48 bg-background rounded-md shadow-lg border border-grey-200 dark:border-grey-700 z-50"
            >
              <div class="py-1">
                <NuxtLink
                  to="/profile"
                  class="flex items-center w-full text-left px-4 py-2 text-sm text-grey-700 dark:text-grey-300 hover:bg-grey-100 dark:hover:bg-grey-700"
                  @click="isProfileOpen = false"
                >
                  <i class="pi pi-user mr-3"></i> Profile
                </NuxtLink>
                <hr class="border-grey-200 dark:border-grey-700" />
                <button
                  @click="handleLogout"
                  class="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <i class="pi pi-sign-out mr-3"></i> Logout
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="isAuthenticated && !hasValidUserData" class="flex items-center gap-4">
      <div class="w-40 h-8 bg-grey-200 rounded animate-pulse"></div>
    </div>
    
    <!-- Not Authenticated State -->
    <div v-else class="flex items-center gap-4">
      <div class="w-40 h-8 bg-grey-200 rounded animate-pulse"></div>
    </div>

    <!-- Overlay: Closes dropdowns when clicking outside -->
    <div
      v-if="isProfileOpen || isNotificationOpen"
      @click="closeDropdowns"
      class="fixed inset-0 z-40"
    ></div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useProfile, useUserRoles } from "#imports";
import { useAuthenticationCore } from "~/composables/useAuthenticationCore";
import NotificationBell from "./NotificationBell.vue";
import NotificationDropdown from "./NotificationDropdown.vue";

// Get authentication and profile data
const { isAuthenticated, logout } = useAuthenticationCore();
const { employeeName, email, photoProfile, userInitials, isProfileLoaded } = useProfile();
const { userRoles, loadUserRoles } = useUserRoles();
loadUserRoles();

// Refresh roles when auth/permissions are refreshed elsewhere
const handleRolesRefreshEvent = () => {
  try { loadUserRoles(); } catch (e) {}
};

onMounted(() => {
  window.addEventListener('user-login', handleRolesRefreshEvent);
  window.addEventListener('user-roles-updated', handleRolesRefreshEvent);
  window.addEventListener('user-data-updated', handleRolesRefreshEvent); // ✅ Listen to iframe auth updates
});

onUnmounted(() => {
  window.removeEventListener('user-login', handleRolesRefreshEvent);
  window.removeEventListener('user-roles-updated', handleRolesRefreshEvent);
  window.removeEventListener('user-data-updated', handleRolesRefreshEvent);
});

// State for dropdowns
const isProfileOpen = ref(false);
const isNotificationOpen = ref(false);

// Check if we have valid user data
const hasValidUserData = computed(() => {
  return isProfileLoaded.value && employeeName.value && employeeName.value !== "";
});

// Normalize and format user roles for display
const displayRoles = computed(() => {
  const roles = Array.isArray(userRoles.value) ? userRoles.value : [];
  if (!roles.length) return "Employee";

  const names = roles.map((r) => {
    if (!r) return null;
    if (typeof r === "string") return r;
    if (typeof r.role_name === "string") return r.role_name;
    if (typeof r.name === "string") return r.name;
    return null;
  }).filter(Boolean);

  return names.length ? names.join(", ") : "Employee";
});

// Header chips: show up to 3 roles, then "+N"
const roleList = computed(() => {
  const roles = Array.isArray(userRoles.value) ? userRoles.value : [];
  const names = roles.map((r) => {
    if (!r) return null;
    if (typeof r === "string") return r;
    if (typeof r.role_name === "string") return r.role_name;
    if (typeof r.name === "string") return r.name;
    return null;
  }).filter(Boolean);
  return names.length ? names : ["Employee"];
});

// Show first 2 roles, then "+N" where N = totalAssignedRoles - 2 (raw count)
const visibleRoles = computed(() => roleList.value.slice(0, 2));
const totalAssignedRoles = computed(() => Array.isArray(userRoles.value) ? userRoles.value.length : 0);
const extraRoleCount = computed(() => Math.max(0, totalAssignedRoles.value - 2));

// Helpers
const isAdminRole = (name) => {
  if (!name || typeof name !== 'string') return false;
  const normalized = name.toLowerCase();
  return normalized === 'admin_hc' || normalized === 'admin-hc' || normalized.includes('admin');
};

// Function to close both dropdowns
const closeDropdowns = () => {
  isProfileOpen.value = false;
  isNotificationOpen.value = false;
};

// Notifications: commented out dummy data while feature is in development
// const unreadCount = ref(3);
// const notifications = ref([
//   {
//     id: 1,
//     title: "Status update change to review",
//     description: "Your data change has been sent to HC and will be processed soon...",
//     time: "14:00",
//     icon: "https://cdn-icons-png.flaticon.com/512/3063/3063823.png",
//   },
//   {
//     id: 2,
//     title: "Status update change to review", 
//     description: "Your data change has been sent to HC and will be processed soon...",
//     time: "14:00",
//     icon: "https://cdn-icons-png.flaticon.com/512/3063/3063823.png",
//   },
//   {
//     id: 3,
//     title: "Status update change to review",
//     description: "Your data change has been sent to HC and will be processed soon...",
//     time: "14:00",
//     icon: "https://cdn-icons-png.flaticon.com/512/3063/3063823.png",
//   },
// ]);
// Use empty state during development
const unreadCount = ref(0);
const notifications = ref([]);

// Handle logout action
const handleLogout = async () => {
  isProfileOpen.value = false;
  await logout("User logged out from header");
};

// Handle profile image error - fallback to initials
const handleProfileImageError = (event) => {
  event.target.style.display = 'none';
};
</script>