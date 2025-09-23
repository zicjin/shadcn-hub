import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, setupTestDatabase, teardownTestDatabase } from '../setup';
import { z } from 'zod';

// Schema based on OpenAPI spec
const sourceWebsiteSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  url: z.string().url(),
  description: z.string().nullable(),
  logoUrl: z.string().url().nullable(),
  licenseType: z.enum(['MIT', 'Apache', 'Commercial', 'Mixed']),
  componentCount: z.number(),
  lastCrawledAt: z.string().nullable(),
});

const sourcesResponseSchema = z.object({
  sources: z.array(sourceWebsiteSchema),
  total: z.number(),
});

describe('GET /api/sources', () => {
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
      .get('/api/sources')
      .expect('Content-Type', /json/);

    expect(response.status).toBe(200);
  });

  it('should return valid response schema', async () => {
    const response = await request(app)
      .get('/api/sources');

    const parseResult = sourcesResponseSchema.safeParse(response.body);
    expect(parseResult.success).toBe(true);
  });

  it('should return array of source websites', async () => {
    const response = await request(app)
      .get('/api/sources');

    expect(response.body).toHaveProperty('sources');
    expect(Array.isArray(response.body.sources)).toBe(true);
  });

  it('should return total count', async () => {
    const response = await request(app)
      .get('/api/sources');

    expect(response.body).toHaveProperty('total');
    expect(typeof response.body.total).toBe('number');
  });

  it('should include all required fields for each source', async () => {
    const response = await request(app)
      .get('/api/sources');

    if (response.body.sources && response.body.sources.length > 0) {
      const source = response.body.sources[0];
      expect(source).toHaveProperty('id');
      expect(source).toHaveProperty('name');
      expect(source).toHaveProperty('slug');
      expect(source).toHaveProperty('url');
      expect(source).toHaveProperty('licenseType');
      expect(source).toHaveProperty('componentCount');
    }
  });

  it('should handle empty results gracefully', async () => {
    // Clear database
    await setupTestDatabase();

    const response = await request(app)
      .get('/api/sources');

    expect(response.status).toBe(200);
    expect(response.body.sources).toEqual([]);
    expect(response.body.total).toBe(0);
  });

  it('should return sources in consistent order', async () => {
    const response1 = await request(app).get('/api/sources');
    const response2 = await request(app).get('/api/sources');

    expect(response1.body.sources).toEqual(response2.body.sources);
  });

  it('should handle CORS headers correctly', async () => {
    const response = await request(app)
      .get('/api/sources')
      .set('Origin', 'http://localhost:3000');

    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });

  it('should compress response for large payloads', async () => {
    const response = await request(app)
      .get('/api/sources')
      .set('Accept-Encoding', 'gzip, deflate');

    if (response.body.sources && response.body.sources.length > 10) {
      expect(response.headers['content-encoding']).toMatch(/gzip|deflate/);
    }
  });

  it('should cache responses appropriately', async () => {
    const response = await request(app)
      .get('/api/sources');

    expect(response.headers).toHaveProperty('cache-control');
    expect(response.headers['cache-control']).toMatch(/max-age=\d+/);
  });
});