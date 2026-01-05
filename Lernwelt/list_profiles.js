
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hbjxqocukmkhwadckqqr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhianhxb2N1a21raHdhZGNrcXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MzExMTEsImV4cCI6MjA3NjIwNzExMX0.jwbvkwo_0WT64_ynMHcB2mCIF8F5fXCqI3ouwc9_zy8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllProfiles() {
    console.log("Listing all profiles...");

    const { data, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    console.log(`Found ${data.length} profiles:`);
    data.forEach(p => {
        console.log(`- ID: ${p.id}, Name: ${p.full_name}, Role: ${p.role}, Email: ${p.email || 'N/A'}`);
    });
}

listAllProfiles();
