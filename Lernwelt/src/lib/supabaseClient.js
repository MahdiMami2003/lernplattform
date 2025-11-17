//import { createClient } from '@supabase/supabase-js'

// Importiert die Keys sicher aus deiner .env-Datei (SvelteKit-Standard)
//import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

// Erstellt den Client
<<<<<<< HEAD
//export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)

import { createClient } from '@supabase/supabase-js';
import {
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';

export const supabase = createClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true
        }
    }
);
=======
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)



>>>>>>> ee5cfcaeff57eef5e353918f1a16c2d1fa12bc07
