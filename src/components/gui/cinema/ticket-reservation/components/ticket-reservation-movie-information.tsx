/* eslint-disable @next/next/no-img-element */
"use client";

import { Badge } from "@/components/ui/badge";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import moment from "moment-timezone";

interface Props {
  variant?: ProductVariantType;
}

export function TicketReservationMovieInformation(props: Props) {
  if (!props.variant) return null;

  return (
    <div>
      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Movie Poster */}
          <div className="flex-shrink-0 mx-auto lg:mx-0">
            <div className="w-48 h-72 bg-slate-200 rounded-lg overflow-hidden shadow-md">
              {props.variant.movie?.posterUrl ? (
                <img
                  src={props.variant.movie.posterUrl}
                  alt={props.variant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-200">
                  <span className="text-slate-500 text-sm">No Poster</span>
                </div>
              )}
            </div>
          </div>

          {/* Movie Details */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-2">
                {props.variant.basicProduct?.title}
              </h2>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="secondary" className="text-xs">
                  {props.variant.movie?.rating || "Not Rated"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {props.variant.movie?.durationMinutes || 0} min
                </Badge>
                {props.variant.movie?.genre &&
                  (Array.isArray(props.variant.movie.genre)
                    ? props.variant.movie.genre
                    : JSON.parse(props.variant.movie.genre)
                  ).map((genre: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
              </div>
              <div className="text-sm text-slate-600 mb-2">
                <strong>Release Date:</strong>{" "}
                {moment(props.variant.movie?.releaseDate).format(
                  "MMMM DD, YYYY"
                )}
              </div>
              {props.variant.movie?.director && (
                <div className="text-sm text-slate-600 mb-2">
                  <strong>Director:</strong> {props.variant.movie.director}
                </div>
              )}
              {props.variant.movie?.cast && (
                <div className="text-sm text-slate-600 mb-3">
                  <strong>Cast:</strong>{" "}
                  {Array.isArray(props.variant.movie.cast)
                    ? props.variant.movie.cast.join(", ")
                    : JSON.parse(props.variant.movie.cast).join(", ")}
                </div>
              )}
            </div>

            {props.variant.movie?.synopsis && (
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Synopsis
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {props.variant.movie.synopsis}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
