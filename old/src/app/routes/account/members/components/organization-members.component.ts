/**
 * Organization Members Component
 *
 * 組織成員管理子組件
 * Organization members management sub-component
 *
 * @module routes/account/members/components
 */

import { DatePipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrganizationMemberRepository } from '@core';
import { ModalHelper } from '@delon/theme';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { firstValueFrom } from 'rxjs';

import { AddOrganizationMemberComponent } from '../../add-organization-member/add-organization-member.component';

@Component({
  selector: 'app-organization-members-content',
  standalone: true,
  imports: [SHARED_IMPORTS, DatePipe, FormsModule],
  template: `
    @if (loading()) {
      <nz-spin />
    } @else if (error()) {
      <nz-alert nzType="error" [nzMessage]="error()!" />
    } @else if (members().length === 0) {
      <nz-empty nzNotFoundContent="暫無成員" />
    } @else {
      <nz-table [nzData]="members()" [nzPageSize]="10">
        <thead>
          <tr>
            <th>成員名稱</th>
            <th>角色</th>
            <th>加入時間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          @for (member of members(); track member.id) {
            <tr>
              <td>{{ member.account_id }}</td>
              <td>
                <nz-select [ngModel]="member.role" (ngModelChange)="updateMemberRole(member, $event)" style="width: 120px">
                  <nz-option nzValue="owner" nzLabel="擁有者"></nz-option>
                  <nz-option nzValue="admin" nzLabel="管理員"></nz-option>
                  <nz-option nzValue="member" nzLabel="成員"></nz-option>
                </nz-select>
              </td>
              <td>{{ member.joined_at | date: 'yyyy-MM-dd HH:mm' }}</td>
              <td>
                @if (member.role !== 'owner') {
                  <button nz-button nzType="link" nzDanger nzSize="small" (click)="removeMember(member)"> 移除 </button>
                }
              </td>
            </tr>
          }
        </tbody>
      </nz-table>
    }

    <div class="mt-md">
      <button nz-button nzType="primary" (click)="addMember()">
        <i nz-icon nzType="plus"></i>
        添加成員
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationMembersContentComponent implements OnInit {
  private readonly memberRepo = inject(OrganizationMemberRepository);
  private readonly modal = inject(ModalHelper);
  private readonly msg = inject(NzMessageService);

  organizationId = input.required<string>();

  members = signal<any[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private lastLoadedOrgId: string | null = null;

  constructor() {
    // React to organizationId changes
    effect(() => {
      const orgId = this.organizationId();
      if (orgId && orgId !== this.lastLoadedOrgId) {
        this.lastLoadedOrgId = orgId;
        this.loadMembers(orgId);
      }
    });
  }

  ngOnInit(): void {
    // Initial load is handled by effect
  }

  async loadMembers(organizationId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const members = await firstValueFrom(this.memberRepo.findByOrganization(organizationId));
      this.members.set(members);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : '載入成員失敗');
    } finally {
      this.loading.set(false);
    }
  }

  addMember(): void {
    const orgId = this.organizationId();
    if (!orgId) {
      this.msg.error('缺少組織 ID');
      return;
    }

    this.modal.create(AddOrganizationMemberComponent, { organizationId: orgId }, { size: 'md' }).subscribe(result => {
      if (result?.success) {
        this.loadMembers(orgId);
      }
    });
  }

  async updateMemberRole(member: any, newRole: string): Promise<void> {
    try {
      await firstValueFrom(this.memberRepo.update(member.id, { role: newRole } as any));
      this.msg.success('角色更新成功！');
      await this.loadMembers(this.organizationId());
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '更新角色失敗');
    }
  }

  async removeMember(member: any): Promise<void> {
    try {
      await firstValueFrom(this.memberRepo.delete(member.id));
      this.msg.success('成員已移除！');
      await this.loadMembers(this.organizationId());
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '移除成員失敗');
    }
  }
}
