<script>
    import { onMount } from 'svelte';

    let { data } = $props();

    let { supabase, session } = data;


    /** @type {string | null} */
    let userRole = null;

    onMount(async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile) {
                userRole = profile.role;
            }
        }
    });

    async function getTests() {
        const { data, error } = await supabase
            .from('weekly_tests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fehler:', error);
            return [];
        }

        return data || [];
    }

    /**
     * @param {number} id
     */
    async function deleteTest(id) {
        if (!confirm('Wirklich löschen?')) return;

        const { error } = await supabase
            .from('weekly_tests')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Fehler beim Löschen!');
            console.error(error);
        } else {
            window.location.reload();
        }
    }
</script>

<div id="placeholder">
    <div class="header">
        <h1>Wöchentliche Tests</h1>
        {#if userRole === 'admin' || userRole === 'teacher'}
            <a href="/form_for_adding_weekly_test" class="add-button">➕ Test hinzufügen</a>
        {/if}
    </div>

    {#await getTests()}
        <p>Lade Tests...</p>
    {:then tests}
        {#if tests && tests.length > 0}
            <ul class="test-list">
                {#each tests as test}
                    <li class="test-item">
                        <a href="/weekly_tests_content_page/{test.id}" class="test-link">
                            {test.title}
                        </a>

                        {#if userRole === 'admin' || userRole === 'teacher'}
                            <button class="delete-btn" on:click={() => deleteTest(test.id)}>
                                🗑️ Löschen
                            </button>
                        {/if}
                    </li>
                {/each}
            </ul>

            {#if userRole === 'admin' || userRole === 'teacher'}
                <a href="/form_for_adding_weekly_test" class="bottom-btn">➕ Neuen Test hinzufügen</a>
            {/if}
        {:else}
            <p class="empty-message">Noch keine Tests vorhanden.</p>
        {/if}
    {:catch error}
        <p style="color: red;">Fehler beim Laden</p>
    {/await}
</div>

<style>
    #placeholder {
        margin: 0;
        padding: 20px;
        min-height: 100vh;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
    }

    h1 {
        color: #333;
        margin: 0;
    }

    .add-button {
        background: #4CAF50;
        color: white;
        padding: 12px 24px;
        border-radius: 5px;
        text-decoration: none;
        font-weight: bold;
        transition: background 0.3s ease;
    }

    .add-button:hover {
        background: #45a049;
    }

    .test-list {
        list-style: none;
        padding: 0;
        margin-bottom: 20px;
    }

    .test-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        gap: 10px;
    }

    .test-link {
        flex: 1;
        display: block;
        padding: 15px 20px;
        background: #f5f5f5;
        border-left: 4px solid #4CAF50;
        border-radius: 5px;
        text-decoration: none;
        color: #333;
        transition: all 0.3s ease;
    }

    .test-link:hover {
        background: #e8f5e9;
        border-left-color: #2E7D32;
        transform: translateX(5px);
    }

    .delete-btn {
        padding: 10px 16px;
        background: #f44336;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.3s ease;
    }

    .delete-btn:hover {
        background: #d32f2f;
    }

    .bottom-btn {
        display: block;
        margin-top: 20px;
        padding: 15px;
        background: #4CAF50;
        color: white;
        text-align: center;
        text-decoration: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        transition: background 0.3s ease;
    }

    .bottom-btn:hover {
        background: #45a049;
    }

    .empty-message {
        text-align: center;
        color: #999;
        font-style: italic;
        padding: 40px;
    }
</style>