// src/app.d.ts
import { SupabaseClient, Session } from '@supabase/supabase-js'

declare global {
    namespace App {
        interface Locals {
            supabase: SupabaseClient
            getSession: () => Promise<Session | null>
        }
        // Die anderen Interfaces können leer bleiben, falls sie es waren
        // interface PageData {}
        // interface Error {}
        // interface Platform {}
    }
}

export {}