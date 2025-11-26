<script>
    import { onMount, onDestroy } from 'svelte';
    import { supabase } from '$lib/supabaseClient.js';
    import { goto } from '$app/navigation';
    import AvatarSelector from '$lib/components/AvatarSelector.svelte';

    let loading = $state(true);
    let errorMessage = $state('');
    let profile = $state(null);
    let missionsData = $state([]);
    let authListener = null;

    async function loadData(userId) {
        console.log("📥 Lade Daten für User:", userId);
        try {
            // 1. Profil laden
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            console.log("✅ Profil geladen:", profileData);
            console.log("❌ Profil Fehler:", profileError);

            if (profileError) throw profileError;

            if (!profileData) {
                throw new Error('Benutzerkonto existiert, aber kein Profil gefunden. (DB Fehler)');
            }
            profile = profileData;

            // 2. Missionen laden
            const { data: progressData, error: progressError } = await supabase
                .from('missions_progress')
                .select(`
                    progress,
                    completed,
                    missions ( title, description, xp_reward )
                `)
                .eq('user_id', userId)
                .order('completed', { ascending: true });

            console.log("✅ Missionen geladen:", progressData);
            console.log("❌ Missionen Fehler:", progressError);

            if (progressError) throw progressError;
            missionsData = progressData || [];

        } catch (error) {
            console.error("❌❌ Fehler beim Laden:", error);
            errorMessage = error.message;
        } finally {
            loading = false;
            console.log("🏁 Loading beendet. Profile:", profile, "Missions:", missionsData);
        }
    }

    onMount(async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            await loadData(session.user.id);
        } else {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                console.log("Auth Event:", event);

                if (session) {
                    loadData(session.user.id);
                } else if (event === 'SIGNED_OUT') {
                    loading = false;
                    errorMessage = "Bitte logge dich ein.";
                    setTimeout(() => goto('/login_page_id2'), 2000);
                }
            });
            authListener = subscription;
        }
    });

    onDestroy(() => {
        if (authListener) authListener.unsubscribe();
    });

    function getBarColor(progress, isCompleted) {
        if (isCompleted) return '#4caf50';
        if (progress > 0) return '#f3be6a';
        return '#e0e0e0'; // ✅ Graue Farbe statt transparent
    }

    function getProgressLabel(progress, isCompleted) {
        if (isCompleted) return '✓ Abgeschlossen';
        if (!progress || progress === 0) return 'Noch nicht begonnen'; // ✅ Verbessert
        if (progress < 100) return 'In Arbeit...';
        return 'Fertig!';
    }
</script>

<div class="content-wrapper">
    <div class="header-box">
        <h1>Lernfortschritt</h1>
        <p>Dein aktueller Status, Level und Missionen.</p>
    </div>

    {#if loading}
        <div class="status-msg">
            <span class="spinner">🚀</span> Lade Profil...
        </div>
    {:else if errorMessage}
        <div class="status-msg error">⚠️ {errorMessage}</div>
    {:else if profile}

        <div class="profile-section">
            <div class="profile-card">
                <img
                        src={profile.avatar_url}
                        alt="Profilbild"
                        class="avatar"
                        onerror={(e) => e.target.src = `https://ui-avatars.com/api/?name=${profile.full_name}&background=f3be6a&color=fff`}
                />

                <div class="profile-details">
                    <h2>{profile.full_name || 'Schüler'}</h2>
                    <span class="role-badge">{profile.role || 'Schüler'}</span>
                </div>

                <div class="stats-grid">
                    <div class="stat-box">
                        <span class="stat-value">{profile.level || 1}</span>
                        <span class="stat-label">Level</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value">{profile.xp || 0}</span>
                        <span class="stat-label">XP</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value">❤️ {profile.hearts || 3}</span>
                        <span class="stat-label">Leben</span>
                    </div>
                </div>
            </div>
        </div>

        <h3 class="section-title">Deine Missionen ({missionsData.length})</h3>

        {#if missionsData.length === 0}
            <div class="empty-state">
                <p>📋 Keine Missionen zugewiesen.</p>
                <p class="hint">Warte auf deine Lehrkraft oder kontaktiere den Support.</p>
            </div>
        {:else}
            <div class="missions-grid">
                {#each missionsData as item}
                    {#if item.missions}
                        {@const currentProgress = item.progress || 0}
                        <div class="mission-card {item.completed ? 'is-completed' : ''} {currentProgress > 0 && !item.completed ? 'in-progress' : ''}">

                            <div class="mission-header">
                                <h4>{item.missions.title}</h4>
                                <span class="xp-badge">+{item.missions.xp_reward} XP</span>
                            </div>

                            <p class="mission-desc">
                                {item.missions.description || 'Keine Beschreibung verfügbar.'}
                            </p>

                            <div class="progress-container">
                                <div class="progress-info">
                                    <span class="progress-status">{getProgressLabel(currentProgress, item.completed)}</span>
                                    <span class="progress-percent">{currentProgress}%</span>
                                </div>

                                <div class="progress-bar-wrapper">
                                    <div class="progress-bar-bg">
                                        <div
                                                class="progress-bar-fill"
                                                style="width: {currentProgress}%; background-color: {getBarColor(currentProgress, item.completed)};"
                                        >
                                            {#if currentProgress > 10}
                                                <span class="progress-inner-text">{currentProgress}%</span>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {#if item.completed}
                                <div class="stamp">✓ ERLEDIGT</div>
                            {:else if currentProgress > 0}
                                <div class="progress-icon">🔥</div>
                            {/if}
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}

        <AvatarSelector
                userId={profile.id}
                userLevel={profile.level}
                currentAvatarUrl={profile.avatar_url}
                onAvatarUpdated={(newUrl) => {
                profile.avatar_url = newUrl;
            }}
        />
    {/if}
</div>

<!-- Styles bleiben gleich -->


<style>
    .content-wrapper {
        width: 100%;
        max-width: 100%;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding-bottom: 2rem;
        box-sizing: border-box;
        overflow-x: hidden;
    }

    /* --- Header --- */
    .header-box {
        background: linear-gradient(135deg, #236C93 0%, #1a5070 100%);
        color: white;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(35, 108, 147, 0.2);
    }
    .header-box h1 {
        margin: 0;
        font-size: 2rem;
        color: #fff;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    .header-box p {
        color: #f3be6a;
        font-weight: 600;
        margin-top: 0.5rem;
    }

    /* --- Profil --- */
    .profile-section {
        display: flex;
        justify-content: center;
    }

    .profile-card {
        background: #fdfdfd;
        border: 1px solid #eee;
        border-radius: 12px;
        padding: 2rem;
        width: 100%;
        max-width: 500px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.06);
        box-sizing: border-box;
    }

    .avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid #f3be6a;
        margin-bottom: 1rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .profile-details h2 { margin: 0; color: #333; }
    .role-badge {
        background-color: #e3f2fd;
        color: #1565c0;
        padding: 0.3rem 0.9rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: bold;
        text-transform: uppercase;
        margin-top: 0.5rem;
        display: inline-block;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 1rem;
        width: 100%;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid #f0f0f0;
    }

    .stat-box { display: flex; flex-direction: column; gap: 0.2rem; }
    .stat-value { font-size: 1.5rem; font-weight: 800; color: #236C93; }
    .stat-label { font-size: 0.8rem; text-transform: uppercase; color: #888; font-weight: 600; }

    /* --- Missionen --- */
    .section-title {
        font-size: 1.4rem;
        color: #333;
        margin-bottom: 0.5rem;
        border-left: 5px solid #236C93;
        padding-left: 1rem;
    }

    .missions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
        gap: 1.5rem;
        width: 100%;
    }

    .mission-card {
        background: #fff;
        border: 2px solid #eee;
        border-radius: 12px;
        padding: 1.5rem;
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        box-sizing: border-box;
        width: 100%;
    }

    .mission-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 20px rgba(35, 108, 147, 0.15);
        border-color: #236C93;
        cursor: pointer;
    }

    .mission-card.in-progress {
        border-color: #42a5f5;
        background: linear-gradient(to bottom, #fff 0%, #f0f8ff 100%);
    }

    .mission-card.is-completed {
        background: linear-gradient(to bottom, #f1f8e9 0%, #e8f5e9 100%);
        border-color: #81c784;
    }

    .mission-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.8rem;
        gap: 0.5rem;
    }
    .mission-header h4 {
        margin: 0;
        font-size: 1.15rem;
        color: #333;
        line-height: 1.3;
        flex: 1;
    }

    .xp-badge {
        background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
        color: #f57f17;
        font-weight: bold;
        font-size: 0.85rem;
        padding: 0.3rem 0.7rem;
        border-radius: 8px;
        border: 2px solid #ffe082;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(245, 127, 23, 0.1);
    }

    .mission-desc {
        font-size: 0.95rem;
        color: #666;
        margin-bottom: 1.5rem;
        line-height: 1.5;
    }

    /* --- PROGRESS BAR STYLING --- */
    .progress-container {
        margin-top: auto;
    }

    .progress-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .progress-status {
        font-size: 0.85rem;
        color: #555;
        font-weight: 600;
    }

    .progress-percent {
        font-size: 0.9rem;
        font-weight: 700;
        color: #236C93;
    }

    .progress-bar-wrapper {
        position: relative;
    }

    /* Hier ist der "leere" Balken (Die Rinne) */
    .progress-bar-bg {
        width: 100%;
        height: 24px;
        background: #f1f3f5; /* Helles Grau für den Hintergrund */
        border: 1px solid #ced4da; /* Ein feiner Rahmen, damit man die "Leere" sieht */
        border-radius: 12px;
        overflow: hidden;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
    }

    .progress-bar-fill {
        height: 100%;
        transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 8px;
        position: relative;
        box-shadow: inset 0 1px 2px rgba(255,255,255,0.3);
    }

    .progress-inner-text {
        color: white;
        font-size: 0.75rem;
        font-weight: 700;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    }

    /* Icons */
    .stamp {
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-size: 1.8rem;
        font-weight: 900;
        color: rgba(76, 175, 80, 0.3);
        transform: rotate(-12deg);
        pointer-events: none;
        user-select: none;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
    }

    .progress-icon {
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-size: 1.5rem;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
    }

    .status-msg {
        text-align: center;
        padding: 2rem;
        color: #555;
        font-size: 1.1rem;
    }

    .error {
        color: #d32f2f;
        background: #ffebee;
        border-radius: 8px;
    }

    .empty-state {
        text-align: center;
        color: #666;
        padding: 3rem;
        background: linear-gradient(135deg, #f9f9f9 0%, #fff 100%);
        border-radius: 12px;
        border: 2px dashed #ddd;
    }

    .empty-state p:first-child {
        font-size: 1.2rem;
        margin-bottom: 0.5rem;
    }

    .hint {
        font-size: 0.9rem;
        color: #999;
        font-style: italic;
    }

    @media (max-width: 600px) {
        .stats-grid {
            gap: 0.5rem;
        }
        .stat-value {
            font-size: 1.2rem;
        }
        .missions-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }
        .header-box h1 {
            font-size: 1.5rem;
        }
        .header-box {
            padding: 1.5rem 1rem;
        }
        .profile-card {
            padding: 1.5rem;
        }
        .mission-card {
            padding: 1.25rem;
        }
        .section-title {
            font-size: 1.2rem;
        }
    }
</style>