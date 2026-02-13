/**
 * Test: Complex Undo Scenarios
 * Verify striker/non-striker recalculation in various situations
 */

import { calculateMatchState } from './dist/src/utils/cricketRulesEngine.js';

console.log('🧪 COMPLEX UNDO SCENARIOS TEST\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log('  ✓', message);
    testsPassed++;
  } else {
    console.log('  ✗', message);
    testsFailed++;
  }
}

const initialState = {
  striker: 'b1',
  nonStriker: 'b2',
  bowler: 'bowl1',
  over: 1,
  ballInOver: 1,
  legalBallsInOver: 0,
};

// SCENARIO 1: Odd runs - strike should change
console.log('SCENARIO 1: Single Odd Run (1)');
const scenario1Balls = [
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 1, extraRuns: 0, extras: 'none', isWicket: false },
];
const state1 = calculateMatchState(scenario1Balls, initialState, () => null);
assert(state1.striker === 'b2', 'After 1 run, striker should be b2');
assert(state1.nonStriker === 'b1', 'After 1 run, non-striker should be b1');
console.log('');

// SCENARIO 2: Even runs - strike should stay
console.log('SCENARIO 2: Single Even Run (2)');
const scenario2Balls = [
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 2, extraRuns: 0, extras: 'none', isWicket: false },
];
const state2 = calculateMatchState(scenario2Balls, initialState, () => null);
assert(state2.striker === 'b1', 'After 2 runs, striker should stay b1');
assert(state2.nonStriker === 'b2', 'After 2 runs, non-striker should stay b2');
console.log('');

// SCENARIO 3: Odd + Even (should end with strike changed)
console.log('SCENARIO 3: Odd Run (1) then Even Run (2)');
const scenario3Balls = [
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 1, extraRuns: 0, extras: 'none', isWicket: false },
  { batsmanId: 'b2', bowlerId: 'bowl1', runs: 2, extraRuns: 0, extras: 'none', isWicket: false },
];
const state3 = calculateMatchState(scenario3Balls, initialState, () => null);
assert(state3.striker === 'b2', 'After 1+2 runs, striker should be b2');
assert(state3.nonStriker === 'b1', 'After 1+2 runs, non-striker should be b1');
console.log('');

// SCENARIO 4: Undo from scenario 3 (remove 2-run ball)
console.log('SCENARIO 4: Undo from Scenario 3 (remove 2-run ball)');
const scenario4Balls = scenario3Balls.slice(0, -1);
const state4 = calculateMatchState(scenario4Balls, initialState, () => null);
assert(state4.striker === 'b2', 'After undo, striker should be b2 (after 1 run)');
assert(state4.nonStriker === 'b1', 'After undo, non-striker should be b1 (after 1 run)');
console.log('');

// SCENARIO 5: Multiple odd runs (1+1+1 = 3 total, odd)
console.log('SCENARIO 5: Three Odd Runs (1+1+1)');
const scenario5Balls = [
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 1, extraRuns: 0, extras: 'none', isWicket: false },
  { batsmanId: 'b2', bowlerId: 'bowl1', runs: 1, extraRuns: 0, extras: 'none', isWicket: false },
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 1, extraRuns: 0, extras: 'none', isWicket: false },
];
const state5 = calculateMatchState(scenario5Balls, initialState, () => null);
assert(state5.striker === 'b2', 'After 1+1+1 runs, striker should be b2');
assert(state5.nonStriker === 'b1', 'After 1+1+1 runs, non-striker should be b1');
console.log('');

// SCENARIO 6: Undo from scenario 5 (remove last 1-run ball)
console.log('SCENARIO 6: Undo from Scenario 5 (remove last 1-run ball)');
const scenario6Balls = scenario5Balls.slice(0, -1);
const state6 = calculateMatchState(scenario6Balls, initialState, () => null);
assert(state6.striker === 'b1', 'After undo, striker should be b1 (after 1+1 runs)');
assert(state6.nonStriker === 'b2', 'After undo, non-striker should be b2 (after 1+1 runs)');
console.log('');

// SCENARIO 7: Wide (illegal) - should not affect strike
console.log('SCENARIO 7: Wide (Illegal Ball)');
const scenario7Balls = [
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 0, extraRuns: 1, extras: 'wide', isWicket: false },
];
const state7 = calculateMatchState(scenario7Balls, initialState, () => null);
assert(state7.striker === 'b1', 'After wide, striker should stay b1');
assert(state7.nonStriker === 'b2', 'After wide, non-striker should stay b2');
console.log('');

// SCENARIO 8: Wide + 1 run (wide is illegal, so strike doesn't change)
console.log('SCENARIO 8: Wide (1 extra) + 1 Run');
const scenario8Balls = [
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 1, extraRuns: 1, extras: 'wide', isWicket: false },
];
const state8 = calculateMatchState(scenario8Balls, initialState, () => null);
assert(state8.striker === 'b1', 'After wide (illegal), striker should stay b1');
assert(state8.nonStriker === 'b2', 'After wide (illegal), non-striker should stay b2');
console.log('');

// SCENARIO 9: Undo from scenario 8
console.log('SCENARIO 9: Undo from Scenario 8');
const scenario9Balls = [];
const state9 = calculateMatchState(scenario9Balls, initialState, () => null);
assert(state9.striker === 'b1', 'After undo to start, striker should be b1');
assert(state9.nonStriker === 'b2', 'After undo to start, non-striker should be b2');
console.log('');

// SCENARIO 10: Complete over (6 legal balls with even total runs)
console.log('SCENARIO 10: Complete Over (6 balls, even total runs)');
const scenario10Balls = [
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 0, extraRuns: 0, extras: 'none', isWicket: false },
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 2, extraRuns: 0, extras: 'none', isWicket: false },
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 0, extraRuns: 0, extras: 'none', isWicket: false },
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 2, extraRuns: 0, extras: 'none', isWicket: false },
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 0, extraRuns: 0, extras: 'none', isWicket: false },
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 0, extraRuns: 0, extras: 'none', isWicket: false },
];
const state10 = calculateMatchState(scenario10Balls, initialState, () => null);
assert(state10.striker === 'b2', 'After complete over with even runs, striker should swap to b2');
assert(state10.nonStriker === 'b1', 'After complete over with even runs, non-striker should be b1');
assert(state10.over === 2, 'Over should be 2');
console.log('');

// SCENARIO 11: Undo from scenario 10 (remove last ball of over)
console.log('SCENARIO 11: Undo from Scenario 10 (remove last ball)');
const scenario11Balls = scenario10Balls.slice(0, -1);
const state11 = calculateMatchState(scenario11Balls, initialState, () => null);
assert(state11.striker === 'b1', 'After undo, striker should be b1 (5 balls in over)');
assert(state11.nonStriker === 'b2', 'After undo, non-striker should be b2 (5 balls in over)');
assert(state11.over === 1, 'Over should still be 1');
console.log('');

console.log('\n' + '='.repeat(50));
console.log(`TESTS PASSED: ${testsPassed}`);
console.log(`TESTS FAILED: ${testsFailed}`);
console.log('='.repeat(50));

if (testsFailed === 0) {
  console.log('✅ ALL COMPLEX UNDO TESTS PASSED!');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED');
  process.exit(1);
}
