<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';

    // Svelte 5 Props
    let { data } = $props();

    // --- State Variablen ---
    let loading = $state(true);
    let errorMessage = $state('');

    // Das aktuell angezeigte Profil (Kind)
    let profile = $state(null);
    let missionsData = $state([]);

    // Session & Eltern-Infos
    let currentSessionUserId = $state<string | null>(null);
    let currentUserRole = $state<string>(''); // 'parent', 'student', etc.

    // Liste der eigenen Kinder (nur für Eltern relevant)
    let myChildren = $state([]);

    let authListener: any = null;

    // --- 1. Hilfsfunktion: Kinder laden (Für Eltern) ---
    async function fetchMyChildren(parentId: string) {
        // Wir holen erst die Verknüpfungen
        const { data: links, error } = await data.supabase
            .from('parent_children')
            .select('child_id')
            .eq('parent_id', parentId);

        if (error) {
            console.error("Fehler beim Kinder-Laden:", error);
            return;
        }

        if (links && links.length > 0) {
            const childIds = links.map(l => l.child_id);

            // Jetzt holen wir die Namen/Infos dazu
            const { data: childrenProfiles } = await data.supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', childIds);

            myChildren = childrenProfiles || [];

            // Optional: Wenn noch kein Profil geladen ist, lade automatisch das erste Kind
            if (!profile && myChildren.length > 0) {
                loadData(myChildren[0].id);
            }
        }
    }

    // --- 2. Hauptfunktion: Daten eines bestimmten Users laden ---
    async function loadData(targetUserId: string) {
        console.log("📥 Lade Profil für:", targetUserId);
        try {
            loading = true;
            errorMessage = '';

            // A. Profil abrufen
            const { data: profileData, error: profileError } = await data.supabase
                .from('profiles')
                .select('*')
                .eq('id', targetUserId)
                .maybeSingle();

            if (profileError) throw profileError;
            if (!profileData) throw new Error('Profil nicht gefunden (oder keine Rechte).');

            profile = profileData;

            // B. Missionen abrufen
            const { data: progressData, error: progressError } = await data.supabase
                .from('missions_progress')
                .select(`
                    progress,
                    completed,
                    missions ( title, description, xp_reward )
                `)
                .eq('user_id', targetUserId)
                .order('completed', { ascending: true });

            if (progressError) throw progressError;
            missionsData = progressData || [];

        } catch (error: any) {
            console.error("Fehler:", error);
            errorMessage = error.message;
        } finally {
            loading = false;
        }
    }

    // --- Lifecycle ---
    onMount(async () => {
        const { data: { session } } = await data.supabase.auth.getSession();

        if (session) {
            initUser(session);
        } else {
            // Auf Login warten
            const { data: { subscription } } = data.supabase.auth.onAuthStateChange((event, session) => {
                if (session) initUser(session);
                else if (event === 'SIGNED_OUT') goto('/login_page_id2');
            });
            authListener = subscription;
        }
    });

    // Initialisierung nach Login
    async function initUser(session: any) {
        currentSessionUserId = session.user.id;
        currentUserRole = session.user.user_metadata.role || 'student';

        // URL Check: Wurde eine ID übergeben? (?userId=...)
        const urlParams = new URLSearchParams(window.location.search);
        const childIdFromUrl = urlParams.get('userId');

        if (currentUserRole === 'parent') {
            // Eltern: Erst Kinder-Liste laden
            await fetchMyChildren(session.user.id);

            // Wenn eine ID in der URL ist, lade die. Sonst warten wir auf Klick oder Auto-Load.
            if (childIdFromUrl) {
                await loadData(childIdFromUrl);
            } else if (myChildren.length === 0) {
                // Keine Kinder verknüpft?
                loading = false;
                errorMessage = "Keine verknüpften Kinder gefunden.";
            }
        } else {
            // Schüler/Lehrer: Lade eigenes Profil oder URL-Ziel
            const targetId = childIdFromUrl || session.user.id;
            await loadData(targetId);
        }
    }

    onDestroy(() => {
        if (authListener) authListener.unsubscribe();
    });

    // Helper für Balken
    function getBarColor(p, c) { return c ? '#4caf50' : (p > 0 ? '#f3be6a' : '#e0e0e0'); }
    function getProgressLabel(p, c) { return c ? 'Fertig' : (p ? 'In Arbeit' : 'Offen'); }
</script>

<div class="content-wrapper">

    <div class="header-box">
        <h1>Lernfortschritt</h1>
        {#if currentUserRole === 'parent'}
            <p>Wähle ein Kind aus, um den Fortschritt zu sehen.</p>
        {:else}
            <p>Dein aktueller Status.</p>
        {/if}
    </div>

    {#if currentUserRole === 'parent' && myChildren.length > 0}
        <div class="child-selector">
            <span>Deine Kinder:</span>
            <div class="child-buttons">
                {#each myChildren as child}
                    <button
                            class="child-btn {profile?.id === child.id ? 'active' : ''}"
                            onclick={() => loadData(child.id)}
                    >
                        {child.full_name}
                    </button>
                {/each}
            </div>
        </div>
    {/if}

    {#if loading}
        <div class="status-msg">🚀 Daten werden geladen...</div>
    {:else if errorMessage}
        <div class="status-msg error">
            ⚠️ {errorMessage}
            {#if currentUserRole === 'parent' && errorMessage.includes('nicht gefunden')}
                <br><small>Hast du dich bei der Registrierung mit dem Kind verknüpft?</small>
            {/if}
        </div>
    {:else if profile}
        <div class="profile-section">
            <div class="profile-card">
                <img
                        src={profile.avatar_url || ''}
                        alt="Avatar" class="avatar"
                        onerror={(e) => e.target.src = `https://ui-avatars.com/api/?name=${profile.full_name}`}
                />
                <div class="profile-details">
                    <h2>{profile.full_name}</h2>
                    <span class="role-badge">{profile.role}</span>
                </div>

                <div class="stats-grid">
                    <div class="stat-box"><span>{profile.level || 1}</span><small>Level</small></div>
                    <div class="stat-box"><span>{profile.xp || 0}</span><small>XP</small></div>
                    <div class="stat-box"><span>❤️ {profile.hearts || 3}</span><small>Leben</small></div>
                </div>
            </div>
        </div>

        <h3 class="section-title">Missionen</h3>
        {#if missionsData.length === 0}
            <div class="empty-state">Noch keine Missionen.</div>
        {:else}
            <div class="missions-grid">
                {#each missionsData as item}
                    {#if item.missions}
                        <div class="mission-card {item.completed ? 'completed' : ''}">
                            <h4>{item.missions.title}</h4>
                            <div class="xp-tag">+{item.missions.xp_reward} XP</div>
                            <p>{item.missions.description}</p>

                            <div class="progress-bar">
                                <div class="fill" style="width: {item.progress}%; background: {getBarColor(item.progress, item.completed)}"></div>
                            </div>
                            <small>{getProgressLabel(item.progress, item.completed)} ({item.progress}%)</small>
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}
    {/if}
</div>

<style>
    /* Neuer Style für die Kind-Auswahl */
    .child-selector {
        background: rgba(255, 255, 255, 0.9);
        padding: 1rem;
        border-radius: 10px;
        margin-bottom: 1rem;
        text-align: center;
        border: 1px solid #236c93;
    }
    .child-buttons {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        margin-top: 0.5rem;
        flex-wrap: wrap;
    }
    .child-btn {
        background: #eee;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
        color: #333;
    }
    .child-btn:hover { background: #ddd; }
    .child-btn.active {
        background: #236c93;
        color: white;
        transform: scale(1.05);
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }

    /* Bestehende Styles (gekürtzt für Übersicht) */
    .content-wrapper { max-width: 800px; margin: 0 auto; padding: 1rem; }
    .header-box { text-align: center; color: white; margin-bottom: 2rem; background: #236c93; padding: 2rem; border-radius: 12px; }
    .status-msg { text-align: center; padding: 2rem; color: #666; }
    .error { color: red; background: #fee; border-radius: 8px; }

    .profile-card { background: white; padding: 2rem; border-radius: 12px; text-align: center; border: 1px solid #ddd; margin-bottom: 2rem; }
    .avatar { width: 100px; height: 100px; border-radius: 50%; border: 4px solid #f3be6a; margin-bottom: 1rem; object-fit: cover;}
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; margin-top: 1rem; gap: 1rem; }
    .stat-box { display: flex; flex-direction: column; font-weight: bold; font-size: 1.2rem; color: #236c93; }
    .stat-box small { font-size: 0.8rem; color: #888; text-transform: uppercase; }

    .missions-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .mission-card { background: white; padding: 1rem; border-radius: 8px; border: 1px solid #eee; position: relative; }
    .mission-card.completed { border-color: #4caf50; background: #f1f8e9; }
    .xp-tag { position: absolute; top: 1rem; right: 1rem; background: #fff8e1; padding: 2px 8px; border-radius: 4px; font-weight: bold; color: #f57f17; font-size: 0.8rem; }

    .progress-bar { background: #eee; height: 10px; border-radius: 5px; margin: 10px 0 5px; overflow: hidden; }
    .fill { height: 100%; transition: width 0.5s; }
</style>