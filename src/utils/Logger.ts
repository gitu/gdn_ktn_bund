/**
 * Logging Utility
 * 
 * Provides structured logging with environment-aware output.
 * In production, only errors are logged to console, while debug information
 * is suppressed to avoid cluttering browser console.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  component?: string
  operation?: string
  entityId?: string
  accountCode?: string
  [key: string]: unknown
}

export class Logger {
  private static readonly isDevelopment = import.meta.env.DEV
  private static readonly logLevel = Logger.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR

  /**
   * Log debug information (only in development)
   */
  static debug(message: string, context?: LogContext): void {
    if (Logger.logLevel <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, context || '')
    }
  }

  /**
   * Log general information (only in development)
   */
  static info(message: string, context?: LogContext): void {
    if (Logger.logLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, context || '')
    }
  }

  /**
   * Log warnings (only in development)
   */
  static warn(message: string, context?: LogContext): void {
    if (Logger.logLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, context || '')
    }
  }

  /**
   * Log errors (always logged)
   */
  static error(message: string, error?: Error | unknown, context?: LogContext): void {
    console.error(`[ERROR] ${message}`, error || '', context || '')
    
    // In a real application, you might want to send errors to a monitoring service
    // this.sendToMonitoringService(message, error, context)
  }

  /**
   * Log optimization-specific debug information
   */
  static optimization(operation: string, data: unknown, context?: Omit<LogContext, 'operation'>): void {
    Logger.debug(`Optimization: ${operation}`, { 
      operation, 
      data,
      ...context 
    })
  }

  /**
   * Log data loading operations
   */
  static dataLoad(operation: string, details: unknown, context?: Omit<LogContext, 'operation'>): void {
    Logger.info(`Data Load: ${operation}`, { 
      operation, 
      details,
      ...context 
    })
  }

  /**
   * Log performance measurements
   */
  static performance(operation: string, duration: number, context?: LogContext): void {
    Logger.debug(`Performance: ${operation} took ${duration}ms`, {
      operation,
      duration,
      ...context
    })
  }

  // Future: Method to send errors to monitoring service
  // private static sendToMonitoringService(message: string, error: unknown, context?: LogContext): void {
  //   // Implementation would depend on chosen monitoring service (Sentry, LogRocket, etc.)
  // }
}