import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch(err => {
  // Bootstrap errors are critical and should always be visible
  console.error('[Bootstrap Error]', err);
});
