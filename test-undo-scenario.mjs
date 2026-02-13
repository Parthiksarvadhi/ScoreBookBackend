/**
 * Test: Undo Scenario - Verify Striker/Non-Striker Recalculation
 * 
 * Scenario:
 * 1. Record 3 balls with specific runs
 * 2. Verify striker/non-striker after 3 balls
 * 3. Simulate undo (remove last ball)
 * 4. Verify striker/non-striker recalculated correctly
 */

import { applyBall, calculateMatchState, calculateInningsStats, isLegal } from './dist/src/utils/cricketRulesEngine.js';

console.log('🧪 UNDO SCENARIO TEST\n');

// Initial state
const initialState = {
  striker: 'b1',
  nonStriker: 'b2',
  bowler: 'bowl1',
  over: 1,
  ballInOver: 1,
  legalBallsInOver: 0,
};

// Scenario: 3 balls recorded
const balls = [
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 1, extraRuns: 0, extras: 'none', isWicket: false }, // Ball 1: 1 run - strike changes
  { batsmanId: 'b2', bowlerId: 'bowl1', runs: 2, extraRuns: 0, extras: 'none', isWicket: false }, // Ball 2: 2 runs - strike stays
  { batsmanId: 'b2', bowlerId: 'bowl1', runs: 1, extraRuns: 0, extras: 'none', isWicket: false }, // Ball 3: 1 run - strike changes
];

console.log('📝 RECORDED BALLS:');
balls.forEach((b, i) => {
  console.log(`  Ball ${i + 1}: ${b.runs} runs (${b.extras}) - Batsman: ${b.batsmanId}`);
});

// Calculate state after all 3 balls
const stateAfter3Balls = calculateMatchState(balls, initialState, () => null);
console.log('\n✅ STATE AFTER 3 BALLS:');
console.log(`  Striker: ${stateAfter3Balls.striker}`);
console.log(`  Non-Striker: ${stateAfter3Balls.nonStriker}`);
console.log(`  Over: ${stateAfter3Balls.over}`);
console.log(`  Ball in Over: ${stateAfter3Balls.ballInOver}`);

// Expected: After ball 1 (1 run), strike changes to b2
//           After ball 2 (2 runs), strike stays with b2
//           After ball 3 (1 run), strike changes to b1
// So striker should be b1, non-striker should be b2
const expectedStrikerAfter3 = 'b1';
const expectedNonStrikerAfter3 = 'b2';

console.log('\n🔍 VERIFICATION:');
console.log(`  Expected Striker: ${expectedStrikerAfter3}, Got: ${stateAfter3Balls.striker} ${stateAfter3Balls.striker === expectedStrikerAfter3 ? '✓' : '✗'}`);
console.log(`  Expected Non-Striker: ${expectedNonStrikerAfter3}, Got: ${stateAfter3Balls.nonStriker} ${stateAfter3Balls.nonStriker === expectedNonStrikerAfter3 ? '✓' : '✗'}`);

// NOW SIMULATE UNDO: Remove last ball and recalculate
console.log('\n\n🔄 SIMULATING UNDO (removing last ball)...');
const ballsAfterUndo = balls.slice(0, -1); // Remove last ball

console.log(`\n📝 REMAINING BALLS AFTER UNDO:`);
ballsAfterUndo.forEach((b, i) => {
  console.log(`  Ball ${i + 1}: ${b.runs} runs (${b.extras}) - Batsman: ${b.batsmanId}`);
});

// Recalculate state with remaining balls
const stateAfterUndo = calculateMatchState(ballsAfterUndo, initialState, () => null);
console.log('\n✅ STATE AFTER UNDO:');
console.log(`  Striker: ${stateAfterUndo.striker}`);
console.log(`  Non-Striker: ${stateAfterUndo.nonStriker}`);
console.log(`  Over: ${stateAfterUndo.over}`);
console.log(`  Ball in Over: ${stateAfterUndo.ballInOver}`);

// Expected after undo: After ball 1 (1 run), strike changes to b2
//                      After ball 2 (2 runs), strike stays with b2
// So striker should be b2, non-striker should be b1
const expectedStrikerAfterUndo = 'b2';
const expectedNonStrikerAfterUndo = 'b1';

console.log('\n🔍 VERIFICATION:');
console.log(`  Expected Striker: ${expectedStrikerAfterUndo}, Got: ${stateAfterUndo.striker} ${stateAfterUndo.striker === expectedStrikerAfterUndo ? '✓' : '✗'}`);
console.log(`  Expected Non-Striker: ${expectedNonStrikerAfterUndo}, Got: ${stateAfterUndo.nonStriker} ${stateAfterUndo.nonStriker === expectedNonStrikerAfterUndo ? '✓' : '✗'}`);

// Test result
const test1Pass = stateAfter3Balls.striker === expectedStrikerAfter3 && stateAfter3Balls.nonStriker === expectedNonStrikerAfter3;
const test2Pass = stateAfterUndo.striker === expectedStrikerAfterUndo && stateAfterUndo.nonStriker === expectedNonStrikerAfterUndo;

console.log('\n' + '='.repeat(50));
if (test1Pass && test2Pass) {
  console.log('✅ UNDO SCENARIO TEST PASSED');
  process.exit(0);
} else {
  console.log('❌ UNDO SCENARIO TEST FAILED');
  if (!test1Pass) console.log('  ✗ State after 3 balls incorrect');
  if (!test2Pass) console.log('  ✗ State after undo incorrect');
  process.exit(1);
}
