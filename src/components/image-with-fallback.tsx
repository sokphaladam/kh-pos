/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackClassName?: string;
  title?: string;
}

export function ImageWithFallback({
  src,
  alt,
  width = 300,
  height = 200,
  className,
  fallbackClassName,
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const hasImage = src && !error;

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200/50 shadow-sm"
      style={{ width, height }}
    >
      {hasImage ? (
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className={cn(
            "max-w-full max-h-full object-contain transition-all duration-300 hover:scale-105",
            className
          )}
          onError={() => setError(true)}
          style={{
            width: "auto",
            height: "auto",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        />
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center text-muted-foreground w-full h-full transition-all duration-200",
            fallbackClassName
          )}
          aria-label={alt}
        >
          <Package
            className="w-6 h-6 mb-2 opacity-40 text-gray-400"
            strokeWidth={1.5}
          />
        </div>
      )}
    </div>
  );
}
