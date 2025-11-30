/**
 * Excel Export Utils
 *
 * Excel/spreadsheet generation utilities
 * For blueprint data export to Excel format
 *
 * @module features/blueprint/utils/export/excel.utils
 */

/**
 * Excel export configuration interface
 */
export interface ExcelExportConfig {
  sheetName: string;
  includeHeaders: boolean;
  autoWidth: boolean;
  dateFormat: string;
  numberFormat: string;
}

/**
 * Excel column definition interface
 */
export interface ExcelColumnDef {
  header: string;
  key: string;
  width?: number;
  type?: 'string' | 'number' | 'date' | 'boolean';
  format?: string;
}

/**
 * Excel export result interface
 */
export interface ExcelExportResult {
  success: boolean;
  blob?: Blob;
  fileName?: string;
  error?: string;
  rowCount?: number;
}

/**
 * Default Excel export configuration
 */
export const DEFAULT_EXCEL_CONFIG: ExcelExportConfig = {
  sheetName: 'Sheet1',
  includeHeaders: true,
  autoWidth: true,
  dateFormat: 'YYYY-MM-DD',
  numberFormat: '#,##0.00'
};

/**
 * Generate Excel file name
 *
 * @param baseName - Base file name
 * @param timestamp - Include timestamp
 * @returns Generated file name
 */
export function generateExcelFileName(baseName: string, timestamp = true): string {
  const sanitizedName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5-_]/g, '_');

  if (timestamp) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10);
    return `${sanitizedName}_${dateStr}.xlsx`;
  }

  return `${sanitizedName}.xlsx`;
}

/**
 * Sanitize sheet name for Excel
 *
 * @param name - Sheet name to sanitize
 * @returns Sanitized sheet name
 */
export function sanitizeSheetName(name: string): string {
  // Excel sheet name restrictions:
  // - Max 31 characters
  // - Cannot contain: \ / * ? : [ ]
  // - Cannot be blank
  let sanitized = name.replace(/[\\/*?:[\]]/g, '_').trim();

  if (sanitized.length > 31) {
    sanitized = sanitized.substring(0, 31);
  }

  if (!sanitized) {
    sanitized = 'Sheet1';
  }

  return sanitized;
}

/**
 * Calculate column width based on content
 *
 * @param values - Column values
 * @param header - Column header
 * @param minWidth - Minimum width
 * @param maxWidth - Maximum width
 * @returns Calculated width
 */
export function calculateColumnWidth(values: unknown[], header: string, minWidth = 10, maxWidth = 50): number {
  let maxLength = header.length;

  for (const value of values) {
    if (value !== null && value !== undefined) {
      const strValue = String(value);
      maxLength = Math.max(maxLength, strValue.length);
    }
  }

  // Add some padding
  const width = maxLength + 2;

  return Math.max(minWidth, Math.min(maxWidth, width));
}

/**
 * Format date value for Excel
 *
 * @param date - Date to format
 * @param format - Date format string
 * @returns Formatted date string
 */
export function formatExcelDate(date: Date | string | null | undefined, format: string = DEFAULT_EXCEL_CONFIG.dateFormat): string {
  if (!date) {
    return '';
  }

  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    return '';
  }

  // Simple format implementation
  return format
    .replace('YYYY', d.getFullYear().toString())
    .replace('MM', (d.getMonth() + 1).toString().padStart(2, '0'))
    .replace('DD', d.getDate().toString().padStart(2, '0'))
    .replace('HH', d.getHours().toString().padStart(2, '0'))
    .replace('mm', d.getMinutes().toString().padStart(2, '0'))
    .replace('ss', d.getSeconds().toString().padStart(2, '0'));
}

/**
 * Convert data array to CSV string
 *
 * @param data - Data array
 * @param columns - Column definitions
 * @param includeHeaders - Include header row
 * @returns CSV string
 */
export function convertToCSV(data: Array<Record<string, unknown>>, columns: ExcelColumnDef[], includeHeaders = true): string {
  const rows: string[] = [];

  // Add header row
  if (includeHeaders) {
    const headerRow = columns.map(col => escapeCSVValue(col.header));
    rows.push(headerRow.join(','));
  }

  // Add data rows
  for (const item of data) {
    const row = columns.map(col => {
      const value = item[col.key];
      return escapeCSVValue(formatCellValue(value, col.type));
    });
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

/**
 * Escape CSV value
 *
 * @param value - Value to escape
 * @returns Escaped value
 */
export function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format cell value based on type
 *
 * @param value - Value to format
 * @param type - Value type
 * @returns Formatted string
 */
export function formatCellValue(value: unknown, type?: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  switch (type) {
    case 'date':
      return formatExcelDate(value as Date | string);
    case 'boolean':
      return value ? '是' : '否';
    case 'number':
      return String(value);
    default:
      return String(value);
  }
}

/**
 * Placeholder for Excel generation
 * Actual implementation would use a library like xlsx or exceljs
 *
 * @param _data - Data to export
 * @param _columns - Column definitions
 * @param _config - Export configuration
 * @returns Export result
 */
export async function exportToExcel(
  _data: Array<Record<string, unknown>>,

  _columns: ExcelColumnDef[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _config: ExcelExportConfig = DEFAULT_EXCEL_CONFIG
): Promise<ExcelExportResult> {
  // TODO: Implement Excel generation using xlsx or exceljs
  console.warn('Excel export not yet implemented');

  return {
    success: false,
    error: 'Excel export not yet implemented. Please add xlsx or exceljs library.'
  };
}
