

<script>
    import { supabase } from '$lib/supabaseClient.js';
    import { onMount } from 'svelte';

    let profileData = null;
    let loading = true;
    let error = null;

    // 2. Nutze "onMount" (wird geladen, wenn die Seite startet)
    onMount(async () => {
        try {
            loading = true;

            // 3. HIER IST DER SUPABASE-BEFEHL
            // Holt alle Daten (*) aus der Tabelle 'profiles'
            // (Wie in Bennets Anleitung )
            const { data, error: dbError } = await supabase
                .from('profiles')
                .select('*')
                .single(); // .single() nimmt an, dass du nur 1 Profil (das eigene) willst

            if (dbError) {
                throw dbError;
            }

            profileData = data;

        } catch (e) {
            error = e.message;
            console.error(e);
        } finally {
            loading = false;
        }
    });
</script>

<body>
<div id="placeholder">
</div>
</body>

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


