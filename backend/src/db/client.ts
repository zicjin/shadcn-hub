import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/shadcn_aggregator';

// Connection pool configuration
const poolConfig = {
  max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Maximum number of connections
  idle_timeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '20', 10), // Idle timeout in seconds
  connect_timeout: parseInt(process.env.DB_POOL_CONNECT_TIMEOUT || '10', 10), // Connection timeout in seconds
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  onnotice: () => {}, // Suppress notice messages in production
};

// Create the connection pool
const queryClient = postgres(connectionString, poolConfig);

// Create the database instance with schema
export const db = drizzle(queryClient, { schema });

// Export the query client for raw queries and connection management
export { queryClient };

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database connections...');
  await queryClient.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database connections...');
  await queryClient.end();
  process.exit(0);
});