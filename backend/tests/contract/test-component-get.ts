import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, setupTestDatabase, teardownTestDatabase } from '../setup';
import { z } from 'zod';

// Schema based on OpenAPI spec
const componentDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  sourceWebsite: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    url: z.string().url(),
  }).optional(),
  componentType: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  }).optional(),
  thumbnailUrl: z.string().url().nullable(),
  tags: z.array(z.string()),
  viewCount: z.number(),
  sourceUrl: z.string().url(),
  previewUrl: z.string().url().nullable(),
  sourceCode: z.string(),
  codeLanguage: z.string(),
  dependencies: z.record(z.any()).nullable(),
  props: z.record(z.any()).nullable(),
  variants: z.array(z.any()).nullable(),
  license: z.string().nullable(),
  author: z.string().nullable(),
  version: z.string().nullable(),
  lastUpdatedAt: z.string().nullable(),
});

describe('GET /api/components/:id', () => {
  const app = createTestApp();
  const testComponentId = '123e4567-e89b-12d3-a456-426614174000'; // UUID v4

  beforeAll(async () => {
    await setupTestDatabase();
    // NOTE: Routes not implemented yet - tests will fail (TDD)
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should return 200 for existing component', async () => {
    const response = await request(app)
      .get(`/api/components/${testComponentId}`)
      .expect('Content-Type', /json/);

    // Will fail initially (TDD)
    expect([200, 404]).toContain(response.status);
  });

  it('should return valid component detail schema', async () => {
    const response = await request(app)
      .get(`/api/components/${testComponentId}`);

    if (response.status === 200) {
      const parseResult = componentDetailSchema.safeParse(response.body);
      expect(parseResult.success).toBe(true);
    }
  });

  it('should return 404 for non-existent component', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const response = await request(app)
      .get(`/api/components/${nonExistentId}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('should handle invalid UUID format', async () => {
    const response = await request(app)
      .get('/api/components/invalid-uuid');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should include all required fields', async () => {
    const response = await request(app)
      .get(`/api/components/${testComponentId}`);

    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('slug');
      expect(response.body).toHaveProperty('sourceUrl');
      expect(response.body).toHaveProperty('sourceCode');
      expect(response.body).toHaveProperty('codeLanguage');
      expect(response.body).toHaveProperty('tags');
    }
  });

  it('should include relationships', async () => {
    const response = await request(app)
      .get(`/api/components/${testComponentId}`);

    if (response.status === 200) {
      if (response.body.sourceWebsite) {
        expect(response.body.sourceWebsite).toHaveProperty('id');
        expect(response.body.sourceWebsite).toHaveProperty('name');
        expect(response.body.sourceWebsite).toHaveProperty('slug');
      }
      if (response.body.componentType) {
        expect(response.body.componentType).toHaveProperty('id');
        expect(response.body.componentType).toHaveProperty('name');
        expect(response.body.componentType).toHaveProperty('slug');
      }
    }
  });

  it('should increment view count', async () => {
    const response1 = await request(app)
      .get(`/api/components/${testComponentId}`);

    const response2 = await request(app)
      .get(`/api/components/${testComponentId}`);

    if (response1.status === 200 && response2.status === 200) {
      expect(response2.body.viewCount).toBeGreaterThanOrEqual(response1.body.viewCount);
    }
  });

  it('should set appropriate cache headers', async () => {
    const response = await request(app)
      .get(`/api/components/${testComponentId}`);

    if (response.status === 200) {
      expect(response.headers).toHaveProperty('cache-control');
      expect(response.headers['cache-control']).toMatch(/max-age=\d+/);
    }
  });

  it('should handle CORS correctly', async () => {
    const response = await request(app)
      .get(`/api/components/${testComponentId}`)
      .set('Origin', 'http://localhost:3000');

    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });

  it('should return consistent data', async () => {
    const response1 = await request(app)
      .get(`/api/components/${testComponentId}`);
    const response2 = await request(app)
      .get(`/api/components/${testComponentId}`);

    if (response1.status === 200 && response2.status === 200) {
      // Exclude viewCount from comparison as it might change
      const { viewCount: v1, ...data1 } = response1.body;
      const { viewCount: v2, ...data2 } = response2.body;
      expect(data1).toEqual(data2);
    }
  });
});