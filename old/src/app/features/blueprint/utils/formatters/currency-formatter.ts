/**
 * currency-formatter.ts
 * 使用 Intl.NumberFormat 進行金額格式化
 */

export interface CurrencyFormatOptions {
  locale?: string;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
}

export function formatCurrency(amount: number, options: CurrencyFormatOptions = {}): string {
  const { locale = 'zh-TW', currency = 'TWD', minimumFractionDigits = 0, maximumFractionDigits = 2, useGrouping = true } = options;
  const fmt = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping
  });
  return fmt.format(amount);
}

export function formatCurrencyPlain(amount: number, locale = 'zh-TW', minimumFractionDigits = 0, maximumFractionDigits = 2): string {
  const fmt = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits,
    maximumFractionDigits
  });
  return fmt.format(amount);
}

export default {
  formatCurrency,
  formatCurrencyPlain
};
