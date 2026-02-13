import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('scorebook', 'postgres', 'Parthik@2026', {
  host: '127.0.0.1',
  port: 5432,
  dialect: 'postgres',
  logging: false
});

async function releaseLock() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');
    
    // List all tables
    const tables = await sequelize.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
      { type: 'SELECT' }
    );
    
    console.log('📋 Available tables:');
    tables.forEach(t => console.log('-', t.table_name));
    
    const matchId = '59b0004f-ed60-47f1-b643-bfaefb6d0e3f';
    
    // Try different table names
    let lockTable = '';
    for (const name of ['MatchLocks', 'matchlocks', 'match_locks', 'Locks', 'locks']) {
      try {
        const result = await sequelize.query(
          `SELECT * FROM "${name}" WHERE "matchId" = :matchId LIMIT 1`,
          {
            replacements: { matchId },
            type: 'SELECT'
          }
        );
        if (result.length > 0) {
          lockTable = name;
          console.log('\n🔒 Found lock in table:', name);
          console.log('Lock details:', result[0]);
          break;
        }
      } catch (e) {
        // Try next table
      }
    }
    
    if (!lockTable) {
      console.log('\n❌ No lock found for this match');
      process.exit(0);
    }
    
    // Delete the lock
    await sequelize.query(
      `DELETE FROM "${lockTable}" WHERE "matchId" = :matchId`,
      {
        replacements: { matchId }
      }
    );
    
    console.log('\n✅ Lock released successfully');
    console.log('You can now start the match again');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

releaseLock();
