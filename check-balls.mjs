import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('scorebook', 'postgres', 'Parthik@2026', {
  host: '127.0.0.1',
  port: 5432,
  dialect: 'postgres',
  logging: false
});

async function checkBalls() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');
    
    const matchId = '59b0004f-ed60-47f1-b643-bfaefb6d0e3f';
    
    // Try different table names
    let ballCount = 0;
    let tableName = '';
    
    for (const name of ['balls', 'Balls', 'Ball', 'ball']) {
      try {
        const result = await sequelize.query(
          `SELECT COUNT(*) as ball_count FROM "${name}" WHERE "matchId" = :matchId`,
          {
            replacements: { matchId },
            type: 'SELECT'
          }
        );
        ballCount = parseInt(result[0]?.ball_count || 0);
        tableName = name;
        break;
      } catch (e) {
        // Try next name
      }
    }
    
    console.log('=== MATCH ANALYSIS ===');
    console.log('Match ID:', matchId);
    console.log('Table found:', tableName);
    console.log('Total balls recorded:', ballCount);
    
    console.log('\n=== RESULT ===');
    if (ballCount === 0) {
      console.log('✅ NO BALLS RECORDED');
      console.log('✅ Reset button SHOULD be visible on BallScoringScreen');
    } else {
      console.log('❌ ' + ballCount + ' BALLS ALREADY RECORDED');
      console.log('❌ Reset button will NOT be visible');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkBalls();
