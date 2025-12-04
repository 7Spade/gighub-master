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
    url: import.meta.env['NG_APP_SUPABASE_URL'] || '',
    anonKey: import.meta.env['NG_APP_SUPABASE_ANON_KEY'] || ''
  }
} as Environment;
