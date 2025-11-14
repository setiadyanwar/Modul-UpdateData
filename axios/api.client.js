import axios from "axios";
import { useRuntimeConfig, navigateTo } from "#app";
import { useToast } from "~/composables/useToast";
import envConfig from "~/config/environment";

// Get API base URL from environment config
function getApiBaseUrl() {
  // ALWAYS use server proxy to avoid CORS (even in production/dev)
  // This ensures all API requests go through Nuxt server proxy which handles CORS properly
  return '/api/proxy';
}

// Create axios instance with improved configuration
const apiService = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: envConfig.TIMEOUT.DEFAULT,
  headers: {
    "Content-Type": "application/json",
  },
  // Additional axios options for better performance
  maxRedirects: 3,
  maxContentLength: 50 * 1024 * 1024, // 50MB
  validateStatus: (status) => status < 500, // Don't throw on 4xx errors
});

// Request interceptor to add auth token from iframe handler
apiService.interceptors.request.use(
  async (config) => {
    try {
      if (process.client) {
        // Get token from localStorage (managed by iframe-token-handler)
        const token = localStorage.getItem("access_token");

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          // No token available, request from parent
          // console.warn('[Update-Data API] No access token available, requesting from parent');
          if (window.$nuxt?.$updateDataAuth) {
            window.$nuxt.$updateDataAuth.requestTokenFromParent();
          }
        }
      }

      // Set appropriate timeout based on request type
      if (config.url?.includes('/upload') || config.url?.includes('/attachments')) {
        config.timeout = envConfig.TIMEOUT.UPLOAD;
      } else if (config.url?.includes('/download') || config.url?.includes('/export')) {
        config.timeout = envConfig.TIMEOUT.DOWNLOAD;
      } else if (config.url?.includes('/health') || config.url?.includes('/status')) {
        config.timeout = envConfig.TIMEOUT.HEALTH_CHECK;
  } else if (config.url?.includes('/auth/ticket/login')) {
    // Use shorter timeout for login exchange to fail fast
    config.timeout = envConfig.TIMEOUT.LOGIN;
      }

    } catch (error) {
      // console.error('[Update-Data API] Request interceptor error:', error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors with token refresh
apiService.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // console.error(
    //   "API Error:",
    //   error.config?.url,
    //   error.response?.status,
    //   error.response?.data,
    //   error.message
    // );

    // Handle 401 Unauthorized errors - notify parent (ESS-Sigma)
    const isTokenExpired = error.response?.status === 401 ||
                          (error.response?.data?.status === false &&
                           error.response?.data?.message === "Token has been invalidated") ||
                          (error.response?.data?.error_code === 'UNAUTHORIZED') ||
                          (error.response?.data?.data?.status === 401) ||
                          (error.response?.data?.data?.error_code === 'TOKEN_EXPIRED') ||
                          (error.response?.data?.action === 'refresh_token');

    if (isTokenExpired && process.client) {
      // console.warn('[Update-Data API] Token expired, notifying parent');

      // Clear local tokens
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("token_expiry");

      // Notify parent window that token has expired
      if (window.parent !== window && window.$nuxt?.$updateDataAuth) {
        window.$nuxt.$updateDataAuth.requestTokenFromParent();

        // Also send direct message to parent
        window.parent.postMessage({
          type: 'TOKEN_EXPIRED',
          source: 'update-data'
        }, envConfig.REMOTE_APP.HOST_ORIGIN);
      }
      
      return Promise.reject(error);
    }

    // Tambahan: Deteksi network error/VPN putus
    const isNetworkError =
      !error.response &&
      (error.code === "ECONNABORTED" ||
        error.message?.includes("Network Error") ||
        error.message?.includes("Failed to fetch"));

    const isServerUnavailable =
      [502, 503, 504].includes(error.response?.status);

    if (isNetworkError || isServerUnavailable) {
      // Hapus token
      localStorage.removeItem("auth-token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      // (Opsional) localStorage.removeItem("user");

      // Tampilkan toast (window.$toast atau useToast)
      if (process.client) {
        if (window.$toast) {
          window.$toast.error(
            "Connection to server failed. Please ensure office VPN is active. You have been automatically logged out.",
            { title: "Connection Lost" }
          );
        } else {
          const { error: showErrorToast } = useToast();
          showErrorToast(
            "Connection to server failed. Please ensure office VPN is active. You have been automatically logged out.",
            { title: "Connection Lost" }
          );
        }
        await navigateTo("/login");
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const apiGet = async (url, config = {}) => {
  try {
    const response = await apiService.get(url, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const apiPost = async (url, data = {}, config = {}) => {
  try {
    const response = await apiService.post(url, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const apiPut = async (url, data = {}, config = {}) => {
  try {
    const response = await apiService.put(url, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const apiDelete = async (url, config = {}) => {
  try {
    const response = await apiService.delete(url, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export { apiService };
