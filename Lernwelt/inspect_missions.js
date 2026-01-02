
import { createClient } from '@supabase/supabase-js';
// Read from .env manually or hardcode for now if I can find them.
// I saw .env in the file list. I'll try to read it first.
// proper way is to use dotenv.

import dotenv from 'dotenv';
dotenv.config();

const sbUrl = process.env.PUBLIC_SUPABASE_URL;
const sbKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
// Wait, anon key might not have permissions to read everything? 
// I might need SERVICE_ROLE_KEY if RLS blocks me. 
// But let's try with ANON first if table is public read.

if (!sbUrl || !sbKey) {
    console.log("No env vars found.");
    process.exit(1);
}

const supabase = createClient(sbUrl, sbKey);

async function run() {
    console.log("Fetching missions...");
    const { data: missions, error } = await supabase.from('missions').select('*');
    if (error) console.error("Missions Error:", error);
    else console.log("Missions:", missions?.length, missions);

    console.log("Fetching progress...");
    const { data: prog, error: pError } = await supabase.from('missions_progress').select('*').limit(5);
    if (pError) console.error("Progress Error:", pError);
    else console.log("Progress Sample:", prog);
}

run();
