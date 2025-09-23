import { Application, Router } from 'express';
import { sourcesRouter } from './sources.routes';
import { typesRouter } from './types.routes';
import { componentsRouter } from './components.routes';
import { searchRouter } from './search.routes';
import { statsRouter } from './stats.routes';
import { crawlRouter } from './crawl.routes';

export function setupRoutes(app: Application): void {
  const apiRouter = Router();

  // Mount route handlers
  apiRouter.use('/sources', sourcesRouter);
  apiRouter.use('/types', typesRouter);
  apiRouter.use('/components', componentsRouter);
  apiRouter.use('/search', searchRouter);
  apiRouter.use('/stats', statsRouter);
  apiRouter.use('/crawl', crawlRouter);

  // Mount API router
  app.use('/api', apiRouter);

  // API documentation endpoint
  app.get('/api', (req, res) => {
    res.json({
      message: 'ShadCN Component Aggregator API',
      version: '1.0.0',
      endpoints: {
        sources: '/api/sources',
        types: '/api/types',
        components: '/api/components',
        search: '/api/search',
        stats: '/api/stats',
        crawl: '/api/crawl',
      },
      documentation: '/api-docs',
    });
  });
}