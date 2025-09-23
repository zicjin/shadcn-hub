import { eq, asc } from 'drizzle-orm';
import { db } from '../db/client';
import { componentTypes, type ComponentType, type NewComponentType } from '../db/schema';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class ComponentTypeService {
  /**
   * Get all component types
   */
  async getAll(): Promise<ComponentType[]> {
    try {
      const types = await db
        .select()
        .from(componentTypes)
        .orderBy(asc(componentTypes.displayOrder));

      return types;
    } catch (error) {
      logger.error('Error fetching component types:', error);
      throw new AppError(500, 'Failed to fetch component types');
    }
  }

  /**
   * Get component type by slug
   */
  async getBySlug(slug: string): Promise<ComponentType | null> {
    try {
      const [type] = await db
        .select()
        .from(componentTypes)
        .where(eq(componentTypes.slug, slug))
        .limit(1);

      return type || null;
    } catch (error) {
      logger.error(`Error fetching component type ${slug}:`, error);
      throw new AppError(500, 'Failed to fetch component type');
    }
  }

  /**
   * Get component type by ID
   */
  async getById(id: string): Promise<ComponentType | null> {
    try {
      const [type] = await db
        .select()
        .from(componentTypes)
        .where(eq(componentTypes.id, id))
        .limit(1);

      return type || null;
    } catch (error) {
      logger.error(`Error fetching component type ${id}:`, error);
      throw new AppError(500, 'Failed to fetch component type');
    }
  }

  /**
   * Create new component type
   */
  async create(data: NewComponentType): Promise<ComponentType> {
    try {
      const [type] = await db
        .insert(componentTypes)
        .values(data)
        .returning();

      logger.info(`Created new component type: ${type.slug}`);
      return type;
    } catch (error) {
      logger.error('Error creating component type:', error);
      throw new AppError(500, 'Failed to create component type');
    }
  }

  /**
   * Update component type
   */
  async update(id: string, data: Partial<NewComponentType>): Promise<ComponentType | null> {
    try {
      const [type] = await db
        .update(componentTypes)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(componentTypes.id, id))
        .returning();

      if (type) {
        logger.info(`Updated component type: ${type.slug}`);
      }

      return type || null;
    } catch (error) {
      logger.error(`Error updating component type ${id}:`, error);
      throw new AppError(500, 'Failed to update component type');
    }
  }

  /**
   * Update component count for a type
   */
  async updateComponentCount(id: string, count: number): Promise<void> {
    try {
      await db
        .update(componentTypes)
        .set({
          componentCount: count,
          updatedAt: new Date(),
        })
        .where(eq(componentTypes.id, id));
    } catch (error) {
      logger.error(`Error updating component count for type ${id}:`, error);
      throw new AppError(500, 'Failed to update component count');
    }
  }

  /**
   * Delete component type
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(componentTypes)
        .where(eq(componentTypes.id, id));

      logger.info(`Deleted component type: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting component type ${id}:`, error);
      throw new AppError(500, 'Failed to delete component type');
    }
  }

  /**
   * Find or create component type by name
   */
  async findOrCreate(name: string, slug?: string): Promise<ComponentType> {
    try {
      // Generate slug if not provided
      const typeSlug = slug || name.toLowerCase().replace(/\s+/g, '-');

      // Check if type exists
      let type = await this.getBySlug(typeSlug);

      if (!type) {
        // Create new type
        type = await this.create({
          name,
          slug: typeSlug,
          description: `${name} components`,
          displayOrder: 999, // Will be adjusted later
        });
      }

      return type;
    } catch (error) {
      logger.error(`Error finding or creating component type ${name}:`, error);
      throw new AppError(500, 'Failed to find or create component type');
    }
  }
}

// Export singleton instance
export const componentTypeService = new ComponentTypeService();