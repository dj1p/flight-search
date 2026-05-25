import { useEffect, useState } from 'react';
import { getLiveStatus } from '../api/mcp.js';

const STATUS_COLOR = {
  scheduled: '#6b7280',
  active:    '#16a34a',
  landed:    '#2563eb',
  cancelled: '#dc2626',
  diverted:  '#d97706',
};

export default function LiveStatusBadge({ flightNumber, date }) {
  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getLiveStatus(flightNumber, date)
      .then(s => { if (!cancelled) setStatus(s); })
      .catch(() => { if (!cancelled) setStatus(null); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [flightNumber, date]);

  if (loading) return <span className="live-badge live-badge--loading">…</span>;
  if (!status || status.status === 'unknown') return null;

  const color = STATUS_COLOR[status.status] ?? '#6b7280';

  return (
    <span
      className="live-badge"
      style={{ color }}
      title={[
        `Status: ${status.status}`,
        status.delay_minutes > 0 ? `Delay: +${status.delay_minutes} min` : null,
        status.position ? `Alt: ${status.position.altitude_ft?.toLocaleString()} ft` : null,
      ].filter(Boolean).join(' · ')}
    >
      ● {status.status}
      {status.delay_minutes > 0 && (
        <span className="delay-tag">+{status.delay_minutes}m</span>
      )}
    </span>
  );
}
