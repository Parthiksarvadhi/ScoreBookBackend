/**
 * Comprehensive Cricket Rules Tests
 * Tests all cricket scenarios without database
 */

import { applyBall, calculateMatchState, calculateInningsStats, isLegal } from './dist/src/utils/cricketRulesEngine.js';

console.log('🧪 COMPREHENSIVE CRICKET RULES TESTS\n');

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

// SCENARIO 1: Simple over with no wickets
console.log('SCENARIO 1: Simple Over (6 legal balls, no wickets)');
const scenario1Balls = [
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 1, extraRuns: 0, extras: 'none', isWicket: false }, // 1 run - strike changes
  { batsmanId: 'b2', bowlerId: 'bowl1', runs: 0, extraRuns: 0, extras: 'none', isWicket: false }, // 0 runs - strike stays
  { batsmanId: 'b2', bowlerId: 'bowl1', runs: 2, extraRuns: 0, extras: 'none', isWicket: false }, // 2 runs - strike stays
  { batsmanId: 'b2', bowlerId: 'bowl1', runs: 1, extraRuns: 0, extras: 'none', isWicket: false }, // 1 run - strike changes
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 0, extraRuns: 0, extras: 'none', isWicket: false }, // 0 runs - strike stays
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 0, extraRuns: 0, extras: 'none', isWicket: false }, // 0 runs - strike stays, over ends
];

const init1 = { striker: 'b1', nonStriker: 'b2', bowler: 'bowl1', over: 1, ballInOver: 1, legalBallsInOver: 0 };
const final1 = calculateMatchState(scenario1Balls, init1, () => null);
const stats1 = calculateInningsStats(scenario1Balls);

assert(final1.over === 2, 'Over incremented to 2');
assert(final1.striker === 'b2', 'Striker is b2 after over completion');
assert(final1.nonStriker === 'b1', 'NonStriker is b1 after over completion');
assert(stats1.runs === 4, 'Total runs = 4');
assert(stats1.legalBalls === 6, 'Legal balls = 6');
assert(stats1.oversString === '1.0', 'Overs = 1.0');
console.log('');

// SCENARIO 2: Over with wides and no-balls
console.log('SCENARIO 2: Over with Wides and No-balls');
const scenario2Balls = [
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 0, extraRuns: 1, extras: 'wide', isWicket: false },  // wide - no strike change
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 1, extraRuns: 0, extras: 'none', isWicket: false },  // 1 run - strike changes
  { batsmanId: 'b2', bowlerId: 'bowl1', runs: 0, extraRuns: 1, extras: 'no-ball', isWicket: false }, // no-ball - no strike change
  { batsmanId: 'b2', bowlerId: 'bowl1', runs: 2, extraRuns: 0, extras: 'none', isWicket: false },  // 2 runs - strike stays
  { batsmanId: 'b2', bowlerId: 'bowl1', runs: 1, extraRuns: 0, extras: 'none', isWicket: false },  // 1 run - strike changes
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 0, extraRuns: 0, extras: 'none', isWicket: false },  // 0 runs - strike stays
];

const init2 = { striker: 'b1', nonStriker: 'b2', bowler: 'bowl1', over: 1, ballInOver: 1, legalBallsInOver: 0 };
const final2 = calculateMatchState(scenario2Balls, init2, () => null);
const stats2 = calculateInningsStats(scenario2Balls);

assert(final2.over === 1, 'Over stays 1 (only 4 legal balls, not 6)');
assert(stats2.runs === 6, 'Total runs = 6 (1 + 2 + 1 + 1 wide + 1 no-ball)');
assert(stats2.legalBalls === 4, 'Legal balls = 4 (wide and no-ball not counted)');
assert(stats2.oversString === '0.4', 'Overs = 0.4');
console.log('');

// SCENARIO 3: Wicket handling
console.log('SCENARIO 3: Wicket Handling');
const scenario3Balls = [
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 1, extraRuns: 0, extras: 'none', isWicket: false },  // 1 run - strike changes
  { batsmanId: 'b2', bowlerId: 'bowl1', runs: 0, extraRuns: 0, extras: 'none', isWicket: true, wicketType: 'bowled' }, // wicket
];

const init3 = { striker: 'b1', nonStriker: 'b2', bowler: 'bowl1', over: 1, ballInOver: 1, legalBallsInOver: 0 };
const final3 = calculateMatchState(scenario3Balls, init3, () => 'b3');
const stats3 = calculateInningsStats(scenario3Balls);

assert(final3.striker === 'b3', 'Striker replaced with b3 after wicket');
assert(final3.nonStriker === 'b1', 'NonStriker is b1 (was striker before wicket)');
assert(stats3.wickets === 1, 'Wickets = 1');
console.log('');

// SCENARIO 4: Run-out with odd runs (batsmen crossed)
console.log('SCENARIO 4: Run-out with Odd Runs (Batsmen Crossed)');
const scenario4Balls = [
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 1, extraRuns: 0, extras: 'none', isWicket: true, wicketType: 'run-out' }, // 1 run, run-out
];

const init4 = { striker: 'b1', nonStriker: 'b2', bowler: 'bowl1', over: 1, ballInOver: 1, legalBallsInOver: 0 };
const final4 = calculateMatchState(scenario4Balls, init4, () => 'b3');

assert(final4.striker === 'b2', 'NonStriker (b2) becomes striker (batsmen crossed)');
assert(final4.nonStriker === 'b3', 'New batsman (b3) becomes non-striker');
console.log('');

// SCENARIO 5: Run-out with even runs (batsmen not crossed)
console.log('SCENARIO 5: Run-out with Even Runs (Batsmen Not Crossed)');
const scenario5Balls = [
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 2, extraRuns: 0, extras: 'none', isWicket: true, wicketType: 'run-out' }, // 2 runs, run-out
];

const init5 = { striker: 'b1', nonStriker: 'b2', bowler: 'bowl1', over: 1, ballInOver: 1, legalBallsInOver: 0 };
const final5 = calculateMatchState(scenario5Balls, init5, () => 'b3');

assert(final5.striker === 'b3', 'New batsman (b3) becomes striker (batsmen not crossed)');
assert(final5.nonStriker === 'b2', 'NonStriker stays b2');
console.log('');

// SCENARIO 6: Byes and leg-byes (legal, count for strike)
console.log('SCENARIO 6: Byes and Leg-byes');
const scenario6Balls = [
  { batsmanId: 'b1', bowlerId: 'bowl1', runs: 0, extraRuns: 1, extras: 'bye', isWicket: false },      // 1 bye - strike changes
  { batsmanId: 'b2', bowlerId: 'bowl1', runs: 0, extraRuns: 2, extras: 'leg-bye', isWicket: false },  // 2 leg-byes - strike stays
];

const init6 = { striker: 'b1', nonStriker: 'b2', bowler: 'bowl1', over: 1, ballInOver: 1, legalBallsInOver: 0 };
const final6 = calculateMatchState(scenario6Balls, init6, () => null);
const stats6 = calculateInningsStats(scenario6Balls);

assert(final6.striker === 'b2', 'Striker changed after 1 bye (odd)');
assert(stats6.runs === 3, 'Total runs = 3 (1 bye + 2 leg-byes)');
assert(stats6.legalBalls === 2, 'Legal balls = 2 (byes and leg-byes are legal)');
console.log('');

// SCENARIO 7: Multiple overs
console.log('SCENARIO 7: Multiple Overs');
const scenario7Balls = [];
// Over 1: 6 balls
for (let i = 0; i < 6; i++) {
  scenario7Balls.push({
    batsmanId: i % 2 === 0 ? 'b1' : 'b2',
    bowlerId: 'bowl1',
    runs: i % 2,
    extraRuns: 0,
    extras: 'none',
    isWicket: false,
  });
}
// Over 2: 3 balls
for (let i = 0; i < 3; i++) {
  scenario7Balls.push({
    batsmanId: i % 2 === 0 ? 'b2' : 'b1',
    bowlerId: 'bowl2',
    runs: 1,
    extraRuns: 0,
    extras: 'none',
    isWicket: false,
  });
}

const init7 = { striker: 'b1', nonStriker: 'b2', bowler: 'bowl1', over: 1, ballInOver: 1, legalBallsInOver: 0 };
const final7 = calculateMatchState(scenario7Balls, init7, () => null);
const stats7 = calculateInningsStats(scenario7Balls);

assert(final7.over === 2, 'Over = 2');
assert(final7.bowler === 'bowl2', 'Bowler changed to bowl2');
assert(stats7.legalBalls === 9, 'Legal balls = 9');
assert(stats7.oversString === '1.3', 'Overs = 1.3');
console.log('');

// SUMMARY
console.log('\n' + '='.repeat(50));
console.log(`TESTS PASSED: ${testsPassed}`);
console.log(`TESTS FAILED: ${testsFailed}`);
console.log('='.repeat(50));

if (testsFailed === 0) {
  console.log('✅ ALL TESTS PASSED!');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED');
  process.exit(1);
}
