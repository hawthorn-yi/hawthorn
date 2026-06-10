// Supabase 配置
const SUPABASE_URL = 'https://todyqybjiwgnxfevqisl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZHlxeWJqaXdnbnhmZXZxaXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDEzNjMsImV4cCI6MjA5NjE3NzM2M30.tyAK2ZovQwcEGI8i6euGQ6qprGhqvlIRZt4B0wUKeOg';

module.exports = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  REST_URL: SUPABASE_URL + '/rest/v1'
};
