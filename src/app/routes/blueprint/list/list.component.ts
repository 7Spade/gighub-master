/**
 * Blueprint List Component
 *
 * 藍圖列表組件
 * Blueprint list component
 *
 * Displays a list of blueprints accessible by the current user.
 *
 * @module routes/blueprint
 */

import { ChangeDetectionStrategy, Component, inject, signal, OnInit, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BlueprintFacade, ContextType } from '@core';
import { BlueprintBusinessModel, WorkspaceContextService } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';

import { CreateBlueprintComponent } from '../create-blueprint/create-blueprint.component';

@Component({
  selector: 'app-blueprint-list',
  template: `
    <div class="blueprint-list-container">
      <div class="header">
        <h2>{{ pageTitle() }}</h2>
        <button nz-button nzType="primary" (click)="openCreateModal()">
          <span nz-icon nzType="plus"></span>
          建立藍圖
        </button>
      </div>

      <nz-spin [nzSpinning]="loading()">
        @if (blueprints().length === 0 && !loading()) {
          <nz-empty nzNotFoundContent="暫無藍圖" [nzNotFoundFooter]="emptyFooter">
            <ng-template #emptyFooter>
              <button nz-button nzType="primary" (click)="openCreateModal()">
                建立第一個藍圖
              </button>
            </ng-template>
          </nz-empty>
        } @else {
          <div nz-row [nzGutter]="[16, 16]">
            @for (blueprint of blueprints(); track blueprint.id) {
              <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8" [nzLg]="6">
                <nz-card
                  class="blueprint-card"
                  [nzHoverable]="true"
                  (click)="openBlueprint(blueprint)"
                >
                  <div class="card-content">
                    @if (blueprint.cover_url) {
                      <div class="cover" [style.backgroundImage]="'url(' + blueprint.cover_url + ')'"></div>
                    } @else {
                      <div class="cover placeholder">
                        <nz-avatar [nzSize]="48" nzIcon="project" [nzShape]="'square'"></nz-avatar>
                      </div>
                    }
                    <div class="info">
                      <h4 class="name">{{ blueprint.name }}</h4>
                      @if (blueprint.description) {
                        <p class="description">{{ blueprint.description }}</p>
                      }
                      <div class="tags">
                        @if (blueprint.is_public) {
                          <nz-tag nzColor="green">公開</nz-tag>
                        } @else {
                          <nz-tag>私有</nz-tag>
                        }
                        <nz-tag nzColor="blue">{{ blueprint.status }}</nz-tag>
                      </div>
                    </div>
                  </div>
                </nz-card>
              </div>
            }
          </div>
        }
      </nz-spin>
    </div>
  `,
  styles: [`
    .blueprint-list-container {
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .header h2 {
      margin: 0;
    }
    .blueprint-card {
      cursor: pointer;
    }
    .card-content {
      display: flex;
      flex-direction: column;
    }
    .cover {
      height: 120px;
      background-size: cover;
      background-position: center;
      border-radius: 4px;
      margin-bottom: 12px;
    }
    .cover.placeholder {
      background-color: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .info {
      flex: 1;
    }
    .name {
      margin: 0 0 8px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .description {
      margin: 0 0 8px;
      color: #666;
      font-size: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .tags {
      display: flex;
      gap: 4px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NzButtonModule,
    NzCardModule,
    NzEmptyModule,
    NzGridModule,
    NzIconModule,
    NzSpinModule,
    NzTagModule,
    NzAvatarModule
  ]
})
export class BlueprintListComponent implements OnInit {
  private readonly blueprintFacade = inject(BlueprintFacade);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly modalService = inject(NzModalService);
  private readonly msg = inject(NzMessageService);
  private readonly router = inject(Router);

  blueprints = signal<BlueprintBusinessModel[]>([]);
  loading = signal(false);

  // Get the account ID to use for fetching blueprints based on context
  readonly contextAccountId = computed(() => {
    const contextType = this.workspaceContext.contextType();
    if (contextType === ContextType.ORGANIZATION) {
      // For organization context, use the organization's account_id
      return this.workspaceContext.contextAccountId();
    }
    // For user context, use the current user's account_id
    return this.workspaceContext.currentUser()?.id || null;
  });

  // Page title changes based on context
  readonly pageTitle = computed(() => {
    const contextType = this.workspaceContext.contextType();
    if (contextType === ContextType.ORGANIZATION) {
      return '組織藍圖';
    }
    return '我的藍圖';
  });

  constructor() {
    // React to context changes and reload blueprints
    effect(() => {
      const accountId = this.contextAccountId();
      if (accountId) {
        this.loadBlueprints();
      }
    });
  }

  ngOnInit(): void {
    this.loadBlueprints();
  }

  async loadBlueprints(): Promise<void> {
    const accountId = this.contextAccountId();
    if (!accountId) {
      this.blueprints.set([]);
      return;
    }

    this.loading.set(true);
    try {
      const contextType = this.workspaceContext.contextType();
      let blueprints: BlueprintBusinessModel[];

      if (contextType === ContextType.ORGANIZATION) {
        // For organization context, get blueprints owned by the organization
        blueprints = await this.blueprintFacade.findByOwner(accountId);
      } else {
        // For user context, get all accessible blueprints (owned + member)
        blueprints = await this.blueprintFacade.getUserAccessibleBlueprints(accountId);
      }

      this.blueprints.set(blueprints);
    } catch (error) {
      console.error('[BlueprintListComponent] Failed to load blueprints:', error);
      this.msg.error('載入藍圖失敗');
    } finally {
      this.loading.set(false);
    }
  }

  openCreateModal(): void {
    const modalRef = this.modalService.create({
      nzContent: CreateBlueprintComponent,
      nzFooter: null,
      nzWidth: 520,
      nzClosable: true,
      nzMaskClosable: false
    });

    modalRef.afterClose.subscribe((result: BlueprintBusinessModel | undefined) => {
      if (result) {
        this.loadBlueprints();
      }
    });
  }

  openBlueprint(blueprint: BlueprintBusinessModel): void {
    // Navigate to blueprint detail/workspace
    this.router.navigate(['/blueprint', blueprint.id]);
  }
}
