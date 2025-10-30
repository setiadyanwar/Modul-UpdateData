import { useRuntimeConfig } from "#app";
import { $fetch } from "ofetch";
import envConfig from "~/config/environment";

export const useApi = () => {
  // Request batching system
  const batchQueue = new Map();
  const batchTimeout = 50; // 50ms batch window
  
  // Rate limiting system
  const rateLimitStore = new Map();
  const rateLimitConfig = envConfig.RATE_LIMIT;
  
  // Adaptive timeout system
  const responseTimeHistory = [];
  const maxHistorySize = 100;
  
  // Helper: recursively search an object for a key named 'existing_request' and return it
  const findExistingRequest = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    if (Object.prototype.hasOwnProperty.call(obj, 'existing_request')) return obj.existing_request;
    for (const k of Object.keys(obj)) {
      try {
        const v = obj[k];
        if (v && typeof v === 'object') {
          const found = findExistingRequest(v);
          if (found) return found;
        }
      } catch (e) {
        // ignore
      }
    }
    return null;
  };

  // Circuit Breaker dengan konfigurasi dari environment
  const circuitBreaker = {
    failures: 0,
    lastFailureTime: 0,
    state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
    threshold: envConfig.CIRCUIT_BREAKER.FAILURE_THRESHOLD,
    timeout: envConfig.CIRCUIT_BREAKER.RECOVERY_TIMEOUT,
    monitoringWindow: envConfig.CIRCUIT_BREAKER.MONITORING_WINDOW,
  };

  const resetCircuitBreaker = () => {
    circuitBreaker.failures = 0;
    circuitBreaker.state = 'CLOSED';
    circuitBreaker.lastFailureTime = 0;
  };

  const shouldBlockRequest = (checkAuthCooldown = false) => {
    // Check auth failure cooldown separately 
    if (checkAuthCooldown && authFailureCount > 0) {
      const timeSinceAuthFailure = Date.now() - lastAuthFailure;
      const cooldownTime = AUTH_FAILURE_COOLDOWN * Math.pow(2, Math.min(authFailureCount - 1, 3)); // Exponential backoff, max 8x
      
      if (timeSinceAuthFailure < cooldownTime) {
        // Auth cooldown active
        return true;
      }
      
      // Reset auth failure count after successful cooldown
      if (timeSinceAuthFailure > cooldownTime * 2) {
        authFailureCount = 0;
        lastAuthFailure = 0;
      }
    }
    
    if (circuitBreaker.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime;
      if (timeSinceLastFailure < circuitBreaker.timeout) {
        if (process.dev) {
          // Circuit breaker OPEN - blocking request
        }
        return true;
      }
      // Circuit breaker transitioning from OPEN to HALF_OPEN
      circuitBreaker.state = 'HALF_OPEN';
    }
    return false;
  };

  // Track authentication failures separately to prevent cascade
  let authFailureCount = 0;
  let lastAuthFailure = 0;
  const AUTH_FAILURE_COOLDOWN = 5000; // 5 seconds cooldown for auth errors

  const recordFailure = (errorType = 'general') => {
    const now = Date.now();
    
    // Handle auth failures separately with exponential backoff
    if (errorType === 'auth') {
      authFailureCount++;
      lastAuthFailure = now;
      
      // Auth failure recorded
      
      // Don't count auth errors towards circuit breaker to prevent cascade
      return;
    }
    
    // Only record non-auth failures for circuit breaker
    circuitBreaker.failures++;
    circuitBreaker.lastFailureTime = now;
    
    // Circuit breaker failure recorded
    
    if (circuitBreaker.failures >= circuitBreaker.threshold) {
      circuitBreaker.state = 'OPEN';
      // Circuit breaker OPEN - threshold reached
    }
  };

  const recordSuccess = () => {
    if (circuitBreaker.state === 'HALF_OPEN') {
      resetCircuitBreaker();
    }
  };

  // Rate limiting implementation
  const checkRateLimit = (endpoint) => {
    const now = Date.now();
    const windowStart = now - rateLimitConfig.WINDOW_MS;
    
    if (!rateLimitStore.has(endpoint)) {
      rateLimitStore.set(endpoint, []);
    }
    
    const requests = rateLimitStore.get(endpoint);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    rateLimitStore.set(endpoint, validRequests);
    
    if (validRequests.length >= rateLimitConfig.MAX_REQUESTS) {
      if (process.dev) {
        // Rate limit exceeded
      }
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    return true;
  };

  // Request batching implementation
  const addToBatch = (batchKey, requestFn) => {
    return new Promise((resolve, reject) => {
      if (!batchQueue.has(batchKey)) {
        batchQueue.set(batchKey, []);
        
        // Process batch after timeout
        setTimeout(async () => {
          const batch = batchQueue.get(batchKey);
          try {
            const results = await Promise.allSettled(batch.map(req => req.fn()));
            batch.forEach((req, index) => {
              const result = results[index];
              if (result.status === 'fulfilled') {
                req.resolve(result.value);
              } else {
                req.reject(result.reason);
              }
            });
          } catch (error) {
            batch.forEach(req => req.reject(error));
          }
          batchQueue.delete(batchKey);
        }, batchTimeout);
      }
      
      batchQueue.get(batchKey).push({
        fn: requestFn,
        resolve,
        reject
      });
    });
  };

  // Adaptive timeout calculation
  const getAdaptiveTimeout = () => {
    if (responseTimeHistory.length === 0) {
      return envConfig.TIMEOUT.DEFAULT;
    }
    
    const avgResponseTime = responseTimeHistory.reduce((sum, time) => sum + time, 0) / responseTimeHistory.length;
    const adaptiveTimeout = Math.min(envConfig.TIMEOUT.DEFAULT, avgResponseTime * 2);
    
    return Math.max(adaptiveTimeout, 5000); // Minimum 5 seconds
  };

  // Record response time for adaptive timeout
  const recordResponseTime = (startTime) => {
    const responseTime = Date.now() - startTime;
    responseTimeHistory.push(responseTime);
    
    if (responseTimeHistory.length > maxHistorySize) {
      responseTimeHistory.shift();
    }
  };

  const apiGet = async (endpoint, options = {}) => {
    // Check auth cooldown first for auth-related endpoints
    const isAuthEndpoint = endpoint.includes('/auth/') || endpoint.includes('/token') || endpoint.includes('/refresh');

    if (shouldBlockRequest(true)) {
      const errorMessage = isAuthEndpoint
        ? "Authentication temporarily blocked. Please wait before trying again."
        : "Server sedang tidak tersedia. Silakan coba lagi dalam beberapa menit.";

      console.error('[Update-Data API] 🚫 REQUEST BLOCKED', {
        endpoint,
        circuitBreakerState: circuitBreaker.state,
        authFailureCount,
        timeSinceAuthFailure: lastAuthFailure ? Date.now() - lastAuthFailure : 0
      });
      throw new Error(errorMessage);
    }
    
    // Check rate limiting
    if (!checkRateLimit(endpoint)) {
      const errorMessage = "Terlalu banyak request. Silakan tunggu sebentar.";
      throw new Error(errorMessage);
    }
    
    // Check if this request can be batched
    if (options.batchKey && options.batchable !== false) {
      return addToBatch(options.batchKey, () => apiGet(endpoint, { ...options, batchable: false }));
    }
    
    let token = null;

    if (process.client) {
      token = localStorage.getItem("access_token") ||
              localStorage.getItem("auth-token") ||
              localStorage.getItem("token");
    }

    if (token) {

      const startTime = Date.now();

      try {
        // Use /api/proxy/ to avoid CORS issues
        const response = await $fetch(`/api/proxy${endpoint}`, {
          method: "GET",
          headers: {
            // Do NOT set Content-Type on GET; some endpoints (e.g., attachments download) reject it
            Authorization: `Bearer ${token}`,
          },
          timeout: getAdaptiveTimeout(),
        });

        
        
        recordSuccess(); // Record success untuk circuit breaker
        return {
          success: true,
          raw: response,
          data: response.data || response,
          status: 200,
        };
      } catch (error) {
        console.error('[Update-Data API GET] ❌ Error', endpoint, {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          data: error.data
        });

        if (error.status === 401) {
          recordFailure('auth');
          const errorMessage = "Your session has expired. Please log in again.";
          if (process.client) {
            // 401 error detected - authentication required
            // Let authentication core handle the 401 error through existing token refresh logic
            // No need for global 401 handler - authentication should be handled by useAuthenticationCore
          }
          throw new Error(errorMessage);
        } else if (error.status === 403) {
          const errorMessage = "You don't have permission to access this resource.";
          // User message logged
          throw new Error(errorMessage);
        } else if (error.status >= 500) {
          const errorMessage = "Server error. Please try again later.";
          // User message logged
          throw new Error(errorMessage);
        } else {
          // For other errors, show generic message
          const errorMessage = error.message || "An error occurred while fetching data.";
          // User message logged
          throw new Error(errorMessage);
        }
      }
    }
    throw new Error("API call failed and no fallback allowed");
  };

  const apiPost = async (endpoint, data, options = {}) => {
    let token = null;
    
    if (process.client) {
      token = localStorage.getItem("access_token") ||
              localStorage.getItem("auth-token") ||
              localStorage.getItem("token");
    }

    if (token) {
      try {
        // Use /api/proxy/ to avoid CORS issues
        const response = await $fetch(`/api/proxy${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: data,
        });
        
        return {
          success: true,
          data: response.data || response,
          status: 200,
        };
      } catch (error) {
        // Emit server error details for debugging (dev only)
        try {
          if (process.client && error && error.data) {
            window.dispatchEvent(new CustomEvent('serverErrorBody', { detail: { endpoint: endpoint, status: error.status, body: error.data } }))
          }
        } catch (e) {
          // ignore
        }
        
        // Special handling for 409 - sometimes backend creates data but returns 409
  if (error.status === 409) {
          if (process.dev) {
            // 409 Error Debug logging
          }
          
          // If error contains success data, treat as success
          if (error.data && (error.data.status === true || error.data.success === true)) {
            return {
              success: true,
              data: error.data.data || error.data,
              status: 200,
            };
          }
          
          // Special case: "active request" conflicts that actually created/updated data
          // Check multiple possible paths for existing_request data
          // Try to find existing_request anywhere in the payload
          const existingRequest = findExistingRequest(error.data);
          if (error.data && error.data.message && error.data.message.includes('already have an active') && existingRequest) {
            if (process.dev) {
              // Treating 409 as success - active request found
            }
            return {
              success: true,
              data: existingRequest,
              status: 200,
              warning: error.data.message,
              conflict: true
            };
          }
          
          // Otherwise handle as normal 409 error
          const errorMessage = error.data?.message || "Data conflict detected. This record may already exist or have conflicting information.";
          if (process.dev) {
            // Throwing 409 error
          }
          throw new Error(errorMessage);
        }
        
        // Handle specific error cases with user-friendly messages
        if (error.status === 400) {
          const errorMessage = error.data?.message || "Invalid request data. Please check your input.";
          const e = new Error(errorMessage);
          e.status = error.status;
          e.data = error.data;
          throw e;
        } else if (error.status === 401) {
          recordFailure('auth');
          const errorMessage = "Your session has expired. Please log in again.";
          if (process.client) {
            if (process.dev) {
              // 401 error detected - triggering global 401 handler
            }
            // Dispatch custom event for global 401 handler
            window.dispatchEvent(new CustomEvent('401-error', { 
              detail: { status: 401, message: errorMessage } 
            }));
          }
          throw new Error(errorMessage);
        } else if (error.status === 403) {
          const errorMessage = "You don't have permission to perform this action.";
          throw new Error(errorMessage);
        } else if (error.status === 422) {
          const errorMessage = error.data?.message || "Validation failed. Please check your input data.";
          const e = new Error(errorMessage);
          e.status = error.status;
          e.data = error.data;
          throw e;
        } else if (error.status >= 500) {
          const errorMessage = "Server error. Please try again later.";
          throw new Error(errorMessage);
        } else {
          // For other errors, show generic message
          const errorMessage = error.data?.message || error.message || "An error occurred while saving data.";
          const e = new Error(errorMessage);
          e.status = error.status;
          e.data = error.data;
          throw e;
        }
      }
    }
    throw new Error("API call failed and no fallback allowed");
  };

  const apiPut = async (endpoint, data, options = {}) => {
    let token = null;
    
    if (process.client) {
      token = localStorage.getItem("access_token") ||
              localStorage.getItem("auth-token") ||
              localStorage.getItem("token");
    }

    if (token) {
      try {
        // Use /api/proxy/ to avoid CORS issues
        const response = await $fetch(`/api/proxy${endpoint}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: data,
        });
        
        return {
          success: true,
          data: response.data || response,
          status: 200,
        };
      } catch (error) {
        // Emit server error details for debugging (dev only)
        try {
          if (process.client && error && error.data) {
            window.dispatchEvent(new CustomEvent('serverErrorBody', { detail: { endpoint: endpoint, status: error.status, body: error.data } }))
          }
        } catch (e) {
          // ignore
        }
        
        
        // Handle specific error cases with user-friendly messages
        if (error.status === 400) {
          const errorMessage = error.data?.message || "Invalid request data. Please check your input.";
          const e = new Error(errorMessage);
          e.status = error.status;
          e.data = error.data;
          throw e;
        } else if (error.status === 401) {
          recordFailure('auth');
          const errorMessage = "Your session has expired. Please log in again.";
          if (process.client) {
            if (process.dev) {
              // 401 error detected - triggering global 401 handler
            }
            // Dispatch custom event for global 401 handler
            window.dispatchEvent(new CustomEvent('401-error', { 
              detail: { status: 401, message: errorMessage } 
            }));
          }
          throw new Error(errorMessage);
        } else if (error.status === 403) {
          const errorMessage = "You don't have permission to perform this action.";
          throw new Error(errorMessage);
        } else if (error.status === 404) {
          const errorMessage = "Record not found. The data you're trying to update may have been deleted.";
          throw new Error(errorMessage);
  }
  if (error.status === 409) {
          // If error contains success data, treat as success
          if (error.data && (error.data.status === true || error.data.success === true)) {
            return {
              success: true,
              data: error.data.data || error.data,
              status: 200,
            };
          }

          // Special case: "active request" conflicts that actually updated data
          const existingRequest = findExistingRequest(error.data);
          if (error.data && error.data.message && error.data.message.includes('already have an active') && existingRequest) {
            return {
              success: true,
              data: existingRequest,
              status: 200,
              warning: error.data.message,
              conflict: true
            };
          }
          
          const errorMessage = error.data?.message || "Data conflict detected. This record may have conflicting information.";
          throw new Error(errorMessage);
        } else if (error.status === 422) {
          const errorMessage = error.data?.message || "Validation failed. Please check your input data.";
          const e = new Error(errorMessage);
          e.status = error.status;
          e.data = error.data;
          throw e;
        } else if (error.status >= 500) {
          const errorMessage = "Server error. Please try again later.";
          throw new Error(errorMessage);
        } else {
          // For other errors, show generic message
          const errorMessage = error.data?.message || error.message || "An error occurred while updating data.";
          const e = new Error(errorMessage);
          e.status = error.status;
          e.data = error.data;
          throw e;
        }
      }
    }
    throw new Error("API call failed and no fallback allowed");
  };

  const apiDelete = async (endpoint, options = {}) => {
    let token = null;
    
    if (process.client) {
      token = localStorage.getItem("access_token") ||
              localStorage.getItem("auth-token") ||
              localStorage.getItem("token");
    }

    if (token) {
      // Use /api/proxy/ to avoid CORS issues
      const response = await $fetch(`/api/proxy${endpoint}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return {
        success: true,
        data: response.data || response,
        status: 200,
      };
    }
    throw new Error("API call failed and no fallback allowed");
  };

  // Expose circuit breaker status for debugging
  const getCircuitBreakerStatus = () => ({
    state: circuitBreaker.state,
    failures: circuitBreaker.failures,
    lastFailureTime: circuitBreaker.lastFailureTime,
    authFailureCount,
    lastAuthFailure,
    timeSinceLastFailure: circuitBreaker.lastFailureTime
      ? Date.now() - circuitBreaker.lastFailureTime
      : null
  });

  // Manual reset circuit breaker (for debugging)
  const manualResetCircuitBreaker = () => {
    resetCircuitBreaker();
    authFailureCount = 0;
    lastAuthFailure = 0;
  };

  // Expose to window for debugging in dev mode
  if (process.client && process.dev) {
    window.__updateDataApi = {
      getCircuitBreakerStatus,
      resetCircuitBreaker: manualResetCircuitBreaker
    };
  }

  return { apiGet, apiPost, apiPut, apiDelete, getCircuitBreakerStatus, resetCircuitBreaker: manualResetCircuitBreaker };
};
