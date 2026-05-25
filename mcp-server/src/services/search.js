import { searchOffers } from '../providers/duffel.js';
import { mapOffer }     from './mapper.js';
import { getOrSet }     from './cache.js';
import config           from '../config.js';

// ── Date helpers ────────────────────────────────────────────────────────────

function expandDates(baseDate, flexDays) {
  const dates = [];
  const base  = new Date(baseDate);
  for (let d = -flexDays; d <= flexDays; d++) {
    const dt = new Date(base);
    dt.setUTCDate(dt.getUTCDate() + d);
    dates.push(dt.toISOString().slice(0, 10));
  }
  return dates;
}

/**
 * Build all date combinations to search.
 * - one_way / round_trip: cartesian product of expanded dates per slice
 * - multi_city: expand only first slice date to keep search count manageable
 */
function buildCombinations(baseSlices, sliceGroups, tripType) {
  if (tripType === 'multi_city') {
    return sliceGroups[0].map(date => [
      { ...baseSlices[0], departure_date: date },
      ...baseSlices.slice(1),
    ]);
  }

  // Cartesian product
  let combinations = [[]];
  for (let i = 0; i < baseSlices.length; i++) {
    const next = [];
    for (const existing of combinations) {
      for (const date of sliceGroups[i]) {
        next.push([...existing, { ...baseSlices[i], departure_date: date }]);
      }
    }
    combinations = next;
  }
  return combinations;
}

// ── Dedup / filter / sort ───────────────────────────────────────────────────

function deduplicateOffers(offers) {
  const seen = new Set();
  return offers.filter(o => {
    const key = o.slices
      .flatMap(sl => sl.segments.map(s => `${s.flight_number}|${s.departing_at}`))
      .join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function filterByAirlines(offers, airlines) {
  if (!airlines?.length) return offers;
  return offers.filter(o =>
    o.slices.some(sl =>
      sl.segments.some(seg => airlines.includes(seg.airline.iata_code))
    )
  );
}

const totalDuration = o => o.slices.reduce((t, sl) => t + sl.duration_minutes, 0);

function sortOffers(offers, by) {
  return [...offers].sort((a, b) => {
    if (by === 'price')     return parseFloat(a.total_amount) - parseFloat(b.total_amount);
    if (by === 'duration')  return totalDuration(a) - totalDuration(b);
    if (by === 'departure') {
      const da = a.slices[0]?.segments[0]?.departing_at ?? '';
      const db = b.slices[0]?.segments[0]?.departing_at ?? '';
      return da.localeCompare(db);
    }
    return 0;
  });
}

// ── Pagination ──────────────────────────────────────────────────────────────

const encodeCursor = i  => Buffer.from(String(i)).toString('base64');
const decodeCursor = c  => parseInt(Buffer.from(c, 'base64').toString(), 10);
const generateSearchId  = () => `srch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ── Main export ─────────────────────────────────────────────────────────────

export async function runSearch(params) {
  const flexDays   = Math.min(params.date_flex_days ?? 0, 3);
  const sliceGroups = params.slices.map(s => expandDates(s.departure_date, flexDays));
  const dateCombinations = buildCombinations(params.slices, sliceGroups, params.trip_type);

  // Fan out all date combos in parallel; degrade gracefully on provider errors
  const tasks = dateCombinations.map(slices => {
    const cacheKey = `search:${JSON.stringify({
      slices,
      passengers:  params.passengers,
      cabin_class: params.cabin_class,
    })}`;

    return getOrSet(cacheKey, config.cache.searchTtl, () =>
      searchOffers({ ...params, slices })
        .then(result => (result.offers ?? []).map(mapOffer))
        .catch(err => {
          if (err.statusCode >= 500) return []; // graceful degradation
          throw err;
        })
    );
  });

  const resultsNested = await Promise.all(tasks);
  let offers = resultsNested.flat();

  offers = deduplicateOffers(offers);
  offers = filterByAirlines(offers, params.airlines);
  offers = sortOffers(offers, params.sort_by || 'price');

  // Paginate
  const limit      = Math.min(params.limit ?? 20, 100);
  const cursor     = params.after ? decodeCursor(params.after) : 0;
  const page       = offers.slice(cursor, cursor + limit);
  const nextCursor = cursor + limit < offers.length ? encodeCursor(cursor + limit) : null;

  const allDates = [...new Set(
    dateCombinations.flatMap(combo => combo.map(s => s.departure_date))
  )].sort();

  return {
    search_id:      generateSearchId(),
    offers:         page,
    total:          offers.length,
    next_cursor:    nextCursor,
    searched_dates: allDates,
    cached:         false,
  };
}
