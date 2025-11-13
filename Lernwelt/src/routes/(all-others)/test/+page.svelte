<script>
    // 1. Importiere den Client und onMount
    import { supabase } from '$lib/supabaseClient.js';
    import { onMount } from 'svelte';

    // 2. Variablen für die Anzeige des Ergebnisses
    let status = "Teste Verbindung zu Supabase...";
    let testData = null;
    let testError = null;

    // 3. Führe den Test aus, sobald die Seite geladen ist
    onMount(async () => {
        try {
            // 4. DER EIGENTLICHE BEFEHL:
            // Wir holen die erste Zeile (*) aus der Tabelle 'profiles'
            const { data, error } = await supabase
                .from('profiles')
                .select('*') // Wähle alle Spalten
                .limit(1);   // Aber nur 1 Zeile

            if (error) {
                // Falls Supabase einen Fehler meldet (z.B. RLS-Policy blockiert)
                throw error;
            }

            // 5. ERFOLGSFALL (Verbindung UND Abfrage klappen)
            status = "Verbindung erfolgreich!";
            testData = data;

        } catch (e) {
            // 6. FEHLERFALL (Verbindung ODER Abfrage schlägt fehl)
            status = "Verbindung fehlgeschlagen oder Fehler bei Abfrage.";
            testError = e.message;
            console.error(e); // Zeige den vollen Fehler in der Browser-Konsole
        }
    });
</script>

<h1>Supabase-Verbindungstest</h1>
<p><strong>Status:</strong> {status}</p>

{#if testData}
    <h3>✅ Erfolgreich abgerufene Daten:</h3>
    <pre>{JSON.stringify(testData, null, 2)}</pre>
{/if}

{#if testError}
    <h3>❌ Fehlerdetails:</h3>
    <pre>{testError}</pre>
{/if}