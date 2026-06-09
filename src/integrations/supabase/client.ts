import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rlazoezljzhicmujlcom.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXpvZXpsanpoaWNtdWpsY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NDUzNTUsImV4cCI6MjA5NTUyMTM1NX0.qzIbLhGJrDGl2IwOFK2gGJGmkKpcJxuUs3WD8BYR5ec";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});