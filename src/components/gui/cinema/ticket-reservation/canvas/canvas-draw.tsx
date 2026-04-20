"use client";
import { useEffect, useRef } from "react";

interface Props {
  draw: (context: CanvasRenderingContext2D) => void;
  width: string;
  height: string;
  onRef?: (ref: HTMLCanvasElement) => void;
  id?: string;
}

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Hanuman:wght@100;300;400;700;900&family=Kantumruy+Pro:ital,wght@0,100..700;1,100..700&family=Nokora:wght@100;300;400;700;900&display=swap";

// Load Google Fonts
function loadGoogleFonts() {
  // Check if fonts are already loaded
  if (document.querySelector(`link[href="${GOOGLE_FONTS_URL}"]`)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const link = document.createElement("link");
    link.href = GOOGLE_FONTS_URL;
    link.rel = "stylesheet";
    link.onload = () => resolve();
    link.onerror = () => resolve(); // Resolve even on error to prevent hanging
    document.head.appendChild(link);
  });
}

function useCanvas(
  draw: (context: CanvasRenderingContext2D) => void,
  width: string,
  height: string
) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = window.devicePixelRatio || 1;

    const renderer = async () => {
      // Load Google Fonts before drawing
      await loadGoogleFonts();

      // Wait a bit for fonts to be fully loaded
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Parse dimensions - handle both "400px" and "400" formats
      const parseSize = (size: string) => {
        const num = parseFloat(size);
        return isNaN(num) ? 0 : num;
      };

      const canvasWidth = parseSize(width);
      const canvasHeight = parseSize(height);

      // Set canvas bitmap size to match physical pixels
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;

      // Scale context to match device pixel ratio
      context.scale(dpr, dpr);

      // Enable high-quality rendering
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      draw(context);
    };

    renderer();
  }, [draw, width, height]);

  return ref;
}

export function CanvasDraw(props: Props) {
  const { draw, width, height, onRef, ...rest } = props;
  const ref = useCanvas(draw, width, height);

  useEffect(() => {
    if (onRef && ref.current) {
      onRef(ref.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      id={props.id}
      ref={ref}
      {...rest}
      style={{
        width:
          width.includes("px") || width.includes("%") ? width : `${width}px`,
        height:
          height.includes("px") || height.includes("%")
            ? height
            : `${height}px`,
      }}
    ></canvas>
  );
}
