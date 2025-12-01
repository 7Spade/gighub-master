/**
 * Blueprint Droppable Directive
 *
 * Makes blueprint elements accept dropped items
 * For drag-and-drop functionality in blueprint editor
 *
 * @module features/blueprint/directives/blueprint-droppable.directive
 */

import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';

/**
 * Drop event data interface
 */
export interface BlueprintDropEvent {
  element: HTMLElement;
  data?: unknown;
  position: { x: number; y: number };
  originalEvent: DragEvent;
}

/**
 * Directive to make blueprint elements accept drops
 *
 * @example
 * ```html
 * <div blueprintDroppable
 *      [dropEnabled]="true"
 *      [acceptTypes]="['task', 'milestone']"
 *      (itemDragEnter)="onDragEnter($event)"
 *      (itemDragLeave)="onDragLeave($event)"
 *      (itemDrop)="onDrop($event)">
 *   Drop zone
 * </div>
 * ```
 */
@Directive({
  selector: '[blueprintDroppable]',
  standalone: true
})
export class BlueprintDroppableDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /** Enable/disable drop functionality */
  @Input() dropEnabled = true;

  /** Accepted data types */
  @Input() acceptTypes: string[] = [];

  /** CSS class when dragging over */
  @Input() dropHoverClass = 'blueprint-drop-hover';

  /** CSS class when drop is valid */
  @Input() dropValidClass = 'blueprint-drop-valid';

  /** CSS class when drop is invalid */
  @Input() dropInvalidClass = 'blueprint-drop-invalid';

  /** Emitted when item enters drop zone */
  @Output() readonly itemDragEnter = new EventEmitter<DragEvent>();

  /** Emitted when item leaves drop zone */
  @Output() readonly itemDragLeave = new EventEmitter<DragEvent>();

  /** Emitted when item is over drop zone */
  @Output() readonly itemDragOver = new EventEmitter<DragEvent>();

  /** Emitted when item is dropped */
  @Output() readonly itemDrop = new EventEmitter<BlueprintDropEvent>();

  private dragEnterCount = 0;

  @HostListener('dragenter', ['$event'])
  onDragEnter(event: DragEvent): void {
    if (!this.dropEnabled) return;

    event.preventDefault();
    this.dragEnterCount++;

    if (this.dragEnterCount === 1) {
      this.elementRef.nativeElement.classList.add(this.dropHoverClass);

      if (this.isValidDrop(event)) {
        this.elementRef.nativeElement.classList.add(this.dropValidClass);
      } else {
        this.elementRef.nativeElement.classList.add(this.dropInvalidClass);
      }

      this.itemDragEnter.emit(event);
    }
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    if (!this.dropEnabled) return;

    this.dragEnterCount--;

    if (this.dragEnterCount === 0) {
      this.removeDropClasses();
      this.itemDragLeave.emit(event);
    }
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    if (!this.dropEnabled) return;

    event.preventDefault();

    if (this.isValidDrop(event)) {
      event.dataTransfer!.dropEffect = 'move';
    } else {
      event.dataTransfer!.dropEffect = 'none';
    }

    this.itemDragOver.emit(event);
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    if (!this.dropEnabled) return;

    event.preventDefault();
    this.dragEnterCount = 0;
    this.removeDropClasses();

    if (!this.isValidDrop(event)) {
      return;
    }

    let data: unknown;
    try {
      const jsonData = event.dataTransfer?.getData('application/json');
      if (jsonData) {
        data = JSON.parse(jsonData);
      } else {
        data = event.dataTransfer?.getData('text/plain');
      }
    } catch {
      data = event.dataTransfer?.getData('text/plain');
    }

    const rect = this.elementRef.nativeElement.getBoundingClientRect();

    const dropEvent: BlueprintDropEvent = {
      element: this.elementRef.nativeElement,
      data,
      position: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      },
      originalEvent: event
    };

    this.itemDrop.emit(dropEvent);
  }

  private isValidDrop(event: DragEvent): boolean {
    if (this.acceptTypes.length === 0) {
      return true;
    }

    const types = event.dataTransfer?.types || [];
    return this.acceptTypes.some(type => types.includes(type));
  }

  private removeDropClasses(): void {
    const el = this.elementRef.nativeElement;
    el.classList.remove(this.dropHoverClass);
    el.classList.remove(this.dropValidClass);
    el.classList.remove(this.dropInvalidClass);
  }
}
