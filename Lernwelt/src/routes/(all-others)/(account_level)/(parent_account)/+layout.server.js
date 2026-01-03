import { redirect } from '@sveltejs/kit';

// Nur diese Pfad-Präfixe benötigen wirklich einen Parent-Login
const protectedPrefixes = [
    '/create_appointments_page'
];

// Diese Pfade sollen ausdrücklich öffentlich bleiben (auch für Gäste)
const publicPrefixes = [
    '/parents_landing_page_id4',
    '/appointments_page_id8',
    '/material_page_id14',
    '/materials_content_page_16',
    '/no_login_page_id7'
];

/**
 * Prüft, ob ein Pathname zu den geschützten Routen gehört.
 * @param {string} pathname
 */
function needsAuth(pathname) {
    // Wenn explizit public -> kein Auth nötig
    if (publicPrefixes.some((p) => pathname.startsWith(p))) return false;

    return protectedPrefixes.some((p) => pathname.startsWith(p));
}

export const load = async ({ locals, url }) => {
    const pathname = url.pathname;

    // Wenn die Route nicht in der geschützten Liste ist -> kein Guard hier
    if (!needsAuth(pathname)) {
        return {}; // öffentlich zugänglich
    }

    // Für geschützte Routen: Session + Rollen prüfen
    const session = await locals.getSession();

    if (!session) {
        const returnTo = encodeURIComponent(url.pathname + url.search);
        throw redirect(303, `/no_permission_page_id18?redirectTo=${returnTo}`);
    }

    try {
        const { data: profile, error } = await locals.supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Fehler beim Laden des Profils (parent guard):', error);
            throw redirect(303, '/no_permission_page_id18');
        }

        const role = profile?.role || session.user?.user_metadata?.role || session.user?.app_metadata?.role;

        if (!['parent', 'admin'].includes(role)) {
            throw redirect(303, '/no_permission_page_id18');
        }

        return { session, role };
    } catch (err) {
        console.error('Unerwarteter Fehler im parent guard:', err);
        throw redirect(303, '/no_permission_page_id18');
    }
};
