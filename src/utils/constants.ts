// Cricket Constants

export const MATCH_TYPES = {
  T20: 'T20',
  ODI: 'ODI',
  TEST: 'Test',
  CUSTOM: 'Custom',
} as const;

export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  SCORER: 'scorer',
  VIEWER: 'viewer',
} as const;

export const PLAYER_ROLES = {
  BATSMAN: 'batsman',
  BOWLER: 'bowler',
  ALL_ROUNDER: 'all-rounder',
  WICKET_KEEPER: 'wicket-keeper',
} as const;

export const WICKET_TYPES = {
  BOWLED: 'bowled',
  LBW: 'lbw',
  CAUGHT: 'caught',
  STUMPED: 'stumped',
  RUN_OUT: 'run-out',
  HIT_WICKET: 'hit-wicket',
  HANDLED_BALL: 'handled-ball',
  OBSTRUCTING_FIELD: 'obstructing-field',
} as const;

export const EXTRAS = {
  NONE: 'none',
  WIDE: 'wide',
  NO_BALL: 'no-ball',
  BYE: 'bye',
  LEG_BYE: 'leg-bye',
} as const;
