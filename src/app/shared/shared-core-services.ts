/**
 * Shared Core Services
 *
 * 共享核心服務列表
 * Shared core services list
 *
 * Provides array of core services for dependency injection registration.
 *
 * @module shared
 */

import { Provider } from '@angular/core';

/**
 * 共享核心服務 providers 陣列
 * Shared core services providers array
 *
 * Include services that should be provided at the root level
 */
export const SHARED_CORE_SERVICES: Provider[] = [
  // Add core services here as needed
  // Example: { provide: SomeService, useClass: SomeServiceImpl }
];
