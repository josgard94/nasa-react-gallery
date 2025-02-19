import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const path = process.env.REACT_APP_ROOT_API
  useEffect(() => {
    console.log('path', path);
    fetch(`${path}`)
      .then(response => response.json())
      .then(data =>{setImages(data); console.log('data', data);})
      .catch(error => console.error('Error fetching images from NASA API:', error));
  }, []);

  const openModal = (image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Cosmic Gallery</h1>
      </header>
      
      <div className="gallery">
        {images.map((image, index) => (
          <div key={index} className="image-card" onClick={() => openModal(image)}>
            <img src={image.url} alt={image.title} className="image" />
            <div className="image-info">
              <h2>{image.title}</h2>
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
            
            <p>{selectedImage.explanation}</p>
            <p><strong>Date:</strong> {selectedImage.date}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
