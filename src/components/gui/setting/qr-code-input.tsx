import { useUploadFile } from "@/app/hooks/use-upload-file";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface Props {
  qrCodePreview: string | null;
  setQrCodePreview: (qrCodePreview: string | null) => void;
  disabled?: boolean;
}

export function QrCodeInput({
  qrCodePreview,
  setQrCodePreview,
  disabled = false,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { trigger, isMutating: isUploading } = useUploadFile();

  const handleQrCodeUpload = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file.",
          variant: "destructive",
        });
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "QR code image must be less than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Create preview URL immediately for better UX
      const previewUrl = URL.createObjectURL(file);
      setQrCodePreview(previewUrl);

      trigger({ file })
        .then(({ url }) => {
          // Clean up the preview URL
          URL.revokeObjectURL(previewUrl);
          // Set the actual uploaded URL
          setQrCodePreview(url);
          toast({
            title: "Success",
            description: "QR code image uploaded successfully.",
          });
        })
        .catch((e) => {
          // Clean up the preview URL on error
          URL.revokeObjectURL(previewUrl);
          // Revert to previous state
          setQrCodePreview(null);
          toast({
            title: "Upload failed",
            description: e.message ?? "Failed to upload image",
            variant: "destructive",
          });
        });
    },
    [trigger, setQrCodePreview]
  );

  const removeQrCode = () => {
    setQrCodePreview(null);
  };

  return (
    <div className="space-y-4">
      {/* QR Code Display or Upload Area */}
      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border">
        {qrCodePreview ? (
          // Show image when available
          <>
            <ImageWithFallback
              src={qrCodePreview}
              alt="QR Code Preview"
              title="QR Code Preview"
              className="w-16 h-16 object-contain rounded border bg-white"
              width={64}
              height={64}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 mb-1">
                Current QR Code
              </p>
              <p className="text-xs text-gray-500 truncate">{qrCodePreview}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeQrCode}
                disabled={disabled}
                className="h-6 px-2 mt-2 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
          </>
        ) : (
          // Show upload button when no image
          <>
            <div
              className={`w-16 h-16 flex items-center justify-center border-2 border-dashed rounded transition-colors ${
                disabled
                  ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
                  : isDragging
                  ? "border-blue-400 bg-blue-50 cursor-pointer"
                  : "border-gray-300 hover:border-gray-400 bg-white cursor-pointer"
              } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
              onDragOver={(e) => {
                if (disabled) return;
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => {
                if (disabled) return;
                setIsDragging(false);
              }}
              onDrop={(e) => {
                if (disabled) return;
                e.preventDefault();
                setIsDragging(false);
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                  handleQrCodeUpload(files[0]);
                }
              }}
              onClick={() => !disabled && fileInputRef.current?.click()}
            >
              <Upload className="h-6 w-6 text-gray-400" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (disabled) return;
                  const file = e.target.files?.[0];
                  if (file) {
                    handleQrCodeUpload(file);
                  }
                }}
                className="sr-only"
                disabled={disabled}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 mb-1">
                Upload QR Code Image
              </p>
              <p className="text-xs text-gray-500">
                {isUploading
                  ? "Uploading..."
                  : "Drag and drop an image or click the upload button"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
