// src/routes/+layout.js
import { createBrowserClient, isBrowser, parse, serialize } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { setupI18n } from '$lib/i18n/config'
export const load = async ({ fetch, data, depends }) => {
    setupI18n()
    depends('supabase:auth')

    const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        global: {
            fetch,
        },
        cookies: {
            // 1. getAll statt get (Neu in @supabase/ssr v0.5+)
            getAll() {
                if (!isBrowser()) {
                    // Im SSR-Modus: Wir haben keinen Zugriff auf Browser-Cookies.
                    // Wir geben ein leeres Array zurück. Der Server nutzt stattdessen
                    // die 'data.session', die wir unten zurückgeben.
                    return []
                }
                const cookies = parse(document.cookie)
                return Object.keys(cookies).map((key) => ({
                    name: key,
                    value: cookies[key]
                }))
            },
            // 2. setAll ist jetzt Pflicht
            setAll(cookiesToSet) {
                // Wir setzen Cookies nur im Browser
                if (!isBrowser()) return

                cookiesToSet.forEach(({ name, value, options }) => {
                    document.cookie = serialize(name, value, options)
                })
            }
        },
    })

    // Session-Status synchronisieren
    const {
        data: { session },
    } = await supabase.auth.getSession()

    // Wir geben 'supabase' UND die Session vom Server (data.session) zurück.
    // Falls supabase.auth.getSession() leer ist (SSR), greift data.session.
    return { supabase, session: data.session ?? session }
}