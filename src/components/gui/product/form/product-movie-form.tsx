"use client";

import { useProductForm } from "../context/product-form-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, FileVideo, Image as ImageIcon } from "lucide-react";
import { MaterialInput } from "@/components/ui/material-input";
import TagsInput from "@/components/tag-input";
import { DatePicker } from "@/components/ui/date-picker";
import { produce } from "immer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Formatter } from "@/lib/formatter";
import { useCallback, useMemo } from "react";
import { FileUpload } from "./file-upload";

const MOVIE_RATINGS = [
  { value: "G", label: "G - General Audiences" },
  { value: "PG", label: "PG - Parental Guidance Suggested" },
  { value: "PG-13", label: "PG-13 - Parents Strongly Cautioned" },
  { value: "R", label: "R - Restricted" },
  { value: "NC-17", label: "NC-17 - Adults Only" },
];

const MOVIE_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "Western",
];

// File size limits
const MAX_POSTER_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TRAILER_SIZE = 150 * 1024 * 1024; // 150MB

interface MovieData {
  variantId: string;
  durationMinutes: number;
  rating: string;
  genre: string[];
  releaseDate: string;
  posterUrl?: string | null;
  trailerUrl?: string | null;
  director?: string | null;
  cast?: string[];
  emailProducer?: string[];
  synopsis?: string | null;
  producerShare?: number;
  taxRate?: number;
}

export function ProductMovieForm() {
  const { product, setProduct } = useProductForm();

  // Get the first variant's ID to use as movie_id
  const variantId = product.productVariants[0]?.id || "";

  // Get poster URL from first product image
  const posterUrl = product.productImages[0]?.url || null;

  // Get synopsis from product description
  const synopsis = product.productBasic.description || null;

  // Find or initialize movie data (single object, not array)
  // Use product image and description as default values only when creating new movie
  const movieData: MovieData = useMemo(
    () =>
      product.productMovies
        ? {
            ...product.productMovies,
          }
        : {
            variantId: variantId,
            durationMinutes: 0,
            rating: "G",
            genre: [],
            releaseDate: Formatter.getNowDate(),
            posterUrl: posterUrl,
            trailerUrl: null,
            director: null,
            cast: [],
            emailProducer: [],
            synopsis: synopsis,
            producerShare: 0,
            taxRate: 0,
          },
    [product.productMovies, variantId, posterUrl, synopsis],
  );

  const updateMovieData = useCallback(
    (updates: Partial<MovieData>) => {
      setProduct(
        produce(product, (draft) => {
          draft.productMovies = {
            ...movieData,
            variantId: draft.productVariants[0]?.id || "",
            ...updates,
          };
        }),
      );
    },
    [product, setProduct, movieData],
  );

  const handlePosterChange = useCallback(
    (url: string | null) => {
      updateMovieData({ posterUrl: url });
    },
    [updateMovieData],
  );

  const handleTrailerChange = useCallback(
    (url: string | null) => {
      updateMovieData({ trailerUrl: url });
    },
    [updateMovieData],
  );

  return (
    <Card className="shadow-sm border-border/50 mt-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Film className="h-5 w-5 text-primary" />
          Movie Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Poster Upload Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Movie Poster
            </Label>
            <FileUpload
              type="image"
              value={movieData.posterUrl}
              onChange={handlePosterChange}
              maxSize={MAX_POSTER_SIZE}
              accept="PNG, JPG or WEBP"
              label="Poster"
              className="w-[200px] h-[250px]"
            />
          </div>

          {/* Trailer Upload Section */}
          <div className="space-y-3 flex-1">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileVideo className="h-4 w-4" />
              Movie Trailer
            </Label>
            <FileUpload
              type="video"
              value={movieData.trailerUrl}
              onChange={handleTrailerChange}
              maxSize={MAX_TRAILER_SIZE}
              accept="MP4, MOV or WEBM"
              label="Trailer"
              className="h-[250px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Duration */}
          <div>
            <MaterialInput
              type="number"
              label="Duration (minutes)"
              placeholder="e.g., 120"
              value={movieData.durationMinutes || ""}
              onChange={(e) =>
                updateMovieData({
                  durationMinutes: parseInt(e.target.value) || 0,
                })
              }
              className="h-10 text-sm"
              required
            />
          </div>

          {/* Release Date */}
          <DatePicker
            label="Release Date"
            initialValue={
              movieData.releaseDate
                ? new Date(movieData.releaseDate)
                : new Date()
            }
            onChange={(date) => {
              if (!date) return;
              updateMovieData({
                releaseDate: Formatter.date(date)!,
              });
            }}
            format="dd MMM, yyyy"
          />

          {/* Director */}
          <div>
            <MaterialInput
              label="Director"
              placeholder="e.g., Christopher Nolan"
              value={movieData.director || ""}
              onChange={(e) => updateMovieData({ director: e.target.value })}
              className="h-10 text-sm"
            />
          </div>

          {/* Producer Share */}
          <div>
            <MaterialInput
              type="number"
              label="Producer Share (%)"
              placeholder="e.g., 50"
              value={String(movieData.producerShare ?? "0")}
              onChange={(e) =>
                updateMovieData({
                  producerShare: e.target.value
                    ? parseFloat(e.target.value)
                    : 0,
                })
              }
              className="h-10 text-sm"
              min={0}
              max={100}
              step={1}
            />
          </div>

          {/* Tax Rate */}
          <div className="flex items-center justify-between p-3 border rounded-md">
            <Label className="text-sm font-medium">Tax (10%)</Label>
            <Switch
              checked={movieData.taxRate === 10}
              onCheckedChange={(checked) =>
                updateMovieData({ taxRate: checked ? 10 : 0 })
              }
            />
          </div>

          {/* Rating */}
          <div className="md:col-span-2">
            <Label className="text-sm font-medium">Content Rating</Label>
            <Select
              value={movieData.rating}
              onValueChange={(value) => updateMovieData({ rating: value })}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                {MOVIE_RATINGS.map((rating) => (
                  <SelectItem key={rating.value} value={rating.value}>
                    {rating.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Genre Tags */}
          <div className="md:col-span-2">
            <Label className="text-sm font-medium mb-2 block">
              Genres (Press Enter to add)
            </Label>
            <div className="border rounded-md p-3 bg-background">
              <TagsInput
                tags={movieData.genre || []}
                setTags={(tags) => updateMovieData({ genre: tags })}
                lock={[]}
                availableTags={MOVIE_GENRES}
              />
            </div>
          </div>

          {/* Cast Tags */}
          <div className="md:col-span-2">
            <Label className="text-sm font-medium mb-2 block">
              Cast (Press Enter to add)
            </Label>
            <div className="border rounded-md p-3 bg-background">
              <TagsInput
                tags={movieData.cast || []}
                setTags={(tags) => updateMovieData({ cast: tags })}
                lock={[]}
              />
            </div>
          </div>

          {/* Email Producer Tags */}
          <div className="md:col-span-2">
            <Label className="text-sm font-medium mb-2 block">
              Email Producer (Press Enter to add)
            </Label>
            <div className="border rounded-md p-3 bg-background">
              <TagsInput
                tags={movieData.emailProducer || []}
                setTags={(tags) => updateMovieData({ emailProducer: tags })}
                lock={[]}
              />
            </div>
          </div>

          {/* Synopsis */}
          <div className="md:col-span-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Synopsis</Label>
              <textarea
                placeholder="Enter a brief summary of the movie plot..."
                value={movieData.synopsis || ""}
                onChange={(e) => updateMovieData({ synopsis: e.target.value })}
                className="min-h-[120px] w-full px-3 py-2 border rounded-md text-sm resize-y"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
