import React, { memo, useCallback, useRef, useState, useEffect } from 'react';
import styles from './ImageCard.module.css';

function cardMediaSrc(image) {
  if (image?.media_type === 'video' && image.thumbnail_url) {
    return image.thumbnail_url;
  }
  return image?.url;
}

function ImageCard({ image, onOpen, isFavorite, onToggleFavorite }) {
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = imgRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: '120px', threshold: 0.01 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [image?.url]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen(image);
      }
    },
    [image, onOpen]
  );

  const src = cardMediaSrc(image);

  return (
    <article
      className={styles.card}
      tabIndex={0}
      role="button"
      aria-label={`Open ${image.title}`}
      onClick={() => onOpen(image)}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.mediaWrap}>
        <div className={styles.gradient} aria-hidden />
        {image.media_type === 'video' && (
          <span className={styles.videoBadge} aria-hidden>
            Video
          </span>
        )}
        <button
          type="button"
          className={`${styles.favorite} ${isFavorite ? styles.favoriteActive : ''}`}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(image);
          }}
        >
          <span aria-hidden>{isFavorite ? '★' : '☆'}</span>
        </button>
        <div ref={imgRef} className={styles.imgSlot}>
          {inView && src && (
            <img
              src={src}
              alt=""
              className={`${styles.image} ${loaded ? styles.imageVisible : ''}`}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
            />
          )}
          {!loaded && <div className={styles.imgPlaceholder} aria-hidden />}
        </div>
        <div className={styles.overlay}>
          <span className={styles.viewHint}>View details</span>
        </div>
      </div>
      <div className={styles.body}>
        <h2 className={styles.title}>{image.title}</h2>
        <time className={styles.date} dateTime={image.date}>
          {image.date}
        </time>
      </div>
    </article>
  );
}

function propsEqual(prev, next) {
  return (
    prev.image === next.image &&
    prev.isFavorite === next.isFavorite &&
    prev.onOpen === next.onOpen &&
    prev.onToggleFavorite === next.onToggleFavorite
  );
}

export default memo(ImageCard, propsEqual);
