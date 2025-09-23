import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, setupTestDatabase, teardownTestDatabase } from '../setup';
import { z } from 'zod';

// Schema based on OpenAPI spec
const sourceWebsiteDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  url: z.string().url(),
  description: z.string().nullable(),
  logoUrl: z.string().url().nullable(),
  licenseType: z.enum(['MIT', 'Apache', 'Commercial', 'Mixed']),
  componentCount: z.number(),
  lastCrawledAt: z.string().nullable(),
  crawlStatus: z.enum(['pending', 'running', 'success', 'failed']).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

describe('GET /api/sources/:slug', () => {
  const app = createTestApp();
  const testSlug = 'shadcn-ui';

  beforeAll(async () => {
    await setupTestDatabase();
    // NOTE: Routes not implemented yet - tests will fail (TDD)
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should return 200 for existing source', async () => {
    const response = await request(app)
      .get(`/api/sources/${testSlug}`)
      .expect('Content-Type', /json/);

    expect(response.status).toBe(200);
  });

  it('should return valid source detail schema', async () => {
    const response = await request(app)
      .get(`/api/sources/${testSlug}`);

    if (response.status === 200) {
      const parseResult = sourceWebsiteDetailSchema.safeParse(response.body);
      expect(parseResult.success).toBe(true);
    }
  });

  it('should return 404 for non-existent source', async () => {
    const response = await request(app)
      .get('/api/sources/non-existent-source');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('should handle invalid slug format', async () => {
    const response = await request(app)
      .get('/api/sources/Invalid Slug!');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return correct source by slug', async () => {
    const response = await request(app)
      .get(`/api/sources/${testSlug}`);

    if (response.status === 200) {
      expect(response.body.slug).toBe(testSlug);
    }
  });

  it('should include all required fields', async () => {
    const response = await request(app)
      .get(`/api/sources/${testSlug}`);

    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('slug');
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('licenseType');
      expect(response.body).toHaveProperty('componentCount');
    }
  });

  it('should handle special characters in slug', async () => {
    const response = await request(app)
      .get('/api/sources/test-slug-123');

    // Should either return 200 with data or 404 if not found
    expect([200, 404]).toContain(response.status);
  });

  it('should set appropriate cache headers', async () => {
    const response = await request(app)
      .get(`/api/sources/${testSlug}`);

    if (response.status === 200) {
      expect(response.headers).toHaveProperty('cache-control');
      expect(response.headers['cache-control']).toMatch(/max-age=\d+/);
    }
  });

  it('should handle CORS correctly', async () => {
    const response = await request(app)
      .get(`/api/sources/${testSlug}`)
      .set('Origin', 'http://localhost:3000');

    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });

  it('should return consistent data format', async () => {
    const response1 = await request(app).get(`/api/sources/${testSlug}`);
    const response2 = await request(app).get(`/api/sources/${testSlug}`);

    if (response1.status === 200 && response2.status === 200) {
      expect(response1.body).toEqual(response2.body);
    }
  });
});