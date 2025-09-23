import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function loggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const { method, url, ip } = req;

  // Log request
  logger.info(`Incoming ${method} ${url}`, {
    ip,
    userAgent: req.get('user-agent'),
  });

  // Capture the original send function
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const responseTime = Date.now() - startTime;

    // Log response
    logger.info(`Response ${method} ${url}`, {
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    });

    // Call original send
    return originalSend.call(this, data);
  };

  next();
}