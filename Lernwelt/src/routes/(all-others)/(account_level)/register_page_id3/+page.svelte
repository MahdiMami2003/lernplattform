<!--Lernwelt/src/routes/(all-others)/(account_level)/register_page_id3/+page.svelte-->
<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { _ } from '$lib/i18n/config';
    let { data } = $props();
    let { supabase } = data;

    // Formular Felder
    let firstName = $state('');
    let lastName = $state('');
    let email = $state('');
    let password = $state('');
    let confirmPassword = $state('');
    let role = $state('student');
    let termsAccepted = $state(false);
    let message = $state('');

    // --- LOGIK FÜR KLASSEN & KINDER ---
    let availableClasses = $state([]);
    let availableStudents = $state([]);

    // Temporäre Auswahl (für das Dropdown)
    let selectedClassId = $state('');
    let selectedChildId = $state('');

    // Die Liste der WIRKLICH ausgewählten Kinder (für Eltern)
    let addedChildren = $state([]);

    onMount(async () => {
        // Klassen laden
        const { data: classes, error } = await supabase
            .from('classes')
            .select('id, name')
            .order('name');

        if (!error) availableClasses = classes;
    });

    // Wenn Eltern eine Klasse wählen -> Schüler laden
    async function handleClassChange() {
        if (role === 'parent' && selectedClassId) {
            const { data: students, error } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('role', 'student')
                .eq('class_id', selectedClassId)
                .order('full_name');

            if (!error) {
                availableStudents = students;
                selectedChildId = ''; // Reset Kind-Auswahl
            }
        }
    }

    // Kind zur Liste hinzufügen (Nur UI)
    function addChild() {
        if (!selectedClassId || !selectedChildId) return;

        // Namen finden für die Anzeige
        const className = availableClasses.find(c => c.id === selectedClassId)?.name;
        const studentName = availableStudents.find(s => s.id === selectedChildId)?.full_name;

        // Prüfen ob schon in der Liste
        const alreadyAdded = addedChildren.some(child => child.studentId === selectedChildId);
        if (alreadyAdded) {
            alert("Dieses Kind hast du schon hinzugefügt!");
            return;
        }

        // Zur Liste hinzufügen
        addedChildren = [...addedChildren, {
            classId: selectedClassId,
            className: className,
            studentId: selectedChildId,
            studentName: studentName
        }];

        // Auswahl resetten (für das nächste Kind)
        selectedChildId = '';
        // selectedClassId lassen wir stehen, falls das nächste Kind in derselben Klasse ist
    }

    // Kind aus der Liste entfernen
    function removeChild(index) {
        addedChildren = addedChildren.filter((_, i) => i !== index);
    }

    // Registrierung durchführen
    async function handleRegister(event) {
        event.preventDefault();
        try {
            message = '';

            // Validierung
            if (password !== confirmPassword) {
                message = 'Die Passwörter stimmen nicht überein.'; return;
            }
            if (!termsAccepted) {
                message = 'Bitte akzeptiere die AGB.'; return;
            }

            // Pflichtfelder Check
            if (role === 'student' && !selectedClassId) {
                message = 'Bitte wähle deine Klasse aus.'; return;
            }
            // Bei Eltern prüfen wir jetzt die LISTE, nicht mehr das Dropdown
            if (role === 'parent' && addedChildren.length === 0) {
                message = 'Bitte füge mindestens ein Kind hinzu.'; return;
            }

            // A. User erstellen
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: `${firstName} ${lastName}`,
                        role: role,
                        // Schüler: Klasse direkt mitschicken
                        class_id: role === 'student' ? selectedClassId : null
                    }
                }
            });

            if (authError) throw authError;

            // B. Nachbearbeitung
            if (authData.session) {
                const newUserId = authData.user.id;

                // Fall 1: Schüler -> Klasse update (redundant zum Trigger, aber sicher)
                if (role === 'student' && selectedClassId) {
                    await supabase.from('profiles').update({ class_id: selectedClassId }).eq('id', newUserId);
                }

                // Fall 2: Eltern -> ALLE Kinder aus der Liste verknüpfen
                if (role === 'parent' && addedChildren.length > 0) {

                    // Wir bauen ein Array für den Insert
                    const linksToCreate = addedChildren.map(child => ({
                        parent_id: newUserId,
                        child_id: child.studentId
                    }));

                    // Ein einziger Insert Befehl für alle Kinder
                    const { error: linkError } = await supabase
                        .from('parent_children') // WICHTIG: Prüfen ob Tabelle 'parent_children' oder 'student_parents' heißt!
                        .insert(linksToCreate);

                    if (linkError) console.error('Fehler beim Verknüpfen:', linkError);
                }

                message = 'Registrierung erfolgreich! Leite weiter...';
                setTimeout(async () => {
                    if (role === 'student') await goto('/student_landing_page_id5');
                    else if (role === 'teacher') await goto('/teacher_landing_page_id6');
                    else if (role === 'parent') await goto('/parents_landing_page_id4');
                    else await goto('/');
                }, 1000);
            } else {
                message = 'Registrierung erfolgreich! Bitte bestätige deine E-Mail.';
            }
        } catch (error) {
            console.error('Fehler:', error);
            message = `Registrierung fehlgeschlagen: ${error.message}`;
        }
    }
</script>

<div id="placeholder">
    <h1>{$_('register.page_title')}</h1>
    <h2>{$_('register.title')}</h2>
    <p>{$_('register.subtitle')}</p>

    <form onsubmit={handleRegister}>
        <input type="text" bind:value={firstName} placeholder={$_('register.fields.first_name')} required />
        <br />
        <input type="text" bind:value={lastName} placeholder={$_('register.fields.last_name')} required />
        <br />
        <input type="email" bind:value={email} placeholder={$_('register.fields.email')} required />
        <br />
        <input type="password" bind:value={password} placeholder={$_('register.fields.password')} required />
        <br />
        <input type="password" bind:value={confirmPassword} placeholder={$_('register.fields.confirm_password')} required />
        <br />

        <div class="role">
            <p class="role-title">{$_('register.role_title')}</p>
            <div class="role-options">
                <label><input type="radio" name="roles" bind:group={role} value="student" required /><span>{$_('register.roles.student')}</span></label>
                <label><input type="radio" name="roles" bind:group={role} value="teacher" /><span>{$_('register.roles.teacher')}</span></label>
                <label><input type="radio" name="roles" bind:group={role} value="parent" /><span>{$_('register.roles.parent')}</span></label>
            </div>
        </div>

        {#if role === 'student'}
            <div class="extra-field">
                <label for="class-select">{$_('register.class_label')}</label>
                <select id="class-select" bind:value={selectedClassId} required>
                    <option value="" disabled selected>{$_('register.class_placeholder')}</option>
                    {#each availableClasses as schulklasse}
                        <option value={schulklasse.id}>{schulklasse.name}</option>
                    {/each}
                </select>
            </div>
        {/if}

        {#if role === 'parent'}
            <div class="parent-selection-area">
                <p class="area-title">Deine Kinder hinzufügen:</p>

                <select
                        class="mb-2"
                        bind:value={selectedClassId}
                        onchange={handleClassChange}
                >
                    <option value="" disabled selected>1. Klasse wählen</option>
                    {#each availableClasses as schulklasse}
                        <option value={schulklasse.id}>{schulklasse.name}</option>
                    {/each}
                </select>

                <div class="add-row">
                    <select
                            bind:value={selectedChildId}
                            disabled={!selectedClassId}
                    >
                        <option value="" disabled selected>
                            {selectedClassId ? '2. Name wählen' : 'Zuerst Klasse wählen...'}
                        </option>
                        {#each availableStudents as student}
                            <option value={student.id}>{student.full_name}</option>
                        {/each}
                    </select>

                    <button
                            type="button"
                            class="add-btn"
                            disabled={!selectedChildId}
                            onclick={addChild}
                    >
                        +
                    </button>
                </div>

                {#if addedChildren.length > 0}
                    <div class="children-list">
                        {#each addedChildren as child, index}
                            <div class="child-tag">
                                <span>{child.studentName} <small>({child.className})</small></span>
                                <button type="button" class="remove-btn" onclick={() => removeChild(index)}>×</button>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="small-hint">Noch kein Kind hinzugefügt.</p>
                {/if}
            </div>
        {/if}

        <div class="terms">
            <label>
                <input type="checkbox" bind:checked={termsAccepted} required />
                <span> {$_('register.terms.accept')} <a href="/agb">AGB</a>...</span>
            </label>
        </div>

        <button type="submit" class="submit-btn">{$_('register.actions.register')}</button>
    </form>

    {#if message}
        <p style="color: #fff; margin-top: 1rem; font-weight: bold;">{message}</p>
    {/if}

    <a href="/" class="login-link">{$_('register.actions.login')}</a>
</div>

<style>
    /* ... bestehendes CSS ... */
    #placeholder { display: flex; flex-direction: column; align-items: center; }
    div { justify-content: center; text-align: center; }
    p { font-weight: bold; }
    form {
        background-color: #f3be6a;
        align-items: center;
        height: auto;
        min-height: 500px;
        width: 400px;
        padding: 1rem 0.7rem;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
    }
    input, select {
        border-radius: 5px;
        padding: 0.6rem;
        width: 85%;
        border: none;
        margin-bottom: 0.5rem;
    }

    .role { width: 100%; max-width: 360px; margin: 1rem 0 1.25rem; color: #fff; }
    .role-title { text-align: center; font-weight: 700; margin: 0 0 0.5rem; }
    .role-options { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1.25rem; justify-items: start; }
    .role-options label { display: flex; align-items: center; gap: 0.55rem; padding: 0.55rem 0.75rem; background: rgba(255, 255, 255, 0.06); border: 1px solid #236c93; border-radius: 10px; cursor: pointer; }

    /* --- Styles für Eltern Multi-Select --- */
    .parent-selection-area {
        width: 85%;
        background: rgba(255, 255, 255, 0.1);
        padding: 0.8rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        border: 1px dashed #236c93;
    }
    .area-title { color: #fff; font-size: 0.9rem; margin-bottom: 0.5rem; text-align: left; }

    .add-row {
        display: flex;
        gap: 0.5rem;
        width: 100%;
        margin-bottom: 0.5rem;
    }
    .add-row select { margin-bottom: 0; flex-grow: 1; }

    .add-btn {
        background-color: #236c93;
        color: white;
        border: none;
        border-radius: 5px;
        width: 40px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 0;
        margin: 0 !important; /* Überschreibt globales button margin */
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .add-btn:disabled { background-color: #ccc; cursor: not-allowed; }

    .children-list {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        margin-top: 0.5rem;
    }
    .child-tag {
        background: #fff;
        color: #333;
        padding: 0.4rem 0.8rem;
        border-radius: 5px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.9rem;
    }
    .child-tag small { color: #666; margin-left: 5px; }

    .remove-btn {
        background: none; border: none; color: #d32f2f;
        font-weight: bold; font-size: 1.1rem; cursor: pointer;
        padding: 0 0 0 0.5rem; width: auto; margin: 0;
    }

    .extra-field { width: 85%; text-align: left; margin-bottom: 0.5rem; }
    .extra-field label { color: white; font-size: 0.9rem; margin-bottom: 0.3rem; display: block; font-weight: bold; }
    .extra-field select { width: 100%; background-color: white; color: #333; }

    .small-hint { font-size: 0.8rem; color: #eee; font-style: italic; margin-top: 0.2rem; }

    .terms { width: 100%; max-width: 360px; margin: 0.25rem 0 1rem; color: white; }
    .terms label { display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.95rem; line-height: 1.35; }
    .terms input[type='checkbox'] { accent-color: #236c93; width: 18px; height: 18px; margin-top: 0.1rem; }
    .terms a { color: #236c93; text-decoration: underline; }

    .submit-btn {
        background-color: #236c93; color: white; border-radius: 5px;
        padding: 0.6rem; width: 92%; font-weight: bold; border: none;
        cursor: pointer; margin-top: 1rem;
    }
    .login-link { text-align: center; display: block; margin-top: 30px; color: #236c93; text-decoration: none; font-weight: bold; }
    .mb-2 { margin-bottom: 0.5rem; width: 100%; }
</style>