import { useState } from 'react';
import OfferCard from './OfferCard.jsx';

export default function ResultsList({ offers, meta }) {
  const [sortBy, setSortBy] = useState('price');

  const sorted = [...offers].sort((a, b) => {
    if (sortBy === 'price')    return parseFloat(a.total_amount) - parseFloat(b.total_amount);
    if (sortBy === 'duration') return totalDuration(a) - totalDuration(b);
    if (sortBy === 'departure') {
      const da = a.slices[0]?.segments[0]?.departing_at ?? '';
      const db = b.slices[0]?.segments[0]?.departing_at ?? '';
      return da.localeCompare(db);
    }
    return 0;
  });

  if (offers.length === 0) {
    return (
      <section className="results">
        <div className="no-results">
          No flights found. Try adjusting your dates, adding flex days, or removing airline filters.
        </div>
      </section>
    );
  }

  return (
    <section className="results" aria-label="Search results">
      <div className="results-header">
        <span>{meta?.total ?? offers.length} flights found</span>
        <label className="sort-label">
          Sort:&nbsp;
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="price">Price</option>
            <option value="duration">Duration</option>
            <option value="departure">Departure</option>
          </select>
        </label>
      </div>

      <ul className="offers-list" aria-label="Flight offers">
        {sorted.map(offer => (
          <li key={offer.id}>
            <OfferCard offer={offer} />
          </li>
        ))}
      </ul>

      {meta?.nextCursor && (
        <p className="load-more-note">
          Showing {offers.length} of {meta.total} — use the API <code>after</code> cursor to load more.
        </p>
      )}
    </section>
  );
}

const totalDuration = o => o.slices.reduce((t, s) => t + (s.duration_minutes ?? 0), 0);
