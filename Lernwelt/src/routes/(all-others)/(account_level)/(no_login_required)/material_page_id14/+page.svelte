<!-- Lernwelt/src/routes/(all-others)/(account_level)/(no_login_required)/material_page_id14/+page.svelte -->
<script>
	import { onMount } from 'svelte';

	import { locale } from 'svelte-i18n';
	import { _ } from 'svelte-i18n';
	let { data } = $props();

	let { supabase, session } = data;

	let userRole = $state(null);
	let editingRight = $state(null);

	onMount(async () => {
		// Hole den eingeloggten User
		const { data: userData, error } = await supabase.auth.getUser();

		if (error || !userData?.user) {
			console.error('Fehler beim Holen des Users:', error);
			// Still try to scroll to hash even without login
			scrollToHashAfterDelay();
			return;
		}

		// Hole Profil aus DB (mit editing_right)
		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('role, editing_right')
			.eq('id', userData.user.id)
			.single();

		if (profileError) {
			console.error('Fehler beim Holen des Profils:', profileError);
		} else {
			console.log('Gefundenes Profil:', profile);
			userRole = profile.role;
			editingRight = profile.editing_right;
			console.log('User Role:', userRole, 'Editing Right:', editingRight);
		}

		// Scroll to hash if present
		scrollToHashAfterDelay();
	});

	function scrollToHashAfterDelay() {
		// Wait for materials to render, then scroll to anchor
		if (window.location.hash) {
			const hash = window.location.hash.substring(1);
			setTimeout(() => {
				const element = document.getElementById(hash);
				if (element) {
					element.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}, 500); // Wait for materials to load
		}
	}

	async function getMaterials() {
		let query = supabase.from('materials').select('*').order('subject', { ascending: true });

		// TODO: Klassenfilter für Studenten implementieren, sobald Klassenstruktur bekannt
		// Aktuell: Alle Materialien für alle anzeigen

		let { data: materials, error } = await query;

		if (error) {
			console.error('Fehler:', error);
			return [];
		}

		return materials || [];
	}

	/**
	 * @param {any[]} materials
	 * @returns {Record<string, any[]>}
	 */
	function groupBySubject(materials) {
		/** @type {Record<string, any[]>} */
		const grouped = {};

		materials.forEach((material) => {
			if (!grouped[material.subject]) {
				grouped[material.subject] = [];
			}
			grouped[material.subject].push(material);
		});

		return grouped;
	}

	/**
	 * @param {number} id
	 */
	async function deleteMaterial(id) {
		if (!confirm('Wirklich löschen?')) return;

		const { error } = await supabase.from('materials').delete().eq('id', id);

		if (error) {
			alert('Fehler beim Löschen!');
			console.error(error);
		} else {
			window.location.reload();
		}
	}

	/**
	 * Prüft ob User Bearbeitungsrechte hat
	 */
	function hasEditingRights() {
		return (userRole === 'admin' || userRole === 'teacher') && editingRight === true;
	}

	function getTitle(material) {
		return $locale === 'en' ? material.title_en || material.title : material.title;
	}
	function getDescription(material) {
		return $locale === 'en'
			? material.description_en || material.description
			: material.description;
	}

	function getSubject(material) {
		return $locale === 'en' ? material.subject_en || material.subject : material.subject;
	}
</script>

<div id="placeholder" class="main_container">
	<div class="back-bar">
		<button class="back-btn" onclick={() => history.back()} aria-label="Zurück">← Zurück</button>
	</div>

	<div class="header">
		<h1>{$_('materials.title')}</h1>
		{#if hasEditingRights()}
			<a href="/form_for_adding_content" class="add-button">➕ {$_('materials.add')}</a>
		{/if}
	</div>

	{#await getMaterials()}
		<p class="loading">{$_('materials.loading')}...</p>
	{:then materials}
		{#if materials && materials.length > 0}
			{@const groupedMaterials = groupBySubject(materials)}

			{#each Object.entries(groupedMaterials) as [subject, items]}
				<section class="subject-section" id={subject}>
					<h2>{subject}</h2>
					<ul>
						{#each items as material}
							<li class="material-item">
								<a href="/materials_content_page_16/{material.id}" class="material-link">
									{getTitle(material)}
								</a>

								{#if hasEditingRights()}
									<button class="delete-btn" onclick={() => deleteMaterial(material.id)}>
										🗑️ {$_('materials.delete')}
									</button>
								{/if}
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		{:else}
			<p class="no-materials">{$_('materials.empty')}</p>
		{/if}
	{:catch error}
		<p class="error">{$_('materials.load_error')} {error?.message ?? ''}</p>
	{/await}
</div>

<style>
	/* ============ MAIN CONTAINER ============ */
	#placeholder {
		margin: 0;
		padding: 2rem;
		min-height: 100vh;
		font-family: 'Inter', Arial, Helvetica, sans-serif;
		background-color: var(--bg-main);
		color: var(--text-primary);
		transition:
			background-color 0.3s ease,
			color 0.3s ease;
	}

	/* ============ HEADER & TITEL ============ */
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	h1 {
		color: var(--text-primary);
		margin: 0;
		font-size: clamp(1.8rem, 4vw, 2.5rem);
		font-weight: 700;
		transition: color 0.3s ease;
	}

	.add-button {
		background-color: var(--button-bg);
		color: var(--text-primary);
		padding: 0.65rem 1.3rem;
		border-radius: 999px;
		text-decoration: none;
		font-weight: 600;
		border: 1px solid var(--button-border);
		transition: all 0.2s ease;
		cursor: pointer;
		white-space: nowrap;
		min-height: 44px;
		display: inline-flex;
		align-items: center;
	}

	.add-button:hover {
		background-color: var(--button-hover);
		transform: translateY(-2px);
	}

	.add-button:focus-visible {
		outline: 2px solid var(--text-primary);
		outline-offset: 2px;
	}

	/* ============ SUBJECT SECTIONS ============ */
	.subject-section {
		margin-bottom: 2.5rem;
	}

	.subject-section h2 {
		color: var(--text-primary);
		border-bottom: 3px solid var(--border-accent);
		padding-bottom: 0.75rem;
		margin-bottom: 1.2rem;
		font-size: clamp(1.3rem, 3vw, 1.8rem);
		font-weight: 600;
		transition:
			color 0.3s ease,
			border-color 0.3s ease;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	/* ============ BACK BAR ============ */
	.back-bar {
		padding: 0.5rem 0;
	}

	.back-btn {
		background: none;
		border: 1px solid var(--button-border);
		color: var(--text-secondary);
		padding: 0.35rem 0.6rem;
		border-radius: 8px;
		cursor: pointer;
	}

	.back-btn:hover {
		color: var(--text-primary);
		border-color: var(--button-hover);
	}


	/* ============ MATERIAL ITEMS ============ */
	.material-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.8rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.material-link {
		flex: 1;
		min-width: 250px;
		display: block;
		padding: 1rem 1.2rem;
		background-color: var(--bg-card);
		border-left: 4px solid var(--border-accent);
		border-radius: 0.8rem;
		text-decoration: none;
		color: var(--text-primary);
		font-weight: 500;
		transition: all 0.2s ease;
		border: 1px solid var(--border-color);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
		min-height: 44px;
		display: flex;
		align-items: center;
	}

	.material-link:hover {
		background-color: var(--bg-hover);
		border-left-color: var(--border-accent);
		transform: translateX(4px);
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
	}

	.material-link:focus-visible {
		outline: 2px solid var(--text-primary);
		outline-offset: 2px;
	}

	/* ============ DELETE BUTTON ============ */
	.delete-btn {
		padding: 0.5rem 0.9rem;
		background-color: var(--delete-btn);
		color: white;
		border: none;
		border-radius: 0.6rem;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		transition: all 0.2s ease;
		white-space: nowrap;
		min-height: 44px;
		min-width: 44px;
	}

	.delete-btn:hover {
		background-color: var(--delete-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
	}

	.delete-btn:focus-visible {
		outline: 2px solid white;
		outline-offset: 2px;
	}

	/* ============ MESSAGES ============ */
	.loading,
	.no-materials {
		text-align: center;
		color: var(--text-muted);
		font-size: 1.1rem;
		padding: 2rem;
		transition: color 0.3s ease;
	}

	.error {
		color: var(--error-color);
		text-align: center;
		padding: 1.5rem;
		background-color: var(--bg-card);
		border-radius: 0.8rem;
		border-left: 4px solid var(--error-color);
		transition: all 0.3s ease;
	}

	/* ============ RESPONSIVE ============ */
	@media (max-width: 600px) {
		#placeholder {
			padding: 1rem;
		}

		.material-item {
			flex-direction: column;
			align-items: flex-start;
		}

		.delete-btn {
			align-self: flex-end;
			margin-right: 0;
		}

		.material-link {
			min-width: 100%;
		}

		h1 {
			font-size: 1.5rem;
		}
	}
</style>
