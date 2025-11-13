

<script>
    import { supabase } from '$lib/supabaseClient.js';
    //import { onMount } from 'svelte';

    let profileData = null;
    let loading = true;


</script>

<!--
Mein Stand
Termine und Aktuelles
Starte das Spiel
Wochentests
Lernunterlagen
-->


<body>
<div id="placeholder">
<script>

    let { data, error } = await supabase
        .from('profiles')
        .select('*');
</script>

    <h1>Liebe liebe:r Schüler:in</h1><!-- mit supabase direkt usernamen o.ä. ansprechen  -->
    <div>Herzlich willkommen auf der Website der HSGG Lernwelt</div>
    <div>Bitte klicke auf das Thema das Sie interessiert.</div>
    <br>
    <!--link to the other websites -->
    <ul>
        <li class="landing_liste">
            <a href="/game_page_id12"><h3>Starte das Spiel</h3></a>
            <div class="link_description">Hier geht es zum Spiel (es läd ich will nicht, dass es Läd)</div>
        </li>
        <li class="landing_liste">
            <a href="/weekly_test_page_id17"><h3>Wochentests</h3></a>
            <div class="link_description">Willst du deinen Aktuellen Wissensstand überprüfen</div>
        </li>
        <li class="landing_liste">
            <a href="/progress_page_id11"><h3>Profil</h3></a>
            <div class="link_description">hier geht es zu deinem Fortschritt</div>
        </li>
        <li class="landing_liste">
            <a href="/material_page_id14"><h3>Lernunterlagen </h3></a>
            <div class="link_description">Hier findest du die Lernunterlagen die du dir Herunterladen und bearbeiten kannst.</div>
        </li>

    </ul>



</div>

</body>
<style>
    /* Korrektur: Entfernt den Standard-Padding/Margin, der die Liste verschiebt */
    ul {
        padding: 0;
        margin: 0;
    }

    a{
        margin: 0;
        color: black;
        text-decoration: none;
    }
    .landing_liste{
        list-style-type: none;
        /*border: solid lightgray;*/
        border-color: lightgray;
        border-style: groove;
        border-width: thin;
        margin: 1dvh;
        padding-left: 3dvh;
        background-color: #f5f5dc;
        border-radius: 5px;
    }
    li:hover{
        background-color: #dcdcc5;
    }

    a:hover, a:hover:visited{
        color: #0077cc;
        text-decoration: underline;
    }

    .link_description{
        padding-bottom: 2dvh;
        padding-left: 3dvh;
    }
</style>



