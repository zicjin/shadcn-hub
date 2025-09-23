import { Router, Request, Response, NextFunction } from 'express';
import { componentTypeService } from '../services/component-type.service';
import { componentService } from '../services/component.service';
import { validateParams, validateQuery } from '../middleware/validation.middleware';
import { cacheMiddleware, cacheSettings } from '../middleware/cache.middleware';
import { AppError } from '../middleware/error.middleware';
import { z } from 'zod';
import { slugSchema, paginationSchema, sourceFilterSchema } from '../validation/schemas';

const router = Router();

/**
 * GET /api/types
 * Get all component types
 */
router.get(
  '/',
  cacheMiddleware(cacheSettings.types),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const types = await componentTypeService.getAll();

      res.json({
        types,
        total: types.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/types/:slug/components
 * Get all components of a specific type
 */
router.get(
  '/:slug/components',
  validateParams(z.object({ slug: slugSchema })),
  validateQuery(
    paginationSchema.extend({
      source: sourceFilterSchema,
    })
  ),
  cacheMiddleware(cacheSettings.components),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const { page, limit, source } = req.query as any;

      // Verify type exists
      const type = await componentTypeService.getBySlug(slug);
      if (!type) {
        throw new AppError(404, `Component type '${slug}' not found`);
      }

      // Get components
      const result = await componentService.getByType(slug, page, limit, source);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export { router as typesRouter };