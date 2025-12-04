
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://imlfyztrilkdccfuwrmm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbGZ5enRyaWxrZGNjZnV3cm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzgxNDEsImV4cCI6MjA4MDI1NDE0MX0.rZBDKPKdJdcSlowDn57WB0mzyjf__ZnmWpcTW_JsUUM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const userId = '956edeea-3fe8-4b82-bfc9-e72fd808fa2f';
    console.log(`Updating user ${userId}...`);

    // 2. Update Role
    console.log('Updating role to super_admin...');
    const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', userId);

    if (roleError) {
        console.error('Error updating role:', roleError);
        console.log('Trying RPC admin_change_role...');
        const { error: rpcError } = await supabase.rpc('admin_change_role', { p_user_id: userId, p_role: 'super_admin' });
        if (rpcError) console.error('RPC failed too:', rpcError);
    } else {
        console.log('Role updated successfully.');
    }

    // 3. Reset Balance
    console.log('Resetting balance...');
    const { error: walletError } = await supabase
        .from('wallets')
        .update({ credits: 1000 })
        .eq('user_id', userId);

    if (walletError) {
        console.error('Error updating wallet:', walletError);
        // Try increment_balance with a negative amount to zero it out? No, we want to set it.
        // Maybe there is a set_balance RPC?
    } else {
        console.log('Balance reset to 1000.');
    }
}

main();
