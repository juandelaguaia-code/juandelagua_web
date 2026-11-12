/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    supabase: import('@supabase/supabase-js').SupabaseClient | null;
    user: import('@supabase/supabase-js').User | null;
    profile: import('./lib/types').Profile | null;
    /** La petición llegó por comunidad.juandelagua.com (ver deploy/server.mjs) */
    community: boolean;
  }
}
