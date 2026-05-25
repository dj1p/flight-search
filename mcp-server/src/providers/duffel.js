import config from '../config.js';
import { withRetry } from '../utils/retry.js';

const BASE = `${config.duffel.baseUrl}/air`;

function headers() {
  return {
    'Authorization': `Bearer ${config.duffel.apiKey}`,
    'Duffel-Version': config.duffel.version,
    'Content-Type':   'application/json',
    'Accept':         'application/json',
  };
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: headers(),
    body:    JSON.stringify({ data: body }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e   = new Error(err.errors?.[0]?.message || `Duffel error ${res.status}`);
    e.statusCode = res.status;
    throw e;
  }
  return (await res.json()).data;
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!res.ok) {
    const e  = new Error(`Duffel GET error ${res.status}`);
    e.statusCode = res.status;
    throw e;
  }
  return (await res.json()).data;
}

/**
 * Search for offers for a single date/slice combination.
 * Returns raw Duffel offer list.
 */
export async function searchOffers(params) {
  return withRetry(() =>
    post('/offer_requests?return_offers=true', {
      slices: params.slices.map(s => ({
        origin:         s.origin,
        destination:    s.destination,
        departure_date: s.departure_date,
      })),
      passengers:  params.passengers,
      cabin_class: params.cabin_class || 'economy',
      ...(params.max_connections != null
        ? { max_connections: params.max_connections }
        : {}),
    })
  );
}

export async function getOffer(offerId) {
  return withRetry(() => get(`/offers/${offerId}`));
}

export async function getSeatMaps(offerId) {
  return withRetry(() => get(`/seat_maps?offer_id=${offerId}`));
}
