/**
 * duration-formatter.ts
 * 時間長度格式化工具（秒為單位）
 */

export interface DurationFormatOptions {
  includeSeconds?: boolean; // humanize 時是否顯示秒
  pad?: boolean; // 是否在 hh/mm/ss 使用 0 補齊
}

/**
 * 將秒數轉為 hh:mm:ss 或 mm:ss
 */
export function formatHMS(totalSeconds: number, pad = true): string {
  const sign = totalSeconds < 0 ? '-' : '';
  let s = Math.abs(Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  s = s % 3600;
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  const hh = pad ? String(hours).padStart(2, '0') : String(hours);
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  if (hours > 0) return `${sign}${hh}:${mm}:${ss}`;
  return `${sign}${mm}:${ss}`;
}

/**
 * 人性化時間，例如："2 小時 3 分鐘" 或 "3 分 5 秒"
 */
export function humanizeDuration(totalSeconds: number, options: DurationFormatOptions = {}): string {
  const { includeSeconds = true } = options;
  const sign = totalSeconds < 0 ? '-' : '';
  let s = Math.abs(Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  s %= 86400;
  const hours = Math.floor(s / 3600);
  s %= 3600;
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} 天`);
  if (hours > 0) parts.push(`${hours} 小時`);
  if (minutes > 0) parts.push(`${minutes} 分鐘`);
  if (includeSeconds && seconds > 0) parts.push(`${seconds} 秒`);
  if (parts.length === 0) return `${sign}0 秒`;
  return sign + parts.join(' ');
}

export default {
  formatHMS,
  humanizeDuration
};
