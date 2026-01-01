<!-- (account_level) -> (admin_account) -> admin_landing_page -->
<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { slide, fade } from "svelte/transition";

    let { data } = $props();
    let { supabase, session } = data;

    // --- TYPES ---
    type Profile = {
        id: string;
        full_name: string;
        role: 'student' | 'teacher' | 'admin' | 'parent';
        editing_right: boolean;
    };

    type SchoolClass = {
        id: number;
        name: string;
        grade_level: number;
    };

    // --- STATE ---
    let users = $state<Profile[]>([]);
    let classes = $state<SchoolClass[]>([]);
    let loading = $state(true);
    let currentUserRole = $state('');

    // Sektoren-Status (welche sind aufgeklappt?)
    let isOpen = $state({
        admins: true,
        teachers: true,
        parents: true,
        classes: true
    });

    // Gruppierungen (Automatisch gefiltert)
    let admins = $derived(users.filter(u => u.role === 'admin'));
    let teachers = $derived(users.filter(u => u.role === 'teacher'));
    let parents = $derived(users.filter(u => u.role === 'parent'));

    // Modal State für Klassen
    let showClassModal = $state(false);
    let newClass = $state({ name: '', grade: '' });

    // --- INIT ---
    async function init() {
        loading = true;
        // 1. Admin Check
        const { data: myProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session?.user?.id)
            .single();

        currentUserRole = myProfile?.role || 'student';

        if (currentUserRole !== 'admin') {
            goto('/');
            return;
        }

        // 2. Daten laden
        await Promise.all([loadUsers(), loadClasses()]);
        loading = false;
    }

    async function loadUsers() {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .in('role', ['teacher', 'admin', 'parent'])
            .order('full_name', { ascending: true });

        if (!error && profiles) users = profiles;
    }

    async function loadClasses() {
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .order('grade_level', { ascending: true })
            .order('name', { ascending: true });

        if (!error && data) classes = data;
    }

    // --- USER ACTIONS ---
    async function toggleRights(user: Profile) {
        const newStatus = !user.editing_right;
        const { error } = await supabase
            .from('profiles')
            .update({ editing_right: newStatus })
            .eq('id', user.id);

        if (error) alert("Fehler: " + error.message);
        else users = users.map(u => u.id === user.id ? { ...u, editing_right: newStatus } : u);
    }

    async function changeRole(user: Profile, newRole: string) {
        if (!confirm(`Rolle von "${user.full_name}" zu "${newRole}" ändern?`)) return;

        const updates: any = { role: newRole };
        if (newRole === 'student') updates.editing_right = false;

        const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);

        if (error) {
            alert("Fehler: " + error.message);
        } else {
            if (newRole === 'student') users = users.filter(u => u.id !== user.id);
            else users = users.map(u => u.id === user.id ? { ...u, role: newRole as any } : u);
        }
    }

    // --- CLASS ACTIONS ---
    async function createClass() {
        if (!newClass.name || !newClass.grade) return alert("Bitte Name und Stufe angeben.");

        const { data: created, error } = await supabase
            .from('classes')
            .insert({ name: newClass.name, grade_level: parseInt(newClass.grade) })
            .select()
            .single();

        if (error) {
            alert("Fehler beim Erstellen: " + error.message);
        } else {
            classes = [...classes, created].sort((a, b) => a.grade_level - b.grade_level);
            showClassModal = false;
            newClass = { name: '', grade: '' }; // Reset
        }
    }

    async function deleteClass(cls: SchoolClass) {
        if (!confirm(`Klasse "${cls.name}" wirklich löschen?`)) return;

        const { error } = await supabase.from('classes').delete().eq('id', cls.id);

        if (error) alert("Fehler: " + error.message);
        else classes = classes.filter(c => c.id !== cls.id);
    }

    // Hilfsfunktion für Accessibility (Tastatur-Support für Divs)
    function handleKeydown(e: KeyboardEvent, key: string) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            // @ts-ignore
            isOpen[key] = !isOpen[key];
        }
    }

    function toggleSection(key: string) {
        // @ts-ignore
        isOpen[key] = !isOpen[key];
    }

    onMount(() => {
        if (!session) goto('/');
        else init();
    });
</script>

{#snippet userTable(groupUsers: Profile[], emptyText: string)}
    {#if groupUsers.length === 0}
        <div class="empty">{emptyText}</div>
    {:else}
        <div class="table-responsive">
            <table>
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Rechte</th>
                    <th style="text-align: right;">Aktionen</th>
                </tr>
                </thead>
                <tbody>
                {#each groupUsers as user (user.id)}
                    {@const isMe = user.id === session.user.id}

                    <tr class={(user.role !== 'admin' && !user.editing_right) ? 'pending' : ''}>
                        <td>
                            <div class="user-info">
                                <strong>{user.full_name || 'Unbekannt'}</strong>
                                <small class="uuid">{user.id.slice(0,8)}...</small>
                            </div>
                        </td>
                        <td>
                            {#if user.editing_right}
                                <span class="status-ok">✅ Editierrechte</span>
                            {:else}
                                <span class="status-no">⛔ Nur Lesen</span>
                            {/if}
                        </td>
                        <td style="overflow: visible;">
                            <div class="actions">
                                {#if !isMe}
                                    <button
                                            class="btn-small {user.editing_right ? 'revoke' : 'grant'}"
                                            onclick={() => toggleRights(user)}
                                    >
                                        {user.editing_right ? 'Entziehen' : 'Erlauben'}
                                    </button>

                                    <div class="dropdown-wrapper">
                                        <button class="btn-small secondary">Rolle ▼</button>
                                        <div class="dropdown-content">
                                            {#if user.role !== 'teacher'}
                                                <button onclick={() => changeRole(user, 'teacher')}>zu Lehrer</button>
                                            {/if}
                                            {#if user.role !== 'parent'}
                                                <button onclick={() => changeRole(user, 'parent')}>zu Eltern</button>
                                            {/if}
                                            {#if user.role !== 'admin'}
                                                <button onclick={() => changeRole(user, 'admin')}>zu Admin</button>
                                            {/if}
                                            <div class="divider"></div>
                                            <button class="danger" onclick={() => changeRole(user, 'student')}>zu Schüler</button>
                                        </div>
                                    </div>
                                {:else}
                                    <span class="me-badge">(Du)</span>
                                {/if}
                            </div>
                        </td>
                    </tr>
                {/each}
                </tbody>
            </table>
        </div>
    {/if}
{/snippet}


<div class="admin-layout">
    <header>
        <h1>🛡️ Admin Dashboard</h1>
        <p>Verwalte Nutzer, Rechte und Klassen.</p>
    </header>

    {#if loading}
        <div class="loading">Lade Daten...</div>
    {:else if currentUserRole === 'admin'}

        <div class="section-card">
            <div
                    class="section-header"
                    role="button"
                    tabindex="0"
                    onclick={() => toggleSection('classes')}
                    onkeydown={(e) => handleKeydown(e, 'classes')}
            >
                <div class="title-group">
                    <span class="icon">🏫</span>
                    <h2>Schulklassen ({classes.length})</h2>
                </div>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <button class="btn-add" onclick={(e) => { e.stopPropagation(); showClassModal = true; }}>+ Neu</button>
                    <span class="chevron" class:rotated={isOpen.classes}>▼</span>
                </div>
            </div>

            {#if isOpen.classes}
                <div class="section-content" transition:slide>
                    {#if classes.length === 0}
                        <div class="empty">Keine Klassen angelegt.</div>
                    {:else}
                        <div class="table-responsive">
                            <table>
                                <thead>
                                <tr>
                                    <th>Klassenname</th>
                                    <th>Stufe</th>
                                    <th style="text-align: right;">Aktionen</th>
                                </tr>
                                </thead>
                                <tbody>
                                {#each classes as cls (cls.id)}
                                    <tr>
                                        <td><strong>{cls.name}</strong></td>
                                        <td><span class="badge gray">Klasse {cls.grade_level}</span></td>
                                        <td>
                                            <div class="actions">
                                                <button class="btn-small danger" onclick={() => deleteClass(cls)}>Löschen</button>
                                            </div>
                                        </td>
                                    </tr>
                                {/each}
                                </tbody>
                            </table>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>

        <div class="section-card">
            <div
                    class="section-header"
                    role="button"
                    tabindex="0"
                    onclick={() => toggleSection('teachers')}
                    onkeydown={(e) => handleKeydown(e, 'teachers')}
            >
                <div class="title-group">
                    <span class="icon">👩‍🏫</span>
                    <h2>Lehrkräfte ({teachers.length})</h2>
                </div>
                <span class="chevron" class:rotated={isOpen.teachers}>▼</span>
            </div>

            {#if isOpen.teachers}
                <div class="section-content" transition:slide>
                    {@render userTable(teachers, "Keine Lehrkräfte gefunden.")}
                </div>
            {/if}
        </div>

        <div class="section-card">
            <div
                    class="section-header"
                    role="button"
                    tabindex="0"
                    onclick={() => toggleSection('parents')}
                    onkeydown={(e) => handleKeydown(e, 'parents')}
            >
                <div class="title-group">
                    <span class="icon">👨‍👩‍👧</span>
                    <h2>Eltern ({parents.length})</h2>
                </div>
                <span class="chevron" class:rotated={isOpen.parents}>▼</span>
            </div>

            {#if isOpen.parents}
                <div class="section-content" transition:slide>
                    {@render userTable(parents, "Keine Eltern-Accounts gefunden.")}
                </div>
            {/if}
        </div>

        <div class="section-card">
            <div
                    class="section-header"
                    role="button"
                    tabindex="0"
                    onclick={() => toggleSection('admins')}
                    onkeydown={(e) => handleKeydown(e, 'admins')}
            >
                <div class="title-group">
                    <span class="icon">🛡️</span>
                    <h2>Administratoren ({admins.length})</h2>
                </div>
                <span class="chevron" class:rotated={isOpen.admins}>▼</span>
            </div>

            {#if isOpen.admins}
                <div class="section-content" transition:slide>
                    {@render userTable(admins, "Keine weiteren Admins.")}
                </div>
            {/if}
        </div>

    {/if}

    {#if showClassModal}
        <div class="modal-backdrop" transition:fade>
            <div class="modal">
                <h2>Neue Klasse erstellen</h2>
                <div class="form-group">
                    <label>Name der Klasse (z.B. 10a)</label>
                    <input type="text" bind:value={newClass.name} placeholder="Klassenname..." autofocus />
                </div>
                <div class="form-group">
                    <label>Jahrgangsstufe (z.B. 10)</label>
                    <input type="number" bind:value={newClass.grade} placeholder="Stufe..." />
                </div>
                <div class="modal-actions">
                    <button class="btn-small secondary" onclick={() => showClassModal = false}>Abbrechen</button>
                    <button class="btn-small grant" onclick={createClass}>Erstellen</button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    :global(body) { background: #f8fafc; font-family: system-ui, sans-serif; }

    .admin-layout { max-width: 1000px; margin: 0 auto; padding: 2rem 1rem; }

    header { text-align: center; margin-bottom: 2rem; }
    h1 { color: #1e293b; margin: 0; }
    p { color: #64748b; margin-top: 0.5rem; }

    /* SEKTION CARDS */
    .section-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        border: 1px solid #e2e8f0;
        margin-bottom: 1.5rem;
        overflow: visible;
    }

    /* HEADER als DIV gestylt wie ein Button */
    .section-header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.2rem;
        background: white;
        cursor: pointer;
        transition: background 0.2s;
        text-align: left;
        border-radius: 12px;
        /* Verhindert Textauswahl beim Doppelklick */
        user-select: none;
    }
    .section-header:hover { background: #f8fafc; }
    .section-header:focus { outline: 2px solid #3b82f6; outline-offset: -2px; }

    .title-group { display: flex; align-items: center; gap: 0.8rem; }
    .icon { font-size: 1.5rem; }
    .section-header h2 { margin: 0; font-size: 1.1rem; color: #334155; }

    .chevron { font-size: 0.8rem; color: #94a3b8; transition: transform 0.3s; }
    .chevron.rotated { transform: rotate(180deg); }

    .section-content {
        border-top: 1px solid #f1f5f9;
        overflow: visible;
    }

    /* TABELLE */
    .table-responsive { width: 100%; }

    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 1rem; background: #f8fafc; color: #64748b; font-size: 0.85rem; text-transform: uppercase; }
    td { padding: 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }

    tr.pending { background-color: #fff7ed; }

    .user-info { display: flex; flex-direction: column; }
    .uuid { color: #94a3b8; font-family: monospace; font-size: 0.8rem; }

    .status-ok { color: #16a34a; font-weight: 600; font-size: 0.85rem; background: #dcfce7; padding: 0.2rem 0.6rem; border-radius: 99px; }
    .status-no { color: #dc2626; font-weight: 600; font-size: 0.85rem; background: #fee2e2; padding: 0.2rem 0.6rem; border-radius: 99px; }
    .badge.gray { background: #f1f5f9; color: #475569; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: bold; }

    .actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        align-items: center;
        position: relative;
    }

    /* BUTTONS */
    .btn-small { border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.8rem; transition: 0.2s; white-space: nowrap;}
    .btn-small.grant { background: #22c55e; color: white; }
    .btn-small.revoke { background: #f59e0b; color: white; }
    .btn-small.secondary { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .btn-small.danger { background: #fee2e2; color: #dc2626; }
    .btn-small:hover { opacity: 0.9; }

    .btn-add {
        background: #3b82f6; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.85rem;
    }
    .btn-add:hover { background: #2563eb; }

    .me-badge { color: #94a3b8; font-style: italic; font-size: 0.85rem; }
    .loading, .empty { padding: 2rem; text-align: center; color: #94a3b8; font-style: italic;}

    /* DROPDOWN */
    .dropdown-wrapper { position: relative; display: inline-block; }
    .dropdown-content {
        display: none;
        position: absolute;
        top: 100%; right: 0; margin-top: 5px;
        background-color: white; min-width: 140px;
        box-shadow: 0px 4px 12px rgba(0,0,0,0.15);
        z-index: 9999; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;
    }
    .dropdown-wrapper:hover .dropdown-content { display: block; }
    .dropdown-content button {
        color: #334155; padding: 10px 15px; text-decoration: none; display: block; width: 100%; text-align: left; border: none; background: none; cursor: pointer; font-size: 0.85rem;
    }
    .dropdown-content button:hover { background-color: #f1f5f9; }
    .dropdown-content button.danger { color: #ef4444; }
    .dropdown-content button.danger:hover { background-color: #fef2f2; }
    .divider { height: 1px; background: #f1f5f9; margin: 0; }

    /* MODAL */
    .modal-backdrop {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000;
    }
    .modal {
        background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }
    .modal h2 { margin-top: 0; color: #1e293b; text-align: center; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; color: #475569; font-weight: 500; font-size: 0.9rem; }
    .form-group input { width: 100%; padding: 0.7rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.8rem; margin-top: 1.5rem; }
</style>