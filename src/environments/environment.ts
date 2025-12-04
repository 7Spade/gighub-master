// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// Type definition for environment variables (injected at build time via @ngx-env/builder)
declare global {
  interface ImportMeta {
    readonly env: {
      readonly NEXT_PUBLIC_SUPABASE_URL?: string;
      readonly NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      [key: string]: string | undefined;
    };
  }
}

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
    url: import.meta.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://imxksfepdxphpyvilnfg.supabase.co',
    anonKey:
      import.meta.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlteGtzZmVwZHhwaHB5dmlsbmZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MDQ2NjEsImV4cCI6MjA4MDM4MDY2MX0.yIfuRT8KvM6vJ7J3HgzkoxnsaDk7cHN2zpGvWmgW8LI'
  },
  providers: [provideMockConfig({ data: MOCKDATA })],
  interceptorFns: [mockInterceptor]
} as Environment;
