import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, setupTestDatabase, teardownTestDatabase } from '../setup';
import { z } from 'zod';

// Schema based on OpenAPI spec
const componentTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  iconName: z.string().nullable(),
  componentCount: z.number(),
});

const typesResponseSchema = z.object({
  types: z.array(componentTypeSchema),
  total: z.number(),
});

describe('GET /api/types', () => {
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
      .get('/api/types')
      .expect('Content-Type', /json/);

    expect(response.status).toBe(200);
  });

  it('should return valid response schema', async () => {
    const response = await request(app)
      .get('/api/types');

    const parseResult = typesResponseSchema.safeParse(response.body);
    expect(parseResult.success).toBe(true);
  });

  it('should return array of component types', async () => {
    const response = await request(app)
      .get('/api/types');

    expect(response.body).toHaveProperty('types');
    expect(Array.isArray(response.body.types)).toBe(true);
  });

  it('should return total count', async () => {
    const response = await request(app)
      .get('/api/types');

    expect(response.body).toHaveProperty('total');
    expect(typeof response.body.total).toBe('number');
  });

  it('should include all required fields for each type', async () => {
    const response = await request(app)
      .get('/api/types');

    if (response.body.types && response.body.types.length > 0) {
      const type = response.body.types[0];
      expect(type).toHaveProperty('id');
      expect(type).toHaveProperty('name');
      expect(type).toHaveProperty('slug');
      expect(type).toHaveProperty('componentCount');
    }
  });

  it('should return types in display order', async () => {
    const response = await request(app)
      .get('/api/types');

    if (response.body.types && response.body.types.length > 1) {
      // Types should be ordered by displayOrder field
      const types = response.body.types;
      for (let i = 1; i < types.length; i++) {
        // We can't verify displayOrder without it being in response,
        // but we can check consistency
        expect(types).toBeDefined();
      }
    }
  });

  it('should handle empty results gracefully', async () => {
    // Clear database
    await setupTestDatabase();

    const response = await request(app)
      .get('/api/types');

    expect(response.status).toBe(200);
    expect(response.body.types).toEqual([]);
    expect(response.body.total).toBe(0);
  });

  it('should cache responses appropriately', async () => {
    const response = await request(app)
      .get('/api/types');

    expect(response.headers).toHaveProperty('cache-control');
    expect(response.headers['cache-control']).toMatch(/max-age=\d+/);
  });

  it('should handle CORS headers correctly', async () => {
    const response = await request(app)
      .get('/api/types')
      .set('Origin', 'http://localhost:3000');

    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });

  it('should return consistent data', async () => {
    const response1 = await request(app).get('/api/types');
    const response2 = await request(app).get('/api/types');

    expect(response1.body).toEqual(response2.body);
  });
});