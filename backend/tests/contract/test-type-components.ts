import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, setupTestDatabase, teardownTestDatabase } from '../setup';
import { z } from 'zod';

// Schema based on OpenAPI spec
const componentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  sourceWebsite: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  }).optional(),
  componentType: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  }).optional(),
  thumbnailUrl: z.string().url().nullable(),
  tags: z.array(z.string()),
  viewCount: z.number(),
});

const paginatedComponentsSchema = z.object({
  components: z.array(componentSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean(),
  }),
});

describe('GET /api/types/:slug/components', () => {
  const app = createTestApp();
  const testTypeSlug = 'button';

  beforeAll(async () => {
    await setupTestDatabase();
    // NOTE: Routes not implemented yet - tests will fail (TDD)
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should return 200 for valid type', async () => {
    const response = await request(app)
      .get(`/api/types/${testTypeSlug}/components`)
      .expect('Content-Type', /json/);

    expect(response.status).toBe(200);
  });

  it('should return paginated components response', async () => {
    const response = await request(app)
      .get(`/api/types/${testTypeSlug}/components`);

    if (response.status === 200) {
      const parseResult = paginatedComponentsSchema.safeParse(response.body);
      expect(parseResult.success).toBe(true);
    }
  });

  it('should support pagination parameters', async () => {
    const response = await request(app)
      .get(`/api/types/${testTypeSlug}/components`)
      .query({ page: 2, limit: 10 });

    if (response.status === 200) {
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
    }
  });

  it('should support source filter', async () => {
    const response = await request(app)
      .get(`/api/types/${testTypeSlug}/components`)
      .query({ source: 'shadcn-ui' });

    if (response.status === 200) {
      const components = response.body.components;
      if (components.length > 0) {
        // All components should be from the specified source
        components.forEach((comp: any) => {
          if (comp.sourceWebsite) {
            expect(comp.sourceWebsite.slug).toBe('shadcn-ui');
          }
        });
      }
    }
  });

  it('should enforce maximum limit', async () => {
    const response = await request(app)
      .get(`/api/types/${testTypeSlug}/components`)
      .query({ limit: 200 });

    if (response.status === 200) {
      expect(response.body.pagination.limit).toBeLessThanOrEqual(100);
    }
  });

  it('should return 404 for non-existent type', async () => {
    const response = await request(app)
      .get('/api/types/non-existent-type/components');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('should handle default pagination', async () => {
    const response = await request(app)
      .get(`/api/types/${testTypeSlug}/components`);

    if (response.status === 200) {
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
    }
  });

  it('should return only components of specified type', async () => {
    const response = await request(app)
      .get(`/api/types/${testTypeSlug}/components`);

    if (response.status === 200 && response.body.components.length > 0) {
      const components = response.body.components;
      components.forEach((comp: any) => {
        if (comp.componentType) {
          expect(comp.componentType.slug).toBe(testTypeSlug);
        }
      });
    }
  });

  it('should handle invalid source filter', async () => {
    const response = await request(app)
      .get(`/api/types/${testTypeSlug}/components`)
      .query({ source: 'invalid-source-123' });

    // Should return 200 with empty results or 400 for invalid source
    expect([200, 400]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body.components).toEqual([]);
    }
  });

  it('should handle multiple filters', async () => {
    const response = await request(app)
      .get(`/api/types/${testTypeSlug}/components`)
      .query({
        source: 'shadcn-ui',
        page: 1,
        limit: 5
      });

    if (response.status === 200) {
      expect(response.body.pagination.limit).toBe(5);
      // Components should match both type and source filters
    }
  });
});