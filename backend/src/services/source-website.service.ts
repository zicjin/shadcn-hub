import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { sourceWebsites, type SourceWebsite, type NewSourceWebsite } from '../db/schema';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class SourceWebsiteService {
  /**
   * Get all source websites
   */
  async getAll(): Promise<SourceWebsite[]> {
    try {
      const sources = await db
        .select()
        .from(sourceWebsites)
        .where(eq(sourceWebsites.isActive, true));

      return sources;
    } catch (error) {
      logger.error('Error fetching source websites:', error);
      throw new AppError(500, 'Failed to fetch source websites');
    }
  }

  /**
   * Get source website by slug
   */
  async getBySlug(slug: string): Promise<SourceWebsite | null> {
    try {
      const [source] = await db
        .select()
        .from(sourceWebsites)
        .where(eq(sourceWebsites.slug, slug))
        .limit(1);

      return source || null;
    } catch (error) {
      logger.error(`Error fetching source website ${slug}:`, error);
      throw new AppError(500, 'Failed to fetch source website');
    }
  }

  /**
   * Get source website by ID
   */
  async getById(id: string): Promise<SourceWebsite | null> {
    try {
      const [source] = await db
        .select()
        .from(sourceWebsites)
        .where(eq(sourceWebsites.id, id))
        .limit(1);

      return source || null;
    } catch (error) {
      logger.error(`Error fetching source website ${id}:`, error);
      throw new AppError(500, 'Failed to fetch source website');
    }
  }

  /**
   * Create new source website
   */
  async create(data: NewSourceWebsite): Promise<SourceWebsite> {
    try {
      const [source] = await db
        .insert(sourceWebsites)
        .values(data)
        .returning();

      logger.info(`Created new source website: ${source.slug}`);
      return source;
    } catch (error) {
      logger.error('Error creating source website:', error);
      throw new AppError(500, 'Failed to create source website');
    }
  }

  /**
   * Update source website
   */
  async update(id: string, data: Partial<NewSourceWebsite>): Promise<SourceWebsite | null> {
    try {
      const [source] = await db
        .update(sourceWebsites)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(sourceWebsites.id, id))
        .returning();

      if (source) {
        logger.info(`Updated source website: ${source.slug}`);
      }

      return source || null;
    } catch (error) {
      logger.error(`Error updating source website ${id}:`, error);
      throw new AppError(500, 'Failed to update source website');
    }
  }

  /**
   * Update component count for a source
   */
  async updateComponentCount(id: string, count: number): Promise<void> {
    try {
      await db
        .update(sourceWebsites)
        .set({
          componentCount: count,
          updatedAt: new Date(),
        })
        .where(eq(sourceWebsites.id, id));
    } catch (error) {
      logger.error(`Error updating component count for ${id}:`, error);
      throw new AppError(500, 'Failed to update component count');
    }
  }

  /**
   * Update crawl status for a source
   */
  async updateCrawlStatus(
    id: string,
    status: 'pending' | 'running' | 'success' | 'failed'
  ): Promise<void> {
    try {
      const updates: Partial<SourceWebsite> = {
        crawlStatus: status,
        updatedAt: new Date(),
      };

      if (status === 'success') {
        updates.lastCrawledAt = new Date();
      }

      await db
        .update(sourceWebsites)
        .set(updates)
        .where(eq(sourceWebsites.id, id));
    } catch (error) {
      logger.error(`Error updating crawl status for ${id}:`, error);
      throw new AppError(500, 'Failed to update crawl status');
    }
  }

  /**
   * Deactivate source website
   */
  async deactivate(id: string): Promise<void> {
    try {
      await db
        .update(sourceWebsites)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(sourceWebsites.id, id));

      logger.info(`Deactivated source website: ${id}`);
    } catch (error) {
      logger.error(`Error deactivating source website ${id}:`, error);
      throw new AppError(500, 'Failed to deactivate source website');
    }
  }
}

// Export singleton instance
export const sourceWebsiteService = new SourceWebsiteService();