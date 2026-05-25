/**
 * Map a raw Duffel offer object → MCP Offer schema.
 * Pure functions — easy to unit test.
 */

export function mapOffer(duffelOffer) {
  return {
    id:             duffelOffer.id,
    provider:       'duffel',
    total_amount:   duffelOffer.total_amount,
    total_currency: duffelOffer.total_currency,
    base_amount:    duffelOffer.base_amount,
    tax_amount:     duffelOffer.tax_amount,
    seats_remaining: duffelOffer.available_services?.length ?? null,
    expires_at:     duffelOffer.expires_at ?? null,
    conditions: {
      refundable: duffelOffer.conditions?.refund_before_departure?.allowed ?? false,
      changeable: duffelOffer.conditions?.change_before_departure?.allowed ?? false,
    },
    slices: (duffelOffer.slices ?? []).map(mapSlice),
  };
}

function mapSlice(slice) {
  const segments = (slice.segments ?? []).map(mapSegment);
  const layovers = computeLayovers(segments);
  const durationMinutes =
    segments.reduce((t, s) => t + s.duration_minutes, 0) +
    layovers.reduce((t, l) => t + l.duration_minutes, 0);

  return { duration_minutes: durationMinutes, segments, layovers };
}

function mapSegment(seg) {
  const depMs = new Date(seg.departing_at).getTime();
  const arrMs = new Date(seg.arriving_at).getTime();

  return {
    flight_number: `${seg.operating_carrier.iata_code}${seg.operating_carrier_flight_number}`,
    airline: {
      iata_code: seg.operating_carrier.iata_code,
      name:      seg.operating_carrier.name,
    },
    origin: {
      iata_code: seg.origin.iata_code,
      name:      seg.origin.name,
      terminal:  seg.origin_terminal ?? null,
    },
    destination: {
      iata_code: seg.destination.iata_code,
      name:      seg.destination.name,
      terminal:  seg.destination_terminal ?? null,
    },
    departing_at:     seg.departing_at,
    arriving_at:      seg.arriving_at,
    duration_minutes: Math.round((arrMs - depMs) / 60_000),
    aircraft:         seg.aircraft?.name ?? null,
    cabin_class:      seg.passengers?.[0]?.cabin_class ?? null,
    fare_basis:       seg.passengers?.[0]?.fare_basis_code ?? null,
    baggage_allowance: mapBaggage(seg.passengers?.[0]?.baggages ?? []),
  };
}

function mapBaggage(baggages) {
  const checked  = baggages.find(b => b.type === 'checked')?.quantity  ?? 0;
  const carry_on = baggages.find(b => b.type === 'carry_on')?.quantity ?? 0;
  return { carry_on, checked, weight_kg: null };
}

function computeLayovers(segments) {
  const layovers = [];
  for (let i = 0; i < segments.length - 1; i++) {
    const arrMs = new Date(segments[i].arriving_at).getTime();
    const depMs = new Date(segments[i + 1].departing_at).getTime();
    layovers.push({
      airport:          segments[i].destination.iata_code,
      duration_minutes: Math.round((depMs - arrMs) / 60_000),
    });
  }
  return layovers;
}
