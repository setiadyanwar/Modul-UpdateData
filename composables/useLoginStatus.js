import { ref } from "vue";

// Global state untuk tracking login baru
const recentlyLoggedIn = ref(false);

export const useLoginStatus = () => {
    const setJustLoggedIn = () => {
    recentlyLoggedIn.value = true;
    
    // ✅ OPTIMIZED: Auto clear after 5 seconds (increased from 3s)
    setTimeout(() => {
      recentlyLoggedIn.value = false;
    }, 5000);
  };

    const checkAndClearLoginStatus = () => {
    const wasRecentlyLoggedIn = recentlyLoggedIn.value;

    if (wasRecentlyLoggedIn) {
      recentlyLoggedIn.value = false;
    }
    return wasRecentlyLoggedIn;
  };

  return {
    recentlyLoggedIn,
    setJustLoggedIn,
    checkAndClearLoginStatus,
  };
};
