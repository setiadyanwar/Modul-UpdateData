import { ref, readonly } from 'vue';

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// Global log level (can be set via environment variable)
const currentLogLevel = ref(process.env.NODE_ENV === 'production' ? LOG_LEVELS.NONE : LOG_LEVELS.DEBUG);

// Log storage for debugging
const logHistory = ref([]);
const maxLogHistory = 100;

export const useLogger = () => {
  const sanitizeData = (data) => {
    if (!data) return data;
    
    // Don't log sensitive information
    const sensitiveKeys = ['token', 'password', 'secret', 'key', 'auth', 'authorization'];
    const sensitiveValues = ['Bearer', 'Basic'];
    
    if (typeof data === 'object') {
      const sanitized = { ...data };
      Object.keys(sanitized).forEach(key => {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
          sanitized[key] = '[REDACTED]';
        }
        if (typeof sanitized[key] === 'string' && sensitiveValues.some(sv => sanitized[key].includes(sv))) {
          sanitized[key] = '[REDACTED]';
        }
      });
      return sanitized;
    }
    
    if (typeof data === 'string' && sensitiveValues.some(sv => data.includes(sv))) {
      return '[REDACTED]';
    }
    
    return data;
  };

  const shouldLog = (level) => {
    return level >= currentLogLevel.value;
  };

  const addToHistory = (level, message, data = null) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: Object.keys(LOG_LEVELS)[level],
      message,
      data
    };
    
    logHistory.value.push(logEntry);
    
    // Keep only the last maxLogHistory entries
    if (logHistory.value.length > maxLogHistory) {
      logHistory.value.shift();
    }
  };

  const debug = (message, data = null) => {
    if (shouldLog(LOG_LEVELS.DEBUG)) {
      // Security: Don't log sensitive data
      const sanitizedData = sanitizeData(data);
      addToHistory(LOG_LEVELS.DEBUG, message, sanitizedData);
    }
  };

  const info = (message, data = null) => {
    if (shouldLog(LOG_LEVELS.INFO)) {
      addToHistory(LOG_LEVELS.INFO, message, data);
    }
  };

  const warn = (message, data = null) => {
    if (shouldLog(LOG_LEVELS.WARN)) {
      addToHistory(LOG_LEVELS.WARN, message, data);
    }
  };

  const error = (message, data = null) => {
    if (shouldLog(LOG_LEVELS.ERROR)) {
      addToHistory(LOG_LEVELS.ERROR, message, data);
    }
  };

  const setLogLevel = (level) => {
    if (LOG_LEVELS[level] !== undefined) {
      currentLogLevel.value = LOG_LEVELS[level];
      info(`Log level set to: ${level}`);
    }
  };

  const getLogHistory = () => {
    return logHistory.value;
  };

  const clearLogHistory = () => {
    logHistory.value = [];
  };

  return {
    debug,
    info,
    warn,
    error,
    setLogLevel,
    getLogHistory,
    clearLogHistory,
    currentLogLevel: readonly(currentLogLevel)
  };
};
