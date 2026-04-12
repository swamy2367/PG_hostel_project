import React, { useEffect, useRef, useState } from 'react';
import { XIcon } from './Icons';

export default function Modal({ isOpen, onClose, title, children, footer, size = 'default', closeOnOverlay = true }) {
  const [isExiting, setIsExiting] = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsExiting(false);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  function handleClose() {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      onClose();
    }, 200);
  }

  function handleOverlayClick(e) {
    if (closeOnOverlay && e.target === overlayRef.current) {
      handleClose();
    }
  }

  if (!isOpen && !isExiting) return null;

  const sizeClass = size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : '';

  return (
    <div
      ref={overlayRef}
      className={`modal-overlay ${isExiting ? 'modal-overlay-exit' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className={`modal ${sizeClass} ${isExiting ? 'modal-exit' : ''}`}>
        {title && (
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={handleClose}>
              <XIcon size={18} />
            </button>
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
