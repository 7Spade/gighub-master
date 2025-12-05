import { Environment } from '@delon/theme';

/**
 * Production environment configuration for GigHub
 *
 * Supabase credentials are directly embedded here for production builds.
 * This approach is more reliable than using import.meta.env which may not work
 * correctly with all Angular build configurations.
 *
 * For different environments (staging, development), use environment-specific files
 * or configure via angular.json fileReplacements.
 *
 * Note: These are public anon keys and URLs, designed to be exposed in client-side code.
 * Row Level Security (RLS) policies protect the data at the database level.
 */
export const environment = {
  production: true,
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
  }
} as Environment;
