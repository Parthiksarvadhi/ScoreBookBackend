/**
 * TypeScript type definitions for ScoreBook
 */

import { Request } from 'express';

// User types
export interface IUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'scorer' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

// Team types
export interface ITeam {
  id: string;
  name: string;
  shortName: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// Player types
export interface IPlayer {
  id: string;
  teamId: string;
  name: string;
  jerseyNumber: number;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// Match types
export interface IMatch {
  id: string;
  teamAId: string;
  teamBId: string;
  createdBy: string;
  matchType: 'T20' | 'ODI' | 'Test' | 'Custom';
  status: 'scheduled' | 'live' | 'completed' | 'abandoned';
  overs: number;
  venue?: string;
  startTime?: Date;
  endTime?: Date;
  winner?: 'teamA' | 'teamB' | 'tie' | 'no-result';
  scorerId?: string | null;
  lockedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// Ball types
export interface IBall {
  id: string;
  matchId: string;
  over: number;
  ballNumber: number;
  batsmanId: string;
  bowlerId: string;
  runs: number;
  isWicket: boolean;
  wicketType?: string;
  extras: 'none' | 'wide' | 'no-ball' | 'bye' | 'leg-bye';
  extraRuns: number;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// Audit Log types
export interface IAuditLog {
  id: string;
  matchId: string;
  userId: string;
  scorerId?: string | null;
  actionType: string;
  oldScorerId?: string | null;
  reason?: string | null;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// Auth types
export interface IAuthRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IRegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  user: IUserResponse;
}

export interface IRefreshTokenInput {
  refreshToken: string;
}

export interface IRefreshTokenResponse {
  accessToken: string;
}

// Error types
export interface IErrorDetails {
  [key: string]: any;
}

export interface IErrorResponse {
  error: {
    code: string;
    message: string;
    details?: IErrorDetails;
  };
}

// Pagination types
export interface IPaginationParams {
  page?: number;
  limit?: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Match filter types
export interface IMatchFilters extends IPaginationParams {
  status?: string;
  scorerId?: string;
  createdBy?: string;
}
