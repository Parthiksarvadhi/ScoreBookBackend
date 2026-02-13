/**
 * Error Handler Middleware
 * Handles errors and sends appropriate responses
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorHandler.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    console.log('📋 AppError caught:', err.message);
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  console.error('❌ UNEXPECTED ERROR IN ERROR HANDLER:');
  console.error(`  Message: ${err.message}`);
  console.error(`  Name: ${err.name}`);
  console.error(`  Stack: ${err.stack}`);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    statusCode: 500,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

export default errorHandler;
