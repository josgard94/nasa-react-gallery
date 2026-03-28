const STORAGE_KEY = 'nasa-gallery-favorites';

export function favoriteId(item) {
  if (!item) return '';
  return item.date || item.url || '';
}

/** Minimal fields for card, modal, and video thumbnail. */
export function snapshotFavorite(image) {
  if (!image || !image.url) return null;
  return {
    date: image.date,
    url: image.url,
    title: image.title,
    explanation: image.explanation,
    copyright: image.copyright,
    media_type: image.media_type,
    thumbnail_url: image.thumbnail_url,
    hdurl: image.hdurl,
  };
}

function isFavoriteRecord(x) {
  return x && typeof x === 'object' && typeof x.url === 'string' && x.url.length > 0;
}

/**
 * Load favorites from localStorage.
 * Current format: array of APOD snapshot objects.
 * Legacy format: array of string ids only — cannot restore images; returns [].
 */
export function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return [];
    if (typeof data[0] === 'string') {
      return [];
    }
    const list = data.filter(isFavoriteRecord);
    const seen = new Set();
    return list.filter((item) => {
      const id = favoriteId(item);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  } catch {
    return [];
  }
}

export function saveFavorites(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota or other storage errors */
  }
}

export function favoritesToKeySet(list) {
  return new Set(list.map((x) => favoriteId(x)).filter(Boolean));
}
