const BASE = import.meta.env.VITE_MCP_URL || '/v1';
const KEY  = import.meta.env.VITE_MCP_KEY  || '';

const headers = () => ({
  'Content-Type': 'application/json',
  ...(KEY ? { 'X-MCP-Key': KEY } : {}),
});

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg  = body.error || `HTTP ${res.status}`;
    const err  = new Error(msg);
    err.status = res.status;
    err.code   = body.code;
    throw err;
  }
  return res.json();
}

export const searchFlights = (params) =>
  fetch(`${BASE}/search`, {
    method:  'POST',
    headers: headers(),
    body:    JSON.stringify(params),
  }).then(handleResponse);

export const getOffer = (id) =>
  fetch(`${BASE}/offers/${encodeURIComponent(id)}`, {
    headers: headers(),
  }).then(handleResponse);

export const getLiveStatus = (flightId, date) => {
  const url = new URL(`${BASE}/live-status/${encodeURIComponent(flightId)}`, window.location.origin);
  if (date) url.searchParams.set('date', date);
  return fetch(url.toString(), { headers: headers() }).then(handleResponse);
};

export const getHealth = () =>
  fetch(`${BASE}/health`).then(handleResponse);
