import { redirect } from '@sveltejs/kit';
import { ensureRole } from '$lib/server/roleGuard.js';

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

    try {
        const { session, role } = await ensureRole({ locals, url, allowed: ['parent','admin'] });
        return { session, role };
    } catch (e) {
        const returnTo = encodeURIComponent(url.pathname + url.search);
        throw redirect(303, `/no_permission_page_id18?redirectTo=${returnTo}`);
    }
};
