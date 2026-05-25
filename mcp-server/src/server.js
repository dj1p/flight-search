import Fastify       from 'fastify';
import fastifyCors   from '@fastify/cors';
import fastifyRedis  from '@fastify/redis';
import config        from './config.js';
import authMiddleware   from './middleware/auth.js';
import rateLimitPlugin  from './middleware/rateLimit.js';
import searchRoute      from './routes/search.js';
import offersRoute      from './routes/offers.js';
import liveStatusRoute  from './routes/liveStatus.js';
import healthRoute      from './routes/health.js';
import logger           from './utils/logger.js';

const app = Fastify({ logger });

// CORS
await app.register(fastifyCors, {
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-MCP-Key'],
});

// Redis
await app.register(fastifyRedis, { url: config.redis.url, closeClient: true });

// Auth hook (skips /health)
app.addHook('onRequest', authMiddleware);

// Rate limiting
await app.register(rateLimitPlugin);

// Routes
await app.register(searchRoute,     { prefix: '/v1' });
await app.register(offersRoute,     { prefix: '/v1' });
await app.register(liveStatusRoute, { prefix: '/v1' });
await app.register(healthRoute,     { prefix: '/v1' });

// Global error handler
app.setErrorHandler((error, request, reply) => {
  request.log.error({ err: error }, 'Unhandled error');
  const status = error.statusCode || 500;
  reply.status(status).send({
    error: error.message,
    code:  error.code || 'INTERNAL_ERROR',
  });
});

// Start
try {
  await app.listen({ port: Number(config.port), host: '0.0.0.0' });
  app.log.info(`MCP server running on port ${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
