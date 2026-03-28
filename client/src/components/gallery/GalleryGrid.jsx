import React, { memo, useMemo, useState, useEffect, useCallback } from 'react';
import ImageCard from './ImageCard';
import SkeletonLoader from './SkeletonLoader';
import styles from './GalleryGrid.module.css';

const PAGE_SIZE = 9;

function GalleryGrid({
  images,
  loading,
  onOpenModal,
  favoriteKeys,
  onToggleFavorite,
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [images]);

  const visible = useMemo(
    () => images.slice(0, visibleCount),
    [images, visibleCount]
  );

  const hasMore = visibleCount < images.length;
  const showInitialSkeleton = loading && images.length === 0;

  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + PAGE_SIZE, images.length));
  }, [images.length]);

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
      <div className={styles.masonry}>
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
        <div className={styles.footer}>
          <button type="button" className={styles.loadMore} onClick={loadMore}>
            Load more
            <span className={styles.loadMoreMeta}>
              {visible.length} / {images.length}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(GalleryGrid);
