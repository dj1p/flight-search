import { useState } from 'react';
import SearchForm  from './components/SearchForm.jsx';
import ResultsList from './components/ResultsList.jsx';
import { searchFlights } from './api/mcp.js';

export default function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [meta,    setMeta]    = useState(null);

  async function handleSearch(params) {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const data = await searchFlights(params);
      setResults(data.offers);
      setMeta({
        searchId:   data.search_id,
        total:      data.total,
        nextCursor: data.next_cursor,
        dates:      data.searched_dates,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>✈ Flight Search</h1>
        <p className="subtitle">Search real fares across airlines and dates</p>
      </header>
      <main className="app-main">
        <SearchForm onSearch={handleSearch} />

        {loading && (
          <div className="spinner" role="status" aria-live="polite">
            <span className="spinner-icon">⟳</span> Searching flights…
          </div>
        )}

        {error && (
          <div className="error" role="alert">
            <strong>Search failed:</strong> {error}
          </div>
        )}

        {results && !loading && (
          <>
            {meta?.dates?.length > 1 && (
              <p className="dates-note">
                Searched across {meta.dates.length} dates: {meta.dates[0]} – {meta.dates.at(-1)}
              </p>
            )}
            <ResultsList offers={results} meta={meta} />
          </>
        )}
      </main>
    </div>
  );
}
