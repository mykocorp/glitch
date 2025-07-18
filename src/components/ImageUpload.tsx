import React, { useRef, useState } from 'react';
import { Upload, X, AlertTriangle } from 'lucide-react';

interface ImageUploadProps {
  onImageLoad: (file: File) => void;
  onClearImage: () => void;
  hasImage: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageLoad, onClearImage, hasImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Please select a valid image file' };
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size too large. Maximum: 50MB' };
    }

    // Check for supported formats
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedTypes.includes(file.type.toLowerCase())) {
      return { valid: false, error: 'Unsupported format. Use JPG, PNG, GIF, or WEBP' };
    }

    return { valid: true };
  };

  const validateImageDimensions = (img: HTMLImageElement): { valid: boolean; error?: string } => {
    const maxDimension = 8000;
    const maxPixels = 64000000; // 8000 * 8000

    if (img.width > maxDimension || img.height > maxDimension) {
      return {
        valid: false,
        error: `Image dimensions too large. Maximum: ${maxDimension}×${maxDimension}px`
      };
    }

    if (img.width * img.height > maxPixels) {
      return {
        valid: false,
        error: `Image has too many pixels. Maximum: ${maxDimension}×${maxDimension}px`
      };
    }

    return { valid: true };
  };

  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    setIsValidating(true);

    try {
      // Validate file
      const fileValidation = validateFile(file);
      if (!fileValidation.valid) {
        setUploadError(fileValidation.error!);
        return;
      }

      // Create image object to validate dimensions
      const img = new Image();
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const dimensionValidation = validateImageDimensions(img);
          if (!dimensionValidation.valid) {
            reject(new Error(dimensionValidation.error));
            return;
          }
          resolve();
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image. File may be corrupted.'));
        };
        
        // Set a timeout for loading
        setTimeout(() => {
          reject(new Error('Image loading timed out. File may be too large or corrupted.'));
        }, 10000);
        
        img.src = URL.createObjectURL(file);
      });

      // If we get here, the image is valid
      onImageLoad(file);
      
    } catch (error) {
      console.error('Image validation error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to process image');
    } finally {
      setIsValidating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleClick = () => {
    if (isValidating) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="border border-blue-400 p-2 bg-black">
      <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isValidating}
        className="px-3 py-1 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs"
      >
        {isValidating ? (
          'WAIT...'
        ) : (
          hasImage ? 'REPLACE' : 'UPLOAD'
        )}
      </button>
      
      {hasImage && (
        <button
          onClick={onClearImage}
          disabled={isValidating}
          className="px-3 py-1 border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black disabled:opacity-50 transition-all text-xs"
        >
          RESET
        </button>
      )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleInputChange}
        disabled={isValidating}
        className="hidden"
      />
      
      {uploadError && (
        <div className="mt-2 p-1 border border-yellow-400 bg-yellow-400/10 text-yellow-400 text-xs">
          {uploadError}
        </div>
      )}
    </div>
  );
};