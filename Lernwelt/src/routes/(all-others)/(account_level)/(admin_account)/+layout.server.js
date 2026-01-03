import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
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
            console.error('Fehler beim Laden des Profils (admin guard):', error);
            throw redirect(303, '/no_permission_page_id18');
        }

        const role = profile?.role || session.user?.user_metadata?.role || session.user?.app_metadata?.role;

        if (role !== 'admin') {
            throw redirect(303, '/no_permission_page_id18');
        }

        return { session, role };
    } catch (err) {
        console.error('Unerwarteter Fehler im admin guard:', err);
        throw redirect(303, '/no_permission_page_id18');
    }
};
