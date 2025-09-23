import { Router, Request, Response, NextFunction } from 'express';
import { sourceWebsiteService } from '../services/source-website.service';
import { componentService } from '../services/component.service';
import { validateParams, validateQuery } from '../middleware/validation.middleware';
import { cacheMiddleware, cacheSettings } from '../middleware/cache.middleware';
import { AppError } from '../middleware/error.middleware';
import { z } from 'zod';
import { slugSchema, paginationSchema } from '../validation/schemas';

const router = Router();

/**
 * GET /api/sources
 * Get all source websites
 */
router.get(
  '/',
  cacheMiddleware(cacheSettings.sources),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sources = await sourceWebsiteService.getAll();

      res.json({
        sources,
        total: sources.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/sources/:slug
 * Get a specific source website
 */
router.get(
  '/:slug',
  validateParams(z.object({ slug: slugSchema })),
  cacheMiddleware(cacheSettings.sources),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const source = await sourceWebsiteService.getBySlug(slug);

      if (!source) {
        throw new AppError(404, `Source website '${slug}' not found`);
      }

      res.json(source);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/sources/:slug/components
 * Get all components from a specific source
 */
router.get(
  '/:slug/components',
  validateParams(z.object({ slug: slugSchema })),
  validateQuery(paginationSchema),
  cacheMiddleware(cacheSettings.components),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const { page, limit } = req.query as any;

      // Verify source exists
      const source = await sourceWebsiteService.getBySlug(slug);
      if (!source) {
        throw new AppError(404, `Source website '${slug}' not found`);
      }

      // Get components
      const result = await componentService.getBySource(slug, page, limit);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export { router as sourcesRouter };