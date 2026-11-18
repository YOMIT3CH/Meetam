import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
// Replace with your actual Supabase project URL and anon key
// Get these from: https://supabase.io/dashboard -> Settings -> API

// For development, you can use the project URL from your Supabase dashboard
const supabaseUrl = 'https://iptvqtmomgyqyypqkyfe.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdHZxdG1vbWd5cXl5cHFreWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4OTc3MzIsImV4cCI6MjExMDQ3MzczMn0.U2C_XyXNvvp4gYcANhfvqJmUKV7azvf2pkdeVkaqjA0'

export default createClient(supabaseUrl, supabaseAnonKey, {
  // Auth options
  auth: {
    // Auto-redirect on sign in/out
    autoRefreshToken: true,
    autoSignInWithOAuth: false,
    persistSession: true,
    detectSessionInUrl: true,
  
    // Session cookie settings
    sessionTokenSessionToken: 'sb-session',
  
    // Duration in minutes for the refresh token
    flowType: 'pkce',
    storageKey: 'supabase-auth-token',
    storage: window.localStorage,
  },
  
  // General options
  global: {
    headers: {
      'X-Client-Info': 'meetam-app',
    },
  },
  
  // Debug mode (optional)
  debug: false,
})