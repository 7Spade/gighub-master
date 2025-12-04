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
    url: 'https://hgjrqjhhwnaalbllojhj.supabase.co',
    anonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnanJxamhod25hYWxibGxvamhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTc3NjYsImV4cCI6MjA4MDM3Mzc2Nn0.fezsdIFzw2xvnkUY6EXmg1ru2FtqI7hskVlJTpaxQfA'
  }
} as Environment;
