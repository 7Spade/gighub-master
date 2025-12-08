/**
 * Blueprint Permission Management Component
 *
 * 藍圖權限管理元件
 * Manage roles and permissions for a blueprint
 *
 * Features:
 * - Role list and management
 * - Permission matrix view
 * - Member role assignment
 * - Custom role creation
 *
 * @module routes/blueprint/permissions
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  memberCount: number;
  permissions: Record<string, boolean>;
  createdAt: Date;
}

interface Permission {
  key: string;
  name: string;
  description: string;
  category: string;
}

interface PermissionCategory {
  key: string;
  name: string;
  icon: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-blueprint-permissions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NzPageHeaderModule,
    NzBreadCrumbModule,
    NzCardModule,
    NzGridModule,
    NzButtonModule,
    NzIconModule,
    NzTableModule,
    NzTabsModule,
    NzTagModule,
    NzStatisticModule,
    NzEmptyModule,
    NzSpinModule,
    NzToolTipModule,
    NzDrawerModule,
    NzFormModule,
    NzInputModule,
    NzSwitchModule,
    NzCheckboxModule,
    NzDescriptionsModule,
    NzDividerModule
  ],
  template: `
    <nz-page-header nzBackIcon [nzGhost]="false" (nzBack)="goBack()">
      <nz-breadcrumb nz-page-header-breadcrumb>
        <nz-breadcrumb-item><a [routerLink]="['/blueprint', blueprintId(), 'overview']">藍圖概覽</a></nz-breadcrumb-item>
        <nz-breadcrumb-item>權限管理</nz-breadcrumb-item>
      </nz-breadcrumb>
      <nz-page-header-title>權限管理</nz-page-header-title>
      <nz-page-header-subtitle>管理角色和權限設定</nz-page-header-subtitle>
      <nz-page-header-extra>
        <button nz-button nzType="primary" (click)="openCreateRoleDrawer()">
          <span nz-icon nzType="plus"></span>
          新增角色
        </button>
      </nz-page-header-extra>
    </nz-page-header>

    <!-- Statistics Cards -->
    <div class="permission-container">
      <nz-card [nzBordered]="false" style="margin-bottom: 16px;">
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="6">
            <nz-statistic nzTitle="角色總數" [nzValue]="roles().length"></nz-statistic>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-statistic nzTitle="系統角色" [nzValue]="systemRoleCount()"></nz-statistic>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-statistic nzTitle="自訂角色" [nzValue]="customRoleCount()"></nz-statistic>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-statistic nzTitle="權限項目" [nzValue]="totalPermissions()"></nz-statistic>
          </div>
        </div>
      </nz-card>

      <nz-spin [nzSpinning]="loading()">
        <nz-tabs nzType="card">
          <!-- Roles Tab -->
          <nz-tab nzTitle="角色列表">
            <nz-card [nzBordered]="false" [nzBodyStyle]="{ padding: 0 }">
              <nz-table #rolesTable [nzData]="roles()" [nzFrontPagination]="false" [nzShowPagination]="false" nzSize="middle">
                <thead>
                  <tr>
                    <th nzWidth="200px">角色名稱</th>
                    <th>描述</th>
                    <th nzWidth="100px" nzAlign="center">類型</th>
                    <th nzWidth="100px" nzAlign="center">成員數</th>
                    <th nzWidth="100px" nzAlign="center">權限數</th>
                    <th nzWidth="180px" nzAlign="center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  @for (role of rolesTable.data; track role.id) {
                    <tr>
                      <td>
                        <div class="role-info">
                          <span nz-icon [nzType]="role.isSystem ? 'safety-certificate' : 'team'" class="role-icon"></span>
                          <span class="role-name">{{ role.name }}</span>
                        </div>
                      </td>
                      <td>{{ role.description }}</td>
                      <td nzAlign="center">
                        <nz-tag [nzColor]="role.isSystem ? 'blue' : 'green'">
                          {{ role.isSystem ? '系統' : '自訂' }}
                        </nz-tag>
                      </td>
                      <td nzAlign="center">{{ role.memberCount }}</td>
                      <td nzAlign="center">{{ getPermissionCount(role) }}</td>
                      <td nzAlign="center">
                        <button nz-button nzType="link" nzSize="small" (click)="viewRoleDetails(role)">
                          <span nz-icon nzType="eye"></span>
                          檢視
                        </button>
                        @if (!role.isSystem) {
                          <nz-divider nzType="vertical"></nz-divider>
                          <button nz-button nzType="link" nzSize="small" (click)="editRole(role)">
                            <span nz-icon nzType="edit"></span>
                            編輯
                          </button>
                          <nz-divider nzType="vertical"></nz-divider>
                          <button nz-button nzType="link" nzSize="small" nzDanger (click)="deleteRole(role)">
                            <span nz-icon nzType="delete"></span>
                            刪除
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </nz-table>
            </nz-card>
          </nz-tab>

          <!-- Permission Matrix Tab -->
          <nz-tab nzTitle="權限矩陣">
            <nz-card [nzBordered]="false" [nzBodyStyle]="{ padding: 0 }">
              <div class="permission-matrix">
                <table class="matrix-table">
                  <thead>
                    <tr>
                      <th class="category-header">權限分類</th>
                      <th class="permission-header">權限名稱</th>
                      @for (role of roles(); track role.id) {
                        <th class="role-header" nz-tooltip [nzTooltipTitle]="role.description">
                          {{ role.name }}
                        </th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (category of permissionCategories; track category.key) {
                      @for (permission of category.permissions; track permission.key; let first = $first) {
                        <tr>
                          @if (first) {
                            <td class="category-cell" [attr.rowspan]="category.permissions.length">
                              <span nz-icon [nzType]="category.icon"></span>
                              {{ category.name }}
                            </td>
                          }
                          <td class="permission-cell" nz-tooltip [nzTooltipTitle]="permission.description">
                            {{ permission.name }}
                          </td>
                          @for (role of roles(); track role.id) {
                            <td class="check-cell">
                              <nz-switch
                                [ngModel]="role.permissions[permission.key] || false"
                                [nzDisabled]="role.isSystem"
                                (ngModelChange)="onPermissionChange(role, permission.key, $event)"
                                nzSize="small"
                              ></nz-switch>
                            </td>
                          }
                        </tr>
                      }
                    }
                  </tbody>
                </table>
              </div>
            </nz-card>
          </nz-tab>
        </nz-tabs>
      </nz-spin>
    </div>

    <!-- Role Details Drawer -->
    <nz-drawer [nzVisible]="detailsDrawerVisible()" [nzWidth]="500" nzTitle="角色詳情" (nzOnClose)="closeDetailsDrawer()">
      @if (selectedRole()) {
        <ng-container *nzDrawerContent>
          <nz-descriptions nzBordered [nzColumn]="1">
            <nz-descriptions-item nzTitle="角色名稱">{{ selectedRole()?.name }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="描述">{{ selectedRole()?.description }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="類型">
              <nz-tag [nzColor]="selectedRole()?.isSystem ? 'blue' : 'green'">
                {{ selectedRole()?.isSystem ? '系統角色' : '自訂角色' }}
              </nz-tag>
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="成員數量">{{ selectedRole()?.memberCount }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="建立時間">{{ selectedRole()?.createdAt | date: 'yyyy-MM-dd HH:mm' }}</nz-descriptions-item>
          </nz-descriptions>

          <nz-divider nzText="權限列表"></nz-divider>

          @for (category of permissionCategories; track category.key) {
            <h4 class="permission-category-title">
              <span nz-icon [nzType]="category.icon"></span>
              {{ category.name }}
            </h4>
            <div class="permission-list">
              @for (permission of category.permissions; track permission.key) {
                <div class="permission-item">
                  <span class="permission-name">{{ permission.name }}</span>
                  @if (selectedRole()?.permissions?.[permission.key]) {
                    <nz-tag nzColor="success">已授權</nz-tag>
                  } @else {
                    <nz-tag nzColor="default">未授權</nz-tag>
                  }
                </div>
              }
            </div>
          }
        </ng-container>
      }
    </nz-drawer>

    <!-- Create/Edit Role Drawer -->
    <nz-drawer
      [nzVisible]="editDrawerVisible()"
      [nzWidth]="600"
      [nzTitle]="editingRole() ? '編輯角色' : '新增角色'"
      (nzOnClose)="closeEditDrawer()"
    >
      <ng-container *nzDrawerContent>
        <form nz-form nzLayout="vertical">
          <nz-form-item>
            <nz-form-label nzRequired>角色名稱</nz-form-label>
            <nz-form-control>
              <input nz-input placeholder="輸入角色名稱" [(ngModel)]="roleForm.name" name="name" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>描述</nz-form-label>
            <nz-form-control>
              <textarea
                nz-input
                placeholder="輸入角色描述"
                [(ngModel)]="roleForm.description"
                name="description"
                [nzAutosize]="{ minRows: 2, maxRows: 4 }"
              ></textarea>
            </nz-form-control>
          </nz-form-item>

          <nz-divider nzText="權限設定"></nz-divider>

          @for (category of permissionCategories; track category.key) {
            <nz-card [nzTitle]="categoryTpl" size="small" style="margin-bottom: 16px;">
              <ng-template #categoryTpl>
                <span nz-icon [nzType]="category.icon"></span>
                {{ category.name }}
              </ng-template>
              <div class="permission-checkboxes">
                @for (permission of category.permissions; track permission.key) {
                  <label
                    nz-checkbox
                    [(ngModel)]="roleForm.permissions[permission.key]"
                    [name]="permission.key"
                    nz-tooltip
                    [nzTooltipTitle]="permission.description"
                  >
                    {{ permission.name }}
                  </label>
                }
              </div>
            </nz-card>
          }
        </form>

        <div class="drawer-footer">
          <button nz-button (click)="closeEditDrawer()">取消</button>
          <button nz-button nzType="primary" (click)="saveRole()" [nzLoading]="saving()">
            {{ editingRole() ? '更新' : '建立' }}
          </button>
        </div>
      </ng-container>
    </nz-drawer>
  `,
  styles: [
    `
      .permission-container {
        padding: 24px;
      }

      .role-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .role-icon {
        font-size: 18px;
        color: #1890ff;
      }

      .role-name {
        font-weight: 500;
      }

      .permission-matrix {
        overflow-x: auto;
      }

      .matrix-table {
        width: 100%;
        border-collapse: collapse;
      }

      .matrix-table th,
      .matrix-table td {
        border: 1px solid #f0f0f0;
        padding: 12px;
        text-align: center;
      }

      .category-header {
        width: 150px;
        background: #fafafa;
        font-weight: 600;
      }

      .permission-header {
        width: 200px;
        background: #fafafa;
        font-weight: 600;
        text-align: left !important;
      }

      .role-header {
        min-width: 100px;
        background: #fafafa;
        font-weight: 600;
      }

      .category-cell {
        background: #f5f5f5;
        font-weight: 500;
        vertical-align: middle;
      }

      .permission-cell {
        text-align: left !important;
      }

      .check-cell {
        text-align: center;
      }

      .permission-category-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 16px 0 8px 0;
        font-weight: 600;
      }

      .permission-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
      }

      .permission-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: #fafafa;
        border-radius: 4px;
      }

      .permission-checkboxes {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .drawer-footer {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 16px 24px;
        background: #fff;
        border-top: 1px solid #f0f0f0;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlueprintPermissionsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  blueprintId = signal('');
  loading = signal(false);
  saving = signal(false);
  detailsDrawerVisible = signal(false);
  editDrawerVisible = signal(false);
  selectedRole = signal<Role | null>(null);
  editingRole = signal<Role | null>(null);

  roles = signal<Role[]>([
    {
      id: 'owner',
      name: '擁有者',
      description: '擁有藍圖的完整控制權限',
      isSystem: true,
      memberCount: 1,
      permissions: { all: true },
      createdAt: new Date()
    },
    {
      id: 'admin',
      name: '管理員',
      description: '可管理藍圖設定和成員',
      isSystem: true,
      memberCount: 2,
      permissions: {
        'blueprint.edit': true,
        'blueprint.settings': true,
        'member.manage': true,
        'task.create': true,
        'task.edit': true,
        'task.delete': true,
        'diary.create': true,
        'diary.edit': true,
        'diary.approve': true,
        'file.upload': true,
        'file.delete': true
      },
      createdAt: new Date()
    },
    {
      id: 'member',
      name: '成員',
      description: '一般成員權限',
      isSystem: true,
      memberCount: 8,
      permissions: {
        'task.view': true,
        'task.create': true,
        'task.edit': true,
        'diary.view': true,
        'diary.create': true,
        'file.view': true,
        'file.upload': true
      },
      createdAt: new Date()
    },
    {
      id: 'viewer',
      name: '檢視者',
      description: '只能檢視內容',
      isSystem: true,
      memberCount: 3,
      permissions: {
        'task.view': true,
        'diary.view': true,
        'file.view': true
      },
      createdAt: new Date()
    }
  ]);

  permissionCategories: PermissionCategory[] = [
    {
      key: 'blueprint',
      name: '藍圖管理',
      icon: 'project',
      permissions: [
        { key: 'blueprint.view', name: '檢視藍圖', description: '查看藍圖基本資訊', category: 'blueprint' },
        { key: 'blueprint.edit', name: '編輯藍圖', description: '修改藍圖設定', category: 'blueprint' },
        { key: 'blueprint.settings', name: '管理設定', description: '管理藍圖配置', category: 'blueprint' },
        { key: 'blueprint.delete', name: '刪除藍圖', description: '刪除整個藍圖', category: 'blueprint' }
      ]
    },
    {
      key: 'member',
      name: '成員管理',
      icon: 'team',
      permissions: [
        { key: 'member.view', name: '檢視成員', description: '查看成員列表', category: 'member' },
        { key: 'member.invite', name: '邀請成員', description: '邀請新成員加入', category: 'member' },
        { key: 'member.manage', name: '管理成員', description: '修改成員角色', category: 'member' },
        { key: 'member.remove', name: '移除成員', description: '將成員移出藍圖', category: 'member' }
      ]
    },
    {
      key: 'task',
      name: '任務管理',
      icon: 'check-square',
      permissions: [
        { key: 'task.view', name: '檢視任務', description: '查看任務列表', category: 'task' },
        { key: 'task.create', name: '建立任務', description: '新增任務', category: 'task' },
        { key: 'task.edit', name: '編輯任務', description: '修改任務內容', category: 'task' },
        { key: 'task.delete', name: '刪除任務', description: '移除任務', category: 'task' },
        { key: 'task.assign', name: '分派任務', description: '指派任務負責人', category: 'task' }
      ]
    },
    {
      key: 'diary',
      name: '日誌管理',
      icon: 'file-text',
      permissions: [
        { key: 'diary.view', name: '檢視日誌', description: '查看施工日誌', category: 'diary' },
        { key: 'diary.create', name: '建立日誌', description: '新增日誌', category: 'diary' },
        { key: 'diary.edit', name: '編輯日誌', description: '修改日誌內容', category: 'diary' },
        { key: 'diary.delete', name: '刪除日誌', description: '移除日誌', category: 'diary' },
        { key: 'diary.approve', name: '審核日誌', description: '核准或駁回日誌', category: 'diary' }
      ]
    },
    {
      key: 'file',
      name: '檔案管理',
      icon: 'folder',
      permissions: [
        { key: 'file.view', name: '檢視檔案', description: '查看檔案列表', category: 'file' },
        { key: 'file.upload', name: '上傳檔案', description: '上傳新檔案', category: 'file' },
        { key: 'file.download', name: '下載檔案', description: '下載檔案', category: 'file' },
        { key: 'file.delete', name: '刪除檔案', description: '移除檔案', category: 'file' }
      ]
    },
    {
      key: 'financial',
      name: '財務管理',
      icon: 'dollar',
      permissions: [
        { key: 'financial.view', name: '檢視財務', description: '查看財務資訊', category: 'financial' },
        { key: 'financial.edit', name: '編輯財務', description: '修改財務資料', category: 'financial' },
        { key: 'financial.approve', name: '審批財務', description: '核准付款請求', category: 'financial' }
      ]
    }
  ];

  roleForm = {
    name: '',
    description: '',
    permissions: {} as Record<string, boolean>
  };

  systemRoleCount = computed(() => this.roles().filter(r => r.isSystem).length);
  customRoleCount = computed(() => this.roles().filter(r => !r.isSystem).length);
  totalPermissions = computed(() => this.permissionCategories.reduce((sum, c) => sum + c.permissions.length, 0));

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.blueprintId.set(id);
        this.loadRoles();
      }
    });
  }

  loadRoles(): void {
    this.loading.set(true);
    // In a real implementation, load roles from the server
    setTimeout(() => {
      this.loading.set(false);
    }, 500);
  }

  getPermissionCount(role: Role): number {
    if (role.permissions['all']) return this.totalPermissions();
    return Object.values(role.permissions).filter(v => v).length;
  }

  viewRoleDetails(role: Role): void {
    this.selectedRole.set(role);
    this.detailsDrawerVisible.set(true);
  }

  closeDetailsDrawer(): void {
    this.detailsDrawerVisible.set(false);
    this.selectedRole.set(null);
  }

  openCreateRoleDrawer(): void {
    this.editingRole.set(null);
    this.roleForm = {
      name: '',
      description: '',
      permissions: {}
    };
    this.editDrawerVisible.set(true);
  }

  editRole(role: Role): void {
    this.editingRole.set(role);
    this.roleForm = {
      name: role.name,
      description: role.description,
      permissions: { ...role.permissions }
    };
    this.editDrawerVisible.set(true);
  }

  closeEditDrawer(): void {
    this.editDrawerVisible.set(false);
    this.editingRole.set(null);
  }

  saveRole(): void {
    if (!this.roleForm.name.trim()) {
      this.msg.warning('請輸入角色名稱');
      return;
    }

    this.saving.set(true);

    // In a real implementation, save to the server
    setTimeout(() => {
      if (this.editingRole()) {
        // Update existing role
        const updatedRoles = this.roles().map(r =>
          r.id === this.editingRole()!.id
            ? {
                ...r,
                name: this.roleForm.name,
                description: this.roleForm.description,
                permissions: this.roleForm.permissions
              }
            : r
        );
        this.roles.set(updatedRoles);
        this.msg.success('角色已更新');
      } else {
        // Create new role
        const newRole: Role = {
          id: `custom-${Date.now()}`,
          name: this.roleForm.name,
          description: this.roleForm.description,
          isSystem: false,
          memberCount: 0,
          permissions: this.roleForm.permissions,
          createdAt: new Date()
        };
        this.roles.update(roles => [...roles, newRole]);
        this.msg.success('角色已建立');
      }

      this.saving.set(false);
      this.closeEditDrawer();
    }, 1000);
  }

  deleteRole(role: Role): void {
    this.modal.confirm({
      nzTitle: '確認刪除',
      nzContent: `確定要刪除角色「${role.name}」嗎？此操作無法復原。`,
      nzOkText: '刪除',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.roles.update(roles => roles.filter(r => r.id !== role.id));
        this.msg.success('角色已刪除');
      },
      nzCancelText: '取消'
    });
  }

  onPermissionChange(role: Role, permissionKey: string, value: boolean): void {
    const updatedRoles = this.roles().map(r =>
      r.id === role.id
        ? {
            ...r,
            permissions: {
              ...r.permissions,
              [permissionKey]: value
            }
          }
        : r
    );
    this.roles.set(updatedRoles);
    this.msg.success('權限已更新');
  }

  goBack(): void {
    this.router.navigate(['/blueprint', this.blueprintId(), 'overview']);
  }
}
