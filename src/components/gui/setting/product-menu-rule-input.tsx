"use client";

import { useUploadFileMinIO } from "@/app/hooks/use-upload-file";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthentication } from "contexts/authentication-context";
import {
  CheckCircle,
  Copy,
  Download,
  Image as ImageIcon,
  QrCode,
  Settings,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import QRCode from "react-qr-code";

interface Props {
  value: string;
  onChangeValue: (v: string) => void;
}

export function ProductMenuRuleInput(props: Props) {
  const qrRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentWarehouse } = useAuthentication();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { trigger: uploadFile, isMutating: isUploading } = useUploadFileMinIO();

  const parseValue = useCallback((value: string) => {
    const parts = value ? JSON.parse(value) : null;
    return {
      onlyForSale: Boolean(parts?.onlyForSale) || false,
      onlyInStock: Boolean(parts?.onlyInStock) || false,
      bannerUrl: (parts?.bannerUrl as string) || "",
    };
  }, []);

  const currentValue = parseValue(props.value || "");
  const link = `${location.protocol}//${location.host}/menu?warehouse=${currentWarehouse?.id}`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Menu link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  }, [link, toast]);

  const handleRuleChange = useCallback(
    (key: string, checked: boolean) => {
      props.onChangeValue(
        JSON.stringify({
          ...currentValue,
          [key]: checked,
        }),
      );
    },
    [currentValue, props],
  );

  const handleBannerUpload = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Banner image must be less than 5MB.",
          variant: "destructive",
        });
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      props.onChangeValue(
        JSON.stringify({ ...currentValue, bannerUrl: previewUrl }),
      );

      uploadFile({ file })
        .then(({ url }) => {
          URL.revokeObjectURL(previewUrl);
          props.onChangeValue(
            JSON.stringify({ ...currentValue, bannerUrl: url }),
          );
          toast({ title: "Banner uploaded successfully." });
        })
        .catch((e) => {
          URL.revokeObjectURL(previewUrl);
          props.onChangeValue(
            JSON.stringify({ ...currentValue, bannerUrl: "" }),
          );
          toast({
            title: "Upload failed",
            description: e.message ?? "Failed to upload banner",
            variant: "destructive",
          });
        });
    },
    [currentValue, props, toast, uploadFile],
  );

  const handleRemoveBanner = useCallback(() => {
    props.onChangeValue(JSON.stringify({ ...currentValue, bannerUrl: "" }));
  }, [currentValue, props]);

  const handleDownload = useCallback(() => {
    const svg = qrRef.current?.querySelector("svg");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
        const pngFile = canvas.toDataURL("image/png");

        const downloadLink = document.createElement("a");
        downloadLink.href = pngFile;
        downloadLink.download = "qrcode.png";
        downloadLink.click();
      };

      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Banner Image Section */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <ImageIcon className="h-5 w-5 text-primary" />
            Menu Banner
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentValue.bannerUrl ? (
            <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-xl border border-border">
              <ImageWithFallback
                src={currentValue.bannerUrl}
                alt="Menu Banner"
                title="Menu Banner"
                className="w-24 h-16 object-cover rounded-lg border bg-white flex-shrink-0"
                width={96}
                height={64}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground mb-0.5">
                  {isUploading ? "Uploading…" : "Banner uploaded"}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-48">
                  {currentValue.bannerUrl.startsWith("blob:")
                    ? "Processing…"
                    : currentValue.bannerUrl.split("/").pop()}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveBanner}
                disabled={isUploading}
                className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div
              className={`relative flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30 bg-muted/10"
              } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) handleBannerUpload(files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {isUploading
                    ? "Uploading…"
                    : "Click or drag to upload banner"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  PNG, JPG, GIF up to 5 MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBannerUpload(file);
                  e.target.value = "";
                }}
                className="sr-only"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Section */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <QrCode className="h-5 w-5 text-primary" />
            Menu QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div
              className="bg-white p-4 rounded-lg border border-border/30 shadow-sm"
              ref={qrRef}
            >
              <QRCode
                value={link}
                size={176}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Menu Link
                </Label>
                <div className="mt-1 p-3 bg-muted/50 rounded-md border text-sm font-mono break-all">
                  {link}
                </div>
              </div>
              <div className="flex flex-row gap-2">
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                  className="w-full md:w-auto"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="w-full md:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Rules Section */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Settings className="h-5 w-5 text-primary" />
            Menu Display Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border/30 hover:border-border/60 transition-colors">
              <Checkbox
                id="onlyForSale"
                checked={currentValue.onlyForSale}
                onCheckedChange={(checked) =>
                  handleRuleChange("onlyForSale", Boolean(checked))
                }
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label
                  htmlFor="onlyForSale"
                  className="text-sm font-medium cursor-pointer leading-relaxed"
                >
                  Show only products available for sale
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Hide products that are not marked as available for sale
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-border/30 hover:border-border/60 transition-colors">
              <Checkbox
                id="onlyInStock"
                checked={currentValue.onlyInStock}
                onCheckedChange={(checked) =>
                  handleRuleChange("onlyInStock", Boolean(checked))
                }
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label
                  htmlFor="onlyInStock"
                  className="text-sm font-medium cursor-pointer leading-relaxed"
                >
                  Show only products in stock
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Hide products that are currently out of stock
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
