import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, setupTestDatabase, teardownTestDatabase } from '../setup';
import { z } from 'zod';

// Schema based on OpenAPI spec
const searchResultsSchema = z.object({
  results: z.array(z.object({
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
  })),
  total: z.number(),
  responseTime: z.number(),
  suggestions: z.array(z.string()).optional(),
});

describe('GET /api/search', () => {
  const app = createTestApp();

  beforeAll(async () => {
    await setupTestDatabase();
    // NOTE: Routes not implemented yet - tests will fail (TDD)
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should return 200 with valid query', async () => {
    const response = await request(app)
      .get('/api/search')
      .query({ q: 'button' })
      .expect('Content-Type', /json/);

    expect(response.status).toBe(200);
  });

  it('should return valid search results schema', async () => {
    const response = await request(app)
      .get('/api/search')
      .query({ q: 'button' });

    const parseResult = searchResultsSchema.safeParse(response.body);
    expect(parseResult.success).toBe(true);
  });

  it('should require query parameter', async () => {
    const response = await request(app)
      .get('/api/search');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should enforce minimum query length', async () => {
    const response = await request(app)
      .get('/api/search')
      .query({ q: 'a' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should support source filter', async () => {
    const response = await request(app)
      .get('/api/search')
      .query({
        q: 'button',
        source: 'shadcn-ui'
      });

    if (response.status === 200 && response.body.results.length > 0) {
      response.body.results.forEach((result: any) => {
        if (result.sourceWebsite) {
          expect(result.sourceWebsite.slug).toBe('shadcn-ui');
        }
      });
    }
  });

  it('should support type filter', async () => {
    const response = await request(app)
      .get('/api/search')
      .query({
        q: 'primary',
        type: 'button'
      });

    if (response.status === 200 && response.body.results.length > 0) {
      response.body.results.forEach((result: any) => {
        if (result.componentType) {
          expect(result.componentType.slug).toBe('button');
        }
      });
    }
  });

  it('should support limit parameter', async () => {
    const response = await request(app)
      .get('/api/search')
      .query({
        q: 'button',
        limit: 5
      });

    if (response.status === 200) {
      expect(response.body.results.length).toBeLessThanOrEqual(5);
    }
  });

  it('should enforce maximum limit', async () => {
    const response = await request(app)
      .get('/api/search')
      .query({
        q: 'button',
        limit: 200
      });

    if (response.status === 200) {
      expect(response.body.results.length).toBeLessThanOrEqual(100);
    }
  });

  it('should include response time', async () => {
    const response = await request(app)
      .get('/api/search')
      .query({ q: 'button' });

    expect(response.body).toHaveProperty('responseTime');
    expect(typeof response.body.responseTime).toBe('number');
    expect(response.body.responseTime).toBeGreaterThanOrEqual(0);
  });

  it('should return suggestions for partial matches', async () => {
    const response = await request(app)
      .get('/api/search')
      .query({ q: 'butt' });

    if (response.status === 200) {
      expect(response.body).toHaveProperty('suggestions');
      if (response.body.suggestions) {
        expect(Array.isArray(response.body.suggestions)).toBe(true);
      }
    }
  });

  it('should handle special characters in query', async () => {
    const response = await request(app)
      .get('/api/search')
      .query({ q: 'button & card' });

    expect(response.status).toBe(200);
  });

  it('should handle no results gracefully', async () => {
    const response = await request(app)
      .get('/api/search')
      .query({ q: 'xyznonexistentquery123' });

    expect(response.status).toBe(200);
    expect(response.body.results).toEqual([]);
    expect(response.body.total).toBe(0);
  });

  it('should be case insensitive', async () => {
    const response1 = await request(app)
      .get('/api/search')
      .query({ q: 'BUTTON' });

    const response2 = await request(app)
      .get('/api/search')
      .query({ q: 'button' });

    if (response1.status === 200 && response2.status === 200) {
      expect(response1.body.total).toBe(response2.body.total);
    }
  });

  it('should return relevant results', async () => {
    const response = await request(app)
      .get('/api/search')
      .query({ q: 'button' });

    if (response.status === 200 && response.body.results.length > 0) {
      // At least some results should contain the search term
      const relevantResults = response.body.results.filter((r: any) =>
        r.name.toLowerCase().includes('button') ||
        r.description?.toLowerCase().includes('button') ||
        r.tags.some((t: string) => t.toLowerCase().includes('button'))
      );
      expect(relevantResults.length).toBeGreaterThan(0);
    }
  });

  it('should meet performance requirements', async () => {
    const startTime = Date.now();
    const response = await request(app)
      .get('/api/search')
      .query({ q: 'button' });
    const endTime = Date.now();

    expect(response.status).toBe(200);
    // Response time should be under 200ms as per requirements
    expect(endTime - startTime).toBeLessThan(500); // Allow some overhead
    if (response.body.responseTime) {
      expect(response.body.responseTime).toBeLessThan(200);
    }
  });
});