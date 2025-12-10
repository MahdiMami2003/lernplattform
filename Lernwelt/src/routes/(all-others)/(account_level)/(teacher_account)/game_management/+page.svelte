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
				if (subjectFilter.includes('Englisch')) {
					// General fix: also look for "English" variant
					// e.g. "Englisch_HARD" -> matches "Englisch_HARD" OR "English_HARD"
					const englishVariant = subjectFilter.replace('Englisch', 'English');
					query = query.or(`subject.ilike.%${subjectFilter}%,subject.ilike.%${englishVariant}%`);
				} else {
					// partial match for flexibility (e.g. 'Mathe' matches 'Mathe_EASY')
					query = query.ilike('subject', `%${subjectFilter}%`);
				}
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
		<h1>🎮 Spiel-Verwaltung</h1>
		<p>Erstelle und verwalte die Fragen für die Minispiele deiner Schüler.</p>
	</header>

	{#if errorMessage}
		<div class="alert error" role="alert">
			<span>⚠️</span>
			{errorMessage}
		</div>
	{/if}
	{#if successMessage}
		<div class="alert success" role="alert">
			<span>✅</span>
			{successMessage}
		</div>
	{/if}

	<!-- Toolbar -->
	<div class="card">
		<div class="toolbar">
			<div style="display: flex; align-items: center; gap: 1rem;">
				<a
					href="/teacher_landing_page_id6"
					class="btn-secondary"
					style="text-decoration: none; display: flex; align-items: center; gap: 0.5rem;"
				>
					<span>←</span> Zurück
				</a>
				<div class="filter-group">
					<label for="filterSubject">Fach:</label>
					<select id="filterSubject" bind:value={subjectFilter}>
						<option value="Alle">Alle Fächer</option>
						<option value="Mathe">Mathe (Alle)</option>
						<option value="Englisch">Englisch (Alle)</option>
						<option value="Deutsch">Deutsch (Alle)</option>
						<option value="Physik">Physik (Alle)</option>
						<option disabled>──────────</option>
						{#each SUBJECTS as sub}
							<option value={sub}>{sub}</option>
						{/each}
					</select>
				</div>
			</div>

			<button class="btn-primary" onclick={openAddModal}> + Neue Frage </button>
		</div>

		<!-- Table -->
		<div class="table-wrapper">
			{#if loading}
				<div class="loading">Lade Fragen...</div>
			{:else if questions.length === 0}
				<div class="empty-state">Keine Fragen gefunden.</div>
			{:else}
				<table>
					<thead>
						<tr>
							<th width="60">ID</th>
							<th width="140">Fach</th>
							<th>Frage</th>
							<th width="180">Antworten (Vorschau)</th>
							<th width="60" title="XP Belohnung">XP</th>
							<th width="120" style="text-align: right;">Aktionen</th>
						</tr>
					</thead>
					<tbody>
						{#each questions as q}
							<tr>
								<td><small style="color: #94a3b8;">#{q.id}</small></td>
								<td><span class="badge">{q.subject}</span></td>
								<td><div class="question-text" title={q.question}>{q.question}</div></td>
								<td class="answers-preview">
									<small style="color: #64748b;">
										✅ {q.answers ? q.answers[q.correct_index] : 'Unknown'}
									</small>
								</td>
								<td><strong>{q.xp_reward}</strong></td>
								<td>
									<div class="actions" style="justify-content: flex-end;">
										<button class="btn-icon" onclick={() => openEditModal(q)} title="Bearbeiten">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
												></path></svg
											>
										</button>
										<button
											class="btn-icon delete"
											onclick={() => deleteQuestion(q.id)}
											title="Löschen"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												><polyline points="3 6 5 6 21 6"></polyline><path
													d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
												></path><line x1="10" y1="11" x2="10" y2="17"></line><line
													x1="14"
													y1="11"
													x2="14"
													y2="17"
												></line></svg
											>
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	</div>

	<!-- MODAL -->
	{#if showModal}
		<div class="modal-backdrop" transition:fade={{ duration: 150 }}>
			<div class="modal" transition:scale={{ duration: 200, easing: quintOut, start: 0.95 }}>
				<h2>{isEditing ? 'Frage bearbeiten' : 'Neue Frage erstellen'}</h2>

				<div class="form-body">
					<!-- Row 1 -->
					<div class="form-row">
						<div class="form-group">
							<label>Fach / Subject</label>
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
						<label>Fragestellung</label>
						<textarea rows="3" bind:value={draft.question} placeholder="z.B. Was ist 2 + 2?"
						></textarea>
					</div>

					<!-- Answers -->
					<div class="form-group">
						<label>Antwortmöglichkeiten (Wähle die richtige Antwort aus)</label>
						<div class="answers-grid">
							{#each [0, 1, 2, 3] as idx}
								<div class="answer-row">
									<label class="radio-label">
										<input
											type="radio"
											name="correct"
											checked={draft.correct_index === idx}
											onchange={() => (draft.correct_index = idx)}
										/>
										<span>{idx + 1}.</span>
									</label>
									<input
										type="text"
										placeholder={`Antwort ${idx + 1}`}
										bind:value={draft[`a${idx + 1}`]}
									/>
								</div>
							{/each}
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
	:global(body) {
		background-color: #f8fafc;
		color: #1e293b;
		font-family:
			'Inter',
			system-ui,
			-apple-system,
			sans-serif;
	}

	.page-container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 3rem 1.5rem;
	}

	.page-header {
		margin-bottom: 2.5rem;
		text-align: center;
	}
	.page-header h1 {
		font-size: 2.5rem;
		font-weight: 800;
		background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		margin-bottom: 0.5rem;
		letter-spacing: -0.02em;
	}
	.page-header p {
		color: #64748b;
		font-size: 1.1rem;
		max-width: 600px;
		margin: 0 auto;
	}

	/* CARDS */
	.card {
		background: #ffffff;
		border-radius: 16px;
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -4px rgba(0, 0, 0, 0.05);
		border: 1px solid #e2e8f0;
		overflow: hidden;
		margin-bottom: 2rem;
	}

	/* TOOLBAR */
	.toolbar {
		padding: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid #f1f5f9;
	}
	.filter-group {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.filter-group label {
		font-weight: 600;
		color: #475569;
		font-size: 0.9rem;
	}
	.filter-group select {
		padding: 0.6rem 1rem;
		border-radius: 8px;
		border: 1px solid #cbd5e1;
		background-color: #f8fafc;
		color: #334155;
		font-size: 0.9rem;
		transition: all 0.2s;
		cursor: pointer;
	}
	.filter-group select:hover {
		border-color: #94a3b8;
	}
	.filter-group select:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}

	/* TABLE */
	.table-wrapper {
		width: 100%;
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
	}
	th {
		background: #f8fafc;
		padding: 1rem 1.5rem;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #64748b;
		border-bottom: 1px solid #e2e8f0;
	}
	td {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid #f1f5f9;
		color: #334155;
		font-size: 0.95rem;
		vertical-align: middle;
	}
	tr:last-child td {
		border-bottom: none;
	}
	tr:hover td {
		background-color: #f8fafc;
	}

	.question-text {
		font-weight: 500;
		color: #1e293b;
		max-width: 350px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		background: #e0e7ff;
		color: #4338ca;
	}

	/* BUTTONS */
	.btn-primary {
		background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 9999px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
		transition: all 0.2s ease;
	}
	.btn-primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 10px -1px rgba(79, 70, 229, 0.3);
	}
	.btn-primary:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.btn-secondary {
		background: #fff;
		color: #64748b;
		border: 1px solid #e2e8f0;
		padding: 0.75rem 1.5rem;
		border-radius: 9999px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s;
	}
	.btn-secondary:hover {
		background: #f8fafc;
		color: #334155;
		border-color: #cbd5e1;
	}

	.btn-icon {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		border: 1px solid transparent;
		background: transparent;
		color: #64748b;
		cursor: pointer;
		transition: all 0.2s;
	}
	.btn-icon:hover {
		background: #f1f5f9;
		color: #334155;
	}
	.btn-icon.delete:hover {
		background: #fef2f2;
		color: #ef4444;
	}

	/* ALERTS */
	.alert {
		padding: 1rem;
		border-radius: 12px;
		margin-bottom: 2rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.alert.error {
		background: #fef2f2;
		color: #b91c1c;
		border: 1px solid #fecaca;
	}
	.alert.success {
		background: #f0fdf4;
		color: #15803d;
		border: 1px solid #bbf7d0;
	}

	/* MODAL */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 42, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 50;
	}
	.modal {
		background: white;
		width: 100%;
		max-width: 600px;
		border-radius: 20px;
		padding: 2.5rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		max-height: 90vh;
		overflow-y: auto;
	}
	.modal h2 {
		margin: 0 0 2rem 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #1e293b;
		text-align: center;
	}

	/* FORM ELEMENTS */
	.form-group {
		margin-bottom: 1.5rem;
	}
	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #334155;
		font-size: 0.9rem;
	}
	.form-group input[type='text'],
	.form-group input[type='number'],
	.form-group textarea,
	.form-group select {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		font-size: 0.95rem;
		color: #1e293b;
		transition: all 0.2s;
		background: #f8fafc;
	}
	.form-group input:focus,
	.form-group textarea:focus,
	.form-group select:focus {
		outline: none;
		border-color: #6366f1;
		background: #fff;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}
	.form-row {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1.5rem;
	}

	.answers-grid {
		background: #f8fafc;
		padding: 1.5rem;
		border-radius: 12px;
		border: 1px solid #f1f5f9;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.answer-row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.radio-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: #475569;
		min-width: 80px;
		cursor: pointer;
	}
	.radio-label input[type='radio'] {
		accent-color: #6366f1;
		width: 1.1rem;
		height: 1.1rem;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid #f1f5f9;
	}

	.loading,
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #94a3b8;
		font-size: 1.1rem;
	}
</style>
