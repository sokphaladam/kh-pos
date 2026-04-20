"use client";

import { Showtime } from "@/classes/cinema/showtime";
import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, X, ImageUp, TestTube } from "lucide-react";
import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import { PosterCanvas } from "./poster-canvas";
import { format } from "date-fns";
import { GENRE_THEMES } from "./genre-backgrounds";
import { Input } from "@/components/ui/input";

interface PosterPreviewProps {
  showtimes: Showtime[];
  selectedDate: Date;
  warehouseName: string;
  logoUrl?: string;
  phone?: string;
}

export const posterPreviewDialog = createDialog<PosterPreviewProps, unknown>(
  ({ close, showtimes, selectedDate, warehouseName, logoUrl, phone }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState<string>("auto");
    const [selectedTexture, setSelectedTexture] = useState<string>("none");
    const [backgroundImageUrl, setBackgroundImageUrl] = useState<
      string | undefined
    >();
    const [testMode, setTestMode] = useState(false);
    const [testMovieCount, setTestMovieCount] = useState<string>("");
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Generate test data by replicating existing movies
    const testShowtimes = useMemo(() => {
      if (!testMode || !testMovieCount) return showtimes;

      const targetCount = parseInt(testMovieCount);
      if (isNaN(targetCount) || targetCount <= 0) return showtimes;

      // Get unique movies from current showtimes
      const movieMap = new Map<string, Showtime[]>();
      showtimes.forEach((showtime) => {
        if (!showtime.movieId) return;
        if (!movieMap.has(showtime.movieId)) {
          movieMap.set(showtime.movieId, []);
        }
        movieMap.get(showtime.movieId)!.push(showtime);
      });

      const originalMovies = Array.from(movieMap.entries());
      if (originalMovies.length === 0) return showtimes;

      // Replicate movies to reach target count
      const replicatedShowtimes: Showtime[] = [];
      for (let i = 0; i < targetCount; i++) {
        const [movieId, movieShowtimes] =
          originalMovies[i % originalMovies.length];
        // Create copies with unique IDs
        movieShowtimes.forEach((st) => {
          const copy = { ...st };
          // Make each replicated movie have a unique movieId
          if (i >= originalMovies.length) {
            copy.movieId = `${movieId}-replica-${i}`;
          }
          replicatedShowtimes.push(copy);
        });
      }

      return replicatedShowtimes;
    }, [showtimes, testMode, testMovieCount]);

    const activeShowtimes = testMode ? testShowtimes : showtimes;

    const handleDownload = async () => {
      if (isDownloading || !canvasRef.current) return;

      setIsDownloading(true);

      try {
        const blob = await new Promise<Blob | null>((resolve) => {
          canvasRef.current?.toBlob((b) => resolve(b), "image/png");
        });

        if (!blob) {
          toast.error("Failed to generate poster image");
          return;
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Format filename with date
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        link.download = `showtime-poster-${dateStr}-${Date.now()}.png`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Poster downloaded successfully");
      } catch (error) {
        console.error("Error downloading poster:", error);
        toast.error("Failed to download poster");
      } finally {
        setIsDownloading(false);
      }
    };

    const handleCanvasRef = (canvas: HTMLCanvasElement) => {
      canvasRef.current = canvas;
    };

    const handleBackgroundImageUpload = (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image file is too large. Maximum size is 5MB");
        return;
      }

      // Convert to data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImageUrl(reader.result as string);
        toast.success("Background image uploaded");
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
      };
      reader.readAsDataURL(file);
    };

    const handleRemoveBackgroundImage = () => {
      setBackgroundImageUrl(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.info("Background image removed");
    };

    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Showtime Poster Preview
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4 overflow-x-hidden">
          {/* Theme and Texture selectors in one row */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Background Theme:</label>
              <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (from genres)</SelectItem>
                  {Object.keys(GENRE_THEMES).map((themeKey) => (
                    <SelectItem key={themeKey} value={themeKey}>
                      {GENRE_THEMES[themeKey].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Texture:</label>
              <Select
                value={selectedTexture}
                onValueChange={setSelectedTexture}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select texture" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="noise">Noise</SelectItem>
                  <SelectItem value="grain">Film Grain</SelectItem>
                  <SelectItem value="dots">Dots Pattern</SelectItem>
                  <SelectItem value="lines">Lines Pattern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Background Image Upload and Actions */}
          <div className="flex items-center gap-3 flex-wrap justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-sm font-medium">Custom Background:</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBackgroundImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageUp className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
              {backgroundImageUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveBackgroundImage}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => close(undefined)}
                disabled={isDownloading}
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? "Downloading..." : "Download"}
              </Button>
            </div>
          </div>

          {/* Test Mode */}
          <div className="flex items-center gap-3 flex-wrap border-t pt-4">
            <label className="text-sm font-medium">Test Layout:</label>
            <Input
              type="number"
              min="1"
              max="20"
              placeholder="# of movies"
              value={testMovieCount}
              onChange={(e) => setTestMovieCount(e.target.value)}
              className="w-[120px]"
            />
            <Button
              variant={testMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (!testMovieCount || parseInt(testMovieCount) <= 0) {
                  toast.error("Please enter a valid number of movies");
                  return;
                }
                setTestMode(!testMode);
                toast.success(
                  testMode
                    ? "Test mode disabled"
                    : `Testing with ${testMovieCount} movies`,
                );
              }}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {testMode ? "Disable Test" : "Test Layout"}
            </Button>
            {testMode && (
              <span className="text-sm text-muted-foreground">
                (Showing {testMovieCount} replicated movies)
              </span>
            )}
          </div>

          {/* Poster preview */}
          <div
            className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg flex items-center justify-center"
            style={{
              maxWidth: "100%",
              maxHeight: "60vh",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                transform: "scale(0.42)",
                transformOrigin: "center center",
                width: "fit-content",
                height: "fit-content",
                maxWidth: "100%",
              }}
            >
              <PosterCanvas
                showtimes={activeShowtimes}
                selectedDate={selectedDate}
                warehouseName={warehouseName}
                phone={phone}
                logoUrl={logoUrl}
                selectedTheme={
                  selectedTheme === "auto" ? undefined : selectedTheme
                }
                selectedTexture={selectedTexture}
                backgroundImageUrl={backgroundImageUrl}
                onCanvasRef={handleCanvasRef}
              />
            </div>
          </div>

          {/* Info text */}
          <p className="text-sm text-muted-foreground mt-4 text-center">
            {testMode
              ? `Testing layout with ${testMovieCount} movies (replicated from current data). Disable test mode to see actual poster.`
              : "Preview your showtime poster. Click download to save as PNG."}
          </p>
        </div>
      </>
    );
  },
  {
    defaultValue: undefined,
    className: "max-w-5xl max-h-[95vh] overflow-x-hidden",
  },
);
