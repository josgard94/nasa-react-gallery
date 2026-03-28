import React, { memo } from 'react';
import ImageCard from './ImageCard';
import { favoriteId } from './favoritesStorage';
import styles from './FavoritesCollection.module.css';

function FavoritesCollection({ favorites, onOpenModal, onToggleFavorite }) {
  if (!favorites.length) {
    return (
      <div className={styles.empty} role="status">
        <div className={styles.emptyInner}>
          <span className={styles.emptyIcon} aria-hidden>
            ☆
          </span>
          <h2 className={styles.emptyTitle}>Your saved picks will appear here</h2>
          <p className={styles.emptyText}>
            Tap the star on any card in the Gallery to bookmark it. Favorites stay on this
            browser only, via <strong>localStorage</strong>, and survive a refresh—nothing is
            sent to a server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="favorites-heading">
      <header className={styles.header}>
        <h2 id="favorites-heading" className={styles.heading}>
          Favorites
        </h2>
        <p className={styles.meta}>
          {favorites.length} {favorites.length === 1 ? 'image saved' : 'images saved'}
        </p>
      </header>
      <div className={styles.masonry}>
        {favorites.map((image, index) => (
          <ImageCard
            key={favoriteId(image) || index}
            image={image}
            onOpen={onOpenModal}
            isFavorite
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </section>
  );
}

export default memo(FavoritesCollection);
