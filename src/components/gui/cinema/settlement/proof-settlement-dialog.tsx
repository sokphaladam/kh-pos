import { useMutationSetSettlement } from "@/app/hooks/cinema/use-query-settlement";
import { useUploadFile } from "@/app/hooks/use-upload-file";
import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, FileText, LoaderIcon, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  settlementId: string;
}

export const proofSettlementDialog = createDialog<Props, unknown>(
  ({ settlementId, close }) => {
    const { trigger: setSettlementTrigger, isMutating: isSetSettling } =
      useMutationSetSettlement();
    const { trigger: uploadFile, isMutating: isUploading } = useUploadFile();

    const [proofUrl, setProofUrl] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = [
          "image/jpeg",
          "image/png",
          "image/jpg",
          "image/webp",
          "application/pdf",
        ];
        if (!validTypes.includes(file.type)) {
          toast.error("Please upload an image (JPG, PNG, WEBP) or PDF file");
          return;
        }

        // Validate file size (10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error("File size must be less than 10MB");
          return;
        }

        // Create preview for images
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          setPreview(null);
        }

        try {
          const result = await uploadFile({ file });
          if (result?.url) {
            setProofUrl(result.url);
            toast.success("File uploaded successfully");
          }
        } catch {
          toast.error("Failed to upload file");
          setPreview(null);
        }
      },
      [uploadFile],
    );

    const handleRemoveFile = useCallback(() => {
      setProofUrl(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }, []);

    const handleSubmit = useCallback(async () => {
      if (!proofUrl) {
        toast.error("Please upload a proof document");
        return;
      }

      try {
        const result = await setSettlementTrigger({
          settlementId,
          proofLink: proofUrl,
        });

        if (result?.success) {
          toast.success("Settlement proof uploaded successfully");
          close(result.result);
        } else {
          toast.error(result?.error || "Failed to update settlement");
        }
      } catch {
        toast.error("Failed to update settlement");
      }
    }, [proofUrl, settlementId, setSettlementTrigger, close]);

    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Settlement Proof
          </DialogTitle>
          <DialogDescription>
            Upload proof of payment or settlement document (Image or PDF, max
            10MB)
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proof" className="text-sm font-medium">
              Proof Document
            </Label>

            {!proofUrl ? (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="font-medium text-primary">
                      Click to upload
                    </span>
                    {" or drag and drop"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, WEBP or PDF (max 10MB)
                  </p>
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            ) : (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">
                      File uploaded successfully
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {preview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-muted">
                    <Image
                      src={preview}
                      alt="Proof preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => window.open(proofUrl, "_blank")}
                >
                  <FileText className="h-4 w-4" />
                  View Uploaded File
                </Button>
              </div>
            )}
          </div>

          {isUploading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <LoaderIcon className="h-4 w-4 animate-spin" />
              Uploading file...
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSetSettling || !proofUrl || isUploading}
            className="gap-2"
          >
            {isSetSettling && <LoaderIcon className="h-4 w-4 animate-spin" />}
            Submit Proof
          </Button>
        </DialogFooter>
      </>
    );
  },
  { defaultValue: null },
);
