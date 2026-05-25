import { createClient } from 'redis';
import config from '../config.js';
import logger  from '../utils/logger.js';

const client = createClient({ url: config.redis.url });
client.on('error', err => logger.error({ event: 'redis_error', err: err.message }));
await client.connect();

/**
 * Get a cached value or compute + store it.
 */
export async function getOrSet(key, ttlSeconds, fetchFn) {
  try {
    const cached = await client.get(key);
    if (cached) return JSON.parse(cached);
  } catch (_) {
    // Redis miss/error — fall through to fetchFn
  }

  const value = await fetchFn();
  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (_) {
    // Non-fatal — continue without caching
  }
  return value;
}

export async function del(key) {
  await client.del(key);
}

export { client as redis };
