/**
 * Cricket Rules Engine - Single Source of Truth
 * Deterministic state replay from ball records
 * No UI-side mutations, no guessing
 */

export type ExtraType = 'none' | 'wide' | 'no-ball' | 'bye' | 'leg-bye';
export type WicketType = 'bowled' | 'lbw' | 'caught' | 'stumped' | 'run-out' | 'hit-wicket';

export interface BallRecord {
  batsmanId: string;
  nonStrikerId?: string; // Optional for backward compatibility, but strictly used in engine now
  bowlerId: string;
  runs: number;
  extraRuns: number;
  extras: ExtraType;
  isWicket: boolean;
  wicketType?: WicketType;
}

export interface MatchState {
  striker: string;
  nonStriker: string;
  bowler: string;
  over: number;
  ballInOver: number; // 1-6 (legal balls only)
  legalBallsInOver: number;
}

/**
 * Is this a legal delivery?
 * Legal: none, bye, leg-bye
 * Illegal: wide, no-ball
 */
export function isLegal(extras: ExtraType): boolean {
  return extras === 'none' || extras === 'bye' || extras === 'leg-bye';
}

/**
 * Get total runs from a ball (runs + extra runs)
 */
function getTotalRuns(ball: BallRecord): number {
  return ball.runs + ball.extraRuns;
}

/**
 * Apply a single ball to match state
 * Pure function - no side effects
 */
/**
 * Apply a single ball to match state
 * Pure function - no side effects
 */
export function applyBall(
  state: MatchState,
  ball: BallRecord,
  getNextBatsman: (excludeIds: string[]) => string | null
): MatchState {
  let { striker, nonStriker, bowler, over, legalBallsInOver } = state;
  const legal = isLegal(ball.extras);
  const totalRuns = getTotalRuns(ball);

  // FORCE SYNC: The BallRecord is the source of truth for who faced the ball.
  // If the recorded batsman/non-striker differs from calculated state (manual override),
  // we update the state to match history before applying rules.
  if (ball.batsmanId && ball.batsmanId !== striker) {
    if (ball.batsmanId === nonStriker) {
      // Swapped ends manually
      [striker, nonStriker] = [nonStriker, striker];
    } else {
      // Completely new batsman manually substituted
      striker = ball.batsmanId;
    }
  }

  if (ball.nonStrikerId && ball.nonStrikerId !== nonStriker) {
    if (ball.nonStrikerId === striker) {
      // Swapped ends manually (would be handled above, but for safety)
      [striker, nonStriker] = [nonStriker, striker];
    } else {
      // New non-striker
      nonStriker = ball.nonStrikerId;
    }
  }

  // Bowler always from current ball
  bowler = ball.bowlerId;

  // WICKET: Replace striker with next batsman
  if (ball.isWicket) {
    // Exclude current non-striker from being picked as next batsman
    const nextBatsman = getNextBatsman([nonStriker]);
    if (nextBatsman) {
      if (ball.wicketType === 'run-out' && totalRuns % 2 === 1) {
        // Run-out with odd runs: batsmen crossed, non-striker becomes striker
        [striker, nonStriker] = [nonStriker, nextBatsman];
      } else {
        // All other wickets: striker out, next batsman on strike
        striker = nextBatsman;
      }
    }
  }
  // LEGAL BALL: Apply strike rotation on odd runs
  // ILLEGAL BALL: Apply strike rotation if physical runs (ball.runs) are odd
  // Note: ball.runs excludes extra runs (penalty). It represents runs ran by batsmen.
  else if (ball.runs % 2 === 1) {
    [striker, nonStriker] = [nonStriker, striker];
  }

  // INCREMENT LEGAL BALL COUNT
  if (legal) {
    legalBallsInOver += 1;
  }

  // END OF OVER: After 6 legal balls
  if (legalBallsInOver === 6) {
    over += 1;
    legalBallsInOver = 0;
    // Strike always swaps at end of over
    [striker, nonStriker] = [nonStriker, striker];
  }

  return {
    striker,
    nonStriker,
    bowler,
    over,
    ballInOver: legalBallsInOver + 1,
    legalBallsInOver,
  };
}

/**
 * Replay all balls to compute current match state
 * This is the ONLY way to get authoritative state
 */
export function calculateMatchState(
  balls: BallRecord[],
  initialState: MatchState,
  getNextBatsman: (excludeIds: string[]) => string | null
): MatchState {
  if (balls.length === 0) {
    return initialState;
  }

  return balls.reduce(
    (state, ball) => applyBall(state, ball, getNextBatsman),
    initialState
  );
}

/**
 * Calculate innings stats from balls
 */
export function calculateInningsStats(balls: BallRecord[]) {
  let runs = 0;
  let wickets = 0;
  let legalBalls = 0;

  for (const ball of balls) {
    runs += ball.runs + ball.extraRuns;
    if (ball.isWicket) wickets++;
    if (isLegal(ball.extras)) legalBalls++;
  }

  const overs = Math.floor(legalBalls / 6);
  const ballsInOver = legalBalls % 6;

  return {
    runs,
    wickets,
    overs,
    ballsInOver,
    oversString: `${overs}.${ballsInOver}`,
    legalBalls,
  };
}
