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
    url: 'https://dqdskmsnndsoppftplnt.supabase.co',
    anonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZHNrbXNubmRzb3BwZnRwbG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTU3MTEsImV4cCI6MjA4MDI3MTcxMX0.3ozoSl4xTmXqlRJdj4nu8g0VlLJ7FBgrqkWRSpeo8gE'
  }
} as Environment;
