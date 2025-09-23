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

describe('GET /api/components', () => {
  const app = createTestApp();

  beforeAll(async () => {
    await setupTestDatabase();
    // NOTE: Routes not implemented yet - tests will fail (TDD)
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should return 200 status code', async () => {
    const response = await request(app)
      .get('/api/components')
      .expect('Content-Type', /json/);

    expect(response.status).toBe(200);
  });

  it('should return paginated components', async () => {
    const response = await request(app)
      .get('/api/components');

    const parseResult = paginatedComponentsSchema.safeParse(response.body);
    expect(parseResult.success).toBe(true);
  });

  it('should support source filter', async () => {
    const response = await request(app)
      .get('/api/components')
      .query({ source: 'shadcn-ui' });

    if (response.status === 200 && response.body.components.length > 0) {
      response.body.components.forEach((comp: any) => {
        if (comp.sourceWebsite) {
          expect(comp.sourceWebsite.slug).toBe('shadcn-ui');
        }
      });
    }
  });

  it('should support type filter', async () => {
    const response = await request(app)
      .get('/api/components')
      .query({ type: 'button' });

    if (response.status === 200 && response.body.components.length > 0) {
      response.body.components.forEach((comp: any) => {
        if (comp.componentType) {
          expect(comp.componentType.slug).toBe('button');
        }
      });
    }
  });

  it('should support tags filter', async () => {
    const response = await request(app)
      .get('/api/components')
      .query({ tags: ['button', 'primary'] });

    if (response.status === 200 && response.body.components.length > 0) {
      response.body.components.forEach((comp: any) => {
        expect(comp.tags).toEqual(
          expect.arrayContaining(['button', 'primary'])
        );
      });
    }
  });

  it('should support pagination parameters', async () => {
    const response = await request(app)
      .get('/api/components')
      .query({ page: 2, limit: 10 });

    expect(response.body.pagination.page).toBe(2);
    expect(response.body.pagination.limit).toBe(10);
  });

  it('should support sorting', async () => {
    const responseNewest = await request(app)
      .get('/api/components')
      .query({ sort: 'newest' });

    const responsePopular = await request(app)
      .get('/api/components')
      .query({ sort: 'popular' });

    const responseName = await request(app)
      .get('/api/components')
      .query({ sort: 'name' });

    // All should return 200
    expect(responseNewest.status).toBe(200);
    expect(responsePopular.status).toBe(200);
    expect(responseName.status).toBe(200);
  });

  it('should enforce maximum limit', async () => {
    const response = await request(app)
      .get('/api/components')
      .query({ limit: 200 });

    expect(response.body.pagination.limit).toBeLessThanOrEqual(100);
  });

  it('should handle default pagination', async () => {
    const response = await request(app)
      .get('/api/components');

    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(20);
  });

  it('should handle multiple filters', async () => {
    const response = await request(app)
      .get('/api/components')
      .query({
        source: 'shadcn-ui',
        type: 'button',
        tags: ['primary'],
        sort: 'popular',
        page: 1,
        limit: 10
      });

    expect(response.status).toBe(200);
    expect(response.body.pagination.limit).toBe(10);
  });

  it('should handle invalid sort parameter', async () => {
    const response = await request(app)
      .get('/api/components')
      .query({ sort: 'invalid-sort' });

    // Should either ignore invalid sort or return 400
    expect([200, 400]).toContain(response.status);
  });

  it('should return empty array when no matches', async () => {
    const response = await request(app)
      .get('/api/components')
      .query({
        source: 'non-existent',
        type: 'non-existent'
      });

    if (response.status === 200) {
      expect(response.body.components).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    }
  });

  it('should include component relationships', async () => {
    const response = await request(app)
      .get('/api/components');

    if (response.status === 200 && response.body.components.length > 0) {
      const component = response.body.components[0];
      expect(component).toHaveProperty('id');
      expect(component).toHaveProperty('name');
      expect(component).toHaveProperty('slug');
      expect(component).toHaveProperty('tags');
    }
  });

  it('should set appropriate cache headers', async () => {
    const response = await request(app)
      .get('/api/components');

    expect(response.headers).toHaveProperty('cache-control');
  });
});