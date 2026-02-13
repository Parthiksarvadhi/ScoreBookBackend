import pg from 'pg';

const { Client } = pg;

const client = new Client({
  user: 'postgres',
  password: 'Parthik@2026',
  host: '127.0.0.1',
  port: 5432,
});

async function setupDatabases() {
  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL');

    // Create databases
    const databases = ['scorebook_dev', 'scorebook_test', 'scorebook_prod'];

    for (const db of databases) {
      try {
        await client.query(`CREATE DATABASE ${db};`);
        console.log(`✓ Created database: ${db}`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`✓ Database already exists: ${db}`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n✓ Database setup complete!');
    await client.end();
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('\nMake sure:');
    console.error('1. PostgreSQL is running');
    console.error('2. Default postgres user password is "postgres"');
    console.error('3. PostgreSQL is accessible at 127.0.0.1:5432');
    process.exit(1);
  }
}

setupDatabases();
