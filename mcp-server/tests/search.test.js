/**
 * Tests for the search fan-out, dedup, sort, and pagination logic.
 * Providers and cache are mocked so no real API calls are made.
 */

// ── Inline mocks (must be before any imports of the modules under test) ──────

const mockSearchOffers = jest.fn();
jest.mock('../src/providers/duffel.js', () => ({
  searchOffers: (...args) => mockSearchOffers(...args),
}));

jest.mock('../src/services/cache.js', () => ({
  getOrSet: jest.fn((_key, _ttl, fn) => fn()),
}));

jest.mock('../src/services/mapper.js', () => ({
  mapOffer: jest.fn(o => ({
    ...o,
    slices: [],
  })),
}));

// ── Test suite ───────────────────────────────────────────────────────────────

import { runSearch } from '../src/services/search.js';

const BASE_PARAMS = {
  trip_type:   'one_way',
  slices:      [{ origin: 'BKK', destination: 'LHR', departure_date: '2025-08-15' }],
  passengers:  [{ type: 'adult' }],
  cabin_class: 'economy',
};

beforeEach(() => {
  mockSearchOffers.mockResolvedValue({
    offers: [
      { id: 'a1', total_amount: '300', total_currency: 'USD', base_amount: '240', tax_amount: '60', conditions: {} },
      { id: 'a2', total_amount: '200', total_currency: 'USD', base_amount: '160', tax_amount: '40', conditions: {} },
      { id: 'a3', total_amount: '450', total_currency: 'USD', base_amount: '380', tax_amount: '70', conditions: {} },
    ],
  });
});

afterEach(() => jest.clearAllMocks());

describe('runSearch', () => {
  test('returns results sorted by price (cheapest first)', async () => {
    const result = await runSearch({ ...BASE_PARAMS, sort_by: 'price' });
    const amounts = result.offers.map(o => o.total_amount);
    expect(amounts).toEqual(['200', '300', '450']);
  });

  test('returns correct total count', async () => {
    const result = await runSearch(BASE_PARAMS);
    expect(result.total).toBe(3);
  });

  test('paginates correctly with limit=2', async () => {
    const page1 = await runSearch({ ...BASE_PARAMS, limit: 2 });
    expect(page1.offers).toHaveLength(2);
    expect(page1.next_cursor).toBeTruthy();

    const page2 = await runSearch({ ...BASE_PARAMS, limit: 2, after: page1.next_cursor });
    expect(page2.offers).toHaveLength(1);
    expect(page2.next_cursor).toBeNull();
  });

  test('expands dates when date_flex_days=1 (3 calls)', async () => {
    await runSearch({ ...BASE_PARAMS, date_flex_days: 1 });
    expect(mockSearchOffers).toHaveBeenCalledTimes(3);
  });

  test('no flex = exactly 1 Duffel call', async () => {
    await runSearch({ ...BASE_PARAMS, date_flex_days: 0 });
    expect(mockSearchOffers).toHaveBeenCalledTimes(1);
  });

  test('round_trip with flex=1 makes 3x3=9 calls', async () => {
    await runSearch({
      ...BASE_PARAMS,
      trip_type: 'round_trip',
      slices: [
        { origin: 'BKK', destination: 'LHR', departure_date: '2025-08-15' },
        { origin: 'LHR', destination: 'BKK', departure_date: '2025-08-30' },
      ],
      date_flex_days: 1,
    });
    expect(mockSearchOffers).toHaveBeenCalledTimes(9);
  });

  test('gracefully degrades on provider 500 error (returns empty for that date)', async () => {
    mockSearchOffers
      .mockResolvedValueOnce({ offers: [{ id: 'ok1', total_amount: '100', total_currency: 'USD', base_amount: '80', tax_amount: '20', conditions: {} }] })
      .mockRejectedValueOnce(Object.assign(new Error('Server Error'), { statusCode: 503 }))
      .mockResolvedValueOnce({ offers: [{ id: 'ok2', total_amount: '120', total_currency: 'USD', base_amount: '100', tax_amount: '20', conditions: {} }] });

    const result = await runSearch({ ...BASE_PARAMS, date_flex_days: 1 });
    // Should still return results from the 2 successful calls
    expect(result.offers.length).toBe(2);
  });

  test('search_id has expected prefix', async () => {
    const result = await runSearch(BASE_PARAMS);
    expect(result.search_id).toMatch(/^srch_/);
  });

  test('searched_dates contains the right date for no-flex search', async () => {
    const result = await runSearch(BASE_PARAMS);
    expect(result.searched_dates).toContain('2025-08-15');
  });
});
