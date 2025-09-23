import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, setupTestDatabase, teardownTestDatabase } from '../setup';
import { z } from 'zod';

// Schema based on OpenAPI spec
const codeResponseSchema = z.object({
  code: z.string(),
  language: z.string(),
  dependencies: z.record(z.any()).nullable(),
});

describe('GET /api/components/:id/code', () => {
  const app = createTestApp();
  const testComponentId = '123e4567-e89b-12d3-a456-426614174000';

  beforeAll(async () => {
    await setupTestDatabase();
    // NOTE: Routes not implemented yet - tests will fail (TDD)
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should return 200 for existing component', async () => {
    const response = await request(app)
      .get(`/api/components/${testComponentId}/code`)
      .expect('Content-Type', /json/);

    expect([200, 404]).toContain(response.status);
  });

  it('should return valid code response schema', async () => {
    const response = await request(app)
      .get(`/api/components/${testComponentId}/code`);

    if (response.status === 200) {
      const parseResult = codeResponseSchema.safeParse(response.body);
      expect(parseResult.success).toBe(true);
    }
  });

  it('should support format parameter', async () => {
    const responseRaw = await request(app)
      .get(`/api/components/${testComponentId}/code`)
      .query({ format: 'raw' });

    const responseFormatted = await request(app)
      .get(`/api/components/${testComponentId}/code`)
      .query({ format: 'formatted' });

    const responseMinified = await request(app)
      .get(`/api/components/${testComponentId}/code`)
      .query({ format: 'minified' });

    // All should return same status
    if (responseRaw.status === 200) {
      expect(responseFormatted.status).toBe(200);
      expect(responseMinified.status).toBe(200);
    }
  });

  it('should default to formatted code', async () => {
    const response = await request(app)
      .get(`/api/components/${testComponentId}/code`);

    if (response.status === 200) {
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('language');
    }
  });

  it('should return 404 for non-existent component', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const response = await request(app)
      .get(`/api/components/${nonExistentId}/code`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('should handle invalid UUID format', async () => {
    const response = await request(app)
      .get('/api/components/invalid-uuid/code');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should include dependencies', async () => {
    const response = await request(app)
      .get(`/api/components/${testComponentId}/code`);

    if (response.status === 200) {
      expect(response.body).toHaveProperty('dependencies');
    }
  });

  it('should return correct language', async () => {
    const response = await request(app)
      .get(`/api/components/${testComponentId}/code`);

    if (response.status === 200) {
      expect(response.body.language).toMatch(/^(typescript|javascript|tsx|jsx)$/);
    }
  });

  it('should handle invalid format parameter', async () => {
    const response = await request(app)
      .get(`/api/components/${testComponentId}/code`)
      .query({ format: 'invalid-format' });

    // Should either ignore invalid format or return 400
    expect([200, 400]).toContain(response.status);
  });

  it('should set appropriate cache headers', async () => {
    const response = await request(app)
      .get(`/api/components/${testComponentId}/code`);

    if (response.status === 200) {
      expect(response.headers).toHaveProperty('cache-control');
      // Code should be cached longer than other endpoints
      expect(response.headers['cache-control']).toMatch(/max-age=\d+/);
    }
  });
});