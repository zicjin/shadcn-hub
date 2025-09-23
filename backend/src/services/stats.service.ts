import { sql, eq } from 'drizzle-orm';
import { db } from '../db/client';
import {
  components,
  sourceWebsites,
  componentTypes,
  crawlJobs,
} from '../db/schema';
import { componentService } from './component.service';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export interface PlatformStats {
  totalComponents: number;
  totalSources: number;
  totalTypes: number;
  lastUpdateTime: Date | null;
  popularComponents?: any[];
  componentsBySource?: Record<string, number>;
  componentsByType?: Record<string, number>;
  crawlStats?: {
    totalCrawls: number;
    successfulCrawls: number;
    failedCrawls: number;
    lastCrawlTime: Date | null;
  };
}

export class StatsService {
  private statsCache: PlatformStats | null = null;
  private cacheExpiry: Date | null = null;
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  /**
   * Get platform statistics
   */
  async getStats(includeDetails: boolean = true): Promise<PlatformStats> {
    try {
      // Check cache
      if (this.statsCache && this.cacheExpiry && new Date() < this.cacheExpiry) {
        return this.statsCache;
      }

      // Get basic counts
      const [componentsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(components)
        .where(eq(components.isActive, true));

      const [sourcesCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(sourceWebsites)
        .where(eq(sourceWebsites.isActive, true));

      const [typesCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(componentTypes);

      // Get last update time
      const [lastUpdate] = await db
        .select({ lastUpdatedAt: sql<Date>`MAX(${components.updatedAt})` })
        .from(components);

      const stats: PlatformStats = {
        totalComponents: Number(componentsCount.count),
        totalSources: Number(sourcesCount.count),
        totalTypes: Number(typesCount.count),
        lastUpdateTime: lastUpdate?.lastUpdatedAt || null,
      };

      if (includeDetails) {
        // Get popular components
        stats.popularComponents = await componentService.getPopular(10);

        // Get components count by source
        const componentsBySource = await db
          .select({
            sourceName: sourceWebsites.name,
            count: sql<number>`count(${components.id})`,
          })
          .from(components)
          .leftJoin(sourceWebsites, eq(components.sourceWebsiteId, sourceWebsites.id))
          .where(eq(components.isActive, true))
          .groupBy(sourceWebsites.name);

        stats.componentsBySource = componentsBySource.reduce((acc, item) => {
          if (item.sourceName) {
            acc[item.sourceName] = Number(item.count);
          }
          return acc;
        }, {} as Record<string, number>);

        // Get components count by type
        const componentsByType = await db
          .select({
            typeName: componentTypes.name,
            count: sql<number>`count(${components.id})`,
          })
          .from(components)
          .leftJoin(componentTypes, eq(components.componentTypeId, componentTypes.id))
          .where(eq(components.isActive, true))
          .groupBy(componentTypes.name);

        stats.componentsByType = componentsByType.reduce((acc, item) => {
          if (item.typeName) {
            acc[item.typeName] = Number(item.count);
          }
          return acc;
        }, {} as Record<string, number>);

        // Get crawl stats
        const crawlStats = await this.getCrawlStats();
        if (crawlStats) {
          stats.crawlStats = crawlStats;
        }
      }

      // Update cache
      this.statsCache = stats;
      this.cacheExpiry = new Date(Date.now() + this.cacheDuration);

      return stats;
    } catch (error) {
      logger.error('Error fetching platform stats:', error);
      throw new AppError(500, 'Failed to fetch platform statistics');
    }
  }

  /**
   * Get crawl statistics
   */
  private async getCrawlStats(): Promise<PlatformStats['crawlStats']> {
    try {
      const [totalCrawls] = await db
        .select({ count: sql<number>`count(*)` })
        .from(crawlJobs);

      const [successfulCrawls] = await db
        .select({ count: sql<number>`count(*)` })
        .from(crawlJobs)
        .where(eq(crawlJobs.status, 'success'));

      const [failedCrawls] = await db
        .select({ count: sql<number>`count(*)` })
        .from(crawlJobs)
        .where(eq(crawlJobs.status, 'failed'));

      const [lastCrawl] = await db
        .select({ completedAt: sql<Date>`MAX(${crawlJobs.completedAt})` })
        .from(crawlJobs)
        .where(eq(crawlJobs.status, 'success'));

      return {
        totalCrawls: Number(totalCrawls.count),
        successfulCrawls: Number(successfulCrawls.count),
        failedCrawls: Number(failedCrawls.count),
        lastCrawlTime: lastCrawl?.completedAt || null,
      };
    } catch (error) {
      logger.error('Error fetching crawl stats:', error);
      return undefined;
    }
  }

  /**
   * Clear stats cache
   */
  clearCache(): void {
    this.statsCache = null;
    this.cacheExpiry = null;
    logger.info('Stats cache cleared');
  }

  /**
   * Get component growth over time
   */
  async getGrowthStats(days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const growthData = await db
        .select({
          date: sql<string>`DATE(${components.createdAt})`,
          count: sql<number>`count(*)`,
        })
        .from(components)
        .where(sql`${components.createdAt} >= ${startDate}`)
        .groupBy(sql`DATE(${components.createdAt})`)
        .orderBy(sql`DATE(${components.createdAt})`);

      return growthData;
    } catch (error) {
      logger.error('Error fetching growth stats:', error);
      throw new AppError(500, 'Failed to fetch growth statistics');
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(days: number = 7): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Top search queries
      const topQueries = await db
        .select({
          query: sql<string>`${searchLogs.query}`,
          count: sql<number>`count(*)`,
          avgResponseTime: sql<number>`AVG(${searchLogs.responseTime})`,
        })
        .from(searchLogs)
        .where(sql`${searchLogs.createdAt} >= ${startDate}`)
        .groupBy(searchLogs.query)
        .orderBy(sql`count(*) DESC`)
        .limit(20);

      // Search volume over time
      const searchVolume = await db
        .select({
          date: sql<string>`DATE(${searchLogs.createdAt})`,
          searches: sql<number>`count(*)`,
          avgResponseTime: sql<number>`AVG(${searchLogs.responseTime})`,
        })
        .from(searchLogs)
        .where(sql`${searchLogs.createdAt} >= ${startDate}`)
        .groupBy(sql`DATE(${searchLogs.createdAt})`)
        .orderBy(sql`DATE(${searchLogs.createdAt})`);

      return {
        topQueries,
        searchVolume,
      };
    } catch (error) {
      logger.error('Error fetching search analytics:', error);
      throw new AppError(500, 'Failed to fetch search analytics');
    }
  }
}

// Export singleton instance
export const statsService = new StatsService();