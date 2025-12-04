
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://imlfyztrilkdccfuwrmm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbGZ5enRyaWxrZGNjZnV3cm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzgxNDEsImV4cCI6MjA4MDI1NDE0MX0.rZBDKPKdJdcSlowDn57WB0mzyjf__ZnmWpcTW_JsUUM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Listing users...');
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Users:', data);
    }
}

main();
