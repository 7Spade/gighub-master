/**
 * Relative Time Pipe
 *
 * Transform dates to relative time strings
 * For showing "2 hours ago", "yesterday", etc.
 *
 * @module features/blueprint/pipes/relative-time.pipe
 */

import { Pipe, PipeTransform } from '@angular/core';

/**
 * Time unit configuration
 */
interface TimeUnit {
  max: number;
  divisor: number;
  past: string;
  future: string;
}

/**
 * Pipe to transform dates to relative time strings
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * {{ task.createdAt | relativeTime }}
 *
 * <!-- With custom reference date -->
 * {{ task.dueDate | relativeTime:today }}
 *
 * Output examples:
 * - "剛剛"
 * - "5 分鐘前"
 * - "2 小時前"
 * - "昨天"
 * - "3 天前"
 * - "1 週前"
 * - "2 個月前"
 * - "1 年前"
 * ```
 */
@Pipe({
  name: 'relativeTime',
  standalone: true,
  pure: true
})
export class RelativeTimePipe implements PipeTransform {
  private readonly timeUnits: TimeUnit[] = [
    { max: 60, divisor: 1, past: '秒前', future: '秒後' },
    { max: 3600, divisor: 60, past: '分鐘前', future: '分鐘後' },
    { max: 86400, divisor: 3600, past: '小時前', future: '小時後' },
    { max: 604800, divisor: 86400, past: '天前', future: '天後' },
    { max: 2592000, divisor: 604800, past: '週前', future: '週後' },
    { max: 31536000, divisor: 2592000, past: '個月前', future: '個月後' },
    { max: Infinity, divisor: 31536000, past: '年前', future: '年後' }
  ];

  transform(date: Date | string | number | undefined | null, referenceDate?: Date | string | number): string {
    if (!date) {
      return '';
    }

    const targetDate = this.toDate(date);
    const refDate = referenceDate ? this.toDate(referenceDate) : new Date();

    if (!targetDate || isNaN(targetDate.getTime())) {
      return '';
    }

    const diffInSeconds = Math.floor((refDate.getTime() - targetDate.getTime()) / 1000);
    const absDiff = Math.abs(diffInSeconds);
    const isPast = diffInSeconds > 0;

    // Just now (within 10 seconds)
    if (absDiff < 10) {
      return '剛剛';
    }

    // Yesterday/Tomorrow special cases
    const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const refDay = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
    const dayDiff = Math.floor((refDay.getTime() - targetDay.getTime()) / 86400000);

    if (dayDiff === 1) {
      return '昨天';
    }
    if (dayDiff === -1) {
      return '明天';
    }

    // Find appropriate unit
    for (const unit of this.timeUnits) {
      if (absDiff < unit.max) {
        const value = Math.floor(absDiff / unit.divisor);
        const suffix = isPast ? unit.past : unit.future;

        // Handle singular/special cases
        if (value === 1 && unit.divisor >= 86400) {
          // For days and larger, we already handled yesterday/tomorrow
          return `${value} ${suffix}`;
        }

        return `${value} ${suffix}`;
      }
    }

    return '';
  }

  private toDate(value: Date | string | number): Date {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'number') {
      return new Date(value);
    }

    return new Date(value);
  }
}

/**
 * Helper function for use outside pipes
 */
export function formatRelativeTime(date: Date | string | number | undefined | null, referenceDate?: Date): string {
  const pipe = new RelativeTimePipe();
  return pipe.transform(date, referenceDate);
}
