"use client";

import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthentication } from "contexts/authentication-context";
import { CheckCircle, Copy, Download } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import QRCode from "react-qr-code";

export const tableQRCode = createDialog<{ tableId: string }>(
  ({ tableId }) => {
    const qrRef = useRef<HTMLDivElement | null>(null);
    const { currentWarehouse } = useAuthentication();
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();
    const link = `${location.protocol}//${location.host}/menu?warehouse=${currentWarehouse?.id}&table=${tableId}`;

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
      <>
        <DialogHeader>
          <DialogTitle>Table QR Code</DialogTitle>
        </DialogHeader>
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
      </>
    );
  },
  { defaultValue: undefined }
);
