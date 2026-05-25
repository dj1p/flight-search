import config from '../config.js';
import { withRetry } from '../utils/retry.js';

const BASE = config.fr24.baseUrl;

function headers() {
  return {
    'Accept':          'application/json',
    'Accept-Version':  'v1',
    'Authorization':   `Bearer ${config.fr24.apiKey}`,
  };
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!res.ok) {
    const e = new Error(`FR24 error ${res.status} for ${path}`);
    e.statusCode = res.status;
    e.degraded   = true; // Caller will gracefully degrade, not hard-fail
    throw e;
  }
  return res.json();
}

/**
 * Look up live/recent status for an IATA flight number (e.g. TG661).
 */
export async function getFlightStatus(flightNumber, date) {
  const q = new URLSearchParams({ query: flightNumber, fetchBy: 'flight' });
  if (date) q.set('date', date);
  return withRetry(() => get(`/flights/search?${q}`));
}

/**
 * Get detailed position data for a specific FR24 internal flight id.
 */
export async function getFlightDetails(fr24Id) {
  return withRetry(() => get(`/flights/${fr24Id}/positions/live`));
}
