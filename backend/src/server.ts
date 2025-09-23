import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import * as dotenv from 'dotenv';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/error.middleware';
import { loggingMiddleware } from './middleware/logging.middleware';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.API_PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api', limiter);

// Logging middleware
app.use(loggingMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Setup API routes
setupRoutes(app);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
async function startServer(): Promise<void> {
  try {
    app.listen(PORT, () => {
      logger.info(`🚀 Server is running on http://localhost:${PORT}`);
      logger.info(`📝 API docs available at http://localhost:${PORT}/api-docs`);
      logger.info(`🏥 Health check at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server if this file is run directly
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Server startup failed:', error);
    process.exit(1);
  });
}

export { app, startServer };