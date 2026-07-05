import { createClient } from '@supabase/supabase-js'

// Server-only Supabase instance using the service role key. This must never be
// imported into client-side code. Fallbacks keep `next build` from throwing when
// env vars are absent at build time; real values are read at runtime.
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://placeholder.supabase.co'
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-placeholder'

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
