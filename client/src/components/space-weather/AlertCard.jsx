import React from 'react';
import SeverityBadge from './SeverityBadge';

const NOAA_ALERTS_URL = 'https://www.swpc.noaa.gov/products/alerts-warnings-and-watches';

function eventIconKey(alertType) {
  const t = (alertType || '').toLowerCase();
  if (t.includes('cme') || t.includes('coronal mass') || t.includes('radio burst')) return 'cme';
  if (t.includes('flare') || t.includes('x-ray')) return 'flare';
  if (t.includes('geomagnetic') || t.includes('k-index') || t.includes('storm watch')) return 'storm';
  if (t.includes('radiation') || t.includes('electron') || t.includes('proton')) return 'radiation';
  return 'storm';
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return '—';
  try {
    const d = new Date(`${isoDate}T12:00:00`);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

function CardInner({ alert, side }) {
  const eventKey = eventIconKey(alert.type);
  return (
    <article
      className={`sw-zigzag-card sw-zigzag-card--${side}`}
      aria-label={`${alert.type}, ${alert.level}`}
    >
      <header className="sw-zigzag-card__head">
        <time className="sw-zigzag-card__date" dateTime={alert.date}>
          {formatDisplayDate(alert.date)}
        </time>
        <div className="sw-zigzag-card__badges">
          <span className={`sw-type-pill sw-type-pill--${eventKey}`}>{alert.type}</span>
          <SeverityBadge level={alert.level} type={alert.type} />
        </div>
      </header>
      <p className="sw-zigzag-card__body">{alert.description}</p>
      <div className="sw-zigzag-card__impact">
        <span className="sw-zigzag-card__impact-label">Impact</span>
        <p className="sw-zigzag-card__impact-text">{alert.impact}</p>
      </div>
      <footer className="sw-zigzag-card__foot">
        <a
          className="sw-zigzag-card__cta"
          href={NOAA_ALERTS_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Read more
          <span className="sw-zigzag-card__cta-chevron" aria-hidden="true">
            ›
          </span>
        </a>
      </footer>
    </article>
  );
}

/**
 * @param {{ alert: object, alignRight: boolean, isLast?: boolean }} props
 */
function AlertCard({ alert, alignRight, isLast }) {
  const side = alignRight ? 'right' : 'left';

  return (
    <div
      className={`sw-zigzag-row sw-zigzag-row--${side}${isLast ? ' sw-zigzag-row--last' : ''}`}
    >
      {alignRight ? (
        <>
          <div className="sw-zigzag-row__spacer" aria-hidden="true" />
          <div className="sw-zigzag-row__axis">
            <span className="sw-zigzag-row__dot" aria-hidden="true" />
          </div>
          <div className="sw-zigzag-row__card">
            <CardInner alert={alert} side={side} />
          </div>
        </>
      ) : (
        <>
          <div className="sw-zigzag-row__card">
            <CardInner alert={alert} side={side} />
          </div>
          <div className="sw-zigzag-row__axis">
            <span className="sw-zigzag-row__dot" aria-hidden="true" />
          </div>
          <div className="sw-zigzag-row__spacer" aria-hidden="true" />
        </>
      )}
    </div>
  );
}

export default AlertCard;
