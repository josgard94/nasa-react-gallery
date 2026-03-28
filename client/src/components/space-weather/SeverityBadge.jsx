import React from 'react';

/**
 * Maps NOAA-style levels to display tiers for color (G/R/S numeric, or M/X flare classes).
 */
function levelToTier(level) {
  if (!level || typeof level !== 'string') return 'medium';

  const upper = level.toUpperCase().trim();
  if (upper === '—' || upper === '-' || upper === 'N/A') return 'low';

  // G, R, S scales: digit 1–5
  const scaleMatch = upper.match(/^[GRS](\d)/);
  if (scaleMatch) {
    const n = parseInt(scaleMatch[1], 10);
    if (n <= 2) return 'low';
    if (n === 3) return 'medium';
    if (n === 4) return 'high';
    return 'extreme';
  }

  const kMatch = upper.match(/^K(\d)/);
  if (kMatch) {
    const n = parseInt(kMatch[1], 10);
    if (n <= 3) return 'low';
    if (n <= 5) return 'medium';
    if (n <= 7) return 'high';
    return 'extreme';
  }

  // Solar flares: C < M < X (rough mapping to dashboard severity)
  const flare = upper.match(/^([CMX])(\d*\.?\d*)/);
  if (flare) {
    const band = flare[1];
    const mag = parseFloat(flare[2] || '0') || 0;
    if (band === 'C' || (band === 'M' && mag < 5)) return 'medium';
    if (band === 'M') return 'high';
    if (band === 'X') return mag >= 5 ? 'extreme' : 'high';
  }

  return 'medium';
}

const TIER_CLASS = {
  low: 'sw-severity-badge--low',
  medium: 'sw-severity-badge--medium',
  high: 'sw-severity-badge--high',
  extreme: 'sw-severity-badge--extreme',
};

/**
 * @param {{ level: string, type?: string }} props
 * `type` optional: used for accessible context (e.g. scale or event family).
 */
function SeverityBadge({ level, type }) {
  const tier = levelToTier(level);
  const tierClass = TIER_CLASS[tier] || TIER_CLASS.medium;
  const label = type ? `${type}: ${level}` : level;

  return (
    <span
      className={`sw-severity-badge ${tierClass}`}
      title={label}
      aria-label={`Severity ${level}${type ? `, ${type}` : ''}`}
    >
      {level}
    </span>
  );
}

export default SeverityBadge;
export { levelToTier };
