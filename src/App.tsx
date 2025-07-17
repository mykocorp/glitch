import React, { useState, useCallback } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { EffectControls, EffectSettings } from './components/EffectControls';
import { ImageCanvas } from './components/ImageCanvas';
import { ImageProcessor } from './utils/imageProcessor';

function App() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  const [effects, setEffects] = useState<EffectSettings>({
    scanlines: 30,
    chromatic: 15,
    colorBleed: 20,
    noise: 25,
    pixelation: 0,
    crtBezel: true,
    datamosh: 0,
    pixelSort: 0,
    displacement: 0,
    colorShift: 0,
    anaglyph: 0,
    anaglyphOffset: 5
  });

  const handleImageLoad = useCallback(async (file: File) => {
    setLoadingError(null);
    
    try {
      const reader = new FileReader();
      
      const imageLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
        reader.onload = (e) => {
          const img = new Image();
          
          img.onload = () => {
            // Final validation after image loads
            const validation = ImageProcessor.validateImage(img.width, img.height);
            if (!validation.valid) {
              reject(new Error(validation.reason));
              return;
            }
            resolve(img);
          };
          
          img.onerror = () => {
            reject(new Error('Failed to decode image. File may be corrupted.'));
          };
          
          img.src = e.target?.result as string;
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read file. Please try again.'));
        };
      });
      
      reader.readAsDataURL(file);
      const img = await imageLoadPromise;
      
      // Clean up previous image
      if (originalImage) {
        URL.revokeObjectURL(originalImage.src);
      }
      
      setOriginalImage(img);
      
    } catch (error) {
      console.error('Image loading error:', error);
      setLoadingError(error instanceof Error ? error.message : 'Failed to load image');
    }
  }, [originalImage]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      await handleImageLoad(imageFile);
    } else {
      setLoadingError('Please drop an image file (JPG, PNG, GIF, WEBP)');
    }
  }, [handleImageLoad]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const resetEffects = useCallback(() => {
    setEffects({
      scanlines: 30,
      chromatic: 15,
      colorBleed: 20,
      noise: 25,
      pixelation: 0,
      crtBezel: true,
      datamosh: 0,
      pixelSort: 0,
      displacement: 0,
      colorShift: 0,
      anaglyph: 0,
      anaglyphOffset: 5
    });
  }, []);

  const updateEffect = useCallback((key: keyof EffectSettings, value: number | boolean) => {
    setEffects(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearImage = useCallback(() => {
    if (originalImage) {
      URL.revokeObjectURL(originalImage.src);
    }
    setOriginalImage(null);
    setLoadingError(null);
    
    // Force cleanup
    if (window.gc) {
      window.gc();
    }
  }, [originalImage]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (originalImage) {
        URL.revokeObjectURL(originalImage.src);
      }
    };
  }, [originalImage]);

  return (
    <div 
      className={`min-h-screen bg-black text-green-400 font-mono overflow-x-auto transition-all ${
        isDragging ? 'bg-amber-400/10' : ''
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Scanline animation overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400 to-transparent h-1 animate-pulse"></div>
      </div>
      
      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-amber-400/20 border-4 border-dashed border-amber-400 z-50 flex items-center justify-center pointer-events-none">
          <div className="text-4xl text-amber-400 font-bold">
            DROP IMAGE HERE
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-amber-400 tracking-wider">
            ▄▄▄ VHS GLITCH LAB ▄▄▄
          </h1>
          <p className="text-blue-400 text-sm">:: ENHANCED RETRO IMAGE PROCESSOR v2.0 ::</p>
        </div>

        {/* Global error display */}
        {loadingError && (
          <div className="mb-6 border border-red-600 bg-red-900/20 p-4 text-red-400 text-sm">
            <strong>Error:</strong> {loadingError}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Canvas Display */}
          <div className="space-y-4">
            <ImageCanvas originalImage={originalImage} effects={effects} />
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Image Upload */}
            <ImageUpload 
              onImageLoad={handleImageLoad}
              onClearImage={clearImage}
              hasImage={!!originalImage}
            />

            {/* Effect Controls */}
            <EffectControls
              effects={effects}
              onEffectChange={updateEffect}
              onReset={resetEffects}
              onPreset={setEffects}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 border border-gray-700 p-4 bg-gray-900/50">
          <h3 className="text-amber-400 mb-2 text-sm">PERFORMANCE OPTIMIZATIONS:</h3>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• Large images (&gt;4096px) are automatically resized for optimal performance</p>
            <p>• Effects are processed in chunks to prevent browser freezing</p>
            <p>• Memory usage is monitored and optimized for stability</p>
            <p>• Real-time processing with debounced updates for smooth interaction</p>
            <p>• Maximum supported dimensions: 8000×8000px, 50MB file size</p>
            <p>• Use ANAGLYPH 3D effects with red-blue glasses for stereoscopic viewing</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;