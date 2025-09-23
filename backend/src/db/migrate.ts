import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, sql } from './config';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigrations(): Promise<void> {
  console.log('🚀 Starting database migrations...');

  try {
    // Enable extensions
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    await sql`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`;
    console.log('✅ Extensions enabled');

    // Run migrations
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    console.log('✅ Migrations completed successfully');

    // Close the connection
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sql.end();
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations().catch(console.error);
}

export { runMigrations };