import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://todyqybjiwgnxfevqisl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZHlxeWJqaXdnbnhmZXZxaXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDEzNjMsImV4cCI6MjA5NjE3NzM2M30.tyAK2ZovQwcEGI8i6euGQ6qprGhqvlIRZt4B0wUKeOg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: {
    schema: "public",
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
