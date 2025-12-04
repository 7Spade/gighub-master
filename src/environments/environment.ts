// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import * as MOCKDATA from '@_mock';
import { mockInterceptor, provideMockConfig } from '@delon/mock';
import { Environment } from '@delon/theme';

export const environment = {
  production: false,
  useHash: true,
  api: {
    baseUrl: './',
    refreshTokenEnabled: true,
    refreshTokenType: 'auth-refresh'
  },
  supabase: {
    url: import.meta.env['NG_APP_SUPABASE_URL'] || 'https://imxksfepdxphpyvilnfg.supabase.co',
    anonKey:
      import.meta.env['NG_APP_SUPABASE_ANON_KEY'] ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnanJxamhod25hYWxibGxvamhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTc3NjYsImV4cCI6MjA4MDM3Mzc2Nn0.fezsdIFzw2xvnkUY6EXmg1ru2FtqI7hskVlJTpaxQfA'
  },
  providers: [provideMockConfig({ data: MOCKDATA })],
  interceptorFns: [mockInterceptor]
} as Environment;
