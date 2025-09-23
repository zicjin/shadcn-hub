import { sql } from './config';
import * as dotenv from 'dotenv';

dotenv.config();

async function reset(): Promise<void> {
  console.log('⚠️  WARNING: This will drop all tables and data!');
  console.log('Press Ctrl+C within 5 seconds to cancel...');

  // Give user time to cancel
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('🔄 Resetting database...');

  try {
    // Drop all tables in reverse dependency order
    await sql`DROP TABLE IF EXISTS search_logs CASCADE`;
    await sql`DROP TABLE IF EXISTS user_favorites CASCADE`;
    await sql`DROP TABLE IF EXISTS crawl_jobs CASCADE`;
    await sql`DROP TABLE IF EXISTS component_instances CASCADE`;
    await sql`DROP TABLE IF EXISTS components CASCADE`;
    await sql`DROP TABLE IF EXISTS component_types CASCADE`;
    await sql`DROP TABLE IF EXISTS source_websites CASCADE`;

    // Drop enums
    await sql`DROP TYPE IF EXISTS license_type CASCADE`;
    await sql`DROP TYPE IF EXISTS crawl_status CASCADE`;
    await sql`DROP TYPE IF EXISTS code_language CASCADE`;
    await sql`DROP TYPE IF EXISTS crawl_job_status CASCADE`;

    console.log('✅ All tables and types dropped successfully');

    // Close the connection
    await sql.end();

    console.log('💡 Run "npm run db:migrate" to recreate tables');
    console.log('💡 Run "npm run db:seed" to populate with initial data');

    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error);
    await sql.end();
    process.exit(1);
  }
}

// Run reset if this file is executed directly
if (require.main === module) {
  reset().catch(console.error);
}

export { reset };