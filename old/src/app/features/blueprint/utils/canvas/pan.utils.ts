/**
 * Pan Utils
 *
 * Canvas pan/drag handling utilities
 * For blueprint canvas pan operations
 *
 * @module features/blueprint/utils/canvas/pan.utils
 */

import { Point2D, TransformMatrix } from '../geometry/coordinate.utils';

/**
 * Pan state interface
 */
export interface PanState {
  isPanning: boolean;
  startPoint: Point2D | null;
  lastPoint: Point2D | null;
}

/**
 * Pan configuration interface
 */
export interface PanConfig {
  enableInertia: boolean;
  inertiaFriction: number;
  boundaryPadding: number;
}

/**
 * Default pan configuration
 */
export const DEFAULT_PAN_CONFIG: PanConfig = {
  enableInertia: true,
  inertiaFriction: 0.95,
  boundaryPadding: 100
};

/**
 * Create initial pan state
 *
 * @returns Initial pan state
 */
export function createPanState(): PanState {
  return {
    isPanning: false,
    startPoint: null,
    lastPoint: null
  };
}

/**
 * Start panning operation
 *
 * @param state - Current pan state
 * @param startPoint - Starting point
 * @returns Updated pan state
 */
export function startPan(state: PanState, startPoint: Point2D): PanState {
  return {
    isPanning: true,
    startPoint,
    lastPoint: startPoint
  };
}

/**
 * Update pan with new point
 *
 * @param state - Current pan state
 * @param currentPoint - Current point
 * @param transform - Current transform matrix
 * @returns Object with updated state and transform
 */
export function updatePan(
  state: PanState,
  currentPoint: Point2D,
  transform: TransformMatrix
): { state: PanState; transform: TransformMatrix } {
  if (!state.isPanning || !state.lastPoint) {
    return { state, transform };
  }

  const deltaX = currentPoint.x - state.lastPoint.x;
  const deltaY = currentPoint.y - state.lastPoint.y;

  const newTransform: TransformMatrix = {
    ...transform,
    e: transform.e + deltaX,
    f: transform.f + deltaY
  };

  return {
    state: { ...state, lastPoint: currentPoint },
    transform: newTransform
  };
}

/**
 * End panning operation
 *
 * @param _state - Current pan state (unused, returns fresh state)
 * @returns Updated pan state
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function endPan(_state: PanState): PanState {
  return {
    isPanning: false,
    startPoint: null,
    lastPoint: null
  };
}

/**
 * Calculate pan delta between two points
 *
 * @param from - Starting point
 * @param to - Ending point
 * @returns Delta point
 */
export function getPanDelta(from: Point2D, to: Point2D): Point2D {
  return {
    x: to.x - from.x,
    y: to.y - from.y
  };
}

/**
 * Apply pan delta to transform
 *
 * @param transform - Current transform
 * @param delta - Pan delta
 * @returns Updated transform
 */
export function applyPanDelta(transform: TransformMatrix, delta: Point2D): TransformMatrix {
  return {
    ...transform,
    e: transform.e + delta.x,
    f: transform.f + delta.y
  };
}

/**
 * Center canvas on a specific point
 *
 * @param targetPoint - Point to center on
 * @param viewportWidth - Viewport width
 * @param viewportHeight - Viewport height
 * @param currentTransform - Current transform
 * @returns New transform centered on point
 */
export function centerOnPoint(
  targetPoint: Point2D,
  viewportWidth: number,
  viewportHeight: number,
  currentTransform: TransformMatrix
): TransformMatrix {
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;

  return {
    ...currentTransform,
    e: centerX - targetPoint.x * currentTransform.a,
    f: centerY - targetPoint.y * currentTransform.d
  };
}

/**
 * Constrain pan within boundaries
 *
 * @param transform - Current transform
 * @param contentBounds - Content bounding box
 * @param viewportWidth - Viewport width
 * @param viewportHeight - Viewport height
 * @param padding - Boundary padding
 * @returns Constrained transform
 */
export function constrainPan(
  transform: TransformMatrix,
  contentBounds: { x: number; y: number; width: number; height: number },
  viewportWidth: number,
  viewportHeight: number,
  padding: number = DEFAULT_PAN_CONFIG.boundaryPadding
): TransformMatrix {
  const scaledWidth = contentBounds.width * transform.a;
  const scaledHeight = contentBounds.height * transform.d;

  const minX = viewportWidth - scaledWidth - padding;
  const minY = viewportHeight - scaledHeight - padding;
  const maxX = padding;
  const maxY = padding;

  return {
    ...transform,
    e: Math.max(minX, Math.min(maxX, transform.e)),
    f: Math.max(minY, Math.min(maxY, transform.f))
  };
}
