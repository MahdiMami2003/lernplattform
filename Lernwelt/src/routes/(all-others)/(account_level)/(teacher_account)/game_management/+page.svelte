<script>
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	// Props from layout
	let { data } = $props();
	let { supabase } = data;

	// --- STATE ---
	// Filters & Data
	let subjectFilter = $state('Alle');
	let questions = $state([]);
	let loading = $state(true);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Modal State
	let showModal = $state(false);
	let isEditing = $state(false);
	let saving = $state(false);

	// Form Data (Draft)
	let draft = $state({
		id: null,
		subject: 'Mathe',
		question: '',
		a1: '',
		a2: '',
		a3: '',
		a4: '',
		correct_index: 0,
		xp_reward: 10
	});

	// Valid Subjects (can be extended)
	const SUBJECTS = [
		'Mathe',
		'Englisch_EASY',
		'Englisch_MEDIUM',
		'Englisch_HARD',
		'Deutsch_EASY',
		'Deutsch_MEDIUM',
		'Deutsch_HARD',
		'Deutsch_BOSS',
		'Physik_EASY',
		'Physik_MEDIUM',
		'Physik_HARD',
		'Physik_BOSS'
	];

	// --- LOAD DATA ---
	async function loadQuestions() {
		loading = true;
		errorMessage = '';
		try {
			let query = supabase.from('questions').select('*').order('id', { ascending: false });

			if (subjectFilter !== 'Alle') {
				// partial match for flexibility (e.g. 'Englisch' matches 'Englisch_EASY')
				query = query.like('subject', `%${subjectFilter}%`);
			}

			const { data, error } = await query;
			if (error) throw error;
			questions = data || [];
		} catch (err) {
			console.error(err);
			errorMessage = 'Fehler beim Laden der Fragen: ' + err.message;
		} finally {
			loading = false;
		}
	}

	// --- ACTIONS ---

	function openAddModal() {
		isEditing = false;
		// Reset form
		draft = {
			id: null,
			subject: 'Mathe',
			question: '',
			a1: '',
			a2: '',
			a3: '',
			a4: '',
			correct_index: 0,
			xp_reward: 10
		};
		showModal = true;
		successMessage = '';
	}

	function openEditModal(q) {
		isEditing = true;
		// copy data
		draft = { ...q };
		showModal = true;
		successMessage = '';
	}

	function closeModal() {
		showModal = false;
	}

	async function saveQuestion() {
		// Validation
		if (!draft.question || !draft.a1 || !draft.a2) {
			errorMessage = 'Bitte mindestens Frage und 2 Antworten angeben.';
			return;
		}

		saving = true;
		errorMessage = '';

		try {
			if (isEditing) {
				// UPDATE
				const { error } = await supabase
					.from('questions')
					.update({
						subject: draft.subject,
						question: draft.question,
						a1: draft.a1,
						a2: draft.a2,
						a3: draft.a3,
						a4: draft.a4,
						correct_index: draft.correct_index,
						xp_reward: draft.xp_reward
					})
					.eq('id', draft.id);

				if (error) throw error;
				successMessage = 'Frage erfolgreich aktualisiert!';
			} else {
				// INSERT
				const { error } = await supabase.from('questions').insert({
					// ID is mostly auto-increment, but verify db schema. assuming auto.
					subject: draft.subject,
					question: draft.question,
					a1: draft.a1,
					a2: draft.a2,
					a3: draft.a3,
					a4: draft.a4,
					correct_index: draft.correct_index,
					xp_reward: draft.xp_reward
				});

				if (error) throw error;
				successMessage = 'Neue Frage hinzugefügt!';
			}

			closeModal();
			await loadQuestions(); // Refresh list
		} catch (err) {
			console.error(err);
			errorMessage = 'Fehler beim Speichern: ' + err.message;
		} finally {
			saving = false;
			// Clear success message after 3 seconds
			setTimeout(() => {
				successMessage = '';
			}, 3000);
		}
	}

	async function deleteQuestion(id) {
		if (!confirm('Bist du sicher, dass du diese Frage löschen willst?')) return;

		try {
			const { error } = await supabase.from('questions').delete().eq('id', id);

			if (error) throw error;
			successMessage = 'Frage gelöscht.';
			await loadQuestions();
		} catch (err) {
			console.error(err);
			errorMessage = 'Löschen fehlgeschlagen: ' + err.message;
		}
	}

	// Effect: Reload when filter changes
	$effect(() => {
		// Triggers whenever subjectFilter changes
		loadQuestions();
	});
</script>

<div class="page-container">
	<header class="page-header">
		<h1>🎮 Spiel-Verwaltung (Fragen)</h1>
		<p>Hier kannst du Fragen für die Minispiele erstellen und bearbeiten.</p>
	</header>

	{#if errorMessage}
		<div class="alert error">{errorMessage}</div>
	{/if}
	{#if successMessage}
		<div class="alert success">{successMessage}</div>
	{/if}

	<!-- Toolbar -->
	<div class="toolbar">
		<div class="filter-group">
			<label for="filterSubject">Fach filtern:</label>
			<select id="filterSubject" bind:value={subjectFilter}>
				<option value="Alle">Alle anzeigen</option>
				{#each SUBJECTS as sub}
					<option value={sub}>{sub}</option>
				{/each}
			</select>
		</div>

		<button class="btn-primary" onclick={openAddModal}> + Neue Frage </button>
	</div>

	<!-- Table -->
	<div class="table-container">
		{#if loading}
			<div class="loading">Lade Fragen...</div>
		{:else if questions.length === 0}
			<div class="empty-state">Keine Fragen gefunden.</div>
		{:else}
			<table>
				<thead>
					<tr>
						<th width="50">ID</th>
						<th width="120">Fach</th>
						<th>Frage</th>
						<th width="150">Antworten (Vorschau)</th>
						<th width="60" title="XP Belohnung">XP</th>
						<th width="120">Aktionen</th>
					</tr>
				</thead>
				<tbody>
					{#each questions as q}
						<tr>
							<td>{q.id}</td>
							<td><span class="badge">{q.subject}</span></td>
							<td class="question-text">{q.question}</td>
							<td class="answers-preview">
								<small>✅: {q.answers ? q.answers[q.correct_index] : '?'}</small>
							</td>
							<td>{q.xp_reward}</td>
							<td class="actions">
								<button class="btn-icon edit" onclick={() => openEditModal(q)} title="Bearbeiten"
									>✏️</button
								>
								<button class="btn-icon delete" onclick={() => deleteQuestion(q.id)} title="Löschen"
									>🗑️</button
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>

	<!-- MODAL -->
	{#if showModal}
		<div class="modal-backdrop" transition:fade={{ duration: 200 }}>
			<div class="modal" transition:scale={{ duration: 250, easing: quintOut, start: 0.95 }}>
				<h2>{isEditing ? 'Frage bearbeiten' : 'Neue Frage erstellen'}</h2>

				<div class="form-body">
					<!-- Row 1 -->
					<div class="form-row">
						<div class="form-group">
							<label>Fach / Subject *</label>
							<select bind:value={draft.subject}>
								{#each SUBJECTS as sub}
									<option value={sub}>{sub}</option>
								{/each}
							</select>
						</div>
						<div class="form-group">
							<label>XP Belohnung</label>
							<input type="number" bind:value={draft.xp_reward} min="1" max="100" />
						</div>
					</div>

					<!-- Question -->
					<div class="form-group">
						<label>Fragestellung *</label>
						<textarea rows="2" bind:value={draft.question} placeholder="z.B. Was ist 2 + 2?"
						></textarea>
					</div>

					<!-- Answers -->
					<div class="answers-grid">
						<div class="form-group">
							<label
								>Antwort 1
								<input
									type="radio"
									name="correct"
									checked={draft.correct_index === 0}
									onchange={() => (draft.correct_index = 0)}
								/> Richtig
							</label>
							<input type="text" bind:value={draft.a1} placeholder="(leer lassen = null)" />
						</div>
						<div class="form-group">
							<label
								>Antwort 2
								<input
									type="radio"
									name="correct"
									checked={draft.correct_index === 1}
									onchange={() => (draft.correct_index = 1)}
								/> Richtig
							</label>
							<input type="text" bind:value={draft.a2} />
						</div>
						<div class="form-group">
							<label
								>Antwort 3
								<input
									type="radio"
									name="correct"
									checked={draft.correct_index === 2}
									onchange={() => (draft.correct_index = 2)}
								/> Richtig
							</label>
							<input type="text" bind:value={draft.a3} />
						</div>
						<div class="form-group">
							<label
								>Antwort 4
								<input
									type="radio"
									name="correct"
									checked={draft.correct_index === 3}
									onchange={() => (draft.correct_index = 3)}
								/> Richtig
							</label>
							<input type="text" bind:value={draft.a4} />
						</div>
					</div>
				</div>

				<div class="modal-actions">
					<button class="btn-secondary" onclick={closeModal} disabled={saving}>Abbrechen</button>
					<button class="btn-primary" onclick={saveQuestion} disabled={saving}>
						{saving ? 'Speichert...' : 'Speichern'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* GLOBAL LAYOUT */
	.page-container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem 1rem;
		font-family: system-ui, sans-serif;
		color: #333;
	}

	.page-header {
		margin-bottom: 2rem;
		text-align: center;
	}
	.page-header h1 {
		margin: 0;
		color: #1d5e84;
	}
	.page-header p {
		color: #666;
		margin-top: 0.5rem;
	}

	/* TOOLBAR */
	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #fff;
		padding: 1rem;
		border-radius: 8px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
		margin-bottom: 1.5rem;
	}
	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}
	.filter-group select {
		padding: 0.5rem;
		border-radius: 6px;
		border: 1px solid #ccc;
	}

	/* ALERTS */
	.alert {
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-weight: bold;
	}
	.alert.error {
		background: #ffe6e6;
		color: #cc0000;
		border: 1px solid #ffcccc;
	}
	.alert.success {
		background: #e6fffa;
		color: #006644;
		border: 1px solid #ccffeb;
	}

	/* TABLE */
	.table-container {
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th {
		background: #f4f7fa;
		text-align: left;
		padding: 1rem;
		color: #555;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border-bottom: 2px solid #e0e6ed;
	}
	td {
		padding: 1rem;
		border-bottom: 1px solid #eee;
		vertical-align: middle;
	}
	tr:last-child td {
		border-bottom: none;
	}
	tr:hover {
		background: #fcfcfc;
	}

	.question-text {
		font-weight: 500;
		max-width: 300px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.badge {
		background: #eef4ff;
		color: #3b82f6;
		padding: 4px 8px;
		border-radius: 99px;
		font-size: 0.8rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}
	.btn-primary {
		background: #236c93;
		color: white;
		border: none;
		padding: 0.6rem 1.2rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		transition: background 0.15s;
	}
	.btn-primary:hover:not(:disabled) {
		background: #1a5270;
	}
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: #e2e8f0;
		color: #475569;
		border: none;
		padding: 0.6rem 1.2rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
	}
	.btn-secondary:hover {
		background: #cbd5e1;
	}

	.btn-icon {
		background: none;
		border: 1px solid #ddd;
		border-radius: 6px;
		padding: 0.4rem;
		cursor: pointer;
		transition: all 0.1s;
	}
	.btn-icon:hover {
		background: #f0f0f0;
		transform: scale(1.05);
	}
	.btn-icon.delete:hover {
		border-color: #ffcccc;
		background: #fff0f0;
	}

	/* MODAL */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		backdrop-filter: blur(2px);
	}
	.modal {
		background: white;
		width: 100%;
		max-width: 650px;
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		max-height: 90vh;
		overflow-y: auto;
	}
	.modal h2 {
		margin-top: 0;
		color: #1d5e84;
	}

	.form-body {
		margin: 1.5rem 0;
	}
	.form-group {
		margin-bottom: 1.2rem;
	}
	.form-group label {
		display: block;
		margin-bottom: 0.4rem;
		font-weight: 500;
		font-size: 0.9rem;
	}
	.form-group input[type='text'],
	.form-group input[type='number'],
	.form-group textarea,
	.form-group select {
		width: 100%;
		padding: 0.7rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
	}
	.form-row {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1rem;
	}
	.answers-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		background: #f8fafc;
		padding: 1rem;
		border-radius: 8px;
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		border-top: 1px solid #eee;
		padding-top: 1.5rem;
	}

	.loading,
	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #888;
	}
</style>
