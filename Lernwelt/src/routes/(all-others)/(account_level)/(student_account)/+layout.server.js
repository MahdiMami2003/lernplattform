import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
    // Authentifizierten Benutzer verifiziert laden
    const { data: { user }, error: userError } = await locals.supabase.auth.getUser();

    if (userError || !user) {
        const returnTo = encodeURIComponent(url.pathname + url.search);
        throw redirect(303, `/no_permission_page_id18?redirectTo=${returnTo}`);
    }

    try {
        const { data: profile, error } = await locals.supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Fehler beim Laden des Profils (student guard):', error);
            throw redirect(303, '/no_permission_page_id18');
        }

        const role = profile?.role || user?.user_metadata?.role || user?.app_metadata?.role;

        // Erlaubte Rollen: student, parent, teacher, admin
        if (!['student', 'parent', 'teacher', 'admin'].includes(role)) {
            throw redirect(303, '/no_permission_page_id18');
        }

        return { session: { user }, role };
    } catch (err) {
        console.error('Unerwarteter Fehler im student guard:', err);
        throw redirect(303, '/no_permission_page_id18');
    }
};
