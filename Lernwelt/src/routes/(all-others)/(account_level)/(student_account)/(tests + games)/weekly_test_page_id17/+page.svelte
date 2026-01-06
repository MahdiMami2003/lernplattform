<!--Lernwelt/src/routes/(all-others)/(account_level)/(student_account)/(tests + games)/weekly_test_page_id17/+page.svelte-->
<script>
    import { onMount } from 'svelte';

    let { data } = $props();
    let { supabase, session } = data;

    let userRole = $state(null);
    let editingRight = $state(null);
    let studentClassId = $state(null);

    onMount(async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, editing_right, class_id')
                .eq('id', user.id)
                .single();

            if (profile) {
                userRole = profile.role;
                editingRight = profile.editing_right;
                studentClassId = profile.class_id ?? null;
            }
        }
    });

    function hasEditingRights() {
        return (userRole === 'admin' || userRole === 'teacher') && editingRight === true;
    }

    async function getTests() {
        // Wenn Schüler: filtere nach eigener Klasse + NULL-Fallback
        if (userRole === 'student') {
            const classId = studentClassId;
            const orFilter = classId == null
                ? 'class_id.is.null'
                : `class_id.eq.${classId},class_id.is.null`;
            const { data, error } = await supabase
                .from('weekly_tests')
                .select('*')
                .or(orFilter)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Fehler:', error);
                return [];
            }

            return data || [];
        }
        // Lehrer/Admin: sehen alle
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

    /** @param {number} id */
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

    /** @param {{ link_question?: string; link_answere?: string }} test */
    function getQuestionLink(test) {
        return test.link_question || '';
    }
    /** @param {{ link_question?: string; link_answere?: string }} test */
    function getAnswerLink(test) {
        // Feldname laut DB: link_answere (Typo)
        return test.link_answere || '';
    }
    /** @param {{ class_id?: number|null }} test */
    function getClassLabel(test) {
        return test.class_id ? `Klasse ${test.class_id}` : 'Allgemein';
    }
</script>

<div id="placeholder">
    <div class="header">
        <h1>Wöchentliche Tests</h1>
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
                        <span class="class-badge" title="Zugeordnete Klasse">{getClassLabel(test)}</span>
                        {#if getQuestionLink(test)}
                            <a href={getQuestionLink(test)} target="_blank" rel="noopener" class="small-btn">Fragen-PDF</a>
                        {/if}
                        {#if getAnswerLink(test)}
                            <a href={getAnswerLink(test)} target="_blank" rel="noopener" class="small-btn">Antworten-PDF</a>
                        {/if}
                        {#if hasEditingRights()}
                            <button class="delete-btn" onclick={() => deleteTest(test.id)}>
                                🗑️ Löschen
                            </button>
                        {/if}
                    </li>
                {/each}
            </ul>

            {#if hasEditingRights()}
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
        color: var(--text-primary);
        margin: 0;
        transition: color 0.3s ease;
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
        flex-wrap: wrap;
    }

    .test-link {
        flex: 1;
        display: block;
        padding: 15px 20px;
        background: var(--bg-card, #f5f5f5);
        border-left: 4px solid var(--accent, #4CAF50);
        border-radius: 5px;
        text-decoration: none;
        color: var(--text-primary);
        transition: all 0.3s ease;
    }

    .test-link:hover {
        background: var(--bg-hover, #e8f5e9);
        border-left-color: var(--accent-strong, #2E7D32);
        transform: translateX(5px);
    }

    .class-badge {
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--bg-card);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        font-size: 0.85rem;
        white-space: nowrap;
    }

    .delete-btn {
        padding: 10px 16px;
        background: var(--danger, #f44336);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.3s ease;
    }

    .delete-btn:hover {
        background: var(--danger-strong, #d32f2f);
    }

    .bottom-btn {
        display: block;
        margin-top: 20px;
        padding: 15px;
        background: var(--button-bg, #4CAF50);
        color: var(--text-primary, white);
        text-align: center;
        text-decoration: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        transition: background 0.3s ease;
        border: 1px solid var(--button-border, transparent);
    }

    .bottom-btn:hover {
        background: var(--button-hover, #45a049);
    }

    .empty-message {
        text-align: center;
        color: var(--text-muted, #999);
        font-style: italic;
        padding: 40px;
    }

    .small-btn {
        display: inline-block;
        padding: 8px 12px;
        background: var(--info, #2196F3);
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-size: 14px;
        transition: background 0.3s ease;
    }

    .small-btn:hover {
        background: var(--info-strong, #1976D2);
    }
</style>