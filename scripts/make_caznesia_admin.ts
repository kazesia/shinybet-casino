
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://imlfyztrilkdccfuwrmm.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbGZ5enRyaWxrZGNjZnV3cm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzgxNDEsImV4cCI6MjA4MDI1NDE0MX0.rZBDKPKdJdcSlowDn57WB0mzyjf__ZnmWpcTW_JsUUM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Starting Admin Setup for caznesia@gmail.com...');

    const email = 'caznesia@gmail.com';
    console.log(`Looking for user ${email}...`);

    const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('email', email)
        .single();

    if (userError || !user) {
        console.error(`User ${email} not found. Please ensure they have signed up.`);
    } else {
        console.log(`Found user ${user.id}. Updating role to super_admin...`);
        const { error: roleError } = await supabase
            .from('profiles')
            .update({ role: 'super_admin' })
            .eq('id', user.id);

        if (roleError) {
            console.error('Error updating role:', roleError);
        } else {
            console.log('Role updated successfully.');
        }
    }
}

main();
