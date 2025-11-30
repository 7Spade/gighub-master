/**
 * Image Export Utils
 *
 * Image export utilities
 * For blueprint canvas export to image formats
 *
 * @module features/blueprint/utils/export/image.utils
 */

/**
 * Image export format type
 */
export type ImageFormat = 'png' | 'jpeg' | 'webp' | 'svg';

/**
 * Image export configuration interface
 */
export interface ImageExportConfig {
  format: ImageFormat;
  quality: number; // 0-1 for jpeg/webp
  scale: number; // Multiplier for resolution
  backgroundColor?: string;
  includeWatermark?: boolean;
  watermarkText?: string;
}

/**
 * Image export result interface
 */
export interface ImageExportResult {
  success: boolean;
  blob?: Blob;
  dataUrl?: string;
  fileName?: string;
  error?: string;
  dimensions?: { width: number; height: number };
}

/**
 * Default image export configuration
 */
export const DEFAULT_IMAGE_CONFIG: ImageExportConfig = {
  format: 'png',
  quality: 0.92,
  scale: 2, // 2x for retina displays
  backgroundColor: '#ffffff',
  includeWatermark: false
};

/**
 * MIME types for image formats
 */
export const IMAGE_MIME_TYPES: Record<ImageFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml'
};

/**
 * File extensions for image formats
 */
export const IMAGE_EXTENSIONS: Record<ImageFormat, string> = {
  png: '.png',
  jpeg: '.jpg',
  webp: '.webp',
  svg: '.svg'
};

/**
 * Generate image file name
 *
 * @param baseName - Base file name
 * @param format - Image format
 * @param timestamp - Include timestamp
 * @returns Generated file name
 */
export function generateImageFileName(baseName: string, format: ImageFormat = 'png', timestamp = true): string {
  const sanitizedName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5-_]/g, '_');
  const extension = IMAGE_EXTENSIONS[format];

  if (timestamp) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10);
    return `${sanitizedName}_${dateStr}${extension}`;
  }

  return `${sanitizedName}${extension}`;
}

/**
 * Get MIME type for image format
 *
 * @param format - Image format
 * @returns MIME type
 */
export function getMimeType(format: ImageFormat): string {
  return IMAGE_MIME_TYPES[format];
}

/**
 * Convert canvas to data URL
 *
 * @param canvas - Canvas element
 * @param format - Image format
 * @param quality - Quality (0-1)
 * @returns Data URL
 */
export function canvasToDataUrl(canvas: HTMLCanvasElement, format: ImageFormat = 'png', quality = 0.92): string {
  const mimeType = getMimeType(format);
  return canvas.toDataURL(mimeType, quality);
}

/**
 * Convert canvas to Blob
 *
 * @param canvas - Canvas element
 * @param format - Image format
 * @param quality - Quality (0-1)
 * @returns Promise resolving to Blob
 */
export function canvasToBlob(canvas: HTMLCanvasElement, format: ImageFormat = 'png', quality = 0.92): Promise<Blob | null> {
  return new Promise(resolve => {
    const mimeType = getMimeType(format);
    canvas.toBlob(resolve, mimeType, quality);
  });
}

/**
 * Create a canvas with background color
 *
 * @param width - Canvas width
 * @param height - Canvas height
 * @param backgroundColor - Background color
 * @returns Canvas element
 */
export function createCanvasWithBackground(width: number, height: number, backgroundColor = '#ffffff'): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  return canvas;
}

/**
 * Add watermark to canvas
 *
 * @param canvas - Canvas element
 * @param text - Watermark text
 * @param options - Watermark options
 */
export function addWatermark(
  canvas: HTMLCanvasElement,
  text: string,
  options: { fontSize?: number; color?: string; opacity?: number; position?: 'bottomRight' | 'bottomLeft' | 'topRight' | 'topLeft' } = {}
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { fontSize = 12, color = '#000000', opacity = 0.5, position = 'bottomRight' } = options;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = color;

  const textMetrics = ctx.measureText(text);
  const padding = 10;

  let x: number, y: number;

  switch (position) {
    case 'bottomRight':
      x = canvas.width - textMetrics.width - padding;
      y = canvas.height - padding;
      break;
    case 'bottomLeft':
      x = padding;
      y = canvas.height - padding;
      break;
    case 'topRight':
      x = canvas.width - textMetrics.width - padding;
      y = fontSize + padding;
      break;
    case 'topLeft':
      x = padding;
      y = fontSize + padding;
      break;
  }

  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * Download blob as file
 *
 * @param blob - Blob to download
 * @param fileName - File name
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export canvas element to image
 *
 * @param canvas - Canvas element
 * @param config - Export configuration
 * @returns Export result
 */
export async function exportCanvasToImage(
  canvas: HTMLCanvasElement,
  config: ImageExportConfig = DEFAULT_IMAGE_CONFIG
): Promise<ImageExportResult> {
  try {
    // Create scaled canvas if needed
    let exportCanvas = canvas;

    if (config.scale !== 1) {
      exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width * config.scale;
      exportCanvas.height = canvas.height * config.scale;

      const ctx = exportCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Fill background
      if (config.backgroundColor) {
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      }

      // Scale and draw original canvas
      ctx.scale(config.scale, config.scale);
      ctx.drawImage(canvas, 0, 0);
    }

    // Add watermark if configured
    if (config.includeWatermark && config.watermarkText) {
      addWatermark(exportCanvas, config.watermarkText);
    }

    // Export to blob
    const blob = await canvasToBlob(exportCanvas, config.format, config.quality);

    if (!blob) {
      throw new Error('Failed to create image blob');
    }

    const dataUrl = canvasToDataUrl(exportCanvas, config.format, config.quality);

    return {
      success: true,
      blob,
      dataUrl,
      dimensions: { width: exportCanvas.width, height: exportCanvas.height }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export image'
    };
  }
}
