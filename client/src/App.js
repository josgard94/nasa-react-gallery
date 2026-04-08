import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  NavLink,
} from 'react-router-dom';
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

const GA_MEASUREMENT_ID = 'G-SC0QFEQTEW';

const PATH_TO_TAB = {
  '/gallery': 'gallery',
  '/favorites': 'favorites',
  '/space-weather': 'alerts',
};

function itemsFromApodPayload(data) {
  if (!data || typeof data !== 'object') return [];
  return Array.isArray(data) ? data : [data];
}

function NasaGalleryApp() {
  const location = useLocation();
  const navigate = useNavigate();

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

  const mainTab = PATH_TO_TAB[location.pathname] ?? 'gallery';

  const path = process.env.REACT_APP_ROOT_API;

  const favoriteKeys = useMemo(() => favoritesToKeySet(favorites), [favorites]);

  useEffect(() => {
    if (!PATH_TO_TAB[location.pathname]) {
      navigate('/gallery', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!PATH_TO_TAB[location.pathname] || typeof window.gtag !== 'function') return;
    const base = process.env.PUBLIC_URL || '';
    const pagePath = `${base}${location.pathname}`.replace(/\/{2,}/g, '/');
    window.gtag('config', GA_MEASUREMENT_ID, { page_path: pagePath });
  }, [location.pathname]);

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
            <NavLink
              to="/gallery"
              role="tab"
              id="tab-gallery"
              aria-selected={location.pathname === '/gallery'}
              aria-controls="panel-gallery"
              className={({ isActive }) =>
                `app-tab${isActive ? ' app-tab--active' : ''}`
              }
            >
              Gallery
            </NavLink>
            <NavLink
              to="/favorites"
              role="tab"
              id="tab-favorites"
              aria-selected={location.pathname === '/favorites'}
              aria-controls="panel-favorites"
              className={({ isActive }) =>
                `app-tab${isActive ? ' app-tab--active' : ''}`
              }
            >
              Favorites
              {favorites.length > 0 && (
                <span className="app-tab__badge" aria-hidden>
                  {favorites.length}
                </span>
              )}
            </NavLink>
            <NavLink
              to="/space-weather"
              role="tab"
              id="tab-alerts"
              aria-selected={location.pathname === '/space-weather'}
              aria-controls="panel-alerts"
              className={({ isActive }) =>
                `app-tab${isActive ? ' app-tab--active' : ''}`
              }
            >
              Space weather
            </NavLink>
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
              https://api.nasa.gov/planetary/apod?api_key=YOUR_KEY&count=8
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

function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL ?? ''}>
      <Routes>
        <Route path="/" element={<Navigate to="/gallery" replace />} />
        <Route path="*" element={<NasaGalleryApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
