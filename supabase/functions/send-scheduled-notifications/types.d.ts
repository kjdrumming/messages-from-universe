// Edge Function type declarations for Deno runtime
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

// Module declarations for Edge Function imports
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export function createClient(supabaseUrl: string, supabaseKey: string): any;
}
