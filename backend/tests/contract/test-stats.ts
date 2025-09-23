import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, setupTestDatabase, teardownTestDatabase } from '../setup';
import { z } from 'zod';

// Schema based on OpenAPI spec
const statsResponseSchema = z.object({
  totalComponents: z.number(),
  totalSources: z.number(),
  totalTypes: z.number(),
  lastUpdateTime: z.string().nullable(),
  popularComponents: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    thumbnailUrl: z.string().url().nullable(),
    tags: z.array(z.string()),
    viewCount: z.number(),
  })).optional(),
});

describe('GET /api/stats', () => {
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
      .get('/api/stats')
      .expect('Content-Type', /json/);

    expect(response.status).toBe(200);
  });

  it('should return valid stats schema', async () => {
    const response = await request(app)
      .get('/api/stats');

    const parseResult = statsResponseSchema.safeParse(response.body);
    expect(parseResult.success).toBe(true);
  });

  it('should include all required stats', async () => {
    const response = await request(app)
      .get('/api/stats');

    expect(response.body).toHaveProperty('totalComponents');
    expect(response.body).toHaveProperty('totalSources');
    expect(response.body).toHaveProperty('totalTypes');
    expect(response.body).toHaveProperty('lastUpdateTime');
  });

  it('should return non-negative counts', async () => {
    const response = await request(app)
      .get('/api/stats');

    expect(response.body.totalComponents).toBeGreaterThanOrEqual(0);
    expect(response.body.totalSources).toBeGreaterThanOrEqual(0);
    expect(response.body.totalTypes).toBeGreaterThanOrEqual(0);
  });

  it('should include popular components', async () => {
    const response = await request(app)
      .get('/api/stats');

    if (response.body.popularComponents) {
      expect(Array.isArray(response.body.popularComponents)).toBe(true);
      // Popular components should be sorted by viewCount
      if (response.body.popularComponents.length > 1) {
        const viewCounts = response.body.popularComponents.map((c: any) => c.viewCount);
        const sortedViewCounts = [...viewCounts].sort((a, b) => b - a);
        expect(viewCounts).toEqual(sortedViewCounts);
      }
    }
  });

  it('should return valid date format for lastUpdateTime', async () => {
    const response = await request(app)
      .get('/api/stats');

    if (response.body.lastUpdateTime) {
      const date = new Date(response.body.lastUpdateTime);
      expect(date.toString()).not.toBe('Invalid Date');
    }
  });

  it('should cache stats appropriately', async () => {
    const response = await request(app)
      .get('/api/stats');

    expect(response.headers).toHaveProperty('cache-control');
    // Stats can be cached for a short time
    expect(response.headers['cache-control']).toMatch(/max-age=\d+/);
  });

  it('should handle CORS correctly', async () => {
    const response = await request(app)
      .get('/api/stats')
      .set('Origin', 'http://localhost:3000');

    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });

  it('should return consistent data', async () => {
    const response1 = await request(app).get('/api/stats');
    const response2 = await request(app).get('/api/stats');

    // Stats should be relatively stable within a short time
    if (response1.status === 200 && response2.status === 200) {
      expect(response1.body.totalSources).toBe(response2.body.totalSources);
      expect(response1.body.totalTypes).toBe(response2.body.totalTypes);
    }
  });

  it('should be accessible without authentication', async () => {
    const response = await request(app)
      .get('/api/stats');

    // Stats endpoint should be public
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });
});