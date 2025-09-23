import { eq, and, sql, desc, asc, inArray, like } from 'drizzle-orm';
import { db } from '../db/client';
import {
  components,
  sourceWebsites,
  componentTypes,
  type Component,
  type NewComponent
} from '../db/schema';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export interface ComponentFilter {
  sourceSlug?: string;
  typeSlug?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface PaginatedComponents {
  components: Component[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class ComponentService {
  /**
   * Get paginated components with filters
   */
  async browse(
    page: number = 1,
    limit: number = 20,
    filter: ComponentFilter = {},
    sort: 'newest' | 'popular' | 'name' = 'newest'
  ): Promise<PaginatedComponents> {
    try {
      // Build WHERE conditions
      const conditions = [];

      if (filter.isActive !== undefined) {
        conditions.push(eq(components.isActive, filter.isActive));
      } else {
        conditions.push(eq(components.isActive, true));
      }

      if (filter.sourceSlug) {
        const source = await db
          .select({ id: sourceWebsites.id })
          .from(sourceWebsites)
          .where(eq(sourceWebsites.slug, filter.sourceSlug))
          .limit(1);

        if (source[0]) {
          conditions.push(eq(components.sourceWebsiteId, source[0].id));
        }
      }

      if (filter.typeSlug) {
        const type = await db
          .select({ id: componentTypes.id })
          .from(componentTypes)
          .where(eq(componentTypes.slug, filter.typeSlug))
          .limit(1);

        if (type[0]) {
          conditions.push(eq(components.componentTypeId, type[0].id));
        }
      }

      // TODO: Add tags filter when PostgreSQL array operations are available

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(components)
        .where(whereClause);

      const total = Number(count);
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;

      // Determine sort order
      let orderBy;
      switch (sort) {
        case 'popular':
          orderBy = desc(components.viewCount);
          break;
        case 'name':
          orderBy = asc(components.name);
          break;
        case 'newest':
        default:
          orderBy = desc(components.createdAt);
          break;
      }

      // Get paginated components
      const componentList = await db
        .select()
        .from(components)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return {
        components: componentList,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      logger.error('Error browsing components:', error);
      throw new AppError(500, 'Failed to browse components');
    }
  }

  /**
   * Get component by ID
   */
  async getById(id: string): Promise<Component | null> {
    try {
      const [component] = await db
        .select()
        .from(components)
        .where(eq(components.id, id))
        .limit(1);

      return component || null;
    } catch (error) {
      logger.error(`Error fetching component ${id}:`, error);
      throw new AppError(500, 'Failed to fetch component');
    }
  }

  /**
   * Get component with relationships
   */
  async getByIdWithRelations(id: string): Promise<any> {
    try {
      const result = await db
        .select({
          component: components,
          sourceWebsite: sourceWebsites,
          componentType: componentTypes,
        })
        .from(components)
        .leftJoin(sourceWebsites, eq(components.sourceWebsiteId, sourceWebsites.id))
        .leftJoin(componentTypes, eq(components.componentTypeId, componentTypes.id))
        .where(eq(components.id, id))
        .limit(1);

      if (!result[0]) {
        return null;
      }

      const { component, sourceWebsite, componentType } = result[0];

      return {
        ...component,
        sourceWebsite,
        componentType,
      };
    } catch (error) {
      logger.error(`Error fetching component with relations ${id}:`, error);
      throw new AppError(500, 'Failed to fetch component');
    }
  }

  /**
   * Get components by source
   */
  async getBySource(
    sourceSlug: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedComponents> {
    return this.browse(page, limit, { sourceSlug });
  }

  /**
   * Get components by type
   */
  async getByType(
    typeSlug: string,
    page: number = 1,
    limit: number = 20,
    sourceSlug?: string
  ): Promise<PaginatedComponents> {
    return this.browse(page, limit, { typeSlug, sourceSlug });
  }

  /**
   * Create new component
   */
  async create(data: NewComponent): Promise<Component> {
    try {
      const [component] = await db
        .insert(components)
        .values(data)
        .returning();

      logger.info(`Created new component: ${component.name}`);
      return component;
    } catch (error) {
      logger.error('Error creating component:', error);
      throw new AppError(500, 'Failed to create component');
    }
  }

  /**
   * Update component
   */
  async update(id: string, data: Partial<NewComponent>): Promise<Component | null> {
    try {
      const [component] = await db
        .update(components)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(components.id, id))
        .returning();

      if (component) {
        logger.info(`Updated component: ${component.name}`);
      }

      return component || null;
    } catch (error) {
      logger.error(`Error updating component ${id}:`, error);
      throw new AppError(500, 'Failed to update component');
    }
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    try {
      await db
        .update(components)
        .set({
          viewCount: sql`${components.viewCount} + 1`,
        })
        .where(eq(components.id, id));
    } catch (error) {
      logger.error(`Error incrementing view count for ${id}:`, error);
      // Don't throw error for view count updates
    }
  }

  /**
   * Delete component
   */
  async delete(id: string): Promise<boolean> {
    try {
      await db
        .delete(components)
        .where(eq(components.id, id));

      logger.info(`Deleted component: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting component ${id}:`, error);
      throw new AppError(500, 'Failed to delete component');
    }
  }

  /**
   * Check if component exists by content hash
   */
  async existsByHash(contentHash: string, sourceWebsiteId: string): Promise<boolean> {
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(components)
        .where(
          and(
            eq(components.contentHash, contentHash),
            eq(components.sourceWebsiteId, sourceWebsiteId)
          )
        );

      return Number(result.count) > 0;
    } catch (error) {
      logger.error('Error checking component by hash:', error);
      throw new AppError(500, 'Failed to check component existence');
    }
  }

  /**
   * Get popular components
   */
  async getPopular(limit: number = 10): Promise<Component[]> {
    try {
      const popularComponents = await db
        .select()
        .from(components)
        .where(eq(components.isActive, true))
        .orderBy(desc(components.viewCount))
        .limit(limit);

      return popularComponents;
    } catch (error) {
      logger.error('Error fetching popular components:', error);
      throw new AppError(500, 'Failed to fetch popular components');
    }
  }
}

// Export singleton instance
export const componentService = new ComponentService();