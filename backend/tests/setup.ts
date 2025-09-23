import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { db, queryClient } from '../src/db/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

// Test database setup
export async function setupTestDatabase(): Promise<void> {
  // Clear all tables before each test suite
  await queryClient`TRUNCATE TABLE search_logs CASCADE`;
  await queryClient`TRUNCATE TABLE user_favorites CASCADE`;
  await queryClient`TRUNCATE TABLE crawl_jobs CASCADE`;
  await queryClient`TRUNCATE TABLE component_instances CASCADE`;
  await queryClient`TRUNCATE TABLE components CASCADE`;
  await queryClient`TRUNCATE TABLE component_types CASCADE`;
  await queryClient`TRUNCATE TABLE source_websites CASCADE`;
}

export async function teardownTestDatabase(): Promise<void> {
  // Clean up after tests
  await queryClient.end();
}

// Mock Express app for testing
import express from 'express';
import cors from 'cors';
import compression from 'compression';

export function createTestApp(): express.Application {
  const app = express();

  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  return app;
}

// Test data helpers
export const testSourceWebsite = {
  name: 'Test Component Library',
  slug: 'test-library',
  url: 'https://test.example.com',
  description: 'A test component library',
  licenseType: 'MIT' as const,
  isActive: true,
};

export const testComponentType = {
  name: 'Button',
  slug: 'button',
  description: 'Button components',
  displayOrder: 1,
};

export const testComponent = {
  name: 'Primary Button',
  slug: 'primary-button',
  description: 'A primary button component',
  sourceUrl: 'https://test.example.com/components/button',
  sourceCode: '<button className="btn-primary">Click me</button>',
  codeLanguage: 'tsx' as const,
  tags: ['button', 'primary', 'interactive'],
  contentHash: 'a'.repeat(64),
};