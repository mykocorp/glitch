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
    <div className="border border-gray-700 p-4 bg-gray-900/50">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-blue-400 text-sm">
          IMAGE SOURCE
        </label>
        {hasImage && (
          <button
            onClick={onClearImage}
            disabled={isValidating}
            className="px-2 py-1 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black disabled:opacity-50 transition-all text-xs flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            CLEAR
          </button>
        )}
      </div>
      
      <button
        onClick={handleClick}
        disabled={isValidating}
        className="w-full px-4 py-3 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2"
      >
        {isValidating ? (
          <>
            <div className="w-4 h-4 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            VALIDATING...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            {hasImage ? 'REPLACE IMAGE' : 'UPLOAD IMAGE'}
          </>
        )}
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleInputChange}
        disabled={isValidating}
        className="hidden"
      />
      
      {uploadError && (
        <div className="mt-3 p-2 border border-red-600 bg-red-900/20 text-red-400 text-xs flex items-start gap-2">
          <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}
      
      <div className="text-xs text-gray-400 mt-2 space-y-1">
        <p className="text-center">JPG, PNG, GIF, WEBP • Max: 50MB</p>
        <p className="text-center">Recommended: Under 2048×2048px for best performance</p>
        <p className="text-center">Large images will be automatically resized</p>
      </div>
    </div>
  );
};