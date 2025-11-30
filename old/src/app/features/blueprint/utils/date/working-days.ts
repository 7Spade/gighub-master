import dateCalc, { DateInput, addDays, isSameDay, toDate } from './date-calculator';

export type Holiday = DateInput;

export function isWeekend(date: DateInput, weekendDays: number[] = [0, 6]): boolean {
  const d = toDate(date);
  return weekendDays.includes(d.getDay());
}

export function isHoliday(date: DateInput, holidays: Holiday[] = []): boolean {
  if (!holidays || holidays.length === 0) return false;
  return holidays.some(h => isSameDay(h, date));
}

export function isWorkingDay(date: DateInput, holidays: Holiday[] = [], weekendDays: number[] = [0, 6]): boolean {
  return !isWeekend(date, weekendDays) && !isHoliday(date, holidays);
}

// 計算 inclusive 的工作日數量，start 到 end（包含兩端）
export function countWorkingDaysBetween(
  start: DateInput,
  end: DateInput,
  holidays: Holiday[] = [],
  weekendDays: number[] = [0, 6]
): number {
  const s = toDate(start);
  const e = toDate(end);
  const dir = s.getTime() <= e.getTime() ? 1 : -1;
  let cur = dateCalc.startOfDay(s);
  let count = 0;
  while (true) {
    const done = dir === 1 ? cur.getTime() > e.getTime() : cur.getTime() < e.getTime();
    if (done) break;
    if (isWorkingDay(cur, holidays, weekendDays)) count += 1;
    cur = addDays(cur, dir);
  }
  return count;
}

// 從 start 加上 N 個工作日並回傳結果（days 可為正或負）
export function addWorkingDays(start: DateInput, days: number, holidays: Holiday[] = [], weekendDays: number[] = [0, 6]): Date {
  if (days === 0) return dateCalc.startOfDay(start);
  const dir = days > 0 ? 1 : -1;
  let remaining = Math.abs(days);
  let cur = dateCalc.startOfDay(start);
  while (remaining > 0) {
    cur = addDays(cur, dir);
    if (isWorkingDay(cur, holidays, weekendDays)) remaining -= 1;
  }
  return cur;
}

export default {
  isWeekend,
  isHoliday,
  isWorkingDay,
  countWorkingDaysBetween,
  addWorkingDays
};
