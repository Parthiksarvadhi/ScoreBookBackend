import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('scorebook', 'postgres', 'Parthik@2026', {
  host: '127.0.0.1',
  port: 5432,
  dialect: 'postgres',
  logging: false
});

async function clearStaleLock() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');
    
    const matchId = '59b0004f-ed60-47f1-b643-bfaefb6d0e3f';
    
    // Find all tables
    const tables = await sequelize.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
      { type: 'SELECT' }
    );
    
    console.log('📋 Available tables:');
    tables.forEach(t => console.log('  -', t.table_name));
    
    // Try different table names
    let tableName = '';
    for (const name of ['Matches', 'matches', 'Match', 'match']) {
      try {
        const result = await sequelize.query(
          `SELECT id, status, "scorerId", "lockedAt" FROM "${name}" WHERE id = :matchId LIMIT 1`,
          {
            replacements: { matchId },
            type: 'SELECT'
          }
        );
        if (result.length > 0) {
          tableName = name;
          console.log('\n✅ Found Matches table:', name);
          break;
        }
      } catch (e) {
        // Try next
      }
    }
    
    if (!tableName) {
      console.log('\n❌ Could not find Matches table');
      process.exit(1);
    }
    
    // Find the match with the lock
    const match = await sequelize.query(
      `SELECT id, status, "scorerId", "lockedAt" FROM "${tableName}" WHERE id = :matchId`,
      {
        replacements: { matchId },
        type: 'SELECT'
      }
    );
    
    if (match.length === 0) {
      console.log('❌ Match not found');
      process.exit(1);
    }
    
    const m = match[0];
    console.log('\n📋 Current match state:');
    console.log('  ID:', m.id);
    console.log('  Status:', m.status);
    console.log('  Scorer ID:', m.scorerId);
    console.log('  Locked At:', m.lockedAt);
    
    if (!m.scorerId) {
      console.log('\n✅ No lock found - match is already unlocked');
      process.exit(0);
    }
    
    // Clear the lock
    console.log('\n🔓 Clearing stale lock...');
    await sequelize.query(
      `UPDATE "${tableName}" SET "scorerId" = NULL, "lockedAt" = NULL WHERE id = :matchId`,
      {
        replacements: { matchId }
      }
    );
    
    // Verify
    const updated = await sequelize.query(
      `SELECT id, status, "scorerId", "lockedAt" FROM "${tableName}" WHERE id = :matchId`,
      {
        replacements: { matchId },
        type: 'SELECT'
      }
    );
    
    const u = updated[0];
    console.log('\n✅ Lock cleared successfully!');
    console.log('  Status:', u.status);
    console.log('  Scorer ID:', u.scorerId);
    console.log('  Locked At:', u.lockedAt);
    console.log('\n✅ You can now start the match again');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearStaleLock();
