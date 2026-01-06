<!--Lernwelt/src/routes/(all-others)/(account_level)/(student_account)/(tests + games)/englisch_game/+page.svelte-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data } = $props();

	let { supabase, session } = data;

	/* ========== TYPES ========== */
	type Question = {
		id?: number;
		type: 'mc' | 'cloze';
		question: string;
		// MC Specific
		answers?: (string | null)[];
		correctIndex?: number;
		// Cloze Specific
		textParts?: string[];
		clozeAnswers?: string[];
		xpReward: number;
	};

	type Profile = {
		id: string;
		xp: number;
		level: number;
		streak: number;
		hearts: number;
		last_boss?: string;
		last_grade?: number;
	};

	type ConfettiPiece = {
		id: number;
		left: number;
		duration: number;
		delay: number;
		color: string;
	};

	/* ========== STATE ========== */
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let profile = $state<Profile | null>(null);

	let xp = $state(0);
	let level = $state(1);
	let streak = $state(0);
	const MAX_HEARTS = 3;
	let hearts = $state(MAX_HEARTS);

	let questions = $state<Question[]>([]);
	let currentIndex = $state(0);

	// MC State
	let selectedIndex = $state<number | null>(null);

	// Cloze State
	let inputs = $state<string[]>([]);
	let checkResult = $state<'correct' | 'wrong' | null>(null);

	let locked = $state(false);
	let correctCount = $state(0);

	let showSummary = $state(false);
	let outOfHearts = $state(false);
	let levelUpVisible = $state(false);

	let sessionXp = $state(0);
	let confettiPieces = $state<ConfettiPiece[]>([]);

	// Fortschritt & XP als derived
	const progress = $derived.by(() => {
		if (showSummary) return 100;
		if (questions.length === 0) return 0;
		return ((currentIndex + (locked ? 1 : 0)) / questions.length) * 100;
	});
	const xpProgress = $derived(Math.min((xp / 100) * 100, 100));

	let category = $state<string | null>(null);

	/* ========= HELPER ========= */
	function shuffle<T>(array: T[]): T[] {
		return [...array].sort(() => Math.random() - 0.5);
	}

	function renderMath(text: string) {
		if (typeof window !== 'undefined' && (window as any).katex) {
			return text.replace(/\$(.*?)\$/g, (_, math) => {
				try {
					return (window as any).katex.renderToString(math, { throwOnError: false });
				} catch (e) {
					console.error('Katex error:', e);
					return math;
				}
			});
		}
		return text.replace(/\$/g, '');
	}

	function parseQuestion(q: any): Question {
		// Check if it's a Cloze question (contains brackets [...])
		if (q.question && q.question.includes('[') && q.question.includes(']')) {
			const cleanText = q.question;
			const regex = /\[(.*?)\]/g;
			let match;
			const answers: string[] = [];
			const textParts: string[] = [];
			let lastIndex = 0;

			while ((match = regex.exec(cleanText)) !== null) {
				textParts.push(cleanText.substring(lastIndex, match.index));
				answers.push(match[1]);
				lastIndex = regex.lastIndex;
			}
			textParts.push(cleanText.substring(lastIndex));

			return {
				id: q.id,
				type: 'cloze',
				question: q.question,
				textParts,
				clozeAnswers: answers,
				xpReward: q.xp_reward ?? 15
			};
		} else {
			// Assume Multiple Choice
			return {
				id: q.id,
				type: 'mc',
				question: q.question,
				answers: [q.a1, q.a2, q.a3, q.a4],
				correctIndex: q.correct_index,
				xpReward: q.xp_reward ?? 10
			};
		}
	}

	async function updateProfile(update: Partial<Profile>) {
		if (!profile) return;
		await supabase.from('profiles').update(update).eq('id', profile.id);
	}

	/* ========= LOAD DATA ========= */
	async function loadProfileAndQuestions() {
		try {
			loading = true;
			loadError = null;

			// 0️⃣ Kategorie aus URL lesen
			category = $page.url.searchParams.get('category');
			console.log('🌎 English Game gestartet. Kategorie:', category || 'Alle');

			/* ===============================
               1️⃣ USER OPTIONAL LADEN
            ================================= */
			const { data: authData } = await supabase.auth.getUser();
			const user = authData?.user ?? null;

			if (user) {
				const { data: profileData } = await supabase
					.from('profiles')
					.select('*')
					.eq('id', user.id)
					.single();

				if (profileData) {
					profile = profileData;
					xp = profileData.xp ?? 0;
					level = profileData.level ?? 1;
					streak = profileData.streak ?? 0;
					// Herzen zurücksetzen bei neuem Spiel
					if (profileData.hearts < MAX_HEARTS) {
						hearts = MAX_HEARTS;
						await updateProfile({ hearts: MAX_HEARTS });
						console.log('❤️ Herzen automatisch zurückgesetzt.');
					} else {
						hearts = profileData.hearts ?? MAX_HEARTS;
					}
				}
			} else {
				console.warn('⚠ Kein Login – Zugriff verweigert');
				goto('/');
				return;
			}

			/* ===============================
               2️⃣ ENGLISCH-FRAGEN LADEN
            ================================= */
			// Basis-Abfrage für Englisch (Wir suchen nach 'English%' ODER 'Englisch%')
			let query = supabase
				.from('questions')
				.select('*')
				.or('subject.ilike.English%,subject.ilike.Englisch%');

			// Check for question type filter (from URL)
			const typeFilter = $page.url.searchParams.get('type');
			if (typeFilter === 'mc') {
				// Exclude questions that look like Cloze (contain brackets)
				query = query.not('question', 'ilike', '%[%]%');
			}

			// Wenn eine Kategorie gewählt wurde, zusätzlich filtern
			if (category) {
				query = query.eq('category', category);
			}

			// Wir laden bis zu 20 Fragen, um sie client-seitig zu mischen
			const { data, error } = await query.limit(20);

			if (error) {
				console.error('❌ Fehler beim Laden:', error);
				loadError = 'Fehler beim Laden der Englisch-Fragen.';
			} else if (!data || data.length === 0) {
				console.warn('⚠ Keine Englisch-Fragen gefunden.');
				// Dummy Frage
				// Dummy Frage
				questions = [
					{
						id: -1,
						type: 'mc',
						question: 'What is a pronoun?',
						answers: ['A verb', 'A noun', 'An adjective', 'A substitute word'],
						correctIndex: 3,
						xpReward: 10
					}
				];
			} else {
				// Mischen und die ersten 5 nehmen
				const mixedData = shuffle(data).slice(0, 5);

				questions = mixedData.map((q) => parseQuestion(q));

				// Init inputs if first question is cloze
				if (questions.length > 0 && questions[0].type === 'cloze' && questions[0].clozeAnswers) {
					inputs = new Array(questions[0].clozeAnswers.length).fill('');
				}
			}
		} catch (err) {
			console.error(err);
			loadError = 'Unerwarteter Fehler beim Laden.';
		} finally {
			loading = false;
			currentIndex = 0;
			selectedIndex = null;
			locked = false;
			correctCount = 0;
			showSummary = false;
			outOfHearts = false;
			checkResult = null;
			inputs = [];
		}
	}

	function goNextOrFinish() {
		if (currentIndex < questions.length - 1) {
			currentIndex++;
			selectedIndex = null;
			checkResult = null;
			locked = false;

			// Reset Cloze inputs if next is cloze
			if (questions[currentIndex].type === 'cloze' && questions[currentIndex].clozeAnswers) {
				inputs = new Array(questions[currentIndex].clozeAnswers.length).fill('');
			}
		} else {
			showSummary = true;
			saveBossResult();
		}
	}

	/* ========= CLOZE LOGIC ========== */
	async function checkClozeAnswer() {
		if (locked) return;

		const current = questions[currentIndex];
		if (current.type !== 'cloze' || !current.clozeAnswers) return;

		const isCorrect = inputs.every(
			(val, i) => val.trim().toLowerCase() === current.clozeAnswers![i].trim().toLowerCase()
		);

		locked = true;

		if (isCorrect) {
			checkResult = 'correct';
			correctCount++;
			rewardXP(current.xpReward);
			await updateMissionProgress();
		} else {
			checkResult = 'wrong';
			loseHeart();
		}

		setTimeout(() => {
			if (!outOfHearts) goNextOrFinish();
		}, 2000);
	}

	async function updateMissionProgress() {
		if (profile?.id) {
			const { error } = await supabase.rpc('increment_mission_progress', {
				p_user_id: profile.id,
				p_subject_name: 'English',
				p_category: category || null
			});
			if (error) console.error('Fehler beim Missions-Update:', error);
		}
	}

	/* ========= ANSWER CLICK (MIT MISSION UPDATE) ========== */
	// WICHTIG: Async gemacht, damit wir Supabase aufrufen können
	async function handleAnswerClick(index: number) {
		if (locked || showSummary || outOfHearts) return;

		selectedIndex = index;
		locked = true;

		const current = questions[currentIndex];
		const isCorrect = index === current.correctIndex;

		if (isCorrect) {
			correctCount++;
			rewardXP(current.xpReward);

			// ---------------------------------------------------------
			// 🔥 NEU: Mission Progress Update
			// ---------------------------------------------------------
			// ---------------------------------------------------------
			// 🔥 NEU: Mission Progress Update
			// ---------------------------------------------------------
			await updateMissionProgress();
			// ---------------------------------------------------------
			// ---------------------------------------------------------
		} else {
			loseHeart();
		}

		setTimeout(() => {
			if (!outOfHearts) goNextOrFinish();
		}, 1000); // 1,2 Sekunden warten
	}

	async function rewardXP(amount: number) {
		xp += amount;
		sessionXp += amount;

		if (xp >= 100) {
			xp -= 100;
			level++;
			levelUpVisible = true;
			setTimeout(() => (levelUpVisible = false), 2000);
		}

		if (profile) {
			await updateProfile({ xp, level });
		}
	}

	async function loseHeart() {
		hearts = Math.max(0, hearts - 1);
		if (hearts === 0) outOfHearts = true;
		await updateProfile({ hearts });
	}

	async function saveBossResult() {
		const grade = Math.ceil(6 - (correctCount / questions.length) * 5);
		await updateProfile({ last_boss: 'Classe10English', last_grade: grade });

		if (correctCount > 0) {
			streak++;
			await updateProfile({ streak });
		}
	}

	async function restartLesson() {
		currentIndex = 0;
		selectedIndex = null;
		outOfHearts = false;
		showSummary = false;
		hearts = MAX_HEARTS;
		correctCount = 0;

		if (profile) {
			await updateProfile({ hearts: MAX_HEARTS });
		}

		await loadProfileAndQuestions();
	}

	onMount(loadProfileAndQuestions);
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
		integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
		crossorigin="anonymous"
	/>
	<script
		defer
		src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"
		integrity="sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vnuzemU38X+039"
		crossorigin="anonymous"
	></script>
</svelte:head>

{#if loading}
	<div class="loading"><p>Spiel wird geladen…</p></div>
{:else if loadError}
	<div class="error">
		<p>{loadError}</p>
		<button on:click={loadProfileAndQuestions}>Neu laden</button>
	</div>
{:else if questions.length === 0}
	<div class="error">
		<p>Für diese Kategorie sind aktuell keine Fragen vorhanden.</p>
		<button on:click={() => goto('/student_landing_page_id5', { invalidateAll: true })}>
			Zurück zum Dashboard
		</button>
	</div>
{:else}
	<div class="game-root">
		{#if levelUpVisible}
			<div class="levelup-popup">
				🎉 Level {level} erreicht!
			</div>
		{/if}

		{#each confettiPieces as piece (piece.id)}
			<div
				class="confetti"
				style={`left:${piece.left}%;animation-duration:${piece.duration}ms;animation-delay:${piece.delay}ms;background:${piece.color};`}
			></div>
		{/each}

		<header class="hud">
			<button class="back-btn" on:click={() => goto('/game_page_id12')}>←</button>

			<div class="hud-center">
				<div class="progress-top">
					<div class="progress-inner" style={`width: ${progress}%`}></div>
				</div>
				<p class="question-count">Frage {currentIndex + 1} / {questions.length}</p>
			</div>

			<div class="hud-right">
				<div class="hearts">
					{#each Array(MAX_HEARTS) as _, i}
						<span class:lost={i >= hearts}>❤️</span>
					{/each}
				</div>

				<div class="xp-display">
					<span>Lvl {level}</span>
					<div class="xp-bar">
						<div class="xp-inner" style={`width: ${xpProgress}%`}></div>
					</div>
				</div>

				<div class="streak">
					<span>🔥</span>{streak}
				</div>
			</div>
		</header>

		{#if !showSummary && !outOfHearts}
			<main class="card">
				{#if questions[currentIndex].type === 'mc'}
					<!-- ============ MULTIPLE CHOICE ============ -->
					<h2 class="question">{questions[currentIndex].question}</h2>
					<div class="answers">
						{#each questions[currentIndex].answers || [] as ans, i}
							{#if ans}
								<button
									class="answer-btn {locked && i === questions[currentIndex].correctIndex
										? 'correct'
										: ''} 
									{locked && selectedIndex === i && selectedIndex !== questions[currentIndex].correctIndex
										? 'wrong'
										: ''}"
									on:click={() => handleAnswerClick(i)}
									disabled={locked}
								>
									{ans}
								</button>
							{/if}
						{/each}
					</div>
				{:else if questions[currentIndex].type === 'cloze'}
					<!-- ============ CLOZE / LÜCKENTEXT ============ -->
					<div class="cloze-container">
						<div class="cloze-text">
							{#each questions[currentIndex].textParts || [] as part, i}
								<span>{@html renderMath(part)}</span>
								{#if i < (questions[currentIndex].clozeAnswers?.length || 0)}
									<input
										type="text"
										bind:value={inputs[i]}
										disabled={locked}
										class:correct={locked &&
											inputs[i].trim().toLowerCase() ===
												questions[currentIndex].clozeAnswers![i].trim().toLowerCase()}
										class:wrong={locked &&
											inputs[i].trim().toLowerCase() !==
												questions[currentIndex].clozeAnswers![i].trim().toLowerCase()}
										placeholder="?"
									/>
									{#if locked && inputs[i].trim().toLowerCase() !== questions[currentIndex]
												.clozeAnswers![i].trim()
												.toLowerCase()}
										<span class="correction">({questions[currentIndex].clozeAnswers![i]})</span>
									{/if}
								{/if}
							{/each}
						</div>

						{#if checkResult}
							<div class="feedback {checkResult}">
								{checkResult === 'correct' ? 'Richtig! 🎉' : 'Leider falsch 😕'}
							</div>
						{/if}

						<div class="actions">
							<button
								class="check-btn"
								on:click={checkClozeAnswer}
								disabled={locked || inputs.some((v) => !v)}
							>
								Überprüfen
							</button>
						</div>
					</div>
				{/if}
			</main>
		{:else}
			<section class="summary">
				<h1>
					{outOfHearts
						? '😥 Keine Herzen mehr'
						: correctCount === 0
							? 'Viel Glück beim nächsten Mal'
							: '🎉 Super gemacht!'}
				</h1>

				<div class="xp-chest">
					<div class="chest-glow"></div>
					<div class="chest-lid"></div>
					<div class="chest-box"></div>
				</div>

				<div class="summary-stats">
					<div>
						<span>Richtige Antworten</span>
						<strong>{correctCount} / {questions.length}</strong>
					</div>
					<div>
						<span>Level</span>
						<strong>{level}</strong>
					</div>
				</div>

				{#if sessionXp > 0}
					<p class="xp-earned">+{sessionXp} XP</p>
				{/if}

				<div class="achievements">
					<p>Freigeschaltete Badges:</p>
					<div class="badge-row">
						{#if correctCount === questions.length}
							<span class="badge">Perfekte Runde 🏅</span>
						{/if}
						{#if streak >= 3}
							<span class="badge">Streak-Meister 🔥</span>
						{/if}
						{#if !outOfHearts && correctCount >= Math.ceil(questions.length / 2)}
							<span class="badge">English-Pro 🌎</span>
						{/if}
					</div>
				</div>

				<div class="summary-actions">
					<button on:click={restartLesson}>Nochmal spielen</button>
					<button on:click={() => goto('/student_landing_page_id5')}> Dashboard </button>
				</div>
			</section>
		{/if}
	</div>
{/if}

<style>
	:global(body) {
		margin: 0;
		font-family:
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		background: #e7f4fa;
	}

	.game-root {
		max-width: 800px;
		margin: 0 auto;
		padding: 1.5rem 1rem 3rem;
		position: relative;
	}

	.loading,
	.error {
		text-align: center;
		padding: 4rem 1rem;
		color: #1d5e84;
	}

	.error button {
		margin-top: 1rem;
		padding: 0.6rem 1.4rem;
		border-radius: 12px;
		border: none;
		background: #236c93;
		color: white;
		cursor: pointer;
		min-height: 44px;
	}

	/* ============ HUD ============ */
	.hud {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.2rem;
		gap: 0.6rem;
	}

	.back-btn {
		border: none;
		background: white;
		border-radius: 999px;
		width: 40px;
		height: 40px;
		font-size: 1.4rem;
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
		color: #236c93;
		transition: transform 0.2s ease;
		min-height: 44px;
		min-width: 44px;
	}

	.back-btn:hover {
		transform: scale(1.05);
	}

	.hud-center {
		flex: 1;
		text-align: center;
	}

	.progress-top {
		height: 10px;
		background: #d9e5f0;
		border-radius: 999px;
		overflow: hidden;
		margin-bottom: 0.2rem;
	}

	.progress-inner {
		height: 100%;
		background: linear-gradient(90deg, #3ba776, #65d492);
		transition: width 0.2s;
	}

	.question-count {
		font-size: 0.85rem;
		color: #4a6175;
		margin: 0;
	}

	.hud-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.3rem;
		font-size: 0.9rem;
	}

	.hearts span {
		font-size: 1.2rem;
		margin-left: 0.1rem;
	}

	.hearts span.lost {
		opacity: 0.25;
	}

	.xp-display {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.15rem;
	}

	.xp-display span {
		font-size: 0.8rem;
		color: #1d5e84;
		font-weight: 600;
	}

	.xp-bar {
		width: 110px;
		height: 6px;
		border-radius: 999px;
		background: #d9e5f0;
		overflow: hidden;
	}

	.xp-inner {
		height: 100%;
		background: linear-gradient(90deg, #f6ad55, #f56565);
		transition: width 0.2s;
	}

	.streak {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		background: white;
		color: #000;
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
	}

	.streak span:first-child {
		font-size: 1.1rem;
	}

	/* ============ LEVEL UP POPUP ============ */
	.levelup-popup {
		position: fixed;
		top: 15%;
		left: 50%;
		transform: translateX(-50%);
		background: #3ba776;
		color: white;
		padding: 0.8rem 1.6rem;
		border-radius: 14px;
		font-weight: bold;
		box-shadow: 0 8px 18px rgba(0, 0, 0, 0.25);
		animation:
			popup 0.6s ease-out forwards,
			fadeOut 2s ease forwards;
		z-index: 50;
	}

	@keyframes popup {
		0% {
			transform: translate(-50%, -50%) scale(0.8);
			opacity: 0;
		}
		50% {
			transform: translate(-50%, -50%) scale(1.08);
			opacity: 1;
		}
		100% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 1;
		}
	}

	@keyframes fadeOut {
		0%,
		60% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	/* ============ CARD ============ */
	.card {
		background: white;
		padding: 2rem 1.5rem;
		border-radius: 18px;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
		animation: slideUp 0.25s ease-out;
	}

	.question {
		font-size: 1.5rem;
		color: #1d5e84; /* Restored Blue */
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.answers {
		display: grid;
		gap: 0.9rem;
	}

	.answer-btn {
		width: 100%;
		text-align: left;
		padding: 0.9rem 1rem;
		border-radius: 14px;
		border: 2px solid #d7e4ef;
		background: #f8fbff;
		color: #1d5e84; /* Restored Blue */
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 44px;
	}

	.answer-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
	}

	.answer-btn:focus-visible {
		outline: 2px solid #1d5e84;
		outline-offset: 2px;
	}

	.answer-btn.correct {
		background: #c6f6d5;
		border-color: #3ba776;
		color: #065f46;
	}

	.answer-btn.wrong {
		background: #ffd1d1;
		border-color: #ff6b6b;
		color: #991b1b;
	}

	/* ============ SUMMARY ============ */
	.summary {
		background: white;
		padding: 2rem 1.5rem;
		border-radius: 18px;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
		text-align: center;
		animation: slideUp 0.25s ease-out;
	}

	.summary h1 {
		margin-bottom: 0.5rem;
		color: #1d5e84;
	}

	.summary p {
		margin: 0.2rem 0;
		color: #4a6175;
	}

	.xp-earned {
		font-size: 1.3rem;
		font-weight: bold;
		color: #3ba776;
		margin-top: 0.6rem;
	}

	/* XP Chest - bleibt golden! */
	.xp-chest {
		position: relative;
		width: 130px;
		height: 100px;
		margin: 1.3rem auto 1rem;
	}

	.chest-box {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		margin: auto;
		width: 130px;
		height: 70px;
		background: linear-gradient(180deg, #d69e2e, #b7791f);
		border-radius: 10px;
		box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
	}

	.chest-lid {
		position: absolute;
		bottom: 55px;
		left: 10px;
		right: 10px;
		height: 30px;
		background: linear-gradient(180deg, #faf089, #ecc94b);
		border-radius: 10px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.chest-glow {
		position: absolute;
		bottom: 60px;
		left: 50%;
		transform: translateX(-50%);
		width: 90px;
		height: 40px;
		background: radial-gradient(circle, rgba(250, 240, 137, 0.9), transparent);
		opacity: 0.8;
		animation: glow 1.4s ease-in-out infinite;
	}

	@keyframes glow {
		0% {
			transform: translateX(-50%) scale(0.9);
			opacity: 0.7;
		}
		50% {
			transform: translateX(-50%) scale(1.05);
			opacity: 1;
		}
		100% {
			transform: translateX(-50%) scale(0.9);
			opacity: 0.7;
		}
	}

	.summary-stats {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		margin: 1rem 0;
	}

	.summary-stats span {
		display: block;
		font-size: 0.85rem;
		color: #6e8191;
	}

	.summary-stats strong {
		font-size: 1.2rem;
		color: #1d5e84;
	}

	.achievements {
		margin: 0.8rem 0;
	}

	.badge-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		justify-content: center;
		margin-top: 0.3rem;
	}

	.badge {
		background: #e7f4fa;
		border-radius: 999px;
		padding: 0.3rem 0.8rem;
		border: 1px solid #236c93;
		font-size: 0.85rem;
		color: #236c93;
		transition: background-color 0.3s ease;
	}

	/* ============ CLOZE STYLES ============ */
	.cloze-container {
		text-align: center;
	}

	.cloze-text {
		font-size: 1.3rem;
		line-height: 2.2;
		color: #333;
		margin-bottom: 2rem;
	}

	.cloze-text input {
		border: none;
		border-bottom: 2px solid #ccc;
		background: #f9f9f9;
		font-size: 1.2rem;
		width: 140px;
		text-align: center;
		margin: 0 6px;
		padding: 4px 8px;
		border-radius: 6px;
		color: #333;
		transition: all 0.2s;
	}

	.cloze-text input:focus {
		outline: none;
		border-bottom-color: #3ba776;
		background: #fff;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	}

	.cloze-text input.correct {
		border-color: #3ba776;
		background: #d1fae5;
		color: #065f46;
	}

	.cloze-text input.wrong {
		border-color: #ef4444;
		background: #fee2e2;
		color: #991b1b;
	}

	.correction {
		color: #3ba776;
		font-weight: bold;
		margin-left: 5px;
	}

	.actions {
		margin-top: 1.5rem;
	}

	.check-btn {
		background: #3ba776;
		color: white;
		border: none;
		padding: 0.8rem 2.5rem;
		border-radius: 999px;
		font-size: 1.1rem;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 10px rgba(59, 167, 118, 0.3);
	}

	.check-btn:disabled {
		background: #cbd5e0;
		cursor: not-allowed;
		box-shadow: none;
	}

	.check-btn:active:not(:disabled) {
		transform: scale(0.96);
	}

	.feedback {
		margin: 1rem 0;
		font-weight: bold;
		font-size: 1.2rem;
		animation: fadeIn 0.3s ease;
	}

	.feedback.correct {
		color: #3ba776;
	}
	.feedback.wrong {
		color: #ef4444;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.summary-actions {
		margin-top: 1.2rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		justify-content: center;
	}

	.summary-actions button {
		padding: 0.7rem 1.5rem;
		border-radius: 14px;
		border: none;
		background: linear-gradient(90deg, #236c93, #3ba776);
		color: white;
		font-weight: 600;
		cursor: pointer;
		min-height: 44px;
		transition: transform 0.2s;
	}

	.summary-actions button:hover {
		transform: translateY(-2px);
	}

	.summary-actions button:focus-visible {
		outline: 2px solid white;
		outline-offset: 2px;
	}

	.summary-actions button:nth-child(2) {
		background: var(--bg-hover, #e2e8f0);
		color: var(--text-primary, #1d5e84);
	}

	/* ============ CONFETTI ============ */
	.confetti {
		position: fixed;
		top: -20px;
		width: 10px;
		height: 16px;
		border-radius: 2px;
		animation-name: confetti-fall;
		animation-timing-function: linear;
		animation-iteration-count: 1;
		z-index: 100;
	}

	@keyframes confetti-fall {
		from {
			transform: translateY(-20px) rotate(0deg);
			opacity: 1;
		}
		to {
			transform: translateY(110vh) rotate(360deg);
			opacity: 0;
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
	}
</style>
