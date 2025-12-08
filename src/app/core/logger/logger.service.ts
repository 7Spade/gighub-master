import { Injectable, isDevMode } from '@angular/core';

/**
 * 日誌級別
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * 日誌配置介面
 */
export interface LoggerConfig {
  level: LogLevel;
  enableTimestamp: boolean;
  enableStackTrace: boolean;
}

/**
 * 統一日誌服務
 * 
 * 用途：
 * 1. 替代所有 console.log/error/warn/debug
 * 2. 根據環境自動調整日誌級別
 * 3. 生產環境可整合 Sentry, LogRocket 等
 * 4. 提供結構化日誌輸出
 * 
 * 使用範例：
 * ```typescript
 * constructor(private logger: LoggerService) {}
 * 
 * this.logger.debug('Debug info', { data: value });
 * this.logger.info('User logged in', { userId: user.id });
 * this.logger.warn('API slow response', { latency: 5000 });
 * this.logger.error('Failed to save', error);
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private config: LoggerConfig = {
    level: isDevMode() ? LogLevel.DEBUG : LogLevel.WARN,
    enableTimestamp: true,
    enableStackTrace: false
  };

  /**
   * 設定日誌配置
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Debug 級別日誌（僅開發環境）
   */
  debug(message: string, data?: any): void {
    if (this.config.level <= LogLevel.DEBUG) {
      this.log('DEBUG', message, data, console.log);
    }
  }

  /**
   * Info 級別日誌
   */
  info(message: string, data?: any): void {
    if (this.config.level <= LogLevel.INFO) {
      this.log('INFO', message, data, console.info);
    }
  }

  /**
   * Warning 級別日誌
   */
  warn(message: string, data?: any): void {
    if (this.config.level <= LogLevel.WARN) {
      this.log('WARN', message, data, console.warn);
    }
  }

  /**
   * Error 級別日誌
   */
  error(message: string, error?: any): void {
    if (this.config.level <= LogLevel.ERROR) {
      this.log('ERROR', message, error, console.error);
      
      // 生產環境可整合錯誤追蹤服務
      if (!isDevMode()) {
        this.reportToErrorTracking(message, error);
      }
    }
  }

  /**
   * 內部日誌輸出方法
   */
  private log(
    level: string,
    message: string,
    data: any,
    logFn: (...args: any[]) => void
  ): void {
    const timestamp = this.config.enableTimestamp 
      ? new Date().toISOString() 
      : '';
    
    const prefix = timestamp 
      ? `[${timestamp}] [${level}]` 
      : `[${level}]`;

    if (data !== undefined) {
      logFn(`${prefix} ${message}`, data);
    } else {
      logFn(`${prefix} ${message}`);
    }

    // 堆疊追蹤（僅在啟用時）
    if (this.config.enableStackTrace && level === 'ERROR') {
      logFn(new Error().stack);
    }
  }

  /**
   * 上報錯誤到追蹤服務（預留介面）
   */
  private reportToErrorTracking(message: string, error: any): void {
    // TODO: 整合 Sentry, LogRocket 等服務
    // 範例:
    // if (typeof Sentry !== 'undefined') {
    //   Sentry.captureException(error, {
    //     tags: { message }
    //   });
    // }
  }
}
