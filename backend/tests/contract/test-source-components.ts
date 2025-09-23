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

describe('GET /api/sources/:slug/components', () => {
  const app = createTestApp();
  const testSlug = 'shadcn-ui';

  beforeAll(async () => {
    await setupTestDatabase();
    // NOTE: Routes not implemented yet - tests will fail (TDD)
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should return 200 for valid source', async () => {
    const response = await request(app)
      .get(`/api/sources/${testSlug}/components`)
      .expect('Content-Type', /json/);

    expect(response.status).toBe(200);
  });

  it('should return paginated components response', async () => {
    const response = await request(app)
      .get(`/api/sources/${testSlug}/components`);

    if (response.status === 200) {
      const parseResult = paginatedComponentsSchema.safeParse(response.body);
      expect(parseResult.success).toBe(true);
    }
  });

  it('should support pagination parameters', async () => {
    const response = await request(app)
      .get(`/api/sources/${testSlug}/components`)
      .query({ page: 2, limit: 10 });

    if (response.status === 200) {
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
    }
  });

  it('should enforce maximum limit', async () => {
    const response = await request(app)
      .get(`/api/sources/${testSlug}/components`)
      .query({ limit: 200 });

    if (response.status === 200) {
      expect(response.body.pagination.limit).toBeLessThanOrEqual(100);
    }
  });

  it('should return 404 for non-existent source', async () => {
    const response = await request(app)
      .get('/api/sources/non-existent/components');

    expect(response.status).toBe(404);
  });

  it('should handle default pagination', async () => {
    const response = await request(app)
      .get(`/api/sources/${testSlug}/components`);

    if (response.status === 200) {
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
    }
  });

  it('should return empty array for source with no components', async () => {
    const response = await request(app)
      .get('/api/sources/empty-source/components');

    if (response.status === 200) {
      expect(response.body.components).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    }
  });

  it('should include component relationships', async () => {
    const response = await request(app)
      .get(`/api/sources/${testSlug}/components`);

    if (response.status === 200 && response.body.components.length > 0) {
      const component = response.body.components[0];
      expect(component).toHaveProperty('id');
      expect(component).toHaveProperty('name');
      expect(component).toHaveProperty('tags');
    }
  });

  it('should handle invalid pagination parameters', async () => {
    const response = await request(app)
      .get(`/api/sources/${testSlug}/components`)
      .query({ page: -1, limit: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return components in consistent order', async () => {
    const response1 = await request(app)
      .get(`/api/sources/${testSlug}/components`);
    const response2 = await request(app)
      .get(`/api/sources/${testSlug}/components`);

    if (response1.status === 200 && response2.status === 200) {
      expect(response1.body.components).toEqual(response2.body.components);
    }
  });
});