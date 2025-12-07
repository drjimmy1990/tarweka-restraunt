import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ FATAL ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file.');
    process.exit(1);
}

// We use the Service Key because the Backend is an Admin.
// It bypasses Row Level Security (RLS) to perform tasks like assigning orders.
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

console.log('✅ Supabase Client Initialized');
