/**
 * Distance Utils
 *
 * Distance calculation utilities
 * For blueprint canvas distance and measurement operations
 *
 * @module features/blueprint/utils/geometry/distance.utils
 */

import { Point2D, Rectangle } from './coordinate.utils';

/**
 * Calculate Euclidean distance between two points
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Distance between points
 */
export function getDistance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate Manhattan distance between two points
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Manhattan distance
 */
export function getManhattanDistance(p1: Point2D, p2: Point2D): number {
  return Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);
}

/**
 * Calculate squared distance between two points (faster than getDistance)
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Squared distance
 */
export function getSquaredDistance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return dx * dx + dy * dy;
}

/**
 * Calculate distance from a point to a line segment
 *
 * @param point - The point
 * @param lineStart - Line segment start point
 * @param lineEnd - Line segment end point
 * @returns Distance from point to line segment
 */
export function getPointToLineDistance(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
  const lineLength = getSquaredDistance(lineStart, lineEnd);

  if (lineLength === 0) {
    return getDistance(point, lineStart);
  }

  const t = Math.max(
    0,
    Math.min(1, ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) + (point.y - lineStart.y) * (lineEnd.y - lineStart.y)) / lineLength)
  );

  const projection: Point2D = {
    x: lineStart.x + t * (lineEnd.x - lineStart.x),
    y: lineStart.y + t * (lineEnd.y - lineStart.y)
  };

  return getDistance(point, projection);
}

/**
 * Calculate distance from a point to a rectangle's nearest edge
 *
 * @param point - The point
 * @param rect - The rectangle
 * @returns Distance to nearest edge (0 if inside)
 */
export function getPointToRectDistance(point: Point2D, rect: Rectangle): number {
  const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width));
  const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height));
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the angle between two points in radians
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Angle in radians
 */
export function getAngle(p1: Point2D, p2: Point2D): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Calculate the angle between two points in degrees
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Angle in degrees
 */
export function getAngleDegrees(p1: Point2D, p2: Point2D): number {
  return (getAngle(p1, p2) * 180) / Math.PI;
}
