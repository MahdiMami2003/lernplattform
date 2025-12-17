<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data } = $props();
	let { supabase, session } = data;

	// Typescript: Cast window to any for Katex usage in renderMath

	/* ========== TYPES ========== */
	type Question = {
		id: number;
		textParts: string[]; // ["Berlin ist die Hauptstadt von ", "."]
		answers: string[]; // ["Deutschland"]
		userAnswers: string[]; // [""]
		xpReward: number;
		originalText: string;
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
	let profiles = $state<Profile | null>(null);

	let xp = $state(0);
	let level = $state(1);
	let streak = $state(0);
	const MAX_HEARTS = 3;
	let hearts = $state(MAX_HEARTS);

	let questions = $state<Question[]>([]);
	let currentIndex = $state(0);
	let checkResult = $state<'correct' | 'wrong' | null>(null);
	let locked = $state(false);
	let correctCount = $state(0);
	let inputs = $state<string[]>([]); // Current inputs for current question

	let showSummary = $state(false);
	let outOfHearts = $state(false);
	let levelUpVisible = $state(false);
	let confettiPieces = $state<ConfettiPiece[]>([]);

	let sessionXp = $state(0);

	// Params
	let subject = $page.url.searchParams.get('subject') || 'Allgemein';
	let topic = $page.url.searchParams.get('topic') || 'Allgemein';

	// Progress
	// Progress: Show 100% also when locked on last question or summary shown
	const progress = $derived(() => {
		if (showSummary) return 100;
		if (questions.length === 0) return 0;
		// Fill bar as user finishes current question
		return ((currentIndex + (locked ? 1 : 0)) / questions.length) * 100;
	});
	const xpProgress = $derived(() => (xp / 100) * 100);

	/* ========= HELPER ========= */
	async function fetchQuestionsFromDB() {
		try {
			loading = true;
			// Fetch questions where subject and category (topic) match
			// We also ensure it's a CLOZE question by checking if 'a1' is null or empty,
			// OR if the title contains brackets (safer if table is mixed).
			// Since we updated GameManagement to set a1=null, we rely on that or the brackets.

			let query = supabase
				.from('questions')
				.select('*')
				.eq('subject', subject)
				.ilike('category', topic); // case insensitive match for Topic

			const { data, error } = await query;

			if (error) throw error;

			// Filter client-side for Cloze-types (containing [...]) just in case
			const validQuestions = (data || []).filter(
				(q: any) => q.question.includes('[') && q.question.includes(']')
			);

			let mixedQuestions: Question[] = [];

			// 1. Add DB Questions
			if (validQuestions.length > 0) {
				mixedQuestions = shuffle(validQuestions).map((q: any, i: number) =>
					parseQuestion(q.question, i, q.xp_reward)
				);
			}

			// 2. Fill up with AI Questions if less than 5
			if (mixedQuestions.length < 5) {
				const needed = 5 - mixedQuestions.length;
				console.log(`Only ${mixedQuestions.length} questions in DB. Fetching ${needed} from AI...`);
				const aiQuestions = await fetchQuestionsFromAI(needed);
				mixedQuestions = [...mixedQuestions, ...aiQuestions];
			}

			if (mixedQuestions.length === 0) {
				useStaticFallback();
			} else {
				questions = mixedQuestions;
			}
		} catch (err) {
			console.error('Error loading questions:', err);
			loadError = 'Fehler beim Laden der Fragen.';
		} finally {
			loading = false;
		}
	}

	async function fetchQuestionsFromAI(count: number): Promise<Question[]> {
		try {
			const response = await fetch('/api/generate_questions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ subject, topic, count })
			});

			if (!response.ok) throw new Error('AI API responded with error');

			const result = await response.json();
			const generated = result.questions || [];

			return generated.map((q: any, i: number) =>
				parseQuestion(q.question, 1000 + i, q.xp_reward || 15)
			);
		} catch (e) {
			console.error('AI Fetch Error:', e);
			return [];
		}
	}

	function useStaticFallback() {
		const fallbacks = [
			`Das ist ein [Beispiel] für ${subject} - ${topic}.`,
			'Bitte fülle die [Lücke] aus.'
		];
		questions = fallbacks.map((q, i) => parseQuestion(q, i, 15));
	}

	function shuffle<T>(array: T[]): T[] {
		return array.sort(() => Math.random() - 0.5);
	}

	function parseQuestion(rawText: string, index: number, xp: number): Question {
		// Simple Math Formatting: Remove $ signs or replace with italics?
		// User said: "$x$ -> x". Let's just strip $ for now or use a span.
		// We do this AFTER extracting parts to not mess up indices,
		// BUT the parts are split by brackets [].
		// Let's first clean the text of $, then parse brackets.

		// Keep $ signs for Math rendering
		const cleanText = rawText;

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
			id: index,
			textParts,
			answers,
			userAnswers: new Array(answers.length).fill(''),
			xpReward: xp || 15,
			originalText: rawText
		};
	}

	/* ========= LOAD DATA ========= */
	async function loadProfileAndQuestions() {
		try {
			loading = true;
			loadError = null;

			// 1. Profile
			const { data: authData } = await supabase.auth.getUser();
			const user = authData?.user ?? null;

			if (user) {
				const { data: profileData } = await supabase
					.from('profiles')
					.select('*')
					.eq('id', user.id)
					.single();

				if (profileData) {
					profiles = profileData;
					xp = profileData.xp ?? 0;
					level = profileData.level ?? 1;
					streak = profileData.streak ?? 0;
					hearts = profileData.hearts ?? MAX_HEARTS;

					if (profileData.hearts < MAX_HEARTS) {
						hearts = MAX_HEARTS;
						await updateProfile({ hearts: MAX_HEARTS });
					}
				}
			} else {
				profiles = null;
			}

			// 2. Load Questions from DB
			await fetchQuestionsFromDB();
		} catch (err) {
			console.error(err);
			loadError = 'Fehler beim Laden.';
		} finally {
			loading = false;
			currentIndex = 0;
			if (questions.length > 0) {
				inputs = new Array(questions[0].answers.length).fill('');
			}
			checkResult = null;
			locked = false;
			correctCount = 0;
			showSummary = false;
			outOfHearts = false;
		}
	}

	async function updateProfile(update: Partial<Profile>) {
		if (!profiles) return;
		await supabase.from('profiles').update(update).eq('id', profiles.id);
	}

	function goNextOrFinish() {
		if (currentIndex < questions.length - 1) {
			currentIndex++;
			inputs = new Array(questions[currentIndex].answers.length).fill('');
			checkResult = null;
			locked = false;
		} else {
			showSummary = true;
			saveGameResult();
		}
	}

	function checkAnswer() {
		if (locked) return;

		const currentQ = questions[currentIndex];
		// Compare inputs with answers (case insensitive)
		const isCorrect = inputs.every(
			(val, i) => val.trim().toLowerCase() === currentQ.answers[i].trim().toLowerCase()
		);

		locked = true;

		if (isCorrect) {
			checkResult = 'correct';
			correctCount++;
			rewardXP(currentQ.xpReward);
			triggerConfetti();
		} else {
			checkResult = 'wrong';
			loseHeart();
		}

		// Auto next after delay? Or manual next button? Use delay for smooth flow.
		setTimeout(() => {
			if (!outOfHearts) {
				goNextOrFinish();
			}
		}, 2000);
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

		if (profiles) {
			await updateProfile({ xp, level });
		}
	}

	async function loseHeart() {
		hearts = Math.max(0, hearts - 1);
		if (hearts === 0) outOfHearts = true;
		if (profiles) await updateProfile({ hearts });
	}

	async function saveGameResult() {
		if (correctCount > 0 && profiles) {
			streak++;
			await updateProfile({ streak });
		}
	}

	function triggerConfetti() {
		const count = 15;
		const newConfetti = [];
		for (let i = 0; i < count; i++) {
			newConfetti.push({
				id: Math.random(),
				left: Math.random() * 100,
				duration: 1000 + Math.random() * 1000,
				delay: Math.random() * 200,
				color: ['#ff0', '#f00', '#0f0', '#00f', '#f0f'][Math.floor(Math.random() * 5)]
			});
		}
		confettiPieces = [...confettiPieces, ...newConfetti];
		setTimeout(() => {
			confettiPieces = [];
		}, 2500);
	}

	async function restartGame() {
		await loadProfileAndQuestions();
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
		// Fallback: strip $ if no katex
		return text.replace(/\$/g, '');
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
	<div class="loading"><p>Lade Lückentext-Fragen für {subject}...</p></div>
{:else if loadError}
	<div class="error">
		<p>{loadError}</p>
		<button onclick={loadProfileAndQuestions}>Neu laden</button>
	</div>
{:else}
	<div class="game-root">
		{#if levelUpVisible}
			<div class="levelup-popup">🎉 Level {level} erreicht!</div>
		{/if}

		{#each confettiPieces as piece (piece.id)}
			<div
				class="confetti"
				style={`left:${piece.left}%;animation-duration:${piece.duration}ms;animation-delay:${piece.delay}ms;background:${piece.color};`}
			></div>
		{/each}

		<header class="hud">
			<button class="back-btn" onclick={() => goto('/game_page_id12')}>←</button>

			<div class="hud-center">
				<h2>{subject} - {topic}</h2>
				<div class="progress-top">
					<div class="progress-inner" style={`width: ${progress()}%`}></div>
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
						<div class="xp-inner" style={`width: ${xpProgress()}%`}></div>
					</div>
				</div>
			</div>
		</header>

		{#if !showSummary && !outOfHearts}
			<main class="card">
				<div class="cloze-text">
					{#each questions[currentIndex].textParts as part, i}
						<span>{@html renderMath(part)}</span>
						{#if i < questions[currentIndex].answers.length}
							<input
								type="text"
								bind:value={inputs[i]}
								disabled={locked}
								class:correct={locked &&
									inputs[i].trim().toLowerCase() ===
										questions[currentIndex].answers[i].trim().toLowerCase()}
								class:wrong={locked &&
									inputs[i].trim().toLowerCase() !==
										questions[currentIndex].answers[i].trim().toLowerCase()}
								placeholder="?"
							/>
							{#if locked && inputs[i].trim().toLowerCase() !== questions[currentIndex].answers[i]
										.trim()
										.toLowerCase()}
								<span class="correction">({questions[currentIndex].answers[i]})</span>
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
						onclick={checkAnswer}
						disabled={locked || inputs.some((v) => !v)}
					>
						Überprüfen
					</button>
				</div>
			</main>
		{:else}
			<section class="summary">
				<h1>{outOfHearts ? '💔 Keine Herzen mehr' : '🎉 Lern-Session beendet!'}</h1>
				<div class="summary-stats">
					<div>
						<span>Richtige Antworten</span>
						<strong>{correctCount} / {questions.length}</strong>
					</div>
					{#if sessionXp > 0}
						<p class="xp-earned">+{sessionXp} XP</p>
					{/if}
				</div>
				<div class="summary-actions">
					<button onclick={restartGame}>Nochmal spielen</button>
					<button onclick={() => goto('/student_landing_page_id5')}>Dashboard</button>
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
		padding: 4rem;
		color: #1d5e84;
	}

	/* Reuse HUD styles broadly */
	.hud {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}
	.hud-center {
		flex: 1;
		text-align: center;
		margin: 0 1rem;
	}
	.hud-center h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		color: #1d5e84;
	}
	.hud-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.progress-top {
		height: 10px;
		background: #d9e5f0;
		border-radius: 10px;
		overflow: hidden;
	}
	.progress-inner {
		height: 100%;
		background: #3ba776;
		transition: width 0.3s;
	}

	.hearts span {
		font-size: 1.2rem;
	}
	.hearts span.lost {
		opacity: 0.3;
		filter: grayscale(1);
	}

	.xp-bar {
		width: 100px;
		height: 6px;
		background: #ddd;
		border-radius: 4px;
	}
	.xp-inner {
		height: 100%;
		background: orange;
	}

	.card {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.cloze-text {
		font-size: 1.3rem;
		line-height: 2.2;
		color: #333;
	}

	.cloze-text input {
		border: none;
		border-bottom: 2px solid #ccc;
		background: #f9f9f9;
		font-size: 1.2rem;
		width: 120px;
		text-align: center;
		margin: 0 5px;
		padding: 2px 5px;
		border-radius: 4px;
		color: #333;
	}

	.cloze-text input:focus {
		outline: none;
		border-bottom-color: #3ba776;
		background: #fff;
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
		margin-top: 2rem;
		text-align: center;
	}

	.check-btn {
		background: #3ba776;
		color: white;
		border: none;
		padding: 0.8rem 2rem;
		border-radius: 2rem;
		font-size: 1.1rem;
		font-weight: bold;
		cursor: pointer;
		transition: transform 0.1s;
	}

	.check-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.check-btn:active:not(:disabled) {
		transform: scale(0.95);
	}

	.feedback {
		margin-top: 1rem;
		text-align: center;
		font-weight: bold;
		font-size: 1.2rem;
	}
	.feedback.correct {
		color: #3ba776;
	}
	.feedback.wrong {
		color: #ef4444;
	}

	.summary {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		text-align: center;
	}

	.summary-actions button {
		margin: 0.5rem;
		padding: 0.8rem 1.5rem;
		border-radius: 12px;
		border: none;
		background: #236c93;
		color: white;
		cursor: pointer;
	}

	.back-btn {
		background: white;
		border: none;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		font-size: 1.2rem;
	}

	.levelup-popup {
		position: fixed;
		top: 20%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: #3ba776;
		color: white;
		padding: 1rem 2rem;
		border-radius: 10px;
		font-weight: bold;
		z-index: 100;
	}

	.confetti {
		position: fixed;
		top: -10px;
		width: 10px;
		height: 10px;
		animation: fall linear forwards;
		z-index: 50;
	}

	@keyframes fall {
		to {
			transform: translateY(110vh) rotate(720deg);
		}
	}
</style>
