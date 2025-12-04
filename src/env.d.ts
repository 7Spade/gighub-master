// Type definition for process.env in browser environment
// Environment variables are injected at build time via Angular's define option
declare const process: {
  env: {
    readonly NODE_ENV: string;
    readonly NEXT_PUBLIC_SUPABASE_URL: string;
    readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    [key: string]: string | undefined;
  };
};
