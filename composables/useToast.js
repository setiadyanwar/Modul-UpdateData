import { ref } from "vue";

// Global state untuk toast agar bisa diakses dari mana saja
const toasts = ref([]);
let nextId = 1;

// Flag untuk mencegah multiple session expired toasts
let sessionExpiredToastShown = false;

export const useToast = () => {
  const addToast = (options) => {
    // Support both string and object formats
    const config = typeof options === "string" ? { message: options } : options;

    const {
      message,
      title = null,
      type = "info",
      duration = 5000,
      persistent = false,
    } = config;

    const id = nextId++;
    const toast = {
      id,
      message,
      title,
      type,
      duration,
      persistent,
      timestamp: new Date(),
    };

    toasts.value.push(toast);

    // Auto remove after duration (unless persistent)
    if (!persistent && duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id) => {
    const index = toasts.value.findIndex((toast) => toast.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const clearAll = () => {
    toasts.value = [];
  };

  // Convenience methods
  const success = (message, options = {}) => {
    return addToast({
      message,
      type: "success",
      title: options.title || "Success!",
      duration: options.duration || 4000,
      ...options,
    });
  };

  const error = (message, options = {}) => {
    return addToast({
      message,
      type: "error",
      title: options.title || "Error!",
      duration: options.duration || 6000,
      ...options,
    });
  };

  const warning = (message, options = {}) => {
    return addToast({
      message,
      type: "warning",
      title: options.title || "Warning!",
      duration: options.duration || 5000,
      ...options,
    });
  };

  const info = (message, options = {}) => {
    return addToast({
      message,
      type: "info",
      title: options.title || "Info",
      duration: options.duration || 4000,
      ...options,
    });
  };

  // Special function untuk session expired toast (hanya show sekali)
  const sessionExpired = (message, options = {}) => {
    if (sessionExpiredToastShown) {
      // Only log in development
      if (process.dev) {
      }
      return null;
    }

    sessionExpiredToastShown = true;
    
    // Reset flag after 8 seconds (increased from 5 to prevent rapid re-triggers)
    setTimeout(() => {
      sessionExpiredToastShown = false;
    }, 8000);

    return addToast({
      message: message || "Your session has expired. Please log in again.",
      type: "warning",
      title: options.title || "Session Expired",
      duration: options.duration || 5000,
      ...options,
    });
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    sessionExpired,
    error,
    warning,
    info,
  };
};
