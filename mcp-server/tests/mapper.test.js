import { mapOffer } from '../src/services/mapper.js';

const SAMPLE = {
  id:             'off_123',
  total_amount:   '450.00',
  total_currency: 'USD',
  base_amount:    '380.00',
  tax_amount:     '70.00',
  expires_at:     '2025-01-01T12:00:00Z',
  conditions: {
    refund_before_departure: { allowed: true },
    change_before_departure: { allowed: false },
  },
  slices: [{
    segments: [
      {
        operating_carrier: { iata_code: 'TG', name: 'Thai Airways' },
        operating_carrier_flight_number: '661',
        origin:      { iata_code: 'BKK', name: 'Suvarnabhumi' },
        destination: { iata_code: 'DXB', name: 'Dubai Intl' },
        origin_terminal:      'D',
        destination_terminal: '3',
        departing_at: '2025-08-15T00:25:00Z',
        arriving_at:  '2025-08-15T03:55:00Z',
        aircraft: { name: 'Boeing 777-300ER' },
        passengers: [{
          cabin_class:    'economy',
          fare_basis_code: 'YOWGB',
          baggages: [
            { type: 'checked',  quantity: 1 },
            { type: 'carry_on', quantity: 1 },
          ],
        }],
      },
      {
        operating_carrier: { iata_code: 'EK', name: 'Emirates' },
        operating_carrier_flight_number: '7',
        origin:      { iata_code: 'DXB', name: 'Dubai Intl' },
        destination: { iata_code: 'LHR', name: 'Heathrow' },
        origin_terminal:      '3',
        destination_terminal: '2',
        departing_at: '2025-08-15T05:55:00Z',
        arriving_at:  '2025-08-15T10:10:00Z',
        aircraft: { name: 'Airbus A380' },
        passengers: [{
          cabin_class:    'economy',
          fare_basis_code: 'YOWGB',
          baggages: [
            { type: 'checked',  quantity: 1 },
            { type: 'carry_on', quantity: 1 },
          ],
        }],
      },
    ],
  }],
};

describe('mapOffer', () => {
  let offer;
  beforeAll(() => { offer = mapOffer(SAMPLE); });

  test('maps top-level fields', () => {
    expect(offer.id).toBe('off_123');
    expect(offer.total_amount).toBe('450.00');
    expect(offer.total_currency).toBe('USD');
    expect(offer.provider).toBe('duffel');
  });

  test('maps conditions', () => {
    expect(offer.conditions.refundable).toBe(true);
    expect(offer.conditions.changeable).toBe(false);
  });

  test('maps first segment flight number', () => {
    expect(offer.slices[0].segments[0].flight_number).toBe('TG661');
  });

  test('maps second segment flight number', () => {
    expect(offer.slices[0].segments[1].flight_number).toBe('EK7');
  });

  test('computes segment duration correctly', () => {
    // TG661: 00:25 → 03:55 = 210 min
    expect(offer.slices[0].segments[0].duration_minutes).toBe(210);
  });

  test('computes layover correctly', () => {
    // DXB layover: 03:55 → 05:55 = 120 min
    expect(offer.slices[0].layovers).toHaveLength(1);
    expect(offer.slices[0].layovers[0].airport).toBe('DXB');
    expect(offer.slices[0].layovers[0].duration_minutes).toBe(120);
  });

  test('computes total slice duration', () => {
    // 210 (TG) + 120 (layover) + 255 (EK) = 585 min
    expect(offer.slices[0].duration_minutes).toBe(585);
  });

  test('maps baggage allowance', () => {
    const bag = offer.slices[0].segments[0].baggage_allowance;
    expect(bag.carry_on).toBe(1);
    expect(bag.checked).toBe(1);
  });

  test('handles offer with empty slices gracefully', () => {
    const empty = mapOffer({ ...SAMPLE, slices: [] });
    expect(empty.slices).toHaveLength(0);
  });
});
