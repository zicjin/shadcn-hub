import { Router, Request, Response, NextFunction } from 'express';
import { searchService } from '../services/search.service';
import { validateQuery } from '../middleware/validation.middleware';
import { cacheMiddleware, cacheSettings } from '../middleware/cache.middleware';
import { searchQuerySchema } from '../validation/schemas';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * GET /api/search
 * Search components
 */
router.get(
  '/',
  validateQuery(searchQuerySchema),
  cacheMiddleware(cacheSettings.search),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q, source, type, limit } = req.query as any;

      // Get or create session ID for search analytics
      const sessionId = req.headers['x-session-id'] as string || uuidv4();

      const result = await searchService.search(
        q,
        limit,
        {
          source,
          type,
        },
        sessionId
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export { router as searchRouter };