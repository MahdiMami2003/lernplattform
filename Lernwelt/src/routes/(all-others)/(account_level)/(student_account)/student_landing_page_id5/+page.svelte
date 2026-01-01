<script lang="ts">
    import { onMount } from "svelte";

    let { data } = $props();

    let { supabase, session } = data;

    import { _ } from '$lib/i18n/config';

    let user = session?.user.user_metadata.full_name || $_('student.generic_name');
</script>

<div id="placeholder" class="main_container">
    <h1>{$_('student.title')}{user}</h1>
    <div class="subtitle">{$_('student.welcome')}</div>
    <div class="subtitle">{$_('student.choose_topic')}</div>
    <br />

    <ul>
        <li class="landing_list">
            <a href="/game_page_id12">
                <h3>{$_('student.game_title')}</h3>
            </a>
            <div class="link_description">{$_('student.game_desc')}</div>
        </li>

        <li class="landing_list">
            <a href="/weekly_test_page_id17">
                <h3>{$_('student.weekly_title')}</h3>
            </a>
            <div class="link_description">{$_('student.weekly_desc')}</div>
        </li>

        <li class="landing_list">
            <a href="/progress_page_id11">
                <h3>{$_('student.progress_title')}</h3>
            </a>
            <div class="link_description">{$_('student.progress_desc')}</div>
        </li>

        <li class="landing_list">
            <a href="/material_page_id14">
                <h3>{$_('student.materials_title')}</h3>
            </a>
            <div class="link_description">{$_('student.materials_desc')}</div>
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
    .landing_list {
        background: var(--bg-card); /* ← Variable statt #fff7e6 */
        border-radius: 1.4rem;
        padding: 1.6rem;
        border: 2px solid var(--border-color); /* ← Variable statt #f0d9a6 */
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        transition: all 0.3s ease; /* ← erweitert für smooth transition */
    }

    .landing_list:hover {
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

        .landing_list {
            padding: 1.2rem;
        }
    }
</style>