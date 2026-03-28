import React, { memo, useEffect, useCallback, useRef } from 'react';
import styles from './ImageModal.module.css';

function modalMedia(image) {
  if (!image) return { type: 'none', src: null };
  if (image.media_type === 'video') {
    const url = image.url || '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let id = '';
      try {
        const u = new URL(url);
        if (u.hostname.includes('youtu.be')) {
          id = u.pathname.slice(1).split('/')[0];
        } else {
          id = u.searchParams.get('v') || '';
        }
      } catch {
        id = '';
      }
      if (id) {
        return {
          type: 'embed',
          src: `https://www.youtube.com/embed/${id}`,
        };
      }
    }
    return {
      type: 'link',
      src: image.url,
      label: 'Open video',
    };
  }
  const hi = image.hdurl || image.url;
  return { type: 'image', src: hi };
}

function ImageModal({ image, isFavorite, onClose, onToggleFavorite }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });
    return () => cancelAnimationFrame(t);
  }, [image]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  if (!image) return null;

  const media = modalMedia(image);

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-image-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.toolbar}>
          <button
            ref={closeBtnRef}
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
          <button
            type="button"
            className={`${styles.favorite} ${isFavorite ? styles.favoriteActive : ''}`}
            aria-pressed={isFavorite}
            onClick={() => onToggleFavorite(image)}
          >
            <span aria-hidden>{isFavorite ? '★' : '☆'}</span>
            <span className={styles.favoriteLabel}>
              {isFavorite ? 'Saved' : 'Favorite'}
            </span>
          </button>
        </div>

        <div className={styles.mediaBlock}>
          {media.type === 'image' && media.src && (
            <img
              src={media.src}
              alt={image.title}
              className={styles.hero}
              loading="eager"
            />
          )}
          {media.type === 'embed' && (
            <div className={styles.embedWrap}>
              <iframe
                title={image.title}
                src={media.src}
                className={styles.embed}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {media.type === 'link' && (
            <a
              href={media.src}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalLink}
            >
              {media.label}
            </a>
          )}
        </div>

        <div className={styles.content}>
          <h2 id="modal-image-title" className={styles.title}>
            {image.title}
          </h2>
          <time className={styles.date} dateTime={image.date}>
            {image.date}
          </time>
          {image.copyright && (
            <p className={styles.credit}>
              <span className={styles.creditLabel}>Credit</span>
              {image.copyright}
            </p>
          )}
          <div className={styles.description}>
            <p>{image.explanation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function propsEqual(a, b) {
  return (
    a.image === b.image &&
    a.isFavorite === b.isFavorite &&
    a.onClose === b.onClose &&
    a.onToggleFavorite === b.onToggleFavorite
  );
}

export default memo(ImageModal, propsEqual);
