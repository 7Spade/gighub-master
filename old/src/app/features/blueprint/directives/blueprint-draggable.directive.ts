/**
 * Blueprint Draggable Directive
 *
 * Makes blueprint elements draggable on canvas
 * For drag-and-drop functionality in blueprint editor
 *
 * @module features/blueprint/directives/blueprint-draggable.directive
 */

import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';

import { Point2D } from '../utils/geometry/coordinate.utils';

/**
 * Drag event data interface
 */
export interface BlueprintDragEvent {
  element: HTMLElement;
  startPosition: Point2D;
  currentPosition: Point2D;
  delta: Point2D;
  originalEvent: MouseEvent | TouchEvent;
}

/**
 * Directive to make blueprint elements draggable
 *
 * @example
 * ```html
 * <div blueprintDraggable
 *      [dragEnabled]="true"
 *      [dragBoundary]="boundaryElement"
 *      (dragStart)="onDragStart($event)"
 *      (dragMove)="onDragMove($event)"
 *      (dragEnd)="onDragEnd($event)">
 *   Draggable content
 * </div>
 * ```
 */
@Directive({
  selector: '[blueprintDraggable]',
  standalone: true
})
export class BlueprintDraggableDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /** Enable/disable drag functionality */
  @Input() dragEnabled = true;

  /** Boundary element for constraining drag */
  @Input() dragBoundary?: HTMLElement;

  /** Drag handle selector (if only part of element should initiate drag) */
  @Input() dragHandle?: string;

  /** CSS class to add during drag */
  @Input() dragActiveClass = 'blueprint-dragging';

  /** Emitted when drag starts */
  @Output() readonly dragStart = new EventEmitter<BlueprintDragEvent>();

  /** Emitted during drag */
  @Output() readonly dragMove = new EventEmitter<BlueprintDragEvent>();

  /** Emitted when drag ends */
  @Output() readonly dragEnd = new EventEmitter<BlueprintDragEvent>();

  private isDragging = false;
  private startPosition: Point2D = { x: 0, y: 0 };
  private currentPosition: Point2D = { x: 0, y: 0 };

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (!this.dragEnabled || !this.isValidDragStart(event)) {
      return;
    }

    this.startDrag(event.clientX, event.clientY, event);
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (!this.dragEnabled || event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];
    this.startDrag(touch.clientX, touch.clientY, event);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.updateDrag(event.clientX, event.clientY, event);
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) return;
    const touch = event.touches[0];
    this.updateDrag(touch.clientX, touch.clientY, event);
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.endDrag(event);
  }

  @HostListener('document:touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (!this.isDragging) return;
    this.endDrag(event);
  }

  private isValidDragStart(event: MouseEvent): boolean {
    if (!this.dragHandle) {
      return true;
    }

    const target = event.target as HTMLElement;
    return target.closest(this.dragHandle) !== null;
  }

  private startDrag(x: number, y: number, originalEvent: MouseEvent | TouchEvent): void {
    this.isDragging = true;
    this.startPosition = { x, y };
    this.currentPosition = { x, y };

    this.elementRef.nativeElement.classList.add(this.dragActiveClass);

    const dragEvent = this.createDragEvent(originalEvent);
    this.dragStart.emit(dragEvent);
  }

  private updateDrag(x: number, y: number, originalEvent: MouseEvent | TouchEvent): void {
    this.currentPosition = { x, y };

    const dragEvent = this.createDragEvent(originalEvent);
    this.dragMove.emit(dragEvent);
  }

  private endDrag(originalEvent: MouseEvent | TouchEvent): void {
    this.isDragging = false;

    this.elementRef.nativeElement.classList.remove(this.dragActiveClass);

    const dragEvent = this.createDragEvent(originalEvent);
    this.dragEnd.emit(dragEvent);
  }

  private createDragEvent(originalEvent: MouseEvent | TouchEvent): BlueprintDragEvent {
    return {
      element: this.elementRef.nativeElement,
      startPosition: { ...this.startPosition },
      currentPosition: { ...this.currentPosition },
      delta: {
        x: this.currentPosition.x - this.startPosition.x,
        y: this.currentPosition.y - this.startPosition.y
      },
      originalEvent
    };
  }
}
