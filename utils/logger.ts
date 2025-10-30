/**
 * Enhanced Logger Utility for Production Debugging
 * Provides structured logging with timestamps, context, and better error formatting
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export interface LogContext {
  module?: string;
  action?: string;
  userId?: string;
  requestId?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

export interface ErrorDetails {
  message: string;
  code?: string;
  statusCode?: number;
  stack?: string;
  response?: {
    status?: number;
    body?: string | object;
    headers?: Record<string, string>;
  };
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  };
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';
  
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatContext(context?: LogContext): string {
    if (!context) return '';
    
    const parts = [];
    if (context.module) parts.push(`Module: ${context.module}`);
    if (context.action) parts.push(`Action: ${context.action}`);
    if (context.userId) parts.push(`User: ${context.userId}`);
    if (context.requestId) parts.push(`RequestID: ${context.requestId}`);
    if (context.url) parts.push(`URL: ${context.url}`);
    if (context.statusCode) parts.push(`Status: ${context.statusCode}`);
    if (context.duration) parts.push(`Duration: ${context.duration}ms`);
    
    return parts.length > 0 ? `[${parts.join(' | ')}]` : '';
  }

  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      // Mask sensitive data in strings
      return data
        .replace(/"password":\s*"[^"]*"/gi, '"password": "***"')
        .replace(/"token":\s*"[^"]*"/gi, '"token": "***"')
        .replace(/"authorization":\s*"[^"]*"/gi, '"authorization": "Bearer ***"')
        .replace(/Bearer\s+[^\s]+/gi, 'Bearer ***');
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      // Mask sensitive fields
      const sensitiveFields = ['password', 'token', 'access_token', 'refresh_token', 'authorization'];
      sensitiveFields.forEach(field => {
        if (field in sanitized) {
          sanitized[field] = '***';
        }
      });
      
      return sanitized;
    }
    
    return data;
  }

  private logBase(level: LogLevel, message: string, context?: LogContext, data?: any) {
    // Silent in production
    if (this.isProduction) return;

    const timestamp = this.formatTimestamp();
    const contextStr = this.formatContext(context);
    const emoji = this.getEmoji(level);

    const logMessage = `${emoji} [${timestamp}] ${contextStr} ${message}`;

    if (data !== undefined) {
      const sanitizedData = this.sanitizeData(data);
    } else {
    }
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR: return '❌';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.INFO: return '📋';
      case LogLevel.DEBUG: return '🔍';
      default: return '📄';
    }
  }

  info(message: string, context?: LogContext, data?: any) {
    this.logBase(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: LogContext, data?: any) {
    this.logBase(LogLevel.WARN, message, context, data);
  }

  debug(message: string, context?: LogContext, data?: any) {
    if (!this.isProduction) {
      this.logBase(LogLevel.DEBUG, message, context, data);
    }
  }

  error(message: string, error?: Error | ErrorDetails | any, context?: LogContext) {
    // Silent in production
    if (this.isProduction) return;

    const timestamp = this.formatTimestamp();
    const contextStr = this.formatContext(context);


    if (error) {
      if (error instanceof Error) {
        // Error instance handled
      } else if (typeof error === 'object') {
        const sanitizedError = this.sanitizeData(error);
      }
    }
  }

  // API specific logging methods
  apiRequest(method: string, url: string, context?: LogContext) {
    this.info(`API Request: ${method.toUpperCase()} ${url}`, {
      ...context,
      action: 'API_REQUEST',
      url
    });
  }

  apiResponse(method: string, url: string, statusCode: number, duration: number, context?: LogContext) {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `API Response: ${method.toUpperCase()} ${url} - ${statusCode}`;
    
    this.logBase(level, message, {
      ...context,
      action: 'API_RESPONSE',
      url,
      statusCode,
      duration
    });
  }

  apiError(method: string, url: string, error: ErrorDetails, context?: LogContext) {
    const errorMessage = `API Error: ${method.toUpperCase()} ${url}`;
    
    this.error(errorMessage, {
      ...error,
      request: {
        method: method.toUpperCase(),
        url,
        ...error.request
      }
    }, {
      ...context,
      action: 'API_ERROR',
      url,
      statusCode: error.statusCode || error.response?.status
    });
  }

  // Authentication specific logging
  authEvent(event: string, context?: LogContext, data?: any) {
    this.info(`Auth Event: ${event}`, {
      ...context,
      module: 'AUTH',
      action: event
    }, data);
  }

  authError(event: string, error: any, context?: LogContext) {
    this.error(`Auth Error: ${event}`, error, {
      ...context,
      module: 'AUTH',
      action: event
    });
  }

  // Token specific logging
  tokenEvent(event: string, context?: LogContext) {
    this.info(`Token Event: ${event}`, {
      ...context,
      module: 'TOKEN',
      action: event
    });
  }

  tokenError(event: string, error: any, context?: LogContext) {
    this.error(`Token Error: ${event}`, error, {
      ...context,
      module: 'TOKEN',
      action: event
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for backward compatibility
export const logInfo = (message: string, context?: LogContext, data?: any) => logger.info(message, context, data);
export const logWarn = (message: string, context?: LogContext, data?: any) => logger.warn(message, context, data);
export const logError = (message: string, error?: any, context?: LogContext) => logger.error(message, error, context);
export const logDebug = (message: string, context?: LogContext, data?: any) => logger.debug(message, context, data);