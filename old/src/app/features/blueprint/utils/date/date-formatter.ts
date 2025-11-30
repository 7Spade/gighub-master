import { DateInput, toDate } from './date-calculator';

export function formatYYYYMMDD(input: DateInput): string {
  const d = toDate(input);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatLocale(input: DateInput, locale = 'zh-TW', options?: Intl.DateTimeFormatOptions): string {
  const d = toDate(input);
  const fmt = new Intl.DateTimeFormat(locale, options ?? { year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(d);
}

export function formatDateTime(input: DateInput, locale = 'zh-TW'): string {
  const d = toDate(input);
  return formatLocale(d, locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export default {
  formatYYYYMMDD,
  formatLocale,
  formatDateTime
};
