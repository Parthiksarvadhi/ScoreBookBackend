/**
 * Async Handler Middleware
 * Wraps async route handlers to catch errors
 */

import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => (req: Request, res: Response, next: NextFunction): void => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error('❌ ERROR CAUGHT IN ASYNC HANDLER:');
    console.error(`  Message: ${err.message}`);
    console.error(`  Stack: ${err.stack}`);
    next(err);
  });
};

export default asyncHandler;
