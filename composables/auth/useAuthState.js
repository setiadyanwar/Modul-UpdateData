import { ref, computed } from 'vue';

export const useAuthState = () => {
  // Core reactive state
  const user = ref(null);
  const isAuthenticated = ref(false);
  const isLoading = ref(false);

  // Account lockout state
  const failedLoginAttempts = ref(0);
  const lockoutEndTime = ref(null);
  const lockedEmail = ref('');

  // Computed properties
  const isAccountLocked = computed(() => {
    if (!lockoutEndTime.value) return false;
    return Date.now() < lockoutEndTime.value;
  });

  const formattedRemainingTime = computed(() => {
    if (!lockoutEndTime.value) return '';
    const remaining = Math.max(0, lockoutEndTime.value - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    failedLoginAttempts,
    lockoutEndTime,
    lockedEmail,
    isAccountLocked,
    formattedRemainingTime
  };
};
