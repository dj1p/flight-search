import config from '../config.js';

export default async function authMiddleware(request, reply) {
  // Health endpoint is public
  if (request.url.startsWith('/v1/health')) return;

  const key = request.headers['x-mcp-key'];

  if (!key || !config.mcpApiKeys.includes(key)) {
    return reply.status(401).send({
      error: 'Invalid or missing API key',
      code:  'UNAUTHORIZED',
    });
  }

  // Audit log — only log key prefix, never the full key
  request.log.info({
    event:      'api_call',
    key_prefix: key.slice(0, 8),
    method:     request.method,
    url:        request.url,
    ip:         request.ip,
  });
}
