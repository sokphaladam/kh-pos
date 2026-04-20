/**
 * Canvas drawing utility for showtime poster generation
 * Draws a 1:1 ratio poster with cinema branding, date, and movie showtimes
 */

import { Showtime } from "@/classes/cinema/showtime";
import {
  detectDominantGenre,
  getThemeByGenre,
  applyGenreBackground,
  applyTexture,
  GenreTheme,
} from "./genre-backgrounds";

interface MovieGroup {
  movieId: string;
  movieName: string;
  posterUrl?: string;
  genres: string[];
  showtimes: {
    startTime: string;
    endTime: string;
    status: string;
  }[];
}

interface PosterData {
  showtimes: Showtime[];
  selectedDate: Date;
  warehouseName: string;
  logoUrl?: string;
  selectedTheme?: string; // Manual theme selection (overrides auto-detection)
  selectedTexture?: string; // Texture overlay option
  backgroundImageUrl?: string; // Custom background image
  phone?: string;
}

function toCambodiaIntlFormat(localNumber: string) {
  let num = localNumber.toString().replace(/[\s-]/g, "");
  if (num.startsWith("0")) num = num.substring(1);

  // Split into groups: 3-3-2
  const formatted = `${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
  return `+855 ${formatted}`;
}

/**
 * Calculate optimal canvas size based on number of movies
 * Maintains 1:1 aspect ratio with scaling: 1080, 1440, or 1920
 */
export function calculatePosterSize(movieCount: number): number {
  if (movieCount <= 4) return 1080;
  if (movieCount <= 8) return 1440;
  return 1920;
}

/**
 * Calculate grid layout (columns) based on number of movies
 */
export function calculateGridColumns(movieCount: number): number {
  if (movieCount <= 4) return 2;
  if (movieCount <= 9) return 3;
  return 4;
}

/**
 * Group showtimes by movie
 */
function groupShowtimesByMovie(showtimes: Showtime[]): MovieGroup[] {
  const movieMap = new Map<string, MovieGroup>();

  showtimes.forEach((showtime) => {
    const movieId = showtime.movieId;
    if (!movieId) return;

    if (!movieMap.has(movieId)) {
      const variant = showtime.variant?.[0];
      movieMap.set(movieId, {
        movieId,
        movieName: variant?.name || "Unknown Movie",
        posterUrl: variant?.movie?.posterUrl || undefined,
        genres: variant?.movie?.genre || [],
        showtimes: [],
      });
    }

    const movie = movieMap.get(movieId)!;
    movie.showtimes.push({
      startTime: showtime.startTime,
      endTime: showtime.endTime,
      status: showtime.status,
    });
  });

  // Sort showtimes within each movie by start time
  movieMap.forEach((movie) => {
    movie.showtimes.sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  return Array.from(movieMap.values());
}

/**
 * Convert Arabic numerals to Khmer numerals
 */
function convertToKhmerNumerals(num: number): string {
  const khmerDigits = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
  return num
    .toString()
    .split("")
    .map((digit) => khmerDigits[parseInt(digit)])
    .join("");
}

/**
 * Get Khmer month name
 */
function getKhmerMonthName(monthIndex: number): string {
  const khmerMonths = [
    "មករា",
    "កុម្ភៈ",
    "មីនា",
    "មេសា",
    "ឧសភា",
    "មិថុនា",
    "កក្កដា",
    "សីហា",
    "កញ្ញា",
    "តុលា",
    "វិច្ឆិកា",
    "ធ្នូ",
  ];
  return khmerMonths[monthIndex];
}

/**
 * Format date in Khmer (សម្រាប់ថ្ធៃទី day ខែ month ឆ្នាំ year)
 */
function formatKhmerDate(date: Date): string {
  const day = convertToKhmerNumerals(date.getDate());
  const month = getKhmerMonthName(date.getMonth());
  const year = convertToKhmerNumerals(date.getFullYear());
  return `សម្រាប់ថ្ងៃទី ${day} ខែ ${month} ឆ្នាំ ${year}`;
}

/**
 * Format time to 12-hour format with AM/PM
 */
function formatTime(timeStr: string): string {
  // Handle datetime format (YYYY-MM-DD HH:mm) - extract time portion
  let timePart = timeStr;
  if (timeStr.includes(" ")) {
    timePart = timeStr.split(" ")[1]; // Get "HH:mm" from "YYYY-MM-DD HH:mm"
  }

  const [hours, minutes] = timePart.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Load image from URL and return as Image element
 */
async function loadImage(
  url: string,
  isLocal: boolean = false,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    // If it's a data URL, load directly
    if (url.startsWith("data:")) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
      return;
    }

    // Determine fetch URL based on whether it's local or external
    const fetchUrl = isLocal
      ? url
      : "/api/image-proxy?url=" + encodeURIComponent(url);

    fetch(fetchUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = reader.result?.toString() || "";
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });
}

/**
 * Draw header section with logo, date, and warehouse name
 */
async function drawHeader(
  ctx: CanvasRenderingContext2D,
  posterData: PosterData,
  theme: GenreTheme,
  width: number,
  headerHeight: number,
): Promise<void> {
  ctx.save();

  const { selectedDate, warehouseName, logoUrl } = posterData;

  // Draw logo at top-left if available
  if (logoUrl && logoUrl.trim().length > 0) {
    try {
      // Determine if URL is local or external
      const isLocal = logoUrl.startsWith("/") || logoUrl.startsWith("data:");
      const logo = await loadImage(logoUrl, isLocal);
      const logoSize = Math.min(480, headerHeight * 0.8);
      const logoX = 20;
      const logoY = 20;

      // Draw with object-fit: contain behavior
      const aspectRatio = logo.width / logo.height;
      let drawWidth = logoSize;
      let drawHeight = logoSize;

      if (aspectRatio > 1) {
        drawHeight = logoSize / aspectRatio;
      } else {
        drawWidth = logoSize * aspectRatio;
      }

      const drawX = logoX + (logoSize - drawWidth) / 2;
      const drawY = logoY + (logoSize - drawHeight) / 2;

      ctx.drawImage(logo, drawX, drawY, drawWidth, drawHeight);
    } catch (error) {
      console.error("Failed to load logo:", error, "URL:", logoUrl);
    }
  }

  // Draw Khmer date (centered)
  const dateText = formatKhmerDate(selectedDate);
  ctx.fillStyle = theme.textColor;
  ctx.font = `${width > 1200 ? 57 : 44}px "Hanuman", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Add glow effect if specified
  if (theme.headerGlow) {
    ctx.shadowColor = theme.headerGlow.color;
    ctx.shadowBlur = theme.headerGlow.blur;
  }

  ctx.fillText(dateText, width / 2, 40);

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  // Draw warehouse name below date
  ctx.fillStyle = theme.accentColor;
  ctx.font = `bold ${width > 1200 ? 34 : 24}px "Kantumruy Pro", sans-serif`;
  ctx.fillText(
    warehouseName.toUpperCase(),
    width / 2,
    40 + (width > 1200 ? 65 : 50),
  );

  // Draw separator line
  ctx.strokeStyle = theme.accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const lineY = headerHeight - 20;
  ctx.moveTo(width * 0.1, lineY);
  ctx.lineTo(width * 0.9, lineY);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a single movie card with poster and showtimes
 * Poster on left, showtime card on right with rounded corners
 */
async function drawMovieCard(
  ctx: CanvasRenderingContext2D,
  movie: MovieGroup,
  x: number,
  y: number,
  cardWidth: number,
  cardHeight: number,
  theme: GenreTheme,
  movieCount: number,
  isLargeCard: boolean = false,
  itemsInRow: number = 3,
): Promise<void> {
  ctx.save();

  const borderRadius = 15;
  const gap = 15; // Gap between poster and card

  // Calculate poster size with 1024x1280 ratio (W:H = 1:1.25)
  // Maximize poster based on row density: 2 items=70%, 3 items=65%, 4+ items=60%
  let posterWidthRatio = 0.6; // Default for 4+ items
  if (movieCount === 2 || isLargeCard || itemsInRow === 2) {
    posterWidthRatio = 0.7; // 2-item rows get maximum poster space
  } else if (itemsInRow === 3) {
    posterWidthRatio = 0.65; // 3-item rows get more poster space
  }
  const maxPosterWidth = cardWidth * posterWidthRatio;
  let posterHeight = cardHeight;
  let posterWidth = posterHeight / 1.25; // Maintain 1024x1280 ratio

  // If calculated poster width exceeds max, scale down
  if (posterWidth > maxPosterWidth) {
    posterWidth = maxPosterWidth;
    posterHeight = posterWidth * 1.25;
  }

  // Draw movie poster on the LEFT
  const posterX = x;
  const posterY = y;

  if (movie.posterUrl && movie.posterUrl.trim().length > 0) {
    try {
      const poster = await loadImage(movie.posterUrl, false);
      ctx.drawImage(poster, posterX, posterY, posterWidth, posterHeight);

      // Draw poster border
      ctx.strokeStyle = theme.accentColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(posterX, posterY, posterWidth, posterHeight);
    } catch {
      // Draw placeholder if poster fails to load
      drawPosterPlaceholder(
        ctx,
        posterX,
        posterY,
        posterWidth,
        posterHeight,
        theme,
      );
    }
  } else {
    // Draw placeholder if no poster URL
    drawPosterPlaceholder(
      ctx,
      posterX,
      posterY,
      posterWidth,
      posterHeight,
      theme,
    );
  }

  // Draw rounded card on the RIGHT of the poster
  // Use same height as poster to keep them aligned
  const cardX = posterX + posterWidth + gap;
  const cardActualWidth = cardWidth - posterWidth - gap;
  const cardActualHeight = posterHeight; // Same height as poster

  // Draw rounded rectangle for card background
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  ctx.beginPath();
  ctx.roundRect(
    cardX,
    posterY,
    cardActualWidth,
    cardActualHeight,
    borderRadius,
  );
  ctx.fill();

  // Draw card border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw showtimes in a single column - centered horizontally and vertically in the card
  ctx.font = `bold ${cardWidth > 300 ? 26 : 22}px "Kantumruy Pro", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const showtimesToShow = movie.showtimes.slice(0, 10); // Show max 10 times
  const lineHeight = 32;
  const totalShowtimesHeight = showtimesToShow.length * lineHeight;
  const currentY = posterY + (cardActualHeight - totalShowtimesHeight) / 2; // Center vertically in card
  const centerX = cardX + cardActualWidth / 2; // Center horizontally in card

  showtimesToShow.forEach((showtime, index) => {
    const timeText = formatTime(showtime.startTime);
    const timeY = currentY + index * lineHeight;

    // Add text shadow for better readability across all themes
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Use consistent white color for all showtimes
    ctx.fillStyle = "#ffffff";

    ctx.fillText(timeText, centerX, timeY);
  });

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Show "+X more" if there are more showtimes
  if (movie.showtimes.length > 10) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = theme.textColor;
    ctx.font = `italic ${cardWidth > 300 ? 20 : 18}px "Kantumruy Pro", sans-serif`;
    ctx.fillText(
      `+${movie.showtimes.length - 10} more`,
      centerX,
      currentY + showtimesToShow.length * lineHeight,
    );

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  ctx.restore();
}

/**
 * Draw placeholder for missing/failed poster images
 */
function drawPosterPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  theme: GenreTheme,
): void {
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fillRect(x, y, width, height);

  ctx.strokeStyle = theme.accentColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  // Add text shadow for better readability
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = theme.textColor;
  ctx.font = "17px Arial";
  ctx.textAlign = "center";
  ctx.fillText("No Poster", x + width / 2, y + height / 2);

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Draw footer with contact information
 */
function drawFooter(
  ctx: CanvasRenderingContext2D,
  theme: GenreTheme,
  width: number,
  footerY: number,
  footerHeight: number,
  phone: string,
): void {
  ctx.save();

  // Footer text with Telegram contact
  const footerText = `ទំនាក់ទំនងកក់សំបុត្រ 🎫 តាមរយះតេលេក្រាម(Telegram) ${toCambodiaIntlFormat(phone)}`;

  // Add text shadow for better readability
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = theme.accentColor;
  ctx.font = `bold ${width > 1200 ? 29 : 24}px "Hanuman", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Center text vertically in footer area
  ctx.fillText(footerText, width / 2, footerY + footerHeight / 2);

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.restore();
}

/**
 * Main drawing function for the poster
 * This is called by the CanvasDraw component
 */
export async function drawPoster(
  ctx: CanvasRenderingContext2D,
  posterData: PosterData,
): Promise<void> {
  const movies = groupShowtimesByMovie(posterData.showtimes);

  if (movies.length === 0) {
    // Draw "No Showtimes" message
    // Add text shadow for better readability
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = "#fff";
    ctx.font = "29px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "No showtimes available",
      ctx.canvas.width / 2,
      ctx.canvas.height / 2,
    );

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    return;
  }

  const canvasSize = calculatePosterSize(movies.length);
  const columns = calculateGridColumns(movies.length);

  // Use manual theme selection if provided, otherwise auto-detect from genres
  let theme: GenreTheme;
  if (posterData.selectedTheme) {
    theme = getThemeByGenre(posterData.selectedTheme);
  } else {
    const allGenres = movies.map((m) => m.genres);
    const dominantGenre = detectDominantGenre(allGenres);
    theme = getThemeByGenre(dominantGenre);
  }

  // Apply background - custom image or gradient
  if (posterData.backgroundImageUrl) {
    // Use custom background image
    try {
      const bgImage = await loadImage(posterData.backgroundImageUrl, true);

      // Draw image to fill canvas (cover fit)
      const imgRatio = bgImage.width / bgImage.height;
      const canvasRatio = canvasSize / canvasSize;

      let drawWidth = canvasSize;
      let drawHeight = canvasSize;
      let drawX = 0;
      let drawY = 0;

      if (imgRatio > canvasRatio) {
        // Image is wider than canvas
        drawWidth = canvasSize * imgRatio;
        drawX = -(drawWidth - canvasSize) / 2;
      } else {
        // Image is taller than canvas
        drawHeight = canvasSize / imgRatio;
        drawY = -(drawHeight - canvasSize) / 2;
      }

      ctx.drawImage(bgImage, drawX, drawY, drawWidth, drawHeight);

      // Add semi-transparent overlay for better text readability
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, 0, canvasSize, canvasSize);
    } catch (error) {
      console.error("Failed to load custom background image:", error);
      // Fallback to gradient if image fails
      applyGenreBackground(ctx, theme, canvasSize, canvasSize);
    }
  } else {
    // Apply background gradient
    applyGenreBackground(ctx, theme, canvasSize, canvasSize);
  }

  // Apply texture overlay if selected
  if (posterData.selectedTexture && posterData.selectedTexture !== "none") {
    applyTexture(ctx, posterData.selectedTexture, canvasSize, canvasSize);
  }

  // Draw header (logo, date, warehouse name)
  const headerHeight = canvasSize > 1200 ? 200 : 160;
  await drawHeader(ctx, posterData, theme, canvasSize, headerHeight);

  // Calculate footer dimensions
  const footerHeight = canvasSize > 1200 ? 80 : 60;
  const footerY = canvasSize - footerHeight - 10;

  // Calculate grid layout (reserve space for header and footer)
  const contentTop = headerHeight + 20;
  const contentHeight = canvasSize - contentTop - footerHeight - 30;
  const rows = Math.ceil(movies.length / columns);

  let cardWidth: number;
  let cardHeight: number;

  // Special sizing for 1 or 2 movies - make them bigger
  if (movies.length === 1) {
    // Center single movie with larger size (80% of canvas width, max 900px)
    cardWidth = Math.min(canvasSize * 0.8, 900);
    // Make height proportional but ensure it fits in content area
    cardHeight = Math.min(contentHeight * 0.8, 600);
  } else if (movies.length === 2) {
    // Center two movies side by side with larger size to maximize poster visibility
    cardWidth = (canvasSize - 50) / 2; // Fit 2 with spacing (no max limit)
    cardHeight = Math.min(contentHeight * 0.85, 650); // Proportional height for better centering
  } else {
    // Normal grid layout for 3+ movies
    cardWidth = (canvasSize - 40 - (columns - 1) * 20) / columns;
    cardHeight = (contentHeight - (rows - 1) * 20) / rows;
  }

  // Check if we need to center the last movie (when count is odd and doesn't fill the last row)
  const isOddCount = movies.length % columns !== 0;
  const lastRowItemCount = isOddCount ? movies.length % columns : columns;

  // Draw movie cards in grid
  for (let i = 0; i < movies.length; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const isLastRow = row === rows - 1;

    let cardX: number;
    let cardY: number;
    let currentCardWidth = cardWidth;
    let currentCardHeight = cardHeight;

    // Calculate items in current row
    const itemsInThisRow = isLastRow && isOddCount ? lastRowItemCount : columns;

    // Special sizing for rows with fewer items (e.g., 2 items in last row of 5 or 8 movie layouts)
    let isLargeCard = false;
    if (isLastRow && itemsInThisRow < columns) {
      // Last row has fewer items - make them bigger
      if (itemsInThisRow === 2) {
        // 2 items in last row (5 or 8 movies)
        currentCardWidth = Math.min((canvasSize - 50) / 2, 520);
        currentCardHeight = cardHeight;
        isLargeCard = true;
      } else if (itemsInThisRow === 1) {
        // 1 item in last row (4 or 7 movies)
        currentCardWidth = Math.min(canvasSize * 0.6, 650);
        currentCardHeight = cardHeight;
        isLargeCard = true;
      }
    }

    // Special centering for 1 or 2 movies
    if (movies.length === 1) {
      // Center single movie horizontally and vertically
      cardX = (canvasSize - currentCardWidth) / 2;
      cardY = contentTop + (contentHeight - currentCardHeight) / 2;
    } else if (movies.length === 2) {
      // Center two movies horizontally and vertically
      const gap = 20;
      const totalWidth = currentCardWidth * 2 + gap; // 2 cards + gap
      const startX = (canvasSize - totalWidth) / 2;
      cardX = startX + i * (currentCardWidth + gap);
      cardY = contentTop + (contentHeight - currentCardHeight) / 2;
    } else if (isLastRow && isOddCount) {
      // Center the last row if it has fewer items than columns
      const lastRowStartX =
        (canvasSize -
          (lastRowItemCount * currentCardWidth + (lastRowItemCount - 1) * 20)) /
        2;
      const colInLastRow = i - row * columns;
      cardX = lastRowStartX + colInLastRow * (currentCardWidth + 20);
      cardY = contentTop + row * (cardHeight + 20);
    } else {
      cardX = 20 + col * (currentCardWidth + 20);
      cardY = contentTop + row * (cardHeight + 20);
    }

    await drawMovieCard(
      ctx,
      movies[i],
      cardX,
      cardY,
      currentCardWidth,
      currentCardHeight,
      theme,
      movies.length,
      isLargeCard,
      itemsInThisRow,
    );
  }

  // Draw footer with contact information
  drawFooter(
    ctx,
    theme,
    canvasSize,
    footerY,
    footerHeight,
    posterData.phone || "",
  );
}

/**
 * Create a draw function for CanvasDraw component
 * Returns a synchronous function that handles async drawing internally
 */
export function createPosterDrawFunction(posterData: PosterData) {
  return (ctx: CanvasRenderingContext2D) => {
    // Start async drawing (fire and forget - canvas will update when complete)
    drawPoster(ctx, posterData).catch((err) => {
      console.error("Error drawing poster:", err);
    });
  };
}
