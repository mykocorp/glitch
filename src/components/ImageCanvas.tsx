import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Download, AlertTriangle, Info } from 'lucide-react';
import { EffectSettings } from './EffectControls';
import { ImageProcessor } from '../utils/imageProcessor';

interface ImageCanvasProps {
  originalImage: HTMLImageElement | null;
  effects: EffectSettings;
}

export const ImageCanvas: React.FC<ImageCanvasProps> = ({ originalImage, effects }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageInfo, setImageInfo] = useState<{
    original: { width: number; height: number };
    processed: { width: number; height: number };
    wasResized: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Optimized effect functions with chunked processing
  const drawScanlines = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (effects.scanlines === 0) return;
    
    const intensity = effects.scanlines / 100;
    const lineSpacing = Math.max(1, Math.floor(4 / intensity));
    
    // Use requestAnimationFrame for smooth rendering
    const drawLines = () => {
      ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = `rgba(0, 0, 0, ${0.3 * intensity})`;
      ctx.lineWidth = 1;
      
      // Batch line drawing for better performance
      ctx.beginPath();
      for (let y = 0; y < canvas.height; y += lineSpacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    };
    
    requestAnimationFrame(drawLines);
  }, [effects.scanlines]);

  const applyChromaticAberration = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (effects.chromatic === 0) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const offset = Math.floor((effects.chromatic / 100) * 8);
    
    // Use typed arrays for better performance
    const newData = new Uint8ClampedArray(data.length);
    newData.set(data); // Copy original data
    
    // Process in chunks to prevent blocking
    ImageProcessor.processImageDataInChunks(imageData, (data, startIdx, endIdx) => {
      for (let i = startIdx; i < endIdx; i += 4) {
        const pixelIndex = i / 4;
        const x = pixelIndex % canvas.width;
        const y = Math.floor(pixelIndex / canvas.width);
        
        // Shift red channel
        const redX = Math.min(canvas.width - 1, x + offset);
        const redIdx = (y * canvas.width + redX) * 4;
        if (redIdx < data.length) newData[i] = data[redIdx];
        
        // Shift blue channel
        const blueX = Math.max(0, x - offset);
        const blueIdx = (y * canvas.width + blueX) * 4;
        if (blueIdx < data.length) newData[i + 2] = data[blueIdx + 2];
      }
    });
    
    const newImageData = new ImageData(newData, canvas.width, canvas.height);
    ctx.putImageData(newImageData, 0, 0);
  }, [effects.chromatic]);

  const applyColorBleed = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (effects.colorBleed === 0) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const intensity = effects.colorBleed / 100;
    
    // Vectorized processing for better performance
    const redMultiplier = 1 + intensity * 0.3;
    const greenMultiplier = 1 - intensity * 0.2;
    const blueMultiplier = 1 + intensity * 0.4;
    
    ImageProcessor.processImageDataInChunks(imageData, (data, startIdx, endIdx) => {
      for (let i = startIdx; i < endIdx; i += 4) {
        data[i] = Math.min(255, data[i] * redMultiplier);
        data[i + 1] = Math.max(0, data[i + 1] * greenMultiplier);
        data[i + 2] = Math.min(255, data[i + 2] * blueMultiplier);
      }
    });
    
    ctx.putImageData(imageData, 0, 0);
  }, [effects.colorBleed]);

  const applyNoise = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (effects.noise === 0) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const intensity = effects.noise / 100;
    const noiseStrength = intensity * 50;
    
    // Pre-generate noise values for better performance
    const noiseCache = new Float32Array(1000);
    for (let i = 0; i < noiseCache.length; i++) {
      noiseCache[i] = (Math.random() - 0.5) * noiseStrength;
    }
    
    ImageProcessor.processImageDataInChunks(imageData, (data, startIdx, endIdx) => {
      for (let i = startIdx; i < endIdx; i += 4) {
        const noise = noiseCache[Math.floor(Math.random() * noiseCache.length)];
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
      }
    });
    
    ctx.putImageData(imageData, 0, 0);
  }, [effects.noise]);

  const applyPixelation = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (effects.pixelation === 0) return;
    
    const pixelSize = Math.floor((effects.pixelation / 100) * 12) + 1;
    
    // Use batch operations for better performance
    for (let y = 0; y < canvas.height; y += pixelSize) {
      for (let x = 0; x < canvas.width; x += pixelSize) {
        try {
          const pixelData = ctx.getImageData(x, y, 1, 1).data;
          ctx.fillStyle = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;
          ctx.fillRect(x, y, pixelSize, pixelSize);
        } catch (e) {
          // Skip invalid pixels
          continue;
        }
      }
    }
  }, [effects.pixelation]);

  // Advanced effects with optimizations
  const applyDatamosh = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (effects.datamosh === 0) return;
    
    const intensity = effects.datamosh / 100;
    const blockSize = Math.floor(intensity * 20) + 5;
    
    // Limit number of operations for performance
    const maxOperations = Math.min(100, Math.floor((canvas.width * canvas.height) / (blockSize * blockSize) * intensity * 0.3));
    
    for (let op = 0; op < maxOperations; op++) {
      const x = Math.floor(Math.random() * (canvas.width - blockSize));
      const y = Math.floor(Math.random() * (canvas.height - blockSize));
      const sourceX = Math.floor(Math.random() * (canvas.width - blockSize));
      const sourceY = Math.floor(Math.random() * (canvas.height - blockSize));
      
      try {
        const sourceData = ctx.getImageData(sourceX, sourceY, blockSize, blockSize);
        ctx.putImageData(sourceData, x, y);
      } catch (e) {
        // Skip invalid operations
        continue;
      }
    }
  }, [effects.datamosh]);

  const applyPixelSort = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (effects.pixelSort === 0) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const intensity = effects.pixelSort / 100;
    const bandHeight = Math.max(1, Math.floor(20 * (1 - intensity)));
    
    // Limit processing to prevent performance issues
    const maxBands = Math.min(50, Math.floor(canvas.height / bandHeight));
    
    for (let bandIndex = 0; bandIndex < maxBands; bandIndex++) {
      const y = bandIndex * bandHeight;
      if (y >= canvas.height || Math.random() > intensity) continue;
      
      const endY = Math.min(y + bandHeight, canvas.height);
      const rowPixels: Array<{r: number; g: number; b: number; a: number; brightness: number}> = [];
      
      // Extract pixels from band
      for (let row = y; row < endY; row++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (row * canvas.width + x) * 4;
          const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          rowPixels.push({
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2],
            a: data[idx + 3],
            brightness
          });
        }
      }
      
      // Sort by brightness
      rowPixels.sort((a, b) => a.brightness - b.brightness);
      
      // Put sorted pixels back
      rowPixels.forEach((pixel, index) => {
        const targetX = index % canvas.width;
        const targetY = y + Math.floor(index / canvas.width);
        if (targetY < endY) {
          const idx = (targetY * canvas.width + targetX) * 4;
          data[idx] = pixel.r;
          data[idx + 1] = pixel.g;
          data[idx + 2] = pixel.b;
          data[idx + 3] = pixel.a;
        }
      });
    }
    
    ctx.putImageData(imageData, 0, 0);
  }, [effects.pixelSort]);

  const applyDisplacement = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (effects.displacement === 0) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const newData = new Uint8ClampedArray(data.length);
    const intensity = effects.displacement / 100;
    const maxDisplacement = Math.floor(intensity * 20);
    
    ImageProcessor.processImageDataInChunks(imageData, (data, startIdx, endIdx) => {
      for (let i = startIdx; i < endIdx; i += 4) {
        const pixelIndex = i / 4;
        const x = pixelIndex % canvas.width;
        const y = Math.floor(pixelIndex / canvas.width);
        
        const noise = Math.sin(x * 0.1 + y * 0.1) * intensity;
        const displaceX = Math.floor(noise * maxDisplacement);
        const displaceY = Math.floor(Math.sin(x * 0.05) * intensity * maxDisplacement * 0.5);
        
        const sourceX = Math.max(0, Math.min(canvas.width - 1, x + displaceX));
        const sourceY = Math.max(0, Math.min(canvas.height - 1, y + displaceY));
        const sourceIdx = (sourceY * canvas.width + sourceX) * 4;
        
        if (sourceIdx < data.length) {
          newData[i] = data[sourceIdx];
          newData[i + 1] = data[sourceIdx + 1];
          newData[i + 2] = data[sourceIdx + 2];
          newData[i + 3] = data[sourceIdx + 3];
        }
      }
    });
    
    const newImageData = new ImageData(newData, canvas.width, canvas.height);
    ctx.putImageData(newImageData, 0, 0);
  }, [effects.displacement]);

  const applyColorShift = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (effects.colorShift === 0) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const intensity = effects.colorShift / 100;
    
    ImageProcessor.processImageDataInChunks(imageData, (data, startIdx, endIdx) => {
      for (let i = startIdx; i < endIdx; i += 4) {
        const shift = Math.sin(i * 0.001) * intensity * 100;
        data[i] = Math.max(0, Math.min(255, data[i] + shift));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] - shift * 0.5));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + shift * 0.8));
      }
    });
    
    ctx.putImageData(imageData, 0, 0);
  }, [effects.colorShift]);

  const applyAnaglyph3D = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (effects.anaglyph === 0) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const newData = new Uint8ClampedArray(data.length);
    const intensity = effects.anaglyph / 100;
    const offset = effects.anaglyphOffset;
    
    // Clear new data
    newData.fill(0);
    
    ImageProcessor.processImageDataInChunks(imageData, (data, startIdx, endIdx) => {
      for (let i = startIdx; i < endIdx; i += 4) {
        const pixelIndex = i / 4;
        const x = pixelIndex % canvas.width;
        const y = Math.floor(pixelIndex / canvas.width);
        
        // Red channel (left eye)
        const redX = Math.max(0, x - offset);
        const redIdx = (y * canvas.width + redX) * 4;
        if (redIdx < data.length) {
          const redIntensity = (data[redIdx] + data[redIdx + 1] + data[redIdx + 2]) / 3;
          newData[i] = Math.min(255, redIntensity * intensity + data[i] * (1 - intensity));
        }
        
        // Blue channel (right eye)
        const blueX = Math.min(canvas.width - 1, x + offset);
        const blueIdx = (y * canvas.width + blueX) * 4;
        if (blueIdx < data.length) {
          const blueIntensity = (data[blueIdx] + data[blueIdx + 1] + data[blueIdx + 2]) / 3;
          newData[i + 2] = Math.min(255, blueIntensity * intensity + data[i + 2] * (1 - intensity));
        }
        
        // Green channel
        newData[i + 1] = data[i + 1] * (1 - intensity * 0.8);
        newData[i + 3] = data[i + 3]; // Alpha
      }
    });
    
    const newImageData = new ImageData(newData, canvas.width, canvas.height);
    ctx.putImageData(newImageData, 0, 0);
  }, [effects.anaglyph, effects.anaglyphOffset]);

  const drawCRTBezel = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!effects.crtBezel) return;
    
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
    );
    
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  }, [effects.crtBezel]);

  // Debounced effect application
  const debouncedApplyEffects = useCallback(
    ImageProcessor.debounce(async () => {
      if (!originalImage || !canvasRef.current) return;
      
      setIsProcessing(true);
      setError(null);
      
      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        
        // Validate and resize image if needed
        const validation = ImageProcessor.validateImage(originalImage.width, originalImage.height);
        if (!validation.valid) {
          throw new Error(validation.reason);
        }
        
        const resizeResult = ImageProcessor.resizeIfNeeded(canvas, ctx, originalImage, 4096);
        
        setImageInfo({
          original: { width: originalImage.width, height: originalImage.height },
          processed: { width: resizeResult.width, height: resizeResult.height },
          wasResized: resizeResult.wasResized
        });
        
        // Apply effects in optimized order with proper async handling
        const applyEffectsSequentially = async () => {
          // Apply effects that modify image data first
          applyColorBleed(ctx, canvas);
          await new Promise(resolve => setTimeout(resolve, 0)); // Yield control
          
          applyChromaticAberration(ctx, canvas);
          await new Promise(resolve => setTimeout(resolve, 0));
          
          applyDatamosh(ctx, canvas);
          await new Promise(resolve => setTimeout(resolve, 0));
          
          applyDisplacement(ctx, canvas);
          await new Promise(resolve => setTimeout(resolve, 0));
          
          applyPixelSort(ctx, canvas);
          await new Promise(resolve => setTimeout(resolve, 0));
          
          applyColorShift(ctx, canvas);
          await new Promise(resolve => setTimeout(resolve, 0));
          
          applyPixelation(ctx, canvas);
          await new Promise(resolve => setTimeout(resolve, 0));
          
          applyNoise(ctx, canvas);
          await new Promise(resolve => setTimeout(resolve, 0));
          
          applyAnaglyph3D(ctx, canvas);
          await new Promise(resolve => setTimeout(resolve, 0));
          
          // Apply overlay effects last
          drawScanlines(ctx, canvas);
          drawCRTBezel(ctx, canvas);
        };
        
        await applyEffectsSequentially();
        
      } catch (error) {
        console.error('Error applying effects:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsProcessing(false);
      }
    }, 150), // Slightly longer debounce for stability
    [
      originalImage, effects,
      applyColorBleed, applyChromaticAberration, applyDatamosh,
      applyDisplacement, applyPixelSort, applyColorShift,
      applyPixelation, applyNoise, applyAnaglyph3D,
      drawScanlines, drawCRTBezel
    ]
  );

  useEffect(() => {
    debouncedApplyEffects();
  }, [debouncedApplyEffects]);

  const downloadImage = () => {
    if (!canvasRef.current) return;
    try {
      const link = document.createElement('a');
      link.download = 'vhs-glitch-effect.png';
      link.href = canvasRef.current.toDataURL('image/png', 0.95);
      link.click();
    } catch (error) {
      setError('Failed to download image. Image may be too large.');
    }
  };

  if (!originalImage) {
    return (
      <div className="border border-gray-600 p-8 bg-gray-900 text-center">
        <p className="text-gray-400">No image loaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl text-amber-400">▸ PROCESSED OUTPUT</h2>
        <div className="flex items-center gap-2">
          {isProcessing && (
            <div className="text-yellow-400 text-sm flex items-center gap-1">
              <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
              PROCESSING...
            </div>
          )}
          <button
            onClick={downloadImage}
            disabled={isProcessing}
            className="px-3 py-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 transition-all text-sm flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            SAVE
          </button>
        </div>
      </div>
      
      {error && (
        <div className="border border-red-600 bg-red-900/20 p-3 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      
      {imageInfo?.wasResized && (
        <div className="border border-yellow-600 bg-yellow-900/20 p-3 text-yellow-400 text-sm flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          Image was resized from {imageInfo.original.width}×{imageInfo.original.height}px to {imageInfo.processed.width}×{imageInfo.processed.height}px for performance
        </div>
      )}
      
      <div className="border border-gray-600 p-4 bg-gray-900 overflow-auto">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-[600px] block mx-auto border border-gray-700"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      
      {imageInfo && (
        <div className="text-xs text-gray-400 text-center space-y-1">
          <p>Original: {imageInfo.original.width} × {imageInfo.original.height}px</p>
          <p>Processed: {imageInfo.processed.width} × {imageInfo.processed.height}px</p>
        </div>
      )}
    </div>
  );
};