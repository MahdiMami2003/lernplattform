<script>
    import { onMount } from 'svelte';
    import { _ } from '$lib/i18n/config';
    import { page } from '$app/stores';

    // Optional: returnTo Weitergabe vom Query-String (encoded)
    let returnTo = $state('');
    let requestedPath = $state('');
    let requiredRole = $state(''); // 'parent' | 'student' | 'teacher' | 'admin' | ''

    // Pfad-Listen zur Erkennung der benötigten Rolle
    const parentPaths = ['/parents_landing_page_id4', '/create_appointments_page'];
    const studentPaths = [
        '/progress_page_id11',
        '/game_page_id12',
        '/cloze_game',
        '/mathe_game',
        '/physik_game',
        '/deutsch_game',
        '/englisch_game',
        '/weekly_test_page_id17',
        '/weekly_tests_content_page'
    ];
    const teacherPaths = ['/teacher_landing_page_id6', '/game_management', '/form_for_adding_content', '/form_for_adding_weekly_test', '/class_page_id9', '/class_progress'];
    const adminPaths = ['/admin', '/admin_account'];

    function detectRequiredRole(path) {
        if (!path) return '';
        if (parentPaths.some(p => path.startsWith(p))) return 'parent';
        if (studentPaths.some(p => path.startsWith(p))) return 'student';
        if (teacherPaths.some(p => path.startsWith(p))) return 'teacher';
        if (adminPaths.some(p => path.startsWith(p))) return 'admin';
        return '';
    }

    onMount(() => {
        const unsubscribe = page.subscribe((p) => {
            const params = p.url.searchParams;
            returnTo = params.get('redirectTo') ?? '';
            try {
                requestedPath = returnTo ? decodeURIComponent(returnTo) : '';
            } catch (e) {
                requestedPath = returnTo;
            }
            requiredRole = detectRequiredRole(requestedPath);
        });

        return () => unsubscribe();
    });
</script>

<div class="main_container" style="padding: 2rem; text-align: center; max-width: 720px; margin: 3rem auto;">
    <h1 style="font-size: clamp(1.4rem, 2.2vw, 2rem);">{$_('access.no_permission_title')}</h1>

    {#if requiredRole === 'parent'}
        <p style="margin-top: 1rem; color: var(--text-secondary);">{$_('access.need_role_parent_text')}</p>
    {:else if requiredRole === 'student'}
        <p style="margin-top: 1rem; color: var(--text-secondary);">{$_('access.need_role_student_text')}</p>
    {:else if requiredRole === 'teacher'}
        <p style="margin-top: 1rem; color: var(--text-secondary);">{$_('access.need_role_teacher_text')}</p>
    {:else if requiredRole === 'admin'}
        <p style="margin-top: 1rem; color: var(--text-secondary);">{$_('access.need_role_admin_text')}</p>
    {:else}
        <p style="margin-top: 1rem; color: var(--text-secondary);">{$_('access.no_permission_text')}</p>
    {/if}

    <div style="margin-top: 1.5rem; display:flex; gap: .5rem; justify-content:center; flex-wrap:wrap;">
        <a href={requestedPath ? `/?redirectTo=${encodeURIComponent(requestedPath)}` : '/'}>
            <button class="small-btn">{$_('access.link_to_login')}</button>
        </a>

        <a href="/register_page_id3">
            <button class="small-btn">{$_('access.link_to_register')}</button>
        </a>

        <!-- Statt Zur Startseite: Links zu Terminen und Lernmaterialien, die ohne Login erreichbar sind -->
        <a href="/appointments_page_id8">
            <button class="small-btn">{$_('access.go_to_appointments')}</button>
        </a>

        <a href="/material_page_id14">
            <button class="small-btn">{$_('access.go_to_materials')}</button>
        </a>
    </div>

</div>
