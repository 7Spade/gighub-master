/**
 * Collision Utils
 *
 * Collision detection utilities
 * For blueprint canvas object collision and overlap detection
 *
 * @module features/blueprint/utils/geometry/collision.utils
 */

import { Point2D, Rectangle } from './coordinate.utils';

/**
 * Circle interface for collision detection
 */
export interface Circle {
  center: Point2D;
  radius: number;
}

/**
 * Check if two rectangles overlap
 *
 * @param rect1 - First rectangle
 * @param rect2 - Second rectangle
 * @returns True if rectangles overlap
 */
export function doRectsOverlap(rect1: Rectangle, rect2: Rectangle): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
}

/**
 * Check if two circles overlap
 *
 * @param circle1 - First circle
 * @param circle2 - Second circle
 * @returns True if circles overlap
 */
export function doCirclesOverlap(circle1: Circle, circle2: Circle): boolean {
  const dx = circle2.center.x - circle1.center.x;
  const dy = circle2.center.y - circle1.center.y;
  const distanceSquared = dx * dx + dy * dy;
  const radiusSum = circle1.radius + circle2.radius;
  return distanceSquared <= radiusSum * radiusSum;
}

/**
 * Check if a circle and rectangle overlap
 *
 * @param circle - Circle
 * @param rect - Rectangle
 * @returns True if they overlap
 */
export function doesCircleOverlapRect(circle: Circle, rect: Rectangle): boolean {
  const closestX = Math.max(rect.x, Math.min(circle.center.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.center.y, rect.y + rect.height));

  const dx = circle.center.x - closestX;
  const dy = circle.center.y - closestY;

  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

/**
 * Check if a point is inside a circle
 *
 * @param point - Point to check
 * @param circle - Circle bounds
 * @returns True if point is inside circle
 */
export function isPointInCircle(point: Point2D, circle: Circle): boolean {
  const dx = point.x - circle.center.x;
  const dy = point.y - circle.center.y;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

/**
 * Get the intersection rectangle of two rectangles
 *
 * @param rect1 - First rectangle
 * @param rect2 - Second rectangle
 * @returns Intersection rectangle or null if no intersection
 */
export function getRectIntersection(rect1: Rectangle, rect2: Rectangle): Rectangle | null {
  const x = Math.max(rect1.x, rect2.x);
  const y = Math.max(rect1.y, rect2.y);
  const width = Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - x;
  const height = Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - y;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return { x, y, width, height };
}

/**
 * Get the bounding rectangle that contains both rectangles
 *
 * @param rect1 - First rectangle
 * @param rect2 - Second rectangle
 * @returns Bounding rectangle
 */
export function getBoundingRect(rect1: Rectangle, rect2: Rectangle): Rectangle {
  const x = Math.min(rect1.x, rect2.x);
  const y = Math.min(rect1.y, rect2.y);
  const width = Math.max(rect1.x + rect1.width, rect2.x + rect2.width) - x;
  const height = Math.max(rect1.y + rect1.height, rect2.y + rect2.height) - y;

  return { x, y, width, height };
}

/**
 * Check if first rectangle contains second rectangle
 *
 * @param outer - Outer rectangle
 * @param inner - Inner rectangle
 * @returns True if outer contains inner
 */
export function doesRectContain(outer: Rectangle, inner: Rectangle): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}
