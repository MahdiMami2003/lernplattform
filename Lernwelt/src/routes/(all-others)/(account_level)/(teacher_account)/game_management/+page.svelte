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
		category: '', // NEU
		type: 'mc', // 'mc' or 'cloze'
		question: '',
		a1: '',
		a2: '',
		a3: '',
		a4: '',
		correct_index: 0,
		xp_reward: 10
	});

	// Kategorie Logik
	let availableCategories = $state([]); // Liste der geladenen Kategorien
	let isNewCategoryMode = $state(false); // Zeigt das Textfeld an
	let newCategoryInput = $state(''); // Inhalt des Textfelds

	// Valid Subjects
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
					const englishVariant = subjectFilter.replace('Englisch', 'English');
					query = query.or(`subject.ilike.%${subjectFilter}%,subject.ilike.%${englishVariant}%`);
				} else {
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

	// --- CATEGORY LOGIC ---
	// Lädt alle Kategorien, die es für das gewählte Fach bereits gibt
	async function fetchCategoriesForSubject(subject) {
		if (!subject) return;

		// Wir suchen breit nach dem Fach (z.B. "Deutsch" findet auch "Deutsch_EASY")
		const searchTerm = subject.split('_')[0];

		const { data, error } = await supabase
			.from('questions')
			.select('category')
			.ilike('subject', `${searchTerm}%`)
			.not('category', 'is', null);

		if (!error && data) {
			// Duplikate entfernen und sortieren
			availableCategories = [...new Set(data.map((d) => d.category))].sort();
		} else {
			availableCategories = [];
		}
	}

	// Wenn sich das Fach im Draft ändert, laden wir die Kategorien neu
	function handleSubjectChange() {
		fetchCategoriesForSubject(draft.subject);
		// Reset category selection on subject change
		if (!isEditing) {
			draft.category = '';
			isNewCategoryMode = false;
		}
	}

	// Handle Dropdown Change
	function handleCategorySelect(event) {
		const val = event.target.value;
		if (val === '___NEW___') {
			isNewCategoryMode = true;
			newCategoryInput = '';
			draft.category = ''; // Clear draft category, we use input
		} else {
			isNewCategoryMode = false;
			draft.category = val;
		}
	}

	// --- ACTIONS ---

	async function openAddModal() {
		isEditing = false;
		isNewCategoryMode = false;
		newCategoryInput = '';

		draft = {
			id: null,
			subject: 'Mathe',
			category: '',
			question: '',
			a1: '',
			a2: '',
			a3: '',
			a4: '',
			correct_index: 0,
			xp_reward: 10
		};

		// Kategorien für Default-Fach laden
		await fetchCategoriesForSubject(draft.subject);

		showModal = true;
		successMessage = '';
	}

	async function openEditModal(q) {
		isEditing = true;
		isNewCategoryMode = false;
		newCategoryInput = '';

		draft = { ...q };

		// Kategorien laden
		await fetchCategoriesForSubject(draft.subject);

		// Infer type if not present
		const isCloze = !q.a1 && !q.a2;
		draft.type = q.type || (isCloze ? 'cloze' : 'mc');

		// Prüfen, ob die aktuelle Kategorie in der Liste ist.
		// Falls nicht (oder null), setzen wir es einfach.
		if (!draft.category) draft.category = '';

		showModal = true;
		successMessage = '';
	}

	function closeModal() {
		showModal = false;
	}

	async function saveQuestion() {
		// Validation
		if (draft.type === 'mc') {
			if (!draft.question || !draft.a1 || !draft.a2) {
				errorMessage = 'Bitte mindestens Frage und 2 Antworten angeben.';
				return;
			}
		} else {
			// Cloze Validation
			if (!draft.question) {
				errorMessage = 'Bitte eine Frage/Text eingeben.';
				return;
			}
			if (!draft.question.includes('[') || !draft.question.includes(']')) {
				errorMessage = 'Der Text muss mindestens eine Lücke enthalten (z.B. [Wort]).';
				return;
			}
		}

		// Kategorie bestimmen
		let finalCategory = draft.category;
		if (isNewCategoryMode) {
			if (!newCategoryInput.trim()) {
				errorMessage = 'Bitte einen Namen für die neue Kategorie eingeben.';
				return;
			}
			finalCategory = newCategoryInput.trim();
		}

		saving = true;
		errorMessage = '';

		try {
			// Payload construction
			const payload = {
				subject: draft.subject,
				category: finalCategory,
				question: draft.question,
				xp_reward: draft.xp_reward,
				// If Cloze, we clear answers to keep DB clean (or leave them if you prefer)
				// We assume DB columns a1..a4 are nullable
				a1: draft.type === 'mc' ? draft.a1 : null,
				a2: draft.type === 'mc' ? draft.a2 : null,
				a3: draft.type === 'mc' ? draft.a3 : null,
				a4: draft.type === 'mc' ? draft.a4 : null,
				correct_index: draft.type === 'mc' ? draft.correct_index : 0
			};

			if (isEditing) {
				const { error } = await supabase.from('questions').update(payload).eq('id', draft.id);

				if (error) throw error;
				successMessage = 'Frage erfolgreich aktualisiert!';
			} else {
				const { error } = await supabase.from('questions').insert(payload);

				if (error) throw error;
				successMessage = 'Neue Frage hinzugefügt!';
			}

			closeModal();
			await loadQuestions();
		} catch (err) {
			console.error(err);
			errorMessage = 'Fehler beim Speichern: ' + err.message;
		} finally {
			saving = false;
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

		<div class="table-wrapper">
			{#if loading}
				<div class="loading">Lade Fragen...</div>
			{:else if questions.length === 0}
				<div class="empty-state">Keine Fragen gefunden.</div>
			{:else}
				<table>
					<thead>
						<tr>
							<th width="50">ID</th>
							<th width="130">Fach</th>
							<th width="130">Kategorie</th> <th>Frage</th>
							<th width="180">Antworten (Vorschau)</th>
							<th width="60" title="XP Belohnung">XP</th>
							<th width="100" style="text-align: right;">Aktionen</th>
						</tr>
					</thead>
					<tbody>
						{#each questions as q}
							<tr>
								<td><small style="color: #94a3b8;">#{q.id}</small></td>
								<td><span class="badge">{q.subject}</span></td>
								<td>
									{#if q.category}
										<span class="cat-badge">{q.category}</span>
									{:else}
										<span style="color: #cbd5e1;">—</span>
									{/if}
								</td>
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

	{#if showModal}
		<div class="modal-backdrop" transition:fade={{ duration: 150 }}>
			<div class="modal" transition:scale={{ duration: 200, easing: quintOut, start: 0.95 }}>
				<h2>{isEditing ? 'Frage bearbeiten' : 'Neue Frage erstellen'}</h2>

				<div class="form-body">
					<div class="form-row">
						<div class="form-group">
							<label>Fach / Subject</label>
							<select bind:value={draft.subject} onchange={handleSubjectChange}>
								{#each SUBJECTS as sub}
									<option value={sub}>{sub}</option>
								{/each}
							</select>
						</div>

						<div class="form-group">
							<label>Kategorie</label>
							{#if !isNewCategoryMode}
								<select value={draft.category || ''} onchange={handleCategorySelect}>
									<option value="">-- Keine / Wählen --</option>
									{#each availableCategories as cat}
										<option value={cat}>{cat}</option>
									{/each}
									<option disabled>──────────</option>
									<option value="___NEW___">➕ Neue Kategorie erstellen...</option>
								</select>
							{:else}
								<div class="input-group">
									<input
										type="text"
										bind:value={newCategoryInput}
										placeholder="Name der Kategorie (z.B. Geometrie)"
										autofocus
									/>
									<button
										class="btn-small"
										onclick={() => (isNewCategoryMode = false)}
										title="Zurück zur Liste">✕</button
									>
								</div>
							{/if}
						</div>
					</div>
					<div class="form-group">
						<label>Fragetyp</label>
						<select bind:value={draft.type}>
							<option value="mc">Multiple Choice</option>
							<option value="cloze">Lückentext</option>
						</select>
					</div>

					<div class="form-group" style="max-width: 150px;">
						<label>XP Belohnung</label>
						<input type="number" bind:value={draft.xp_reward} min="1" max="100" />
					</div>

					<div class="form-group">
						<label
							>Fragestellung {#if draft.type === 'cloze'}(Nutze [...] für Lücken){/if}</label
						>
						<textarea
							rows="3"
							bind:value={draft.question}
							placeholder={draft.type === 'mc'
								? 'z.B. Was ist 2 + 2?'
								: 'z.B. Berlin ist die Hauptstadt von [Deutschland].'}
						></textarea>
						{#if draft.type === 'cloze'}
							<small style="color: #64748b;">Beispiel: "Die Sonne ist ein [Stern]."</small>
						{/if}
					</div>

					{#if draft.type === 'mc'}
						<div class="form-group">
							<label>Antwortmöglichkeiten (Markiere die Richtige)</label>
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
					{/if}
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
		font-family: 'Inter', system-ui, sans-serif;
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
	}
	.page-header p {
		color: #64748b;
		font-size: 1.1rem;
	}

	/* CARDS */
	.card {
		background: #ffffff;
		border-radius: 16px;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
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
	}
	.filter-group select {
		padding: 0.6rem 1rem;
		border-radius: 8px;
		border: 1px solid #cbd5e1;
		background-color: #f8fafc;
		color: #334155;
		cursor: pointer;
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
	.cat-badge {
		display: inline-flex;
		padding: 0.25rem 0.6rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 500;
		background: #f1f5f9;
		color: #475569;
		border: 1px solid #e2e8f0;
	}

	/* BUTTONS */
	.btn-primary {
		background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 9999px;
		font-weight: 600;
		cursor: pointer;
		box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
	}
	.btn-secondary {
		background: #fff;
		color: #64748b;
		border: 1px solid #e2e8f0;
		padding: 0.75rem 1.5rem;
		border-radius: 9999px;
		font-weight: 600;
		cursor: pointer;
	}
	.btn-small {
		padding: 0 0.8rem;
		border: 1px solid #cbd5e1;
		background: white;
		border-radius: 8px;
		cursor: pointer;
		font-weight: bold;
		color: #ef4444;
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
	}
	.btn-icon:hover {
		background: #f1f5f9;
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
		max-width: 650px;
		border-radius: 20px;
		padding: 2.5rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		max-height: 90vh;
		overflow-y: auto;
	}
	.modal h2 {
		margin: 0 0 2rem 0;
		font-size: 1.5rem;
		color: #1e293b;
		text-align: center;
	}

	/* FORM */
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
		background: #f8fafc;
	}
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}
	.input-group {
		display: flex;
		gap: 0.5rem;
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
		min-width: 50px;
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
	}
</style>
