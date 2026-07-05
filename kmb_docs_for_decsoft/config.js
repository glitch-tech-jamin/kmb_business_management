// Set these values via environment-specific deployment or a server-injected script.
// DO NOT hardcode real keys here — use placeholders for version control.
window.config = {
  SUPABASE_URL: window.__ENV__?.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: window.__ENV__?.SUPABASE_ANON_KEY || ''
};
