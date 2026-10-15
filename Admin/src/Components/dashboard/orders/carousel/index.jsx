// src/Carousel.js
import React, { useState } from "react";

const Carousel = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Function to go to the next image
    const nextImage = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    // Function to go to the previous image
    const prevImage = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    return (
        <div className="carousel">
            <div className="carousel-container">
                <img
                    src={images[currentIndex]}
                    alt="carousel"
                    className="carousel-image"
                />
            </div>
            {images.length > 1 && (
                <>
                    <button className="prev-button" onClick={prevImage}>
                        &#10094;
                    </button>
                    <button className="next-button" onClick={nextImage}>
                        &#10095;
                    </button>
                </>
            )}
        </div>
    );
};

export default Carousel;
