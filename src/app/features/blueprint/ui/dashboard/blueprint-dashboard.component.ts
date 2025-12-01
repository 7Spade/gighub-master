/**
 * Blueprint Dashboard Component
 *
 * 藍圖儀表板組件
 *
 * @module features/blueprint/ui/dashboard
 */

import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';

import { TaskStore, DiaryStore, TodoStore } from '../../data-access';
import { TaskStatusLabels, TaskStatusColors } from '../../domain/enums';

@Component({
  selector: 'app-blueprint-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NzCardModule,
    NzGridModule,
    NzStatisticModule,
    NzProgressModule,
    NzListModule,
    NzEmptyModule,
    NzIconModule,
    NzTagModule,
    NzAvatarModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- 統計卡片 -->
      <div nz-row [nzGutter]="[16, 16]">
        <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <nz-card>
            <nz-statistic
              nzTitle="總任務數"
              [nzValue]="taskStore.taskCount()"
              [nzPrefix]="taskIcon"
            >
            </nz-statistic>
            <ng-template #taskIcon>
              <span nz-icon nzType="project" nzTheme="outline"></span>
            </ng-template>
          </nz-card>
        </div>

        <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <nz-card>
            <nz-statistic
              nzTitle="任務完成率"
              [nzValue]="taskStore.completionRate()"
              nzSuffix="%"
              [nzValueStyle]="{ color: taskStore.completionRate() >= 80 ? '#3f8600' : '#cf1322' }"
            >
            </nz-statistic>
            <nz-progress
              [nzPercent]="taskStore.completionRate()"
              [nzShowInfo]="false"
              nzSize="small"
            ></nz-progress>
          </nz-card>
        </div>

        <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <nz-card>
            <nz-statistic
              nzTitle="施工日誌"
              [nzValue]="diaryStore.diaryCount()"
              [nzPrefix]="diaryIcon"
            >
            </nz-statistic>
            <ng-template #diaryIcon>
              <span nz-icon nzType="file-text" nzTheme="outline"></span>
            </ng-template>
          </nz-card>
        </div>

        <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <nz-card>
            <nz-statistic
              nzTitle="待辦事項"
              [nzValue]="todoStore.pendingCount()"
              [nzPrefix]="todoIcon"
              [nzValueStyle]="{ color: todoStore.pendingCount() > 0 ? '#fa8c16' : '#3f8600' }"
            >
            </nz-statistic>
            <ng-template #todoIcon>
              <span nz-icon nzType="check-square" nzTheme="outline"></span>
            </ng-template>
          </nz-card>
        </div>
      </div>

      <!-- 進行中任務與最新日誌 -->
      <div nz-row [nzGutter]="[16, 16]" class="mt-4">
        <div nz-col [nzXs]="24" [nzMd]="12">
          <nz-card nzTitle="進行中任務" [nzExtra]="taskExtra">
            <ng-template #taskExtra>
              <a routerLink="../tasks">查看全部</a>
            </ng-template>

            @if (taskStore.inProgressTasks().length === 0) {
              <nz-empty nzNotFoundContent="暫無進行中任務"></nz-empty>
            } @else {
              <nz-list nzSize="small">
                @for (task of taskStore.inProgressTasks().slice(0, 5); track task.id) {
                  <nz-list-item>
                    <nz-list-item-meta
                      [nzTitle]="task.title"
                      [nzDescription]="task.description || '無描述'"
                    >
                      <nz-list-item-meta-avatar>
                        <nz-avatar nzIcon="project" [nzSize]="32"></nz-avatar>
                      </nz-list-item-meta-avatar>
                    </nz-list-item-meta>
                    <nz-tag [nzColor]="getStatusColor(task.status)">
                      {{ getStatusLabel(task.status) }}
                    </nz-tag>
                  </nz-list-item>
                }
              </nz-list>
            }
          </nz-card>
        </div>

        <div nz-col [nzXs]="24" [nzMd]="12">
          <nz-card nzTitle="最新施工日誌" [nzExtra]="diaryExtra">
            <ng-template #diaryExtra>
              <a routerLink="../diary">查看全部</a>
            </ng-template>

            @if (!diaryStore.latestDiary()) {
              <nz-empty nzNotFoundContent="暫無施工日誌"></nz-empty>
            } @else {
              @if (diaryStore.latestDiary(); as diary) {
                <div class="latest-diary">
                  <div class="diary-date">
                    <span nz-icon nzType="calendar"></span>
                    {{ diary.work_date }}
                  </div>
                  @if (diary.weather) {
                    <nz-tag nzColor="blue">{{ diary.weather }}</nz-tag>
                  }
                  @if (diary.summary) {
                    <p class="diary-summary">{{ diary.summary }}</p>
                  }
                  <div class="diary-stats">
                    @if (diary.work_hours) {
                      <span><strong>工時：</strong>{{ diary.work_hours }} 小時</span>
                    }
                    @if (diary.worker_count) {
                      <span><strong>人數：</strong>{{ diary.worker_count }} 人</span>
                    }
                  </div>
                </div>
              }
            }
          </nz-card>
        </div>
      </div>

      <!-- 待辦事項與逾期提醒 -->
      <div nz-row [nzGutter]="[16, 16]" class="mt-4">
        <div nz-col [nzXs]="24" [nzMd]="12">
          <nz-card nzTitle="待辦事項" [nzExtra]="todoExtra">
            <ng-template #todoExtra>
              <a routerLink="../todo">查看全部</a>
            </ng-template>

            @if (todoStore.pendingTodos().length === 0) {
              <nz-empty nzNotFoundContent="暫無待辦事項"></nz-empty>
            } @else {
              <nz-list nzSize="small">
                @for (todo of todoStore.pendingTodos().slice(0, 5); track todo.id) {
                  <nz-list-item>
                    <nz-list-item-meta [nzTitle]="todo.title">
                      <nz-list-item-meta-avatar>
                        <span nz-icon nzType="check-square" nzTheme="outline"></span>
                      </nz-list-item-meta-avatar>
                    </nz-list-item-meta>
                    @if (todo.due_date) {
                      <nz-tag [nzColor]="isOverdue(todo.due_date) ? 'red' : 'default'">
                        {{ todo.due_date }}
                      </nz-tag>
                    }
                  </nz-list-item>
                }
              </nz-list>
            }
          </nz-card>
        </div>

        <div nz-col [nzXs]="24" [nzMd]="12">
          <nz-card nzTitle="逾期提醒" nzType="inner">
            @if (todoStore.overdueTodos().length === 0) {
              <nz-empty nzNotFoundContent="無逾期項目 👍"></nz-empty>
            } @else {
              <nz-list nzSize="small">
                @for (todo of todoStore.overdueTodos(); track todo.id) {
                  <nz-list-item>
                    <nz-list-item-meta [nzTitle]="todo.title">
                      <nz-list-item-meta-avatar>
                        <span nz-icon nzType="warning" nzTheme="twotone" [nzTwotoneColor]="'#f5222d'"></span>
                      </nz-list-item-meta-avatar>
                    </nz-list-item-meta>
                    <nz-tag nzColor="red">{{ todo.due_date }}</nz-tag>
                  </nz-list-item>
                }
              </nz-list>
            }
          </nz-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1400px;
    }

    .mt-4 {
      margin-top: 16px;
    }

    .latest-diary {
      .diary-date {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 8px;

        span {
          margin-right: 8px;
        }
      }

      .diary-summary {
        margin: 12px 0;
        color: #666;
      }

      .diary-stats {
        display: flex;
        gap: 16px;
        color: #666;
        font-size: 13px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlueprintDashboardComponent {
  readonly taskStore = inject(TaskStore);
  readonly diaryStore = inject(DiaryStore);
  readonly todoStore = inject(TodoStore);

  getStatusLabel(status: string): string {
    return TaskStatusLabels[status as keyof typeof TaskStatusLabels] ?? status;
  }

  getStatusColor(status: string): string {
    return TaskStatusColors[status as keyof typeof TaskStatusColors] ?? 'default';
  }

  isOverdue(dueDate: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
  }
}
