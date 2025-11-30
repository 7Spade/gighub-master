/**
 * Selection Utils
 *
 * Canvas selection handling utilities
 * For blueprint canvas object selection operations
 *
 * @module features/blueprint/utils/canvas/selection.utils
 */

import { doRectsOverlap } from '../geometry/collision.utils';
import { Point2D, Rectangle, isPointInRect } from '../geometry/coordinate.utils';

/**
 * Selectable item interface
 */
export interface SelectableItem {
  id: string;
  bounds: Rectangle;
  selectable?: boolean;
  locked?: boolean;
}

/**
 * Selection state interface
 */
export interface SelectionState {
  selectedIds: Set<string>;
  hoveredId: string | null;
  selectionBox: Rectangle | null;
  isSelecting: boolean;
}

/**
 * Selection mode enum
 */
export enum SelectionMode {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
  ADD = 'add',
  SUBTRACT = 'subtract',
  TOGGLE = 'toggle'
}

/**
 * Create initial selection state
 *
 * @returns Initial selection state
 */
export function createSelectionState(): SelectionState {
  return {
    selectedIds: new Set(),
    hoveredId: null,
    selectionBox: null,
    isSelecting: false
  };
}

/**
 * Select a single item
 *
 * @param state - Current selection state
 * @param itemId - Item ID to select
 * @param mode - Selection mode
 * @returns Updated selection state
 */
export function selectItem(state: SelectionState, itemId: string, mode: SelectionMode = SelectionMode.SINGLE): SelectionState {
  const newSelectedIds = new Set(state.selectedIds);

  switch (mode) {
    case SelectionMode.SINGLE:
      newSelectedIds.clear();
      newSelectedIds.add(itemId);
      break;
    case SelectionMode.MULTIPLE:
    case SelectionMode.ADD:
      newSelectedIds.add(itemId);
      break;
    case SelectionMode.SUBTRACT:
      newSelectedIds.delete(itemId);
      break;
    case SelectionMode.TOGGLE:
      if (newSelectedIds.has(itemId)) {
        newSelectedIds.delete(itemId);
      } else {
        newSelectedIds.add(itemId);
      }
      break;
  }

  return { ...state, selectedIds: newSelectedIds };
}

/**
 * Deselect all items
 *
 * @param state - Current selection state
 * @returns Updated selection state
 */
export function deselectAll(state: SelectionState): SelectionState {
  return {
    ...state,
    selectedIds: new Set(),
    selectionBox: null,
    isSelecting: false
  };
}

/**
 * Start box selection
 *
 * @param state - Current selection state
 * @param startPoint - Starting point
 * @returns Updated selection state
 */
export function startBoxSelection(state: SelectionState, startPoint: Point2D): SelectionState {
  return {
    ...state,
    selectionBox: { x: startPoint.x, y: startPoint.y, width: 0, height: 0 },
    isSelecting: true
  };
}

/**
 * Update box selection
 *
 * @param state - Current selection state
 * @param currentPoint - Current point
 * @returns Updated selection state
 */
export function updateBoxSelection(state: SelectionState, currentPoint: Point2D): SelectionState {
  if (!state.selectionBox || !state.isSelecting) {
    return state;
  }

  const startX = state.selectionBox.x;
  const startY = state.selectionBox.y;

  // Handle negative width/height for selection in any direction
  const width = currentPoint.x - startX;
  const height = currentPoint.y - startY;

  return {
    ...state,
    selectionBox: {
      x: width < 0 ? currentPoint.x : startX,
      y: height < 0 ? currentPoint.y : startY,
      width: Math.abs(width),
      height: Math.abs(height)
    }
  };
}

/**
 * End box selection and select items
 *
 * @param state - Current selection state
 * @param items - Selectable items
 * @param mode - Selection mode
 * @returns Updated selection state
 */
export function endBoxSelection(
  state: SelectionState,
  items: SelectableItem[],
  mode: SelectionMode = SelectionMode.SINGLE
): SelectionState {
  if (!state.selectionBox) {
    return { ...state, isSelecting: false, selectionBox: null };
  }

  const newSelectedIds = mode === SelectionMode.ADD || mode === SelectionMode.MULTIPLE ? new Set(state.selectedIds) : new Set<string>();

  // Find items that intersect with selection box
  for (const item of items) {
    if (item.selectable !== false && !item.locked) {
      if (doRectsOverlap(state.selectionBox, item.bounds)) {
        if (mode === SelectionMode.SUBTRACT) {
          newSelectedIds.delete(item.id);
        } else if (mode === SelectionMode.TOGGLE) {
          if (newSelectedIds.has(item.id)) {
            newSelectedIds.delete(item.id);
          } else {
            newSelectedIds.add(item.id);
          }
        } else {
          newSelectedIds.add(item.id);
        }
      }
    }
  }

  return {
    ...state,
    selectedIds: newSelectedIds,
    selectionBox: null,
    isSelecting: false
  };
}

/**
 * Find item at point
 *
 * @param items - Selectable items
 * @param point - Point to check
 * @returns Item at point or null
 */
export function findItemAtPoint(items: SelectableItem[], point: Point2D): SelectableItem | null {
  // Iterate in reverse to find topmost item
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (item.selectable !== false && isPointInRect(point, item.bounds)) {
      return item;
    }
  }
  return null;
}

/**
 * Update hovered item
 *
 * @param state - Current selection state
 * @param items - Selectable items
 * @param point - Current mouse point
 * @returns Updated selection state
 */
export function updateHoveredItem(state: SelectionState, items: SelectableItem[], point: Point2D): SelectionState {
  const hoveredItem = findItemAtPoint(items, point);
  const hoveredId = hoveredItem?.id ?? null;

  if (hoveredId === state.hoveredId) {
    return state;
  }

  return { ...state, hoveredId };
}

/**
 * Get selected items
 *
 * @param items - All items
 * @param state - Selection state
 * @returns Selected items
 */
export function getSelectedItems(items: SelectableItem[], state: SelectionState): SelectableItem[] {
  return items.filter(item => state.selectedIds.has(item.id));
}
