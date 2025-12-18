
import { json } from '@sveltejs/kit';
import { GOOGLE_API_KEY } from '$env/static/private';

// Interne Backup-Datenbank für den Fall, dass die KI nicht erreichbar ist
const BACKUP_QUESTIONS: Record<string, { question: string; xp_reward: number }[]> = {
    'Mathe': [
        { question: 'Der Satz des Pythagoras lautet a² + b² = [c²].', xp_reward: 20 },
        { question: 'Die Ableitung von x² ist [2x].', xp_reward: 20 },
        { question: 'sin(90°) ist gleich [1].', xp_reward: 20 },
        { question: 'Eine quadratische Funktion hat die Form f(x) = ax² + bx + [c].', xp_reward: 20 },
        { question: 'Die Diskriminante bestimmt die Anzahl der [Lösungen].', xp_reward: 20 },
        { question: 'Logarithmus zur Basis 10 von 100 ist [2].', xp_reward: 20 },
        { question: 'Das Integral von 2x dx ist [x²].', xp_reward: 25 },
        { question: 'Ein Vektor hat eine Länge und eine [Richtung].', xp_reward: 15 },
        { question: 'Die Winkelsumme im Viereck beträgt [360] Grad.', xp_reward: 15 },
        { question: '3 hoch 3 ist [27].', xp_reward: 15 }
    ],
    'Deutsch': [
        { question: 'Faust ist eine Tragödie von Johann Wolfgang von [Goethe].', xp_reward: 20 },
        { question: 'Der Konjunktiv II drückt oft eine [Möglichkeit] aus.', xp_reward: 20 },
        { question: 'Eine sprachliche Übertreibung nennt man [Hyperbel].', xp_reward: 20 },
        { question: 'Die Literaturepoche um 1800 nennt man Weimarer [Klassik].', xp_reward: 20 },
        { question: 'Nathan der [Weise] ist ein Werk von Lessing.', xp_reward: 20 },
        { question: 'Ein Gedicht mit 14 Zeilen ist ein [Sonett].', xp_reward: 25 },
        { question: 'Kafka schrieb "Die [Verwandlung]".', xp_reward: 20 },
        { question: '"Sein oder Nichtsein" ist ein Zitat aus [Hamlet].', xp_reward: 20 },
        { question: 'Der Erlkönig ist eine [Ballade].', xp_reward: 15 },
        { question: 'Alliteration ist der gleiche [Anfangslaut] bei Wörtern.', xp_reward: 15 }
    ],
    'Englisch': [
        { question: 'The past participle of "go" is [gone].', xp_reward: 15 },
        { question: 'If I were you, I [would] do it. (Conditional II)', xp_reward: 20 },
        { question: 'Shakespeare wrote "Romeo and [Juliet]".', xp_reward: 15 },
        { question: 'The currency of the USA is the [Dollar].', xp_reward: 10 },
        { question: 'The "Statue of Liberty" is located in [New York].', xp_reward: 15 },
        { question: 'To "beat around the bush" means to avoid the [topic].', xp_reward: 25 },
        { question: 'The opposite of "generous" is [stingy].', xp_reward: 20 },
        { question: 'Global warming is caused by the [greenhouse] effect.', xp_reward: 20 },
        { question: 'The UK consists of four [nations].', xp_reward: 20 },
        { question: 'An apple a day keeps the [doctor] away.', xp_reward: 15 }
    ],
    'Physik': [
        { question: 'F = m * [a] (Newtons zweites Gesetz).', xp_reward: 20 },
        { question: 'Die Einheit des elektrischen Widerstands ist [Ohm].', xp_reward: 15 },
        { question: 'Licht ist eine elektromagnetische [Welle].', xp_reward: 20 },
        { question: 'E = mc² beschreibt die Äquivalenz von Masse und [Energie].', xp_reward: 25 },
        { question: 'Die Beschleunigung durch Schwerkraft beträgt ca. 9,81 [m/s²].', xp_reward: 20 },
        { question: 'Ein Atomkern besteht aus Protonen und [Neutronen].', xp_reward: 15 },
        { question: 'Kinetische Energie ist Bewegungs[energie].', xp_reward: 15 },
        { question: 'U = R * [I] (Ohmsches Gesetz).', xp_reward: 15 },
        { question: 'Die Geschwindigkeit des Lichts ist [konstant].', xp_reward: 20 },
        { question: 'Radioaktivität wird mit einem [Geigerzähler] gemessen.', xp_reward: 20 }
    ]
};

export async function POST({ request }) {
    let subject = 'Allgemein';
    let topic = 'Allgemein';
    let count = 5;

    try {
        const body = await request.json();
        subject = body.subject || subject;
        topic = body.topic || topic;
        count = body.count || 5;

        // 1. Versuch: KI Generierung
        if (GOOGLE_API_KEY) {
            const prompt = `
                Erstelle ${count} anspruchsvolle Lückentext-Fragen für Schüler der 10. Klasse (Gymnasium) im Fach "${subject}" zum Thema "${topic}".
                Die Fragen sollen tiefes Verständnis erfordern und schwieriger sein.
                Format: JSON Array.
                Jede Frage muss einen Satz 'question' enthalten, wobei nur das Schlüsselwort in eckigen Klammern steht.
                Beispiel: "Die [Photosynthese] ist essentiell für Pflanzen."
                Antworte NUR mit validem JSON:
                {
                    "questions": [
                        { "question": "Frage [Antwort]", "xp_reward": 20 }
                    ]
                }
            `;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (response.ok) {
                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    const parsed = JSON.parse(jsonStr);
                    if (parsed.questions && Array.isArray(parsed.questions)) {
                        return json(parsed);
                    }
                }
            } else {
                console.warn('AI API Error:', response.status);
            }
        }
    } catch (err) {
        console.error('AI Gen Error:', err);
    }

    // 2. Fallback: Interne Datenbank nutzen
    // Wir suchen Fragen, die zum Fach passen (fuzzy match)
    const matchedSubject = Object.keys(BACKUP_QUESTIONS).find(k => subject.includes(k) || k.includes(subject)) || 'Mathe'; // Default zu Mathe wenn nix passt

    // Zufällige Auswahl aus dem Backup
    const pool = BACKUP_QUESTIONS[matchedSubject] || BACKUP_QUESTIONS['Mathe'];
    const shuffled = pool.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);

    return json({
        questions: selected
    });
}
