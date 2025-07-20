/**
 * AIDA Platform - Image Optimization Utilities
 * Utilities for optimizing image loading and rendering
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * Generates a low-quality image placeholder (LQIP) data URL
 * @param width - Width of the placeholder
 * @param height - Height of the placeholder
 * @param color - Base color for the placeholder (hex)
 */
export function generatePlaceholder(
  width: number = 10,
  height: number = 10,
  color: string = '#f0f0f0'
): string {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Get the canvas context
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Fill with base color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  // Add some noise for texture
  for (let i = 0; i < width * height / 3; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    const a = Math.random() * 0.1; // Low opacity for subtle effect
    
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    ctx.fillRect(x, y, 1, 1);
  }
  
  // Convert to data URL
  return canvas.toDataURL('image/jpeg', 0.1);
}

/**
 * Calculates the dominant color of an image
 * @param imageUrl - URL of the image
 */
export function getDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Draw the image on the canvas
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      
      // Calculate average color (simple approach)
      let r = 0, g = 0, b = 0;
      let pixelCount = 0;
      
      // Sample pixels (every 10th pixel for performance)
      for (let i = 0; i < imageData.length; i += 40) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
        pixelCount++;
      }
      
      // Calculate average
      r = Math.floor(r / pixelCount);
      g = Math.floor(g / pixelCount);
      b = Math.floor(b / pixelCount);
      
      // Convert to hex
      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      resolve(hex);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Hook for lazy loading images with IntersectionObserver
 */
export function useLazyImage(src: string, options?: IntersectionObserverInit) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  
  // Set up intersection observer
  useEffect(() => {
    if (!src) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, {
      threshold: 0.1,
      rootMargin: '200px',
      ...options
    });
    
    const element = document.querySelector(`[data-src="${src}"]`);
    if (element) {
      observer.observe(element);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [src, options]);
  
  // Load image when in view
  useEffect(() => {
    if (!isInView || !src) return;
    
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`);
    };
  }, [isInView, src]);
  
  return { imageSrc, isLoaded, isInView };
}

/**
 * Calculates the optimal image size based on the container
 * @param containerWidth - Width of the container
 * @param containerHeight - Height of the container
 * @param imageAspectRatio - Aspect ratio of the image (width / height)
 */
export function calculateOptimalImageSize(
  containerWidth: number,
  containerHeight: number,
  imageAspectRatio: number
): { width: number; height: number } {
  const containerAspectRatio = containerWidth / containerHeight;
  
  if (imageAspectRatio > containerAspectRatio) {
    // Image is wider than container
    return {
      width: containerWidth,
      height: containerWidth / imageAspectRatio
    };
  } else {
    // Image is taller than container
    return {
      width: containerHeight * imageAspectRatio,
      height: containerHeight
    };
  }
}

/**
 * Generates srcset for responsive images
 * @param baseUrl - Base URL of the image
 * @param widths - Array of widths to generate
 * @param extension - File extension
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [320, 640, 960, 1280, 1920],
  extension: string = 'jpg'
): string {
  // Remove extension from base URL if present
  const baseWithoutExtension = baseUrl.replace(/\.\w+$/, '');
  
  return widths
    .map(width => `${baseWithoutExtension}-${width}.${extension} ${width}w`)
    .join(', ');
}

/**
 * Calculates image sizes attribute for responsive images
 * @param breakpoints - Object with breakpoints and corresponding sizes
 */
export function generateSizes(
  breakpoints: Record<string, string> = {
    '(max-width: 640px)': '100vw',
    '(max-width: 1024px)': '50vw',
    'default': '33vw'
  }
): string {
  return Object.entries(breakpoints)
    .map(([breakpoint, size]) => {
      if (breakpoint === 'default') {
        return size;
      }
      return `${breakpoint} ${size}`;
    })
    .join(', ');
}