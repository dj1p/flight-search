import fastifyRateLimit from '@fastify/rate-limit';
import config from '../config.js';

export default async function rateLimitPlugin(app) {
  await app.register(fastifyRateLimit, {
    max:        config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
    keyGenerator: (request) =>
      request.headers['x-mcp-key'] || request.ip,
    errorResponseBuilder: (_request, context) => ({
      error:       'Rate limit exceeded',
      code:        'RATE_LIMITED',
      retryAfter:  context.after,
    }),
  });
}
