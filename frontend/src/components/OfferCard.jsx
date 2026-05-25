import { useState } from 'react';
import LiveStatusBadge from './LiveStatusBadge.jsx';
import { formatMins, fmt } from '../utils/format.js';

export default function OfferCard({ offer }) {
  const [expanded, setExpanded] = useState(false);

  const firstSlice = offer.slices?.[0];
  const firstSeg   = firstSlice?.segments?.[0];
  const lastSeg    = firstSlice?.segments?.at(-1);
  const stops      = (firstSlice?.segments?.length ?? 1) - 1;

  if (!firstSeg) return null;

  return (
    <article
      className={`offer-card${expanded ? ' offer-card--expanded' : ''}`}
      onClick={() => setExpanded(e => !e)}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setExpanded(v => !v)}
    >
      {/* Summary row */}
      <div className="offer-summary">
        <div className="airline">
          <span className="iata">{firstSeg.airline?.iata_code}</span>
          <span className="airline-name">{firstSeg.airline?.name}</span>
        </div>

        <div className="route">
          <div className="endpoint">
            <span className="airport-code">{firstSeg.origin?.iata_code}</span>
            <span className="time">{fmt(firstSeg.departing_at, 'time')}</span>
          </div>
          <div className="route-mid">
            <span className="duration-small">{formatMins(firstSlice.duration_minutes)}</span>
            <div className="route-line">
              <span className="dot" />
              <span className="line" />
              {stops > 0 && <span className="stop-dot" />}
              <span className="dot" />
            </div>
            <span className={stops === 0 ? 'stops direct' : 'stops'}>
              {stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="endpoint">
            <span className="airport-code">{lastSeg?.destination?.iata_code}</span>
            <span className="time">{fmt(lastSeg?.arriving_at, 'time')}</span>
          </div>
        </div>

        <div className="offer-meta">
          <span className="cabin-badge">{firstSeg.cabin_class ?? 'economy'}</span>
          {firstSlice.layovers?.[0] && (
            <span className="layover-info">via {firstSlice.layovers[0].airport}</span>
          )}
        </div>

        <div className="price-col">
          <strong className="price-amount">
            {offer.total_currency} {parseFloat(offer.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </strong>
          {offer.conditions?.refundable && (
            <span className="badge badge--green">Refundable</span>
          )}
          {offer.seats_remaining != null && offer.seats_remaining <= 5 && (
            <span className="badge badge--red">{offer.seats_remaining} left</span>
          )}
        </div>

        <span className="expand-icon" aria-hidden="true">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="offer-detail" onClick={e => e.stopPropagation()}>
          {offer.slices.map((slice, si) => (
            <div key={si} className="slice-detail">
              {offer.slices.length > 1 && (
                <h4 className="slice-heading">
                  Leg {si + 1}: {slice.segments[0]?.origin?.iata_code} → {slice.segments.at(-1)?.destination?.iata_code}
                </h4>
              )}
              {slice.segments.map((seg, gi) => (
                <div key={gi}>
                  <div className="segment">
                    <div className="seg-header">
                      <span className="seg-flight-num">{seg.flight_number}</span>
                      {seg.aircraft && <span className="seg-aircraft">· {seg.aircraft}</span>}
                      <LiveStatusBadge
                        flightNumber={seg.flight_number}
                        date={seg.departing_at?.slice(0, 10)}
                      />
                    </div>

                    <div className="seg-row">
                      <div className="seg-endpoint">
                        <div className="seg-time">{fmt(seg.departing_at, 'datetime')}</div>
                        <div className="seg-airport">
                          {seg.origin?.iata_code}
                          {seg.origin?.terminal && <span className="terminal"> T{seg.origin.terminal}</span>}
                        </div>
                        <div className="seg-name">{seg.origin?.name}</div>
                      </div>
                      <div className="seg-mid">
                        <div className="seg-dur">{formatMins(seg.duration_minutes)}</div>
                        <div className="seg-arrow">────✈────</div>
                      </div>
                      <div className="seg-endpoint seg-endpoint--right">
                        <div className="seg-time">{fmt(seg.arriving_at, 'datetime')}</div>
                        <div className="seg-airport">
                          {seg.destination?.iata_code}
                          {seg.destination?.terminal && <span className="terminal"> T{seg.destination.terminal}</span>}
                        </div>
                        <div className="seg-name">{seg.destination?.name}</div>
                      </div>
                    </div>

                    <div className="seg-footer">
                      <span>🧳 {seg.baggage_allowance?.carry_on ?? 0} carry-on · {seg.baggage_allowance?.checked ?? 0} checked bag(s)</span>
                      {seg.fare_basis && <span>Fare: {seg.fare_basis}</span>}
                      {seg.cabin_class && <span>{seg.cabin_class.replace(/_/g, ' ')}</span>}
                    </div>
                  </div>

                  {/* Layover between segments */}
                  {gi < slice.layovers?.length && (
                    <div className="layover-bar">
                      ⟳ {formatMins(slice.layovers[gi].duration_minutes)} layover in {slice.layovers[gi].airport}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          <div className="price-breakdown">
            <span>Base fare: {offer.total_currency} {offer.base_amount}</span>
            <span>Taxes & fees: {offer.total_currency} {offer.tax_amount}</span>
            <span className="total-price">
              Total: {offer.total_currency} {parseFloat(offer.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          {offer.conditions && (
            <div className="conditions">
              <span>{offer.conditions.refundable ? '✓ Refundable' : '✗ Non-refundable'}</span>
              <span>{offer.conditions.changeable ? '✓ Changeable' : '✗ Non-changeable'}</span>
            </div>
          )}

          {offer.expires_at && (
            <p className="offer-expires">
              Price valid until {fmt(offer.expires_at, 'datetime')}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
