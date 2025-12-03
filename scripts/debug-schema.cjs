
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually load env vars
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSchema() {
    console.log('Testing Supabase Schema...');

    try {
        // Try to select raw_data specifically to see if it errors
        const { data, error } = await supabase
            .from('bets')
            .select('raw_data')
            .limit(1);

        if (error) {
            console.error('Error selecting raw_data:', error);
            console.log('Likely cause: raw_data column does not exist.');
        } else {
            console.log('Success selecting raw_data!');
            console.log('Data:', data);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testSchema();
