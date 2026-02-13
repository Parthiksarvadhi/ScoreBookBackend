/**
 * Test: User's Exact Scenario
 * 
 * User reported: "when i undo than non striker perfectly change but striker that remain same"
 * 
 * This test verifies that BOTH striker and non-striker are recalculated correctly after undo
 */

import { calculateMatchState } from './dist/src/utils/cricketRulesEngine.js';

console.log('🧪 USER SCENARIO TEST - Undo Recalculation\n');

const initialState = {
  striker: 'Batsman1',
  nonStriker: 'Batsman2',
  bowler: 'Bowler1',
  over: 1,
  ballInOver: 1,
  legalBallsInOver: 0,
};

console.log('📝 INITIAL STATE:');
console.log(`  Striker: ${initialState.striker}`);
console.log(`  Non-Striker: ${initialState.nonStriker}`);
console.log(`  Bowler: ${initialState.bowler}\n`);

// Simulate a match with several balls
const balls = [
  { batsmanId: 'Batsman1', bowlerId: 'Bowler1', runs: 1, extraRuns: 0, extras: 'none', isWicket: false }, // Ball 1: 1 run - strike changes
  { batsmanId: 'Batsman2', bowlerId: 'Bowler1', runs: 0, extraRuns: 0, extras: 'none', isWicket: false }, // Ball 2: 0 runs - strike stays
  { batsmanId: 'Batsman2', bowlerId: 'Bowler1', runs: 2, extraRuns: 0, extras: 'none', isWicket: false }, // Ball 3: 2 runs - strike stays
  { batsmanId: 'Batsman2', bowlerId: 'Bowler1', runs: 1, extraRuns: 0, extras: 'none', isWicket: false }, // Ball 4: 1 run - strike changes
];

console.log('📝 RECORDED BALLS:');
balls.forEach((b, i) => {
  console.log(`  Ball ${i + 1}: ${b.runs} runs - Batsman: ${b.batsmanId}`);
});

// Calculate state after all balls
const stateAfterAllBalls = calculateMatchState(balls, initialState, () => null);
console.log('\n✅ STATE AFTER ALL 4 BALLS:');
console.log(`  Striker: ${stateAfterAllBalls.striker}`);
console.log(`  Non-Striker: ${stateAfterAllBalls.nonStriker}`);
console.log(`  Over: ${stateAfterAllBalls.over}`);
console.log(`  Ball in Over: ${stateAfterAllBalls.ballInOver}`);

// Expected: 
// Ball 1 (1 run): Batsman1 -> Batsman2 (strike changes)
// Ball 2 (0 runs): Batsman2 -> Batsman2 (strike stays)
// Ball 3 (2 runs): Batsman2 -> Batsman2 (strike stays)
// Ball 4 (1 run): Batsman2 -> Batsman1 (strike changes)
// Final: Striker = Batsman1, Non-Striker = Batsman2

console.log('\n🔍 VERIFICATION (After all balls):');
console.log(`  Expected Striker: Batsman1, Got: ${stateAfterAllBalls.striker} ${stateAfterAllBalls.striker === 'Batsman1' ? '✓' : '✗'}`);
console.log(`  Expected Non-Striker: Batsman2, Got: ${stateAfterAllBalls.nonStriker} ${stateAfterAllBalls.nonStriker === 'Batsman2' ? '✓' : '✗'}`);

// NOW SIMULATE UNDO: Remove last ball
console.log('\n\n🔄 SIMULATING UNDO (removing Ball 4)...');
const ballsAfterUndo = balls.slice(0, -1);

console.log(`\n📝 REMAINING BALLS AFTER UNDO:`);
ballsAfterUndo.forEach((b, i) => {
  console.log(`  Ball ${i + 1}: ${b.runs} runs - Batsman: ${b.batsmanId}`);
});

// Recalculate state with remaining balls
const stateAfterUndo = calculateMatchState(ballsAfterUndo, initialState, () => null);
console.log('\n✅ STATE AFTER UNDO:');
console.log(`  Striker: ${stateAfterUndo.striker}`);
console.log(`  Non-Striker: ${stateAfterUndo.nonStriker}`);
console.log(`  Over: ${stateAfterUndo.over}`);
console.log(`  Ball in Over: ${stateAfterUndo.ballInOver}`);

// Expected after undo:
// Ball 1 (1 run): Batsman1 -> Batsman2 (strike changes)
// Ball 2 (0 runs): Batsman2 -> Batsman2 (strike stays)
// Ball 3 (2 runs): Batsman2 -> Batsman2 (strike stays)
// Final: Striker = Batsman2, Non-Striker = Batsman1

console.log('\n🔍 VERIFICATION (After undo):');
console.log(`  Expected Striker: Batsman2, Got: ${stateAfterUndo.striker} ${stateAfterUndo.striker === 'Batsman2' ? '✓' : '✗'}`);
console.log(`  Expected Non-Striker: Batsman1, Got: ${stateAfterUndo.nonStriker} ${stateAfterUndo.nonStriker === 'Batsman1' ? '✓' : '✗'}`);

// Test result
const test1Pass = stateAfterAllBalls.striker === 'Batsman1' && stateAfterAllBalls.nonStriker === 'Batsman2';
const test2Pass = stateAfterUndo.striker === 'Batsman2' && stateAfterUndo.nonStriker === 'Batsman1';

console.log('\n' + '='.repeat(60));
console.log('SUMMARY:');
console.log('='.repeat(60));

if (test1Pass && test2Pass) {
  console.log('✅ USER SCENARIO TEST PASSED');
  console.log('\nBoth striker and non-striker are recalculated correctly after undo!');
  console.log('The fix ensures that:');
  console.log('  1. After recording balls, striker/non-striker are correct');
  console.log('  2. After undo, BOTH are recalculated by replaying remaining balls');
  console.log('  3. No stale data is used - always derived from ball records');
  process.exit(0);
} else {
  console.log('❌ USER SCENARIO TEST FAILED');
  if (!test1Pass) console.log('  ✗ State after all balls incorrect');
  if (!test2Pass) console.log('  ✗ State after undo incorrect');
  process.exit(1);
}
