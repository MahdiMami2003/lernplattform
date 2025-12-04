<script>
    import { page } from '$app/stores';

    let showAnswers = $state(false);


    let { data } = $props();

    let { supabase, session } = data;

    /**
     * @returns {Promise<any>}
     */
    async function getTest() {
        const testId = $page.params.id;

        if (!testId) {
            return null;
        }

        const { data, error } = await supabase
            .from('weekly_tests')
            .select('*')
            .eq('id', testId)
            .single();

        if (error) {
            console.error('Fehler beim Laden:', error);
            return null;
        }

        return data;
    }

    /**
     * @param {string} url
     * @param {string} filename
     */
    async function downloadPDF(url, filename) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();

            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download fehlgeschlagen:', error);
            alert('Download fehlgeschlagen. Bitte versuche es erneut.');
        }
    }
</script>

<div id="content-container">
    {#await getTest()}
        <p>Lade Test...</p>
    {:then test}
        {#if test}
            <div class="test-detail">
                <h1>{test.title}</h1>

                <!-- Aufgaben-PDF -->
                {#if test.link_question}
                    <div class="pdf-section">
                        <h2>Aufgabenstellung</h2>
                        <iframe
                                src={test.link_question}
                                title="Aufgaben PDF"
                                class="pdf-viewer"
                        ></iframe>

                        <div class="button-group">
                            <button
                                    class="download-btn"
                                    on:click={() => downloadPDF(test.link_question, `${test.title}_Aufgaben.pdf`)}
                            >
                                📥 Aufgaben herunterladen
                            </button>

                            <button
                                    class="show-answers-btn"
                                    on:click={() => showAnswers = !showAnswers}
                            >
                                {showAnswers ? '🔼 Lösungen ausblenden' : '🔽 Lösungen anzeigen'}
                            </button>
                        </div>
                    </div>
                {:else}
                    <p class="no-pdf">Keine Aufgaben verfügbar</p>
                {/if}

                <!-- Lösungs-PDF (nur wenn Button geklickt) -->
                {#if showAnswers && test.link_answere}
                    <div class="pdf-section answers-section">
                        <h2>Lösungen</h2>
                        <iframe
                                src={test.link_answere}
                                title="Lösungen PDF"
                                class="pdf-viewer"
                        ></iframe>

                        <button
                                class="download-btn"
                                on:click={() => downloadPDF(test.link_answere, `${test.title}_Loesungen.pdf`)}
                        >
                            📥 Lösungen herunterladen
                        </button>
                    </div>
                {/if}
            </div>
        {:else}
            <div class="error">
                <h1>Test nicht gefunden</h1>
                <p>Der angeforderte Test existiert nicht.</p>
                <a href="/weekly_test_page_id17">← Zurück zur Übersicht</a>
            </div>
        {/if}
    {:catch error}
        <div class="error">
            <h1>Fehler beim Laden</h1>
            <p>Es gab ein Problem beim Laden des Tests.</p>
            <a href="/weekly_test_page_id17">← Zurück zur Übersicht</a>
        </div>
    {/await}
</div>

<style>
    #content-container {
        margin: 0;
        padding: 40px 20px;
        max-width: 1200px;
        margin: 0 auto;
        min-height: 100vh;
    }

    .test-detail h1 {
        font-size: 2.5em;
        color: #333;
        margin-bottom: 30px;
        text-align: center;
    }

    .pdf-section {
        margin-top: 20px;
        margin-bottom: 40px;
    }

    .pdf-section h2 {
        color: #4CAF50;
        margin-bottom: 15px;
        font-size: 1.5em;
    }

    .answers-section h2 {
        color: #2196F3;
    }

    .pdf-viewer {
        width: 100%;
        height: 85vh;
        border: 2px solid #ddd;
        border-radius: 8px;
        margin-bottom: 15px;
    }

    .button-group {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
    }

    .download-btn, .show-answers-btn {
        display: inline-block;
        background: #4CAF50;
        color: white;
        padding: 12px 24px;
        border-radius: 5px;
        border: none;
        text-align: center;
        font-weight: bold;
        font-size: 16px;
        transition: background 0.3s ease;
        cursor: pointer;
    }

    .show-answers-btn {
        background: #2196F3;
    }

    .download-btn:hover {
        background: #45a049;
    }

    .show-answers-btn:hover {
        background: #1976D2;
    }

    .no-pdf {
        text-align: center;
        color: #999;
        font-style: italic;
        margin-top: 50px;
    }

    .error {
        text-align: center;
        padding: 50px 20px;
    }

    .error h1 {
        color: #f44336;
    }

    .error a {
        display: inline-block;
        margin-top: 20px;
        color: #4CAF50;
        text-decoration: none;
        font-weight: bold;
    }

    .error a:hover {
        text-decoration: underline;
    }

    @media (max-width: 768px) {
        .button-group {
            flex-direction: column;
        }

        .download-btn, .show-answers-btn {
            width: 100%;
        }
    }
</style>