"use client";

import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ImageViewer from "@/components/image-viewer";
import { useUploadFileMinIO } from "@/app/hooks/use-upload-file";

interface FileUploadProps {
  type: "image" | "video";
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  maxSize: number;
  accept: string;
  label: string;
  disabled?: boolean;
  className?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

export function FileUpload({
  type,
  value,
  onChange,
  maxSize,
  accept,
  label,
  disabled = false,
  className,
}: FileUploadProps) {
  const { trigger } = useUploadFileMinIO();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);

  const validateAndUpload = useCallback(
    async (file: File) => {
      // Validate file type
      const isValidType =
        type === "image"
          ? file.type.startsWith("image/")
          : file.type.startsWith("video/");

      if (!isValidType) {
        toast.error(
          `Invalid file type. Please upload ${
            type === "image" ? "an image" : "a video"
          } file.`,
        );
        return;
      }

      // Check file size
      if (file.size > maxSize) {
        toast.error(
          `File is too large (${formatFileSize(
            file.size,
          )}). Maximum size is ${formatFileSize(maxSize)}.`,
        );
        return;
      }

      // Show warning for large video files
      if (type === "video" && file.size > 50 * 1024 * 1024) {
        toast.info(
          `Large file detected (${formatFileSize(
            file.size,
          )}). Upload may take some time.`,
        );
      }

      // Create preview immediately
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setIsUploading(true);

      try {
        const result = await trigger({ file });
        if (result?.url) {
          URL.revokeObjectURL(previewUrl);
          onChange(result.url);
          setPreview(null);
          toast.success(`${label} uploaded successfully!`);
        } else {
          throw new Error("Upload failed");
        }
      } catch (error: unknown) {
        URL.revokeObjectURL(previewUrl);
        setPreview(null);
        // Reset file input to allow re-upload
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Show more specific error message
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        if (errorMessage.includes("CORS") || errorMessage.includes("fetch")) {
          toast.error(
            `Network error: Unable to upload ${label.toLowerCase()}. Please check your connection and try again.`,
          );
        } else {
          toast.error(
            `Failed to upload ${label.toLowerCase()}. ${errorMessage}`,
          );
        }
      } finally {
        setIsUploading(false);
      }
    },
    [type, maxSize, trigger, onChange, label],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
    // Reset input after reading file to allow re-upload of same file
    e.target.value = "";
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndUpload(file);
    }
  };

  const currentUrl = preview || value;
  const hasFile = !!currentUrl;

  const acceptFileType = useMemo(() => {
    if (type === "image") {
      return ".webp, .png, .jpg, .jpeg";
    } else if (type === "video") {
      return ".mp4, .mov, .webm";
    }
    return "";
  }, [type]);

  return (
    <div className={cn("w-full", className)}>
      {hasFile ? (
        // Show preview when file exists
        <div className="relative group h-full">
          {type === "image" ? (
            <div
              className="relative w-full h-full rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-primary transition-colors"
              onClick={() =>
                !isUploading && !disabled && setShowImageViewer(true)
              }
              title="Click to view full size"
            >
              <Image
                src={currentUrl}
                alt={`${label} preview`}
                fill
                className="object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="relative h-full">
              <video
                src={currentUrl}
                controls
                className="w-full h-full rounded-lg border-2 border-gray-200 bg-black"
              >
                Your browser does not support the video tag.
              </video>
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg">
                  <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
                  <p className="text-white text-sm">Uploading...</p>
                </div>
              )}
            </div>
          )}

          {/* Remove button */}
          {!isUploading && !disabled && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        // Show upload button when no file
        <div
          className={`h-full border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
            isDragging
              ? "border-primary bg-primary/10 scale-105"
              : "hover:border-primary hover:bg-gray-50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            {isDragging ? `Drop ${type} here` : `Upload ${label.toLowerCase()}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {accept} (max {formatFileSize(maxSize)})
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptFileType}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {/* Image Viewer */}
      {type === "image" && currentUrl && (
        <ImageViewer
          images={[currentUrl]}
          initialIndex={0}
          open={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          alt={label}
          showThumbnails={false}
          enableRotation={true}
        />
      )}
    </div>
  );
}
