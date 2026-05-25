const RETRYABLE = new Set([429, 503, 504]);

/**
 * Retry a function up to `attempts` times with exponential back-off.
 * Only retries on transient HTTP errors (429, 503, 504).
 */
export async function withRetry(fn, { attempts = 3, baseDelayMs = 300 } = {}) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!RETRYABLE.has(err.statusCode)) throw err;
      const delay = baseDelayMs * 2 ** i;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}
