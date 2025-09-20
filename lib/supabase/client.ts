// Path: lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  // +++ ADD THIS LOGGING BLOCK +++
  console.log("Initializing Supabase Client:");
  console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}