/**
 * Coordinate Utils
 *
 * Coordinate transformation and conversion utilities
 * For blueprint canvas coordinate system operations
 *
 * @module features/blueprint/utils/geometry/coordinate.utils
 */

/**
 * 2D Point interface
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Rectangle interface
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Transform matrix interface
 */
export interface TransformMatrix {
  a: number; // scale x
  b: number; // skew y
  c: number; // skew x
  d: number; // scale y
  e: number; // translate x
  f: number; // translate y
}

/**
 * Convert screen coordinates to canvas coordinates
 *
 * @param screenPoint - Screen coordinates
 * @param transform - Current canvas transform matrix
 * @returns Canvas coordinates
 */
export function screenToCanvas(screenPoint: Point2D, transform: TransformMatrix): Point2D {
  const { a, b, c, d, e, f } = transform;
  const determinant = a * d - b * c;

  if (determinant === 0) {
    return screenPoint;
  }

  return {
    x: (d * (screenPoint.x - e) - c * (screenPoint.y - f)) / determinant,
    y: (-b * (screenPoint.x - e) + a * (screenPoint.y - f)) / determinant
  };
}

/**
 * Convert canvas coordinates to screen coordinates
 *
 * @param canvasPoint - Canvas coordinates
 * @param transform - Current canvas transform matrix
 * @returns Screen coordinates
 */
export function canvasToScreen(canvasPoint: Point2D, transform: TransformMatrix): Point2D {
  const { a, b, c, d, e, f } = transform;

  return {
    x: a * canvasPoint.x + c * canvasPoint.y + e,
    y: b * canvasPoint.x + d * canvasPoint.y + f
  };
}

/**
 * Get center point of a rectangle
 *
 * @param rect - Rectangle
 * @returns Center point
 */
export function getRectCenter(rect: Rectangle): Point2D {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  };
}

/**
 * Check if a point is inside a rectangle
 *
 * @param point - Point to check
 * @param rect - Rectangle bounds
 * @returns True if point is inside rectangle
 */
export function isPointInRect(point: Point2D, rect: Rectangle): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

/**
 * Create identity transform matrix
 *
 * @returns Identity transform matrix
 */
export function createIdentityMatrix(): TransformMatrix {
  return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
}

/**
 * Multiply two transform matrices
 *
 * @param m1 - First matrix
 * @param m2 - Second matrix
 * @returns Result matrix
 */
export function multiplyMatrices(m1: TransformMatrix, m2: TransformMatrix): TransformMatrix {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f
  };
}
