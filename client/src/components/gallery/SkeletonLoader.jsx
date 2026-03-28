import React, { memo } from 'react';
import styles from './SkeletonLoader.module.css';

function SkeletonLoader({ count = 9 }) {
  return (
    <div className={styles.grid} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.shimmer} />
          <div className={styles.body}>
            <div className={`${styles.line} ${styles.lineTitle}`} />
            <div className={`${styles.line} ${styles.lineMeta}`} />
            <div className={styles.line} />
            <div className={`${styles.line} ${styles.lineShort}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(SkeletonLoader);
