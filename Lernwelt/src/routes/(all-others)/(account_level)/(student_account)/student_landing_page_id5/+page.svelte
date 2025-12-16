<script lang="ts">

    import { onMount } from "svelte";


    let { data } = $props();

    let { supabase, session } = data;

    import { _ } from '$lib/i18n/config';
</script>



<div id="placeholder">
    <h1>{$_('student.title')}</h1>
    <div>{$_('student.welcome')}</div>
    <div>{$_('student.choose_topic')}</div>
    <br />

    <ul>
        <li class="landing_list">
            <a href="/game_page_id12"><h3>{$_('student.game_title')}</h3></a>
            <div class="link_description">{$_('student.game_desc')}</div>
        </li>

        <li class="landing_list">
            <a href="/weekly_test_page_id17"><h3>{$_('student.weekly_title')}</h3></a>
            <div class="link_description">{$_('student.weekly_desc')}</div>
        </li>

        <li class="landing_list">
            <a href="/progress_page_id11"><h3>{$_('student.progress_title')}</h3></a>
            <div class="link_description">{$_('student.progress_desc')}</div>
        </li>

        <li class="landing_list">
            <a href="/material_page_id14"><h3>{$_('student.materials_title')}</h3></a>
            <div class="link_description">{$_('student.materials_desc')}</div>
        </li>
    </ul>
</div>




<style>
    ul {
        padding: 0;
        margin: 0;
    }

    a {
        margin: 0;
        color: black;
        text-decoration: none;
    }

    #placeholder {
        max-width: 1100px;
        margin: 2rem auto;
        padding: 2rem;
        background-color: #f5f5dc;
        border-radius: 1rem;
    }
    #placeholder ul {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-top: 2rem;
    }
    /*li:hover {
        background-color: #dcdcc5;
    }*/
    .landing_list {
        background: #fff7e6;
        border-radius: 1.4rem;
        padding: 1.6rem;
        border: 2px solid #f0d9a6;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .landing_list:hover {
        transform: translateY(-6px);
        box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
    }
    a:hover {
        color: #0077cc;
        text-decoration: underline;
    }

    .link_description {
        margin-top: 0.6rem;
        font-size: 0.95rem;
        color: #444;
    }


</style>
