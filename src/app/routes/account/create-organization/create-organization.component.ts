/**
 * Create Organization Component
 *
 * 建立組織組件
 * Create organization component
 *
 * Allows users to create a new organization account.
 * Integrated with OrganizationFacade.
 *
 * @module routes/account
 */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrganizationFacade } from '@core';
import { SHARED_IMPORTS, validateForm, getTrimmedFormValue } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';

/**
 * 創建組織請求介面
 * Create organization request interface
 */
interface CreateOrganizationRequest {
  name: string;
  email?: string;
  avatar?: string;
}

@Component({
  selector: 'app-create-organization',
  templateUrl: './create-organization.component.html',
  styleUrls: ['./create-organization.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS]
})
export class CreateOrganizationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly organizationFacade = inject(OrganizationFacade);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = false;
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.email]],
    avatar: ['']
  });

  /**
   * 提交表單創建組織
   * Submit form to create organization
   */
  async submit(): Promise<void> {
    if (!validateForm(this.form)) {
      return;
    }

    this.loading = true;
    try {
      const request = getTrimmedFormValue<CreateOrganizationRequest>(this.form);
      const organization = await this.organizationFacade.createOrganization(request as CreateOrganizationRequest);
      this.msg.success('組織創建成功！');
      this.modal.close(organization);
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '創建組織失敗');
    } finally {
      this.loading = false;
    }
  }

  /**
   * 取消並關閉模態框
   * Cancel and close modal
   */
  cancel(): void {
    this.modal.destroy();
  }
}
