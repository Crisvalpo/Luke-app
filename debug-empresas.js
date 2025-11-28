
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEmpresas() {
    console.log('Checking empresas in DB...');
    const { data, error } = await supabase
        .from('empresas')
        .select('*');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Empresas found:', JSON.stringify(data, null, 2));
    }
}

checkEmpresas();
