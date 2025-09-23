import { Router, Request, Response, NextFunction } from 'express';
import { statsService } from '../services/stats.service';
import { cacheMiddleware, cacheSettings } from '../middleware/cache.middleware';

const router = Router();

/**
 * GET /api/stats
 * Get platform statistics
 */
router.get(
  '/',
  cacheMiddleware(cacheSettings.stats),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await statsService.getStats(true);

      res.json({
        totalComponents: stats.totalComponents,
        totalSources: stats.totalSources,
        totalTypes: stats.totalTypes,
        lastUpdateTime: stats.lastUpdateTime,
        popularComponents: stats.popularComponents || [],
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as statsRouter };