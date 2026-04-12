import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

export default function Carousel({
  children,
  autoPlay = true,
  interval = 5000,
  showDots = true,
  showArrows = true,
  className = '',
}) {
  const slides = React.Children.toArray(children);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const goTo = useCallback((index) => {
    setCurrent((index + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (autoPlay && !paused && slides.length > 1) {
      timerRef.current = setInterval(next, interval);
    }
    return () => clearInterval(timerRef.current);
  }, [autoPlay, paused, next, interval, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      className={`carousel ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="carousel-track"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div className="carousel-slide" key={i}>
            {slide}
          </div>
        ))}
      </div>

      {showArrows && slides.length > 1 && (
        <>
          <button className="carousel-btn carousel-btn-prev" onClick={prev} aria-label="Previous slide">
            <ChevronLeftIcon size={20} />
          </button>
          <button className="carousel-btn carousel-btn-next" onClick={next} aria-label="Next slide">
            <ChevronRightIcon size={20} />
          </button>
        </>
      )}

      {showDots && slides.length > 1 && (
        <div className="carousel-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i === current ? 'active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
