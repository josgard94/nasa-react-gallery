import React, { useState, useEffect, useCallback, useRef } from 'react';
import AlertCard from './AlertCard';
import { fetchAlertsPage, ALERTS_PAGE_SIZE } from './spaceWeatherApi';
import './SpaceWeatherAlerts.css';

function AlertsSkeleton({ count = 3 }) {
  return (
    <div className="sw-skeleton-list" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="sw-skeleton-card">
          <div className="sw-skeleton-card__shimmer" />
          <div className="sw-skeleton-card__row">
            <div className="sw-skeleton-block sw-skeleton-block--circle" />
            <div className="sw-skeleton-block sw-skeleton-block--title" />
            <div className="sw-skeleton-block sw-skeleton-block--badge" />
          </div>
          <div className="sw-skeleton-block sw-skeleton-block--line" />
          <div className="sw-skeleton-block sw-skeleton-block--line short" />
          <div className="sw-skeleton-block sw-skeleton-block--impact" />
        </div>
      ))}
    </div>
  );
}

function SpaceWeatherAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const scrollRootRef = useRef(null);
  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const offsetRef = useRef(0);

  hasMoreRef.current = hasMore;

  const loadPage = useCallback(async (offset, append) => {
    const { items, total: t, hasMore: more } = await fetchAlertsPage(
      offset,
      ALERTS_PAGE_SIZE
    );
    setTotal(t);
    setHasMore(more);
    offsetRef.current = offset + items.length;
    if (append) {
      setAlerts((prev) => [...prev, ...items]);
    } else {
      setAlerts(items);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAlerts([]);
    setHasMore(true);
    offsetRef.current = 0;

    loadPage(0, false)
      .catch(() => {
        if (!cancelled) setError('Could not load alerts. Try again later.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      await loadPage(offsetRef.current, true);
    } catch {
      setError('Could not load more alerts.');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [loadPage]);

  useEffect(() => {
    if (loading || !hasMore) return undefined;

    const root = scrollRootRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) loadMore();
      },
      {
        root,
        rootMargin: '180px 0px 120px 0px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, loadMore, hasMore, alerts.length]);

  const showingEnd = alerts.length;
  const allLoaded = !loading && !error && total > 0 && !hasMore;

  return (
    <section className="sw-section" aria-labelledby="sw-heading">
      <header className="sw-section__header">
        <div className="sw-section__intro">
          <p className="sw-section__eyebrow">NOAA SWPC · live alerts</p>
          <h2 id="sw-heading" className="sw-section__title">
            Space weather alerts
          </h2>
          <p className="sw-section__subtitle">
            Latest solar activity that may affect Earth-orbiting assets and ground systems
          </p>
        </div>
        {!loading && !error && total > 0 && (
          <div className="sw-section__stats" aria-live="polite">
            <span className="sw-stat">
              <span className="sw-stat__value">{total}</span>
              <span className="sw-stat__label">events</span>
            </span>
            <span className="sw-stat sw-stat--dim">
              <span className="sw-stat__value">{showingEnd}</span>
              <span className="sw-stat__label">loaded</span>
            </span>
          </div>
        )}
      </header>

      {loading && <AlertsSkeleton count={3} />}

      {!loading && error && (
        <p className="sw-section__error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && alerts.length === 0 && (
        <p className="sw-section__empty">No alerts to show.</p>
      )}

      {!loading && !error && alerts.length > 0 && (
        <div className="sw-feed">
          <p className="sw-feed__hint" id="sw-scroll-hint">
            Scroll the list to load more — new items appear as you reach the bottom.
          </p>
          <div
            ref={scrollRootRef}
            className="sw-timeline"
            role="region"
            aria-label="Alert timeline"
            aria-busy={loadingMore}
            aria-labelledby="sw-heading"
            aria-describedby="sw-scroll-hint"
          >
            <div className="sw-zigzag">
              {alerts.map((alert, index) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  alignRight={index % 2 === 0}
                  isLast={index === alerts.length - 1 && !hasMore && !loadingMore}
                />
              ))}
              {hasMore && (
                <div
                  ref={sentinelRef}
                  className="sw-sentinel"
                  aria-hidden="true"
                />
              )}
              {loadingMore && (
                <div className="sw-more-skeleton" aria-label="Loading more alerts">
                  <AlertsSkeleton count={1} />
                </div>
              )}
              {allLoaded && (
                <p className="sw-endcap" role="status">
                  You&apos;ve reached the end of the feed.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default SpaceWeatherAlerts;
