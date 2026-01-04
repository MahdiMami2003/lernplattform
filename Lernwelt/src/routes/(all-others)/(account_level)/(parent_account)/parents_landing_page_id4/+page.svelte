<!-- Lernwelt/src/routes/(all-others)/(account_level)/(parent_account)/parents_landing_page_id4/+page.svelte-->
<script>
    import { onMount } from 'svelte';
    let { data } = $props();

    let { supabase, session } = data;

    import { _ } from '$lib/i18n/config';

    let role = $state(null);
    onMount(async () => {
        try {
            const { data: userData } = await supabase.auth.getUser();
            const uid = userData?.user?.id;
            if (uid) {
                const { data: prof } = await supabase.from('profiles').select('role').eq('id', uid).single();
                role = prof?.role || null;
            }
        } catch {}
    });
</script>

<div id="placeholder" class="main_container">
    <h1>{$_('parent.title')}</h1>
    <div class="subtitle">{$_('parent.welcome')}</div>
    <div class="subtitle">{$_('parent.instruction')}</div>
    {#if role === 'admin'}
        <p style="text-align:center; margin-top: 0.5rem;">
            <a href="/admin_landing_page" class="class-link">🛡️ Zum Admin-Dashboard</a>
        </p>
    {/if}
    <br>

    <!-- Link to the other websites -->
    <ul>
        <li class="landing_liste">
            <a href="/appointments_page_id8">
                <h3>{$_('parent.sections.appointments_title')}</h3>
            </a>
            <div class="link_description">
                {$_('parent.sections.appointments_desc')}
            </div>
        </li>

        <li class="landing_liste">
            <a href="/progress_page_id11">
                <h3>{$_('parent.sections.progress_title')}</h3>
            </a>
            <div class="link_description">
                {$_('parent.sections.progress_desc')}
            </div>
        </li>

        <li class="landing_liste">
            <a href="/pedagogy_page_id10">
                <h3>{$_('parent.sections.tips_title')}</h3>
            </a>
            <div class="link_description">
                {$_('parent.sections.tips_desc')}
            </div>
        </li>

        <li class="landing_liste">
            <a href="/material_page_id14">
                <h3>{$_('parent.sections.materials_title')}</h3>
            </a>
            <div class="link_description">
                {$_('parent.sections.materials_desc')}
            </div>
        </li>
    </ul>


</div>

<style>
    /* ============ MAIN CONTAINER ============ */
    #placeholder {
        max-width: 1100px;
        margin: 2rem auto;
        padding: 2rem;
        background-color: var(--bg-main); /* ← Variable statt #f5f5dc */
        border-radius: 1rem;
        transition: background-color 0.3s ease;
    }

    /* ============ TYPOGRAPHY ============ */
    h1 {
        color: var(--text-primary); /* ← Variable */
        margin-bottom: 1rem;
        transition: color 0.3s ease;
    }

    .subtitle {
        color: var(--text-secondary); /* ← Variable */
        margin-bottom: 0.5rem;
        transition: color 0.3s ease;
    }

    /* ============ LIST STYLES ============ */
    ul {
        padding: 0;
        margin: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-top: 2rem;
    }

    /* ============ LANDING CARDS ============ */
    .landing_liste {
        background: var(--bg-card); /* ← Variable statt #fff7e6 */
        border-radius: 1.4rem;
        padding: 1.6rem;
        border: 2px solid var(--border-color); /* ← Variable statt #f0d9a6 */
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        transition: all 0.3s ease; /* ← erweitert für smooth transition */
    }

    .landing_liste:hover {
        transform: translateY(-6px);
        box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
        background: var(--bg-hover); /* ← Variable für Hover */
    }

    /* ============ LINKS ============ */
    a {
        margin: 0;
        color: var(--text-primary); /* ← Variable statt black */
        text-decoration: none;
        transition: color 0.2s ease;
    }

    a:hover {
        color: var(--button-bg); /* ← Variable statt #0077cc */
        text-decoration: underline;
    }

    a:focus-visible {
        outline: 2px solid var(--button-bg);
        outline-offset: 2px;
        border-radius: 0.25rem;
    }

    /* ============ LINK DESCRIPTION ============ */
    .link_description {
        margin-top: 0.6rem;
        font-size: 0.95rem;
        color: var(--text-secondary); /* ← Variable statt #444 */
        transition: color 0.3s ease;
    }

    /* ============ HEADING IN CARDS ============ */
    h3 {
        color: var(--text-primary);
        margin: 0;
        transition: color 0.3s ease;
    }

    /* ============ RESPONSIVE ============ */
    @media (max-width: 768px) {
        #placeholder {
            margin: 1rem;
            padding: 1.5rem;
        }

        .landing_liste {
            padding: 1.2rem;
        }
    }
</style>