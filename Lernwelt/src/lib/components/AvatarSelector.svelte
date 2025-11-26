<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient.js';

    // ✅ Svelte 5 Syntax für Props
    let {
        userLevel = 1,
        currentAvatarUrl = '',
        userId,
        onAvatarUpdated = () => {} // Callback statt Event Dispatcher
    } = $props();

    let avatars = $state([]);
    let loading = $state(true);

    onMount(async () => {
        const { data, error } = await supabase
            .from('avatars')
            .select('*')
            .order('min_level', { ascending: true });

        if (!error) {
            avatars = data;
        }
        loading = false;
    });

    async function selectAvatar(avatar) {
        // 1. Level-Check
        if (userLevel < avatar.min_level) {
            alert(`Du brauchst Level ${avatar.min_level} für diesen Avatar!`);
            return;
        }

        // 2. Update in DB
        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: avatar.image_url })
            .eq('id', userId);

        if (error) {
            alert('Fehler beim Speichern: ' + error.message);
        } else {
            // Callback aufrufen statt Event dispatchen
            onAvatarUpdated(avatar.image_url);
        }
    }
</script>

<div class="avatar-container">
    <h3>Wähle deinen Avatar</h3>

    {#if loading}
        <p>Lade Avatare...</p>
    {:else}
        <div class="grid">
            {#each avatars as avatar}
                {@const isLocked = userLevel < avatar.min_level}
                {@const isSelected = currentAvatarUrl === avatar.image_url}

                <button
                        class="avatar-item {isLocked ? 'locked' : ''} {isSelected ? 'selected' : ''}"
                        onclick={() => selectAvatar(avatar)}
                        disabled={isSelected}
                >
                    <img src={avatar.image_url} alt={avatar.name} />

                    {#if isLocked}
                        <div class="lock-overlay">
                            <span>🔒 Lvl {avatar.min_level}</span>
                        </div>
                    {/if}
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    /* Deine Styles bleiben gleich */
    .avatar-container {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid #eee;
        margin-top: 2rem;
    }

    h3 { margin-top: 0; color: #333; }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .avatar-item {
        position: relative;
        border: 2px solid transparent;
        border-radius: 50%;
        padding: 5px;
        cursor: pointer;
        background: none;
        transition: transform 0.2s;
        width: 80px;
        height: 80px;
        overflow: hidden;
    }

    .avatar-item img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
    }

    .avatar-item:not(.locked):not(.selected):hover {
        transform: scale(1.1);
        border-color: #ddd;
    }

    .avatar-item.selected {
        border-color: #236C93;
        box-shadow: 0 0 10px rgba(35, 108, 147, 0.3);
        cursor: default;
    }

    .avatar-item.locked {
        cursor: not-allowed;
        opacity: 0.7;
    }

    .avatar-item.locked img {
        filter: grayscale(100%) blur(1px);
    }

    .lock-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.3);
        border-radius: 50%;
        color: white;
        font-weight: bold;
        font-size: 0.7rem;
        text-shadow: 1px 1px 2px black;
    }
</style>