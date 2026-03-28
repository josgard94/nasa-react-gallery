/**
 * NOAA Space Weather Prediction Center — live alerts (browser-safe, CORS: *).
 * @see https://services.swpc.noaa.gov/json/
 *
 * Optional env:
 *   REACT_APP_SWPC_ALERTS_URL — override JSON URL (default: products/alerts.json)
 */

export const ALERTS_PAGE_SIZE = 5;

const DEFAULT_SWPC_ALERTS_URL =
  'https://services.swpc.noaa.gov/products/alerts.json';

function alertsUrl() {
  const fromEnv = process.env.REACT_APP_SWPC_ALERTS_URL;
  return (typeof fromEnv === 'string' && fromEnv.trim()) || DEFAULT_SWPC_ALERTS_URL;
}

/** In-memory cache for one session (avoids refetching on each “load more” slice). */
let cachedNormalized = null;

export function clearSpaceWeatherAlertsCache() {
  cachedNormalized = null;
}

function parseIssueDate(isoish) {
  if (!isoish || typeof isoish !== 'string') return { sortMs: 0, dateYmd: '' };
  const sortMs = Date.parse(isoish.replace(' ', 'T') + 'Z');
  const dateYmd = isoish.split(' ')[0] || '';
  return { sortMs: Number.isFinite(sortMs) ? sortMs : 0, dateYmd };
}

function classifyType(message) {
  const u = message.toUpperCase();
  if (/ELECTRON.*2MEV|2MEV.*INTEGRAL FLUX/i.test(message)) return 'Radiation (electrons)';
  if (/TYPE II RADIO|TYPE II EMISSION/i.test(u)) return 'Radio burst (Type II)';
  if (/SOLAR PROTON|PROTON EVENT|PROTON FLUX/i.test(u) && /ALERT|WARNING/i.test(u)) {
    return 'Solar Radiation Storm';
  }
  if (/GEOMAGNETIC STORM CATEGORY|STORM CATEGORY\s+G/i.test(u)) return 'Geomagnetic Storm';
  if (/WATCH:/i.test(message) && /GEOMAGNETIC|G\d/i.test(u)) return 'Geomagnetic Storm Watch';
  if (/WARNING:.*K-INDEX/i.test(message)) return 'Geomagnetic Warning';
  if (/ALERT:.*K-INDEX/i.test(message)) return 'Geomagnetic Alert';
  if (/SOLAR FLARE|X-RAY FLUX/i.test(u)) return 'Solar Flare';
  if (/CME|CORONAL MASS EJECTION/i.test(u)) return 'Coronal Mass Ejection';
  return 'Space Weather Bulletin';
}

function extractScale(message) {
  const mG =
    message.match(/NOAA\s+Scale:\s*G(\d)/i) ||
    message.match(/Category\s+G(\d)/i) ||
    message.match(/\bG(\d)\s*\(\s*(?:Minor|Moderate|Severe|Extreme)/i);
  if (mG) return `G${mG[1]}`;

  const mR = message.match(/NOAA\s+Scale:\s*R(\d)/i) || message.match(/\bR(\d)\s*[\s(]/i);
  if (mR) return `R${mR[1]}`;

  const mS = message.match(/NOAA\s+Scale:\s*S(\d)/i) || message.match(/\bS(\d)\s*[\s(–-]/i);
  if (mS) return `S${mS[1]}`;

  const mK = message.match(/K-index of (\d)/i);
  if (mK) return `K${mK[1]}`;

  const flare = message.match(/\b(X|M|C)(\d+(?:\.\d+)?)\b/i);
  if (flare && /FLARE|X-RAY/i.test(message)) return `${flare[1].toUpperCase()}${flare[2]}`;

  return '—';
}

function extractDescription(message) {
  const t = message.replace(/\r\n/g, '\n');
  const pi = t.toLowerCase().indexOf('potential impacts:');
  let chunk = pi >= 0 ? t.slice(0, pi) : t;
  chunk = chunk.replace(/^[\s\S]*?(?=(WARNING:|ALERT:|WATCH:|CONTINUED ALERT:))/i, '');
  if (!/(WARNING:|ALERT:|WATCH:|CONTINUED ALERT:)/i.test(chunk)) {
    chunk = t.slice(0, pi >= 0 ? pi : t.length);
    chunk = chunk.replace(/^[\s\S]*?Issue Time:\s*[^\n]+\n+/i, '');
  }
  return chunk
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 480);
}

function extractImpacts(message) {
  const idx = message.toLowerCase().indexOf('potential impacts:');
  if (idx >= 0) {
    return message
      .slice(idx + 'potential impacts:'.length)
      .replace(/\r\n/g, '\n')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 520);
  }
  const d = message.match(/Description:\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/i);
  if (d) {
    return d[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
  }
  return '';
}

function mapSwpcAlert(entry) {
  if (!entry || typeof entry.message !== 'string') return null;
  const { sortMs, dateYmd } = parseIssueDate(entry.issue_datetime);
  const msg = entry.message;
  const type = classifyType(msg);
  const level = extractScale(msg);
  let description = extractDescription(msg);
  if (!description) description = 'NOAA SWPC bulletin — see details below.';
  const impact =
    extractImpacts(msg) ||
    'Refer to the full NOAA bulletin and swpc.noaa.gov for official impacts and updates.';

  const id = `${entry.product_id}_${entry.issue_datetime}`.replace(/[^\w.-]+/g, '_');

  return {
    id,
    type,
    level,
    date: dateYmd || '—',
    description,
    impact,
    _sortMs: sortMs,
  };
}

async function fetchAndNormalizeAll() {
  if (cachedNormalized) return cachedNormalized;

  const url = alertsUrl();
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Could not load alerts (HTTP ${response.status}).`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Alerts response was not valid JSON.');
  }

  if (!Array.isArray(data)) {
    throw new Error('Unexpected alerts data format.');
  }

  const mapped = data.map(mapSwpcAlert).filter(Boolean);
  mapped.sort((a, b) => b._sortMs - a._sortMs);

  cachedNormalized = mapped.map(({ _sortMs, ...rest }) => rest);
  return cachedNormalized;
}

/**
 * @param {number} offset
 * @param {number} [limit]
 * @returns {Promise<{ items: object[], total: number, hasMore: boolean }>}
 */
export async function fetchAlertsPage(offset, limit = ALERTS_PAGE_SIZE) {
  const all = await fetchAndNormalizeAll();
  const items = all.slice(offset, offset + limit);
  const loaded = offset + items.length;
  return {
    items,
    total: all.length,
    hasMore: loaded < all.length,
  };
}
