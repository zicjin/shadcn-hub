import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  stack?: string;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error('Error handler caught:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle different error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    details = err.errors;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: err.name || 'Error',
    message,
    details,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}