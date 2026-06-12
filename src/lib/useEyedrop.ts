"use client";

import { useState, useCallback } from 'react';

interface EyeDropperResult {
  sRGBHex: string;
}

type EyeDropperInterface = {
  new (): EyeDropperInterface;
  open: () => Promise<EyeDropperResult>;
}

declare global {
  interface Window {
    EyeDropper?: EyeDropperInterface;
  }
}

export function useEyeDropper() {
  const [color, setColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState<boolean>(() => typeof window !== 'undefined' && 'EyeDropper' in window);

  const openPicker = useCallback(async () => {
    if (!isSupported || !window.EyeDropper) {
      setError('EyeDropper API is not supported in this browser.');
      return null;
    }

    try {
      setError(null);
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      setColor(result.sRGBHex);
      return result.sRGBHex;
    } catch (err) {
      // Handle user cancellation or other errors
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
      return null;
    }
  }, [isSupported]);

  return { color, error, isSupported, openPicker };
}
