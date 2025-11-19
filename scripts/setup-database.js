const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL(sqlContent, description) {
  console.log(`\n🔄 Running: ${description}...`);

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      // Try direct query if rpc doesn't work
      const queries = sqlContent.split(';').filter(q => q.trim());

      for (const query of queries) {
        if (query.trim()) {
          const { error: queryError } = await supabase.rpc('query', { query_text: query });
          if (queryError && !queryError.message.includes('already exists')) {
            console.error(`⚠️  Error: ${queryError.message}`);
          }
        }
      }
    }

    console.log(`✅ ${description} completed`);
  } catch (err) {
    console.error(`❌ Error in ${description}:`, err.message);
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up Zane Center database...\n');

  // Read SQL files
  const schemaPath = path.join(__dirname, '../supabase/schema.sql');
  const sampleDataPath = path.join(__dirname, '../supabase/sample-data.sql');

  const schema = fs.readFileSync(schemaPath, 'utf8');
  const sampleData = fs.readFileSync(sampleDataPath, 'utf8');

  // Run schema
  await runSQL(schema, 'Database schema');

  // Run sample data
  await runSQL(sampleData, 'Sample data');

  console.log('\n✨ Database setup complete!\n');
  console.log('📝 Next steps:');
  console.log('   1. Visit http://localhost:3002/demo');
  console.log('   2. Sign up at http://localhost:3002/demo/dashboard/signup');
  console.log('   3. Use email: demo@example.com or owner@example.com');
}

setupDatabase().catch(console.error);
