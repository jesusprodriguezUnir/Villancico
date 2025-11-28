import { useState, useEffect, useRef, useCallback } from 'react';
import { LyricLine } from '../types';
import { LYRICS } from '../constants';

interface PreloadedImage {
  url: string;
  loaded: boolean;
  element: HTMLImageElement | null;
}

export function useImagePreloader() {
  const [preloadedImages, setPreloadedImages] = useState<Map<number, PreloadedImage>>(new Map());
  const [isPreloading, setIsPreloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateImageUrl = (lyric: LyricLine): string => {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(lyric.visualDescription)}?width=1920&height=1080&nologo=true&seed=${lyric.time}`;
  };

  const preloadAllImages = useCallback(async () => {
    setIsPreloading(true);
    setProgress(0);
    
    const imageMap = new Map<number, PreloadedImage>();
    const total = LYRICS.length;
    let loaded = 0;

    const loadPromises = LYRICS.map((lyric, index) => {
      return new Promise<void>((resolve) => {
        const url = generateImageUrl(lyric);
        const img = new Image();
        
        img.onload = () => {
          imageMap.set(index, { url, loaded: true, element: img });
          loaded++;
          setProgress(Math.round((loaded / total) * 100));
          resolve();
        };
        
        img.onerror = () => {
          imageMap.set(index, { url, loaded: false, element: null });
          loaded++;
          setProgress(Math.round((loaded / total) * 100));
          resolve();
        };
        
        img.crossOrigin = 'anonymous';
        img.src = url;
      });
    });

    await Promise.all(loadPromises);
    setPreloadedImages(imageMap);
    setIsPreloading(false);
  }, []);

  const getImageUrl = useCallback((lyricIndex: number): string | null => {
    const preloaded = preloadedImages.get(lyricIndex);
    if (preloaded?.loaded) {
      return preloaded.url;
    }
    // Fallback: generar URL dinámicamente si no está pre-cargada
    const lyric = LYRICS[lyricIndex];
    return lyric ? generateImageUrl(lyric) : null;
  }, [preloadedImages]);

  const getImageElement = useCallback((lyricIndex: number): HTMLImageElement | null => {
    return preloadedImages.get(lyricIndex)?.element || null;
  }, [preloadedImages]);

  return {
    preloadAllImages,
    getImageUrl,
    getImageElement,
    isPreloading,
    progress,
    isReady: !isPreloading && preloadedImages.size > 0,
  };
}
