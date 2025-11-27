<script>
    import { page } from '$app/stores';
    import { supabase } from "$lib/supabaseClient.js";
    import { onMount } from "svelte";

    let classId = $page.params.class_id;

    let students = $state([]);
    let className = $state("");
    let loading = $state(true);

    onMount(async () => {
        // 1. Namen der Klasse holen
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('name')
            .eq('id', classId)
            .single();

        if (classData) className = classData.name;

        // 2. Schüler holen (MIT DER ZWISCHENTABELLE)
        // Wir fragen 'profiles' ab, filtern aber basierend auf 'has_schoolclass'
        const { data: studentData, error: studentError } = await supabase
            .from('profiles')
            .select(`
                full_name,
                role,
                has_schoolclass!inner(class_id)
            `)
            // Der Filter greift auf die verknüpfte Tabelle zu:
            .eq('has_schoolclass.class_id', classId);

        if (studentError) {
            console.error("Fehler beim Laden der Schüler:", studentError);
        } else {
            students = studentData;
        }
        loading = false;
    });
</script>


<div class="container">
    <a href="/teacher_landing_page_id6" class="back-link">← Zurück zur Übersicht</a>


    {#if loading}
        <p>Lade Klassendaten...</p>
    {:else}
        <h1>Mitglieder der {className}</h1>

        <div class="student-list">
            {#if students.length === 0}
                <p>Noch keine Schüler in dieser Klasse registriert.</p>
            {:else}
                <table>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Rolle</th>
                    </tr>
                    </thead>
                    <tbody>
                    {#each students as student}
                        <tr>
                            <td>{student.full_name}</td>
                            {#if ((student.role === 'admin')||(student.role === 'teacher'))}<td>Lehrperson </td>{:else}<td>Schüler*in </td>{/if}
                        </tr>
                    {/each}
                    </tbody>
                </table>
            {/if}
        </div>
    {/if}
</div>


<style>
    .container {
        padding: 2rem;
        font-family: "Inter", sans-serif;
        max-width: 800px;
        margin: 0 auto;
        height: 100vh;
    }
    .back-link {
        display: inline-block;
        margin-bottom: 1rem;
        color: #666;
        text-decoration: none;
    }
    .back-link:hover { text-decoration: underline; color: #000; }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
    }
    th, td {
        text-align: left;
        padding: 0.8rem;
        border-bottom: 1px solid #ddd;
    }
    th {
        background-color: #fbead7;
    }
</style>