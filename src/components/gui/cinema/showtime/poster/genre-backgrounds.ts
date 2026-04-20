/**
 * Genre-based background templates for cinema showtime posters
 * Auto-selects visual theme based on the dominant genre of movies showing
 */

export interface GenreTheme {
  name: string;
  gradient: {
    type: "linear" | "radial";
    colors: string[];
    stops?: number[];
    angle?: number; // for linear gradients (in degrees)
  };
  accentColor: string;
  textColor: string;
  headerGlow?: {
    color: string;
    blur: number;
  };
}

export const GENRE_THEMES: Record<string, GenreTheme> = {
  horror: {
    name: "Horror",
    gradient: {
      type: "linear",
      colors: ["#2d0a1a", "#5d0a2f", "#2d0a1a"],
      stops: [0, 0.5, 1],
      angle: 135,
    },
    accentColor: "#ef4444", // Red
    textColor: "#fecaca",
    headerGlow: {
      color: "#dc2626",
      blur: 30,
    },
  },
  action: {
    name: "Action",
    gradient: {
      type: "linear",
      colors: ["#2d1a0a", "#5d2f0a", "#2d1a0a"],
      stops: [0, 0.5, 1],
      angle: 45,
    },
    accentColor: "#fb923c", // Orange
    textColor: "#fed7aa",
    headerGlow: {
      color: "#f97316",
      blur: 25,
    },
  },
  romance: {
    name: "Romance",
    gradient: {
      type: "linear",
      colors: ["#2d0a1a", "#4d1a3a", "#2d0a1a"],
      stops: [0, 0.5, 1],
      angle: 180,
    },
    accentColor: "#f472b6", // Pink
    textColor: "#fbcfe8",
    headerGlow: {
      color: "#ec4899",
      blur: 20,
    },
  },
  comedy: {
    name: "Comedy",
    gradient: {
      type: "linear",
      colors: ["#2d2208", "#4d3915", "#2d2208"],
      stops: [0, 0.5, 1],
      angle: 90,
    },
    accentColor: "#fbbf24", // Yellow
    textColor: "#fef3c7",
    headerGlow: {
      color: "#facc15",
      blur: 25,
    },
  },
  "sci-fi": {
    name: "Sci-Fi",
    gradient: {
      type: "linear",
      colors: ["#0a1a2d", "#0a2f5d", "#0a1a2d"],
      stops: [0, 0.5, 1],
      angle: 225,
    },
    accentColor: "#22d3ee", // Cyan
    textColor: "#cffafe",
    headerGlow: {
      color: "#06b6d4",
      blur: 30,
    },
  },
  drama: {
    name: "Drama",
    gradient: {
      type: "linear",
      colors: ["#0a1525", "#15304a", "#0a1525"],
      stops: [0, 0.5, 1],
      angle: 180,
    },
    accentColor: "#60a5fa", // Blue
    textColor: "#dbeafe",
    headerGlow: {
      color: "#3b82f6",
      blur: 20,
    },
  },
  animation: {
    name: "Animation",
    gradient: {
      type: "linear",
      colors: ["#1a0f25", "#2a1a40", "#1a0f25"],
      stops: [0, 0.5, 1],
      angle: 270,
    },
    accentColor: "#c084fc", // Purple
    textColor: "#e9d5ff",
    headerGlow: {
      color: "#a855f7",
      blur: 25,
    },
  },
  family: {
    name: "Family",
    gradient: {
      type: "linear",
      colors: ["#0f251a", "#1a402a", "#0f251a"],
      stops: [0, 0.5, 1],
      angle: 270,
    },
    accentColor: "#34d399", // Green
    textColor: "#d1fae5",
    headerGlow: {
      color: "#10b981",
      blur: 25,
    },
  },
  thriller: {
    name: "Thriller",
    gradient: {
      type: "linear",
      colors: ["#0a2525", "#0f3838", "#0a2525"],
      stops: [0, 0.5, 1],
      angle: 315,
    },
    accentColor: "#2dd4bf", // Teal
    textColor: "#ccfbf1",
    headerGlow: {
      color: "#14b8a6",
      blur: 25,
    },
  },
  default: {
    name: "Default",
    gradient: {
      type: "linear",
      colors: ["#2d2510", "#1a1a0a"],
      stops: [0, 1],
      angle: 180,
    },
    accentColor: "#fbbf24", // Amber/Gold
    textColor: "#fef3c7",
    headerGlow: {
      color: "#f59e0b",
      blur: 20,
    },
  },
};

/**
 * Detect dominant genre from an array of movie genres
 * @param movieGenres Array of genre arrays from all movies
 * @returns The most common genre key (normalized to lowercase)
 */
export function detectDominantGenre(movieGenres: string[][]): string {
  console.log("detectDominantGenre input:", movieGenres);

  if (!movieGenres || movieGenres.length === 0) {
    console.log("No genres provided, using default");
    return "default";
  }

  // Flatten all genres and count occurrences
  const genreCount: Record<string, number> = {};

  movieGenres.forEach((genres) => {
    if (Array.isArray(genres)) {
      genres.forEach((genre) => {
        const normalized = normalizeGenre(genre);
        genreCount[normalized] = (genreCount[normalized] || 0) + 1;
      });
    }
  });

  console.log("Genre counts:", genreCount);

  // Find the most common genre
  let maxCount = 0;
  let dominantGenre = "default";

  Object.entries(genreCount).forEach(([genre, count]) => {
    if (count > maxCount && GENRE_THEMES[genre]) {
      maxCount = count;
      dominantGenre = genre;
    }
  });

  console.log("Dominant genre:", dominantGenre, "with count:", maxCount);
  return dominantGenre;
}

/**
 * Normalize genre strings to match theme keys
 * Handles variations in naming (e.g., "Science Fiction" -> "sci-fi")
 */
function normalizeGenre(genre: string): string {
  const normalized = genre.toLowerCase().trim();

  // Map common variations to our theme keys
  const genreMap: Record<string, string> = {
    "science fiction": "sci-fi",
    "sci fi": "sci-fi",
    scifi: "sci-fi",
    sf: "sci-fi",
    romantic: "romance",
    "rom-com": "comedy",
    humor: "comedy",
    funny: "comedy",
    cartoon: "animation",
    animated: "animation",
    kids: "family",
    children: "family",
    suspense: "thriller",
    mystery: "thriller",
  };

  return genreMap[normalized] || normalized;
}

/**
 * Apply gradient background to canvas context
 */
export function applyGenreBackground(
  ctx: CanvasRenderingContext2D,
  theme: GenreTheme,
  width: number,
  height: number,
): void {
  console.log(
    "Applying genre background:",
    theme.name,
    "to canvas",
    width,
    "x",
    height,
  );
  ctx.save();

  let gradient: CanvasGradient;

  if (theme.gradient.type === "linear") {
    const angle = (theme.gradient.angle || 180) * (Math.PI / 180);
    const x1 = width / 2 - (Math.cos(angle) * width) / 2;
    const y1 = height / 2 - (Math.sin(angle) * height) / 2;
    const x2 = width / 2 + (Math.cos(angle) * width) / 2;
    const y2 = height / 2 + (Math.sin(angle) * height) / 2;

    gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    console.log("Linear gradient:", {
      x1,
      y1,
      x2,
      y2,
      colors: theme.gradient.colors,
    });
  } else {
    // Radial gradient
    gradient = ctx.createRadialGradient(
      width / 2,
      height / 4,
      0,
      width / 2,
      height / 4,
      width / 2,
    );
  }

  // Add color stops
  const stops = theme.gradient.stops || [0, 1];
  theme.gradient.colors.forEach((color, index) => {
    gradient.addColorStop(
      stops[index] || index / (theme.gradient.colors.length - 1),
      color,
    );
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

/**
 * Apply texture overlay to background
 */
export function applyTexture(
  ctx: CanvasRenderingContext2D,
  textureType: string,
  width: number,
  height: number,
): void {
  ctx.save();

  switch (textureType) {
    case "noise":
      applyNoiseTexture(ctx, width, height);
      break;
    case "dots":
      applyDotsTexture(ctx, width, height);
      break;
    case "lines":
      applyLinesTexture(ctx, width, height);
      break;
    case "grain":
      applyGrainTexture(ctx, width, height);
      break;
    default:
      break;
  }

  ctx.restore();
}

/**
 * Apply noise texture overlay
 */
function applyNoiseTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Add random noise with higher intensity
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 25;
    data[i] += noise; // R
    data[i + 1] += noise; // G
    data[i + 2] += noise; // B
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply dots/halftone texture
 */
function applyDotsTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const dotSpacing = 15;
  const dotRadius = 3;

  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";

  for (let x = 0; x < width; x += dotSpacing) {
    for (let y = 0; y < height; y += dotSpacing) {
      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Apply diagonal lines texture
 */
function applyLinesTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const lineSpacing = 10;

  ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
  ctx.lineWidth = 2;

  // Diagonal lines
  for (let i = -height; i < width + height; i += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + height, height);
    ctx.stroke();
  }
}

/**
 * Apply film grain texture
 */
function applyGrainTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  // Create grain effect with random rectangles
  for (let i = 0; i < (width * height) / 50; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 3;
    const opacity = Math.random() * 0.06;

    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fillRect(x, y, size, size);
  }
}

/**
 * Get theme by genre key, with fallback to default
 */
export function getThemeByGenre(genre: string): GenreTheme {
  return GENRE_THEMES[genre] || GENRE_THEMES.default;
}
