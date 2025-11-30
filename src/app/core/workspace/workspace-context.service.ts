import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Menu, MenuService } from '@delon/theme';
import { Observable, catchError, map, of } from 'rxjs';

/**
 * Workspace configuration interface
 */
export interface WorkspaceConfig {
  id: string;
  name: string;
  description?: string;
  menu: Menu[];
}

/**
 * Service to manage workspace context and sidebar menu switching
 * The sidebar menu dynamically updates based on the current workspace context
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceContextService {
  private readonly httpClient = inject(HttpClient);
  private readonly menuService = inject(MenuService);

  // Signal to track available workspaces
  private readonly workspacesSignal = signal<WorkspaceConfig[]>([]);

  // Signal to track current workspace
  private readonly currentWorkspaceIdSignal = signal<string>('default');

  // Computed signal for current workspace
  readonly currentWorkspace = computed(() => {
    const id = this.currentWorkspaceIdSignal();
    return this.workspacesSignal().find(w => w.id === id) || null;
  });

  // Public readonly signal for workspaces
  readonly workspaces = computed(() => this.workspacesSignal());

  // Public readonly signal for current workspace ID
  readonly currentWorkspaceId = computed(() => this.currentWorkspaceIdSignal());

  /**
   * Load workspace configurations from JSON file
   */
  loadWorkspaces(configPath = './assets/tmp/workspaces.json'): Observable<WorkspaceConfig[]> {
    return this.httpClient.get<{ workspaces: WorkspaceConfig[] }>(configPath).pipe(
      map(data => {
        this.workspacesSignal.set(data.workspaces);
        return data.workspaces;
      }),
      catchError(err => {
        console.warn('WorkspaceContextService.loadWorkspaces: Failed to load workspaces', err);
        return of([]);
      })
    );
  }

  /**
   * Set available workspaces
   */
  setWorkspaces(workspaces: WorkspaceConfig[]): void {
    this.workspacesSignal.set(workspaces);
  }

  /**
   * Switch to a different workspace
   * This updates the sidebar menu based on the workspace configuration
   */
  switchWorkspace(workspaceId: string): boolean {
    const workspace = this.workspacesSignal().find(w => w.id === workspaceId);
    if (!workspace) {
      console.warn(`WorkspaceContextService.switchWorkspace: Workspace '${workspaceId}' not found`);
      return false;
    }

    this.currentWorkspaceIdSignal.set(workspaceId);

    // Clear existing menu and set new menu from workspace config
    this.menuService.clear();
    this.menuService.add(workspace.menu);

    return true;
  }

  /**
   * Add a workspace configuration
   */
  addWorkspace(workspace: WorkspaceConfig): void {
    const current = this.workspacesSignal();
    const existing = current.findIndex(w => w.id === workspace.id);
    if (existing >= 0) {
      // Update existing workspace
      const updated = [...current];
      updated[existing] = workspace;
      this.workspacesSignal.set(updated);
    } else {
      // Add new workspace
      this.workspacesSignal.set([...current, workspace]);
    }
  }

  /**
   * Remove a workspace configuration
   */
  removeWorkspace(workspaceId: string): boolean {
    const current = this.workspacesSignal();
    const filtered = current.filter(w => w.id !== workspaceId);
    if (filtered.length === current.length) {
      return false;
    }
    this.workspacesSignal.set(filtered);

    // If removing current workspace, switch to first available
    if (this.currentWorkspaceIdSignal() === workspaceId && filtered.length > 0) {
      this.switchWorkspace(filtered[0].id);
    }
    return true;
  }
}
