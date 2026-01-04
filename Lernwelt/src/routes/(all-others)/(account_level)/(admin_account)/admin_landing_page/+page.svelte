<!-- (account_level) -> (admin_account) -> admin_landing_page -->
<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { slide, fade } from "svelte/transition";
    import { _ } from '$lib/i18n/config';
    import { get } from 'svelte/store';
    import UserTable from '$lib/components/UserTable.svelte';

    // helper to call the i18n function stored in '_' safely from markup and code
    function t(key: string, params?: any) {
        const fn = get(_ as any);
        if (typeof fn === 'function') return fn(key, params);
        return '';
    }

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

    type Student = Profile & { class_id: number | null };

    // --- STATE ---
    let users = $state<Profile[]>([]);
    let classes = $state<SchoolClass[]>([]);
    let loading = $state(true);
    let currentUserRole = $state('');
    let studentsByClass = $state<Record<number, Student[]>>({});
    let allClasses = $state<SchoolClass[]>([]);

    // Sektoren-Status (welche sind aufgeklappt?)
    let isOpen = $state({
        admins: false,
        teachers: false,
        parents: false,
        classes: false,
        students: false
    });

    // Gruppierungen (Automatisch gefiltert)
    let admins = $derived(users.filter(u => u.role === 'admin'));
    let teachers = $derived(users.filter(u => u.role === 'teacher'));
    let parents = $derived(users.filter(u => u.role === 'parent'));

    // Modal State für Klassen
    let showClassModal = $state(false);
    let newClass = $state({ name: '', grade: '' });

    // --- NEW: Role modal state ---
    let roleModalVisible = $state(false);
    let roleModalUser = $state<any | null>(null);
    let roleModalNewRole = $state('student');

    // Modal for editing a student
    let editStudentModalOpen = $state(false);
    let editStudentTarget = $state<Student | null>(null);
    let editForm = $state({ full_name: '', class_id: 0 });
    // adjust edit form: remove email from mutable fields
    let editEmailReadonly = $state('');

    function openRoleModal(user: any) {
        roleModalUser = user;
        roleModalNewRole = user.role;
        roleModalVisible = true;
    }
    function closeRoleModal() {
        roleModalVisible = false;
        roleModalUser = null;
    }
    async function confirmRoleChange() {
        if (!roleModalUser) return;
        if (!confirm(`Rolle von "${roleModalUser.full_name || roleModalUser.id}" zu "${roleModalNewRole}" ändern?`)) return;
        await changeRole(roleModalUser, roleModalNewRole);
        closeRoleModal();
    }

    async function loadAllStudentsGrouped() {
        const { data: allStudents } = await supabase
            .from('profiles')
            .select('id, full_name, role, editing_right, class_id')
            .eq('role', 'student')
            .order('full_name', { ascending: true });

        const { data: classesList } = await supabase
            .from('classes')
            .select('*')
            .order('grade_level', { ascending: true })
            .order('name', { ascending: true });

        allClasses = classesList || [];
        const grouped: Record<number, Student[]> = {};
        (allStudents || []).forEach((s: any) => {
            const key = s.class_id ?? -1;
            grouped[key] = grouped[key] || [];
            grouped[key].push(s as Student);
        });
        studentsByClass = grouped;
    }

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
        await Promise.all([loadUsers(), loadClasses(), loadAllStudentsGrouped()]);
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
        // removed in-function confirm: confirmation happens in modal

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

    async function fetchAuthEmail(userId: string) {
        try {
            const res = await fetch(`/api/admin/users/${userId}`);
            if (!res.ok) return '';
            const json = await res.json();
            return json.email || '';
        } catch { return ''; }
    }

    async function openEditStudent(s: Student) {
        editStudentTarget = s;
        editForm.full_name = s.full_name || '';
        editForm.class_id = s.class_id ?? 0;
        editEmailReadonly = await fetchAuthEmail(s.id);
        editStudentModalOpen = true;
    }
    function closeEditStudent() { editStudentModalOpen = false; editStudentTarget = null; }

    async function saveStudentEdits() {
        if (!editStudentTarget) return;
        const updates: any = { full_name: editForm.full_name };
        if (editForm.class_id) updates.class_id = editForm.class_id;
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', editStudentTarget.id);
        if (error) alert('Fehler beim Speichern: ' + error.message);
        else {
            // Refresh grouping
            await loadAllStudentsGrouped();
            closeEditStudent();
        }
    }

    async function deleteStudent() {
        if (!editStudentTarget) return;
        if (!confirm(`Schüler "${editStudentTarget.full_name}" wirklich löschen?`)) return;
        try {
            const res = await fetch(`/api/admin/users/${editStudentTarget.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                alert('Fehler beim Löschen: ' + (j.error || res.statusText));
                return;
            }
            await loadAllStudentsGrouped();
            closeEditStudent();
        } catch (e: any) {
            alert('Fehler beim Löschen: ' + (e?.message || 'Unbekannter Fehler'));
        }
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

<div class="admin-layout">
    <header>
        <h1>🛡️ Admin Dashboard</h1>
        <p>Verwalte Nutzer, Rechte und Klassen.</p> <br>
        <div style="display:flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <a href="/teacher_landing_page_id6" style="color: var(--text-primary)">Zum Lehrpersonen-Dashboard</a>
            <a href="/parents_landing_page_id4" style="color: var(--text-primary)">Zum Eltern-Dashboard</a>
            <a href="/student_landing_page_id5" style="color: var(--text-primary)">Zum Schüler-Dashboard</a>
        </div>
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
                                        <td>
                                            <a class="class-link" href={`/class_page_id9/${cls.id}`} aria-label={`Zu Klasse ${cls.name} wechseln`}>
                                                <strong>{cls.name}</strong>
                                            </a>
                                        </td>
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
                    <UserTable {session} groupUsers={teachers} emptyText={"Keine Lehrkräfte gefunden."} on:onToggleRights={(e) => toggleRights(e.detail)} on:onOpenRoleModal={(e) => openRoleModal(e.detail)} />
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
                    <UserTable {session} groupUsers={parents} emptyText={"Keine Eltern-Accounts gefunden."} on:onToggleRights={(e) => toggleRights(e.detail)} on:onOpenRoleModal={(e) => openRoleModal(e.detail)} />
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
                    <UserTable {session} groupUsers={admins} emptyText={"Keine weiteren Admins."} on:onToggleRights={(e) => toggleRights(e.detail)} on:onOpenRoleModal={(e) => openRoleModal(e.detail)} />
                </div>
            {/if}
        </div>

        <div class="section-card">
            <div
                class="section-header"
                role="button"
                tabindex="0"
                onclick={() => toggleSection('students')}
                onkeydown={(e) => handleKeydown(e, 'students')}
            >
                <div class="title-group">
                    <span class="icon">👥</span>
                    <h2>Schüler:innen nach Klassen</h2>
                </div>
                <span class="chevron" class:rotated={isOpen.students}>▼</span>
            </div>

            {#if isOpen.students}
                <div class="section-content" transition:slide>
                    {#if Object.keys(studentsByClass).length === 0}
                        <div class="empty">Keine Schüler:in gefunden.</div>
                    {:else}
                        <div class="table-responsive">
                            {#each allClasses as c}
                                <h3 style="margin: 1rem;">{c.name} (Kl. {c.grade_level})</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th style="text-align: right;">Aktionen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each (studentsByClass[c.id] || []) as s}
                                            <tr>
                                                <td>{s.full_name}</td>
                                                <td>
                                                    <div class="actions">
                                                        <button class="btn-small" onclick={() => openEditStudent(s)}>Bearbeiten</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            {/each}

                            {#if (studentsByClass[-1]?.length)}
                                <h3 style="margin: 1rem;">Ohne Klasse</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>E-Mail</th>
                                            <th style="text-align: right;">Aktionen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each studentsByClass[-1] as s}
                                            <tr>
                                                <td>{s.full_name}</td>
                                                <td>
                                                    <div class="actions">
                                                        <button class="btn-small" onclick={() => openEditStudent(s)}>Bearbeiten</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>

    {/if}

    {#if showClassModal}
        <div class="modal-backdrop" transition:fade>
            <div class="modal">
                <h2>Neue Klasse erstellen</h2>
                <div class="form-group">
                    <label for="new-class-name">Name der Klasse (z.B. 10a)</label>
                    <input id="new-class-name" type="text" bind:value={newClass.name} placeholder="Klassenname..." />
                </div>
                <div class="form-group">
                    <label for="new-class-grade">Jahrgangsstufe (z.B. 10)</label>
                    <input id="new-class-grade" type="number" bind:value={newClass.grade} placeholder="Stufe..." />
                </div>
                <div class="modal-actions">
                    <button class="btn-small secondary" onclick={() => showClassModal = false}>Abbrechen</button>
                    <button class="btn-small grant" onclick={createClass}>Erstellen</button>
                </div>
            </div>
        </div>
    {/if}

    <!-- ROLE MODAL -->
    {#if roleModalVisible && roleModalUser}
        <div class="modal-backdrop" transition:fade>
            <div class="modal">
                <h2>{t('admin.role_modal_title', { name: roleModalUser.full_name || roleModalUser.id.slice(0,8) })}</h2>
                <div class="form-group">
                    <fieldset class="form-group role-fieldset">
                        <legend>{t('admin.role_modal_label')}</legend>
                        <div class="role-options">
                            <label class="role-option">
                                <input type="radio" name="role" value="student" bind:group={roleModalNewRole} class="role-radio" />
                                <span class="role-box"><span class="role-icon">🎓</span><span class="role-name">{t('admin.role_option_student')}</span></span>
                            </label>

                            <label class="role-option">
                                <input type="radio" name="role" value="teacher" bind:group={roleModalNewRole} class="role-radio" />
                                <span class="role-box"><span class="role-icon">👩‍🏫</span><span class="role-name">{t('admin.role_option_teacher')}</span></span>
                            </label>

                            <label class="role-option">
                                <input type="radio" name="role" value="parent" bind:group={roleModalNewRole} class="role-radio" />
                                <span class="role-box"><span class="role-icon">👪</span><span class="role-name">{t('admin.role_option_parent')}</span></span>
                            </label>

                            <label class="role-option">
                                <input type="radio" name="role" value="admin" bind:group={roleModalNewRole} class="role-radio" />
                                <span class="role-box"><span class="role-icon">🛡️</span><span class="role-name">{t('admin.role_option_admin')}</span></span>
                            </label>
                        </div>
                    </fieldset>
                </div>
                <div class="modal-actions">
                    <button class="btn-small secondary" onclick={closeRoleModal}>{t('admin.role_modal_cancel')}</button>
                    <button class="btn-small grant" onclick={confirmRoleChange}>{t('admin.role_modal_confirm')}</button>
                </div>
            </div>
        </div>
    {/if}

    {#if editStudentModalOpen && editStudentTarget}
        <div class="modal-backdrop" transition:fade>
            <div class="modal">
                <h2>Schüler bearbeiten</h2>
                <div class="form-group">
                    <label for="edit-name">Name</label>
                    <input id="edit-name" type="text" bind:value={editForm.full_name} />
                </div>
                <div class="form-group">
                    <label for="edit-email">E-Mail (nicht bearbeitbar)</label>
                    <input id="edit-email" type="email" value={editEmailReadonly} disabled />
                </div>
                <div class="form-group">
                    <label for="edit-class">Klasse</label>
                    <select id="edit-class" bind:value={editForm.class_id}>
                        {#each allClasses as c}
                            <option value={c.id}>{c.name} (Kl. {c.grade_level})</option>
                        {/each}
                    </select>
                </div>
                <div class="modal-actions">
                    <button class="btn-small secondary" onclick={closeEditStudent}>Abbrechen</button>
                    <button class="btn-small grant" onclick={saveStudentEdits}>Speichern</button>
                    <button class="btn-small danger" onclick={deleteStudent}>Löschen</button>
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

    /* row-specific and user table styles moved to UserTable.svelte */

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
    .btn-small.secondary { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .btn-small.danger { background: #fee2e2; color: #dc2626; }
    .btn-small:hover { opacity: 0.9; }

    .btn-add {
        background: #3b82f6; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.85rem;
    }
    .btn-add:hover { background: #2563eb; }

    .loading, .empty { padding: 2rem; text-align: center; color: #94a3b8; font-style: italic;}


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
    .form-group select { width: 100%; padding: 0.7rem; border: 1px solid #cbd5e1; border-radius: 8px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.8rem; margin-top: 1.5rem; }

    /* Role radio visual improvements */
    .role-fieldset { border: 1px solid #e6edf8; padding: 0.75rem; border-radius: 8px; margin: 0; }
    .role-fieldset legend { padding: 0 0.5rem; font-weight: 600; color: #334155; }
    .role-options { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem; }
    .role-option { display: block; }
    /* make the actual radio cover the whole option so clicking anywhere toggles it */
    .role-option { position: relative; }
    .role-option .role-radio { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; margin: 0; }
    .role-option .role-box {
        display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.8rem; border-radius: 10px; border: 1px solid transparent; background: #fff; cursor: pointer; transition: all 0.15s ease-in-out;
        position: relative; z-index: 1;
    }
    .role-option .role-icon { font-size: 1.15rem; }
    .role-option .role-name { font-weight: 600; color: #0f172a; }

    /* Hover/focus/checked states */
    .role-option:hover .role-box { background: #f8fbff; border-color: #e6eefc; }
    .role-option:focus-within .role-box { box-shadow: 0 0 0 3px rgba(59,130,246,0.12); border-color: #3b82f6; }
    .role-option .role-radio:checked + .role-box { background: #eef2ff; border-color: #c7d2fe; box-shadow: inset 0 0 0 2px rgba(59,130,246,0.06); }
    .role-option .role-radio:checked + .role-box::after {
        content: '✓';
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: #1e3a8a;
        font-weight: 700;
        font-size: 0.95rem;
        z-index: 2;
    }

    /* Make the whole .role-box clickable (label handles it) */
    /* .role-option already position: relative above */

    /* For small screens stack options */
    @media (max-width: 520px) {
        .role-options { grid-template-columns: 1fr; }
    }

    /* end role styles */

    /* Make class names clickable without visual regressions */
    .class-link {
        color: inherit;
        text-decoration: none;
        display: inline-block;
    }
    .class-link:hover {
        text-decoration: underline;
    }
</style>
