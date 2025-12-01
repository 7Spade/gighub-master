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
    url: 'https://uppudvdqgkflvdolguit.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwcHVkdmRxZ2tmbHZkb2xndWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODIxMzIsImV4cCI6MjA4MDA1ODEzMn0.xEOHATBBZmfFRuMZUNuDBa-G3eQIFufUMBr-myj9Eaw'
  }
} as Environment;
