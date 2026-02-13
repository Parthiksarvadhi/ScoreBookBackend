import pg from 'pg';

const { Client } = pg;

const client = new Client({
  user: 'postgres',
  password: 'Parthik@2026',
  host: '127.0.0.1',
  port: 5432,
  database: 'scorebook',
});

async function checkSchema() {
  try {
    await client.connect();
    
    // Check balls table structure
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'balls'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Balls Table Schema:');
    console.log('═'.repeat(70));
    result.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
      console.log(`  ${row.column_name.padEnd(20)} ${row.data_type.padEnd(15)} ${nullable}`);
    });
    
    // Check if nonStrikerId exists
    const hasNonStriker = result.rows.some(r => r.column_name === 'nonStrikerId');
    console.log('\n' + '═'.repeat(70));
    if (hasNonStriker) {
      console.log('✅ nonStrikerId column exists and is ready to use');
    } else {
      console.log('❌ nonStrikerId column NOT found');
    }
    
    // Check sample data
    const ballCount = await client.query('SELECT COUNT(*) as count FROM balls');
    console.log(`\n📊 Total balls in database: ${ballCount.rows[0].count}`);
    
    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
