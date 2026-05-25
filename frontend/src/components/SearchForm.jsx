import { useState } from 'react';

const CABINS = ['economy', 'premium_economy', 'business', 'first'];
const today  = () => new Date().toISOString().slice(0, 10);
const emptySlice = () => ({ origin: '', destination: '', departure_date: today() });

export default function SearchForm({ onSearch }) {
  const [tripType,  setTripType]  = useState('round_trip');
  const [slices,    setSlices]    = useState([emptySlice(), emptySlice()]);
  const [adults,    setAdults]    = useState(1);
  const [children,  setChildren]  = useState(0);
  const [infants,   setInfants]   = useState(0);
  const [cabin,     setCabin]     = useState('economy');
  const [flexDays,  setFlexDays]  = useState(0);
  const [airlines,  setAirlines]  = useState('');
  const [sortBy,    setSortBy]    = useState('price');
  const [maxConn,   setMaxConn]   = useState('');

  function updateSlice(i, field, value) {
    setSlices(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  function handleTripTypeChange(type) {
    setTripType(type);
    if (type === 'one_way')    setSlices([emptySlice()]);
    if (type === 'round_trip') setSlices([emptySlice(), emptySlice()]);
    if (type === 'multi_city') setSlices([emptySlice(), emptySlice(), emptySlice()]);
  }

  function buildPassengers() {
    const p = [];
    for (let i = 0; i < adults;   i++) p.push({ type: 'adult' });
    for (let i = 0; i < children; i++) p.push({ type: 'child', age: 8 });
    for (let i = 0; i < infants;  i++) p.push({ type: 'infant_without_seat' });
    return p;
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSearch({
      trip_type:       tripType,
      slices,
      passengers:      buildPassengers(),
      cabin_class:     cabin,
      date_flex_days:  Number(flexDays),
      airlines:        airlines ? airlines.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : [],
      max_connections: maxConn !== '' ? Number(maxConn) : undefined,
      sort_by:         sortBy,
      limit:           20,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="search-form" aria-label="Flight search">

      {/* Trip type */}
      <fieldset className="fieldset trip-type-group">
        <legend className="fieldset-legend">Trip type</legend>
        {['one_way', 'round_trip', 'multi_city'].map(t => (
          <label key={t} className="radio-label">
            <input type="radio" name="tripType" value={t}
              checked={tripType === t}
              onChange={() => handleTripTypeChange(t)} />
            {t.replace(/_/g, ' ')}
          </label>
        ))}
      </fieldset>

      {/* Slices */}
      <div className="slices-section">
        {slices.map((s, i) => (
          <div key={i} className="slice-row">
            {tripType === 'multi_city' && (
              <span className="slice-label">Leg {i + 1}</span>
            )}
            <label className="field-label">
              <span>From</span>
              <input required value={s.origin} placeholder="BKK"
                maxLength={3} style={{ textTransform: 'uppercase' }}
                onChange={e => updateSlice(i, 'origin', e.target.value.toUpperCase())} />
            </label>
            <label className="field-label">
              <span>To</span>
              <input required value={s.destination} placeholder="LHR"
                maxLength={3} style={{ textTransform: 'uppercase' }}
                onChange={e => updateSlice(i, 'destination', e.target.value.toUpperCase())} />
            </label>
            <label className="field-label">
              <span>{i === 0 ? 'Departure' : tripType === 'round_trip' ? 'Return' : 'Departure'}</span>
              <input type="date" required value={s.departure_date}
                onChange={e => updateSlice(i, 'departure_date', e.target.value)} />
            </label>
            {tripType === 'multi_city' && slices.length > 2 && (
              <button type="button" className="btn-remove"
                onClick={() => setSlices(p => p.filter((_, idx) => idx !== i))}
                aria-label={`Remove leg ${i + 1}`}>✕</button>
            )}
          </div>
        ))}
        {tripType === 'multi_city' && slices.length < 6 && (
          <button type="button" className="btn-add-city"
            onClick={() => setSlices(p => [...p, emptySlice()])}>
            + Add city
          </button>
        )}
      </div>

      {/* Passengers */}
      <fieldset className="fieldset passengers-group">
        <legend className="fieldset-legend">Passengers</legend>
        {[
          ['Adults',   adults,   setAdults,   1],
          ['Children', children, setChildren, 0],
          ['Infants',  infants,  setInfants,  0],
        ].map(([label, val, setter, min]) => (
          <label key={label} className="counter-label">
            <span>{label}</span>
            <input type="number" min={min} max="9" value={val}
              onChange={e => setter(Number(e.target.value))} />
          </label>
        ))}
      </fieldset>

      {/* Options row */}
      <div className="options-row">
        <label className="field-label">
          <span>Cabin</span>
          <select value={cabin} onChange={e => setCabin(e.target.value)}>
            {CABINS.map(c => (
              <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>

        <label className="field-label">
          <span>±Flex days</span>
          <select value={flexDays} onChange={e => setFlexDays(e.target.value)}>
            {[0, 1, 2, 3].map(n => (
              <option key={n} value={n}>{n === 0 ? 'Exact date' : `±${n} day${n > 1 ? 's' : ''}`}</option>
            ))}
          </select>
        </label>

        <label className="field-label">
          <span>Max stops</span>
          <select value={maxConn} onChange={e => setMaxConn(e.target.value)}>
            <option value="">Any</option>
            <option value="0">Direct only</option>
            <option value="1">Max 1 stop</option>
            <option value="2">Max 2 stops</option>
          </select>
        </label>

        <label className="field-label">
          <span>Airlines (IATA)</span>
          <input placeholder="TG, BA, EK" value={airlines}
            onChange={e => setAirlines(e.target.value)} />
        </label>

        <label className="field-label">
          <span>Sort by</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="price">Price</option>
            <option value="duration">Duration</option>
            <option value="departure">Departure time</option>
          </select>
        </label>
      </div>

      <button type="submit" className="search-btn">Search flights</button>
    </form>
  );
}
