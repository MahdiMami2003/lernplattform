import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
    // Session abrufen
    const session = await locals.getSession();

    // Wenn nicht eingeloggt -> auf No-Permission Seite weiterleiten (mit returnTo)
    if (!session) {
        const returnTo = encodeURIComponent(url.pathname + url.search);
        throw redirect(303, `/no_permission_page_id18?redirectTo=${returnTo}`);
    }

    // Versuche Rolle aus profiles Tabelle
    try {
        const { data: profile, error } = await locals.supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Fehler beim Laden des Profils (teacher guard):', error);
            // Sicherheitsprinzip: Zugriff verweigern
            throw redirect(303, '/no_permission_page_id18');
        }

        const role = profile?.role || session.user?.user_metadata?.role || session.user?.app_metadata?.role;

        // Nur Lehrer oder Admin dürfen hier rein
        if (role !== 'teacher' && role !== 'admin') {
            throw redirect(303, '/no_permission_page_id18');
        }

        return { session, role };
    } catch (err) {
        console.error('Unerwarteter Fehler im teacher guard:', err);
        throw redirect(303, '/no_permission_page_id18');
    }
};
