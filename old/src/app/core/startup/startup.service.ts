import { HttpClient } from '@angular/common/http';
import { EnvironmentProviders, Injectable, Provider, inject, provideAppInitializer } from '@angular/core';
import { Router } from '@angular/router';
import { ContextType } from '@core';
import { ACLService } from '@delon/acl';
import { ALAIN_I18N_TOKEN, MenuService, SettingsService, TitleService } from '@delon/theme';
import { MenuManagementService } from '@shared';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { Observable, zip, catchError, map, switchMap } from 'rxjs';

import { I18NService } from '../i18n/i18n.service';
import { SupabaseAuthService } from '../infra/supabase';

/**
 * Used for application startup
 * Generally used to get the basic data of the application, like: Menu Data, User Data, etc.
 */
export function provideStartup(): Array<Provider | EnvironmentProviders> {
  return [
    StartupService,
    provideAppInitializer(() => {
      const initializerFn = (
        (startupService: StartupService) => () =>
          startupService.load()
      )(inject(StartupService));
      return initializerFn();
    })
  ];
}

@Injectable()
export class StartupService {
  private menuService = inject(MenuService);
  private settingService = inject(SettingsService);
  private aclService = inject(ACLService);
  private titleService = inject(TitleService);
  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private i18n = inject<I18NService>(ALAIN_I18N_TOKEN);
  private supabaseAuth = inject(SupabaseAuthService);
  private menuManagementService = inject(MenuManagementService);

  load(): Observable<void> {
    const defaultLang = this.i18n.defaultLang;
    // If http request allows anonymous access, you need to add `ALLOW_ANONYMOUS`:
    // this.httpClient.get('/app', { context: new HttpContext().set(ALLOW_ANONYMOUS, this.tokenService.get()?.token ? false : true) })
    return zip(this.i18n.loadLangData(defaultLang), this.httpClient.get('./assets/tmp/app-data.json')).pipe(
      // 接收其他拦截器后产生的异常消息
      catchError(res => {
        console.warn(`StartupService.load: Network request failed`, res);
        setTimeout(() => this.router.navigateByUrl(`/exception/500`));
        return [];
      }),
      switchMap(([langData, appData]: [Record<string, string>, NzSafeAny]) => {
        // setting language data
        this.i18n.use(defaultLang, langData);

        // 应用信息：包括站点名、描述、年份
        this.settingService.setApp(appData.app);

        // 從 Supabase 獲取用戶信息
        return this.supabaseAuth.getUser().pipe(
          map(supabaseUser => {
            if (supabaseUser) {
              // 映射 Supabase User 到 ng-alain User 格式
              const metadata = supabaseUser.user_metadata || {};
              const email = supabaseUser.email || '';

              const user = {
                name: metadata['full_name'] || metadata['name'] || email.split('@')[0] || 'User',
                email: email,
                avatar: metadata['avatar_url'] || metadata['avatar'] || './assets/tmp/img/avatar.jpg'
              };

              this.settingService.setUser(user);
            } else {
              // 如果沒有 Supabase 用戶，設置默認用戶（但不清除現有用戶數據）
              // 保持現有的 SettingsService 用戶數據
            }

            // ACL：设置权限为全量
            this.aclService.setFull(true);

            // 載入菜單配置（MenuManagementService 會處理菜單更新）
            // 使用 async/await 現代化模式
            this.menuManagementService
              .loadConfig()
              .then(() => {
                // 初始化時載入預設菜單（USER 菜單）
                // 注意：LayoutBasicComponent 的 effect 會監聽上下文變化並自動更新菜單
                // 這裡只是確保菜單配置已載入
                this.menuManagementService.updateMenu(ContextType.USER);
              })
              .catch(error => {
                console.error('[StartupService] Failed to load menu config:', error);
              });

            // 向後兼容：如果 MenuManagementService 未載入，使用舊的菜單配置
            if (appData.menu && !appData.menus) {
              this.menuService.add(appData.menu);
            }

            // 设置页面标题的后缀
            this.titleService.default = '';
            this.titleService.suffix = appData.app.name;
          })
        );
      })
    );
  }
}
