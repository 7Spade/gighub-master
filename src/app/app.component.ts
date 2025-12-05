import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, NavigationError, RouteConfigLoadStart, Router, RouterOutlet } from '@angular/router';
import { TitleService, VERSION as VERSION_ALAIN, stepPreloader } from '@delon/theme';
import { environment } from '@env/environment';
import { NzModalService } from 'ng-zorro-antd/modal';
import { VERSION as VERSION_ZORRO } from 'ng-zorro-antd/version';

@Component({
  selector: 'app-root',
  template: `<router-outlet />`,
  imports: [RouterOutlet],
  host: {
    '[attr.ng-alain-version]': 'ngAlainVersion',
    '[attr.ng-zorro-version]': 'ngZorroVersion'
  }
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly titleSrv = inject(TitleService);
  private readonly modalSrv = inject(NzModalService);
  ngAlainVersion = VERSION_ALAIN.full;
  ngZorroVersion = VERSION_ZORRO.full;

  private donePreloader = stepPreloader();
  private preloaderTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    let configLoad = false;

    // Fallback: Remove preloader after 10 seconds if navigation doesn't complete
    // This prevents the app from being stuck on the loading animation indefinitely
    this.preloaderTimeout = setTimeout(() => {
      console.warn('[AppComponent] Preloader timeout - forcing preloader removal');
      this.donePreloader();
    }, 10000);

    this.router.events.subscribe(ev => {
      if (ev instanceof RouteConfigLoadStart) {
        configLoad = true;
      }
      if (configLoad && ev instanceof NavigationError) {
        // Clear timeout since we're handling the error
        if (this.preloaderTimeout) {
          clearTimeout(this.preloaderTimeout);
          this.preloaderTimeout = null;
        }
        this.donePreloader();
        this.modalSrv.confirm({
          nzTitle: `提醒`,
          nzContent: environment.production ? `应用可能已发布新版本，请点击刷新才能生效。` : `无法加载路由：${ev.url}`,
          nzCancelDisabled: false,
          nzOkText: '刷新',
          nzCancelText: '忽略',
          nzOnOk: () => location.reload()
        });
      }
      if (ev instanceof NavigationEnd) {
        // Clear timeout since navigation completed successfully
        if (this.preloaderTimeout) {
          clearTimeout(this.preloaderTimeout);
          this.preloaderTimeout = null;
        }
        this.donePreloader();
        this.titleSrv.setTitle();
        this.modalSrv.closeAll();
      }
    });
  }
}
