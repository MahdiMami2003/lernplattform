
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hbjxqocukmkhwadckqqr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhianhxb2N1a21raHdhZGNrcXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MzExMTEsImV4cCI6MjA3NjIwNzExMX0.jwbvkwo_0WT64_ynMHcB2mCIF8F5fXCqI3ouwc9_zy8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    console.log("Checking for teacher accounts...");

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'teacher');

    if (error) {
        console.error("Error fetching teachers:", error);
        return;
    }

    console.log(`Found ${data.length} teachers:`);
    data.forEach(t => {
        console.log(`- ID: ${t.id}, Name: ${t.full_name}, Role: ${t.role}`);
    });

    // Check by email if possible (profiles might have email)
    // Most profiles have an id that matches auth.uid()
}

checkUsers();
