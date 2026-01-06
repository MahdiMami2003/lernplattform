<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from '$lib/i18n/config';

	let { data } = $props();
	let { supabase, session } = data;

	let loading = $state(true);
	type Mission = { id: number; title: string; description: string; xp_reward: number; total: number };
	let missions = $state([] as Mission[]);
	let errorMsg = $state('');

	// Form State
	let title = $state('');
	let description = $state('');
	let xp_reward = $state(50);
	let total = $state(1);

	onMount(async () => {
		// 1. Check Auth (Must be Teacher/Admin)
		const {
			data: { user }
		} = await supabase.auth.getUser();
		if (!user) {
			goto('/no_permission_page_id18');
			return;
		}
		await loadMissions();
	});

	async function loadMissions() {
		loading = true;
		const { data, error } = await supabase
			.from('missions')
			.select('*')
			.order('id', { ascending: false });

		if (error) {
			errorMsg = error.message;
		} else {
			missions = (data as Mission[]) || [];
		}
		loading = false;
	}

	async function addMission() {
		if (!title || !description || total < 1) {
			alert('Bitte füllen Sie alle Felder korrekt aus.');
			return;
		}

		const { error } = await supabase.from('missions').insert({
			title,
			description,
			xp_reward,
			total
		});

		if (error) {
			alert('Fehler beim Speichern: ' + error.message);
		} else {
			// Reset Form
			title = '';
			description = '';
			xp_reward = 50;
			total = 1;
			await loadMissions();
		}
	}

	async function deleteMission(id: number) {
		if (
			!confirm('Sind Sie sicher? Dies löscht auch den Fortschritt der Schüler für diese Mission.')
		)
			return;

		const { error } = await supabase.from('missions').delete().eq('id', id);

		if (error) {
			alert('Fehler beim Löschen: ' + error.message);
		} else {
			await loadMissions();
		}
	}
</script>

<div class="page-container">
	<header>
		<button class="back-btn" onclick={() => history.back()}>← {$_('pedagogy.errors.back_link')}</button>
		<h1>{$_('missions.title')}</h1>
		<p>{$_('missions.subtitle')}</p>
	</header>

	{#if errorMsg}
		<div class="error-box">{errorMsg}</div>
	{/if}

	<div class="content-grid">
		<!-- Add Form -->
		<section class="card form-section">
			<h2>➕ {$_('missions.new.title')}</h2>
			<div class="form-group">
				<label for="m-title">{$_('missions.new.name_label')}</label>
				<input id="m-title" type="text" bind:value={title} placeholder={$_('missions.new.name_ph')}  />
			</div>

			<div class="form-group">
				<label for="m-desc">{$_('missions.new.desc_label')}</label>
				<textarea
					id="m-desc"
					bind:value={description}
					placeholder={$_('missions.new.desc_ph')}
				></textarea>
			</div>

			<div class="row">
				<div class="form-group half">
					<label for="m-xp">{$_('missions.new.xp_label')}</label>
					<input id="m-xp" type="number" bind:value={xp_reward} min="10" step="10" />
				</div>
				<div class="form-group half">
					<label for="m-total">{$_('missions.new.goal_label')}</label>
					<input id="m-total" type="number" bind:value={total} min="1" />
					<small>{$_('missions.new.goal_hint')}</small>
				</div>
			</div>

			<button class="primary-btn" onclick={addMission} disabled={loading}>
				{loading ? '...' : $_('missions.new.save')}
			</button>
		</section>

		<!-- List -->
		<section class="card list-section">
			<h2>📋 {$_('missions.existing.title')}</h2>

			{#if loading}
				<p>Lade...</p>
			{:else if missions.length === 0}
				<p>{$_('missions.not_found')}</p>
			{:else}
				<div class="mission-list">
					{#each missions as m (m.id)}
						<div class="mission-item">
							<div class="m-info">
								<strong>{m.title}</strong>
								<p>{m.description}</p>
								<div class="badges">
									<span class="badge xp">+{m.xp_reward} XP</span>
									<span class="badge goal">Ziel: {m.total}</span>
								</div>
							</div>
							<div class="m-actions">
								<button class="delete-btn" onclick={() => deleteMission(m.id)}>🗑</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</div>

<style>
    /* ============ DARK MODE SUPPORT ============ */
    .page-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
        font-family: 'Inter', sans-serif;
        color: var(--text-primary, #333);
        transition: color 0.3s ease;
    }

    header {
        margin-bottom: 2rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    header h1 {
        margin: 0;
        color: var(--text-primary, #2c3e50);
        transition: color 0.3s ease;
    }

    header p {
        color: var(--text-secondary, #666);
        transition: color 0.3s ease;
    }

    .back-btn {
        background: none;
        border: none;
        font-size: 1rem;
        color: var(--text-secondary, #666);
        cursor: pointer;
        align-self: flex-start;
        padding: 0.5rem;
        transition: all 0.2s ease;
        min-height: 44px;
    }

    .back-btn:hover {
        text-decoration: underline;
        color: var(--text-primary, #333);
    }

    .back-btn:focus-visible {
        outline: 2px solid var(--text-primary, #000);
        outline-offset: 2px;
    }

    .content-grid {
        display: grid;
        gap: 2rem;
        grid-template-columns: 1fr 1.5fr;
    }

    @media (max-width: 800px) {
        .content-grid {
            grid-template-columns: 1fr;
        }
    }

    .card {
        background: var(--bg-card, white);
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        border: 1px solid var(--border-color, #eee);
        transition: all 0.3s ease;
    }

    h2 {
        margin-top: 0;
        font-size: 1.2rem;
        border-bottom: 2px solid var(--border-color, #f0f0f0);
        padding-bottom: 0.5rem;
        margin-bottom: 1rem;
        color: var(--text-primary, #2c3e50);
        transition: all 0.3s ease;
    }

    /* ============ FORM ============ */
    .form-group {
        margin-bottom: 1rem;
    }

    label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.3rem;
        font-size: 0.9rem;
        color: var(--text-primary, #333);
        transition: color 0.3s ease;
    }

    input,
    textarea {
        width: 100%;
        padding: 0.6rem;
        border-radius: 8px;
        border: 1px solid var(--border-color, #ddd);
        background: var(--bg-card, #fdfdfd);
        color: var(--text-primary, #000);
        font-family: inherit;
        transition: all 0.3s ease;
    }

    input::placeholder,
    textarea::placeholder {
        color: var(--text-muted, #999);
    }

    input:focus,
    textarea:focus {
        outline: 2px solid #3498db;
        border-color: transparent;
    }

    .row {
        display: flex;
        gap: 1rem;
    }

    .half {
        flex: 1;
    }

    small {
        color: var(--text-muted, #777);
        font-size: 0.8rem;
        transition: color 0.3s ease;
    }

    .primary-btn {
        width: 100%;
        padding: 0.8rem;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        margin-top: 1rem;
        transition: all 0.2s ease;
        min-height: 44px;
    }

    .primary-btn:hover {
        background: #2980b9;
        transform: translateY(-1px);
    }

    .primary-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .primary-btn:focus-visible {
        outline: 2px solid white;
        outline-offset: 2px;
    }

    /* ============ LIST ============ */
    .mission-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-height: 600px;
        overflow-y: auto;
    }

    .mission-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: var(--bg-hover, #f9f9f9);
        border-radius: 8px;
        border: 1px solid var(--border-color, #eee);
        transition: all 0.2s ease;
    }

    .mission-item:hover {
        transform: translateY(-2px);
        border-color: var(--border-color, #ddd);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .m-info strong {
        display: block;
        margin-bottom: 0.3rem;
        font-size: 1rem;
        color: var(--text-primary, #000);
        transition: color 0.3s ease;
    }

    .m-info p {
        margin: 0.2rem 0 0.5rem;
        font-size: 0.9rem;
        color: var(--text-secondary, #555);
        transition: color 0.3s ease;
    }

    .badges {
        display: flex;
        gap: 0.5rem;
    }

    .badge {
        font-size: 0.75rem;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-weight: 600;
        transition: all 0.3s ease;
    }

    .badge.xp {
        background: #fff3cd;
        color: #856404;
    }

    :root.darkmode .badge.xp {
        background: rgba(255, 193, 7, 0.2);
        color: #ffc107;
    }

    .badge.goal {
        background: #d4edda;
        color: #155724;
    }

    :root.darkmode .badge.goal {
        background: rgba(76, 175, 80, 0.2);
        color: #81c784;
    }

    .delete-btn {
        background: #ff6b6b;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 0.4rem 0.6rem;
        cursor: pointer;
        transition: all 0.2s ease;
        min-height: 44px;
        min-width: 44px;
    }

    .delete-btn:hover {
        background: #fa5252;
        transform: scale(1.05);
    }

    .delete-btn:focus-visible {
        outline: 2px solid white;
        outline-offset: 2px;
    }

    .error-box {
        background: #ffe6e6;
        color: #d63031;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 2rem;
        border: 1px solid #ff7675;
    }

    :root.darkmode .error-box {
        background: rgba(214, 48, 49, 0.2);
        color: #ff7675;
        border-color: rgba(214, 48, 49, 0.3);
    }

    /* ============ RESPONSIVE ============ */
    @media (max-width: 600px) {
        .page-container {
            padding: 1rem;
        }

        .card {
            padding: 1rem;
        }

        .row {
            flex-direction: column;
        }
    }

    .back-bar {
        padding: 0.5rem 0;
    }

    .back-link {
        color: var(--button-bg);
        text-decoration: none;
        font-weight: 600;
    }

    .back-link:hover {
        color: var(--button-hover);
        text-decoration: underline;
    }
</style>
