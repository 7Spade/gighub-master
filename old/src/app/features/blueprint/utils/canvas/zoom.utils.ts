/**
 * Zoom Utils
 *
 * Canvas zoom handling utilities
 * For blueprint canvas zoom operations
 *
 * @module features/blueprint/utils/canvas/zoom.utils
 */

import { Point2D, TransformMatrix, createIdentityMatrix, multiplyMatrices } from '../geometry/coordinate.utils';

/**
 * Zoom configuration interface
 */
export interface ZoomConfig {
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
  wheelZoomFactor: number;
}

/**
 * Default zoom configuration
 */
export const DEFAULT_ZOOM_CONFIG: ZoomConfig = {
  minZoom: 0.1,
  maxZoom: 5,
  zoomStep: 0.1,
  wheelZoomFactor: 0.001
};

/**
 * Get current zoom level from transform matrix
 *
 * @param transform - Current transform matrix
 * @returns Current zoom level
 */
export function getZoomLevel(transform: TransformMatrix): number {
  return Math.sqrt(transform.a * transform.a + transform.b * transform.b);
}

/**
 * Clamp zoom level within bounds
 *
 * @param zoom - Zoom level to clamp
 * @param config - Zoom configuration
 * @returns Clamped zoom level
 */
export function clampZoom(zoom: number, config: ZoomConfig = DEFAULT_ZOOM_CONFIG): number {
  return Math.max(config.minZoom, Math.min(config.maxZoom, zoom));
}

/**
 * Calculate zoom transform for zooming at a specific point
 *
 * @param currentTransform - Current transform matrix
 * @param zoomDelta - Zoom delta (positive = zoom in, negative = zoom out)
 * @param zoomCenter - Point to zoom towards
 * @param config - Zoom configuration
 * @returns New transform matrix
 */
export function calculateZoomTransform(
  currentTransform: TransformMatrix,
  zoomDelta: number,
  zoomCenter: Point2D,
  config: ZoomConfig = DEFAULT_ZOOM_CONFIG
): TransformMatrix {
  const currentZoom = getZoomLevel(currentTransform);
  const newZoom = clampZoom(currentZoom + zoomDelta, config);
  const scale = newZoom / currentZoom;

  if (scale === 1) {
    return currentTransform;
  }

  // Create scale matrix centered at zoom point
  const scaleMatrix: TransformMatrix = {
    a: scale,
    b: 0,
    c: 0,
    d: scale,
    e: zoomCenter.x * (1 - scale),
    f: zoomCenter.y * (1 - scale)
  };

  return multiplyMatrices(scaleMatrix, currentTransform);
}

/**
 * Calculate zoom transform from wheel event
 *
 * @param currentTransform - Current transform matrix
 * @param wheelDelta - Wheel delta from event
 * @param mousePosition - Mouse position
 * @param config - Zoom configuration
 * @returns New transform matrix
 */
export function calculateWheelZoom(
  currentTransform: TransformMatrix,
  wheelDelta: number,
  mousePosition: Point2D,
  config: ZoomConfig = DEFAULT_ZOOM_CONFIG
): TransformMatrix {
  const zoomDelta = -wheelDelta * config.wheelZoomFactor * getZoomLevel(currentTransform);
  return calculateZoomTransform(currentTransform, zoomDelta, mousePosition, config);
}

/**
 * Zoom to fit content within viewport
 *
 * @param contentBounds - Content bounding rectangle
 * @param viewportWidth - Viewport width
 * @param viewportHeight - Viewport height
 * @param padding - Padding around content
 * @returns Transform matrix to fit content
 */
export function zoomToFit(
  contentBounds: { x: number; y: number; width: number; height: number },
  viewportWidth: number,
  viewportHeight: number,
  padding = 20
): TransformMatrix {
  const availableWidth = viewportWidth - padding * 2;
  const availableHeight = viewportHeight - padding * 2;

  const scaleX = availableWidth / contentBounds.width;
  const scaleY = availableHeight / contentBounds.height;
  const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in past 100%

  const offsetX = (viewportWidth - contentBounds.width * scale) / 2 - contentBounds.x * scale;
  const offsetY = (viewportHeight - contentBounds.height * scale) / 2 - contentBounds.y * scale;

  return {
    a: scale,
    b: 0,
    c: 0,
    d: scale,
    e: offsetX,
    f: offsetY
  };
}

/**
 * Reset zoom to 100%
 *
 * @returns Identity transform matrix
 */
export function resetZoom(): TransformMatrix {
  return createIdentityMatrix();
}
