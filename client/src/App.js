import React, { useState, useEffect } from 'react';
import './App.css';
import { HashLoader } from 'react-spinners';

function App() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true); 

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const path = process.env.REACT_APP_ROOT_API;

  useEffect(() => {
    console.log('path', path);
    fetch(`${path}`)
      .then(response => response.json())
      .then(data => {
        setImages(data);
        console.log('data', data);
      })
      .catch(error => console.error('Error fetching images from NASA API:', error))
      .finally(() => setLoading(false)); 
  }, []);

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
        <button className="theme-toggle" onClick={toggleTheme}>
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </header>

      
      <div className="gallery">
        {images.map((image, index) => (
          <div key={index} className="image-card" onClick={() => openModal(image)}>
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
