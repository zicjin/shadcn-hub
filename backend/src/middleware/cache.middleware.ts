import { Request, Response, NextFunction } from 'express';

// Cache control middleware for different resource types
export function cacheMiddleware(maxAge: number = 300) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Set cache headers
    res.set({
      'Cache-Control': `public, max-age=${maxAge}`,
      'Vary': 'Accept-Encoding',
    });
    next();
  };
}

// No cache middleware for dynamic content
export function noCacheMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  next();
}

// Cache settings for different endpoints
export const cacheSettings = {
  sources: 3600, // 1 hour
  types: 3600, // 1 hour
  components: 300, // 5 minutes
  componentDetail: 600, // 10 minutes
  componentCode: 3600, // 1 hour
  search: 60, // 1 minute
  stats: 300, // 5 minutes
};