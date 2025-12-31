// api/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Remplace par tes vraies clés de ton tableau de bord Supabase
const supabaseUrl = 'https://ighurcemlpsfkhbchwih.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnaHVyY2VtbHBzZmtoYmNod2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNDM5MDIsImV4cCI6MjA4MjYxOTkwMn0.yF5p06PJtzsvDPsG36fdfZxzLqDi1uSFqlCaL5pkcNE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});