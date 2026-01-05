import { redirect } from '@sveltejs/kit';

/**
 * Prüft serverseitig Session und Rolle gegen eine Liste erlaubter Rollen.
 * Leitet bei Verstoß auf die No-Permission-Seite um.
 * @param {{ locals: any, url: URL, allowed: string[] }} ctx
 * @returns {Promise<{ session: any, role: string }>} session und Rolle
 */
export async function ensureRole({ locals, url, allowed }) {
    const session = await locals.getSession?.();

    if (!session) {
        const returnTo = encodeURIComponent(url.pathname + url.search);
        throw redirect(303, `/no_permission_page_id18?redirectTo=${returnTo}`);
    }

    const { data: profile, error } = await locals.supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (error) {
        console.error('Fehler beim Laden des Profils:', error);
        throw redirect(303, '/no_permission_page_id18');
    }

    const role = profile?.role || session.user?.user_metadata?.role || session.user?.app_metadata?.role;

    if (!allowed.includes(role)) {
        throw redirect(303, '/no_permission_page_id18');
    }

    return { session, role };
}
