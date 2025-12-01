/**
 * Diary List Component
 *
 * 施工日誌列表組件
 *
 * @module features/blueprint/ui/diary
 */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';

import { DiaryStore } from '../../data-access';
import { Diary, WeatherTypeLabels, WeatherTypeIcons } from '../../domain';

@Component({
  selector: 'app-diary-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzListModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzDatePickerModule,
    NzEmptyModule,
    NzSpinModule,
    NzAvatarModule
  ],
  template: `
    <div class="diary-list-container">
      <!-- 工具列 -->
      <div class="toolbar">
        <button nz-button nzType="primary" (click)="openCreateModal()">
          <span nz-icon nzType="plus"></span>
          新增日誌
        </button>

        <nz-range-picker
          [(ngModel)]="dateRange"
          (ngModelChange)="onDateRangeChange()"
        ></nz-range-picker>
      </div>

      <!-- 統計卡片 -->
      <div class="stats-row">
        <nz-card nzSize="small">
          <div class="stat-item">
            <span class="stat-value">{{ diaryStore.diaryCount() }}</span>
            <span class="stat-label">日誌總數</span>
          </div>
        </nz-card>
        <nz-card nzSize="small">
          <div class="stat-item">
            <span class="stat-value">{{ diaryStore.totalWorkHours() | number:'1.1-1' }}</span>
            <span class="stat-label">總工時（小時）</span>
          </div>
        </nz-card>
        <nz-card nzSize="small">
          <div class="stat-item">
            <span class="stat-value">{{ diaryStore.averageWorkerCount() }}</span>
            <span class="stat-label">平均人數</span>
          </div>
        </nz-card>
      </div>

      <!-- 日誌列表 -->
      <nz-spin [nzSpinning]="diaryStore.loading()">
        @if (diaryStore.diaries().length === 0 && !diaryStore.loading()) {
          <nz-empty nzNotFoundContent="暫無施工日誌">
            <ng-template #nzNotFoundFooter>
              <button nz-button nzType="primary" (click)="openCreateModal()">
                建立第一個日誌
              </button>
            </ng-template>
          </nz-empty>
        } @else {
          <nz-list nzItemLayout="vertical" [nzDataSource]="diaryStore.diaries()">
            @for (diary of diaryStore.diaries(); track diary.id) {
              <nz-list-item [nzExtra]="diaryExtra">
                <nz-list-item-meta>
                  <nz-list-item-meta-avatar>
                    <nz-avatar nzIcon="file-text" [nzSize]="48"></nz-avatar>
                  </nz-list-item-meta-avatar>
                  <nz-list-item-meta-title>
                    <span class="diary-date">{{ diary.work_date }}</span>
                    @if (diary.weather) {
                      <nz-tag nzColor="blue">
                        {{ getWeatherIcon(diary.weather) }} {{ getWeatherLabel(diary.weather) }}
                      </nz-tag>
                    }
                    @if (diary.temperature_min !== null && diary.temperature_max !== null) {
                      <span class="temperature">
                        {{ diary.temperature_min }}°C ~ {{ diary.temperature_max }}°C
                      </span>
                    }
                  </nz-list-item-meta-title>
                  <nz-list-item-meta-description>
                    <div class="diary-stats">
                      @if (diary.work_hours) {
                        <span><span nz-icon nzType="clock-circle"></span> {{ diary.work_hours }} 小時</span>
                      }
                      @if (diary.worker_count) {
                        <span><span nz-icon nzType="team"></span> {{ diary.worker_count }} 人</span>
                      }
                    </div>
                  </nz-list-item-meta-description>
                </nz-list-item-meta>

                @if (diary.summary) {
                  <div class="diary-summary">{{ diary.summary }}</div>
                }

                <ng-template #diaryExtra>
                  <div class="diary-actions">
                    <button nz-button nzType="text" (click)="viewDiary(diary)">
                      <span nz-icon nzType="eye"></span>
                    </button>
                    <button nz-button nzType="text" (click)="editDiary(diary)">
                      <span nz-icon nzType="edit"></span>
                    </button>
                    <button nz-button nzType="text" nzDanger (click)="deleteDiary(diary)">
                      <span nz-icon nzType="delete"></span>
                    </button>
                  </div>
                </ng-template>
              </nz-list-item>
            }
          </nz-list>
        }
      </nz-spin>
    </div>
  `,
  styles: [`
    .diary-list-container {
      background: #fff;
      padding: 24px;
      border-radius: 4px;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;

      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: #1890ff;
      }

      .stat-label {
        font-size: 12px;
        color: #999;
        margin-top: 4px;
      }
    }

    .diary-date {
      font-weight: 500;
      margin-right: 8px;
    }

    .temperature {
      color: #666;
      font-size: 12px;
      margin-left: 8px;
    }

    .diary-stats {
      display: flex;
      gap: 16px;
      color: #666;
      font-size: 13px;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .diary-summary {
      margin-top: 12px;
      color: #333;
      line-height: 1.6;
    }

    .diary-actions {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiaryListComponent {
  readonly diaryStore = inject(DiaryStore);
  private readonly modal = inject(NzModalService);
  private readonly msg = inject(NzMessageService);

  dateRange: Date[] = [];

  getWeatherLabel(weather: string): string {
    return WeatherTypeLabels[weather as keyof typeof WeatherTypeLabels] ?? weather;
  }

  getWeatherIcon(weather: string): string {
    return WeatherTypeIcons[weather as keyof typeof WeatherTypeIcons] ?? '🌤️';
  }

  onDateRangeChange(): void {
    // TODO: 實作日期篩選
    this.msg.info('日期篩選功能開發中');
  }

  openCreateModal(): void {
    this.msg.info('新增日誌功能開發中');
  }

  viewDiary(diary: Diary): void {
    this.msg.info(`查看日誌: ${diary.work_date}`);
  }

  editDiary(diary: Diary): void {
    this.msg.info(`編輯日誌: ${diary.work_date}`);
  }

  async deleteDiary(diary: Diary): Promise<void> {
    this.modal.confirm({
      nzTitle: '確認刪除',
      nzContent: `確定要刪除 ${diary.work_date} 的施工日誌嗎？`,
      nzOkText: '刪除',
      nzOkDanger: true,
      nzOnOk: async () => {
        try {
          await this.diaryStore.deleteDiary(diary.id);
          this.msg.success('日誌已刪除');
        } catch {
          this.msg.error('刪除失敗');
        }
      }
    });
  }
}
