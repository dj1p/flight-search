export function formatMins(totalMinutes) {
  if (totalMinutes == null || isNaN(totalMinutes)) return '—';
  const h   = Math.floor(totalMinutes / 60);
  const min = totalMinutes % 60;
  if (h === 0) return `${min}m`;
  return `${h}h ${min > 0 ? `${min}m` : ''}`.trim();
}

export function fmt(iso, type) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';

  switch (type) {
    case 'time':
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'datetime':
      return d.toLocaleString([], {
        month:  'short',
        day:    'numeric',
        hour:   '2-digit',
        minute: '2-digit',
      });
    case 'date':
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    default:
      return d.toISOString();
  }
}
