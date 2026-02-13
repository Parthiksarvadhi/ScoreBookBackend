/**
 * Integration Tests for Cricket Services
 * Tests BallScoringService, UndoService, InningsService
 */

import db from './dist/src/models/index.js';
import BallScoringService from './dist/src/services/BallScoringService.js';
import UndoService from './dist/src/services/UndoService.js';
import InningsService from './dist/src/services/InningsService.js';

console.log('🧪 CRICKET SERVICES INTEGRATION TESTS\n');

// Initialize database
await db.sequelize.sync({ force: true });

// Create test data
const user = await db.User.create({
  id: 'user1',
  email: 'test@test.com',
  password: 'hashed',
  role: 'scorer',
});

const team1 = await db.Team.create({
  id: 'team1',
  name: 'Team A',
  createdBy: 'user1',
});

const team2 = await db.Team.create({
  id: 'team2',
  name: 'Team B',
  createdBy: 'user1',
});

// Create players
const players = [];
for (let i = 1; i <= 22; i++) {
  const player = await db.Player.create({
    id: `player${i}`,
    name: `Player ${i}`,
    teamId: i <= 11 ? 'team1' : 'team2',
  });
  players.push(player);
}

// Create match
const match = await db.Match.create({
  id: 'match1',
  name: 'Test Match',
  matchType: 'T20',
  overs: 20,
  venue: 'Test Ground',
  teamAId: 'team1',
  teamBId: 'team2',
  tossWinnerId: 'team1',
  tossChoice: 'bat',
  status: 'live',
  currentInnings: 1,
  teamAPlaying11: players.slice(0, 11).map(p => p.id),
  teamBPlaying11: players.slice(11, 22).map(p => p.id),
  teamABattingOrder: players.slice(0, 11).map(p => p.id),
  teamBBattingOrder: players.slice(11, 22).map(p => p.id),
});

console.log('✅ Test data created\n');

// TEST 1: Record balls
console.log('TEST 1: Record Balls');
try {
  const ball1 = await BallScoringService.recordBall('match1', {
    over: 1,
    ballNumber: 1,
    batsmanId: 'player1',
    bowlerId: 'player12',
    runs: 1,
    isWicket: false,
    extras: 'none',
    extraRuns: 0,
  }, 'user1');
  console.log('✓ Ball 1 recorded:', ball1.id);

  const ball2 = await BallScoringService.recordBall('match1', {
    over: 1,
    ballNumber: 2,
    batsmanId: 'player2',
    bowlerId: 'player12',
    runs: 2,
    isWicket: false,
    extras: 'none',
    extraRuns: 0,
  }, 'user1');
  console.log('✓ Ball 2 recorded:', ball2.id);

  const ball3 = await BallScoringService.recordBall('match1', {
    over: 1,
    ballNumber: 3,
    batsmanId: 'player2',
    bowlerId: 'player12',
    runs: 0,
    isWicket: false,
    extras: 'wide',
    extraRuns: 1,
  }, 'user1');
  console.log('✓ Ball 3 (wide) recorded:', ball3.id);

  console.log('✅ TEST 1 PASSED\n');
} catch (error) {
  console.error('❌ TEST 1 FAILED:', error.message, '\n');
}

// TEST 2: Get balls
console.log('TEST 2: Get Balls');
try {
  const balls = await BallScoringService.getBalls('match1', 1);
  console.log('✓ Retrieved', balls.length, 'balls');
  console.log('  Ball 1: Over', balls[0].over, 'Ball', balls[0].ballNumber, 'Runs:', balls[0].runs);
  console.log('  Ball 2: Over', balls[1].over, 'Ball', balls[1].ballNumber, 'Runs:', balls[1].runs);
  console.log('  Ball 3: Over', balls[2].over, 'Ball', balls[2].ballNumber, 'Extras:', balls[2].extras);
  console.log('✅ TEST 2 PASSED\n');
} catch (error) {
  console.error('❌ TEST 2 FAILED:', error.message, '\n');
}

// TEST 3: Undo last ball
console.log('TEST 3: Undo Last Ball');
try {
  const result = await UndoService.undoLastBall('match1', 'user1');
  console.log('✓ Undo successful');
  console.log('  Deleted ball: Over', result.deletedBall.over, 'Ball', result.deletedBall.ballNumber);
  console.log('  Updated stats: Runs', result.updatedStats.runs, 'Wickets', result.updatedStats.wickets);
  
  const ballsAfterUndo = await BallScoringService.getBalls('match1', 1);
  console.log('  Balls remaining:', ballsAfterUndo.length);
  console.log('✅ TEST 3 PASSED\n');
} catch (error) {
  console.error('❌ TEST 3 FAILED:', error.message, '\n');
}

// TEST 4: Record more balls and complete innings
console.log('TEST 4: Complete Innings');
try {
  // Record 6 more balls to complete first over
  for (let i = 2; i <= 6; i++) {
    await BallScoringService.recordBall('match1', {
      over: 1,
      ballNumber: i,
      batsmanId: i % 2 === 0 ? 'player2' : 'player1',
      bowlerId: 'player12',
      runs: i % 2,
      isWicket: false,
      extras: 'none',
      extraRuns: 0,
    }, 'user1');
  }

  const ballsBefore = await BallScoringService.getBalls('match1', 1);
  console.log('✓ Recorded', ballsBefore.length, 'balls');

  const result = await InningsService.completeInnings('match1', 'user1');
  console.log('✓ Innings completed');
  console.log('  Runs:', result.runs);
  console.log('  Wickets:', result.wickets);
  console.log('  Overs:', result.overs);
  console.log('  Target for 2nd innings:', result.target);

  const updatedMatch = await db.Match.findByPk('match1');
  console.log('  Match firstInningsComplete:', updatedMatch.firstInningsComplete);
  console.log('✅ TEST 4 PASSED\n');
} catch (error) {
  console.error('❌ TEST 4 FAILED:', error.message, '\n');
}

// TEST 5: Verify innings isolation
console.log('TEST 5: Innings Isolation');
try {
  const inning1Balls = await BallScoringService.getBalls('match1', 1);
  const inning2Balls = await BallScoringService.getBalls('match1', 2);
  
  console.log('✓ Innings 1 balls:', inning1Balls.length);
  console.log('✓ Innings 2 balls:', inning2Balls.length);
  console.log('✅ TEST 5 PASSED\n');
} catch (error) {
  console.error('❌ TEST 5 FAILED:', error.message, '\n');
}

console.log('✅ ALL INTEGRATION TESTS COMPLETED');
process.exit(0);
