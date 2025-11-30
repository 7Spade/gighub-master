/**
 * Create Team Component
 *
 * 建立團隊組件
 * Create team component
 *
 * Allows users to create a new team within an organization.
 * Integrated with TeamFacade and AuthContextService.
 *
 * @module routes/account
 */

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TeamFacade, AuthContextService } from '@core';
import { SHARED_IMPORTS, CreateTeamRequest, validateForm, getTrimmedFormValue } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-create-team',
  templateUrl: './create-team.component.html',
  styleUrls: ['./create-team.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: SHARED_IMPORTS
})
export class CreateTeamComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authContext = inject(AuthContextService);
  private readonly teamFacade = inject(TeamFacade);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = signal(false);

  // 從上下文自動獲取組織 ID
  readonly currentOrgId = computed<string | null>(() => {
    const contextType = this.authContext.contextType();
    const contextId = this.authContext.contextId();
    return contextType === 'organization' ? contextId : null;
  });

  readonly showOrgSelector = computed(() => !this.currentOrgId()); // 只有在非組織上下文才顯示選擇器

  form: FormGroup = this.fb.group({
    organizationId: [this.currentOrgId() || '', [Validators.required]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(500)]],
    avatar: ['']
  });

  readonly organizations = this.authContext.organizations;
  readonly loadingOrganizations = this.authContext.isWorkspaceLoading;

  readonly organizationOptions = computed(() => {
    const orgs = this.organizations();
    return orgs.map((org: Record<string, unknown>) => ({
      value: org['id'] as string,
      label: (org['name'] as string) || '未命名組織'
    }));
  });

  /**
   * 提交表單創建團隊
   * Submit form to create team
   */
  async submit(): Promise<void> {
    if (!validateForm(this.form)) {
      return;
    }

    this.loading.set(true);
    try {
      const request = getTrimmedFormValue<CreateTeamRequest>(this.form);
      const team = await this.teamFacade.createTeam(request as CreateTeamRequest);
      this.msg.success('團隊創建成功！');
      this.modal.close(team);
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '創建團隊失敗');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 取消並關閉模態框
   * Cancel and close modal
   */
  cancel(): void {
    this.modal.destroy();
  }

  /**
   * 獲取當前組織名稱
   * Get current organization name
   */
  getCurrentOrgName(): string {
    const orgId = this.currentOrgId();
    if (!orgId) return '';
    const org = this.organizations().find((o: Record<string, unknown>) => o['id'] === orgId);
    return org ? (org['name'] as string) || '未命名組織' : '';
  }
}
