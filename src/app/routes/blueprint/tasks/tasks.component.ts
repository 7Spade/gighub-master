/**
 * Blueprint Tasks Component
 *
 * 藍圖任務管理組件
 * Blueprint task management component
 *
 * Displays and manages tasks for a specific blueprint.
 * This is a placeholder component for the Task module.
 *
 * @module routes/blueprint
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-blueprint-tasks',
  template: `
    <div class="tasks-container">
      <div class="header">
        <div class="header-left">
          <h3>任務管理 (Tasks)</h3>
          <span class="subtitle">施工進度追蹤的核心功能</span>
        </div>
        <div class="header-actions">
          <button nz-button nzType="primary" (click)="createTask()"> <span nz-icon nzType="plus"></span>新建任務 </button>
        </div>
      </div>

      <nz-spin [nzSpinning]="loading()">
        <nz-card [nzBordered]="false">
          @if (tasks().length === 0) {
            <nz-result nzStatus="info" nzTitle="任務模組" nzSubTitle="任務管理模組正在開發中，敬請期待！">
              <div nz-result-extra>
                <div class="feature-preview">
                  <h4>即將推出的功能：</h4>
                  <ul>
                    <li>📋 工項建立與管理</li>
                    <li>📊 多維度視圖（列表、看板、甘特圖、日曆）</li>
                    <li>👥 任務指派與協作</li>
                    <li>📈 進度追蹤與狀態管理</li>
                    <li>🔗 任務關聯（子任務、依賴關係）</li>
                    <li>📝 與施工日誌的整合</li>
                    <li>📅 工期排程與里程碑</li>
                  </ul>
                </div>
                <button nz-button nzType="default" (click)="goBack()">返回概覽</button>
              </div>
            </nz-result>
          } @else {
            <nz-table #taskTable [nzData]="tasks()" [nzShowPagination]="tasks().length > 10">
              <thead>
                <tr>
                  <th>任務名稱</th>
                  <th>狀態</th>
                  <th>優先級</th>
                  <th>負責人</th>
                  <th>截止日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                @for (task of taskTable.data; track task.id) {
                  <tr>
                    <td>{{ task.title }}</td>
                    <td
                      ><nz-tag [nzColor]="getStatusColor(task.status)">{{ task.status }}</nz-tag></td
                    >
                    <td
                      ><nz-tag [nzColor]="getPriorityColor(task.priority)">{{ task.priority }}</nz-tag></td
                    >
                    <td>{{ task.assignee || '-' }}</td>
                    <td>{{ task.due_date || '-' }}</td>
                    <td>
                      <button nz-button nzType="link">編輯</button>
                    </td>
                  </tr>
                }
              </tbody>
            </nz-table>
          }
        </nz-card>
      </nz-spin>
    </div>
  `,
  styles: [
    `
      .tasks-container {
        padding: 24px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
      }
      .header-left h3 {
        margin: 0 0 4px 0;
        font-size: 20px;
        font-weight: 600;
      }
      .subtitle {
        color: #666;
        font-size: 14px;
      }
      .feature-preview {
        text-align: left;
        background: #fafafa;
        padding: 16px 24px;
        border-radius: 8px;
        margin-bottom: 24px;
      }
      .feature-preview h4 {
        margin: 0 0 12px 0;
        color: #333;
      }
      .feature-preview ul {
        margin: 0;
        padding-left: 20px;
      }
      .feature-preview li {
        margin-bottom: 8px;
        color: #666;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NzButtonModule,
    NzCardModule,
    NzEmptyModule,
    NzIconModule,
    NzResultModule,
    NzSpinModule,
    NzTableModule,
    NzTagModule
  ]
})
export class BlueprintTasksComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);

  // Input from route param (using withComponentInputBinding)
  id = input.required<string>();

  // State
  tasks = signal<any[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadTasks();
  }

  async loadTasks(): Promise<void> {
    // TODO: Implement task loading when task repository is available
    this.loading.set(true);
    try {
      // For now, return empty array as task module is not implemented
      this.tasks.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  createTask(): void {
    this.msg.info('任務建立功能即將推出');
  }

  goBack(): void {
    this.router.navigate(['/blueprint', this.id(), 'overview']);
  }

  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      pending: 'default',
      progress: 'processing',
      review: 'warning',
      completed: 'success',
      blocked: 'error',
      cancelled: 'default'
    };
    return colorMap[status] || 'default';
  }

  getPriorityColor(priority: string): string {
    const colorMap: Record<string, string> = {
      urgent: 'red',
      high: 'orange',
      medium: 'blue',
      low: 'default'
    };
    return colorMap[priority] || 'default';
  }
}
