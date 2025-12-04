// Type definition for environment variables (injected at build time via @ngx-env/builder)
declare interface ImportMeta {
  readonly env: {
    readonly NEXT_PUBLIC_SUPABASE_URL?: string;
    readonly NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    [key: string]: string | undefined;
  };
}

import { Environment } from '@delon/theme';

export const environment = {
  production: true,
  useHash: true,
  api: {
    baseUrl: './',
    refreshTokenEnabled: true,
    refreshTokenType: 'auth-refresh'
  },
  supabase: {
    url: import.meta.env['NEXT_PUBLIC_SUPABASE_URL'] || '',
    anonKey: import.meta.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || ''
  }
} as Environment;
