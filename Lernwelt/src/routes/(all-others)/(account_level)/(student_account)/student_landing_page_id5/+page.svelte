<script lang="ts">
    import { supabase } from "$lib/supabaseClient";
    import { onMount } from "svelte";




</script>


<body>
<div id="placeholder">
    <h1>Hallo liebe:r Schüler:in</h1>
    <div>Herzlich willkommen auf der Website der HSGG Lernwelt</div>
    <div>Bitte klicke auf das Thema das dich interessiert.</div>
    <br>

    <ul>
        <li class="landing_liste">
            <a href="/game_page_id12"><h3>Game Page</h3></a>
            <div class="link_description">Aufgaben & Gamification!</div>
        </li>

        <li class="landing_liste">
            <a href="/weekly_test_page_id17"><h3>Weekly Tests</h3></a>
            <div class="link_description">Wöchentliche Kompetenzchecks</div>
        </li>

        <li class="landing_liste">
            <a href="/progress_page_id11"><h3>Fortschritt</h3></a>
            <div class="link_description">Deine Lernstatistiken im Überblick</div>
        </li>

        <li class="landing_liste">
            <a href="/material_page_id14"><h3>Lernunterlagen</h3></a>
            <div class="link_description">Materialien für dein Lernen</div>
        </li>
    </ul>
</div>
</body>



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

    .landing_liste {
        list-style-type: none;
        border: solid thin lightgray;
        margin: 1dvh;
        padding-left: 3dvh;
        background-color: #f5f5dc;
        border-radius: 5px;
    }

    li:hover {
        background-color: #dcdcc5;
    }

    a:hover {
        color: #0077cc;
        text-decoration: underline;
    }

    .link_description {
        padding-bottom: 2dvh;
        padding-left: 3dvh;
    }


</style>
