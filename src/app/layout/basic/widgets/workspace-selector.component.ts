import { Component, inject } from '@angular/core';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import { WorkspaceContextService } from '../../../core/workspace/workspace-context.service';

@Component({
  selector: 'header-workspace-selector',
  template: `
    <div nz-dropdown [nzDropdownMenu]="workspaceMenu" nzTrigger="click" nzPlacement="bottomRight" class="alain-default__nav-item">
      <i nz-icon nzType="appstore" nzTheme="outline"></i>
      <span class="workspace-name">{{ workspaceService.currentWorkspace()?.name || 'Select Workspace' }}</span>
    </div>
    <nz-dropdown-menu #workspaceMenu="nzDropdownMenu">
      <ul nz-menu>
        @for (workspace of workspaceService.workspaces(); track workspace.id) {
          <li nz-menu-item (click)="switchWorkspace(workspace.id)" [nzSelected]="workspace.id === workspaceService.currentWorkspaceId()">
            {{ workspace.name }}
            @if (workspace.description) {
              <span class="workspace-description">- {{ workspace.description }}</span>
            }
          </li>
        }
      </ul>
    </nz-dropdown-menu>
  `,
  styles: [
    `
      .workspace-name {
        margin-left: 8px;
      }
      .workspace-description {
        color: rgba(0, 0, 0, 0.45);
        font-size: 12px;
        margin-left: 4px;
      }
    `
  ],
  imports: [NzDropDownModule, NzIconModule, NzMenuModule]
})
export class HeaderWorkspaceSelectorComponent {
  readonly workspaceService = inject(WorkspaceContextService);

  switchWorkspace(workspaceId: string): void {
    this.workspaceService.switchWorkspace(workspaceId);
  }
}
