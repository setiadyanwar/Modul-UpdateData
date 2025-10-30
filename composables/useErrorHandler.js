import { ref, readonly } from 'vue';
import { useLogger } from './useLogger';
import { useToast } from './useToast';

const { error: logErrorInternal, warn, info } = useLogger();
const { error: showErrorToast, warning: showWarningToast } = useToast();

// Error types and their standard messages
const ERROR_TYPES = {
  NETWORK: {
    code: 'NETWORK_ERROR',
    title: 'Connection Error',
    message: 'Cannot reach the server. Please check your internet connection and try again.',
    retryable: true,
    maxRetries: 3
  },
  AUTHENTICATION: {
    code: 'AUTH_ERROR',
    title: 'Authentication Error',
    message: 'Your session has expired. Please log in again.',
    retryable: false,
    action: 'redirect_to_login'
  },
  VALIDATION: {
    code: 'VALIDATION_ERROR',
    title: 'Validation Error',
    message: 'Please check your input and try again.',
    retryable: false
  },
  SERVER: {
    code: 'SERVER_ERROR',
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    retryable: true,
    maxRetries: 2
  },
  RATE_LIMIT: {
    code: 'RATE_LIMIT_ERROR',
    title: 'Too Many Requests',
    message: 'You have made too many requests. Please wait a moment and try again.',
    retryable: true,
    maxRetries: 1,
    retryDelay: 5000
  },
  UNKNOWN: {
    code: 'UNKNOWN_ERROR',
    title: 'Unexpected Error',
    message: 'An unexpected error occurred. Please try again.',
    retryable: true,
    maxRetries: 1
  }
};

// Global error state
const errorState = ref({
  currentError: null,
  retryCount: 0,
  isRetrying: false,
  errorHistory: []
});

// Retry queue
const retryQueue = ref([]);

export const useErrorHandler = () => {
  const classifyError = (error) => {
    const status = error?.status || error?.statusCode || 500;
    const message = error?.message || error?.data?.message || '';

    // Network errors
    if (status === 0 || status === 404 || message.includes('network') || message.includes('connection')) {
      return ERROR_TYPES.NETWORK;
    }

    // Authentication errors
    if (status === 401 || status === 403 || message.includes('unauthorized') || message.includes('forbidden')) {
      return ERROR_TYPES.AUTHENTICATION;
    }

    // Rate limiting
    if (status === 429 || message.includes('rate limit') || message.includes('too many requests')) {
      return ERROR_TYPES.RATE_LIMIT;
    }

    // Server errors
    if (status >= 500) {
      return ERROR_TYPES.SERVER;
    }

    // Validation errors
    if (status === 400 || status === 422 || message.includes('validation')) {
      return ERROR_TYPES.VALIDATION;
    }

    return ERROR_TYPES.UNKNOWN;
  };

  const handleError = async (error, context = '') => {
    const errorType = classifyError(error);
    const errorInfo = {
      type: errorType,
      originalError: error,
      context,
      timestamp: new Date().toISOString(),
      retryCount: errorState.value.retryCount
    };

    // Log error
    logErrorInternal(`Error in ${context}`, errorInfo);

    // Add to error history
    errorState.value.errorHistory.push(errorInfo);
    if (errorState.value.errorHistory.length > 50) {
      errorState.value.errorHistory.shift();
    }

    // Set current error
    errorState.value.currentError = errorInfo;

    // Handle retryable errors
    if (errorType.retryable && errorState.value.retryCount < errorType.maxRetries) {
      return await retryOperation(error, context, errorType);
    }

    // Show error toast
    showErrorToast(errorType.message, {
      title: errorType.title,
      duration: 6000
    });

    // Handle special actions
    if (errorType.action === 'redirect_to_login') {
      await navigateTo('/login');
    }

    return { handled: true, retryable: false };
  };

  const retryOperation = async (error, context, errorType) => {
    errorState.value.isRetrying = true;
    errorState.value.retryCount++;

    const retryDelay = errorType.retryDelay || 1000 * errorState.value.retryCount;

    info(`Retrying operation in ${context} (attempt ${errorState.value.retryCount}/${errorType.maxRetries})`);

    // Add to retry queue
    const retryPromise = new Promise((resolve) => {
      setTimeout(async () => {
        try {
          // Re-execute the original operation
          const result = await retryQueue.value.find(item => item.context === context)?.operation();
          errorState.value.isRetrying = false;
          errorState.value.retryCount = 0;
          resolve({ success: true, result });
        } catch (retryError) {
          errorState.value.isRetrying = false;
          resolve({ success: false, error: retryError });
        }
      }, retryDelay);
    });

    return retryPromise;
  };

  const registerRetryableOperation = (context, operation) => {
    retryQueue.value.push({ context, operation });
    
    // Clean up old entries
    if (retryQueue.value.length > 20) {
      retryQueue.value.shift();
    }
  };

  const clearError = () => {
    errorState.value.currentError = null;
    errorState.value.retryCount = 0;
    errorState.value.isRetrying = false;
  };

  const getErrorStats = () => {
    const stats = {
      totalErrors: errorState.value.errorHistory.length,
      byType: {},
      recentErrors: errorState.value.errorHistory.slice(-10)
    };

    errorState.value.errorHistory.forEach(error => {
      const type = error.type.code;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    return stats;
  };

  const createCustomError = (type, customMessage = null, customTitle = null) => {
    const baseError = ERROR_TYPES[type] || ERROR_TYPES.UNKNOWN;
    return {
      ...baseError,
      message: customMessage || baseError.message,
      title: customTitle || baseError.title
    };
  };

  const withErrorHandling = (operation, context = '') => {
    return async (...args) => {
      try {
        const result = await operation(...args);
        clearError();
        return result;
      } catch (error) {
        const handled = await handleError(error, context);
        
        if (handled.retryable) {
          registerRetryableOperation(context, () => operation(...args));
          return handled;
        }
        
        throw error;
      }
    };
  };

  return {
    handleError,
    clearError,
    getErrorStats,
    createCustomError,
    withErrorHandling,
    registerRetryableOperation,
    errorState: readonly(errorState),
    ERROR_TYPES
  };
};
