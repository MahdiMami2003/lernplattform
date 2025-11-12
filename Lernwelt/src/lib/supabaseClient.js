import { createClient } from '@supabase/supabase-js'

// Importiert die Keys sicher aus deiner .env-Datei (SvelteKit-Standard)
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

// Erstellt den Client
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)