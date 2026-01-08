import { json } from '@sveltejs/kit';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY} from "$env/static/private";

interface McqOption { text: string }
interface McqQuestion {
  question: string;
  options: McqOption[];
  correctIndex: number;
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const subject: string = body.subject || 'Allgemein';
    const topic: string = body.topic || 'Grundlagen';
    const grade: string = body.grade || '5';
    const difficulty: 'easy'|'medium'|'hard' = body.difficulty || 'easy';
    const count: number = Math.min(Math.max(Number(body.count) || 1, 1), 5);
    const rawLang: string = body.lang || 'de';
    const lang: 'de' | 'en' = String(rawLang).toLowerCase().startsWith('en') ? 'en' : 'de';


    const prompt_de = `ANTWORTE AUSSCHLIESSLICH AUF DEUTSCH. KEIN ENGLISCH.
Du bist ein pädagogischer Assistent für junge Schüler (Klasse ${grade}).
Befolge strikt diese Regeln:
1) Rechtschreibung: Achte penibel auf korrekte Rechtschreibung.
2) Format & Struktur: Erzeuge ${count} Multiple-Choice-Fragen (MCQ) im Fach "${subject}" zum Thema "${topic}" mit der Schwierigkeit "${difficulty}".
Rahmen: kindgerechte Gamification (Abenteuer, Tieren helfen, Roboter).
Anforderungen:
- Jede Frage hat GENAU 4 Antwortmöglichkeiten.
- Klare, altersgerechte Sprache (Klasse ${grade}). Kein Fachjargon.
- NUR valides JSON, ohne Erklärtext oder Markdown.
Struktur:
{
  "questions": [
    {
      "question": "Text der Frage",
      "options": [
        { "text": "Antwort A" },
        { "text": "Antwort B" },
        { "text": "Antwort C" },
        { "text": "Antwort D" }
      ],
      "correctIndex": 0
    }
  ]
}
- correctIndex ist die Position der richtigen Antwort (0..3).
- Motivierende Fragen (z.B. "Hilf dem Robo-Hund...").`;

    const prompt_en = `ANSWER STRICTLY IN ENGLISH. NO GERMAN.
You are a pedagogical assistant for young students (grade ${grade}).

Follow these rules strictly:
1) Spelling: Ensure impeccable spelling.
2) Format & Structure: Generate ${count} MCQs in the subject "${subject}" on the topic "${topic}" with difficulty "${difficulty}".
Theme: kid-friendly gamification (adventure, helping animals, robots).
Requirements:
- EXACTLY 4 answer options per question.
- Clear, age-appropriate wording (grade ${grade}). No jargon.
- ONLY valid JSON. No explanations. No markdown.
Structure:
{
  "questions": [
    {
      "question": "Text of the question",
      "options": [
        { "text": "Answer A" },
        { "text": "Answer B" },
        { "text": "Answer C" },
        { "text": "Answer D" }
      ],
      "correctIndex": 0
    }
  ]
}
- correctIndex is the position of the correct answer (0..3).
- Motivating questions (e.g., "Help the robo-dog...").`;

    const prompt = (lang === 'en') ? prompt_en : prompt_de;

    const apiKey = GEMINI_API_KEY; // Fallback, falls anders benannt
    let cleaned: McqQuestion[] | null = null;

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        const text = response?.candidates?.[0]?.content?.parts?.[0]?.text ?? response?.text;
        if (text) {
          const jsonStr = String(text).replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(jsonStr);
          if (parsed?.questions && Array.isArray(parsed.questions)) {
            cleaned = parsed.questions
              .slice(0, count)
              .map((q: any) => ({
                question: String(q.question || ''),
                options: Array.isArray(q.options) ? q.options.slice(0, 4).map((o: any) => ({ text: String(o.text || '') })) : [],
                correctIndex: Number.isInteger(q.correctIndex) ? Math.min(Math.max(q.correctIndex, 0), 3) : 0,
              }))
              .filter((q: any) => q.question && q.options.length === 4);
          }
        }
      } catch (e) {
        console.warn('Gemini client error', e);
      }
    } else {
      console.warn('GEMINI_API_KEY nicht gesetzt – nutze Fallback-Fragen');
    }

    if (cleaned && cleaned.length) {
      return json({ questions: cleaned });
    }

    // Fallback: einfache Fragen in der UI-Sprache
    const fallbackDe = [
      { question: 'Hilf dem Lern-Roboter! Welche Zahl ist gerade?', options: [ { text: '3' }, { text: '4' }, { text: '7' }, { text: '9' } ], correctIndex: 1 },
      { question: 'Welches Wort ist ein Nomen?', options: [ { text: 'laufen' }, { text: 'rot' }, { text: 'Haus' }, { text: 'schnell' } ], correctIndex: 2 }
    ];
    const fallbackEn = [
      { question: 'Help the learning robot! Which number is even?', options: [ { text: '3' }, { text: '4' }, { text: '7' }, { text: '9' } ], correctIndex: 1},
      { question: 'Which word is a noun?', options: [ { text: 'run' }, { text: 'red' }, { text: 'house' }, { text: 'fast' } ], correctIndex: 2}
    ];

    return json({ questions: (lang === 'en' ? fallbackEn : fallbackDe).slice(0, count) });
  } catch (err) {
    console.error('generate_mcq error', err);
    return json({ error: 'generation_failed' }, { status: 500 });
  }
}
