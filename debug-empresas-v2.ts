
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkEmpresas() {
    console.log('Checking empresas in DB...')

    // 1. List all
    const { data: all, error: errorAll } = await supabase
        .from('empresas')
        .select('id, nombre')

    if (errorAll) {
        console.error('Error listing all:', errorAll)
    } else {
        console.log('All Empresas:', JSON.stringify(all, null, 2))
    }

    // 2. Try specific search
    const query = 'EIMISA'
    const { data: search, error: errorSearch } = await supabase
        .from('empresas')
        .select('id, nombre')
        .ilike('nombre', `%${query}%`)

    if (errorSearch) {
        console.error('Error searching:', errorSearch)
    } else {
        console.log(`Search for '${query}':`, JSON.stringify(search, null, 2))
    }
}

checkEmpresas()
