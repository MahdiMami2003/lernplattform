// src/hooks.server.js
import { createServerClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

export const handle = async ({ event, resolve }) => {
    // 1. Supabase Client für den Server erstellen
    // Wir übergeben dem Client Methoden, um Cookies zu lesen und zu schreiben
    event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll: () => event.cookies.getAll(),
            setAll: (cookiesToSet) => {
                cookiesToSet.forEach(({ name, value, options }) => {
                    event.cookies.set(name, value, { ...options, path: '/' })
                })
            },
        },
    })

    // 2. Hilfsfunktion: Session sicher abrufen
    // Diese Funktion nutzen wir später in den +page.server.js Dateien
    event.locals.getSession = async () => {
        const {
            data: { session },
        } = await event.locals.supabase.auth.getSession()
        return session
    }

    // 3. Request weiterverarbeiten und Antwort zurückgeben
    return resolve(event, {
        filterSerializedResponseHeaders: (name) => name === 'content-range',
    })
}