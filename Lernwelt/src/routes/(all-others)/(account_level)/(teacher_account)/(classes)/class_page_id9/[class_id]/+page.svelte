<script>
    import { page } from '$app/stores';
    import { onMount } from "svelte";
    import { _ } from '$lib/i18n/config';
    let { data } = $props();
    let { supabase } = data;

    let classId = $state("");
    let students = $state([]);
    let className = $state("");
    let loading = $state(true);

    onMount(async () => {
        // ID aus URL holen
        classId = $page.params.classId || $page.params.class_id || $page.params.slug;

        if (!classId) { loading = false; return; }

        // Klassenname
        const { data: cls } = await supabase
            .from('classes')
            .select('name')
            .eq('id', classId)
            .single();
        if (cls) className = cls.name;

        // Schüler laden (Nur Schüler dieser Klasse)
        const { data: list, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('class_id', classId)
            .eq('role', 'student')
            .order('full_name');

        if (!error) students = list || [];
        loading = false;
    });
</script>

<div class="container">
    <a href="/teacher_landing_page_id6" class="back-link">←{$_("pedagogy.errors.back_link")}</a>

    {#if loading}
        <div class="loading-state">{$_("teacher_class.loading")}</div>
    {:else}
        <div class="header">
            <h1>{$_("teacher_class.title")} {className || 'Unbekannt'}</h1>
            <p>{$_("teacher_class.subtitle")}</p>
        </div>

        {#if students.length === 0}
            <div class="empty-state">{$_("teacher_class.empty")}</div>
        {:else}
            <div class="table-wrapper">
                <table class="styled-table">
                    <thead>
                    <tr>
                        <th>{$_("teacher_class.table.avatar")}</th>
                        <th>{$_("teacher_class.table.name")}</th>
                        <th>{$_("teacher_class.table.level")}</th>
                        <th>{$_("teacher_class.table.action")}</th>

                    </tr>
                    </thead>
                    <tbody>
                    {#each students as student}
                        <tr>
                            <td>
                                <img
                                        src={student.avatar_url}
                                        class="table-avatar" alt="Avatar"
                                        onerror={(e) => e.target.src = `https://ui-avatars.com/api/?name=${student.full_name}&background=random`}
                                />
                            </td>
                            <td><strong>{student.full_name}</strong></td>
                            <td><span class="level-badge">Lvl {student.level || 1}</span></td>
                            <td>
                                <a href={"/progress_page_id11?userId=" + student.id}>
                                    <button class="action-btn">{$_("teacher_class.button.progress")}</button>
                                </a>
                            </td>
                        </tr>
                    {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    {/if}
</div>

<style>
    /* ... Deine Styles von vorhin (die waren gut!) ... */
    .container { max-width: 900px; margin: 0 auto; padding: 2rem; font-family: "Inter", sans-serif; }
    .back-link { display: inline-block; margin-bottom: 1.5rem; color: #666; text-decoration: none; padding: 0.5rem 1rem; background: #f5f5f5; border-radius: 8px; }
    .table-wrapper { border: 1px solid #eee; border-radius: 12px; overflow: hidden; margin-top: 1.5rem; }
    .styled-table { width: 100%; border-collapse: collapse; background: white; }
    .styled-table th { background: #f3be6a; color: white; text-align: left; padding: 1rem; }
    .styled-table td { padding: 1rem; border-bottom: 1px solid #f0f0f0; }
    .table-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
    .level-badge { background: #e3f2fd; color: #1565c0; padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.8rem; font-weight: bold; }
    .action-btn { background: #236c93; color: white; border: none; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .loading-state, .empty-state { text-align: center; padding: 3rem; color: #888; background: #f9f9f9; border-radius: 12px; }
</style>