import db from './dist/src/models/index.js';

async function checkMatch() {
  try {
    const matchId = '59b0004f-ed60-47f1-b643-bfaefb6d0e3f';
    
    const match = await db.Match.findByPk(matchId);
    console.log('\n=== MATCH INFO ===');
    console.log('Match ID:', matchId);
    console.log('Status:', match?.status);
    console.log('Match:', match?.toJSON());
    
    const ballCount = await db.Ball.count({
      where: { matchId }
    });
    console.log('\n=== BALLS RECORDED ===');
    console.log('Total balls:', ballCount);
    
    if (ballCount > 0) {
      const balls = await db.Ball.findAll({
        where: { matchId },
        limit: 5
      });
      console.log('First 5 balls:', balls.map(b => b.toJSON()));
    }
    
    console.log('\n=== CONCLUSION ===');
    if (ballCount === 0) {
      console.log('✅ NO BALLS RECORDED - Reset button SHOULD show');
    } else {
      console.log('❌ BALLS RECORDED (' + ballCount + ') - Reset button will NOT show');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkMatch();
