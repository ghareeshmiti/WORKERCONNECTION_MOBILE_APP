import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual Supabase credentials
const SUPABASE_URL = 'https://seecqtxhpsostjniabeo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlZWNxdHhocHNvc3RqbmlhYmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM2NjQsImV4cCI6MjA4Mzc5OTY2NH0.E67NfiaJWbStmAKQeJTh9CbEFujrIBvqPFmxYK7HqsM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
