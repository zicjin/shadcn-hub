import { Router, Request, Response, NextFunction } from 'express';
import { sourceWebsiteService } from '../services/source-website.service';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { noCacheMiddleware } from '../middleware/cache.middleware';
import { AppError } from '../middleware/error.middleware';
import { crawlTriggerSchema, uuidSchema } from '../validation/schemas';
import { z } from 'zod';
import { db } from '../db/client';
import { crawlJobs, type NewCrawlJob } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Simple API key authentication middleware
const requireApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!apiKey || apiKey !== expectedKey) {
    next(new AppError(401, 'Unauthorized: Invalid API key'));
    return;
  }

  next();
};

/**
 * POST /api/crawl/trigger
 * Trigger a crawl job for a source
 */
router.post(
  '/trigger',
  requireApiKey,
  validateBody(crawlTriggerSchema),
  noCacheMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sourceSlug, force } = req.body;

      // Get source
      const source = await sourceWebsiteService.getBySlug(sourceSlug);
      if (!source) {
        throw new AppError(404, `Source website '${sourceSlug}' not found`);
      }

      // Check if crawl is already running
      if (!force) {
        const [runningJob] = await db
          .select()
          .from(crawlJobs)
          .where(
            and(
              eq(crawlJobs.sourceWebsiteId, source.id),
              eq(crawlJobs.status, 'running')
            )
          )
          .limit(1);

        if (runningJob) {
          throw new AppError(409, 'Crawl already in progress for this source');
        }
      }

      // Create new crawl job
      const newJob: NewCrawlJob = {
        id: uuidv4(),
        sourceWebsiteId: source.id,
        status: 'pending',
      };

      const [crawlJob] = await db
        .insert(crawlJobs)
        .values(newJob)
        .returning();

      // TODO: Queue the crawl job for processing
      // This would typically trigger a background job via Bull queue

      res.status(201).json(crawlJob);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/crawl/status/:id
 * Get crawl job status
 */
router.get(
  '/status/:id',
  requireApiKey,
  validateParams(z.object({ id: uuidSchema })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const [crawlJob] = await db
        .select()
        .from(crawlJobs)
        .where(eq(crawlJobs.id, id))
        .limit(1);

      if (!crawlJob) {
        throw new AppError(404, `Crawl job '${id}' not found`);
      }

      res.json(crawlJob);
    } catch (error) {
      next(error);
    }
  }
);

export { router as crawlRouter };