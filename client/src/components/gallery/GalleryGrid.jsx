import React, { memo, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import ImageCard from './ImageCard';
import SkeletonLoader from './SkeletonLoader';
import styles from './GalleryGrid.module.css';
import gridLayout from './galleryGridLayout.module.css';

const PAGE_SIZE = 8;

function GalleryGrid({
  images,
  loading,
  onOpenModal,
  favoriteKeys,
  onToggleFavorite,
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [images]);

  const visible = useMemo(
    () => images.slice(0, visibleCount),
    [images, visibleCount]
  );

  const hasMore = visibleCount < images.length;
  const showInitialSkeleton = loading && images.length === 0;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisibleCount((c) => Math.min(c + PAGE_SIZE, images.length));
      },
      { root: null, rootMargin: '320px 0px', threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, images.length, visibleCount]);

  const isFavorite = useCallback(
    (img) => favoriteKeys.has(img?.date || img?.url),
    [favoriteKeys]
  );

  if (showInitialSkeleton) {
    return <SkeletonLoader count={PAGE_SIZE} />;
  }

  if (!loading && images.length === 0) {
    return null;
  }

  return (
    <div
      className={`${styles.wrap} ${loading ? styles.refreshing : ''}`}
      aria-busy={loading}
    >
      <div className={gridLayout.grid}>
        {visible.map((image, index) => (
          <ImageCard
            key={image.date ?? image.url ?? index}
            image={image}
            onOpen={onOpenModal}
            isFavorite={isFavorite(image)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
      {hasMore && (
        <div
          ref={sentinelRef}
          className={styles.sentinel}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default memo(GalleryGrid);
