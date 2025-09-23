import { sql, and, or, ilike, eq } from 'drizzle-orm';
import { db } from '../db/client';
import {
  components,
  sourceWebsites,
  componentTypes,
  searchLogs,
  type Component,
} from '../db/schema';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import Fuse from 'fuse.js';

export interface SearchResult {
  results: any[];
  total: number;
  responseTime: number;
  suggestions?: string[];
}

export interface SearchFilter {
  source?: string;
  type?: string;
}

export class SearchService {
  private fuseIndex: Fuse<any> | null = null;
  private lastIndexUpdate: Date | null = null;
  private indexUpdateInterval = 5 * 60 * 1000; // 5 minutes

  /**
   * Search components
   */
  async search(
    query: string,
    limit: number = 20,
    filter: SearchFilter = {},
    sessionId?: string
  ): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      // Build search conditions
      const conditions = [eq(components.isActive, true)];

      // Add filters
      if (filter.source) {
        const source = await db
          .select({ id: sourceWebsites.id })
          .from(sourceWebsites)
          .where(eq(sourceWebsites.slug, filter.source))
          .limit(1);

        if (source[0]) {
          conditions.push(eq(components.sourceWebsiteId, source[0].id));
        }
      }

      if (filter.type) {
        const type = await db
          .select({ id: componentTypes.id })
          .from(componentTypes)
          .where(eq(componentTypes.slug, filter.type))
          .limit(1);

        if (type[0]) {
          conditions.push(eq(components.componentTypeId, type[0].id));
        }
      }

      // Add text search conditions
      const searchConditions = or(
        ilike(components.name, `%${query}%`),
        ilike(components.description, `%${query}%`),
        sql`${components.tags}::text ILIKE ${`%${query}%`}`
      );

      if (searchConditions) {
        conditions.push(searchConditions);
      }

      // Execute search query
      const results = await db
        .select({
          component: components,
          sourceWebsite: {
            id: sourceWebsites.id,
            name: sourceWebsites.name,
            slug: sourceWebsites.slug,
          },
          componentType: {
            id: componentTypes.id,
            name: componentTypes.name,
            slug: componentTypes.slug,
          },
        })
        .from(components)
        .leftJoin(sourceWebsites, eq(components.sourceWebsiteId, sourceWebsites.id))
        .leftJoin(componentTypes, eq(components.componentTypeId, componentTypes.id))
        .where(and(...conditions))
        .limit(limit);

      const responseTime = Date.now() - startTime;

      // Log search query
      if (sessionId) {
        this.logSearch(query, filter, results.length, responseTime, sessionId).catch(
          (error) => logger.error('Failed to log search:', error)
        );
      }

      // Generate suggestions for partial matches
      const suggestions = await this.generateSuggestions(query);

      return {
        results: results.map(({ component, sourceWebsite, componentType }) => ({
          ...component,
          sourceWebsite,
          componentType,
        })),
        total: results.length,
        responseTime,
        suggestions,
      };
    } catch (error) {
      logger.error('Search error:', error);
      throw new AppError(500, 'Search failed');
    }
  }

  /**
   * Full-text search using PostgreSQL
   */
  async fullTextSearch(
    query: string,
    limit: number = 20,
    filter: SearchFilter = {}
  ): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      // Build search query using PostgreSQL full-text search
      const searchQuery = sql`
        SELECT
          c.*,
          ts_rank(
            to_tsvector('english', c.name || ' ' || COALESCE(c.description, '') || ' ' || c.tags::text),
            plainto_tsquery('english', ${query})
          ) as rank
        FROM components c
        WHERE
          c.is_active = true AND
          to_tsvector('english', c.name || ' ' || COALESCE(c.description, '') || ' ' || c.tags::text) @@
          plainto_tsquery('english', ${query})
        ORDER BY rank DESC
        LIMIT ${limit}
      `;

      const results = await db.execute(searchQuery);
      const responseTime = Date.now() - startTime;

      return {
        results: results.rows as any[],
        total: results.rows.length,
        responseTime,
      };
    } catch (error) {
      logger.error('Full-text search error:', error);
      throw new AppError(500, 'Full-text search failed');
    }
  }

  /**
   * Generate search suggestions
   */
  private async generateSuggestions(query: string): Promise<string[]> {
    try {
      if (query.length < 3) {
        return [];
      }

      // Get common component names and tags that match the query
      const suggestions = await db
        .selectDistinct({ name: components.name })
        .from(components)
        .where(
          and(
            eq(components.isActive, true),
            ilike(components.name, `${query}%`)
          )
        )
        .limit(5);

      return suggestions.map(s => s.name);
    } catch (error) {
      logger.error('Error generating suggestions:', error);
      return [];
    }
  }

  /**
   * Log search query for analytics
   */
  private async logSearch(
    query: string,
    filters: SearchFilter,
    resultsCount: number,
    responseTime: number,
    sessionId: string
  ): Promise<void> {
    try {
      await db.insert(searchLogs).values({
        query,
        filters,
        resultsCount,
        responseTime,
        sessionId,
      });
    } catch (error) {
      logger.error('Error logging search:', error);
    }
  }

  /**
   * Build and update search index for client-side search
   */
  async buildSearchIndex(): Promise<void> {
    try {
      const allComponents = await db
        .select({
          id: components.id,
          name: components.name,
          description: components.description,
          tags: components.tags,
          slug: components.slug,
        })
        .from(components)
        .where(eq(components.isActive, true));

      // Configure Fuse.js
      const fuseOptions = {
        keys: [
          { name: 'name', weight: 0.4 },
          { name: 'description', weight: 0.3 },
          { name: 'tags', weight: 0.3 },
        ],
        threshold: 0.3,
        includeScore: true,
      };

      this.fuseIndex = new Fuse(allComponents, fuseOptions);
      this.lastIndexUpdate = new Date();

      logger.info('Search index updated successfully');
    } catch (error) {
      logger.error('Error building search index:', error);
      throw new AppError(500, 'Failed to build search index');
    }
  }

  /**
   * Client-side search using Fuse.js
   */
  async clientSearch(query: string, limit: number = 20): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      // Update index if needed
      if (
        !this.fuseIndex ||
        !this.lastIndexUpdate ||
        Date.now() - this.lastIndexUpdate.getTime() > this.indexUpdateInterval
      ) {
        await this.buildSearchIndex();
      }

      if (!this.fuseIndex) {
        throw new Error('Search index not available');
      }

      const searchResults = this.fuseIndex.search(query, { limit });
      const responseTime = Date.now() - startTime;

      return {
        results: searchResults.map(r => r.item),
        total: searchResults.length,
        responseTime,
      };
    } catch (error) {
      logger.error('Client search error:', error);
      throw new AppError(500, 'Client search failed');
    }
  }
}

// Export singleton instance
export const searchService = new SearchService();