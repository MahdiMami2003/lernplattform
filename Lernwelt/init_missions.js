
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hbjxqocukmkhwadckqqr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhianhxb2N1a21raHdhZGNrcXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MzExMTEsImV4cCI6MjA3NjIwNzExMX0.jwbvkwo_0WT64_ynMHcB2mCIF8F5fXCqI3ouwc9_zy8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Starting mission initialization...");

    // 1. Fetch Students
    const { data: students, error: sError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'student');

    if (sError) {
        console.error("Error fetching students:", sError);
        return;
    }
    console.log(`Found ${students.length} students.`);

    // 2. Fetch Missions
    const { data: missions, error: mError } = await supabase
        .from('missions')
        .select('id');

    if (mError) {
        console.error("Error fetching missions:", mError);
        return;
    }
    console.log(`Found ${missions.length} missions.`);

    // 3. Prepare Inserts
    const inserts = [];
    for (const s of students) {
        for (const m of missions) {
            inserts.push({
                user_id: s.id,
                mission_id: m.id,
                progress: 0,
                completed: false
            });
        }
    }

    // 4. Upsert (ignore duplicates)
    // We send in batches of 100 to be safe
    const batchSize = 100;
    for (let i = 0; i < inserts.length; i += batchSize) {
        const batch = inserts.slice(i, i + batchSize);
        const { error: iError } = await supabase
            .from('missions_progress')
            .upsert(batch, { onConflict: 'user_id, mission_id', ignoreDuplicates: true });

        if (iError) console.error("Batch insert error:", iError);
        else console.log(`Processed batch ${i} - ${i + batch.length}`);
    }

    console.log("Mission progress records initialized.");

    // 5. Add some random progress for demo purposes
    // We'll update the first student found (likely the user)
    if (students.length > 0) {
        const userId = students[0].id;
        console.log(`Adding demo progress for user ${userId}...`);

        // Fetch their progress rows
        const { data: progressRows } = await supabase
            .from('missions_progress')
            .select('id, mission_id')
            .eq('user_id', userId);

        if (progressRows) {
            for (const row of progressRows) {
                if (Math.random() < 0.3) {
                    const prog = Math.floor(Math.random() * 5) + 1;
                    const completed = Math.random() < 0.1;
                    await supabase
                        .from('missions_progress')
                        .update({
                            progress: completed ? 100 : prog,
                            completed: completed
                        })
                        .eq('id', row.id);
                }
            }
        }
    }

    console.log("Done!");
}

main();
