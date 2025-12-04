/**
 * Activity Timeline Component
 *
 * 活動時間軸元件
 * Displays audit log entries in a timeline format
 *
 * Features:
 * - Real-time activity updates
 * - Filterable by action type, entity type
 * - Pagination support
 * - Color-coded actions
 *
 * @module shared/services/audit-log
 */

import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

import { AuditLogService } from './audit-log.service';
import { AuditLog, AuditAction, AuditEntityType, AUDIT_ACTION_CONFIG, AUDIT_ENTITY_TYPE_CONFIG } from '../../../core/infra/types/audit-log';

@Component({
  selector: 'app-activity-timeline',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    NzTimelineModule,
    NzTagModule,
    NzIconModule,
    NzSpinModule,
    NzEmptyModule,
    NzButtonModule,
    NzSelectModule,
    NzCardModule,
    NzTooltipModule,
    NzAvatarModule
  ],
  template: `
    <div class="activity-timeline-container">
      <!-- Filters -->
      @if (showFilters()) {
        <div class="timeline-filters">
          <nz-select
            [(ngModel)]="selectedAction"
            (ngModelChange)="onFilterChange()"
            nzPlaceHolder="篩選動作"
            nzAllowClear
            style="width: 140px;"
          >
            @for (action of actionOptions; track action.value) {
              <nz-option [nzValue]="action.value" [nzLabel]="action.label"></nz-option>
            }
          </nz-select>
          <nz-select
            [(ngModel)]="selectedEntityType"
            (ngModelChange)="onFilterChange()"
            nzPlaceHolder="篩選類型"
            nzAllowClear
            style="width: 140px;"
          >
            @for (entity of entityTypeOptions; track entity.value) {
              <nz-option [nzValue]="entity.value" [nzLabel]="entity.label"></nz-option>
            }
          </nz-select>
          @if (selectedAction || selectedEntityType) {
            <button nz-button nzType="link" nzSize="small" (click)="clearFilters()">
              <span nz-icon nzType="clear"></span>
              清除
            </button>
          }
        </div>
      }

      <!-- Timeline -->
      <nz-spin [nzSpinning]="loading()">
        @if (filteredLogs().length > 0) {
          <nz-timeline [nzMode]="mode()">
            @for (log of filteredLogs(); track log.id) {
              <nz-timeline-item [nzColor]="getActionColor(log.action)" [nzDot]="actionDotTemplate">
                <ng-template #actionDotTemplate>
                  <span nz-icon [nzType]="getActionIcon(log.action)" [style.color]="getActionColorHex(log.action)"></span>
                </ng-template>

                <div class="timeline-item">
                  <div class="timeline-header">
                    <div class="actor-info">
                      <nz-avatar [nzSize]="24" nzIcon="user"></nz-avatar>
                      <span class="actor-name">{{ log.actor_name || '系統' }}</span>
                    </div>
                    <span class="timestamp" nz-tooltip [nzTooltipTitle]="log.created_at | date: 'yyyy-MM-dd HH:mm:ss'">
                      {{ getRelativeTime(log.created_at) }}
                    </span>
                  </div>

                  <div class="timeline-content">
                    <nz-tag [nzColor]="getActionColor(log.action)">
                      {{ getActionLabel(log.action) }}
                    </nz-tag>
                    <nz-tag>{{ getEntityTypeLabel(log.entity_type) }}</nz-tag>
                    @if (log.entity_name) {
                      <span class="entity-name">{{ log.entity_name }}</span>
                    }
                  </div>

                  @if (log.metadata?.changes_summary?.length) {
                    <div class="timeline-changes">
                      @for (change of log.metadata!.changes_summary!.slice(0, 3); track change) {
                        <div class="change-item">• {{ change }}</div>
                      }
                      @if (log.metadata!.changes_summary!.length > 3) {
                        <div class="more-changes"> +{{ log.metadata!.changes_summary!.length - 3 }} 更多變更 </div>
                      }
                    </div>
                  }
                </div>
              </nz-timeline-item>
            }
          </nz-timeline>

          @if (hasMore()) {
            <div class="load-more">
              <button nz-button nzType="default" (click)="loadMore()" [nzLoading]="loading()"> 載入更多 </button>
            </div>
          }
        } @else if (!loading()) {
          <nz-empty nzNotFoundContent="暫無活動記錄" nzNotFoundImage="simple">
            <ng-template #nzNotFoundFooter>
              <p class="text-muted">當藍圖有操作變更時，活動記錄將顯示在此</p>
            </ng-template>
          </nz-empty>
        }
      </nz-spin>
    </div>
  `,
  styles: [
    `
      .activity-timeline-container {
        padding: 0;
      }

      .timeline-filters {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        flex-wrap: wrap;
        align-items: center;
      }

      .timeline-item {
        padding-bottom: 8px;
      }

      .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .actor-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .actor-name {
        font-weight: 500;
        color: #333;
      }

      .timestamp {
        font-size: 12px;
        color: #999;
      }

      .timeline-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .entity-name {
        color: #1890ff;
        font-weight: 500;
      }

      .timeline-changes {
        margin-top: 8px;
        padding: 8px 12px;
        background: #fafafa;
        border-radius: 4px;
        font-size: 13px;
      }

      .change-item {
        color: #666;
        margin-bottom: 4px;
      }

      .change-item:last-child {
        margin-bottom: 0;
      }

      .more-changes {
        color: #999;
        font-size: 12px;
        font-style: italic;
      }

      .load-more {
        text-align: center;
        margin-top: 16px;
      }

      .text-muted {
        color: #999;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityTimelineComponent implements OnInit {
  private readonly auditLogService = inject(AuditLogService);

  /** Blueprint ID to filter logs */
  blueprintId = input.required<string>();

  /** Entity ID to filter logs (optional) */
  entityId = input<string>();

  /** Entity type to filter logs (optional) */
  entityType = input<AuditEntityType>();

  /** Maximum number of logs to display */
  limit = input<number>(20);

  /** Whether to show filter controls */
  showFilters = input<boolean>(true);

  /** Timeline mode: left, right, alternate, custom */
  mode = input<'left' | 'right' | 'alternate' | 'custom'>('left');

  /** Local state */
  logs = signal<AuditLog[]>([]);
  loading = signal(false);
  hasMore = signal(false);
  selectedAction: AuditAction | null = null;
  selectedEntityType: AuditEntityType | null = null;

  /** Action filter options */
  readonly actionOptions = Object.entries(AUDIT_ACTION_CONFIG).map(([value, config]) => ({
    value: value as AuditAction,
    label: config.label
  }));

  /** Entity type filter options */
  readonly entityTypeOptions = Object.entries(AUDIT_ENTITY_TYPE_CONFIG).map(([value, config]) => ({
    value: value as AuditEntityType,
    label: config.label
  }));

  /** Filtered logs based on local filters */
  readonly filteredLogs = computed(() => {
    let result = this.logs();

    if (this.selectedAction) {
      result = result.filter(log => log.action === this.selectedAction);
    }

    if (this.selectedEntityType) {
      result = result.filter(log => log.entity_type === this.selectedEntityType);
    }

    return result;
  });

  ngOnInit(): void {
    this.loadLogs();
  }

  /** Load audit logs for the blueprint */
  async loadLogs(): Promise<void> {
    this.loading.set(true);

    try {
      this.auditLogService.getByBlueprint(this.blueprintId(), this.limit()).subscribe({
        next: logs => {
          this.logs.set(logs);
          this.hasMore.set(logs.length >= this.limit());
          this.loading.set(false);
        },
        error: err => {
          console.error('[ActivityTimeline] Failed to load logs:', err);
          this.loading.set(false);
        }
      });
    } catch (err) {
      console.error('[ActivityTimeline] Error:', err);
      this.loading.set(false);
    }
  }

  /** Load more logs */
  loadMore(): void {
    const currentLimit = this.logs().length;
    const newLimit = currentLimit + this.limit();

    this.loading.set(true);

    this.auditLogService.getByBlueprint(this.blueprintId(), newLimit).subscribe({
      next: logs => {
        this.logs.set(logs);
        this.hasMore.set(logs.length >= newLimit);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  /** Handle filter change */
  onFilterChange(): void {
    // Filtering is done via computed signal
  }

  /** Clear all filters */
  clearFilters(): void {
    this.selectedAction = null;
    this.selectedEntityType = null;
  }

  /** Get action color for timeline dot */
  getActionColor(action: AuditAction): string {
    return AUDIT_ACTION_CONFIG[action]?.color || 'default';
  }

  /** Get action color hex value */
  getActionColorHex(action: AuditAction): string {
    const colorMap: Record<string, string> = {
      green: '#52c41a',
      blue: '#1890ff',
      red: '#ff4d4f',
      orange: '#faad14',
      cyan: '#13c2c2',
      purple: '#722ed1',
      default: '#666'
    };
    const color = AUDIT_ACTION_CONFIG[action]?.color || 'default';
    return colorMap[color] || colorMap['default'];
  }

  /** Get action icon */
  getActionIcon(action: AuditAction): string {
    return AUDIT_ACTION_CONFIG[action]?.icon || 'question-circle';
  }

  /** Get action label */
  getActionLabel(action: AuditAction): string {
    return AUDIT_ACTION_CONFIG[action]?.label || action;
  }

  /** Get entity type label */
  getEntityTypeLabel(entityType: AuditEntityType): string {
    return AUDIT_ENTITY_TYPE_CONFIG[entityType]?.label || entityType;
  }

  /** Get relative time string */
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return '剛剛';
    } else if (diffMins < 60) {
      return `${diffMins} 分鐘前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小時前`;
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      return date.toLocaleDateString('zh-TW');
    }
  }
}
