/**
 * User Profile Management
 * Simplified profile system that works with new authentication core
 *
 * @version 2.0.0
 */

import { ref, computed, watch, nextTick, onUnmounted } from "vue";
import { useAuthenticationCore } from "./useAuthenticationCore";

export const useProfile = () => {
  const { user } = useAuthenticationCore();

  const profile = ref({
    employee_name: "",
    email: "",
    role: "",
    company: "",
    company_address: "",
    phone_number: "",
    photo_profile_ess: "",
    employee_level: "",
    employee_position: "",
    unit: "",
    organization: "",
    spv_id: "",
    spv_name: "",
    authenticator: "",
    user_id: "",
    nik: "",
    employee_id: "",
  });

  const loading = ref(false);
  const error = ref(null);

  // Map user data to profile
  const mapUserToProfile = (userData) => {
    if (!userData) return null;

    const isSSO = userData.authenticator === "ACTIVE DIRECTORY";

    return {
      employee_name: isSSO ? userData.employee_name : (userData.name || userData.employee_name || ""),
      email: userData.email || "",
      role: userData.role || "",
      company: userData.company_code || userData.company || "",
      company_address: userData.company_address || "",
      phone_number: userData.phone_number || "",
      photo_profile_ess: userData.photo || userData.photo_profile_ess || "",
      employee_level: userData.employee_level || "",
      employee_position: userData.employee_position || "",
      unit: userData.unit || "",
      organization: userData.organization || "",
      spv_id: userData.spv_id || "",
      spv_name: userData.spv_name || "",
      authenticator: userData.authenticator || userData.source || "",
      user_id: userData.user_id || "",
      nik: userData.nik || "",
      employee_id: userData.employee_id || "",
    };
  };

  // Load profile from user data
  const loadProfile = async () => {
    loading.value = true;
    error.value = null;

    try {
      const userData = user.value;
      if (userData) {
        const mappedProfile = mapUserToProfile(userData);
        if (mappedProfile) {
          profile.value = mappedProfile;
        }
      }
      await nextTick();
    } catch (err) {
      error.value = err.message || "Failed to load profile";
    } finally {
      loading.value = false;
    }
  };

  // ✅ FIX: Load profile immediately on initialization
  // This ensures profile is populated even if user.value was already set
  if (process.client && user.value) {
    const mappedProfile = mapUserToProfile(user.value);
    if (mappedProfile) {
      profile.value = mappedProfile;
      console.log('[useProfile] ✅ Profile loaded on init:', profile.value.employee_name);
    }
  }


  // Update profile photo
  const updateProfilePhoto = async (photoUrl) => {
    profile.value.photo_profile_ess = photoUrl;
  };

  // Computed properties
  const employeeName = computed(() => profile.value.employee_name || "");
  const email = computed(() => profile.value.email || "");
  const role = computed(() => profile.value.role || "");
  const company = computed(() => profile.value.company || "");
  const companyAddress = computed(() => profile.value.company_address || "");
  const phoneNumber = computed(() => profile.value.phone_number || "");
  const photoProfile = computed(() => profile.value.photo_profile_ess || "/images/placeholder-avatar.png");
  const employeeLevel = computed(() => profile.value.employee_level || "");
  const employeePosition = computed(() => profile.value.employee_position || "");
  const unit = computed(() => profile.value.unit || "");
  const organization = computed(() => profile.value.organization || "");
  const spvId = computed(() => profile.value.spv_id || "");
  const spvName = computed(() => profile.value.spv_name || "");
  const authenticator = computed(() => profile.value.authenticator || "");
  const userId = computed(() => profile.value.user_id || "");
  const nik = computed(() => profile.value.nik || "");
  const employeeId = computed(() => profile.value.employee_id || "");

  // Check if profile is loaded
  const isProfileLoaded = computed(() => !!profile.value.employee_name);

  // Authentication method helpers
  const isSSO = computed(() => profile.value.authenticator === "ACTIVE DIRECTORY");
  const isESSUser = computed(() => profile.value.authenticator === "ESS_USER");

  // User initials
  const userInitials = computed(() => {
    const name = profile.value.employee_name || user.value?.employee_name || user.value?.name || "";

    if (!name.trim()) {
      return "U";
    }

    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  });

  // Watch user data changes
  watch(user, async (newUser) => {
    if (newUser) {
      const mappedProfile = mapUserToProfile(newUser);
      if (mappedProfile) {
        profile.value = mappedProfile;
      }
      await nextTick();
    } else {
      // Reset profile when user is null
      profile.value = {
        employee_name: "",
        email: "",
        role: "",
        company: "",
        company_address: "",
        phone_number: "",
        photo_profile_ess: "",
        employee_level: "",
        employee_position: "",
        unit: "",
        organization: "",
        spv_id: "",
        spv_name: "",
        authenticator: "",
        user_id: "",
        nik: "",
        employee_id: "",
      };
    }
  }, { immediate: true, deep: true });

  return {
    // Profile data
    profile,
    profileData: profile,
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    // Functions
    loadProfile,
    updateProfilePhoto,

    // Computed properties
    employeeName,
    email,
    role,
    company,
    companyAddress,
    phoneNumber,
    photoProfile,
    isProfileLoaded,
    userInitials,
    employeeLevel,
    employeePosition,
    unit,
    organization,
    spvId,
    spvName,
    authenticator,
    userId,
    nik,
    employeeId,
    isSSO,
    isESSUser,
  };
};

export const useUserRoles = () => {
  const userRoles = ref([]);

  const loadUserRoles = () => {
    // Try to load from localStorage first
    const rolesString = localStorage.getItem('user_roles');
    if (rolesString) {
      try {
        const parsed = JSON.parse(rolesString);
        userRoles.value = parsed;
        return;
      } catch (error) {
        // console.error('[useUserRoles] Error parsing user_roles:', error);
      }
    }

    // Fallback: Extract roles from user object if user_roles not available
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user.roles && Array.isArray(user.roles)) {
          userRoles.value = user.roles;
          // Save to localStorage for future use
          localStorage.setItem('user_roles', JSON.stringify(user.roles));
          return;
        }
      } catch (error) {
        // console.error('[useUserRoles] Error parsing user:', error);
      }
    }

    // console.warn('[useUserRoles] No roles found in localStorage');
  };

  // Load roles on initialization
  loadUserRoles();

  // ✅ FIX: Listen to custom event when roles are saved (fixes first load issue)
  // This ensures roles update in real-time when UserStorage.saveRoles() is called
  if (process.client) {
    const handleRolesSaved = () => {
      loadUserRoles(); // Reload when roles change
    };

    // Listen to custom event from UserStorage
    window.addEventListener('user-roles-saved', handleRolesSaved);

    // Listen to storage events for cross-tab sync
    window.addEventListener('storage', (event) => {
      if (event.key === 'user_roles') {
        loadUserRoles();
      }
    });

    // Cleanup on unmount (Vue 3 lifecycle)
    if (typeof onUnmounted === 'function') {
      onUnmounted(() => {
        window.removeEventListener('user-roles-saved', handleRolesSaved);
      });
    }
  }

  return {
    userRoles: computed(() => userRoles.value),
    loadUserRoles,
  };
};