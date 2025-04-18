import React, { useEffect } from 'react';
import Image from 'next/image';

export default function ImageModal({ imageUrl, alt, onClose }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center overflow-y-auto"
      style={{ 
        zIndex: 40
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="relative bg-white rounded-lg p-4 w-full max-w-2xl shadow-xl animate-modal-appear my-8 mx-4"
        style={{ zIndex: 41 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300"
        >
          Close
        </button>
        <div className="relative w-full">
          <Image
            src={imageUrl}
            alt={alt}
            width={600}
            height={400}
            className="w-full object-contain rounded-lg"
            priority
          />
        </div>
      </div>
    </div>
  );
} 