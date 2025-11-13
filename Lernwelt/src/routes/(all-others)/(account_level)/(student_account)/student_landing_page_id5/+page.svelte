

<script>
    import { supabase } from '$lib/supabaseClient.js';
    import { onMount } from 'svelte';

    let profileData = null;
    let loading = true;


    async function test () {
        let {data, error} = await supabase.auth.signUp({
            email: 'someone@email.com',
            password: 'LAPnFdDNYIXpbueIKdKj'
        })
    }

</script>


<div id="placeholder">

    <h1>Willkommen auf deiner Seite!</h1>

    <button onclick="{test}">hey</button>

    <nav>
        <ul>
            <li><a href="/spiel">Starte das Spiel</a></li>
            <li><a href="/wochentest">Wochentest</a></li>
            <li><a href="/lernunterlagen">Lernunterlagen</a></li>

        </ul>

    </nav>
</div>




<style>
    div{
        margin: 0;
        height: 200dvh;
    }
</style>

<!--
Mein Stand
Termine und Aktuelles
Starte das Spiel
Wochentests
Lernunterlagen
-->


