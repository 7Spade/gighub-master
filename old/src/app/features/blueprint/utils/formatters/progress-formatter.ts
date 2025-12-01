/**
 * progress-formatter.ts
 * 提供進度/百分比的格式化工具
 */

export type ProgressInput = { value: number; total?: number } | number;

/**
 * 將數值轉為百分比字串。
 * - 當傳入第二個參數 `total` 時會以 value/total 計算。
 * - 若沒有 total，則假設傳入的是 0..1 的小數。
 */
export function formatPercent(input: ProgressInput, digits = 0): string {
  let percent: number;
  if (typeof input === 'number') {
    percent = input * 100;
  } else {
    const { value, total } = input;
    percent = total !== undefined && total !== 0 ? (value / total) * 100 : value * 100;
  }
  const fixed = Number(percent.toFixed(digits));
  return `${fixed}%`;
}

/**
 * 回傳分數字串，例如 "3 / 10"。若沒有 total，則顯示 value。
 */
export function formatFraction(value: number, total?: number): string {
  if (total === undefined) return `${value}`;
  return `${value} / ${total}`;
}

/**
 * 產生簡單文字型進度條（Console/UI 可用）
 * 例如：`[#####-----] 50%`。
 */
export function progressBar(value: number, total = 1, width = 20, digits = 0): string {
  const ratio = total === 0 ? 0 : Math.max(0, Math.min(1, value / total));
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  const bar = `[${'#'.repeat(filled)}${'-'.repeat(empty)}]`;
  const percent = formatPercent(ratio, digits);
  return `${bar} ${percent}`;
}

export default {
  formatPercent,
  formatFraction,
  progressBar
};
