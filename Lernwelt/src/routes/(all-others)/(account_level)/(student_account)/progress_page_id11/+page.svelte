<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { _ } from '$lib/i18n/config';
    let { data } = $props();
    let { supabase } = data;

    // State
    let loading = $state(true);
    let errorMessage = $state('');
    let profile = $state(null);
    let missionsData = $state([]);

    // Rollen & Logik
    let viewerRole = $state(''); // 'teacher', 'parent', 'student'
    let isOwner = $state(false);

    // Für Eltern: Liste der Kinder
    let myChildren = $state([]);
    let showChildSelection = $state(false);

    onMount(async () => {
        // 1. Session holen
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { goto('/login_page_id2'); return; }

        const myUserId = session.user.id;

        // 2. Meine Rolle holen
        const { data: myProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', myUserId)
            .single();

        viewerRole = myProfile?.role || 'student';

        // 3. Wen wollen wir sehen? (URL prüfen)
        const urlParams = new URLSearchParams(window.location.search);
        let targetUserId = urlParams.get('userId');

        // --- SZENARIO A: ELTERN ---
        if (viewerRole === 'parent') {
            // Wir holen die Kinder (IDs und Profile)
            const { data: links } = await supabase.from('parent_children').select('child_id').eq('parent_id', myUserId);

            if (links && links.length > 0) {
                const childIds = links.map(l => l.child_id);
                // Profile der Kinder laden für die Auswahl-Anzeige
                const { data: kids } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', childIds);
                myChildren = kids || [];
            }

            // Wenn keine ID in der URL ist -> Auswahl anzeigen
            if (!targetUserId) {
                if (myChildren.length === 1) {
                    // Bei nur einem Kind direkt laden
                    targetUserId = myChildren[0].id;
                } else if (myChildren.length > 1) {
                    showChildSelection = true;
                    loading = false;
                    return; // Stopp, wir warten auf Klick
                } else {
                    errorMessage = "Keine verknüpften Kinder gefunden.";
                    loading = false;
                    return;
                }
            } else {
                // Sicherheitscheck: Ist das wirklich mein Kind?
                const isMyChild = myChildren.some(c => c.id === targetUserId);
                if (!isMyChild && myChildren.length > 0) {
                    errorMessage = "Du hast keinen Zugriff auf dieses Profil.";
                    loading = false;
                    return;
                }
            }
        }

        // --- SZENARIO B: LEHRER ---
        // Lehrer kommen meistens direkt mit ?userId=... aus der Klassenliste.
        // Falls keine ID da ist, ist das ein Fehler.
        if (viewerRole === 'teacher' && !targetUserId) {
            errorMessage = "Kein Schüler ausgewählt. Bitte gehe über die Klassenliste.";
            loading = false;
            return;
        }

        // --- SZENARIO C: SCHÜLER ---
        // Wenn ich Schüler bin, lade ich immer mich selbst
        if (viewerRole === 'student') {
            targetUserId = myUserId;
        }

        // Finales Laden
        let idToLoad = targetUserId || myUserId;
        isOwner = (idToLoad === myUserId);

        console.log(`Lade Profil ${idToLoad} als ${viewerRole}`);
        await loadData(idToLoad);
    });

    async function loadData(targetId) {
        try {
            loading = true;
            showChildSelection = false;
            errorMessage = '';

            // A. Profil laden
            const { data: pData, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetId)
                .maybeSingle();

            if (pError) throw pError;
            if (!pData) throw new Error("Profil nicht gefunden.");

            profile = pData;

            // B. Missionen laden
            const { data: mData, error: mError } = await supabase
                .from('missions_progress')
                .select(`progress, completed, missions (title, description, xp_reward)`)
                .eq('user_id', targetId)
                .order('completed', { ascending: true });

            if (mError) throw mError;
            missionsData = mData || [];

        } catch (err: any) {
            console.error(err);
            errorMessage = err.message;
        } finally {
            loading = false;
        }
    }

    // Für Eltern: Klick auf ein Kind in der Auswahl
    function selectChild(childId) {
        window.location.href = `?userId=${childId}`;
    }

    function getBarColor(p, c) { return c ? '#4caf50' : (p > 0 ? '#f3be6a' : '#ddd'); }
</script>

<div class="page-container main_container">

    {#if loading}
        <div class="msg">🚀 {$_('progress.loading')}</div>

    {:else if errorMessage}
        <div class="msg error">
            ⚠️ {errorMessage}
            <br><br>
            <button onclick={() => history.back()}>{$_('common.back')}</button>
        </div>

    {:else if showChildSelection}
        <div class="selection-screen">
            <h1>{$_('progress.select_title')}</h1>
            <p>{$_('progress.select_subtitle')}</p>

            <div class="child-grid">
                {#each myChildren as child}
                    <button class="child-card" onclick={() => selectChild(child.id)}>
                        <img
                                src={child.avatar_url}
                                alt={child.full_name}
                                onerror={(e) => (e.target as HTMLImageElement).src =
              `https://ui-avatars.com/api/?name=${child.full_name}&background=random`}
                        />
                        <span>{child.full_name}</span>
                    </button>
                {/each}
            </div>

            <br />
            <a href="/parents_landing_page_id4" class="back-to-dash">
                {$_('progress.back_to_dashboard')}
            </a>
        </div>

    {:else if profile}

        {#if viewerRole === 'parent'}
            <div class="info-banner parent">
                <div class="banner-text">
                    <span>{$_('progress.parent_viewing')} <strong>{profile.full_name}</strong></span>
                </div>
                <div class="banner-actions">
                    {#if myChildren.length > 1}
                        <button class="switch-btn" onclick={() => showChildSelection = true}>
                            👥 {$_('progress.other_child')}
                        </button>
                    {/if}
                    <a href="/parents_landing_page_id4" class="back-link">{$_('progress.dashboard')}</a>
                </div>
            </div>
        {/if}

        {#if viewerRole === 'teacher'}
            <div class="info-banner teacher">
                <span>👨‍🏫 {$_('progress.teacher_view')} <strong>{profile.full_name}</strong></span>
                <button class="back-btn" onclick={() => history.back()}>{$_('progress.back_to_list')}</button>
            </div>
        {/if}

        <header class="profile-header">
            <img
                    src={profile.avatar_url}
                    alt={$_('progress.avatar_alt')}
                    class="avatar"
                    onerror={(e) => (e.target as HTMLImageElement).src =
        `https://ui-avatars.com/api/?name=${profile.full_name}&background=f3be6a&color=fff`}
            />
            <div class="info">
                <h1>{profile.full_name}</h1>
                <div class="stats">
                    <div class="stat"><span>{$_('progress.level')}</span> <strong>{profile.level || 1}</strong></div>
                    <div class="stat"><span>{$_('progress.xp')}</span> <strong>{profile.xp || 0}</strong></div>
                    <div class="stat"><span>{$_('progress.hearts')}</span> <strong>{profile.hearts || 3} ❤️</strong></div>
                </div>
            </div>
        </header>

        <section class="missions">
            <h2>{$_('progress.learning_progress')}</h2>

            {#if missionsData.length === 0}
                <div class="empty">{$_('progress.no_missions')}</div>
            {:else}
                <div class="grid">
                    {#each missionsData as item}
                        {#if item.missions}
                            <div class="card {item.completed ? 'done' : ''}">
                                <div class="head">
                                    <h3>{item.missions.title}</h3>
                                    <span class="xp">+{item.missions.xp_reward} {$_('progress.xp_short')}</span>
                                </div>
                                <div class="track">
                                    <div
                                            class="fill"
                                            style="width: {item.progress}%; background: {getBarColor(item.progress, item.completed)}"
                                    />
                                </div>
                                <small>{item.completed ? $_('progress.done') : `${item.progress}%`}</small>
                            </div>
                        {/if}
                    {/each}
                </div>
            {/if}
        </section>

    {/if}

</div>

<style>
    /* ============ MAIN CONTAINER ============ */
    .page-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        font-family: sans-serif;
        background-color: var(--bg-main);
        color: var(--text-primary);
        min-height: 100vh;
        transition: background-color 0.3s ease, color 0.3s ease;
    }

    /* ============ TYPOGRAPHY ============ */
    h1 {
        color: var(--text-primary);
        transition: color 0.3s ease;
    }

    h2 {
        color: var(--text-primary);
        transition: color 0.3s ease;
    }

    h3 {
        color: var(--text-primary);
        margin: 0;
        font-size: 1rem;
        transition: color 0.3s ease;
    }

    p {
        color: var(--text-secondary);
        transition: color 0.3s ease;
    }

    /* ============ KIND-AUSWAHL SCREEN ============ */
    .selection-screen {
        text-align: center;
        margin-top: 2rem;
    }

    .child-grid {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        margin-top: 2rem;
        flex-wrap: wrap;
    }

    .child-card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        width: 160px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        min-height: 44px;
    }

    .child-card:hover {
        transform: translateY(-5px);
        border-color: var(--button-bg);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        background: var(--bg-hover);
    }

    .child-card:focus-visible {
        outline: 2px solid var(--button-bg);
        outline-offset: 2px;
    }

    .child-card img {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid var(--border-accent);
    }

    .child-card span {
        font-weight: bold;
        color: var(--text-primary);
        transition: color 0.3s ease;
    }

    .back-to-dash {
        color: var(--text-secondary);
        text-decoration: none;
        transition: color 0.2s;
    }

    .back-to-dash:hover {
        color: var(--button-hover);
    }

    /* ============ INFO BANNERS ============ */
    .info-banner {
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid var(--border-color);
        background: var(--bg-card);
        transition: all 0.3s ease;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .info-banner.teacher {
        background: var(--bg-card);
        color: var(--text-primary);
        border-color: var(--border-accent);
    }

    .info-banner.parent {
        background: var(--bg-card);
        color: var(--text-primary);
        border-color: var(--button-bg);
    }

    .banner-text {
        flex: 1;
    }

    .banner-text strong {
        color: var(--button-bg);
    }

    .banner-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
    }

    .back-btn,
    .switch-btn {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        padding: 0.5rem 1rem;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s;
        color: var(--text-primary);
        min-height: 44px;
    }

    .back-btn:hover,
    .switch-btn:hover {
        background: var(--bg-hover);
        border-color: var(--button-bg);
    }

    .back-btn:focus-visible,
    .switch-btn:focus-visible {
        outline: 2px solid var(--button-bg);
        outline-offset: 2px;
    }

    .switch-btn {
        border-radius: 20px;
        font-size: 0.85rem;
    }

    .back-link {
        color: var(--button-bg);
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: bold;
        transition: color 0.2s;
    }

    .back-link:hover {
        color: var(--button-hover);
    }

    /* ============ PROFILE HEADER ============ */
    .profile-header {
        display: flex;
        gap: 1.5rem;
        align-items: center;
        background: var(--bg-card);
        padding: 2rem;
        border-radius: 12px;
        border: 1px solid var(--border-color);
        margin-bottom: 2rem;
        transition: all 0.3s ease;
    }

    .avatar {
        width: 90px;
        height: 90px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid var(--border-accent);
    }

    .info h1 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
    }

    .stats {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
    }

    .stat {
        display: flex;
        flex-direction: column;
    }

    .stat span {
        font-size: 0.8rem;
        text-transform: uppercase;
        color: var(--text-muted);
        font-weight: bold;
        transition: color 0.3s ease;
    }

    .stat strong {
        font-size: 1.2rem;
        color: var(--button-bg);
        transition: color 0.3s ease;
    }

    /* ============ MISSIONS SECTION ============ */
    .missions {
        margin-top: 2rem;
    }

    .grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }

    .card {
        background: var(--bg-card);
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;
    }

    .card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        transform: translateY(-2px);
    }

    .card.done {
        background: var(--bg-card);
        border-color: var(--success-color);
        position: relative;
    }

    .card.done::before {
        content: '✓';
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        color: var(--success-color);
        font-size: 1.5rem;
        font-weight: bold;
    }

    .head {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        align-items: center;
        gap: 0.5rem;
    }

    .xp {
        background: var(--bg-hover);
        color: var(--text-primary);
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 0.8rem;
        white-space: nowrap;
        border: 1px solid var(--border-accent);
        transition: all 0.3s ease;
    }

    .track {
        height: 8px;
        background: var(--bg-hover);
        border-radius: 4px;
        margin: 10px 0 5px;
        overflow: hidden;
    }

    .fill {
        height: 100%;
        transition: width 0.5s;
    }

    small {
        color: var(--text-muted);
        font-size: 0.85rem;
        transition: color 0.3s ease;
    }

    /* ============ MESSAGES ============ */
    .msg {
        text-align: center;
        margin-top: 3rem;
        color: var(--text-muted);
        padding: 2rem;
        transition: color 0.3s ease;
    }

    .error {
        color: var(--error-color);
        background: var(--bg-card);
        padding: 1rem;
        border-radius: 8px;
        border: 2px solid var(--error-color);
    }

    .error button {
        background: var(--button-bg);
        color: var(--text-primary);
        border: 1px solid var(--button-border);
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        min-height: 44px;
    }

    .error button:hover {
        background: var(--button-hover);
    }

    .empty {
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
        padding: 2rem;
        background: var(--bg-card);
        border-radius: 8px;
        border: 2px dashed var(--border-color);
        transition: all 0.3s ease;
    }

    /* ============ RESPONSIVE ============ */
    @media (max-width: 768px) {
        .page-container {
            padding: 1rem;
        }

        .profile-header {
            flex-direction: column;
            text-align: center;
        }

        .stats {
            justify-content: center;
        }

        .info-banner {
            flex-direction: column;
            text-align: center;
        }

        .banner-actions {
            width: 100%;
            justify-content: center;
        }

        .child-grid {
            gap: 1rem;
        }

        .child-card {
            width: 140px;
            padding: 1rem;
        }

        .grid {
            grid-template-columns: 1fr;
        }
    }
</style>