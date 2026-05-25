import 'dotenv/config';

export default {
  port: process.env.PORT || 3001,
  mcpApiKeys: (process.env.MCP_API_KEYS || '').split(',').filter(Boolean),
  duffel: {
    apiKey:  process.env.DUFFEL_API_KEY,
    baseUrl: 'https://api.duffel.com',
    version: 'v2',
  },
  fr24: {
    apiKey:  process.env.FR24_API_KEY,
    baseUrl: 'https://fr24api.flightradar24.com/v1',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  cache: {
    searchTtl:    300,  // 5 min
    offerTtl:      60,  // 1 min — prices are volatile
    liveStatusTtl: 30,  // 30 sec
  },
  rateLimit: {
    max:      60,
    windowMs: 60_000,
  },
  cors: {
    origin: (process.env.CORS_ORIGINS || '*').split(','),
  },
};
