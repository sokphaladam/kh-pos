"use client";

import { Showtime } from "@/classes/cinema/showtime";
import { CanvasDraw } from "../../ticket-reservation/canvas/canvas-draw";
import {
  calculatePosterSize,
  createPosterDrawFunction,
} from "./canvas-drawer-poster";

interface PosterCanvasProps {
  showtimes: Showtime[];
  selectedDate: Date;
  warehouseName: string;
  logoUrl?: string;
  selectedTheme?: string;
  selectedTexture?: string;
  backgroundImageUrl?: string;
  onCanvasRef?: (canvas: HTMLCanvasElement) => void;
  phone?: string;
}

/**
 * Poster Canvas Component
 * Wraps CanvasDraw to render showtime poster with dynamic sizing
 */
export function PosterCanvas({
  showtimes,
  selectedDate,
  warehouseName,
  logoUrl,
  selectedTheme,
  selectedTexture,
  backgroundImageUrl,
  onCanvasRef,
  phone,
}: PosterCanvasProps) {
  // Group showtimes by movie to calculate size
  const movieIds = new Set(
    showtimes.map((st) => st.movieId).filter((id) => id),
  );
  const movieCount = movieIds.size;

  // Calculate canvas size based on number of movies
  const canvasSize = calculatePosterSize(movieCount);

  // Create draw function
  const drawFunction = createPosterDrawFunction({
    showtimes,
    selectedDate,
    warehouseName,
    logoUrl,
    selectedTheme,
    selectedTexture,
    backgroundImageUrl,
    phone,
  });

  return (
    <CanvasDraw
      draw={drawFunction}
      width={`${canvasSize}px`}
      height={`${canvasSize}px`}
      onRef={onCanvasRef}
      id="showtime-poster-canvas"
    />
  );
}
