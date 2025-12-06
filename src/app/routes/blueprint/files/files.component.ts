/**
 * File Management Component
 *
 * 檔案管理組件
 * File management component
 *
 * Features:
 * - File list with folder navigation
 * - File upload with drag-and-drop
 * - Create folder functionality
 * - File preview and download
 * - File operations (rename, delete)
 * - Breadcrumb navigation
 *
 * @module routes/blueprint/files
 */

import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';

import { FileEntity, FileCategory, UploadProgress } from '../../../core/infra/types/file';
import { FileService } from '../../../shared/services/file/file.service';

@Component({
  selector: 'app-blueprint-files',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    NzCardModule,
    NzButtonModule,
    NzCheckboxModule,
    NzTableModule,
    NzTagModule,
    NzIconModule,
    NzSpinModule,
    NzEmptyModule,
    NzInputModule,
    NzStatisticModule,
    NzGridModule,
    NzDrawerModule,
    NzFormModule,
    NzPopconfirmModule,
    NzToolTipModule,
    NzProgressModule,
    NzUploadModule,
    NzBreadCrumbModule,
    NzDropDownModule,
    NzModalModule,
    NzListModule,
    NzDividerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-spin [nzSpinning]="fileService.loading()">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button nz-button nzType="text" (click)="goBack()">
            <span nz-icon nzType="arrow-left"></span>
          </button>
          <h2>檔案管理</h2>
        </div>
        <div class="header-right">
          <button nz-button (click)="openCreateFolderModal()">
            <span nz-icon nzType="folder-add"></span>
            新增資料夾
          </button>
          <nz-upload [nzAction]="''" [nzBeforeUpload]="beforeUpload" [nzMultiple]="true" [nzShowUploadList]="false">
            <button nz-button nzType="primary">
              <span nz-icon nzType="upload"></span>
              上傳檔案
            </button>
          </nz-upload>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div nz-row [nzGutter]="16" class="stats-row">
        <div nz-col [nzXs]="12" [nzSm]="6" [nzMd]="4">
          <nz-card class="stat-card total" [nzBordered]="false">
            <nz-statistic [nzValue]="totalFiles()" nzTitle="總檔案數" [nzPrefix]="totalPrefix"></nz-statistic>
            <ng-template #totalPrefix><span nz-icon nzType="file"></span></ng-template>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzSm]="6" [nzMd]="4">
          <nz-card class="stat-card folders" [nzBordered]="false">
            <nz-statistic [nzValue]="totalFolders()" nzTitle="資料夾" [nzPrefix]="folderPrefix"></nz-statistic>
            <ng-template #folderPrefix><span nz-icon nzType="folder"></span></ng-template>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzSm]="6" [nzMd]="4">
          <nz-card class="stat-card images" [nzBordered]="false">
            <nz-statistic [nzValue]="imageCount()" nzTitle="圖片" [nzPrefix]="imagePrefix"></nz-statistic>
            <ng-template #imagePrefix><span nz-icon nzType="file-image"></span></ng-template>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzSm]="6" [nzMd]="4">
          <nz-card class="stat-card docs" [nzBordered]="false">
            <nz-statistic [nzValue]="documentCount()" nzTitle="文件" [nzPrefix]="docPrefix"></nz-statistic>
            <ng-template #docPrefix><span nz-icon nzType="file-text"></span></ng-template>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzSm]="6" [nzMd]="4">
          <nz-card class="stat-card size" [nzBordered]="false">
            <nz-statistic [nzValue]="totalSize()" nzTitle="總大小" [nzPrefix]="sizePrefix"></nz-statistic>
            <ng-template #sizePrefix><span nz-icon nzType="database"></span></ng-template>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzSm]="6" [nzMd]="4">
          <nz-card class="stat-card selected" [nzBordered]="false">
            <nz-statistic [nzValue]="fileService.selectedCount()" nzTitle="已選擇" [nzPrefix]="selectedPrefix"></nz-statistic>
            <ng-template #selectedPrefix><span nz-icon nzType="check-square"></span></ng-template>
          </nz-card>
        </div>
      </div>

      <!-- Breadcrumb Navigation -->
      <nz-card class="breadcrumb-card" [nzBordered]="false">
        <nz-breadcrumb>
          <nz-breadcrumb-item>
            <a (click)="navigateToRoot()">
              <span nz-icon nzType="home"></span>
              根目錄
            </a>
          </nz-breadcrumb-item>
          @for (crumb of fileService.breadcrumbs(); track crumb.id) {
            <nz-breadcrumb-item>
              <a (click)="navigateToBreadcrumb(crumb)">{{ crumb.name }}</a>
            </nz-breadcrumb-item>
          }
        </nz-breadcrumb>
      </nz-card>

      <!-- Upload Progress -->
      @if (fileService.isUploading()) {
        <nz-card class="upload-progress-card" [nzBordered]="false">
          <h4>上傳中...</h4>
          @for (progress of fileService.uploadProgressList(); track progress.fileName) {
            <div class="upload-item">
              <span class="file-name">{{ progress.fileName }}</span>
              <nz-progress
                [nzPercent]="progress.percent"
                [nzStatus]="progress.status === 'error' ? 'exception' : progress.status === 'success' ? 'success' : 'active'"
                [nzShowInfo]="true"
              ></nz-progress>
            </div>
          }
        </nz-card>
      }

      <!-- File List -->
      <nz-card class="table-card" [nzBordered]="false">
        @if (fileService.files().length === 0 && !fileService.loading()) {
          <nz-empty nzNotFoundContent="此資料夾為空">
            <ng-template #nzNotFoundFooter>
              <div class="empty-actions">
                <button nz-button (click)="openCreateFolderModal()">
                  <span nz-icon nzType="folder-add"></span>
                  新增資料夾
                </button>
                <nz-upload [nzAction]="''" [nzBeforeUpload]="beforeUpload" [nzMultiple]="true" [nzShowUploadList]="false">
                  <button nz-button nzType="primary">
                    <span nz-icon nzType="upload"></span>
                    上傳檔案
                  </button>
                </nz-upload>
              </div>
            </ng-template>
          </nz-empty>
        } @else {
          <nz-table
            #fileTable
            [nzData]="fileService.files()"
            [nzFrontPagination]="true"
            [nzPageSize]="20"
            [nzShowSizeChanger]="true"
            [nzPageSizeOptions]="[10, 20, 50, 100]"
            nzSize="middle"
          >
            <thead>
              <tr>
                <th nzWidth="40px">
                  <label nz-checkbox [ngModel]="isAllSelected()" (ngModelChange)="toggleSelectAll($event)"></label>
                </th>
                <th>名稱</th>
                <th nzWidth="100px">類型</th>
                <th nzWidth="100px">大小</th>
                <th nzWidth="160px">修改日期</th>
                <th nzWidth="140px" nzAlign="center">操作</th>
              </tr>
            </thead>
            <tbody>
              @for (file of fileTable.data; track file.id) {
                <tr class="file-row" [class.selected]="isFileSelected(file.id)" (dblclick)="onFileDoubleClick(file)">
                  <td (click)="$event.stopPropagation()">
                    <label nz-checkbox [ngModel]="isFileSelected(file.id)" (ngModelChange)="toggleFileSelection(file.id, $event)"></label>
                  </td>
                  <td>
                    <div class="file-name-cell">
                      <span nz-icon [nzType]="getFileIcon(file)" class="file-icon" [class.folder]="file.is_folder"></span>
                      <span class="file-name">{{ file.display_name || file.file_name }}</span>
                    </div>
                  </td>
                  <td>
                    @if (file.is_folder) {
                      <nz-tag nzColor="blue">資料夾</nz-tag>
                    } @else {
                      <nz-tag>{{ getFileType(file) }}</nz-tag>
                    }
                  </td>
                  <td>
                    @if (file.is_folder) {
                      <span class="text-muted">-</span>
                    } @else {
                      {{ formatFileSize(file.file_size) }}
                    }
                  </td>
                  <td>{{ file.updated_at | date: 'yyyy-MM-dd HH:mm' }}</td>
                  <td nzAlign="center" (click)="$event.stopPropagation()">
                    <div class="action-buttons">
                      @if (!file.is_folder) {
                        <button nz-button nzType="link" nzSize="small" (click)="downloadFile(file)" nz-tooltip="下載">
                          <span nz-icon nzType="download"></span>
                        </button>
                      }
                      <button nz-button nzType="link" nzSize="small" (click)="renameFile(file)" nz-tooltip="重新命名">
                        <span nz-icon nzType="edit"></span>
                      </button>
                      <button
                        nz-button
                        nzType="link"
                        nzDanger
                        nzSize="small"
                        nz-popconfirm
                        [nzPopconfirmTitle]="file.is_folder ? '確定刪除此資料夾？' : '確定刪除此檔案？'"
                        (nzOnConfirm)="deleteFile(file)"
                        nz-tooltip="刪除"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        }
      </nz-card>
    </nz-spin>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding: 0 0 16px;
        border-bottom: 1px solid #f0f0f0;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .header-left h2 {
        margin: 0;
      }

      .header-right {
        display: flex;
        gap: 8px;
      }

      .stats-row {
        margin-bottom: 16px;
      }

      .stat-card {
        text-align: center;
        border-radius: 8px;
      }

      .stat-card.total ::ng-deep .ant-statistic-content {
        color: #1890ff;
      }

      .stat-card.folders ::ng-deep .ant-statistic-content {
        color: #faad14;
      }

      .stat-card.images ::ng-deep .ant-statistic-content {
        color: #722ed1;
      }

      .stat-card.docs ::ng-deep .ant-statistic-content {
        color: #13c2c2;
      }

      .stat-card.size ::ng-deep .ant-statistic-content {
        color: #eb2f96;
      }

      .stat-card.selected ::ng-deep .ant-statistic-content {
        color: #52c41a;
      }

      .breadcrumb-card {
        margin-bottom: 16px;
      }

      .upload-progress-card {
        margin-bottom: 16px;
      }

      .upload-item {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 8px;
      }

      .upload-item .file-name {
        min-width: 200px;
      }

      .upload-item nz-progress {
        flex: 1;
      }

      .table-card {
        margin-bottom: 24px;
      }

      .file-row {
        cursor: pointer;
      }

      .file-row:hover {
        background-color: #fafafa;
      }

      .file-row.selected {
        background-color: #e6f7ff;
      }

      .file-name-cell {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .file-icon {
        font-size: 18px;
        color: #8c8c8c;
      }

      .file-icon.folder {
        color: #faad14;
      }

      .file-name {
        font-weight: 500;
      }

      .action-buttons {
        display: flex;
        gap: 4px;
      }

      .text-muted {
        color: #8c8c8c;
      }

      .empty-actions {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-top: 16px;
      }
    `
  ]
})
export class BlueprintFilesComponent implements OnInit {
  readonly fileService = inject(FileService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // Computed
  readonly blueprintId = computed(() => this.route.snapshot.paramMap.get('id'));

  // Statistics
  readonly totalFiles = computed(() => this.fileService.filesOnly().length);
  readonly totalFolders = computed(() => this.fileService.folders().length);
  readonly imageCount = computed(() => this.fileService.filesOnly().filter(f => this.getFileCategory(f) === FileCategory.IMAGE).length);
  readonly documentCount = computed(
    () => this.fileService.filesOnly().filter(f => this.getFileCategory(f) === FileCategory.DOCUMENT).length
  );
  readonly totalSize = computed(() => {
    const bytes = this.fileService.filesOnly().reduce((sum, f) => sum + (f.file_size || 0), 0);
    return this.formatFileSize(bytes);
  });

  ngOnInit(): void {
    const blueprintId = this.blueprintId();
    if (blueprintId) {
      this.fileService.setBlueprint(blueprintId);
    }
  }

  // File Operations
  beforeUpload = (file: NzUploadFile): boolean => {
    const blueprintId = this.blueprintId();
    if (!blueprintId) {
      this.msg.error('無法確認藍圖');
      return false;
    }

    // Upload the file using FileService
    const rawFile = file as NzUploadFile & { originFileObj?: File };
    if (rawFile.originFileObj) {
      this.uploadFile(rawFile.originFileObj);
    }

    return false; // Prevent automatic upload
  };

  async uploadFile(file: File): Promise<void> {
    const blueprintId = this.blueprintId();
    if (!blueprintId) return;

    try {
      await this.fileService.uploadFile(file, {
        blueprintId,
        folderId: this.fileService.currentFolderId()
      });
      this.msg.success(`${file.name} 上傳成功`);
    } catch (err) {
      this.msg.error(`${file.name} 上傳失敗`);
    }
  }

  async downloadFile(file: FileEntity): Promise<void> {
    try {
      const url = await this.fileService.getDownloadUrl(file);
      if (url) {
        window.open(url, '_blank');
      } else {
        this.msg.error('無法取得下載連結');
      }
    } catch (err) {
      this.msg.error('下載失敗');
    }
  }

  renameFile(file: FileEntity): void {
    const currentName = file.display_name || file.file_name;
    this.modal.confirm({
      nzTitle: '重新命名',
      nzContent: `
        <input type="text" id="rename-input" value="${currentName}" style="width: 100%; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px;">
      `,
      nzOnOk: async () => {
        const input = document.getElementById('rename-input') as HTMLInputElement;
        const newName = input?.value?.trim();
        if (newName && newName !== currentName) {
          const success = await this.fileService.rename(file.id, newName);
          if (success) {
            this.msg.success('重新命名成功');
          } else {
            this.msg.error('重新命名失敗');
          }
        }
      }
    });
  }

  async deleteFile(file: FileEntity): Promise<void> {
    const success = await this.fileService.delete(file.id);
    if (success) {
      this.msg.success(file.is_folder ? '資料夾已刪除' : '檔案已刪除');
    } else {
      this.msg.error('刪除失敗');
    }
  }

  // Folder Operations
  openCreateFolderModal(): void {
    let folderName = '';
    this.modal.confirm({
      nzTitle: '新增資料夾',
      nzContent: `
        <input type="text" id="folder-name-input" placeholder="資料夾名稱" style="width: 100%; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px;">
      `,
      nzOnOk: async () => {
        const input = document.getElementById('folder-name-input') as HTMLInputElement;
        folderName = input?.value?.trim() || '';
        if (folderName) {
          const success = await this.fileService.createFolder(folderName);
          if (success) {
            this.msg.success('資料夾已建立');
          } else {
            this.msg.error('建立資料夾失敗');
          }
        }
      }
    });
  }

  onFileDoubleClick(file: FileEntity): void {
    if (file.is_folder) {
      this.fileService.navigateToFolder(file.id);
    } else {
      // Preview or download
      this.downloadFile(file);
    }
  }

  // Navigation
  navigateToRoot(): void {
    this.fileService.navigateToFolder(null);
  }

  navigateToBreadcrumb(crumb: { id: string | null; name: string }): void {
    this.fileService.navigateToFolder(crumb.id);
  }

  goBack(): void {
    const blueprintId = this.blueprintId();
    if (blueprintId) {
      this.router.navigate(['/blueprint', blueprintId, 'overview']);
    } else {
      this.router.navigate(['/blueprint/list']);
    }
  }

  // Selection
  isFileSelected(fileId: string): boolean {
    return this.fileService.selectedFiles().has(fileId);
  }

  isAllSelected(): boolean {
    const files = this.fileService.files();
    const selected = this.fileService.selectedFiles();
    return files.length > 0 && files.every(f => selected.has(f.id));
  }

  toggleFileSelection(fileId: string, selected: boolean): void {
    if (selected) {
      this.fileService.select(fileId);
    } else {
      this.fileService.deselect(fileId);
    }
  }

  toggleSelectAll(selected: boolean): void {
    if (selected) {
      this.fileService.selectAll();
    } else {
      this.fileService.clearSelection();
    }
  }

  // Utility Methods
  getFileIcon(file: FileEntity): string {
    if (file.is_folder) return 'folder';

    const category = this.getFileCategory(file);
    switch (category) {
      case FileCategory.IMAGE:
        return 'file-image';
      case FileCategory.DOCUMENT:
        return 'file-text';
      case FileCategory.VIDEO:
        return 'video-camera';
      case FileCategory.AUDIO:
        return 'sound';
      case FileCategory.ARCHIVE:
        return 'file-zip';
      default:
        return 'file';
    }
  }

  getFileType(file: FileEntity): string {
    if (!file.mime_type) return '未知';

    const category = this.getFileCategory(file);
    switch (category) {
      case FileCategory.IMAGE:
        return '圖片';
      case FileCategory.DOCUMENT:
        return '文件';
      case FileCategory.VIDEO:
        return '影片';
      case FileCategory.AUDIO:
        return '音訊';
      case FileCategory.ARCHIVE:
        return '壓縮檔';
      default:
        return '其他';
    }
  }

  getFileCategory(file: FileEntity): FileCategory {
    if (!file.mime_type) return FileCategory.OTHER;

    if (file.mime_type.startsWith('image/')) return FileCategory.IMAGE;
    if (
      file.mime_type.startsWith('text/') ||
      file.mime_type.includes('pdf') ||
      file.mime_type.includes('document') ||
      file.mime_type.includes('spreadsheet') ||
      file.mime_type.includes('presentation')
    )
      return FileCategory.DOCUMENT;
    if (file.mime_type.startsWith('video/')) return FileCategory.VIDEO;
    if (file.mime_type.startsWith('audio/')) return FileCategory.AUDIO;
    if (file.mime_type.includes('zip') || file.mime_type.includes('rar') || file.mime_type.includes('tar') || file.mime_type.includes('gz'))
      return FileCategory.ARCHIVE;

    return FileCategory.OTHER;
  }

  formatFileSize(bytes: number | null | undefined): string {
    if (!bytes || bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let size = bytes;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}
