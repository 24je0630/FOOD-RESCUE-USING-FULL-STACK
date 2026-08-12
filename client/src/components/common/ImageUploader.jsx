import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Button from '../ui/Button';

const ImageUploader = ({ 
  onImageSelect, 
  onImageClear,
  maxSizeMB = 5,
  isUploading = false,
  error = null,
  currentImageUrl = null
}) => {
  const [preview, setPreview] = useState(currentImageUrl);
  const [localError, setLocalError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setLocalError('');
    
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setLocalError('Only JPG, PNG, and WebP formats are allowed.');
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`File size must be less than ${maxSizeMB}MB.`);
      return;
    }

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    if (onImageSelect) {
      onImageSelect(file);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setLocalError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageClear) {
      onImageClear();
    }
  };

  const displayError = error || localError;

  return (
    <div className="w-full">
      {!preview ? (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-10 w-10 text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700">Click to upload image</p>
          <p className="text-xs text-gray-500 mt-1">JPG, PNG, or WebP (max {maxSizeMB}MB)</p>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <img src={preview} alt="Preview" className="w-full max-h-64 object-contain bg-gray-50" />
          {!isUploading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 bg-white/80 p-1 rounded-full shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-white/50 flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
              <span className="text-sm font-medium text-emerald-800">Uploading...</span>
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg, image/png, image/webp"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {displayError && (
        <p className="mt-2 text-sm text-red-600 font-medium">{displayError}</p>
      )}
    </div>
  );
};

export default ImageUploader;
