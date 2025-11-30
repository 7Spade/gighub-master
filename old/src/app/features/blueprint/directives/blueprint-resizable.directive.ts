/**
 * Blueprint Resizable Directive
 *
 * Makes blueprint elements resizable
 * For resize functionality in blueprint editor
 *
 * @module features/blueprint/directives/blueprint-resizable.directive
 */

import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';

/**
 * Resize event data interface
 */
export interface BlueprintResizeEvent {
  element: HTMLElement;
  width: number;
  height: number;
  deltaWidth: number;
  deltaHeight: number;
  handle: ResizeHandle;
  originalEvent: MouseEvent;
}

/**
 * Resize handle type
 */
export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/**
 * Directive to make blueprint elements resizable
 *
 * @example
 * ```html
 * <div blueprintResizable
 *      [resizeEnabled]="true"
 *      [minWidth]="100"
 *      [minHeight]="50"
 *      [handles]="['se', 'e', 's']"
 *      (resizeStart)="onResizeStart($event)"
 *      (resizeMove)="onResizeMove($event)"
 *      (resizeEnd)="onResizeEnd($event)">
 *   Resizable content
 * </div>
 * ```
 */
@Directive({
  selector: '[blueprintResizable]',
  standalone: true
})
export class BlueprintResizableDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /** Enable/disable resize functionality */
  @Input() resizeEnabled = true;

  /** Minimum width */
  @Input() minWidth = 50;

  /** Minimum height */
  @Input() minHeight = 50;

  /** Maximum width */
  @Input() maxWidth?: number;

  /** Maximum height */
  @Input() maxHeight?: number;

  /** Enabled resize handles */
  @Input() handles: ResizeHandle[] = ['se'];

  /** Preserve aspect ratio */
  @Input() preserveAspectRatio = false;

  /** CSS class during resize */
  @Input() resizeActiveClass = 'blueprint-resizing';

  /** Emitted when resize starts */
  @Output() readonly resizeStart = new EventEmitter<BlueprintResizeEvent>();

  /** Emitted during resize */
  @Output() readonly resizeMove = new EventEmitter<BlueprintResizeEvent>();

  /** Emitted when resize ends */
  @Output() readonly resizeEnd = new EventEmitter<BlueprintResizeEvent>();

  private isResizing = false;
  private activeHandle: ResizeHandle | null = null;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private aspectRatio = 1;

  /**
   * Start resize on handle mousedown
   * Called programmatically from handle elements
   */
  startResize(handle: ResizeHandle, event: MouseEvent): void {
    if (!this.resizeEnabled || !this.handles.includes(handle)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.isResizing = true;
    this.activeHandle = handle;
    this.startX = event.clientX;
    this.startY = event.clientY;

    const el = this.elementRef.nativeElement;
    this.startWidth = el.offsetWidth;
    this.startHeight = el.offsetHeight;
    this.aspectRatio = this.startWidth / this.startHeight;

    el.classList.add(this.resizeActiveClass);

    this.resizeStart.emit(this.createResizeEvent(event));
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing || !this.activeHandle) return;

    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;

    let newWidth = this.startWidth;
    let newHeight = this.startHeight;

    // Calculate new dimensions based on active handle
    switch (this.activeHandle) {
      case 'e':
        newWidth = this.startWidth + deltaX;
        break;
      case 'w':
        newWidth = this.startWidth - deltaX;
        break;
      case 's':
        newHeight = this.startHeight + deltaY;
        break;
      case 'n':
        newHeight = this.startHeight - deltaY;
        break;
      case 'se':
        newWidth = this.startWidth + deltaX;
        newHeight = this.startHeight + deltaY;
        break;
      case 'sw':
        newWidth = this.startWidth - deltaX;
        newHeight = this.startHeight + deltaY;
        break;
      case 'ne':
        newWidth = this.startWidth + deltaX;
        newHeight = this.startHeight - deltaY;
        break;
      case 'nw':
        newWidth = this.startWidth - deltaX;
        newHeight = this.startHeight - deltaY;
        break;
    }

    // Preserve aspect ratio if enabled
    if (this.preserveAspectRatio) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newHeight = newWidth / this.aspectRatio;
      } else {
        newWidth = newHeight * this.aspectRatio;
      }
    }

    // Apply constraints
    newWidth = Math.max(this.minWidth, newWidth);
    newHeight = Math.max(this.minHeight, newHeight);

    if (this.maxWidth !== undefined) {
      newWidth = Math.min(this.maxWidth, newWidth);
    }
    if (this.maxHeight !== undefined) {
      newHeight = Math.min(this.maxHeight, newHeight);
    }

    // Update element
    const el = this.elementRef.nativeElement;
    el.style.width = `${newWidth}px`;
    el.style.height = `${newHeight}px`;

    this.resizeMove.emit(this.createResizeEvent(event));
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (!this.isResizing) return;

    this.isResizing = false;
    this.elementRef.nativeElement.classList.remove(this.resizeActiveClass);

    this.resizeEnd.emit(this.createResizeEvent(event));

    this.activeHandle = null;
  }

  private createResizeEvent(originalEvent: MouseEvent): BlueprintResizeEvent {
    const el = this.elementRef.nativeElement;
    return {
      element: el,
      width: el.offsetWidth,
      height: el.offsetHeight,
      deltaWidth: el.offsetWidth - this.startWidth,
      deltaHeight: el.offsetHeight - this.startHeight,
      handle: this.activeHandle!,
      originalEvent
    };
  }
}
