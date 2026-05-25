import { redis } from '../services/cache.js';
import config     from '../config.js';

const startTime = Date.now();

export default async function healthRoute(app) {
  app.get('/health', async (_request, reply) => {
    const checks = await Promise.allSettled([
      redis.ping(),
      fetch(`${config.duffel.baseUrl}/air/cabin_classes`, {
        headers: {
          'Authorization':  `Bearer ${config.duffel.apiKey}`,
          'Duffel-Version': config.duffel.version,
        },
      }).then(r => r.ok ? 'ok' : 'degraded'),
    ]);

    const redisStatus  = checks[0].status === 'fulfilled' ? 'ok' : 'error';
    const duffelStatus = checks[1].status === 'fulfilled' ? checks[1].value : 'error';
    const overall      = redisStatus === 'ok' && duffelStatus === 'ok' ? 'ok' : 'degraded';

    return reply.status(overall === 'ok' ? 200 : 503).send({
      status:   overall,
      providers: {
        redis:  redisStatus,
        duffel: duffelStatus,
        fr24:   config.fr24.apiKey ? 'configured' : 'not_configured',
      },
      uptime_s: (Date.now() - startTime) / 1000,
    });
  });
}
