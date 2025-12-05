// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import * as MOCKDATA from '@_mock';
import { mockInterceptor, provideMockConfig } from '@delon/mock';
import { Environment } from '@delon/theme';

/**
 * Development environment configuration for GigHub
 *
 * Note: These are public anon keys and URLs, designed to be exposed in client-side code.
 * Row Level Security (RLS) policies protect the data at the database level.
 */
export const environment = {
  production: false,
  useHash: true,
  api: {
    baseUrl: './',
    refreshTokenEnabled: true,
    refreshTokenType: 'auth-refresh'
  },
  supabase: {
    url: 'https://obwyowvbsnqsxsnlsbhl.supabase.co',
    anonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id3lvd3Zic25xc3hzbmxzYmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzcyNDksImV4cCI6MjA4MDQ1MzI0OX0.GkJbX-WILcOOKZPy3ZTV127s7OH_6iBCVWGCBXi2uLA'
  },
  providers: [provideMockConfig({ data: MOCKDATA })],
  interceptorFns: [mockInterceptor]
} as Environment;
