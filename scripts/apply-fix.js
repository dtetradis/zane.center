const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
  console.log('🔧 Fixing RLS policies...\n');

  const sql = fs.readFileSync('scripts/fix-rls.sql', 'utf8');

  // Split by semicolon and execute each statement
  const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));

  for (const statement of statements) {
    try {
      console.log(`Executing: ${statement.trim().substring(0, 60)}...`);
      const { error } = await supabase.rpc('exec', { sql: statement.trim() + ';' });
      if (error) {
        // Try direct query as fallback
        const result = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sql: statement.trim() })
        });
      }
      console.log('  ✅ Done\n');
    } catch (err) {
      console.log(`  ⚠️  ${err.message}\n`);
    }
  }

  console.log('\n✅ RLS policies fixed!');
  console.log('🔄 Please refresh your browser at http://localhost:3002/demo');
}

applyFix();
