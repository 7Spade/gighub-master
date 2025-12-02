/**
 * Base Context-Aware Component
 *
 * 為上下文感知組件提供共用邏輯的抽象基礎類別
 * Abstract base class providing shared logic for context-aware components
 *
 * @module shared/base
 */

import { Directive, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ContextType } from '@core';

import { WorkspaceContextService } from '../services/account/workspace-context.service';

/**
 * Context configuration for different component types
 */
interface ContextConfig {
  title: string;
  subtitle: string;
  cardTitle: string;
}

/**
 * Context type configurations mapping
 */
type ContextConfigMap = Partial<Record<ContextType, ContextConfig>>;

@Directive()
export abstract class BaseContextAwareComponent implements OnInit {
  protected readonly authContext = inject(WorkspaceContextService);
  protected readonly router = inject(Router);

  // Expose ContextType enum to template
  readonly ContextType = ContextType;

  /**
   * Define context-specific configurations
   * Must be implemented by derived classes
   */
  protected abstract readonly contextConfigs: ContextConfigMap;

  /**
   * Default configuration for invalid/unknown context
   */
  protected abstract readonly defaultConfig: ContextConfig;

  // Unified computed signals
  readonly pageTitle = computed(() => {
    const type = this.authContext.contextType();
    return this.contextConfigs[type]?.title ?? this.defaultConfig.title;
  });

  readonly pageSubtitle = computed(() => {
    const type = this.authContext.contextType();
    const label = this.authContext.contextLabel();
    const subtitle = this.contextConfigs[type]?.subtitle ?? this.defaultConfig.subtitle;
    return label ? subtitle.replace('{label}', label) : subtitle;
  });

  readonly cardTitle = computed(() => {
    const type = this.authContext.contextType();
    return this.contextConfigs[type]?.cardTitle ?? this.defaultConfig.cardTitle;
  });

  readonly contextTagColor = computed(() => {
    const type = this.authContext.contextType();
    switch (type) {
      case ContextType.USER:
        return 'blue';
      case ContextType.ORGANIZATION:
        return 'green';
      case ContextType.TEAM:
        return 'orange';
      case ContextType.BOT:
        return 'purple';
      default:
        return 'default';
    }
  });

  readonly hasValidContext = computed(() => {
    return !!this.authContext.contextId();
  });

  ngOnInit(): void {
    if (!this.hasValidContext()) {
      console.warn(`[${this.constructor.name}] No valid context detected`);
    }
  }

  navigateToAccount(): void {
    this.router.navigate(['/account']);
  }
}
