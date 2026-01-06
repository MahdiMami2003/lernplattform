<!--Lernwelt/src/routes/(all-others)/(account_level)/(teacher_account)/(classes)/class_page_id9/[class_id]/+page.svelte-->
<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from "svelte";
    import { _ } from '$lib/i18n/config';
    let { data } = $props();
    let { supabase } = data;

    // Types
    type Student = {
        id: string;
        full_name: string;
        avatar_url?: string | null;
        level?: number | null;
        class_id: number | null;
        role: 'student' | 'teacher' | 'admin' | 'parent';
    };
    type ClassItem = { id: number; name: string; grade_level: number };

    let classId = $state<string | number | null>(null);
    let students = $state<Student[]>([]);
    let className = $state<string>("");
    let loading = $state(true);

    // NEW: editing_right and classes list
    let canEdit = $state(false);
    let classes = $state<ClassItem[]>([]);

    onMount(async () => {
        // ID aus URL holen (param ist 'class_id')
        classId = $page.params.class_id ?? null;

        // Profil des aktuellen Users holen, um editing_right zu prüfen
        const { data: authUser } = await supabase.auth.getUser();
        const userId = authUser?.user?.id;
        if (userId) {
            const { data: myProfile } = await supabase
                .from('profiles')
                .select('editing_right')
                .eq('id', userId)
                .single();
            canEdit = !!myProfile?.editing_right;
        }

        // Klassenliste laden für Dropdown
        const { data: clsList } = await supabase
            .from('classes')
            .select('*')
            .order('grade_level', { ascending: true })
            .order('name', { ascending: true });
        classes = (clsList || []) as ClassItem[];

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

        if (!error) students = (list || []) as Student[];
        loading = false;
    });

    // NEW: Handler zum Ändern der Klasse eines Schülers
    async function updateStudentClass(studentId: string, newClassId: number) {
        if (!canEdit) return;
        const { error } = await supabase
            .from('profiles')
            .update({ class_id: newClassId })
            .eq('id', studentId);
        if (!error) {
            // UI aktualisieren
            students = students.map(s => s.id === studentId ? { ...s, class_id: newClassId } : s);
        } else {
            console.error('Fehler beim Aktualisieren der Klasse:', error?.message);
            alert('Fehler beim Aktualisieren der Klasse: ' + (error?.message || 'Unbekannter Fehler'));
        }
    }

    function onAvatarError(ev: Event, name: string) {
        const img = ev.currentTarget as HTMLImageElement | null;
        if (img) {
            img.src = `https://ui-avatars.com/api/?name=${name}&background=random`;
        }
    }

    function handleClassSelectChange(studentId: string, ev: Event) {
        const select = ev.currentTarget as HTMLSelectElement | null;
        if (!select) return;
        const newClassId = parseInt(select.value);
        if (!Number.isNaN(newClassId)) updateStudentClass(studentId, newClassId);
    }
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
                        <!-- NEW: Klassenwechsel -->
                        {#if canEdit}
                            <th>Klasse ändern</th>
                        {/if}
                    </tr>
                    </thead>
                    <tbody>
                    {#each students as student}
                        <tr>
                            <td>
                                <img
                                    src={student.avatar_url}
                                    class="table-avatar" alt="Avatar"
                                    onerror={(ev) => onAvatarError(ev, student.full_name)}
                                />
                            </td>
                            <td><strong>{student.full_name}</strong></td>
                            <td><span class="level-badge">Lvl {student.level || 1}</span></td>
                            <td>
                                <a href={"/progress_page_id11?userId=" + student.id}>
                                    <button class="action-btn">{$_("teacher_class.button.progress")}</button>
                                </a>
                            </td>
                            {#if canEdit}
                                <td>
                                    <select class="class-select" bind:value={student.class_id} onchange={(ev) => handleClassSelectChange(student.id, ev)}>
                                        {#each classes as c}
                                            <option value={c.id}>{c.name} (Kl. {c.grade_level})</option>
                                        {/each}
                                    </select>
                                </td>
                            {/if}
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

    /* NEW */
    .class-select { padding: 0.35rem 0.5rem; border-radius: 6px; border: 1px solid #ddd; background: #fff; }
</style>