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
    url: import.meta.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://obwyowvbsnqsxsnlsbhl.supabase.co',
    anonKey:
      import.meta.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id3lvd3Zic25xc3hzbmxzYmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzcyNDksImV4cCI6MjA4MDQ1MzI0OX0.GkJbX-WILcOOKZPy3ZTV127s7OH_6iBCVWGCBXi2uLA'
  }
} as Environment;
