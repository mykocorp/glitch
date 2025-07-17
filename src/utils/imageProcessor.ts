/**
 * Image processing utilities with performance optimizations
 * Handles large images through chunking and memory management
 */

export interface ProcessingOptions {
  maxDimension?: number;
  quality?: number;
  chunkSize?: number;
}

export class ImageProcessor {
  private static readonly MAX_CANVAS_SIZE = 8000; // Safe canvas limit
  private static readonly CHUNK_SIZE = 1024; // Process in 1024px chunks
  private static readonly MAX_MEMORY_USAGE = 200 * 1024 * 1024; // 200MB limit

  /**
   * Validates image dimensions and memory requirements
   */
  static validateImage(width: number, height: number): { valid: boolean; reason?: string } {
    const pixelCount = width * height;
    const estimatedMemory = pixelCount * 4; // 4 bytes per pixel (RGBA)

    if (width > this.MAX_CANVAS_SIZE || height > this.MAX_CANVAS_SIZE) {
      return {
        valid: false,
        reason: `Image dimensions too large. Maximum: ${this.MAX_CANVAS_SIZE}x${this.MAX_CANVAS_SIZE}px`
      };
    }

    if (estimatedMemory > this.MAX_MEMORY_USAGE) {
      return {
        valid: false,
        reason: `Image requires too much memory (${Math.round(estimatedMemory / 1024 / 1024)}MB). Maximum: ${Math.round(this.MAX_MEMORY_USAGE / 1024 / 1024)}MB`
      };
    }

    return { valid: true };
  }

  /**
   * Resizes image if it exceeds safe dimensions while maintaining aspect ratio
   */
  static resizeIfNeeded(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    maxDimension: number = 2048
  ): { width: number; height: number; wasResized: boolean } {
    const { width: originalWidth, height: originalHeight } = image;
    
    if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
      canvas.width = originalWidth;
      canvas.height = originalHeight;
      ctx.drawImage(image, 0, 0);
      return { width: originalWidth, height: originalHeight, wasResized: false };
    }

    // Calculate new dimensions maintaining aspect ratio
    const aspectRatio = originalWidth / originalHeight;
    let newWidth, newHeight;

    if (originalWidth > originalHeight) {
      newWidth = maxDimension;
      newHeight = maxDimension / aspectRatio;
    } else {
      newHeight = maxDimension;
      newWidth = maxDimension * aspectRatio;
    }

    canvas.width = Math.floor(newWidth);
    canvas.height = Math.floor(newHeight);
    
    // Use high-quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return { width: canvas.width, height: canvas.height, wasResized: true };
  }

  /**
   * Processes image data in chunks to prevent memory issues
   */
  static processImageDataInChunks(
    imageData: ImageData,
    processor: (data: Uint8ClampedArray, startIdx: number, endIdx: number) => void,
    chunkSize: number = this.CHUNK_SIZE
  ): void {
    const { data, width, height } = imageData;
    const totalPixels = width * height;
    const pixelsPerChunk = chunkSize * width; // Process full rows

    for (let i = 0; i < totalPixels; i += pixelsPerChunk) {
      const startIdx = i * 4; // 4 bytes per pixel
      const endIdx = Math.min((i + pixelsPerChunk) * 4, data.length);
      
      processor(data, startIdx, endIdx);
      
      // Allow browser to breathe between chunks
      if (i % (pixelsPerChunk * 4) === 0) {
        // Use setTimeout to yield control back to browser
        setTimeout(() => {}, 0);
      }
    }
  }

  /**
   * Creates a worker-safe image data copy for heavy processing
   */
  static cloneImageData(imageData: ImageData): ImageData {
    return new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
  }

  /**
   * Debounced effect application to prevent excessive processing
   */
  static debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Memory cleanup utility
   */
  static cleanup(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    // Force garbage collection hint
    if (window.gc) {
      window.gc();
    }
  }
}