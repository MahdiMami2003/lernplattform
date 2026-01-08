<script lang="ts">
  import { _, locale } from '$lib/i18n/config';
  const subjects = ['Mathe', 'Deutsch', 'Englisch', 'Physik'] as const;
  type Subject = typeof subjects[number];
  const topicsBySubject: Record<Subject, string[]> = {
    Mathe: ['Grundrechenarten', 'Brüche', 'Geometrie', 'Prozentrechnung'],
    Deutsch: ['Grammatik', 'Rechtschreibung', 'Lesen', 'Textverständnis'],
    Englisch: ['Vocabulary', 'Grammar', 'Reading', 'Listening'],
    Physik: ['Kräfte', 'Elektrizität', 'Optik', 'Magnetismus'],
  };

  let subject = $state<Subject>(subjects[0]);
  let topic = $state<string>(topicsBySubject[subject][0]);
  let grade = $state<string>('5');
  let difficulty = $state<'easy' | 'medium' | 'hard'>('easy');
  let loading = $state<boolean>(false);
  let error = $state<string>('');
  type McqQuestion = { question: string; options: { text: string }[]; correctIndex: number };
  let questions = $state<McqQuestion[]>([]);
  let showSolution = $state<boolean[]>([]);

  function onSubjectChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    subject = target.value as Subject;
    topic = topicsBySubject[subject][0];
  }

  function toggleSolution(i: number) {
    const next = [...showSolution];
    next[i] = !next[i];
    showSolution = next;
  }

  async function generate() {
    loading = true; error = ''; questions = []; showSolution = [];
    try {
      const res = await fetch('/api/generate_mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, grade, difficulty, count: 3, lang: $locale })
      });
      const data = await res.json();
      if (!res.ok || !data?.questions) { throw new Error($_('ai_page.error_generic')); }
      questions = data.questions as McqQuestion[];
      showSolution = new Array(questions.length).fill(false);
    } catch (e) {
      error = $_('ai_page.error_generic');
      console.error(e);
    } finally {
      loading = false;
    }
  }

  function goBack() {
    history.back();
  }
</script>

<style>
  :root { color-scheme: light dark; }
  .page { max-width: 900px; margin: 0 auto; padding: 1rem; }
  .controls { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .row { display: contents; }
  label { color: var(--text-2, inherit); font-weight: 600; }
  select { background-color: #fff !important; color: #111 !important; border: 1px solid var(--border, #ccc); }
  select:focus { outline: 2px solid #2d6cdf22; }
  .card { transition: transform 120ms ease, box-shadow 120ms ease; }
  .options { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem; }
  .option { border: 1px solid var(--border, #ccc); border-radius: 6px; padding: 0.5rem; background: var(--surface-2, inherit); }
  .option.correct { border-color: #1a7f37; background: #e8f8ec; }
  .solution-btn { background: transparent; color: #2d6cdf; border: 1px dashed #2d6cdf; border-radius: 6px; padding: 0.35rem 0.6rem; cursor: pointer; }
  .disclaimer { margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary); border-left: 3px solid #2d6cdf; padding: 0.5rem 0.75rem; background: var(--surface-1); }
  .back-btn { display:inline-block; margin-bottom: 0.5rem; border: 1px solid var(--border,#ccc); background: var(--surface-1); color: inherit; border-radius: 6px; padding: 0.4rem 0.7rem; cursor: pointer; }
</style>

<div class="page">
  <button class="back-btn" onclick={goBack}>{$_('common.back')}</button>

  <h2>{$_('ai_page.title')}</h2>
  <p>{$_('ai_page.subtitle')}</p>

  <div class="controls">
    <div class="row">
      <label for="fach">{$_('ai_page.labels.subject')}</label>
      <select id="fach" onchange={onSubjectChange} bind:value={subject}>
        {#each subjects as s}
          <option value={s}>{s}</option>
        {/each}
      </select>
    </div>

    <div class="row">
      <label for="thema">{$_('ai_page.labels.topic')}</label>
      <select id="thema" bind:value={topic}>
        {#each topicsBySubject[subject] as t}
          <option value={t}>{t}</option>
        {/each}
      </select>
    </div>

    <div class="row">
      <label for="klasse">{$_('ai_page.labels.grade')}</label>
      <select id="klasse" bind:value={grade}>
        {#each ['5','6','7','8','9','10'] as g}
          <option value={g}>{g}. Klasse</option>
        {/each}
      </select>
    </div>

    <div class="row">
      <label for="schwierigkeit">{$_('ai_page.labels.difficulty')}</label>
      <select id="schwierigkeit" bind:value={difficulty}>
        <option value="easy">{$_('ai_page.difficulty.easy')}</option>
        <option value="medium">{$_('ai_page.difficulty.medium')}</option>
        <option value="hard">{$_('ai_page.difficulty.hard')}</option>
      </select>
    </div>
  </div>

  <div style="margin-top: 1rem;">
    <button class="generate" onclick={generate} disabled={loading}>
      {loading ? $_('ai_page.generating') : $_('ai_page.generate')}
    </button>
  </div>

  {#if error}
    <div class="card" style="background:#ffe6e6; border-color:#ffb3b3;">{error}</div>
  {/if}

  {#if questions.length}
    <h3 style="margin-top:1rem;">{$_('ai_page.questions_title')}</h3>
    {#each questions as q, i}
      <div class="card">
        <div><strong>Frage {i + 1}:</strong> {q.question}</div>
        <div class="options">
          {#each q.options as opt, idx}
            <div class="option {showSolution[i] && idx === q.correctIndex ? 'correct' : ''}">
              {String.fromCharCode(65 + idx)}. {opt.text}
            </div>
          {/each}
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:0.5rem;">
          <button class="solution-btn" aria-expanded={showSolution[i] ? 'true' : 'false'} onclick={() => toggleSolution(i)}>
            {showSolution[i] ? $_('ai_page.solution.hide') : $_('ai_page.solution.show')}
          </button>
          {#if showSolution[i]}
            <div class="meta">Richtige Antwort: {String.fromCharCode(65 + q.correctIndex)}</div>
          {/if}
        </div>
      </div>
    {/each}
  {/if}

  <div class="disclaimer">{$_('ai_page.disclaimer')}</div>
</div>
