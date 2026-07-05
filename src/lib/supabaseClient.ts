import { createClient } from '@supabase/supabase-js'

// Browser/client Supabase instance using the public anon key.
// Fallbacks keep `next build` (static prerendering) from throwing when env
// vars are not present at build time; real values are read at runtime.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
