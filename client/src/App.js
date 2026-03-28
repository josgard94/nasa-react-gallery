import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import SpaceWeatherAlerts from './components/space-weather/SpaceWeatherAlerts';
import GalleryGrid from './components/gallery/GalleryGrid';
import ImageModal from './components/gallery/ImageModal';
import FavoritesCollection from './components/gallery/FavoritesCollection';
import {
  loadFavorites,
  saveFavorites,
  favoritesToKeySet,
  favoriteId,
  snapshotFavorite,
} from './components/gallery/favoritesStorage';

function itemsFromApodPayload(data) {
  if (!data || typeof data !== 'object') return [];
  return Array.isArray(data) ? data : [data];
}

function App() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [darkMode, setDarkMode] = useState(() => {
    const v = localStorage.getItem('darkMode');
    if (v === null) return true;
    return v === 'true';
  });

  const [favorites, setFavorites] = useState(loadFavorites);

  const [mainTab, setMainTab] = useState('gallery');

  const path = process.env.REACT_APP_ROOT_API;

  const favoriteKeys = useMemo(() => favoritesToKeySet(favorites), [favorites]);

  const loadImages = useCallback(() => {
    setApiError(null);
    if (!path) {
      setImages([]);
      setApiError(
        'Missing REACT_APP_ROOT_API. Add your NASA API URL to client/.env (see README), then restart the dev server.'
      );
      setLoading(false);
      return;
    }
    setIsModalOpen(false);
    setSelectedImage(null);
    setLoading(true);
    fetch(path, { cache: 'no-store' })
      .then(async (response) => {
        let data;
        try {
          data = await response.json();
        } catch {
          setImages([]);
          setApiError('The server returned a response that is not valid JSON.');
          return;
        }
        if (data?.error) {
          const e = data.error;
          console.error('NASA API error:', e);
          setImages([]);
          setApiError(
            [e.code, e.message].filter(Boolean).join(': ') || 'NASA API rejected the request.'
          );
          return;
        }
        if (!response.ok) {
          setImages([]);
          setApiError(`Request failed (${response.status}).`);
          return;
        }
        setImages(itemsFromApodPayload(data).filter((item) => item && item.url));
        setApiError(null);
      })
      .catch((error) => {
        console.error('Error fetching images from NASA API:', error);
        setImages([]);
        setApiError('Network error. Check your connection and try again.');
      })
      .finally(() => setLoading(false));
  }, [path]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const openModal = useCallback((image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedImage(null);
  }, []);

  const toggleFavorite = useCallback((image) => {
    const id = favoriteId(image);
    if (!id) return;
    setFavorites((prev) => {
      const exists = prev.some((x) => favoriteId(x) === id);
      let next;
      if (exists) {
        next = prev.filter((x) => favoriteId(x) !== id);
      } else {
        const snap = snapshotFavorite(image);
        if (!snap) return prev;
        next = [...prev.filter((x) => favoriteId(x) !== id), snap];
      }
      saveFavorites(next);
      return next;
    });
  }, []);

  const selectedFavorite = useMemo(() => {
    if (!selectedImage) return false;
    return favoriteKeys.has(favoriteId(selectedImage));
  }, [selectedImage, favoriteKeys]);

  const toggleTheme = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div className="App-header__brand">
          <h1 className="logo">NASA Gallery</h1>
          <p className="App-header__subtitle">Astronomy Picture of the Day</p>
        </div>
        <div className="App-header__center">
          <nav className="app-tabs" role="tablist" aria-label="Main sections">
            <button
              type="button"
              role="tab"
              id="tab-gallery"
              aria-selected={mainTab === 'gallery'}
              aria-controls="panel-gallery"
              className={`app-tab${mainTab === 'gallery' ? ' app-tab--active' : ''}`}
              onClick={() => setMainTab('gallery')}
            >
              Gallery
            </button>
            <button
              type="button"
              role="tab"
              id="tab-favorites"
              aria-selected={mainTab === 'favorites'}
              aria-controls="panel-favorites"
              className={`app-tab${mainTab === 'favorites' ? ' app-tab--active' : ''}`}
              onClick={() => setMainTab('favorites')}
            >
              Favorites
              {favorites.length > 0 && (
                <span className="app-tab__badge" aria-hidden>
                  {favorites.length}
                </span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              id="tab-alerts"
              aria-selected={mainTab === 'alerts'}
              aria-controls="panel-alerts"
              className={`app-tab${mainTab === 'alerts' ? ' app-tab--active' : ''}`}
              onClick={() => setMainTab('alerts')}
            >
              Space weather
            </button>
          </nav>
        </div>
        <div className="header-actions">
          {mainTab === 'gallery' && (
            <button
              type="button"
              className="refresh-gallery"
              onClick={loadImages}
              disabled={loading}
              aria-busy={loading}
            >
              Refresh
            </button>
          )}
          <button type="button" className="theme-toggle" onClick={toggleTheme}>
            {darkMode ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </header>

      {apiError && (
        <div className="api-error-banner" role="alert">
          <p className="api-error-title">Could not load images</p>
          <p className="api-error-detail">{apiError}</p>
          <p className="api-error-hint">
            Get a free API key at{' '}
            <a href="https://api.nasa.gov/" target="_blank" rel="noopener noreferrer">
              api.nasa.gov
            </a>
            . Add it to <code>REACT_APP_ROOT_API</code> inside <code>client/.env</code>, for example:{' '}
            <code className="api-error-example">
              https://api.nasa.gov/planetary/apod?api_key=YOUR_KEY&count=6
            </code>
            , then restart <code>npm start</code>.
          </p>
        </div>
      )}

      <div
        id="panel-gallery"
        role="tabpanel"
        aria-labelledby="tab-gallery"
        hidden={mainTab !== 'gallery'}
        className="app-tab-panel"
      >
        <GalleryGrid
          images={images}
          loading={loading}
          onOpenModal={openModal}
          favoriteKeys={favoriteKeys}
          onToggleFavorite={toggleFavorite}
        />
      </div>

      <div
        id="panel-favorites"
        role="tabpanel"
        aria-labelledby="tab-favorites"
        hidden={mainTab !== 'favorites'}
        className="app-tab-panel"
      >
        <FavoritesCollection
          favorites={favorites}
          onOpenModal={openModal}
          onToggleFavorite={toggleFavorite}
        />
      </div>

      <div
        id="panel-alerts"
        role="tabpanel"
        aria-labelledby="tab-alerts"
        hidden={mainTab !== 'alerts'}
        className="app-tab-panel"
      >
        <SpaceWeatherAlerts />
      </div>

      {isModalOpen && selectedImage && (
        <ImageModal
          image={selectedImage}
          isFavorite={selectedFavorite}
          onClose={closeModal}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
}

export default App;
