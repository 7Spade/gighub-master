// 基本日期計算工具
export type DateInput = Date | string | number;

function parseDate(input: DateInput): Date {
  if (input instanceof Date) return new Date(input.getTime());
  if (typeof input === 'number') return new Date(input);
  const s = String(input);
  // 處理 YYYY-MM-DD 避免被當成 UTC 解析
  const ymd = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;
  const m = s.match(ymd);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    const day = Number(m[3]);
    return new Date(year, month, day);
  }
  return new Date(s);
}

export function startOfDay(input: DateInput): Date {
  const d = parseDate(input);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function endOfDay(input: DateInput): Date {
  const s = startOfDay(input);
  return new Date(s.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function addDays(input: DateInput, days: number): Date {
  const d = startOfDay(input);
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

export function diffDays(start: DateInput, end: DateInput): number {
  const s = startOfDay(start).getTime();
  const e = startOfDay(end).getTime();
  return Math.round((e - s) / (24 * 60 * 60 * 1000));
}

export function isSameDay(a: DateInput, b: DateInput): boolean {
  const da = startOfDay(a);
  const db = startOfDay(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

export function toDate(input: DateInput): Date {
  return parseDate(input);
}

export default {
  parseDate,
  startOfDay,
  endOfDay,
  addDays,
  diffDays,
  isSameDay,
  toDate
};
