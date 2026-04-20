import { useMutationUpdateStatusReservation } from "@/app/hooks/cinema/use-query-reservation";
import { createDialog } from "@/components/create-dialog";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { QrCode, X } from "lucide-react";

interface Props {
  showtimeId: string;
}

export const scanTicketDialog = createDialog<Props, unknown>(
  ({ close, showtimeId }) => {
    const [scanInput, setScanInput] = useState("");
    const [showScanner, setShowScanner] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const { trigger: updateStatusReservation, isMutating: isUpdating } =
      useMutationUpdateStatusReservation(showtimeId);

    // Check if device is mobile
    useEffect(() => {
      const checkMobile = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = [
          "mobile",
          "android",
          "iphone",
          "ipad",
          "tablet",
        ];
        const isMobileDevice = mobileKeywords.some((keyword) =>
          userAgent.includes(keyword),
        );
        const isSmallScreen = window.innerWidth <= 768;
        setIsMobile(isMobileDevice || isSmallScreen);
      };

      checkMobile();
      window.addEventListener("resize", checkMobile);

      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleScan = (detectedCodes: IDetectedBarcode[]) => {
      console.log("Detected codes:", detectedCodes);
      detectedCodes.forEach((code) => {
        console.log(`Format: ${code.format}, Value: ${code.rawValue}`);
        if (code.format === "qr_code") {
          setScanInput(code.rawValue);
          setShowScanner(false);
          handleSubmit(code.rawValue);
        }
      });
    };

    const handleSubmit = (code?: string) => {
      const ticketCode = code || scanInput.trim();

      if (!ticketCode) {
        toast.error("Please enter or scan a ticket code");
        return;
      }

      updateStatusReservation({
        status: "admitted",
        code: ticketCode,
      })
        .then((res) => {
          if (res.success) {
            toast.success("Ticket admitted successfully");
            close(true);
          } else {
            toast.error("Failed to admit ticket: " + res.error);
          }
        })
        .catch(() => {
          toast.error("An error occurred while admitting the ticket");
        });
    };

    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan Ticket
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Manual Input Section */}
          <div className="space-y-3">
            <Label htmlFor="ticket-code" className="text-sm font-medium">
              Ticket Code
            </Label>
            <div className="space-y-3">
              <Input
                id="ticket-code"
                type="text"
                placeholder="Enter or paste ticket code..."
                className="w-full"
                autoComplete="off"
                value={scanInput}
                disabled={isUpdating}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isUpdating) {
                    handleSubmit();
                  }
                }}
              />

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSubmit()}
                  disabled={isUpdating || !scanInput.trim()}
                  className="flex-1"
                >
                  {isUpdating ? "Processing..." : "Submit Ticket"}
                </Button>

                {/* Scanner Toggle Button - Only on Mobile */}
                {isMobile && (
                  <Button
                    variant="outline"
                    onClick={() => setShowScanner(!showScanner)}
                    disabled={isUpdating}
                    className="px-4"
                  >
                    {showScanner ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <QrCode className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Scanner Section - Only on Mobile */}
          {isMobile && showScanner && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Camera Scanner</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowScanner(false)}
                  className="h-auto p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="rounded-lg border overflow-hidden bg-black">
                <Scanner
                  onScan={handleScan}
                  onError={(error) => {
                    console.error("Scanner error:", error);
                    toast.error(
                      "Camera access error. Please try manual input.",
                    );
                  }}
                  paused={isUpdating}
                  constraints={{
                    facingMode: "environment",
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                  }}
                  styles={{
                    container: {
                      width: "100%",
                      maxHeight: "300px",
                    },
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Point your camera at the QR code
              </p>
            </div>
          )}

          {/* Desktop Note */}
          {!isMobile && (
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                📱 Camera scanning is available on mobile devices only
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please enter the ticket code manually or switch to a mobile
                device
              </p>
            </div>
          )}
        </div>
      </>
    );
  },
  { defaultValue: null },
);
