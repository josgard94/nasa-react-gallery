import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { HashLoader } from 'react-spinners';

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
    return localStorage.getItem("darkMode") === "true";
  });

  const path = process.env.REACT_APP_ROOT_API;

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
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const openModal = (image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };


  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        color: '#fff',
        flexDirection: 'column',
      }}>
        <HashLoader size={60} color="#ffffff" />
        <p style={{ marginTop: '1rem' }}>Loading cosmic images...</p>
      </div>
    );
  }

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };


  return (
    <div className="App">
      <header className="App-header">
        <h1 className="logo">🚀 Cosmic Gallery</h1>
        <div className="header-actions">
          <button
            type="button"
            className="refresh-gallery"
            onClick={loadImages}
            disabled={loading}
            aria-busy={loading}
          >
            🔄 New images
          </button>
          <button type="button" className="theme-toggle" onClick={toggleTheme}>
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </header>

      {apiError && (
        <div className="api-error-banner" role="alert">
          <p className="api-error-title">Could not load images</p>
          <p className="api-error-detail">{apiError}</p>
          <p className="api-error-hint">
            Get a free key at{' '}
            <a href="https://api.nasa.gov/" target="_blank" rel="noopener noreferrer">
              api.nasa.gov
            </a>
            . Put it in <code>REACT_APP_ROOT_API</code> inside <code>client/.env</code>, for example:{' '}
            <code className="api-error-example">
              https://api.nasa.gov/planetary/apod?api_key=YOUR_KEY&amp;count=6
            </code>
            , then restart <code>npm start</code>.
          </p>
        </div>
      )}

      <div className="gallery">
        {images.map((image, index) => (
          <div key={image.date ?? index} className="image-card" onClick={() => openModal(image)}>
            <img src={image.url} alt={image.title} className="image" loading="lazy" />
            <div className="image-info">
              <h2>{image.title}</h2>
              <p><strong>Photographer:</strong> {image.copyright ? image.copyright : "Unknown"}</p>
              <p>{image.explanation}</p>
              <p><strong>Date:</strong> {image.date}</p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <span className="close" onClick={closeModal}>&times;</span>
            <h2>{selectedImage.title}</h2>
            <img src={selectedImage.url} alt={selectedImage.title} className="modal-image" />
            <p><strong>Photographer:</strong> {selectedImage.copyright ? selectedImage.copyright : "Unknown"}</p>
            <p>{selectedImage.explanation}</p>
            <p><strong>Date:</strong> {selectedImage.date}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
