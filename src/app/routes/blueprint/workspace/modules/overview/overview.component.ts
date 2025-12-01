/**
 * Blueprint Overview Component
 *
 * 藍圖概覽組件
 * Blueprint Overview Component
 *
 * Displays an overview of the blueprint with statistics and quick actions.
 *
 * @module routes/blueprint/workspace/modules/overview
 */

import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlueprintContextService, MODULE_CONFIGS } from '@shared';
import { ModuleType } from '@core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';

@Component({
  selector: 'app-blueprint-overview',
  template: `
    <div class="overview-container">
      <!-- Blueprint Info Card -->
      <nz-card nzTitle="藍圖資訊" class="info-card">
        <nz-descriptions nzBordered [nzColumn]="2">
          <nz-descriptions-item nzTitle="名稱">{{ blueprint()?.name }}</nz-descriptions-item>
          <nz-descriptions-item nzTitle="狀態">
            <nz-tag [nzColor]="blueprint()?.status === 'active' ? 'green' : 'default'">
              {{ blueprint()?.status }}
            </nz-tag>
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="描述" [nzSpan]="2">
            {{ blueprint()?.description || '暫無描述' }}
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="可見性">
            @if (blueprint()?.is_public) {
              <nz-tag nzColor="green">公開</nz-tag>
            } @else {
              <nz-tag>私有</nz-tag>
            }
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="建立時間">
            {{ blueprint()?.created_at | date:'yyyy-MM-dd HH:mm' }}
          </nz-descriptions-item>
        </nz-descriptions>
      </nz-card>

      <!-- Statistics Row -->
      <div nz-row [nzGutter]="16" class="stats-row">
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic
              nzTitle="啟用模組"
              [nzValue]="enabledModulesCount()"
              [nzPrefix]="prefixModules"
            ></nz-statistic>
            <ng-template #prefixModules>
              <span nz-icon nzType="appstore"></span>
            </ng-template>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic
              nzTitle="成員數"
              [nzValue]="blueprint()?.memberCount || 0"
              [nzPrefix]="prefixMembers"
            ></nz-statistic>
            <ng-template #prefixMembers>
              <span nz-icon nzType="team"></span>
            </ng-template>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic
              nzTitle="任務數"
              [nzValue]="blueprint()?.taskCount || 0"
              [nzPrefix]="prefixTasks"
            ></nz-statistic>
            <ng-template #prefixTasks>
              <span nz-icon nzType="check-square"></span>
            </ng-template>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic
              nzTitle="完成率"
              nzValue="0"
              nzSuffix="%"
              [nzPrefix]="prefixProgress"
            ></nz-statistic>
            <ng-template #prefixProgress>
              <span nz-icon nzType="rise"></span>
            </ng-template>
          </nz-card>
        </div>
      </div>

      <!-- Quick Actions & Modules Grid -->
      <div nz-row [nzGutter]="16">
        <!-- Enabled Modules -->
        <div nz-col [nzSpan]="16">
          <nz-card nzTitle="已啟用模組">
            <div class="modules-grid">
              @for (module of enabledModuleConfigs(); track module.type) {
                <div
                  class="module-item"
                  (click)="navigateToModule(module.type)"
                >
                  <div class="module-icon">
                    <span nz-icon [nzType]="module.icon" nzTheme="outline"></span>
                  </div>
                  <div class="module-name">{{ module.label }}</div>
                </div>
              }
            </div>
          </nz-card>
        </div>

        <!-- Recent Activity (Placeholder) -->
        <div nz-col [nzSpan]="8">
          <nz-card nzTitle="最近活動">
            <nz-timeline>
              <nz-timeline-item nzColor="green">
                <p>藍圖已建立</p>
                <small>{{ blueprint()?.created_at | date:'yyyy-MM-dd' }}</small>
              </nz-timeline-item>
              <nz-timeline-item nzColor="blue">
                <p>等待更多活動...</p>
                <small>即將推出</small>
              </nz-timeline-item>
            </nz-timeline>
          </nz-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overview-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-card {
      margin-bottom: 0;
    }

    .stats-row {
      margin: 0;
    }

    .stats-row nz-card {
      text-align: center;
    }

    :host ::ng-deep .stats-row .ant-statistic-content {
      font-size: 24px;
    }

    :host ::ng-deep .stats-row .ant-statistic-content-prefix {
      margin-right: 8px;
    }

    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 16px;
    }

    .module-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .module-item:hover {
      background: #e6f7ff;
      transform: translateY(-2px);
    }

    .module-icon {
      font-size: 32px;
      color: #1890ff;
      margin-bottom: 8px;
    }

    .module-name {
      font-size: 14px;
      font-weight: 500;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NzCardModule,
    NzGridModule,
    NzIconModule,
    NzStatisticModule,
    NzDividerModule,
    NzDescriptionsModule,
    NzTagModule,
    NzButtonModule,
    NzTimelineModule
  ]
})
export class BlueprintOverviewComponent {
  private readonly blueprintContext = inject(BlueprintContextService);

  readonly blueprint = this.blueprintContext.blueprint;
  readonly enabledModuleConfigs = this.blueprintContext.enabledModuleConfigs;

  readonly enabledModulesCount = computed(() => this.blueprintContext.enabledModules().length);

  navigateToModule(moduleType: ModuleType): void {
    this.blueprintContext.navigateToModule(moduleType);
  }
}
