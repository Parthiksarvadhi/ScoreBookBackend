/**
 * Test Cricket Rules Engine
 * Comprehensive test scenarios
 */

import { applyBall, calculateMatchState, calculateInningsStats, isLegal } from './dist/src/utils/cricketRulesEngine.js';

console.log('🧪 CRICKET RULES ENGINE TESTS\n');

// Test 1: Legal vs Illegal balls
console.log('TEST 1: Legal vs Illegal Ball Detection');
console.log('✓ isLegal("none"):', isLegal('none')); // true
console.log('✓ isLegal("bye"):', isLegal('bye')); // true
console.log('✓ isLegal("leg-bye"):', isLegal('leg-bye')); // true
console.log('✓ isLegal("wide"):', isLegal('wide')); // false
console.log('✓ isLegal("no-ball"):', isLegal('no-ball')); // false
console.log('');

// Test 2: Strike rotation - odd runs
console.log('TEST 2: Strike Rotation - Odd Runs');
const state1 = {
  striker: 'batsman1',
  nonStriker: 'batsman2',
  bowler: 'bowler1',
  over: 1,
  ballInOver: 1,
  legalBallsInOver: 0,
};

const ball1 = {
  batsmanId: 'batsman1',
  bowlerId: 'bowler1',
  runs: 1,
  extraRuns: 0,
  extras: 'none',
  isWicket: false,
};

const newState1 = applyBall(state1, ball1, () => null);
console.log('After 1 run (odd):');
console.log('  Striker:', newState1.striker, '(should be batsman2)');
console.log('  NonStriker:', newState1.nonStriker, '(should be batsman1)');
console.log('  Over:', newState1.over, 'Ball:', newState1.ballInOver);
console.log('');

// Test 3: Strike stays - even runs
console.log('TEST 3: Strike Stays - Even Runs');
const state2 = {
  striker: 'batsman1',
  nonStriker: 'batsman2',
  bowler: 'bowler1',
  over: 1,
  ballInOver: 1,
  legalBallsInOver: 0,
};

const ball2 = {
  batsmanId: 'batsman1',
  bowlerId: 'bowler1',
  runs: 2,
  extraRuns: 0,
  extras: 'none',
  isWicket: false,
};

const newState2 = applyBall(state2, ball2, () => null);
console.log('After 2 runs (even):');
console.log('  Striker:', newState2.striker, '(should be batsman1)');
console.log('  NonStriker:', newState2.nonStriker, '(should be batsman2)');
console.log('');

// Test 4: Illegal ball - no strike change
console.log('TEST 4: Illegal Ball - No Strike Change');
const state3 = {
  striker: 'batsman1',
  nonStriker: 'batsman2',
  bowler: 'bowler1',
  over: 1,
  ballInOver: 1,
  legalBallsInOver: 0,
};

const ball3 = {
  batsmanId: 'batsman1',
  bowlerId: 'bowler1',
  runs: 0,
  extraRuns: 1,
  extras: 'wide',
  isWicket: false,
};

const newState3 = applyBall(state3, ball3, () => null);
console.log('After wide (1 extra run):');
console.log('  Striker:', newState3.striker, '(should be batsman1 - no change)');
console.log('  NonStriker:', newState3.nonStriker, '(should be batsman2)');
console.log('  legalBallsInOver:', newState3.legalBallsInOver, '(should be 0)');
console.log('');

// Test 5: Over completion - 6 legal balls
console.log('TEST 5: Over Completion - 6 Legal Balls');
let state5 = {
  striker: 'batsman1',
  nonStriker: 'batsman2',
  bowler: 'bowler1',
  over: 1,
  ballInOver: 1,
  legalBallsInOver: 5,
};

const ball5 = {
  batsmanId: 'batsman1',
  bowlerId: 'bowler1',
  runs: 0,
  extraRuns: 0,
  extras: 'none',
  isWicket: false,
};

state5 = applyBall(state5, ball5, () => null);
console.log('After 6th legal ball:');
console.log('  Over:', state5.over, '(should be 2)');
console.log('  legalBallsInOver:', state5.legalBallsInOver, '(should be 0)');
console.log('  Striker:', state5.striker, '(should be batsman2 - swapped)');
console.log('  NonStriker:', state5.nonStriker, '(should be batsman1)');
console.log('');

// Test 6: Wicket - striker replaced
console.log('TEST 6: Wicket - Striker Replaced');
const state6 = {
  striker: 'batsman1',
  nonStriker: 'batsman2',
  bowler: 'bowler1',
  over: 1,
  ballInOver: 1,
  legalBallsInOver: 0,
};

const ball6 = {
  batsmanId: 'batsman1',
  bowlerId: 'bowler1',
  runs: 0,
  extraRuns: 0,
  extras: 'none',
  isWicket: true,
  wicketType: 'bowled',
};

const newState6 = applyBall(state6, ball6, () => 'batsman3');
console.log('After wicket (bowled):');
console.log('  Striker:', newState6.striker, '(should be batsman3 - next batsman)');
console.log('  NonStriker:', newState6.nonStriker, '(should be batsman2 - stays same)');
console.log('');

// Test 7: Full innings replay
console.log('TEST 7: Full Innings Replay - 3 Balls');
const balls7 = [
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 1, extraRuns: 0, extras: 'none', isWicket: false },
  { batsmanId: 'b2', bowlerId: 'bowl1', runs: 2, extraRuns: 0, extras: 'none', isWicket: false },
  { batsmanId: 'b2', bowlerId: 'bowl1', runs: 0, extraRuns: 0, extras: 'none', isWicket: false },
];

const initialState7 = {
  striker: 'b1',
  nonStriker: 'b2',
  bowler: 'bowl1',
  over: 1,
  ballInOver: 1,
  legalBallsInOver: 0,
};

const finalState7 = calculateMatchState(balls7, initialState7, () => null);
console.log('After 3 balls (1 run, 2 runs, 0 runs):');
console.log('  Striker:', finalState7.striker, '(should be b2)');
console.log('  NonStriker:', finalState7.nonStriker, '(should be b1)');
console.log('  Over:', finalState7.over, 'Ball:', finalState7.ballInOver);
console.log('  legalBallsInOver:', finalState7.legalBallsInOver);
console.log('');

// Test 8: Innings stats calculation
console.log('TEST 8: Innings Stats Calculation');
const balls8 = [
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 4, extraRuns: 0, extras: 'none', isWicket: false },
  { batsmanId: 'b2', bowlerId: 'bowl1', runs: 1, extraRuns: 0, extras: 'none', isWicket: false },
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 0, extraRuns: 1, extras: 'wide', isWicket: false },
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 2, extraRuns: 0, extras: 'none', isWicket: false },
];

const stats8 = calculateInningsStats(balls8);
console.log('Stats from 4 balls (4, 1, wide+1, 2):');
console.log('  Runs:', stats8.runs, '(should be 8)');
console.log('  Wickets:', stats8.wickets, '(should be 0)');
console.log('  Legal balls:', stats8.legalBalls, '(should be 3)');
console.log('  Overs:', stats8.oversString, '(should be 0.3)');
console.log('');

console.log('✅ ALL TESTS COMPLETED');
