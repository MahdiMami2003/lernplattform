import { redirect } from '@sveltejs/kit';
import { ensureRole } from '$lib/server/roleGuard.js';

export const load = async ({ locals, url }) => {
    try {
        const { session, role } = await ensureRole({ locals, url, allowed: ['teacher','admin'] });
        return { session, role };
    } catch (e) {
        const returnTo = encodeURIComponent(url.pathname + url.search);
        throw redirect(303, `/no_permission_page_id18?redirectTo=${returnTo}`);
    }
};
