import { getFlightStatus } from '../providers/fr24.js';
import { getOrSet }        from '../services/cache.js';
import config              from '../config.js';

export default async function liveStatusRoute(app) {
  app.get('/live-status/:flightId', async (request, reply) => {
    const { flightId } = request.params;
    const { date }     = request.query;

    // Basic sanity check on flight number format (e.g. TG661, BA007)
    if (!flightId || !/^[A-Z0-9]{2,3}\d{1,4}$/.test(flightId.toUpperCase())) {
      return reply.status(400).send({ error: 'Invalid flight id format', code: 'BAD_REQUEST' });
    }

    const cacheKey = `live:${flightId.toUpperCase()}:${date ?? 'today'}`;

    let status;
    try {
      status = await getOrSet(cacheKey, config.cache.liveStatusTtl, async () => {
        const data = await getFlightStatus(flightId.toUpperCase(), date);
        return mapFR24Status(flightId.toUpperCase(), data);
      });
    } catch (err) {
      if (err.degraded) {
        // FR24 unavailable — graceful degradation
        return reply.send({
          flight_id: flightId.toUpperCase(),
          status:    'unknown',
          source:    'unavailable',
        });
      }
      throw err;
    }

    return reply.send(status);
  });
}

function mapFR24Status(flightId, data) {
  const flight = data?.data?.[0] ?? {};
  const live   = flight.live ?? {};

  return {
    flight_id:     flightId,
    status:        mapStatus(flight.status),
    delay_minutes: flight.delay ?? 0,
    position: live.latitude != null ? {
      lat:         live.latitude,
      lng:         live.longitude,
      altitude_ft: live.altitude   ?? null,
      speed_kts:   live.speed_kts  ?? null,
      heading:     live.heading    ?? null,
    } : null,
    estimated_arrival: flight.time?.estimated?.arrival
      ? new Date(flight.time.estimated.arrival * 1000).toISOString()
      : null,
    source: 'flightradar24',
  };
}

function mapStatus(fr24Status) {
  const map = {
    scheduled: 'scheduled',
    active:    'active',
    landed:    'landed',
    cancelled: 'cancelled',
    diverted:  'diverted',
  };
  return map[fr24Status?.toLowerCase()] ?? 'unknown';
}
