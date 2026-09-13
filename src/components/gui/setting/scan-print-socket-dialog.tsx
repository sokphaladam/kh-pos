"use client";

import { useState } from "react";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { QrCode } from "lucide-react";
import { toast } from "sonner";

import { createDialog } from "@/components/create-dialog";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidPrintSocketUrl } from "@/lib/print-socket-url";

/**
 * Scans the QR code shown on the print bridge app's "Device Connection"
 * card, which encodes the exact print-server URL (optionally with
 * `?token=`). Resolves with a validated ws:// / wss:// URL, or null if
 * cancelled.
 */
export const scanPrintSocketDialog = createDialog<
  Record<string, never>,
  string | null
>(
  ({ close }) => {
    const [manual, setManual] = useState("");
    const [error, setError] = useState<string | null>(null);

    const accept = (raw: string) => {
      const value = raw.trim();
      if (!isValidPrintSocketUrl(value)) {
        setError("That QR code is not a ws:// or wss:// print-server URL");
        return;
      }
      close(value);
    };

    const handleScan = (codes: IDetectedBarcode[]) => {
      const hit = codes.find((c) => c.rawValue?.trim());
      if (hit) accept(hit.rawValue);
    };

    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan print server QR
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Open the print app on the printer PC and point the camera at the QR
            code on its <span className="font-medium">Device Connection</span>{" "}
            card.
          </p>

          <div className="overflow-hidden rounded-lg border bg-black">
            <Scanner
              onScan={handleScan}
              onError={(err) => {
                console.error("QR scanner error:", err);
                toast.error("Could not access the camera on this device");
              }}
              constraints={{
                facingMode: "environment",
                width: { ideal: 640 },
                height: { ideal: 480 },
              }}
              styles={{ container: { width: "100%", maxHeight: "300px" } }}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              No camera? Paste the URL shown on the print app instead:
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                value={manual}
                onChange={(e) => {
                  setManual(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && manual.trim()) accept(manual);
                }}
                placeholder="ws://192.168.1.20:8181/?token=SHOP-1234"
              />
              <Button
                size="sm"
                onClick={() => accept(manual)}
                disabled={!manual.trim()}
              >
                Use
              </Button>
            </div>
          </div>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => close(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </>
    );
  },
  { defaultValue: null },
);
