
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://imlfyztrilkdccfuwrmm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbGZ5enRyaWxrZGNjZnV3cm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzgxNDEsImV4cCI6MjA4MDI1NDE0MX0.rZBDKPKdJdcSlowDn57WB0mzyjf__ZnmWpcTW_JsUUM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Starting Global Reset & Admin Setup...');

    // 1. Make shinybetting@gmail.com Admin
    const email = 'shinybetting@gmail.com';
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
            // Try RPC fallback
            const { error: rpcError } = await supabase.rpc('admin_change_role', { p_user_id: user.id, p_role: 'super_admin' });
            if (rpcError) console.error('RPC failed too:', rpcError);
        } else {
            console.log('Role updated successfully.');
        }
    }

    // 2. Reset ALL Balances to 0
    console.log('Resetting ALL user balances to 0...');
    const { error: resetError } = await supabase
        .from('wallets')
        .update({ credits: 0 })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy filter to allow "update all" if RLS permits, or just omit filter if allowed

    // Note: Supabase JS client might block update without filter.
    // If so, we might need to fetch all IDs or use a broad filter.
    // Let's try updating where credits is not 0.

    const { error: resetError2, count } = await supabase
        .from('wallets')
        .update({ credits: 0 })
        .neq('credits', 0);

    if (resetError2) {
        console.error('Error resetting balances:', resetError2);
    } else {
        console.log(`Reset balances for ${count ?? 'unknown'} wallets.`);
    }
}

main();
