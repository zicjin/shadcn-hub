import { Router, Request, Response, NextFunction } from 'express';
import { componentService } from '../services/component.service';
import { validateParams, validateQuery } from '../middleware/validation.middleware';
import { cacheMiddleware, cacheSettings } from '../middleware/cache.middleware';
import { AppError } from '../middleware/error.middleware';
import { z } from 'zod';
import {
  uuidSchema,
  componentBrowseSchema,
  codeFormatSchema,
} from '../validation/schemas';

const router = Router();

/**
 * GET /api/components
 * Browse all components with filters
 */
router.get(
  '/',
  validateQuery(componentBrowseSchema),
  cacheMiddleware(cacheSettings.components),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, source, type, tags, sort } = req.query as any;

      const result = await componentService.browse(
        page,
        limit,
        {
          sourceSlug: source,
          typeSlug: type,
          tags,
        },
        sort
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/components/:id
 * Get a specific component
 */
router.get(
  '/:id',
  validateParams(z.object({ id: uuidSchema })),
  cacheMiddleware(cacheSettings.componentDetail),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const component = await componentService.getByIdWithRelations(id);

      if (!component) {
        throw new AppError(404, `Component '${id}' not found`);
      }

      // Increment view count (async, don't wait)
      componentService.incrementViewCount(id).catch(err =>
        console.error('Failed to increment view count:', err)
      );

      res.json(component);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/components/:id/code
 * Get component source code
 */
router.get(
  '/:id/code',
  validateParams(z.object({ id: uuidSchema })),
  validateQuery(z.object({ format: codeFormatSchema })),
  cacheMiddleware(cacheSettings.componentCode),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { format = 'formatted' } = req.query as any;

      const component = await componentService.getById(id);

      if (!component) {
        throw new AppError(404, `Component '${id}' not found`);
      }

      // Format code based on request
      let code = component.sourceCode;

      // TODO: Implement code formatting based on format parameter
      // For now, return raw code

      res.json({
        code,
        language: component.codeLanguage,
        dependencies: component.dependencies,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/components/:id/instances
 * Get component instances/variants
 * Note: This would be implemented when ComponentInstance functionality is added
 */
router.get(
  '/:id/instances',
  validateParams(z.object({ id: uuidSchema })),
  cacheMiddleware(cacheSettings.components),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // TODO: Implement component instances retrieval
      // For now, return empty array
      res.json({
        instances: [],
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as componentsRouter };