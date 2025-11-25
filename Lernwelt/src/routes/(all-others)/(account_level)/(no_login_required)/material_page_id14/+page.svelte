<script>
    import { supabase } from '$lib/supabaseClient.js';
    import { global_material_id } from '$lib/state.svelte.js';
    import { onMount } from 'svelte';

    /** @type {string | null} */
    let userRole = null;

    /** @type {string | null} */
    let userClass = null;

    onMount(async () => {
        // Hole den eingeloggten User
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Hole Profil aus DB
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, school_class')
                .eq('id', user.id)
                .single();

            if (profile) {
                userRole = profile.role;
                userClass = profile.school_class;
            }
        }
    });

    async function getMaterials() {
        let query = supabase
            .from('materials')
            .select('*')
            .order('subject', { ascending: true });

        // Filter nach Klasse (NUR für Studenten)
        if (userClass && userRole === 'student') {
            query = query.eq('school_class', userClass);
        }

        let {data: materials, error} = await query;

        if (error) {
            console.error('Fehler:', error);
            return [];
        }

        return materials || [];
    }

    /**
     * @param {any[]} materials
     * @returns {Record<string, any[]>}
     */
    function groupBySubject(materials) {
        /** @type {Record<string, any[]>} */
        const grouped = {};

        materials.forEach(material => {
            if (!grouped[material.subject]) {
                grouped[material.subject] = [];
            }
            grouped[material.subject].push(material);
        });

        return grouped;
    }

    /**
     * @param {number} id
     */
    function set_material_id(id) {
        global_material_id.aktuelleID = id;
    }

    /**
     * @param {number} id
     */
    async function deleteMaterial(id) {
        if (!confirm('Wirklich löschen?')) return;

        const { error } = await supabase
            .from('materials')
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
        <h1>Übersicht Lerninhalte</h1>
        {#if userRole === 'admin' || userRole === 'teacher'}
            <a href="/aufgabe_hinzufuegen" class="add-button">➕ Aufgabe hinzufügen</a>
        {/if}
    </div>

    {#await getMaterials()}
        <p>Lade Materialien...</p>
    {:then materials}
        {#if materials && materials.length > 0}
            {@const groupedMaterials = groupBySubject(materials)}

            {#each Object.entries(groupedMaterials) as [subject, items]}
                <section class="subject-section">
                    <h2>{subject}</h2>
                    <ul>
                        {#each items as material}
                            <li class="material-item">
                                <a href="/materials_content_page_16/{material.id}" class="material-link">
                                    {material.title}
                                </a>

                                {#if userRole === 'admin' || userRole === 'teacher'}
                                    <div class="action-buttons">
                                        <button class="edit-btn" on:click={() => window.location.href = `/edit_material/${material.id}`}>
                                            ✏️ Bearbeiten
                                        </button>
                                        <button class="delete-btn" on:click={() => deleteMaterial(material.id)}>
                                            🗑️ Löschen
                                        </button>
                                    </div>
                                {/if}
                            </li>
                        {/each}
                    </ul>
                </section>
            {/each}
        {:else}
            <p>Keine Materialien für deine Klasse gefunden.</p>
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

    .subject-section {
        margin-bottom: 40px;
    }

    .subject-section h2 {
        color: #4CAF50;
        border-bottom: 3px solid #4CAF50;
        padding-bottom: 10px;
        margin-bottom: 15px;
    }

    ul {
        list-style: none;
        padding: 0;
    }

    .material-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        gap: 10px;
    }

    .material-link {
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

    .material-link:hover {
        background: #e8f5e9;
        border-left-color: #2E7D32;
        transform: translateX(5px);
    }

    .action-buttons {
        display: flex;
        gap: 8px;
    }

    .edit-btn, .delete-btn {
        padding: 10px 16px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;
        white-space: nowrap;
    }

    .edit-btn {
        background: #2196F3;
        color: white;
    }

    .edit-btn:hover {
        background: #1976D2;
    }

    .delete-btn {
        background: #f44336;
        color: white;
    }

    .delete-btn:hover {
        background: #d32f2f;
    }
</style>