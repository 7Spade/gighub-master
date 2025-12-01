/**
 * Module Placeholder Component
 *
 * 模組佔位組件
 * Module Placeholder Component
 *
 * Placeholder component for modules that are not yet implemented.
 *
 * @module routes/blueprint/workspace/modules/placeholder
 */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzResultModule } from 'ng-zorro-antd/result';
import { MODULE_CONFIGS, BlueprintContextService } from '@shared';
import { ModuleType } from '@core';

@Component({
  selector: 'app-module-placeholder',
  template: `
    <div class="placeholder-container">
      <nz-result
        nzStatus="info"
        [nzTitle]="moduleTitle"
        [nzSubTitle]="moduleDescription"
        [nzIcon]="moduleIconTemplate"
      >
        <ng-template #moduleIconTemplate>
          <span nz-icon [nzType]="moduleIcon" nzTheme="outline" style="font-size: 72px; color: #1890ff;"></span>
        </ng-template>
        <div nz-result-extra>
          <p class="coming-soon">即將推出</p>
          <p class="module-info">此模組正在開發中，敬請期待！</p>
        </div>
      </nz-result>
    </div>
  `,
  styles: [`
    .placeholder-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      background: #fff;
      border-radius: 8px;
      padding: 48px;
    }

    .coming-soon {
      font-size: 18px;
      font-weight: 500;
      color: #1890ff;
      margin-bottom: 8px;
    }

    .module-info {
      color: #666;
      font-size: 14px;
    }

    :host ::ng-deep .ant-result-icon {
      margin-bottom: 24px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NzEmptyModule,
    NzIconModule,
    NzResultModule
  ]
})
export class ModulePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly blueprintContext = inject(BlueprintContextService);

  get moduleType(): ModuleType | null {
    const moduleStr = this.route.snapshot.data['module'] as string;
    return moduleStr as ModuleType || null;
  }

  get moduleConfig() {
    const type = this.moduleType;
    if (!type) return null;
    return MODULE_CONFIGS[type];
  }

  get moduleTitle(): string {
    return this.moduleConfig?.label || '模組';
  }

  get moduleDescription(): string {
    return this.moduleConfig?.description || '';
  }

  get moduleIcon(): string {
    return this.moduleConfig?.icon || 'appstore';
  }
}
